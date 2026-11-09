/**
 * ProxyController: owns the lifecycle of the LAN proxy inside the harness —
 * effective options (cordis config overlaid with the persisted runtime
 * settings), start/stop/restart, and the status/update verbs the settings
 * page calls. No cordis dependency: the plugin entry in index.ts wires it
 * into the harness, which keeps every business rule unit-testable against a
 * real in-process upstream.
 */
import { lanAddresses, startLanProxy, type LanProxyHandle } from './proxy.ts'
import { RuntimeSettingsFile, trustedProxyIPs, validateUpdate } from './settings.ts'
import { registeredPasskeyCount } from './browser-auth.ts'
import type { LanProxyStatus, LanProxyUpdatePayload, LanProxyUpdateResult } from './contract.ts'
import { dirname, join } from 'node:path'

/** The fully-resolved runtime options of one proxy instance. */
export interface EffectiveProxyOptions {
  listenHost: string
  listenPort: number
  upstreamHost: string
  upstreamPort: number
  username: string
  password: string
  launchToken?: string
  /** Whether launch-token auto-login is enabled. */
  skipLaunchToken?: boolean
  passkeyOrigin?: string
  tlsProxyIPs?: string
  passwordLoginEnabled?: boolean
  passkeyLoginEnabled?: boolean
}

export interface ProxyControllerOptions {
  /** Options from the cordis config (schema defaults applied, upstream port resolved). */
  base: EffectiveProxyOptions
  /** Path of the persisted runtime-settings JSON. */
  settingsFile: string
  /** Log sink (the plugin passes ctx.logger-based printer). */
  log: (level: 'info' | 'warn' | 'error', message: string) => void
  /**
   * Re-reads the host's current launch token. Called when the proxy starts
   * with auto-login on, and again whenever the settings page turns the flag on
   * — the token is per-process, so it is never persisted, only the flag is.
   */
  readLaunchToken?: () => string | undefined
}

export type UpdateOutcome =
  | { ok: true; result: LanProxyUpdateResult }
  | { ok: false; message: string }

/** Result of one start attempt: a failed bind reports the reason instead of passing silently. */
export type StartOutcome =
  | { ok: true }
  | { ok: false; message: string }

/** Upstream reachability probe: connection timeout. */
const PROBE_TIMEOUT_MS = 1500
/** Upstream reachability probe: result cache lifetime. */
const PROBE_CACHE_MS = 3000

export class ProxyController {
  private handle: LanProxyHandle | null = null
  private boundPort: number | null = null
  private probeCache: { at: number; reachable: boolean } | null = null
  private readonly settings: RuntimeSettingsFile
  private readonly log: ProxyControllerOptions['log']
  private options: EffectiveProxyOptions
  private readonly passkeySettingsManaged = process.env.DSH_PROXY_PASSKEY_ORIGIN !== undefined ||
    process.env.DSH_PROXY_TLS_PROXIES !== undefined

  constructor(private readonly opts: ProxyControllerOptions) {
    this.log = opts.log
    this.settings = new RuntimeSettingsFile(opts.settingsFile)
    this.options = { ...opts.base }
    const persisted = this.settings.read()
    if (persisted.listenPort !== undefined) this.options.listenPort = persisted.listenPort
    if (persisted.upstreamPort !== undefined) this.options.upstreamPort = persisted.upstreamPort
    if (persisted.username !== undefined) this.options.username = persisted.username
    if (persisted.password !== undefined) this.options.password = persisted.password
    // The launch token itself is never persisted (it is per-process and the
    // host re-reads it on every start); only the flag is. Turning the flag on
    // while no token was supplied keeps auto-login off until the token can be
    // read, which `start()` and `update()` both do.
    if (persisted.skipLaunchToken !== undefined) this.options.skipLaunchToken = persisted.skipLaunchToken
    this.options.passkeyOrigin = process.env.DSH_PROXY_PASSKEY_ORIGIN ?? persisted.passkeyOrigin
    this.options.tlsProxyIPs = process.env.DSH_PROXY_TLS_PROXIES ?? persisted.tlsProxyIPs
    this.options.passwordLoginEnabled = persisted.passwordLoginEnabled ?? true
    this.options.passkeyLoginEnabled = persisted.passkeyLoginEnabled ?? Boolean(this.options.passkeyOrigin)
  }

  private get authFile(): string { return join(dirname(this.opts.settingsFile), 'dsh-proxy-auth.json') }

