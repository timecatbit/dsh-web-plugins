**DSH Pocket UI 0.1.22** gives Pocket UI its own page in DSH's settings, and **DSH Passkey Proxy 0.1.16** updates its docs to match.

- **Pocket UI:** The home-screen icon choice moves from a row in **Settings → General** to a **Pocket UI** page of its own, next to **Passkey Proxy**, since the choice only exists while Pocket UI is installed. It works as before: DSH's own icon, a white whale on black, or a black whale on white, stored in the DSH profile and applied at once. A choice saved with 0.1.21 is kept. DSH's plugin list now shows **DSH Pocket UI** when Pocket UI is installed from Discover or GitHub too: 0.1.21 left its name files out of git installs, so the list showed `dsh-ui-mobile`.
- **Passkey Proxy:** Docs only. They point to **Settings → Pocket UI** for the icon, and git installs now include the English README.

Checked on standalone DSH Web `0.2.1-rc.5`, `0.2.2-rc.1`, `0.2.2-rc.2` and `0.2.2-rc.3` with both plugins packed the way a git install packs them:
- The Pocket UI page sits in the settings nav next to Passkey Proxy, also at iPhone width, and General no longer has the row.
- Each choice changes the page's icon links and the served icon right away, survives a reload, and loads through the proxy without a login.
- DSH's plugin list shows DSH Pocket UI and DSH Passkey Proxy.
- Password sign-in and the WebSocket connection work through the proxy.

Update through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
