/**
 * Shared wire contract between the host plugin and its settings section:
 * the generic Connection RPC channel name, the endpoint names, and the
 * status/update payload shapes. Imported by both halves (type-only on the
 * client side — erased at build).
 */

/** Generic Connection RPC channel mounted by the host plugin. */
export const RPC_CHANNEL = '/dsh-proxy'
/** Endpoint: read the current proxy status. */
export const RPC_STATUS_ENDPOINT = 'status'
/** Endpoint: apply a settings patch and restart the forwarding service. */
export const RPC_UPDATE_ENDPOINT = 'update'
/** Endpoint: start the forwarding service (idempotent). */
export const RPC_START_ENDPOINT = 'start'
/** Endpoint: stop the forwarding service (the response is answered before the listener closes). */
export const RPC_STOP_ENDPOINT = 'stop'

/** Read-only status the settings section shows. */
export interface LanProxyStatus {
  /** Whether the Desktop-specific LAN binding control is available. */
  desktopProfile?: boolean
  /** Interface the proxy binds (0.0.0.0 = LAN reachable). */
  listenHost: string
  /** Port the proxy listens on (the OS-assigned value when 0 was configured). */
  listenPort: number
  /** Whether the proxy is actually bound (false = bind failed, e.g. port busy). */
  proxyListening: boolean
  /** Upstream DSH host. */
  upstreamHost: string
  /** Upstream DSH port the proxy forwards to. */
  upstreamPort: number
  /** Whether the target upstream service answers a probe. */
  upstreamReachable: boolean
  /** Login username currently enforced. */
  username: string
  /** Legacy response field; current servers return an empty string. */
  password: string
  /** Whether the auth gate is on (both credentials non-empty). */
  authEnabled: boolean
  /** Whether launch-token auto-login is on (DSH 0.2.x first-visit bypass). */
  skipLaunchToken: boolean
  /** Whether a persisted runtime override exists on top of the cordis config. */
  persisted: boolean
  passkeyOrigin?: string
  tlsProxyIPs?: string
  passkeySettingsManaged?: boolean
  passwordLoginEnabled?: boolean
  passkeyLoginEnabled?: boolean
  passwordConfigured?: boolean
  registeredPasskeys?: number
  observedProxyIPs?: string[]
}

/** Settings-section patch: only fields present are changed; omitted fields keep their values. */
export interface LanProxyUpdatePayload {
  /** Desktop only: explicitly listen on the LAN rather than loopback. */
  lanAccessEnabled?: boolean
  /** New proxy listen port (1–65535, must differ from the default service port). */
  listenPort?: number
  /**
   * Deprecated: new forward target port, kept so legacy persisted configs
   * and scripts still apply. The settings page no longer edits it — the
   * editable port is the proxy's own listen port.
   */
  upstreamPort?: number
  /** New login username. */
  username?: string
  /** New login password; an empty string clears it (auth needs a non-empty pair to stay on). */
  password?: string
  /**
   * Toggle launch-token auto-login: when true, the proxy appends DSH's launch
   * token to requests the upstream rejects with 401, so a first-time browser
   * is authenticated without anyone pasting the token. The host reads the
   * token from the Connection service when the forwarding service starts, so
   * turning the flag on restarts it and takes effect immediately.
   */
  skipLaunchToken?: boolean
  passkeyOrigin?: string
  tlsProxyIPs?: string
  passwordLoginEnabled?: boolean
  passkeyLoginEnabled?: boolean
}

/** Successful update response. */
export interface LanProxyUpdateResult {
  /** The status after the forwarding service restarted (or stayed stopped). */
  status: LanProxyStatus
  /**
   * Machine-readable outcome the settings page localizes into the UI language:
   * `saved`/`credentials-partial-saved` mean the service was stopped and was
   * merely saved (no restart); the `*-restarted` variants mean it was running
   * and got restarted; `saved-restart-failed` means a running service failed to
   * rebind and the reason rides in `message`.
   */
  notice:
    | 'saved'
    | 'saved-restarted'
    | 'saved-restart-pending'
    | 'saved-restart-failed'
    | 'credentials-partial-saved'
    | 'credentials-partial-restarted'
  /**
   * Deprecated human-readable confirmation (Chinese); kept for scripts. When
   * `notice` is `saved-restart-failed`, this carries the rebind error reason.
   */
  message: string
}
