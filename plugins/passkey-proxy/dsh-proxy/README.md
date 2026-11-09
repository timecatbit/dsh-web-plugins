# DSH LAN Proxy and Passkeys

[简体中文](README.zh.md). A derivative of [smanx/dsh-proxy](https://github.com/smanx/dsh-proxy) 0.1.7. It does not require the mobile layout plugin.

Install the Release package with `dsh plugin --profile web add /absolute/path/package.tgz` and restart the DSH web process. Open the original DSH page on the server to configure the proxy username and password before use. The proxy port defaults to 3081. Password sign-in works on a trusted LAN over HTTP; HTTP does not encrypt credentials.

For external HTTPS, preserve Host and X-Forwarded-Proto, and forward WebSocket upgrades. Enter the HTTPS origin in LAN Proxy settings. Blank source IPs trust only loopback. Remote or container proxies need their exact source IPs; use **Check recent proxy sources** after visiting the configured address. Suggestions are not trusted automatically.

Password and Passkey sign-in can be enabled separately. At least one must stay enabled. Enroll and test a Passkey before disabling passwords. A password is still required for credential management, but cannot sign you in when disabled. In Passkey-only mode the final usable credential cannot be removed.

By default, the proxy completes DSH's launch-token exchange after authenticating the visitor. The advanced setting can keep DSH's separate token check. `DSH_PROXY_PASSKEY_ORIGIN` and `DSH_PROXY_TLS_PROXIES` override the address fields, not the sign-in switches. Roll back by reinstalling a previous trusted archive and restarting DSH.

See [LICENSE](LICENSE) for the upstream MIT license.
