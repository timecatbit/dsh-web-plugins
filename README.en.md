# DSH Web Plugins

[简体中文](README.md) · [MIT license](LICENSE) · [Download releases](https://github.com/timecatbit/dsh-web-plugins/releases/latest)

Two optional extensions for the DeepSeek Harness web app. Mobile Layout does not require Passkeys, a proxy, or a domain. Open the original DSH address as usual, including an IP and port if DSH is already reachable on your LAN.

| Extension | Release file |
| --- | --- |
| Mobile settings, drawers, and input layout | `dsh-ui-mobile-0.1.8-mobile.10.tgz` |
| LAN reverse proxy with password and HTTPS Passkey sign-in | `smanx-dsh-proxy-0.1.7-passkeys.3.tgz` |

Supported DSH versions: **0.2.1-rc.5 and 0.2.2-rc.1**. Verify other versions before use. The proxy targets Node.js 22 or later.

From the directory containing the downloaded assets, run either or both commands, then restart the existing DSH web process:

```bash
dsh plugin --profile web add "$PWD/dsh-ui-mobile-0.1.8-mobile.10.tgz"
dsh plugin --profile web add "$PWD/smanx-dsh-proxy-0.1.7-passkeys.3.tgz"
```

The packages use their upstream plugin IDs and replace the corresponding upstream version in the same profile. To roll back, reinstall the previous trusted package with the same command and restart DSH. Older proxy builds without the sign-in switches do not enforce Passkey-only mode.

Set the proxy username and password from the original DSH page under **Settings → LAN Proxy**. The proxy blocks unauthenticated access before setup. On a trusted LAN, you can use password sign-in at `http://SERVER-IP:3081`; the proxy verifies its own password and issues a session cookie before forwarding to DSH. Plain HTTP does not encrypt credentials. The advanced launch-token option allows the proxy to complete DSH's separate check after authenticating the visitor.

For HTTPS, preserve `Host`, set `X-Forwarded-Proto: https`, and forward WebSocket upgrades. Set the public HTTPS origin in **Access addresses**. If your reverse proxy connects via local loopback, leave the IP field blank; only `127.0.0.1` and `::1` are trusted in that case. For remote or container peers, enter the actual source IPs. To find a candidate, save the origin, visit it in another tab, and use **Check recent proxy sources**. Review the suggestion before trusting it.

Password and Passkey sign-in have separate switches, and at least one must stay on. Enable Passkeys, then enroll and test one at the HTTPS site before turning off passwords. With password sign-in off, LAN HTTP sign-in also stops; the password can still authorize credential management. In Passkey-only mode the final usable credential cannot be removed. HTTPS remains usable with password-only sign-in. Environment variables `DSH_PROXY_PASSKEY_ORIGIN` and `DSH_PROXY_TLS_PROXIES` override the two address fields, not the sign-in switches.

Derived from [smanx/dsh-proxy](https://github.com/smanx/dsh-proxy) and [jasondu/dsh-ui-mobile](https://github.com/jasondu/dsh-ui-mobile). Upstream MIT licenses are included in both packages. See [BUILDING.md](BUILDING.md) for reproducible build inputs and verification steps.
