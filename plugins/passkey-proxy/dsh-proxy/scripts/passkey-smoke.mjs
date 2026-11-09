import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { createServer, request as httpRequest } from 'node:http'
import { createServer as createHTTPS, request } from 'node:https'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { build } from 'esbuild'
import WebSocket, { WebSocketServer } from 'ws'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.DSH_TEST_PLAYWRIGHT || 'playwright')
const tmp = mkdtempSync(join(tmpdir(), 'dsh-passkey-smoke-'))
const loginPath = '/_dsh_login'
const authFile = join(tmp, 'auth.json')
const listen = (server) => new Promise((done) => server.listen(0, '127.0.0.1', () => done(server.address().port)))
const upstream = createServer((req, res) => {
  assert.doesNotMatch(req.headers.cookie ?? '', /dsh-proxy-/)
  res.setHeader('Content-Type', 'text/html')
  res.end('<!doctype html><h1>DSH upstream</h1><a id="from-settings" referrerpolicy="same-origin" href="/_dsh_login/keys?from=settings">Manage</a>')
})
const ws = new WebSocketServer({ server: upstream })
ws.on('connection', (socket) => socket.send('upstream-ok'))
let browser, proxy, front, frontPort, target
try {
  const client = await build({ entryPoints: ['src/auth-client.ts'], bundle: true, format: 'iife', write: false })
  const bundle = join(tmp, 'proxy.cjs')
  await build({
    entryPoints: ['src/proxy.ts'], outfile: bundle, platform: 'node', format: 'cjs', bundle: true,
    define: { DSH_PROXY_AUTH_CLIENT_JS: JSON.stringify(client.outputFiles[0].text) },
  })
  const { startLanProxy } = require(resolve(bundle))
  const upstreamPort = await listen(upstream)
  const key = join(tmp, 'key.pem'), cert = join(tmp, 'cert.pem')
  execFileSync('openssl', ['req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1', '-nodes',
    '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost'],
    { stdio: 'ignore' })
  const relay = require('http-proxy').createProxyServer()
  relay.on('error', (err, _req, res) => res.destroy(err))
  front = createHTTPS({ key: readFileSync(key), cert: readFileSync(cert) }, (req, res) => {
    req.headers['x-forwarded-proto'] = 'https'
    relay.web(req, res, { target })
  })
  front.on('upgrade', (req, socket, head) => {
    req.headers['x-forwarded-proto'] = 'https'
    relay.ws(req, socket, head, { target })
  })
  frontPort = await listen(front)
  const https = 'https://localhost:' + frontPort
  const config = {
    listenHost: '127.0.0.1', listenPort: 0, upstreamHost: '127.0.0.1', upstreamPort,
    username: 'smoke', password: 'sample-secret', authFile, passkeyOrigin: https, trustedTLSProxyIPs: ['127.0.0.1'],
  }
  const boot = async (options = config) => {
    proxy = startLanProxy(options)
    target = 'http://127.0.0.1:' + await proxy.ready
  }
  await boot()
  browser = await chromium.launch({ channel: 'chrome' })
  let ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 }, colorScheme: 'dark' })
  let page = await ctx.newPage()
  page.setDefaultTimeout(6000)
  await page.goto(https)
  assert.equal(new URL(page.url()).pathname, loginPath)
  assert.equal(await page.locator('#passkey-login').isVisible(), true)
  assert.equal(await page.locator('#password').isVisible(), false)
  const basic = 'Basic ' + Buffer.from('smoke:sample-secret').toString('base64')
  const noBasic = await new Promise((done, fail) => {
    request(https, { rejectUnauthorized: false, headers: { Authorization: basic } }, res => {
      res.resume()
      done([res.statusCode, res.headers.location, res.headers['www-authenticate']])
    }).on('error', fail).end()
  })
  assert.deepEqual(noBasic, [303, loginPath, undefined])
  await page.locator('summary').click()
  await page.locator('#username').fill(config.username)
  await page.locator('#password').fill('incorrect')
  await page.locator('#password-form button').click()
  await page.locator('#message').filter({ hasText: '账号或密码不正确' }).waitFor()
  await page.locator('#password').fill(config.password)
  await Promise.all([page.waitForURL('**' + loginPath + '/keys'), page.locator('#password-form button').click()])
  await page.locator('#show-add').waitFor()
  if (process.env.DSH_TEST_SCREENSHOT) await page.screenshot({ path: process.env.DSH_TEST_SCREENSHOT })
  const post = (path, body) => page.evaluate(async ({ path, body }) => {
    const res = await fetch('/_dsh_login' + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    return { status: res.status, data: await res.json() }
  }, { path, body })
  assert.equal((await post('/keys/options', { password: 'incorrect' })).status, 401)
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('WebAuthn.enable')
  const authenticator = async () => (await cdp.send('WebAuthn.addVirtualAuthenticator', { options: {
    protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true,
    isUserVerified: true, automaticPresenceSimulation: true,
  } })).authenticatorId
  let first
  for (let i = 1; i <= 5; i++) {
    const authenticatorId = await authenticator()
    await page.locator('#show-add').click()
    await page.locator('#key-password').fill(config.password)
    await page.locator('#key-label').fill('Test device ' + i)
    await page.locator('#add-key').click()
    await page.locator('#key-count').filter({ hasText: i + ' / 5' }).waitFor()
    if (i === 1) [first] = (await cdp.send('WebAuthn.getCredentials', { authenticatorId })).credentials
    await cdp.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId })
  }
  assert.equal(await page.locator('#show-add').isDisabled(), true)
  assert.equal((await post('/keys/options', { password: config.password })).status, 409)
  assert.equal(await page.locator('#key-action').isVisible(), false)
  await Promise.all([page.waitForURL(https + '/'), page.locator('#back-app').click()])
  await page.goto(https + '/?workspace=draft')
  await Promise.all([page.waitForURL('**/keys?from=settings'), page.locator('#from-settings').click()])
  await Promise.all([page.waitForURL(https + '/?workspace=draft'), page.locator('#back-app').click()])
  await Promise.all([page.waitForURL('**/keys?from=settings'), page.locator('#from-settings').click()])
  const authenticatorId = await authenticator()
  await cdp.send('WebAuthn.addCredential', { authenticatorId, credential: first })
  page.once('dialog', dialog => dialog.accept())
  await Promise.all([page.waitForURL('**' + loginPath), page.locator('#logout').click()])
  assert.equal((await ctx.cookies()).some(c => c.name.startsWith('__Host-dsh-proxy-')), false)
  const verified = page.waitForRequest(r => r.url().endsWith('/passkey/verify'))
  await Promise.all([page.waitForURL(https + '/'), page.locator('#passkey-login').click()])
  await page.getByRole('heading', { name: 'DSH upstream' }).waitFor()
  const replay = (await verified).postDataJSON()
  assert.equal((await post('/passkey/verify', replay)).status, 400)
  const cookie = (await ctx.cookies()).find(c => c.name.startsWith('__Host-dsh-proxy-'))
  assert.ok(cookie?.httpOnly && cookie.secure && cookie.sameSite === 'Lax')
  assert.ok(cookie.expires - Date.now() / 1000 >= 29 * 24 * 3600)
  assert.equal(statSync(authFile).mode & 0o777, 0o600)
  assert.ok(!readFileSync(authFile, 'utf8').includes(cookie.value))
  const saved = await ctx.storageState()
  await ctx.close()
  await proxy.close()
  await boot()
  ctx = await browser.newContext({ ignoreHTTPSErrors: true, storageState: saved })
  page = await ctx.newPage()
  await page.goto(https)
  await page.getByRole('heading', { name: 'DSH upstream' }).waitFor()
  const value = await new Promise((done, fail) => {
    const socket = new WebSocket(https.replace('https:', 'wss:') + '/api/remote.mux', {
      rejectUnauthorized: false, origin: https, headers: { Cookie: cookie.name + '=' + cookie.value },
    })
    socket.on('error', fail)
    socket.on('message', data => { socket.close(); done(data.toString()) })
  })
  assert.equal(value, 'upstream-ok')
  const csrf = await ctx.request.post(https + loginPath + '/logout', { headers: { Origin: 'https://untrusted.invalid' }, data: {} })
  assert.equal(csrf.status(), 403)
  await page.goto(https + loginPath + '/keys')
  const firstID = Buffer.from(first.credentialId, 'base64').toString('base64url')
  assert.equal((await post('/keys/remove', { id: firstID, password: config.password })).status, 200)
  await page.goto(https)
  assert.equal(new URL(page.url()).pathname, loginPath)
  await page.goto(https + loginPath + '/keys')
  assert.equal(new URL(page.url()).search, '?continue=keys')
  await page.locator('summary').click()
  await page.locator('#username').fill(config.username)
  await page.locator('#password').fill(config.password)
  await Promise.all([page.waitForURL('**' + loginPath + '/keys'), page.locator('#password-form button').click()])
  await Promise.all([page.waitForURL(https + '/'), page.locator('#back-app').click()])
  console.log('HTTPS: password fallback, five real WebAuthn registrations, sixth blocked, Passkey login, replay/CSRF rejected, persistent session, WebSocket and revocation passed.')

  const cli = (headers = {}) => new Promise((done, fail) => {
    httpRequest(target, { headers }, res => {
      res.resume()
      done({ status: res.statusCode, headers: res.headers })
    }).on('error', fail).end()
  })
  let cliResult = await cli()
  assert.equal(cliResult.status, 401)
  assert.match(cliResult.headers['www-authenticate'], /^Basic /)
  cliResult = await cli({ Authorization: basic })
  assert.equal(cliResult.status, 200)
  const [lanCookie] = cliResult.headers['set-cookie']
  assert.match(lanCookie, /^dsh-proxy-/)
  assert.doesNotMatch(lanCookie, /; Secure/)
  assert.equal((await fetch(target, { headers: { Cookie: lanCookie.split(';')[0] } })).status, 200)
  await page.goto(target)
  assert.equal(new URL(page.url()).pathname, loginPath)
  assert.equal(await page.locator('#passkey-login').count(), 0)
  await page.locator('#username').fill(config.username)
  await page.locator('#password').fill(config.password)
  await Promise.all([page.waitForURL(target + '/'), page.locator('#password-form button').click()])
  await page.getByRole('heading', { name: 'DSH upstream' }).waitFor()
  await proxy.close()
  await boot({ ...config, trustedTLSProxyIPs: [] })
  const res = await ctx.request.get(https + loginPath)
  assert.doesNotMatch(await res.text(), /id="passkey-login"/)
  console.log('HTTP: CLI Basic Auth, browser password form and cookies passed; untrusted proxy could not turn on Passkey.')
} finally {
  await browser?.close()
  await proxy?.close()
  front?.closeAllConnections()
  front?.close()
  for (const socket of ws.clients) socket.terminate()
  ws.close()
  upstream.closeAllConnections()
  upstream.close()
  rmSync(tmp, { recursive: true, force: true })
}
