**DSH Pocket UI 0.1.21** and **DSH Passkey Proxy 0.1.15** move the home-screen icon choice to Pocket UI, as a row in **Settings → General**, and give the proxy one name everywhere.

- **Pocket UI:** **Settings → General** has a new **Home-screen icon** row, next to Appearance: DSH's own icon (the default), a white whale on black, or a black whale on white. The choice is stored in the DSH profile and applies at once, without a restart. With a whale chosen, Pocket UI serves the icons and a web app manifest under `/home-screen/` on DSH's own port and points the page's icon links there. Each choice has its own URLs, so a phone that cached another icon still gets the new one. With DSH's own icon chosen, the page is left as it is. This works with or without Passkey Proxy. DSH's plugin list now shows the name **DSH Pocket UI** instead of `dsh-ui-mobile`.
- **Passkey Proxy:** The home-screen icon group added in 0.1.13 is gone from the proxy's settings page. The proxy now lets Pocket UI's `/home-screen/` icons and manifests through without a login (reads only), as it already did for DSH's own icons. The settings page, DSH's plugin list and the docs now all call it **Passkey Proxy** instead of 局域网代理 / LAN Proxy, and its description covers HTTPS and Passkey sign-in as well as the LAN. A `homeScreenIcon` value saved by 0.1.13 or 0.1.14 is ignored.

Checked on standalone DSH Web `0.2.1-rc.5`, `0.2.2-rc.1`, `0.2.2-rc.2` and `0.2.2-rc.3` with both plugins installed:
- The row appears in Settings → General, also at iPhone width.
- Each choice changes the page's icon links and the served icon right away, and survives a reload.
- Through the proxy, the chosen icons load without a login, while other paths still need one.
- Password sign-in and the WebSocket connection work through the proxy.

Update through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新). To see the whale through Passkey Proxy, update both plugins.
