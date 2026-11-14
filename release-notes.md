**DSH Passkey Proxy 0.1.14** makes a newly chosen home-screen icon show up even when the phone already cached the old one.

- **Passkey Proxy:** With a whale chosen under **Settings → LAN Proxy → Home-screen icon** (new in 0.1.13), the page's touch-icon link now points at a URL of its own, such as `/apple-touch-icon.png?v=black`. Behind Cloudflare the icon got a 4-hour browser cache lifetime, so a phone that had already fetched DSH's own icon could keep showing it after the switch. DSH `0.2.1-rc.5`, whose page has no touch-icon link, now gets one. With DSH's own icon chosen, the page is left as it is.
- **Pocket UI** stays at 0.1.20.

Checked through the proxy on standalone DSH Web `0.2.1-rc.5`, `0.2.2-rc.1`, `0.2.2-rc.2` and `0.2.2-rc.3`: after each switch in the settings page, the page links the chosen icon under its own URL, that URL serves it without a login, and switching back to DSH's own icon restores DSH's link and file. Password sign-in and the WebSocket connection were rechecked on all four versions.

Update through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
