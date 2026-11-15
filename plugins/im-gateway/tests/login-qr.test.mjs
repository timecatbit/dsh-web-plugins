import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { qrPng } from '../lib/core/provisioning.js'
import { ChannelManager } from '../lib/manager.js'

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

test('qrPng 在本机生成 PNG', async () => {
  const png = await qrPng('https://example.test/login?code=abc')
  assert.ok(png.subarray(0, 8).equals(PNG_MAGIC))
  assert.ok(png.length > 200)
})

/** 只带 webServer 的最小 ctx，捕获 API 路由的 handler。 */
function makeManager() {
  const routes = []
  const ctx = { webServer: { register: (route) => { routes.push(route); return () => {} } } }
  const stateDir = mkdtempSync(join(tmpdir(), 'imgw-qr-'))
  const manager = new ChannelManager(ctx, {
    config: { allowAllUsers: true, allowedUserIds: {}, channels: {} },
    stateDir,
    log: () => {},
    gateway: {},
    cron: { list: () => [] },
  })
  manager.registerApi()
  return { manager, handler: routes[0].handler, cleanup: () => rmSync(stateDir, { recursive: true, force: true }) }
}

function call(handler, method, url) {
  return new Promise((resolve) => {
    const res = {
      status: 0,
      headers: {},
      writeHead(status, headers) { this.status = status; this.headers = headers ?? {} },
      end(body) { resolve({ status: this.status, headers: this.headers, body: body === undefined ? undefined : Buffer.from(body) }) },
    }
    const req = { method, url, headers: { host: 'dsh.invalid' }, on: () => {} }
    void handler(req, res)
  })
}

test('login-qr 路由返回本机生成的二维码，不引用外部服务', async (t) => {
  const { manager, handler, cleanup } = makeManager()
  t.after(cleanup)

  const none = await call(handler, 'GET', '/dsh-im-gateway/api/channels/wechat/login-qr')
  assert.equal(none.status, 404)

  manager.running.set('wechat', { loginUrl: () => 'https://example.test/login?code=abc' })
  const got = await call(handler, 'GET', '/dsh-im-gateway/api/channels/wechat/login-qr?v=1')
  assert.equal(got.status, 200)
  assert.equal(got.headers['content-type'], 'image/png')
  assert.equal(got.headers['cache-control'], 'no-store')
  assert.ok(got.body.subarray(0, 8).equals(PNG_MAGIC))

  const head = await call(handler, 'HEAD', '/dsh-im-gateway/api/channels/wechat/login-qr')
  assert.equal(head.status, 200)
  assert.equal(head.body, undefined)

  const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
  assert.ok(!/qrserver|https?:\/\/api\./.test(client), 'client.js must not send QR data to an outside service')
  assert.ok(client.includes('/login-qr?v='))
})
