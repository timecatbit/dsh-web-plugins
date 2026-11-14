**DSH Pocket UI 0.1.19 and DSH Passkey Proxy 0.1.10** are tested on DSH `0.2.2-rc.3`, and the phone settings title is no longer clipped.

- **Pocket UI:** On a phone, the **Settings** title was squeezed behind the tabs, so only the top of the text showed, and the tabs touched the screen edge. Newer DSH versions render the title beside the tab bar and add narrow-window rules that let it shrink. The title now keeps a full row level with the close button, and the tabs are inset 12 px. Older DSH versions, which put the title inside the tab bar, keep their layout.
- **Passkey Proxy:** The code is unchanged from 0.1.9. This release adds DSH `0.2.2-rc.3` to the tested versions in the README shown on GitHub and in Discover.
- Also included from 0.1.17 and 0.1.18: the page slides and fades with the sidebar drawer frame by frame, and the page's sidebar button fades in and out with it.

Tested on standalone DSH Web `0.2.2-rc.3`, with a rule-by-rule comparison against `0.2.2-rc.2`. Every Pocket UI style rule that matched an element on rc.2 still matches on rc.3, across the home page, sidebar, Plugins page, Settings and the right panel.
- **Pocket UI:** In WebKit and Chromium with iPhone emulation, the drawer and page edges stay within 1 px. The sidebar button fades in from fully transparent. The composer focus rules, keyboard dismissal when a drawer opens, the colors and the wide desktop layout behave as before.
- **Passkey Proxy:** Password sign-in works through the proxy, the app loads and its WebSocket connects, and **Settings → LAN Proxy** shows the proxy running.
- **Earlier versions:** The settings fix and drawer timing were rechecked on `0.2.1-rc.5`, `0.2.2-rc.1` and `0.2.2-rc.2`.

Update both plugins through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
