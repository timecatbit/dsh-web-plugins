import { createHash, createHmac, randomBytes } from 'node:crypto'
import { lstatSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { dirname } from 'node:path'
import {
  generateAuthenticationOptions, generateRegistrationOptions,
  verifyAuthenticationResponse, verifyRegistrationResponse,
  type AuthenticationResponseJSON, type RegistrationResponseJSON,
  type AuthenticatorTransport,
} from '@simplewebauthn/server'
import { Authenticator, checkBasicAuth } from './session.ts'
import { authPage } from './auth-page.ts'
import { canonicalProxyIP, parsePasskeyOrigin } from './settings.ts'

export const LOGIN = '/_dsh_login'
export const MAX_PASSKEYS = 5
const SESSION_AGE = 30 * 24 * 60 * 60
const CHALLENGE_AGE = 2 * 60 * 1000
declare const DSH_PROXY_AUTH_CLIENT_JS: string
const token = () => randomBytes(32).toString('base64url')
const digest = (s: string) => createHash('sha256').update(s).digest('hex')
const knownTransports = new Set<string>(['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb'])

interface Session { expires: number; origin: string; account: string; credential?: string }
interface Key {
  id: string; publicKey: string; counter: number; rpID: string; owner: string
  transports?: AuthenticatorTransport[]; label: string; created: number
}
interface State { version: 1; secret: string; keys: Key[]; sessions: Record<string, Session> }
export interface LoginPolicy { password: boolean; passkey: boolean }
interface Pending {
  kind: 'login' | 'register'; challenge: string; origin: string; expires: number
  session?: string; label?: string; client: string
}

class AuthError extends Error {
  constructor(readonly status: number, message: string) { super(message) }
}

function ownerID(secret: string, username: string): string {
  return createHmac('sha256', secret).update(JSON.stringify(['owner', username])).digest('hex')
}

export function registeredPasskeyCount(file: string, username: string, origin?: string): number {
  if (!origin || !username) return 0
  try {
    const rpID = parsePasskeyOrigin(origin).hostname
    const state = JSON.parse(readFileSync(file, 'utf8')) as State
    if (state.version !== 1 || !Array.isArray(state.keys) || !/^[\w-]{43}$/.test(state.secret)) return 0
    const owner = ownerID(state.secret, username)
    return state.keys.filter(k => k?.owner === owner && k.rpID === rpID && k.id && k.publicKey).length
  } catch { return 0 }
}

function json(res: ServerResponse, status: number, data: object): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
  res.end(JSON.stringify(data))
}

async function readJSON(req: IncomingMessage): Promise<Record<string, unknown>> {
  if (req.headers['content-type']?.split(';')[0]?.trim() !== 'application/json') throw new AuthError(415, '请求格式无效。')
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 32_768) throw new AuthError(413, '请求过大。')
    chunks.push(chunk)
  }
  const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AuthError(400, '请求格式无效。')
  return value as Record<string, unknown>
}

export class BrowserAuth {
  private state: State
  private readonly auth: Authenticator
  private readonly pending = new Map<string, Pending>()
  private readonly limits = new Map<string, { count: number; until: number }>()
  private readonly origin?: URL
  private readonly owner: string
  private readonly account: string
  private readonly observed = new Map<string, number>()
  private readonly policy: LoginPolicy

  constructor(private readonly file: string, private readonly username: string, private readonly password: string,
    configuredOrigin?: string, private readonly tlsProxyAddresses: ReadonlySet<string> = new Set(), policy?: LoginPolicy) {
    this.auth = new Authenticator({ username, password })
    this.policy = policy ?? { password: true, passkey: !!configuredOrigin }
    if (configuredOrigin) {
      this.origin = parsePasskeyOrigin(configuredOrigin)
    }
    try {
      const st = lstatSync(file)
      if (!st.isFile() || (st.mode & 0o077) !== 0) throw new Error('auth store must be a private regular file')
      this.state = JSON.parse(readFileSync(file, 'utf8'))
      if (this.state.version !== 1 || !/^[\w-]{43}$/.test(this.state.secret) ||
        !Array.isArray(this.state.keys) || !this.state.sessions || typeof this.state.sessions !== 'object' ||
        Array.isArray(this.state.sessions)) throw new Error('invalid auth store')
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
      this.state = { version: 1, secret: token(), keys: [], sessions: {} }
      this.save(this.state)
    }
    this.owner = ownerID(this.state.secret, username)
    this.account = this.sign(['session', username, password])
    const sessions = Object.fromEntries(Object.entries(this.state.sessions)
      .filter(([, s]) => s?.credential ? this.policy.passkey : this.policy.password))
    if (Object.keys(sessions).length !== Object.keys(this.state.sessions).length) this.save({ ...this.state, sessions })
  }