  /** Whether a persisted runtime override exists (drives the status flag). */
  private persisted(): boolean {
    const current = this.settings.read()
    return current.listenPort !== undefined
      || current.upstreamPort !== undefined
      || current.username !== undefined
      || current.password !== undefined
      || current.skipLaunchToken !== undefined
      || current.passkeyOrigin !== undefined
      || current.tlsProxyIPs !== undefined
      || current.passwordLoginEnabled !== undefined
      || current.passkeyLoginEnabled !== undefined
  }

  /**
   * Start the proxy (idempotent). Listen errors — the port is already taken,
   * e.g. by the standalone dsh-proxy — are logged loudly and reported through
   * the outcome (never thrown), so a failed forwarder can never take down the
   * web app boot while callers still learn why the listener is down.
   */
  async start(): Promise<StartOutcome> {
    if (this.handle !== null) return { ok: true }
    const log = this.log
    // Resolve the launch token HERE, not at construction: the read is deferred
    // until the harness is serving, and `start()` is the first point where the
    // webServer (and therefore BrowserAuth behind `connection`) is fully up.
    if (this.options.skipLaunchToken === true && this.opts.readLaunchToken !== undefined) {
      const token = this.opts.readLaunchToken()
      if (token === undefined || token === '') {
        log('warn', 'dsh-proxy: skipLaunchToken is on but the host supplied no launch token; the LAN surface still requires DSH authentication')
      } else {
        this.options.launchToken = token
        log('info', 'dsh-proxy: launch-token auto-login enabled — a first-time browser is authenticated without the token')
      }
    }
    const handle = startLanProxy({
      listenHost: this.options.listenHost,
      listenPort: this.options.listenPort,
      upstreamHost: this.options.upstreamHost,
      upstreamPort: this.options.upstreamPort,
      username: this.options.username,
      password: this.options.password,
      launchToken: this.options.launchToken,
      authFile: this.authFile,
      passkeyOrigin: this.options.passkeyOrigin || undefined,
      trustedTLSProxyIPs: trustedProxyIPs(this.options.tlsProxyIPs),
      loginPolicy: {
        password: this.options.passwordLoginEnabled === true,
        passkey: this.options.passkeyLoginEnabled === true,
      },
      log,
    })
    this.handle = handle
    try {
      const bound = await handle.ready
      this.boundPort = bound
      const urls = handle.describeUrls(bound)
      log('info', `dsh-proxy: listening on ${this.options.listenHost}:${bound} -> http://${this.options.upstreamHost}:${this.options.upstreamPort}`)
      log('info', `dsh-proxy: 本机访问 ${urls.local}`)
      for (const url of urls.lan) log('info', `dsh-proxy: 局域网访问 ${url}`)
      if (!this.options.username || !this.options.password) log('warn', 'dsh-proxy: set proxy credentials from the original DSH page before using the proxy')
      if (this.options.launchToken !== undefined && this.options.launchToken !== '') {
        log('info', 'dsh-proxy: launch-token auto-login ON — a first-time browser is authenticated without the token')
      }
      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      log('error', `dsh-proxy: failed to listen on ${this.options.listenHost}:${this.options.listenPort}: ${message} — stop any other dsh-proxy on this port, or change listenPort`)
      this.handle = null
      return {
        ok: false,
        message: `无法监听 ${this.options.listenHost}:${this.options.listenPort}：${message}。该端口可能已被占用，请更换代理服务端口或释放该端口后重试。`,
      }
    }
  }

  /** Stop the proxy and every upgraded socket. */
  async stop(): Promise<void> {
    const handle = this.handle
    this.handle = null
    this.boundPort = null
    if (handle !== null) await handle.close()
  }

  /** Stop and start again with the current effective options (the "restart the forwarding service" verb). */
  async restart(): Promise<StartOutcome> {
    await this.stop()
    return this.start()
  }

  /**
   * Stop the proxy AFTER the caller's response has flushed back. The stop RPC
   * answer travels through the proxy itself when the settings page is reached
   * via the LAN URL, so closing the listener before the response is written
   * would drop it; the listener is torn down shortly afterwards instead.
   * @param delayMs - grace before the listener closes (defaults to 300ms).
   * @returns the status as it will be once stopped.
   */
  stopDeferred(delayMs = 300): LanProxyStatus {
    const stopped: LanProxyStatus = { ...this.status(), proxyListening: false }
    const timer = setTimeout(() => {
      void this.stop()
    }, delayMs)
    timer.unref?.()
    return stopped
  }

