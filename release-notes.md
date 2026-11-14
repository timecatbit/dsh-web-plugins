**DSH Passkey Proxy 0.1.12** lets a phone show the DeepSeek logo when DSH is added to its home screen through the proxy.

- **Passkey Proxy:** The proxy let only the web app manifest and the light favicon through without a login. iOS fetches the home-screen icon without the session cookie, so `apple-touch-icon.png` got a 401 and the tile on the home screen stayed blank. The icons the manifest lists for Android and the dark-mode favicon were blocked the same way. These files, which DSH itself serves without a login, now pass through the proxy too: `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` and `favicon-dark.svg`. Every other path still needs a login.
- **Pocket UI** stays at 0.1.20.

Checked without a login through the proxy on standalone DSH Web `0.2.2-rc.1`, `0.2.2-rc.2` and `0.2.2-rc.3`: each icon returns the same bytes as DSH itself, and other paths still return 401. DSH `0.2.1-rc.5` does not ship the PNG icons, so on that version they stay 404. Password sign-in, the WebSocket connection and **Settings → LAN Proxy** were rechecked on all four versions, `0.2.1-rc.5` included.

Update through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
