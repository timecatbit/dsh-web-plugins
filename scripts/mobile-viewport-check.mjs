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
    viewport: { width: 390, height: 654 },
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"><header>Conversation header</header><main data-conversation-scroll style="overflow:auto;min-height:0;flex:1"><div style="height:1800px">Saved conversation</div></main><footer data-composer-seat data-composer-card><div contenteditable="true" style="min-height:60px">An unsent draft</div></footer></div>')
  await page.addStyleTag({ content: css + '\n#root{display:flex;flex-direction:column}#root>header{height:50px;flex:none}' })
  await page.evaluate(source + `
    const testViewport = Object.assign(new EventTarget(), { height: 654, offsetTop: 0, scale: 1 });
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
  // Model the native document pan independently of the plugin's fixed top.
  // iOS restores that pan before the next animation frame on dismissal.
  const dispatch = (height, offsetTop, pan, scale = 1, event = "resize") =>
    page.evaluate(({ height, offsetTop, pan, scale, event }) => {
      const root = document.getElementById('root')
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
      root.style.translate = '0 ' + (-pan) + 'px'
      Object.assign(window.testViewport, { height, offsetTop, scale })
      const before = root.getBoundingClientRect().top
      window.testViewport.dispatchEvent(new Event(event))
      return { before, after: root.getBoundingClientRect().top, height: root.getBoundingClientRect().height }
    }, { height, offsetTop, pan, scale, event })
  const editor = page.locator('[contenteditable]')
  await editor.tap()
  await editor.press('End')
  await page.keyboard.insertText(' preserved')
  await page.evaluate(() => { document.querySelector('[data-conversation-scroll]').scrollTop = 360 })
  await frame()
  const before = await metrics()
  assert.ok(before.scroll > 100)
  for (let cycle = 0; cycle < 4; cycle++) {
    await editor.evaluate(el => el.focus({ preventScroll: true }))
    const opening = await dispatch(324, 330, 330)
    assert.equal(opening.before, -330)
    assert.equal(opening.after, 0, 'the keyboard pan is compensated in the opening event')
    assert.equal(opening.height, 324)
    const pan = await dispatch(324, 300, 300, 1, 'scroll')
    assert.equal(pan.before, 30)
    assert.equal(pan.after, 0, 'an offset-only change is applied immediately')
    if (cycle % 2 === 0) {
      await editor.evaluate(el => el.blur())
      // The phone's blur precedes its first native resize by about 65 ms.
      await page.waitForTimeout(65)
      assert.equal((await metrics()).height, 324, 'blur must not predict a new height')
    }
    for (const [height, offset, nativePan] of [
      [420, 234, 234], [520, 134, 134], [654, 330, 0],
    ]) {
      const closing = await dispatch(height, offset, nativePan)
      assert.equal(closing.after, 0, 'native resize must not render the old top')
      assert.equal(closing.height, height, 'apply each native height in the same event')
      assert.equal(await page.locator('#root').evaluate(root => root.getAnimations().length), 0)
    }
    await frame()
    const m = await metrics()
    assert.equal(m.top, 0)
    assert.equal(m.height, 654)
    assert.equal(m.keyboard, false)
    assert.equal(m.draft, before.draft)
    assert.equal(m.scroll, before.scroll)
  }
  // The keyboard isn't open when a toolbar or pinch zoom changes the viewport.
  await dispatch(600, 54, 0)
  await frame()
  assert.equal((await metrics()).keyboard, false)
  await dispatch(324, 330, 0, 1.5)
  await frame()
  assert.equal((await metrics()).property, '')
  await dispatch(654, 0, 0)
  await frame()
  // A delayed final sample is still covered by the settling check.
  await editor.evaluate(el => el.focus({ preventScroll: true }))
  await dispatch(324, 330, 330)
  await frame()
  await page.evaluate(() => {
    window.testViewport.dispatchEvent(new Event('resize'))
    setTimeout(() => {
      Object.assign(window.testViewport, { height: 654, offsetTop: 0 })
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 654 })
      document.getElementById('root').style.translate = ''
    }, 60)
  })
  await page.waitForTimeout(230)
  await frame()
  assert.equal((await metrics()).top, 0)
  assert.equal((await metrics()).height, 654)
  await page.evaluate(() => window.stopViewport())
  assert.equal((await metrics()).property, '')
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-dsh-phone')
    window.stopViewport = installPhoneViewport(matchMedia('(min-width:1000px)'))
  })
  await dispatch(324, 330, 0)
  await frame()
  assert.equal((await metrics()).property, '', 'desktop leaves viewport sizing to the host')
  await page.evaluate(() => window.stopViewport())
  console.log(engine + ': opening and each closing height follow the native event without an animation; draft/scroll retention passed')
} finally {
  await browser.close()
}