  private sign(fields: string[]): string {
    return createHmac('sha256', this.state.secret).update(JSON.stringify(fields)).digest('hex')
  }

  private save(next: State): void {
    mkdirSync(dirname(this.file), { recursive: true, mode: 0o700 })
    const temp = this.file + '.' + token() + '.tmp'
    try {
      writeFileSync(temp, JSON.stringify(next), { flag: 'wx', mode: 0o600, flush: true })
      renameSync(temp, this.file)
      this.state = next
    } finally {
      try { unlinkSync(temp) } catch { /* renamed or absent */ }
    }
  }

  private peer(req: IncomingMessage): string {
    return canonicalProxyIP(req.socket.remoteAddress ?? '') ?? ''
  }

  observedProxyIPs(): string[] {
    const now = Date.now()
    return [...this.observed].filter(([, until]) => until > now).map(([ip]) => ip)
  }

  observeProxy(req: IncomingMessage): void {
    const peer = this.peer(req)
    if (req.method !== 'GET' || !peer || !this.matchesExternalHost(req) ||
      req.headers['x-forwarded-proto'] !== 'https' || this.tlsProxyAddresses.has(peer)) return
    this.observed.delete(peer)
    this.observed.set(peer, Date.now() + 10 * 60_000)
    if (this.observed.size > 4) this.observed.delete(this.observed.keys().next().value!)
  }

  private matchesExternalHost(req: IncomingMessage): boolean {
    if (!this.origin || !req.headers.host) return false
    try { return new URL('https://' + req.headers.host).origin === this.origin.origin }
    catch { return false }
  }

  untrustedExternal(req: IncomingMessage): boolean {
    return this.matchesExternalHost(req) && this.requestOrigin(req) !== this.origin!.origin
  }

  requestOrigin(req: IncomingMessage): string | undefined {
    const host = req.headers.host
    if (!host || !/^[a-z0-9.:[\]-]+$/i.test(host)) return
    const addr = this.peer(req)
    const forwarded = this.tlsProxyAddresses.has(addr) && req.headers['x-forwarded-proto'] === 'https'
    const secure = (req.socket as { encrypted?: boolean }).encrypted === true || forwarded
    try {
      const actual = new URL((secure ? 'https://' : 'http://') + host).origin
      // Do not trust forwarded protocol on arbitrary Host values.
      if (forwarded && actual !== this.origin?.origin) return
      return actual
    } catch { return }
  }

  passkeysAvailable(req: IncomingMessage): boolean {
    return this.policy.passkey && this.origin !== undefined && this.requestOrigin(req) === this.origin.origin
  }

  passwordAvailable(req: IncomingMessage): boolean {
    return this.policy.password && this.auth.enabled && !this.untrustedExternal(req)
  }

  basicAvailable(req: IncomingMessage): boolean {
    return this.passwordAvailable(req) && !this.requestOrigin(req)?.startsWith('https:')
  }

  sameOrigin(req: IncomingMessage, required = false): boolean {
    const origin = this.requestOrigin(req)
    const supplied = req.headers.origin
    const outside = req.headers['sec-fetch-site'] === 'cross-site'
    const navigation = req.method === 'GET' && req.headers['sec-fetch-mode'] === 'navigate' && supplied === undefined
    return !!origin && (!outside || (!required && navigation)) &&
      (supplied === undefined ? !required : supplied === origin)
  }

  acceptsBasic(req: IncomingMessage): boolean {
    if (!this.basicAvailable(req)) return false
    const value = req.headers.authorization
    if (!value || value.length > 4096) return false
    try {
      const key = 'password:' + (req.socket.remoteAddress ?? 'unknown')
      const failed = this.limits.get(key)
      if (failed && failed.until >= Date.now() && failed.count >= 12) return false
      if (this.auth.isAuthenticated(value)) return true
      this.limited(req, 'password', 12)
    } catch { /* throttle invalid credentials */ }
    return false
  }

