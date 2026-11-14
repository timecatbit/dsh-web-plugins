**DSH Passkey Proxy 0.1.13** lets you pick a black-and-white DeepSeek whale as the icon a phone shows when DSH is added to its home screen.

- **Passkey Proxy:** **Settings → LAN Proxy** has a new **Home-screen icon** choice: DSH's own icon (the default, unchanged), a white whale on black, or a black whale on white. With a whale chosen, the proxy answers `apple-touch-icon.png` and the icons the web app manifest lists (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`) with bundled PNGs drawn from the whale in DSH's own favicon. The favicons and every other file still come from DSH, and every other path still needs a login. A phone keeps the icon it got when DSH was added, so after switching, remove the old tile and add DSH again.
- **Pocket UI** stays at 0.1.20.

Checked through the proxy on standalone DSH Web `0.2.1-rc.5`, `0.2.2-rc.1`, `0.2.2-rc.2` and `0.2.2-rc.3`: the settings page shows the choice and keeps it after a reload, both whales are served without a login right after saving, and switching back to DSH's own icon serves DSH's file again. DSH `0.2.1-rc.5` ships no PNG icons, so there DSH's own icon stays 404 while both whales work. Password sign-in and the WebSocket connection were rechecked on all four versions.

Update through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
