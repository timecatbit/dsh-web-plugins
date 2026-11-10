# DSH Web Plugins

[简体中文](README.md) · [MIT license](LICENSE) · [Download releases](https://github.com/timecatbit/dsh-web-plugins/releases/latest)

Two optional extensions for the DeepSeek Harness web app. Mobile Layout does not require Passkeys, a proxy, or a domain. Open the original DSH address as usual, including an IP and port if DSH is already reachable on your LAN.

**Install on the machine running `dsh web`, then add the website to your Home Screen or Dock in Safari.** This project supports `dsh web` only. It does not provide an installation channel for the Electron desktop app; its `desktop` profile is managed by Electron and is rejected by the CLI.

| Extension | Release file |
| --- | --- |
| Mobile settings, drawers, and input layout | `dsh-ui-mobile-0.1.8-mobile.14.tgz` |
| LAN reverse proxy with password and HTTPS Passkey sign-in | `smanx-dsh-proxy-0.1.7-passkeys.3.tgz` |

Tested `dsh web` versions: **0.2.1-rc.5 and 0.2.2-rc.1**. New release candidates must be verified before expanding the Mobile Layout compatibility range. Follow the Node.js requirement of your DSH CLI version.

## Installation

Install on the machine running `dsh web`, with the same OS account and `DSH_HOME` (default: `~/.dsh`). If your web process uses a custom profile, replace `web` with its name. From the directory containing the downloaded assets, run either or both commands:

```bash
dsh plugin --profile web add "$PWD/dsh-ui-mobile-0.1.8-mobile.14.tgz"
dsh plugin --profile web add "$PWD/smanx-dsh-proxy-0.1.7-passkeys.3.tgz"
```

Restart the same `dsh web` process and reopen the page. Refreshing the browser alone will not load newly installed bundles. The packages replace the corresponding upstream plugin in the same profile. To roll back, reinstall the previous trusted package into that profile and restart the process. Older proxy builds without the sign-in switches do not enforce Passkey-only mode.

## Save the website as an app in Safari

1. In Safari, open the DSH website you normally use. If you configured the Passkey proxy, open your HTTPS address. Save the regular URL, not a launch link containing `?token=`.
2. **iPhone or iPad:** choose **Share → Add to Home Screen**, enable **Open as Web App** if shown, and tap **Add**. Open it from its Home Screen icon. [Apple instructions](https://support.apple.com/guide/iphone/bookmark-a-website-iph42ab2f3a7/ios)
3. **Mac (macOS Sonoma 14 or later):** choose **File → Add to Dock** in Safari, or choose **Add to Dock** from the Share menu. [Apple instructions](https://support.apple.com/104996)

The icon opens the same `dsh web` site. Safari does not install server plugins or modify the Electron profile. Mobile Layout mainly applies below 768 CSS pixels, with additional support for some touch devices in landscape. A normal wide desktop window will not show the mobile layout.

## Passkey proxy setup

The proxy reads `dsh-proxy.json` from the DSH data root (default: `~/.dsh/dsh-proxy.json`). Profiles sharing that root also share the proxy settings and credential records. Existing settings still apply. If another instance already listens on the same address and port (default: `3081`), the second proxy cannot start. For a single access point, install the proxy only into the profile that serves it.

The proxy defaults to `0.0.0.0:3081`. For local testing, explicitly set `listenHost` to `127.0.0.1` before loading the plugin. Turn off the advanced launch-token option if you want DSH to keep its separate check. The proxy still requires its own authentication. Do not expose plain HTTP to the public internet.

Set the proxy username and password from the original DSH page under **Settings → LAN Proxy**. The proxy blocks unauthenticated access before setup. On a trusted LAN, you can use password sign-in at `http://SERVER-IP:3081`; the proxy verifies its own password and issues a session cookie before forwarding to DSH. Plain HTTP does not encrypt credentials. The advanced launch-token option allows the proxy to complete DSH's separate check after authenticating the visitor.

For HTTPS, preserve `Host`, set `X-Forwarded-Proto: https`, and forward WebSocket upgrades. Set the public HTTPS origin in **Access addresses**. If your reverse proxy connects via local loopback, leave the IP field blank; only `127.0.0.1` and `::1` are trusted in that case. For remote or container peers, enter the actual source IPs. To find a candidate, save the origin, visit it in another tab, and use **Check recent proxy sources**. Review the suggestion before trusting it.

Password and Passkey sign-in have separate switches, and at least one must stay on. Enable Passkeys, then enroll and test one at the HTTPS site before turning off passwords. With password sign-in off, LAN HTTP sign-in also stops; the password can still authorize credential management. In Passkey-only mode the final usable credential cannot be removed. HTTPS remains usable with password-only sign-in. Environment variables `DSH_PROXY_PASSKEY_ORIGIN` and `DSH_PROXY_TLS_PROXIES` override the two address fields, not the sign-in switches.

Derived from [smanx/dsh-proxy](https://github.com/smanx/dsh-proxy) and [jasondu/dsh-ui-mobile](https://github.com/jasondu/dsh-ui-mobile). Upstream MIT licenses are included in both packages. See [BUILDING.md](BUILDING.md) for reproducible build inputs and verification steps.
