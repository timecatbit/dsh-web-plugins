# DSH Web Plugins

[简体中文](README.md) · [MIT license](LICENSE) · [Download releases](https://github.com/timecatbit/dsh-web-plugins/releases/latest)

The **source and update index repository** for two optional DeepSeek Harness (DSH) plugins. Install, update, and roll them back separately. There is no third plugin to install from this repository.

This repository provides installation instructions for standalone `dsh web` and the [official DeepSeek Harness desktop app](https://www.deepseek.com/en/harness/). Use the desktop app's own plugin manager to install the packages. In Safari, you can save a reachable DSH website to your Home Screen or Dock.

| Extension | Package name |
| --- | --- |
| [DSH Pocket UI](https://github.com/timecatbit/dsh-pocket-ui) | `dsh-ui-mobile` |
| [DSH Passkey Proxy](https://github.com/timecatbit/dsh-passkey-proxy) | `@smanx/dsh-proxy` |

## What each repository is for

- **This repository** maintains the [shared Discover index](plugin-index.json), [mobile layout patches](plugins/mobile-layout), [proxy source](plugins/passkey-proxy/dsh-proxy), [build instructions](BUILDING.md), and [combined release history](https://github.com/timecatbit/dsh-web-plugins/releases). Keep using the same index URL if you already added it.
- **The two plugin repositories** publish prebuilt bundles, detailed guides, and issue trackers for each plugin. You do not need to clone this repository to install either one.
- **Which should I install?** Use Pocket UI if the DSH website is already reachable and you want a better phone layout. Use Passkey Proxy if you need a LAN entry, password sign-in, or Passkeys. Install both if you need both.

<a id="tested-environments"></a>

## Supported and tested versions

**Supported: DSH `0.2.1-rc.5` and every later version.** Starting with Pocket UI 0.1.16 and Passkey Proxy 0.1.9, both plugins declare `>=0.2.1-rc.5`, so a new DSH release can install and enable them without waiting for an update here. The plugins rely on DSH's interface hooks, so an untested release may show layout or connection problems. Please report them in the plugin's repository; fixes ship as new plugin versions.

**Tested versions** are the ones the plugins were actually installed and checked on. A DSH version missing from the table has not been tested yet. The "Tested on DSH …" tags on the Discover cards show the same list.

| Environment | Tested DSH versions |
| --- | --- |
| Standalone Web (`dsh web`) | `0.2.1-rc.5`, `0.2.2-rc.1`, `0.2.2-rc.2`, `0.2.2-rc.3` |
| Official macOS Desktop (Apple Silicon) | `0.2.2-rc.1` |
| Official Windows Desktop | Not tested |

The official desktop app ships its own runtime; for CLI installs, follow the Node.js requirement of your DSH version.

## Installation

### Install and update in DSH

1. Open **Plugins** from the sidebar and find the **Experimental plugins** section. If the custom plugin index bundle is not listed, click **More** in that section. Look for **Custom plugin markets** (「自定义插件市场」) on DSH `0.2.1-rc.5`, or **Custom plugin indexes** (「自定义插件索引」) on `0.2.2-rc.1` and later. Turn the bundle on.
2. In **Discover**, add this index source once:

   ```text
   https://raw.githubusercontent.com/timecatbit/dsh-web-plugins/main/plugin-index.json
   ```

3. Open the **DSH Pocket UI** or **DSH Passkey Proxy** card by clicking its title. In **Versions**, select the newer release and install it. Existing tarball installations can update this way because the package names and settings paths stay the same. Restart the current instance if DSH asks. When the card shows **Update available**, click its title to open **Versions** and confirm the update yourself.

### Manual install: Official desktop app

1. Open **Plugins → Add plugin** from the sidebar. The built-in plugin list under Settings is an inventory.
2. Paste one release URL at a time:

   ```text
   https://github.com/timecatbit/dsh-pocket-ui/releases/download/v0.1.23/dsh-ui-mobile-0.1.23.tgz
   https://github.com/timecatbit/dsh-passkey-proxy/releases/download/v0.1.16/smanx-dsh-proxy-0.1.16.tgz
   ```

3. You can also download a `.tgz` and enter its absolute path in the same field. Choose **Enable now** after installing. If prompted, fully quit and reopen the app. The npm-installed CLI does not manage the desktop app's `desktop` profile.
4. To reach this desktop instance from your phone using our proxy, open **Settings → Passkey Proxy**, set a proxy username and password, and enable **Allow access from devices on the local network**. Under **Advanced**, enable **Open DSH automatically after sign-in**, then save. Open `http://COMPUTER-LAN-IP:PROXY-PORT` on your phone, or configure HTTPS for Passkeys. The plugins are independent; installing Mobile Layout alone does not enable remote access.

### Manual install: Standalone `dsh web`

Install on the machine running `dsh web`, with the same OS account and `DSH_HOME` (default: `~/.dsh`). If your web process uses a custom profile, replace `web` with its name. From the directory containing the downloaded assets, run either or both commands:

```bash
dsh plugin --profile web add "$PWD/dsh-ui-mobile-0.1.23.tgz"
dsh plugin --profile web add "$PWD/smanx-dsh-proxy-0.1.16.tgz"
```

Restart the same `dsh web` process and reopen the page. Refreshing the browser alone will not load newly installed bundles. The packages replace the corresponding upstream plugin in the same profile. To roll back, reinstall the previous trusted package into that profile and restart the process. Older proxy builds without the sign-in switches do not enforce Passkey-only mode.

## Save the website as an app in Safari

1. In Safari, open the DSH website you normally use. If you configured the Passkey proxy, open your HTTPS address. Save the regular URL, not a launch link containing `?token=`.
2. **iPhone or iPad:** choose **Share → Add to Home Screen**, enable **Open as Web App** if shown, and tap **Add**. Open it from its Home Screen icon. [Apple instructions](https://support.apple.com/guide/iphone/bookmark-a-website-iph42ab2f3a7/ios)
3. **Mac (macOS Sonoma 14 or later):** choose **File → Add to Dock** in Safari, or choose **Add to Dock** from the Share menu. [Apple instructions](https://support.apple.com/104996)

The icon opens the saved site. Safari does not install plugins or modify the Electron profile. Mobile Layout mainly applies below 768 CSS pixels, with additional support for some touch devices in landscape. A normal wide desktop window will not show the mobile layout.

## Passkey proxy setup

Desktop stores its proxy settings and Passkey records in `~/.dsh/profiles/desktop/`, follows the desktop host's current port, and does not import the old shared settings. It defaults to listening on `127.0.0.1` and keeps DSH's separate launch-token check enabled until you opt in to automatic entry.

Standalone `dsh web` keeps its existing settings, defaults, and credentials in the DSH data root. Standalone profiles sharing that root still share those files. Both versions default to proxy port `3081`; choose distinct ports if they run on the same computer. Proxy authentication remains required. Do not expose plain HTTP to the public internet.

Set the proxy username and password from the original DSH page under **Settings → Passkey Proxy**. The proxy blocks unauthenticated access before setup. On a trusted LAN, you can use password sign-in at `http://SERVER-IP:3081`; the proxy verifies its own password and issues a session cookie before forwarding to DSH. Plain HTTP does not encrypt credentials. The advanced launch-token option allows the proxy to complete DSH's separate check after authenticating the visitor.

For HTTPS, preserve `Host`, set `X-Forwarded-Proto: https`, and forward WebSocket upgrades. Set the public HTTPS origin in **Access addresses**. If your reverse proxy connects via local loopback, leave the IP field blank; only `127.0.0.1` and `::1` are trusted in that case. For remote or container peers, enter the actual source IPs. To find a candidate, save the origin, visit it in another tab, and use **Check recent proxy sources**. Review the suggestion before trusting it.

Password and Passkey sign-in have separate switches, and at least one must stay on. Enable Passkeys, then enroll and test one at the HTTPS site before turning off passwords. With password sign-in off, LAN HTTP sign-in also stops; the password can still authorize credential management. In Passkey-only mode the final usable credential cannot be removed. HTTPS remains usable with password-only sign-in. Environment variables `DSH_PROXY_PASSKEY_ORIGIN` and `DSH_PROXY_TLS_PROXIES` override the two address fields, not the sign-in switches.

## License and credits

All three repositories use the [MIT license](LICENSE). Passkey Proxy is derived from [smanx/dsh-proxy](https://github.com/smanx/dsh-proxy) 0.1.7, and Pocket UI from [jasondu/dsh-ui-mobile](https://github.com/jasondu/dsh-ui-mobile) 0.1.8. The packages retain their upstream copyright notices. The proxy also ships [third-party dependency notices](plugins/passkey-proxy/THIRD-PARTY-NOTICES.md).
