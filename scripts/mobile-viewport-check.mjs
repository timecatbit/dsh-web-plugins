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
  const layout = () => page.evaluate(() => {
    const root = document.getElementById('root')
    const r = root.getBoundingClientRect()
    return {
      top: r.top, height: r.height, keyboard: document.documentElement.hasAttribute('data-dsh-phone-keyboard'),
      scroll: document.querySelector('[data-conversation-scroll]').scrollTop,
      draft: document.querySelector('[contenteditable]').textContent,
      property: document.documentElement.style.getPropertyValue('--dsh-phone-height'),
    }
  })
  const play = async (stages) => page.evaluate(async stages => {
    const frames = []
    for (const { height, top, scale = 1, count = 1 } of stages) {
      Object.assign(window.testViewport, { height, offsetTop: top, scale })
      window.testViewport.dispatchEvent(new Event('resize'))
      for (let i = 0; i < count; i++) {
        await new Promise(resolve => requestAnimationFrame(resolve))
        const rect = document.getElementById('root').getBoundingClientRect()
        frames.push({ top: rect.top, height: rect.height })
      }
    }
    return frames
  }, stages)
  const heightIs = (height) => page.waitForFunction(height =>
    Math.round(document.getElementById('root').getBoundingClientRect().height) === height, height)
  const editor = page.locator('[contenteditable]')
  await editor.tap()
  await editor.press('End')
  await page.keyboard.insertText(' preserved')
  await page.evaluate(() => { document.querySelector('[data-conversation-scroll]').scrollTop = 360 })
  const before = await layout()
  assert.ok(before.scroll > 100)
  assert.match(before.draft, /preserved/)
  for (let cycle = 0; cycle < 6; cycle++) {
    await editor.evaluate(el => el.focus({ preventScroll: true }))
    const opening = await play([
      { height: 530, top: 170 }, // A short, premature keyboard sample.
      { height: 844, top: 394 },
      { height: 450, top: 170, count: 1 },
    ])
    assert.ok(opening.every(x => x.top === 0 && x.height === 844), JSON.stringify(opening))
    await heightIs(450)
    let m = await layout()
    assert.equal(m.keyboard, true)
    assert.equal(m.top, 0)
    // The keyboard can be dismissed by the OS with focus still on the editor.
    if (cycle % 2 === 0) await editor.evaluate(el => el.blur())
    const closing = await play([
      { height: 844, top: 394 }, // A one-frame full-height report while the keyboard is still up.
      { height: 450, top: 170 },
      { height: 844, top: 394 },
    ])
    assert.ok(closing.every(x => x.top === 0 && x.height === 450), JSON.stringify(closing))
    await heightIs(844)
    m = await layout()
    assert.equal(m.top, 0)
    assert.equal(m.keyboard, false)
    assert.equal(m.draft, before.draft)
    assert.equal(m.scroll, before.scroll)
  }
  // A toolbar change with the editor focused is left to the browser's CSS viewport.
  await play([{ height: 790, top: 54, count: 5 }])
  let m = await layout()
  assert.equal(m.keyboard, false)
  assert.equal(m.property, '')
  await editor.evaluate(el => el.focus({ preventScroll: true }))
  await play([{ height: 450, top: 700 }])
  await heightIs(450)
  assert.equal((await layout()).top, 0)
  // Pinch zoom must not be forced back into an unscaled viewport.
  await play([{ height: 350, top: 120, scale: 1.5 }])
  m = await layout()
  assert.equal(m.property, '')
  assert.equal(m.keyboard, false)
  await play([{ height: 450, top: 170 }])
  await heightIs(450)
  // The final resize event can fire before the final geometry is readable.
  await page.evaluate(() => {
    window.testViewport.dispatchEvent(new Event('resize'))
    setTimeout(() => Object.assign(window.testViewport, { height: 844, offsetTop: 394 }), 60)
  })
  await heightIs(844)
  m = await layout()
  assert.equal(m.top, 0)
  await page.evaluate(() => window.stopViewport())
  assert.equal((await layout()).property, '')
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-dsh-phone')
    window.stopViewport = installPhoneViewport(matchMedia('(min-width:1000px)'))
  })
  await play([{ height: 450, top: 200, count: 5 }])
  assert.equal((await layout()).property, '', 'desktop leaves viewport sizing to the host')
  await page.evaluate(() => window.stopViewport())
  console.log(engine + ': opening and closing frames stay anchored; transient heights, draft/scroll retention, toolbar, zoom, late event and teardown passed')
} finally {
  await browser.close()
}
