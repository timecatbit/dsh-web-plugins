/**
 * Pocket UI host part: the home-screen icon a phone gets when DSH is added to
 * its home screen.
 *
 * The choice is a live (`volatile`) Config field, so DSH's settings service
 * lets the Settings → General row edit it without a restart. With a whale
 * chosen, the page's touch-icon and manifest links point at
 * `/home-screen/<choice>/…`, which this plugin serves; with `dsh` the page and
 * DSH's own icons are left alone. A path of its own per choice also means a
 * phone that cached DSH's icon under `/apple-touch-icon.png` fetches the new
 * one.
 *
 * Phones fetch these files without cookies. DSH serves every non-index file
 * without a login, and Passkey Proxy lets `/home-screen/` through for the same
 * reason.
 */
import { readFile } from 'node:fs/promises'
import z from '@deepseek-ai/schemastery'

/** Choices: DSH's own icon, a white whale on black, a black whale on white. */
export const HOME_SCREEN_ICONS = ['dsh', 'black', 'white']
/** URL prefix the whale icons and manifests are served under. */
export const HOME_SCREEN_PREFIX = '/home-screen'

export const Config = z.object({
  homeScreenIcon: z.union(HOME_SCREEN_ICONS).default('dsh').volatile()
    .description('Icon a phone uses when DSH is added to its home screen.'),
})

const PNG_FILES = ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png']
const TOUCH_ICON_LINK = /<link\b[^>]*\brel=["']?apple-touch-icon["']?[^>]*>/i
const MANIFEST_LINK = /<link\b[^>]*\brel=["']?manifest["']?[^>]*>/i

/**
 * Point the page's touch-icon and manifest links at the chosen whale, adding
 * them when the page has none (DSH 0.2.1-rc.5). `dsh` leaves the page alone.
 * @param {string} html - the index.html body after DSH's own rows.
 * @param {string} choice - one of HOME_SCREEN_ICONS.
 * @returns {string} the page to serve.
 */
export function pinHomeScreenLinks(html, choice) {
  if (choice !== 'black' && choice !== 'white') return html
  const base = `${HOME_SCREEN_PREFIX}/${choice}/`
  const put = (page, pattern, tag) => {
    if (pattern.test(page)) return page.replace(pattern, tag)
    const head = page.search(/<\/head>/i)
    return head === -1 ? page : page.slice(0, head) + tag + page.slice(head)
  }
  html = put(html, TOUCH_ICON_LINK, `<link rel="apple-touch-icon" href="${base}apple-touch-icon.png" />`)
  return put(html, MANIFEST_LINK, `<link rel="manifest" href="${base}manifest.webmanifest" />`)
}

/**
 * The web app manifest for one whale: DSH's own manifest with the whale icons,
 * and its relative URLs made absolute (it is served from a deeper path).
 * @param {Record<string, unknown> | undefined} host - DSH's manifest, when it could be read.
 * @param {string} choice - `black` or `white`.
 * @returns {Record<string, unknown>} the manifest JSON.
 */
export function homeScreenManifest(host, choice) {
  const base = `${HOME_SCREEN_PREFIX}/${choice}/`
  const manifest = { name: 'DeepSeek Harness', short_name: 'DSH', display: 'standalone', ...(host ?? {}) }
  for (const key of ['start_url', 'scope', 'id']) {
    const value = typeof manifest[key] === 'string' ? manifest[key] : key === 'id' ? undefined : '/'
    if (value === undefined) continue
    const url = new URL(value, 'http://dsh.invalid/manifest.webmanifest')
    manifest[key] = url.pathname + url.search
  }
  manifest.icons = [
    { src: `${base}icon-192.png`, sizes: '192x192', type: 'image/png' },
    { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png' },
    { src: `${base}icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ]
  return manifest
}

/** Read DSH's own manifest: in process where the host can (rc.1+), else over loopback. */
async function readHostManifest(webServer) {
  const tries = [
    () => typeof webServer.readResource === 'function'
      ? webServer.readResource(new Request('http://dsh.invalid/manifest.webmanifest'), undefined) : undefined,
    () => typeof webServer.getOrigin === 'function'
      ? fetch(new URL('/manifest.webmanifest', webServer.getOrigin()), { signal: AbortSignal.timeout(2000) }) : undefined,
  ]
  for (const attempt of tries) {
    try {
      const res = await attempt()
      if (res?.ok) {
        const json = await res.json()
        if (json && typeof json === 'object' && !Array.isArray(json)) return json
      }
    } catch {}
  }
  return undefined
}

/**
 * Route handler for `/home-screen/<black|white>/<file>`.
 * @param {{ readPng: (choice: string, file: string) => Promise<Buffer>, manifest: (choice: string) => Promise<Record<string, unknown>> }} source
 */
export function homeScreenHandler(source) {
  return async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { allow: 'GET, HEAD' })
      res.end()
      return
    }
    const match = /^\/home-screen\/(black|white)\/([a-z0-9.-]+)$/.exec(new URL(req.url ?? '/', 'http://dsh.invalid').pathname)
    let body
    let type
    try {
      if (match && PNG_FILES.includes(match[2])) {
        body = await source.readPng(match[1], match[2])
        type = 'image/png'
      } else if (match && match[2] === 'manifest.webmanifest') {
        body = Buffer.from(JSON.stringify(await source.manifest(match[1]), null, 2))
        type = 'application/manifest+json'
      }
    } catch {}
    if (body === undefined) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      res.end(req.method === 'HEAD' ? undefined : 'not found')
      return
    }
    // no-cache like DSH's own static files: revalidate, never pin a stale icon.
    res.writeHead(200, { 'content-type': type, 'content-length': String(body.length), 'cache-control': 'no-cache' })
    res.end(req.method === 'HEAD' ? undefined : body)
  }
}

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {{ homeScreenIcon: { get(): string } }} config
 */
export function apply(ctx, config) {
  const choice = () => {
    const value = typeof config.homeScreenIcon?.get === 'function' ? config.homeScreenIcon.get() : config.homeScreenIcon
    return HOME_SCREEN_ICONS.includes(value) ? value : 'dsh'
  }
  // Pocket UI draws its own row in Settings → General; no generated page.
  ctx.inject(['settings'], (child) => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber), 'pocket-ui: settings page policy')
  })
  ctx.inject(['webServer'], (child) => {
    const webServer = child.webServer
    const pngs = new Map()
    let hostManifest
    const source = {
      readPng: (variant, file) => {
        const key = `${variant}-${file}`
        if (!pngs.has(key)) pngs.set(key, readFile(new URL(`../assets/home-screen/${key}`, import.meta.url)))
        return pngs.get(key)
      },
      manifest: async (variant) => {
        hostManifest ??= readHostManifest(webServer)
        return homeScreenManifest(await hostManifest, variant)
      },
    }
    child.effect(() => webServer.register({
      kind: 'prefix',
      path: HOME_SCREEN_PREFIX,
      handler: homeScreenHandler(source),
    }), 'pocket-ui: home-screen icons')
    child.effect(() => webServer.tapIndex((html) => pinHomeScreenLinks(html, choice())), 'pocket-ui: home-screen links')
  })
}