  /**
   * Current read-only status for the settings page. `upstreamReachable`
   * reflects the most recent probe (false until the first probe runs).
   */
  status(): LanProxyStatus {
    return {
      listenHost: this.options.listenHost,
      listenPort: this.boundPort ?? this.options.listenPort,
      proxyListening: this.boundPort !== null,
      upstreamHost: this.options.upstreamHost,
      upstreamPort: this.options.upstreamPort,
      upstreamReachable: this.probeCache?.reachable ?? false,
      username: this.options.username,
      password: '',
      passwordConfigured: !!this.options.password,
      passwordLoginEnabled: this.options.passwordLoginEnabled,
      passkeyLoginEnabled: this.options.passkeyLoginEnabled,
      authEnabled: Boolean((this.options.passwordLoginEnabled && this.options.username && this.options.password) ||
        (this.options.passkeyLoginEnabled && this.options.passkeyOrigin)),
      skipLaunchToken: this.options.skipLaunchToken === true,
      persisted: this.persisted(),
      passkeyOrigin: this.options.passkeyOrigin ?? '',
      tlsProxyIPs: this.options.tlsProxyIPs ?? '',
      passkeySettingsManaged: this.passkeySettingsManaged,
      registeredPasskeys: registeredPasskeyCount(this.authFile, this.options.username, this.options.passkeyOrigin),
      observedProxyIPs: this.handle?.observedProxyIPs() ?? [],
    }
  }

  /**
   * Status with a fresh upstream reachability probe (cached for a few
   * seconds so repeated settings-page loads do not hammer the target).
   */
  async refreshStatus(): Promise<LanProxyStatus> {
    await this.probeUpstream()
    return this.status()
  }

  /**
   * Probe whether the target upstream service answers HTTP. Any response —
   * even an error status — counts as reachable; only connection failures and
   * timeouts turn the light red.
   */
  private async probeUpstream(): Promise<boolean> {
    const now = Date.now()
    if (this.probeCache !== null && now - this.probeCache.at < PROBE_CACHE_MS) {
      return this.probeCache.reachable
    }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
    let reachable = false
    try {
      const res = await fetch(
        `http://${this.options.upstreamHost}:${this.options.upstreamPort}/favicon.svg`,
        { signal: controller.signal, redirect: 'manual' },
      )
      reachable = true
      await res.body?.cancel().catch(() => {})
    } catch {
      reachable = false
    } finally {
      clearTimeout(timer)
    }
    this.probeCache = { at: now, reachable }
    return reachable
  }

