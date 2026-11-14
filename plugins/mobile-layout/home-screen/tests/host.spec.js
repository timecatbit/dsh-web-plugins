import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { Config, HOME_SCREEN_ICONS, apply, homeScreenHandler, homeScreenManifest, pinHomeScreenLinks } from '../src/host.js'

const DSH_HEAD = '<head>\n<link rel="manifest" href="./manifest.webmanifest" />\n<link rel="apple-touch-icon" href="./apple-touch-icon.png" />\n</head><body></body>'

/** Minimal node-style response capturing status, headers and body. */
function response() {
  const out = { status: 0, headers: {}, body: undefined }
  return { out, res: { writeHead: (status, headers = {}) => { out.status = status; out.headers = headers }, end: (body) => { out.body = body } } }
}

describe('Config', () => {
  it('is a live field defaulting to DSH’s own icon and accepting only the three choices', () => {
    expect(Config.dict.homeScreenIcon.meta.volatile).toBe(true)
    // Volatile fields arrive as live boxes, read with get().
    expect(Config({}).homeScreenIcon.get()).toBe('dsh')
    expect(Config({ homeScreenIcon: 'black' }).homeScreenIcon.get()).toBe('black')
    expect(() => Config({ homeScreenIcon: 'blue' })).toThrow()
    expect(HOME_SCREEN_ICONS).toEqual(['dsh', 'black', 'white'])
  })
})

describe('pinHomeScreenLinks', () => {
  it('points the touch icon and manifest at the chosen whale', () => {
    expect(pinHomeScreenLinks(DSH_HEAD, 'black')).toBe('<head>\n<link rel="manifest" href="/home-screen/black/manifest.webmanifest" />\n<link rel="apple-touch-icon" href="/home-screen/black/apple-touch-icon.png" />\n</head><body></body>')
  })
  it('adds the links when the page has none', () => {
    expect(pinHomeScreenLinks('<html><head><title>x</title></HEAD>', 'white')).toBe('<html><head><title>x</title><link rel="apple-touch-icon" href="/home-screen/white/apple-touch-icon.png" /><link rel="manifest" href="/home-screen/white/manifest.webmanifest" /></HEAD>')
  })
  it('leaves the page alone for DSH’s own icon', () => {
    expect(pinHomeScreenLinks(DSH_HEAD, 'dsh')).toBe(DSH_HEAD)
    expect(pinHomeScreenLinks(DSH_HEAD, undefined)).toBe(DSH_HEAD)
  })
})

describe('homeScreenManifest', () => {
  it('keeps DSH’s fields, makes its URLs absolute and swaps in the whale icons', () => {
    const m = homeScreenManifest({ name: 'DeepSeek Harness', short_name: 'DSH', start_url: './', scope: './', display: 'standalone', theme_color: '#fff', icons: [{ src: './icon-192.png' }] }, 'white')
    expect(m).toMatchObject({ name: 'DeepSeek Harness', short_name: 'DSH', start_url: '/', scope: '/', theme_color: '#fff' })
    expect(m.icons.map(i => i.src)).toEqual(['/home-screen/white/icon-192.png', '/home-screen/white/icon-512.png', '/home-screen/white/icon-maskable-512.png'])
    expect(m.icons[2].purpose).toBe('maskable')
  })
  it('works without DSH’s manifest', () => {
    expect(homeScreenManifest(undefined, 'black')).toMatchObject({ short_name: 'DSH', start_url: '/', scope: '/', display: 'standalone' })
  })
})

describe('homeScreenHandler', () => {
  const handler = homeScreenHandler({
    readPng: async (variant, file) => Buffer.from(`${variant}:${file}`),
    manifest: async (variant) => ({ v: variant }),
  })
  it('serves the PNGs and the manifest for black and white', async () => {
    for (const [path, type, body] of [
      ['/home-screen/black/apple-touch-icon.png', 'image/png', 'black:apple-touch-icon.png'],
      ['/home-screen/white/icon-maskable-512.png', 'image/png', 'white:icon-maskable-512.png'],
      ['/home-screen/white/manifest.webmanifest', 'application/manifest+json', JSON.stringify({ v: 'white' }, null, 2)],
    ]) {
      const { out, res } = response()
      await handler({ method: 'GET', url: path }, res)
      expect(out.status, path).toBe(200)
      expect(out.headers['content-type']).toBe(type)
      expect(out.headers['cache-control']).toBe('no-cache')
      expect(String(out.body)).toBe(body)
    }
  })
  it('answers HEAD without a body, 404 for anything else and 405 for other methods', async () => {
    let r = response(); await handler({ method: 'HEAD', url: '/home-screen/black/icon-192.png' }, r.res)
    expect(r.out.status).toBe(200); expect(r.out.body).toBeUndefined(); expect(r.out.headers['content-length']).toBe(String('black:icon-192.png'.length))
    for (const path of ['/home-screen/dsh/icon-192.png', '/home-screen/black/../secret', '/home-screen/black/other.png', '/home-screen', '/home-screen/black']) {
      r = response(); await handler({ method: 'GET', url: path }, r.res); expect(r.out.status, path).toBe(404)
    }
    r = response(); await handler({ method: 'POST', url: '/home-screen/black/icon-192.png' }, r.res); expect(r.out.status).toBe(405)
  })
})

describe('apply', () => {
  it('registers the route and a page rewrite that follows the live choice', async () => {
    let current = 'dsh'
    const routes = []
    const taps = []
    const effects = []
    const webServer = { register: (route) => { routes.push(route); return () => {} }, tapIndex: (fn) => { taps.push(fn); return () => {} } }
    const ctx = {
      fiber: {},
      inject: (deps, cb) => { if (deps[0] === 'webServer') cb({ webServer, effect: (fn, label) => { effects.push(label); fn() } }) },
    }
    apply(ctx, { homeScreenIcon: { get: () => current } })
    expect(routes.map(r => [r.kind, r.path])).toEqual([['prefix', '/home-screen']])
    expect(taps[0](DSH_HEAD)).toBe(DSH_HEAD)
    current = 'black'
    expect(taps[0](DSH_HEAD)).toContain('href="/home-screen/black/apple-touch-icon.png"')
    const { out, res } = response()
    await routes[0].handler({ method: 'GET', url: '/home-screen/black/apple-touch-icon.png' }, res)
    expect(out.status).toBe(200)
    expect(Buffer.compare(out.body, readFileSync(new URL('../assets/home-screen/black-apple-touch-icon.png', import.meta.url)))).toBe(0)
  })
})
