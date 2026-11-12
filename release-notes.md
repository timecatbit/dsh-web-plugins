**DSH Pocket UI 0.1.17** keeps the page edge on the sidebar edge while the phone sidebar opens and closes.

- The page used a 180 ms ease while DSH animates its sidebar drawer over 300 ms with an ease-in-out curve. When the sidebar opened, the page ran ahead and left a gap of up to about 130 px; when it closed, the sidebar trailed over the page. The page slide and fade now use DSH's own animation tokens, so they move together frame by frame. When DSH switches the drawer instantly, the page switches with it.
- On DSH `0.2.1-rc.5`, which has no drawer animation of its own, the plugin's sidebar uses the same tokens.

Measured frame by frame in WebKit and Chromium with iPhone emulation, on standalone DSH Web `0.2.1-rc.5`, `0.2.2-rc.1` and `0.2.2-rc.2`. The page and sidebar edges now stay within 0.5 px of each other; before, they were up to about 130 px apart. On `0.2.2-rc.2` the composer focus rules, keyboard dismissal when a drawer opens, the colors and the wide desktop layout were checked again.

**DSH Passkey Proxy remains at 0.1.9.** Update Pocket UI through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