  /**
   * Apply an update payload: validate, persist, then restart the forwarding
   * service with the new effective options.
   * @param payload - raw RPC payload from the settings page.
   * @returns the new status, or a user-facing rejection message.
   */
  async update(payload: unknown, deferRestart = false): Promise<UpdateOutcome> {
    // Validate against the actually bound port: with listenPort 0 the OS
    // assigns the port, and the configured 0 must never be the comparison.
    const check = validateUpdate(
      payload,
      this.boundPort ?? this.options.listenPort,
      this.options.upstreamPort,
    )
    if (!check.ok) return { ok: false, message: check.message }
    const patch = check.patch as LanProxyUpdatePayload
    const currentListenPort = this.boundPort ?? this.options.listenPort
    const currentUpstreamPort = this.options.upstreamPort
    if (this.passkeySettingsManaged && (patch.passkeyOrigin !== undefined || patch.tlsProxyIPs !== undefined)) {
      return { ok: false, message: 'Passkey 入口由服务环境变量管理。' }
    }
    const origin = patch.passkeyOrigin ?? this.options.passkeyOrigin
    const proxies = patch.tlsProxyIPs ?? this.options.tlsProxyIPs
    const passwordLogin = patch.passwordLoginEnabled ?? this.options.passwordLoginEnabled
    const passkeyLogin = patch.passkeyLoginEnabled ?? this.options.passkeyLoginEnabled
    const username = patch.username ?? this.options.username
    const password = patch.password ?? this.options.password
    if (!passwordLogin && !passkeyLogin) return { ok: false, message: '至少保留一种登录方式。' }
    if (passkeyLogin && !origin) return { ok: false, message: '开启 Passkey 前，请先填写 HTTPS 域名。' }
    if (proxies && !origin) return { ok: false, message: '填写反代来源 IP 前，请先填写 HTTPS 域名。' }
    if (!username || !password) {
      return { ok: false, message: '请设置账号和密码。关闭密码登录时，密码仍用于管理 Passkey。' }
    }
    if (!passwordLogin && (origin !== this.options.passkeyOrigin ||
      trustedProxyIPs(proxies).join(',') !== trustedProxyIPs(this.options.tlsProxyIPs).join(',') ||
      username !== this.options.username)) {
      return { ok: false, message: '请先保留或重新开启密码登录，再更改 HTTPS 域名、反代来源或账号。' }
    }
    if (!passwordLogin && registeredPasskeyCount(this.authFile, username, origin) < 1) {
      return { ok: false, message: '请先用当前 HTTPS 域名添加至少一个 Passkey，再关闭密码登录。' }
    }

    const next: LanProxyUpdatePayload = { ...this.settings.read(), ...patch }
    this.settings.write(next)

    if (patch.listenPort !== undefined) this.options.listenPort = patch.listenPort
    if (patch.upstreamPort !== undefined) this.options.upstreamPort = patch.upstreamPort
    if (patch.username !== undefined) this.options.username = patch.username
    if (patch.password !== undefined) this.options.password = patch.password
    if (patch.skipLaunchToken !== undefined) this.options.skipLaunchToken = patch.skipLaunchToken
    if (patch.passkeyOrigin !== undefined) this.options.passkeyOrigin = patch.passkeyOrigin
    if (patch.tlsProxyIPs !== undefined) this.options.tlsProxyIPs = patch.tlsProxyIPs
    if (patch.passwordLoginEnabled !== undefined) this.options.passwordLoginEnabled = patch.passwordLoginEnabled
    if (patch.passkeyLoginEnabled !== undefined) this.options.passkeyLoginEnabled = patch.passkeyLoginEnabled
    // Auto-login needs the actual token, which is read from the host (lazily,
    // because BrowserAuth only exists once the harness is serving). Re-read it
    // whenever the flag is being turned on so the settings page takes effect
    // without a dsh web restart; turning it OFF clears the cached token.
    if (patch.skipLaunchToken === true && this.opts.readLaunchToken !== undefined) {
      this.options.launchToken = this.opts.readLaunchToken() ?? this.options.launchToken
      if (this.options.launchToken === undefined || this.options.launchToken === '') {
        this.log('warn', 'dsh-proxy: the host supplied no launch token, so auto-login cannot take effect until dsh web restarts')
      }
    }
    if (patch.skipLaunchToken === false) this.options.launchToken = undefined

    // A running service must restart to pick up the new effective options; a
    // stopped service is just saved and stays stopped (starting it is the
    // explicit start control's job).
    const wasListening = this.boundPort !== null
    if (wasListening && (deferRestart || patch.passkeyOrigin !== undefined || patch.tlsProxyIPs !== undefined ||
      patch.passwordLoginEnabled !== undefined || patch.passkeyLoginEnabled !== undefined) &&
      this.options.listenPort === currentListenPort && this.options.upstreamPort === currentUpstreamPort) {
      // An RPC served through this very listener cannot finish if we close it
      // before replying. A same-port web update uses a deferred restart.
      const currentHandle = this.handle
      const timer = setTimeout(() => {
        if (this.handle === currentHandle) void this.restart()
      }, 350)
      timer.unref?.()
      return { ok: true, result: {
        status: this.status(), notice: 'saved-restart-pending', message: '已保存，代理即将重新连接。',
      } }
    }
    const startOutcome = wasListening ? await this.restart() : null
    this.probeCache = null
    this.log('info', `dsh-proxy: settings updated via the settings page; forwarding service ${startOutcome === null ? 'kept stopped' : startOutcome.ok ? 'restarted' : 'restart FAILED'}`)
    const bothSet = this.options.username !== '' && this.options.password !== ''
    const anySet = this.options.username !== '' || this.options.password !== ''
    const partial = anySet && !bothSet

    if (startOutcome !== null && !startOutcome.ok) {
      return {
        ok: true,
        result: {
          status: await this.refreshStatus(),
          notice: 'saved-restart-failed',
          message: startOutcome.message,
        },
      }
    }
    const notice: 'saved' | 'saved-restarted' | 'credentials-partial-saved' | 'credentials-partial-restarted'
      = startOutcome === null
        ? (partial ? 'credentials-partial-saved' : 'saved')
        : (partial ? 'credentials-partial-restarted' : 'saved-restarted')
    return {
      ok: true,
      result: {
        status: await this.refreshStatus(),
        notice,
        message: startOutcome === null
          ? (partial ? '已保存（注意：需同时设置用户名和密码才会启用密码登录）' : '已保存')
          : (partial ? '已保存并重启转发服务（注意：需同时设置用户名和密码才会启用密码登录）' : '已保存并重启转发服务'),
      },
    }
  }
}
