# DSH Passkey Proxy

[简体中文](README.md) · [Releases](https://github.com/timecatbit/dsh-passkey-proxy/releases) · [MIT license](LICENSE)

A separate web entry for DeepSeek Harness (DSH) with LAN password sign-in, HTTPS Passkeys, and WebSocket forwarding. It works independently of [DSH Pocket UI](https://github.com/timecatbit/dsh-pocket-ui). A domain is optional for password access over a trusted LAN. Passkeys require a configured HTTPS domain trusted by the browser.

## Compatibility and installation

**Supported: DSH `0.2.1-rc.5` and every later version** (from 0.1.9). A new DSH release can install and enable the plugin right away. An untested release may show sign-in or connection problems; please [open an issue](https://github.com/timecatbit/dsh-passkey-proxy/issues) and a fix will ship as a new version.

**Tested versions** are the ones the plugin was actually installed and checked on. A DSH version missing from the table has not been tested yet. The "Tested on DSH …" tags on the Discover card show the same list.

| Environment | Tested DSH versions |
| --- | --- |
| Standalone Web (`dsh web`) | `0.2.1-rc.5`, `0.2.2-rc.1`, `0.2.2-rc.2`, `0.2.2-rc.3` |
| Official macOS desktop app (Apple Silicon) | `0.2.2-rc.1` |
| Official Windows desktop app | Not tested |

The package ID remains `@smanx/dsh-proxy`; upgrade it in the same profile to keep your settings.

1. Open **Plugins** from the sidebar. Under **Experimental plugins**, click **More** if the switch is hidden. Enable **Custom plugin markets** on `0.2.1-rc.5` or **Custom plugin indexes** on `0.2.2-rc.1` and later.
2. Open **Discover → Add index source** and add this URL once per profile. Pocket UI uses the same source.

   ```text
   https://raw.githubusercontent.com/timecatbit/dsh-web-plugins/main/plugin-index.json
   ```

3. Click the **DSH Passkey Proxy card title → Versions → Install**. Use the same path for updates without uninstalling first. Enable the plugin and restart the current instance if DSH prompts you.

**Manual install:** In the official macOS app, use **Plugins → Add plugin** and paste the [0.1.12 asset URL](https://github.com/timecatbit/dsh-passkey-proxy/releases/download/v0.1.12/smanx-dsh-proxy-0.1.12.tgz) or the absolute path of the downloaded file. Enable it and fully quit and reopen the app if prompted. For standalone Web, use the same system account and `DSH_HOME` as the web process. From the directory containing the download, run:

```bash
dsh plugin --profile web add "$PWD/smanx-dsh-proxy-0.1.12.tgz"
```

Replace `web` if you use a custom profile, then restart that web process. The standalone CLI does not manage the official app's `desktop` profile.

## Password sign-in on a LAN

1. From the original DSH app or website, open **Settings → LAN Proxy**. Set a proxy username and password and leave password sign-in enabled.
2. The proxy defaults to port `3081`, separate from the DSH host port. Desktop defaults to local-only listening; turn on **Allow access from devices on the local network** if your phone should connect. Save and check that the proxy is running.
3. From a phone on the same network, open `http://SERVER-LAN-IP:3081` (or your chosen port). The proxy verifies its own password, issues a session cookie, and forwards to DSH. Plain HTTP does not encrypt credentials; use it only on a trusted LAN.

If DSH still asks for its launch token after proxy sign-in, the advanced option **Open DSH automatically after sign-in** lets the proxy handle the token after it verifies you. Proxy authentication still applies. The desktop build defaults this option off; standalone Web keeps its existing default.

## HTTPS and Passkey sign-in

1. Point your HTTPS reverse proxy to the **proxy port**. Preserve the original `Host`, set `X-Forwarded-Proto: https`, and forward WebSocket upgrades. Save the full HTTPS origin in settings, for example `https://dsh.example.com` without a path.
2. Leave trusted proxy IPs blank only when the reverse proxy connects from local loopback (`127.0.0.1` or `::1`). If it connects from another host or a container address, enter the actual source IPs as a comma-separated list. To identify them, save the origin, visit it once in another tab, and select **Check recent proxy sources**. Review the result before trusting it.
3. Keep password sign-in enabled while you enable Passkeys, sign in on the HTTPS site once, and enroll and test a key under **Manage Passkeys**. You can enroll up to five keys. Use the same HTTPS origin when enrolling and signing in.
4. After confirming that a Passkey works, you can turn password sign-in off. That also disables password sign-in over LAN HTTP. The password can still authorize enrolling or removing Passkeys. At least one sign-in method must stay enabled, and in Passkey-only mode the last usable credential cannot be removed.

You can keep HTTPS and use passwords alone. If `DSH_PROXY_PASSKEY_ORIGIN` or `DSH_PROXY_TLS_PROXIES` manages the entry, the address fields are read-only in the UI; you can still change the sign-in switches.

## Troubleshoot and roll back

| Symptom | Check first |
| --- | --- |
| The phone cannot reach the LAN address | Same network, proxy status, desktop LAN access switch, and the proxy port |
| Origin mismatch or no Passkey option | Exact HTTPS origin, forwarded host and scheme, and the actual trusted proxy IP |
| DSH asks for a second sign-in | The advanced launch-token option and whether you opened the proxy port |
| The proxy will not start | A port conflict; give each instance a different proxy port |
| The page loads but live chat fails | WebSocket forwarding at the reverse proxy |

Desktop settings live in `$DSH_HOME/profiles/desktop/` and the proxy follows the desktop host's current port. Old global settings are not imported automatically. Standalone Web keeps its settings in `$DSH_HOME/` (default `~/.dsh/`); standalone profiles sharing that data root share the proxy files. Back up `dsh-proxy.json` and `dsh-proxy-auth.json` privately before changing versions. To roll back, reinstall a trusted older asset in the same profile and restart. Builds that predate the sign-in switches do not enforce Passkey-only mode.

## Source and license

This repository distributes prebuilt bundles. The [source, build scripts, and shared update index](https://github.com/timecatbit/dsh-web-plugins) live in DSH Web Plugins. Based on [smanx/dsh-proxy](https://github.com/smanx/dsh-proxy). [MIT licensed](LICENSE), with upstream attribution and [third-party notices](THIRD-PARTY-NOTICES.md) retained. When filing an [issue](https://github.com/timecatbit/dsh-passkey-proxy/issues), include your DSH and plugin versions and remove credentials, cookies, and launch tokens.