  private cookieName(req: IncomingMessage): string {
    const origin = this.requestOrigin(req) ?? ''
    return (origin.startsWith('https:') ? '__Host-' : '') + 'dsh-proxy-' + digest(origin).slice(0, 12)
  }

  private cookie(req: IncomingMessage, value: string, age: number): string {
    return this.cookieName(req) + '=' + value + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + age +
      (this.requestOrigin(req)?.startsWith('https:') ? '; Secure' : '')
  }

  private sessionID(req: IncomingMessage): string | undefined {
    const prefix = this.cookieName(req) + '='
    const value = req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith(prefix))?.slice(prefix.length)
    return value && /^[\w-]{43}$/.test(value) ? digest(value) : undefined
  }

  hasSession(req: IncomingMessage): boolean {
    const id = this.sessionID(req)
    const s = id && this.state.sessions[id]
    return !!s && s.expires > Date.now() && s.account === this.account && s.origin === this.requestOrigin(req) &&
      (s.credential ? this.passkeysAvailable(req) && this.state.keys.some(k => k.id === s.credential && k.owner === this.owner)
        : this.passwordAvailable(req))
  }

  issue(req: IncomingMessage, credential?: string): string {
    const origin = this.requestOrigin(req)
    if (!origin || (credential ? !this.passkeysAvailable(req) : !this.passwordAvailable(req))) throw new AuthError(400, '登录入口无效。')
    const value = token()
    const now = Date.now()
    const sessions = Object.fromEntries(Object.entries(this.state.sessions)
      .filter(([, s]) => s.expires > now && s.account === this.account)
      .sort(([, a], [, b]) => b.expires - a.expires).slice(0, 63))
    const prior = this.sessionID(req)
    if (prior) delete sessions[prior]
    sessions[digest(value)] = { expires: now + SESSION_AGE * 1000, origin, account: this.account, credential }
    this.save({ ...this.state, sessions })
    return this.cookie(req, value, SESSION_AGE)
  }

  stripCookie(req: IncomingMessage): void {
    const prefix = this.cookieName(req) + '='
    if (req.headers.cookie) req.headers.cookie = req.headers.cookie.split(';').map(x => x.trim()).filter(x => !x.startsWith(prefix)).join('; ')
  }

  private limited(req: IncomingMessage, category: string, max: number): void {
    const key = category + ':' + (req.socket.remoteAddress ?? 'unknown')
    const now = Date.now()
    for (const [k, v] of this.limits) if (v.until < now) this.limits.delete(k)
    const v = this.limits.get(key) ?? { count: 0, until: now + 60_000 }
    if (v.count >= max || (!this.limits.has(key) && this.limits.size >= 2048)) throw new AuthError(429, '尝试太频繁，请稍后再试。')
    this.limits.set(key, { ...v, count: v.count + 1 })
  }

  private remember(req: IncomingMessage, data: Omit<Pending, 'expires' | 'origin' | 'client'>): string {
    const now = Date.now()
    for (const [id, p] of this.pending) if (p.expires < now) this.pending.delete(id)
    if (this.pending.size >= 256) throw new AuthError(429, '登录请求过多，请稍后再试。')
    const id = token()
    this.pending.set(id, { ...data, expires: now + CHALLENGE_AGE, origin: this.requestOrigin(req)!, client: req.socket.remoteAddress ?? '' })
    return id
  }

  private consume(req: IncomingMessage, id: unknown, kind: Pending['kind']): Pending {
    if (typeof id !== 'string') throw new AuthError(400, '请重新开始验证。')
    const p = this.pending.get(id)
    if (p && p.client === (req.socket.remoteAddress ?? '') && p.origin === this.requestOrigin(req)) this.pending.delete(id)
    if (!p || p.kind !== kind || p.origin !== this.requestOrigin(req) || p.expires < Date.now() ||
      p.client !== (req.socket.remoteAddress ?? '') || (kind === 'register' && p.session !== this.sessionID(req))) {
      throw new AuthError(400, '验证已过期，请重试。')
    }
    return p
  }

  private checkPassword(value: unknown, user: unknown = this.username): void {
    if (typeof value !== 'string' || typeof user !== 'string' || user.length > 256 || value.length > 1024 ||
      !checkBasicAuth('Basic ' + Buffer.from(user + ':' + value).toString('base64'), this.username, this.password)) {
      throw new AuthError(401, '账号或密码不正确。')
    }
  }

  private keys(): Key[] { return this.state.keys.filter(k => k.owner === this.owner) }

  async route(req: IncomingMessage, res: ServerResponse, path: string): Promise<void> {
    try {
      if (!this.requestOrigin(req)) throw new AuthError(400, '登录入口无效。')
      const passkey = this.passkeysAvailable(req)
      const password = this.passwordAvailable(req)
      const session = this.hasSession(req)
      const method = req.method
      if ((method === 'GET' || method === 'HEAD') && (path === LOGIN || path === LOGIN + '/keys' || path === LOGIN + '/client.js')) {
        const resumeKeys = passkey && new URL(req.url ?? LOGIN, 'http://local.invalid').searchParams.get('continue') === 'keys'
        if (path.endsWith('/keys') && !session) {
          res.writeHead(303, { Location: passkey ? LOGIN + '?continue=keys' : LOGIN, 'Cache-Control': 'no-store' }); res.end(); return
        }
        if (path === LOGIN && session) {
          res.writeHead(303, { Location: resumeKeys ? LOGIN + '/keys' : '/', 'Cache-Control': 'no-store' }); res.end(); return
        }
        const js = path.endsWith('.js')
        res.writeHead(200, {
          'Content-Type': js ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'",
          'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
        })
        res.end(method === 'HEAD' ? undefined : js
          ? (typeof DSH_PROXY_AUTH_CLIENT_JS === 'string' ? DSH_PROXY_AUTH_CLIENT_JS : '')
          : authPage(path.endsWith('/keys'), passkey, resumeKeys, password, this.origin?.origin,
            this.untrustedExternal(req)))
        return
      }
      if (method !== 'POST') throw new AuthError(404, '页面不存在。')
      if (!this.sameOrigin(req, true)) throw new AuthError(403, '请求来源不匹配。')
      const body = await readJSON(req)
      if (path === LOGIN + '/password') {
        if (!password) throw new AuthError(403, '此入口未启用密码登录。')
        this.limited(req, 'password', 12)
        if (typeof body.username !== 'string') throw new AuthError(401, '账号或密码不正确。')
        this.checkPassword(body.password, body.username)
        res.setHeader('Set-Cookie', this.issue(req))
        json(res, 200, { next: passkey && (body.resumeKeys === true || !this.keys().some(k => k.rpID === this.origin!.hostname)) ? LOGIN + '/keys' : '/' })
        return
      }
      if (path === LOGIN + '/logout') {
        const id = this.sessionID(req)
        if (id && session) {
          const sessions = { ...this.state.sessions }; delete sessions[id]
          this.save({ ...this.state, sessions })
        }
        res.setHeader('Set-Cookie', this.cookie(req, '', 0))
        json(res, 200, { next: LOGIN }); return
      }
      if (!passkey) throw new AuthError(403, '此地址未启用 HTTPS Passkey。')
      const rpID = this.origin!.hostname
      const expectedOrigin = this.origin!.origin
      const keys = this.keys().filter(k => k.rpID === rpID)
      if (path === LOGIN + '/passkey/options') {
        this.limited(req, 'challenge', 40)
        if (!keys.length) throw new AuthError(409, '请先用密码登录并添加 Passkey。')
        const options = await generateAuthenticationOptions({ rpID, userVerification: 'required', timeout: CHALLENGE_AGE,
          allowCredentials: keys.map(k => ({ id: k.id, transports: k.transports })) })
        json(res, 200, { id: this.remember(req, { kind: 'login', challenge: options.challenge }), options }); return
      }
      if (path === LOGIN + '/passkey/verify') {
        this.limited(req, 'verify', 24)
        const p = this.consume(req, body.id, 'login')
        const response = body.credential as AuthenticationResponseJSON
        const key = keys.find(k => k.id === response?.id)
        if (!key) throw new AuthError(401, 'Passkey 验证失败。')
        const result = await verifyAuthenticationResponse({ response, expectedChallenge: p.challenge, expectedOrigin, expectedRPID: rpID,
          credential: { id: key.id, publicKey: Buffer.from(key.publicKey, 'base64url'), counter: key.counter, transports: key.transports },
          requireUserVerification: true })
        const current = this.state.keys.find(k => k.id === key.id && k.owner === this.owner)
        if (!result.verified || !current || (result.authenticationInfo.newCounter > 0 &&
          result.authenticationInfo.newCounter <= current.counter)) throw new AuthError(401, 'Passkey 验证失败。')
        this.save({ ...this.state, keys: this.state.keys.map(k => k === current ? { ...k, counter: result.authenticationInfo.newCounter } : k) })
        res.setHeader('Set-Cookie', this.issue(req, key.id))
        json(res, 200, { next: body.resumeKeys === true ? LOGIN + '/keys' : '/' }); return
      }
      if (!session) throw new AuthError(401, '请先登录。')
      if (path === LOGIN + '/keys/list') {
        json(res, 200, { keys: this.keys().map(({ id, label, created }) => ({ id, label, created })), max: MAX_PASSKEYS }); return
      }
      if (path === LOGIN + '/keys/options') {
        this.limited(req, 'password', 12)
        this.checkPassword(body.password)
        if (this.keys().length >= MAX_PASSKEYS) throw new AuthError(409, '最多添加 5 个 Passkey，请先删除一个。')
        const label = typeof body.label === 'string' ? body.label.trim().slice(0, 60) : ''
        const options = await generateRegistrationOptions({ rpName: 'DeepSeek Harness', rpID,
          userName: this.username, userID: Buffer.from(this.owner, 'hex'), timeout: CHALLENGE_AGE, attestationType: 'none',
          authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
          excludeCredentials: keys.map(k => ({ id: k.id, transports: k.transports })) })
        json(res, 200, { id: this.remember(req, { kind: 'register', challenge: options.challenge, session: this.sessionID(req), label }), options }); return
      }
      if (path === LOGIN + '/keys/verify') {
        const p = this.consume(req, body.id, 'register')
        const response = body.credential as RegistrationResponseJSON
        const result = await verifyRegistrationResponse({ response, expectedChallenge: p.challenge, expectedOrigin, expectedRPID: rpID, requireUserVerification: true })
        if (!result.verified || !result.registrationInfo || !this.hasSession(req)) throw new AuthError(401, 'Passkey 验证失败。')
        if (this.keys().length >= MAX_PASSKEYS) throw new AuthError(409, '最多添加 5 个 Passkey，请先删除一个。')
        const c = result.registrationInfo.credential
        if (this.state.keys.some(k => k.id === c.id)) throw new AuthError(409, '这个 Passkey 已存在。')
        this.save({ ...this.state, keys: [...this.state.keys, { id: c.id, publicKey: Buffer.from(c.publicKey).toString('base64url'),
          counter: c.counter, transports: c.transports?.filter((v): v is AuthenticatorTransport => knownTransports.has(v)),
          rpID, owner: this.owner, label: p.label || 'Passkey', created: Date.now() }] })
        json(res, 200, { ok: true }); return
      }
      if (path === LOGIN + '/keys/remove') {
        this.limited(req, 'password', 12)
        this.checkPassword(body.password)
        const key = this.keys().find(k => k.id === body.id)
        if (!key) throw new AuthError(404, '没有找到这个 Passkey。')
        if (!this.policy.password && key.rpID === rpID && keys.length <= 1) {
          throw new AuthError(409, '当前仅允许 Passkey 登录，不能移除最后一个可用的 Passkey。')
        }
        this.save({ ...this.state, keys: this.state.keys.filter(k => k !== key),
          sessions: Object.fromEntries(Object.entries(this.state.sessions).filter(([, s]) => s.credential !== key.id)) })
        json(res, 200, { ok: true, reauthenticate: !this.hasSession(req) }); return
      }
      throw new AuthError(404, '页面不存在。')
    } catch (err) {
      if (res.destroyed) return
      if (err instanceof AuthError) json(res, err.status, { error: err.message })
      else json(res, 400, { error: '无法完成验证，请重试。' })
    }
  }
}
