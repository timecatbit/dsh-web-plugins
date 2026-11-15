import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ChannelManager } from '../lib/manager.js'

/** 只带 webServer 的最小 ctx 和不收发消息的网关，捕获 API 路由的 handler。 */
function makeManager(stateDir) {
  const routes = []
  const ctx = { webServer: { register: (route) => { routes.push(route); return () => {} } } }
  const manager = new ChannelManager(ctx, {
    config: { allowAllUsers: true, allowedUserIds: {}, channels: {} },
    stateDir,
    log: () => {},
    gateway: { register: () => {}, unregister: () => {}, addAuthorizedUser: () => {} },
    cron: { list: () => [] },
  })
  manager.registerApi()
  return { manager, handler: routes[0].handler }
}

function post(handler, url, body) {
  return new Promise((resolve) => {
    const res = {
      status: 0,
      writeHead(status) { this.status = status },
      end(text) { resolve({ status: this.status, body: JSON.parse(text) }) },
    }
    const payload = JSON.stringify(body ?? {})
    const req = {
      method: 'POST',
      url,
      headers: { host: 'dsh.invalid' },
      on(event, cb) {
        if (event === 'data') setImmediate(() => cb(payload))
        if (event === 'end') setImmediate(() => setImmediate(cb))
      },
    }
    void handler(req, res)
  })
}

test('设置页连上的扫码类渠道（不带凭据）重启后自动恢复', async (t) => {
  const stateDir = mkdtempSync(join(tmpdir(), 'imgw-reconnect-'))
  t.after(() => rmSync(stateDir, { recursive: true, force: true }))

  // tlon 是不联网的骨架渠道，和微信一样连接时不带凭据。
  const first = makeManager(stateDir)
  const res = await post(first.handler, '/dsh-im-gateway/api/channels/tlon/connect', {})
  assert.equal(res.status, 200)
  assert.equal(res.body.channel.running, true)
  assert.equal(res.body.channel.enabled, true)
  const saved = JSON.parse(readFileSync(join(stateDir, 'channels.json'), 'utf8'))
  assert.deepEqual(saved.channels.tlon, { enabled: true })

  // 「暂时断开」不改 enabled，重启后仍恢复。
  await post(first.handler, '/dsh-im-gateway/api/channels/tlon/disconnect', {})

  const second = makeManager(stateDir)
  await second.manager.initAll()
  const tlon = second.manager.list().find((c) => c.id === 'tlon')
  assert.equal(tlon.running, true)
  await second.manager.disconnect('tlon')
})

test('连接失败的渠道不记为启用', async (t) => {
  const stateDir = mkdtempSync(join(tmpdir(), 'imgw-reconnect-'))
  t.after(() => rmSync(stateDir, { recursive: true, force: true }))
  const { manager, handler } = makeManager(stateDir)
  const res = await post(handler, '/dsh-im-gateway/api/channels/telegram/connect', {})
  assert.equal(res.status, 400)
  assert.equal(manager.list().find((c) => c.id === 'telegram').enabled, false)
})
