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
const fixture = '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<div id="root"><header>Conversation header</header>' +
  '<main data-conversation-scroll style="overflow:auto;min-height:0;flex:1"><div style="height:1800px">Saved conversation</div>' +
  '<footer data-composer-seat style="position:sticky;bottom:0"><div data-composer-card>' +
  '<div data-composer-overlay><input aria-label="Command search"></div>' +
  '<div contenteditable="true" style="min-height:60px">An unsent draft</div>' +
  '<button type="button">Send</button></div></footer></main></div>'
const browser = await { chromium, webkit }[engine].launch(options)
try {
  const page = await browser.newPage({
    ...devices[engine === 'webkit' ? 'iPhone 15' : 'Pixel 7'],
    viewport: { width: 390, height: 654 },
  })
  await page.setContent(fixture)
  await page.addStyleTag({ content: css + '\n#root{display:flex;flex-direction:column}#root>header{height:50px;flex:none}' })
  await page.evaluate(source + `
    const testViewport = Object.assign(new EventTarget(), { height: 654, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: testViewport });
    window.testViewport = testViewport;
    window.scrollCalls = [];
    window.scrollTo = (...args) => { window.scrollCalls.push(args); };
    window.testMedia = matchMedia('(max-width:767px)');
    document.documentElement.toggleAttribute('data-dsh-phone', window.testMedia.matches);
    window.stopViewport = installPhoneViewport(window.testMedia);
  `)
  const settle = () => page.waitForTimeout(300)
  const dispatch = (height, offsetTop, scale = 1, event = 'resize') =>
    page.evaluate(({ height, offsetTop, scale, event }) => {
      Object.assign(window.testViewport, { height, offsetTop, scale })
      window.testViewport.dispatchEvent(new Event(event))
    }, { height, offsetTop, scale, event })
  const metrics = () => page.evaluate(() => {
    const html = document.documentElement
    const root = document.getElementById('root').getBoundingClientRect()
    return {
      top: root.top, height: root.height,
      seatBottom: document.querySelector('[data-composer-seat]').getBoundingClientRect().bottom,
      keyboard: html.hasAttribute('data-dsh-phone-keyboard'),
      inline: html.getAttribute('style') || '',
      scroll: document.querySelector('[data-conversation-scroll]').scrollTop,
      draft: document.querySelector('[contenteditable]').textContent,
      animations: document.getAnimations().length,
      scrollCalls: window.scrollCalls.length,
    }
  })
  const assertAtRest = (m, message) => {
    assert.equal(m.top, 0, message)
    assert.equal(m.height, 654, message)
    // The native pan that reveals the editor also reveals the rest of the card.
    assert.equal(m.seatBottom, 654, message)
    assert.equal(m.keyboard, false, message)
    assert.equal(m.inline, '', message)
    assert.equal(m.animations, 0, message)
  }

  const editor = page.locator('[contenteditable]')
  await editor.tap()
  await editor.press('End')
  await page.keyboard.insertText(' preserved')
  await page.evaluate(() => { document.querySelector('[data-conversation-scroll]').scrollTop = 360 })
  const before = await metrics()
  assert.ok(before.scroll > 100)
  for (let cycle = 0; cycle < 3; cycle++) {
    await editor.evaluate(el => el.focus({ preventScroll: true }))
    // Chromium's mobile mode reveals a focused editor by itself, later.
    await settle()
    const focused = (await metrics()).scroll
    // Opening reports, a user pan while typing, then closing reports. None of
    // them may move or resize the app, which the native pan already carries.
    for (const [height, offset, event] of [[324, 330], [324, 300, 'scroll'], [324, 330, 'scroll']]) {
      await dispatch(height, offset, 1, event)
      assertAtRest(await metrics(), 'keyboard reports must not move the app')
    }
    await settle()
    assert.equal((await metrics()).scrollCalls, 0, 'never reset the pan while editing')
    assert.equal((await metrics()).scroll, focused, 'keyboard reports keep the transcript position')
    await editor.evaluate(el => el.blur())
    for (const [height, offset] of [[324, 330], [420, 234], [654, 0]]) {
      await dispatch(height, offset)
      assertAtRest(await metrics(), 'dismissal reports must not move the app')
    }
    await settle()
    const m = await metrics()
    assertAtRest(m, 'the app is unchanged after dismissal')
    assert.equal(m.scrollCalls, 0, 'nothing to reset once the native pan has returned')
    assert.equal(m.draft, before.draft)
    assert.equal(m.scroll, focused, 'dismissal keeps the transcript position')
  }

  // A pan left behind after dismissal is cleared once the viewport is quiet.
  await dispatch(654, 30)
  await dispatch(654, 30, 1, 'scroll')
  assert.equal((await metrics()).scrollCalls, 0, 'wait for the burst to finish')
  await settle()
  assert.deepEqual(await page.evaluate(() => window.scrollCalls), [[0, 0]])
  await page.evaluate(() => { window.scrollCalls.length = 0 })
  // Not while the keyboard still covers the page, the user is zoomed in, or
  // an editor has focus.
  await dispatch(324, 330)
  await settle()
  await dispatch(436, 120, 1.5)
  await settle()
  await editor.evaluate(el => el.focus({ preventScroll: true }))
  await dispatch(654, 30)
  await settle()
  assert.equal((await metrics()).scrollCalls, 0)
  await editor.evaluate(el => el.blur())
  await page.evaluate(() => window.stopViewport())
  await dispatch(654, 30)
  await settle()
  assert.equal((await metrics()).scrollCalls, 0, 'cleanup removes the listeners')
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-dsh-phone')
    window.stopViewport = installPhoneViewport(matchMedia('(min-width:1000px)'))
  })
  await dispatch(654, 30)
  await settle()
  assert.equal((await metrics()).scrollCalls, 0, 'desktop leaves the viewport to the host')
  await page.evaluate(() => window.stopViewport())

  // Composer focus: script focus needs a tap, except within an open composer.
  await page.evaluate(() => {
    document.documentElement.toggleAttribute('data-dsh-phone', window.testMedia.matches)
    window.stopFocus = installPhoneComposerFocus(window.testMedia)
  })
  const active = () => page.evaluate(() => document.activeElement?.getAttribute('aria-label') ??
    (document.activeElement?.isContentEditable ? 'editor' : document.activeElement?.tagName))
  await editor.evaluate(el => el.focus())
  assert.equal(await active(), 'BODY', 'a mount effect must not raise the keyboard')
  await page.locator('[aria-label="Command search"]').evaluate(el => el.focus())
  assert.equal(await active(), 'BODY', 'a popup opened by a toolbar tap must not raise the keyboard')
  await editor.tap()
  assert.equal(await active(), 'editor')
  await page.waitForTimeout(700) // past the tap's own focus allowance
  await page.locator('[aria-label="Command search"]').evaluate(el => el.focus())
  assert.equal(await active(), 'Command search', 'the popup search takes over an open keyboard')
  await editor.evaluate(el => el.focus())
  assert.equal(await active(), 'editor', 'closing the popup returns to the editor')
  await editor.evaluate(el => el.blur())
  await page.locator('[aria-label="Command search"]').tap()
  assert.equal(await active(), 'Command search', 'a tap on the search field still focuses it')
  await page.evaluate(() => window.stopFocus())

  // Composer readings form a status bar: equal cells, nothing truncated, and
  // the context percentage captioned from its own localized label.
  const pill = (stat, value, detail) => `<span data-composer-stat="${stat}"><button type="button" aria-haspopup="dialog"><svg width="14" height="14"></svg>` +
    `<span style="overflow:hidden;text-overflow:ellipsis">${value}<span aria-hidden="true">·</span>${detail}</span></button></span>`
  const dock = (entries, meter = '') => `<div class="host-dock" data-composer-dock>` +
    `<div data-slot="conversation.composer.dock" style="display:contents">${entries}</div>${meter}</div>`
  const status = await browser.newPage({ ...devices[engine === 'webkit' ? 'iPhone 15' : 'Pixel 7'], viewport: { width: 390, height: 654 } })
  await status.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root">' +
    '<div data-mobile-frame data-sidebar-collapsed data-rightbar-collapsed><div data-mobile-role="sidebar"></div><div data-mobile-role="center">' +
    '<div data-conversation-content><div data-composer-card class="host-card"><div contenteditable="true" style="width:60px;flex:none"></div>' +
    '<span style="width:42px;flex:none"></span>' +
    '<button type="button" class="host-model" aria-haspopup="menu"><span class="x_triggerLabel">DeepSeek V4.1 Flash</span></button>' +
    '<span style="width:36px;flex:none"></span></div>' +
    dock(pill('activity', '12 轮 34 步', '44 tok/s') + pill('usage', '8.3K tok', '缓存命中 98%'),
      '<span><button type="button" aria-haspopup="dialog" aria-label="上下文已用 1%"><svg width="14" height="14"></svg><span>1%</span></button></span>') +
    dock('') + '</div></div></div></div>')
  await status.addStyleTag({ content: '.host-dock{display:flex;justify-content:center;white-space:nowrap}' +
    '.host-card{container-type:inline-size;display:flex;gap:8px;height:80px;font-size:15px}' +
    '.host-model{display:flex;min-width:0;max-width:min(360px,45cqw);margin-left:auto;font:inherit}' +
    '.x_triggerLabel{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n' + css })
  await status.evaluate(`const MOBILE_QUERY$2 = '(max-width: 767px)';\n${source}\nwindow.stopLayout = installPhoneLayout({ toggleSidebar() {}, closeRightbar() {} })`)
  await status.waitForFunction(() => document.querySelector('[aria-label="上下文已用 1%"]')?.dataset.dshPhoneCaption)
  const bar = await status.evaluate(() => {
    const [full, empty] = document.querySelectorAll('[data-composer-dock]')
    const cells = [...full.querySelectorAll('button')].map(cell => cell.getBoundingClientRect())
    const model = document.querySelector('.x_triggerLabel')
    return {
      modelCut: model.scrollWidth > model.clientWidth + 1,
      widths: cells.map(r => Math.round(r.width)), heights: cells.map(r => r.height),
      clipped: [...full.querySelectorAll('button span')].some(span => span.scrollWidth > span.clientWidth + 1),
      caption: full.querySelector('[aria-label="上下文已用 1%"]').dataset.dshPhoneCaption,
      grid: getComputedStyle(full).display, emptyRule: getComputedStyle(empty).borderTopWidth,
    }
  })
  assert.equal(bar.grid, 'grid')
  assert.equal(new Set(bar.widths).size, 1, 'each reading gets an equal cell')
  assert.ok(bar.heights.every(h => h >= 36 && h <= 44), 'cells stay compact but tappable')
  assert.equal(bar.modelCut, false, 'the model picker uses the free toolbar space')
  assert.equal(bar.clipped, false, 'readings wrap instead of truncating')
  assert.equal(bar.caption, '上下文已用')
  assert.equal(bar.emptyRule, '0px', 'a dock without readings stays as the host draws it')

  // An edge swipe or header button opens a drawer without moving focus; the
  // composer's keyboard has to go with the page it belongs to.
  const typing = status.locator('[data-composer-card] [contenteditable]')
  const focused = () => typing.evaluate(el => document.activeElement === el)
  const drawer = (attribute, collapsed) => status.evaluate(({ attribute, collapsed }) => new Promise(resolve => {
    document.querySelector('[data-mobile-frame]').toggleAttribute(attribute, collapsed)
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  }), { attribute, collapsed })
  for (const attribute of ['data-sidebar-collapsed', 'data-rightbar-collapsed']) {
    await typing.tap()
    assert.equal(await focused(), true)
    await drawer(attribute, false)
    assert.equal(await focused(), false, attribute + ': opening a drawer dismisses the keyboard')
    await drawer(attribute, true)
    await typing.tap()
    await drawer('data-dsh-test', true)
    assert.equal(await focused(), true, attribute + ': a closed drawer leaves typing alone')
  }
  assert.equal(await status.locator('[data-dsh-phone-close]').count(), 0, 'the drawer keeps the host close button only')
  await status.evaluate(() => window.stopLayout())
  console.log(engine + ': keyboard reports leave the app in place, a leftover pan is cleared after dismissal, composer focus guards, the composer status bar and drawer keyboard dismissal passed')
} finally {
  await browser.close()
}
