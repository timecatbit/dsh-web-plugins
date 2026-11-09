# DSH Web Plugins

[简体中文](README.md) · [Download releases](https://github.com/timecatbit/dsh-web-plugins/releases/latest)

Two optional extensions for the DeepSeek Harness web app. Install either or both; neither requires the other.

| Extension | Release file |
| --- | --- |
| Mobile settings, drawers, and input layout | `dsh-ui-mobile-0.1.8-mobile.7.tgz` |
| LAN reverse proxy with password and HTTPS Passkey sign-in | `smanx-dsh-proxy-0.1.7-passkeys.2.tgz` |

Tested with **DSH 0.2.1-rc.5**. The mobile layout is tied to that web app version. The proxy targets Node.js 22 or later.

From the directory containing the downloaded assets, run either or both commands, then restart the existing DSH web process:

```bash
dsh plugin --profile web add "$PWD/dsh-ui-mobile-0.1.8-mobile.7.tgz"
dsh plugin --profile web add "$PWD/smanx-dsh-proxy-0.1.7-passkeys.2.tgz"
```

The packages use their upstream plugin IDs and replace the corresponding upstream version in the same profile. To roll back, reinstall the previous trusted package with the same command and restart DSH.

For the proxy, set a username and password in **Settings → LAN Proxy** before allowing external access. Forward your HTTPS domain to the LAN proxy port (default `3081`), preserve `Host`, set `X-Forwarded-Proto: https`, and support WebSockets. Under **Passkey sign-in**, enter the public HTTPS origin and the exact IP address or comma-separated addresses of the proxy peers **as observed by DSH**. If the two fields are blank, password login is still available. The server can alternatively set `DSH_PROXY_PASSKEY_ORIGIN` and `DSH_PROXY_TLS_PROXIES`; environment values are shown read-only.

On the HTTPS site, sign in once with your existing password, then choose **Manage Passkeys** to add a device. Up to five credentials are allowed. Use the HTTPS domain for Passkey sign-in. A change of domain requires enrolling again.

Derived from [smanx/dsh-proxy](https://github.com/smanx/dsh-proxy) and [jasondu/dsh-ui-mobile](https://github.com/jasondu/dsh-ui-mobile). Upstream MIT licenses are included in both packages. See [BUILDING.md](BUILDING.md) for reproducible build inputs and verification steps.
