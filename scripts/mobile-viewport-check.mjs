import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium, webkit, devices } = require(process.env.DSH_TEST_PLAYWRIGHT || 'playwright')
const engine = process.env.DSH_TEST_BROWSER || 'webkit'
assert.ok(['chromium', 'webkit'].includes(engine))
const source = await readFile(new URL('../plugins/mobile-layout/dsh-phone-layout.js', import.meta.url), 'utf8')
const css = await readFile(new URL('../plugins/mobile-layout/dsh-phone-layout.css', import.meta.url), 'utf8')
const options = engine === 'chromium'
  ? { channel: process.env.DSH_TEST_CHROME_CHANNEL || 'chrome' }
  : process.env.DSH_TEST_WEBKIT_EXECUTABLE ? { executablePath: process.env.DSH_TEST_WEBKIT_EXECUTABLE } : {}
const browser = await { chromium, webkit }[engine].launch(options)
try {
  const page = await browser.newPage({
    ...devices[engine === 'webkit' ? 'iPhone 15' : 'Pixel 7'],
    viewport: { width: 390, height: 844 },
  })
  await page.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"><header>Conversation header</header><main data-conversation-scroll style="overflow:auto;min-height:0;flex:1"><div style="height:1800px">Saved conversation</div></main><footer data-composer-card><div contenteditable="true" style="min-height:60px">An unsent draft</div></footer></div>')
  await page.addStyleTag({ content: css + '\n#root{display:flex;flex-direction:column}#root>header{height:50px;flex:none}' })
  await page.evaluate(source + `
    const testViewport = Object.assign(new EventTarget(), { height: 844, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: testViewport });
    window.testViewport = testViewport;
    const media = matchMedia('(max-width:767px)');
    document.documentElement.toggleAttribute('data-dsh-phone', media.matches);
    window.stopViewport = installPhoneViewport(media);
  `)
  const frame = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const metrics = () => page.evaluate(() => {
    const root = document.getElementById('root')
    const r = root.getBoundingClientRect()
    return {
      top: r.top, height: r.height, keyboard: document.documentElement.hasAttribute('data-dsh-phone-keyboard'),
      scroll: document.querySelector('[data-conversation-scroll]').scrollTop,
      draft: document.querySelector('[contenteditable]').textContent,
      property: document.documentElement.style.getPropertyValue('--dsh-phone-height'),
    }
  })
  const change = async (values, type = 'resize') => {
    await page.evaluate(({ values, type }) => {
      Object.assign(window.testViewport, values)
      window.testViewport.dispatchEvent(new Event(type))
    }, { values, type })
    await frame()
    return metrics()
  }
  await page.locator('[contenteditable]').tap()
  await page.locator('[contenteditable]').press('End')
  await page.keyboard.insertText(' preserved')
  await page.evaluate(() => { document.querySelector('[data-conversation-scroll]').scrollTop = 360 })
  await frame()
  const before = await metrics()
  for (let cycle = 0; cycle < 6; cycle++) {
    await page.locator('[contenteditable]').evaluate(el => el.focus())
    let m = await change({ height: 450, offsetTop: 170, scale: 1 })
    assert.equal(m.keyboard, true)
    assert.equal(m.top, 170)
    assert.equal(m.height, 450)
    await page.locator('[contenteditable]').evaluate(el => el.blur())
    await frame()
    assert.equal((await metrics()).keyboard, true, 'blur must not expand the page before the keyboard closes')
    m = await change({ height: 844, offsetTop: 394 })
    assert.equal(m.top, 0, 'a stale iOS pan must not offset the restored page')
    assert.equal(m.keyboard, false)
    assert.equal(m.height, 844)
    assert.equal(m.draft, before.draft)
    assert.equal(m.scroll, before.scroll)
  }
  // A browser-toolbar change must not be mistaken for a keyboard.
  let m = await change({ height: 790, offsetTop: 54 })
  assert.equal(m.keyboard, false)
  assert.equal(m.top, 0)
  await page.locator('[contenteditable]').evaluate(el => el.focus())
  m = await change({ height: 450, offsetTop: 700 })
  assert.equal(m.top, 394, 'transient pan cannot exceed the occluded part of the layout viewport')
  // Pinch zoom must not be forced back into an unscaled fixed viewport.
  m = await change({ height: 350, offsetTop: 120, scale: 1.5 })
  assert.equal(m.property, '')
  assert.equal(m.keyboard, false)
  await change({ height: 844, offsetTop: 0, scale: 1 })
  // iOS may emit its final event before publishing the final geometry.
  await page.evaluate(() => {
    Object.assign(window.testViewport, { height: 450, offsetTop: 170 })
    window.testViewport.dispatchEvent(new Event('resize'))
    setTimeout(() => Object.assign(window.testViewport, { height: 844, offsetTop: 394 }), 60)
  })
  await page.waitForTimeout(230)
  await frame()
  m = await metrics()
  assert.equal(m.top, 0)
  assert.equal(m.height, 844, 'settling check must read the late final geometry')
  await page.evaluate(() => window.stopViewport())
  assert.equal((await metrics()).property, '')
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-dsh-phone')
    window.stopViewport = installPhoneViewport(matchMedia('(min-width:1000px)'))
  })
  await change({ height: 450, offsetTop: 200 })
  assert.equal((await metrics()).property, '', 'desktop leaves viewport sizing to the host')
  await page.evaluate(() => window.stopViewport())
  console.log(engine + ': keyboard cycles, stale pan, blur ordering, draft/scroll retention, toolbar, zoom, late event and teardown passed')
} finally {
  await browser.close()
}
