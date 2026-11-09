/**
 * Persisted runtime settings for the LAN proxy: a small JSON file under the
 * DSH home that overlays the cordis config. The settings page writes here so
 * changes survive `dsh web` restarts; the file is the single source of truth
 * for the runtime overrides (proxy listen port, username, password).
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { isIP } from 'node:net'
import type { LanProxyUpdatePayload } from './contract.ts'

/** The on-disk shape (a subset of the update payload; no derived fields). */
export interface PersistedRuntimeSettings {
  /** Proxy listen port override. */
  listenPort?: number
  /** Deprecated forward-target override, kept for legacy persisted files. */
  upstreamPort?: number
  username?: string
  password?: string
  /** Launch-token auto-login override; see LanProxyUpdatePayload. */
  skipLaunchToken?: boolean
  passkeyOrigin?: string
  tlsProxyIPs?: string
}

export function parsePasskeyOrigin(value: string): URL {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
    isIP(url.hostname.replace(/^\[|\]$/g, '')) || (!url.hostname.includes('.') && url.hostname !== 'localhost')) {
    throw new Error('Passkey origin must be a single HTTPS DNS origin')
  }
  return url
}

/** Tolerant read of an unknown JSON value into the persisted shape. */
export function normalizeRuntimeSettings(raw: unknown): PersistedRuntimeSettings {
  if (typeof raw !== 'object' || raw === null) return {}
  const source = raw as Record<string, unknown>
  const out: PersistedRuntimeSettings = {}
  if (typeof source.listenPort === 'number' && Number.isInteger(source.listenPort)) {
    out.listenPort = source.listenPort
  }
  if (typeof source.upstreamPort === 'number' && Number.isInteger(source.upstreamPort)) {
    out.upstreamPort = source.upstreamPort
  }
  if (typeof source.username === 'string') out.username = source.username
  if (typeof source.password === 'string') out.password = source.password
  if (typeof source.skipLaunchToken === 'boolean') out.skipLaunchToken = source.skipLaunchToken
  if (typeof source.passkeyOrigin === 'string') out.passkeyOrigin = source.passkeyOrigin
  if (typeof source.tlsProxyIPs === 'string') out.tlsProxyIPs = source.tlsProxyIPs
  return out
}

/**
 * Read/write access to the persisted settings file. Writes are atomic
 * (temp file + rename) so a crash never leaves a truncated JSON behind.
 */
export class RuntimeSettingsFile {
  constructor(private readonly filePath: string) {}

  read(): PersistedRuntimeSettings {
    let text: string
    try {
      text = readFileSync(this.filePath, 'utf8')
    } catch {
      return {}
    }
    try {
      return normalizeRuntimeSettings(JSON.parse(text))
    } catch {
      return {}
    }
  }

  write(settings: PersistedRuntimeSettings): void {
    mkdirSync(dirname(this.filePath), { recursive: true })
    const temp = `${this.filePath}.tmp`
    writeFileSync(temp, JSON.stringify(settings, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 })
    renameSync(temp, this.filePath)
  }
}

export type UpdateValidation =
  | { ok: true; patch: Required<Pick<LanProxyUpdatePayload, 'listenPort' | 'upstreamPort' | 'username' | 'password' | 'skipLaunchToken'>> & LanProxyUpdatePayload }
  | { ok: false; message: string }

const MAX_USERNAME_LENGTH = 64
const MAX_PASSWORD_LENGTH = 128

/**
 * Validate an update payload from the settings page.
 * @param payload - the raw RPC payload.
 * @param currentListenPort - the proxy's current listen port.
 * @param currentUpstreamPort - the current forward-target (default service) port.
 * @returns the normalized patch, or a user-facing rejection message.
 */
export function validateUpdate(
  payload: unknown,
  currentListenPort: number,
  currentUpstreamPort: number,
): UpdateValidation {
  if (typeof payload !== 'object' || payload === null) {
    return { ok: false, message: '请求体必须是对象' }
  }
  const input = payload as Record<string, unknown>
  const patch: LanProxyUpdatePayload = {}

  if (input.listenPort !== undefined) {
    const port = input.listenPort
    if (typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535) {
      return { ok: false, message: `代理服务端口无效：${String(port)}（需要 1–65535 的整数）` }
    }
    if (port === currentUpstreamPort) {
      return { ok: false, message: `代理服务端口不能与默认服务端口相同（都是 ${port}）` }
    }
    patch.listenPort = port
  }

  // Deprecated forward-target patch, accepted for legacy persisted configs
  // and scripts; the settings page no longer edits this port.
  if (input.upstreamPort !== undefined) {
    const port = input.upstreamPort
    if (typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535) {
      return { ok: false, message: `转发目标端口无效：${String(port)}（需要 1–65535 的整数）` }
    }
    if (port === currentListenPort) {
      return { ok: false, message: `转发目标端口不能与代理服务端口相同（都是 ${port}）` }
    }
    patch.upstreamPort = port
  }

  if (input.username !== undefined) {
    if (typeof input.username !== 'string') return { ok: false, message: '用户名必须是字符串' }
    if (input.username.length > MAX_USERNAME_LENGTH) {
      return { ok: false, message: `用户名过长（最多 ${MAX_USERNAME_LENGTH} 个字符）` }
    }
    patch.username = input.username
  }

  if (input.password !== undefined) {
    if (typeof input.password !== 'string') return { ok: false, message: '密码必须是字符串' }
    if (input.password.length > MAX_PASSWORD_LENGTH) {
      return { ok: false, message: `密码过长（最多 ${MAX_PASSWORD_LENGTH} 个字符）` }
    }
    patch.password = input.password
  }

  if (input.skipLaunchToken !== undefined) {
    if (typeof input.skipLaunchToken !== 'boolean') {
      return { ok: false, message: '免 token 登录开关必须是布尔值' }
    }
    patch.skipLaunchToken = input.skipLaunchToken
  }

  if (input.passkeyOrigin !== undefined) {
    if (typeof input.passkeyOrigin !== 'string' || input.passkeyOrigin.length > 512) return { ok: false, message: '请输入完整的 HTTPS 域名。' }
    try {
      const origin = input.passkeyOrigin.trim()
      patch.passkeyOrigin = origin ? parsePasskeyOrigin(origin).origin : ''
    } catch {
      return { ok: false, message: 'HTTPS 地址应类似 https://dsh.example.com，不带路径。' }
    }
  }
  if (input.tlsProxyIPs !== undefined) {
    if (typeof input.tlsProxyIPs !== 'string' || input.tlsProxyIPs.length > 512) return { ok: false, message: '请输入反向代理的实际 IP。' }
    const ips = input.tlsProxyIPs.split(',').map(ip => ip.trim()).filter(Boolean)
    if (ips.length > 8 || ips.some(ip => !isIP(ip))) return { ok: false, message: '请填写实际 IPv4 或 IPv6 地址，多个用英文逗号隔开，不支持网段。' }
    patch.tlsProxyIPs = [...new Set(ips)].join(', ')
  }

  if (
    patch.listenPort === undefined
    && patch.upstreamPort === undefined
    && patch.username === undefined
    && patch.password === undefined
    && patch.skipLaunchToken === undefined
    && patch.passkeyOrigin === undefined
    && patch.tlsProxyIPs === undefined
  ) {
    return { ok: false, message: '没有可保存的修改' }
  }
  return {
    ok: true,
    patch: patch as Required<Pick<LanProxyUpdatePayload, 'listenPort' | 'upstreamPort' | 'username' | 'password' | 'skipLaunchToken'>> & LanProxyUpdatePayload,
  }
}
