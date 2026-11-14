# DSH Passkey Proxy

[简体中文](README.zh.md). A derivative of [smanx/dsh-proxy](https://github.com/smanx/dsh-proxy) 0.1.7. It does not require the mobile layout plugin.

Use the official desktop app's **Plugins → Add plugin** to install the release tarball URL or absolute local path. For standalone Web, use `dsh plugin --profile web add /absolute/path/package.tgz` and restart `dsh web`. See the [installation guide](https://github.com/timecatbit/dsh-web-plugins/blob/main/README.en.md#installation) for details.

Desktop keeps separate settings, follows the actual upstream port, and listens only on loopback by default. Configure a proxy username and password before enabling LAN access. Enable automatic entry after proxy authentication under **Advanced** if you want the proxy to handle DSH's separate launch-token check. The proxy port defaults to 3081. Password sign-in works on a trusted LAN over HTTP; HTTP does not encrypt credentials.

For external HTTPS, preserve Host and X-Forwarded-Proto, and forward WebSocket upgrades. Enter the HTTPS origin under **Settings → Passkey Proxy**. Blank source IPs trust only loopback. Remote or container proxies need their exact source IPs; use **Check recent proxy sources** after visiting the configured address. Suggestions are not trusted automatically.

Password and Passkey sign-in can be enabled separately. At least one must stay enabled. Enroll and test a Passkey before disabling passwords. A password is still required for credential management, but cannot sign you in when disabled. In Passkey-only mode the final usable credential cannot be removed.

Home-screen icons and the web app manifest pass through without a sign-in, so a phone that adds DSH to its home screen gets an icon. DSH Pocket UI can switch it to a black-and-white whale under **Settings → Pocket UI**.

Standalone Web defaults to completing DSH's launch-token exchange after authenticating the visitor; Desktop requires opting in. `DSH_PROXY_PASSKEY_ORIGIN` and `DSH_PROXY_TLS_PROXIES` override the address fields, not the sign-in switches. Roll back by reinstalling a previous trusted archive and restarting DSH.

See [LICENSE](LICENSE) for the upstream MIT license.
