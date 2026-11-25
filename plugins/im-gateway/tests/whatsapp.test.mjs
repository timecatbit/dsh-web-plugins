import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createWhatsAppChannel } from '../lib/channels/whatsapp.js'

const LOGGED_OUT = 401
const RESTART_REQUIRED = 515

/** A stand-in for Baileys 7: records sockets, lets a test fire their events. */
function fakeBaileys() {
  const sockets = []
  let saved = 0
  const mod = {
    DisconnectReason: { loggedOut: LOGGED_OUT, restartRequired: RESTART_REQUIRED },
    async useMultiFileAuthState(dir) {
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, 'creds.json'), '{}')
      return { state: { dir }, saveCreds: () => { saved++ } }
    },
    default(opts) {
      const handlers = {}
      const sock = {
        opts,
        ended: false,
        sent: [],
        end() { this.ended = true },
        async sendMessage(jid, content) { this.sent.push([jid, content]) },
        ev: { on(event, cb) { (handlers[event] ??= []).push(cb) } },
        emit(event, data) { for (const cb of handlers[event] ?? []) cb(data) },
      }
      sockets.push(sock)
      return sock
    },
  }
  return { mod, sockets, saves: () => saved }
}

const close = (code) => ({ connection: 'close', lastDisconnect: { error: { output: { statusCode: code } } } })
const settle = () => new Promise((resolve) => setTimeout(resolve, 20))

function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'imgw-wa-'))
  const fake = fakeBaileys()
  const logs = []
  const adapter = createWhatsAppChannel({ enabled: true }, (line) => logs.push(line), dir, async () => fake.mod)
  return { dir, fake, logs, adapter }
}

test('WhatsApp 配对二维码交给设置页（loginUrl），连上后收起', async () => {
  const { dir, fake, adapter } = setup()
  await adapter.start()
  const sock = fake.sockets[0]
  assert.equal(sock.opts.logger.level, 'error')
  sock.emit('connection.update', { qr: '2@pairing-code' })
  assert.equal(adapter.loginUrl(), '2@pairing-code')
  assert.equal(adapter.status(), '等待扫码')
  assert.equal(readFileSync(join(dir, 'whatsapp-pairing.txt'), 'utf8'), '2@pairing-code\n')
  sock.emit('connection.update', { connection: 'open' })
  assert.equal(adapter.loginUrl(), undefined)
  assert.equal(adapter.status(), '已连接')
  assert.equal(existsSync(join(dir, 'whatsapp-pairing.txt')), false)
  await adapter.stop()
})

test('WhatsApp 登录凭据有更新就保存（不保存则配对完成不了）', async () => {
  const { fake, adapter } = setup()
  await adapter.start()
  fake.sockets[0].emit('creds.update', {})
  fake.sockets[0].emit('creds.update', {})
  await settle()
  assert.equal(fake.saves(), 2)
  await adapter.stop()
})

test('扫码后 WhatsApp 要求重连：立刻换新连接，旧连接不再处理事件', async () => {
  const { fake, adapter } = setup()
  await adapter.start()
  const first = fake.sockets[0]
  first.emit('connection.update', close(RESTART_REQUIRED))
  await settle()
  assert.equal(fake.sockets.length, 2)
  const second = fake.sockets[1]
  second.emit('connection.update', { connection: 'open' })
  assert.equal(adapter.status(), '已连接')
  first.emit('connection.update', { qr: 'stale' })
  assert.equal(adapter.loginUrl(), undefined)
  await adapter.stop()
  assert.equal(second.ended, true)
})

test('手机上退出登录：删掉旧凭据、不再自动重连', async () => {
  const { dir, fake, adapter } = setup()
  await adapter.start()
  assert.equal(existsSync(join(dir, 'whatsapp-auth', 'creds.json')), true)
  fake.sockets[0].emit('connection.update', close(LOGGED_OUT))
  await settle()
  assert.equal(adapter.status(), '已登出')
  assert.equal(existsSync(join(dir, 'whatsapp-auth')), false)
  assert.equal(fake.sockets.length, 1)
})

test('二维码没人扫：立刻换新码，连续三轮后停下并提示刷新', async () => {
  const { fake, logs, adapter } = setup()
  await adapter.start()
  for (let round = 0; round < 3; round++) {
    const sock = fake.sockets.at(-1)
    sock.emit('connection.update', { qr: `code-${round}` })
    sock.emit('connection.update', close(408))
    await settle()
  }
  assert.equal(fake.sockets.length, 3)
  assert.equal(adapter.status(), '二维码已过期')
  assert.equal(adapter.loginUrl(), undefined)
  assert.match(logs.join('\n'), /刷新二维码/)
  await adapter.stop()
})

test('已配对的连接断开（408 无二维码）照常 5 秒后重连，不算过期', async () => {
  const { fake, adapter } = setup()
  await adapter.start()
  fake.sockets[0].emit('connection.update', { connection: 'open' })
  fake.sockets[0].emit('connection.update', close(408))
  await settle()
  assert.equal(adapter.status(), '重连中')
  assert.equal(fake.sockets.length, 1)
  await adapter.stop()
})

test('stop 之后断开不会再重连', async () => {
  const { fake, adapter } = setup()
  await adapter.start()
  await adapter.stop()
  fake.sockets[0].emit('connection.update', close(428))
  await settle()
  assert.equal(fake.sockets.length, 1)
  assert.equal(adapter.status(), '未启动')
})

test('只把新到的文字消息交给 agent；LID 会话用手机号作发言者，群里取发言人', async () => {
  const { fake, adapter } = setup()
  const got = []
  adapter.setMessageHandler((m) => { got.push(m) })
  await adapter.start()
  const sock = fake.sockets[0]
  sock.emit('messages.upsert', { type: 'append', messages: [{ key: { remoteJid: '1@s.whatsapp.net' }, message: { conversation: 'old' } }] })
  sock.emit('messages.upsert', {
    type: 'notify',
    messages: [
      { key: { remoteJid: '111@lid', remoteJidAlt: '8613800000000@s.whatsapp.net' }, pushName: 'Ann', message: { conversation: 'hi' } },
      { key: { remoteJid: '222@s.whatsapp.net', fromMe: true }, message: { conversation: 'mine' } },
      { key: { remoteJid: 'status@broadcast', participant: '3@s.whatsapp.net' }, message: { conversation: 'status' } },
      { key: { remoteJid: '999@g.us', participant: '444@lid', participantAlt: '85290000000:2@s.whatsapp.net' }, message: { extendedTextMessage: { text: 'group' } } },
      { key: { remoteJid: '555@s.whatsapp.net' }, message: { imageMessage: {} } },
    ],
  })
  assert.deepEqual(got, [
    { chatId: '111@lid', userId: '8613800000000', username: 'Ann', text: 'hi' },
    { chatId: '999@g.us', userId: '85290000000', username: undefined, text: 'group' },
  ])
  await adapter.send('111@lid', 'reply')
  assert.deepEqual(sock.sent, [['111@lid', { text: 'reply' }]])
  await adapter.stop()
})

test('没装 Baileys 时报缺少依赖，不抛错', async () => {
  const logs = []
  const adapter = createWhatsAppChannel({ enabled: true }, (line) => logs.push(line), mkdtempSync(join(tmpdir(), 'imgw-wa-')), async () => { throw new Error('missing') })
  await adapter.start()
  assert.equal(adapter.status(), '缺少依赖')
  assert.match(logs.join('\n'), /baileys/)
})
