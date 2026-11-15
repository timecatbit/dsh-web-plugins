**DSH Pocket UI 0.1.26** keeps the composer popups still while an answer streams. On phones, the model menu and the session, token and context readings no longer jump with every new line of output.

- **Pocket UI 0.1.26:** these popups are fixed boxes that DSH places with CSS anchors on their trigger in the composer. The composer is sticky inside the transcript, which keeps scrolling to follow the answer, and WebKit and Chromium shift an anchored box by that scroll before they read the anchor again: the open popup climbed a line per update and snapped back. On phones Pocket UI now places the open popup from its trigger's measured position on every frame, 8px above it and aligned as DSH aligns it, without the anchor. Where it lands when nothing streams is unchanged.
- **Since 0.1.25:** with the keyboard up, the readings under the composer move 8px down out of the home-indicator inset, so they no longer hug the bar's top rule; the input card does not move.
- **Since 0.1.24:** the transcript no longer rubber-bands past its top or bottom on iOS.
- **Passkey Proxy** stays at 0.1.16 and **IM Gateway** at 0.3.5; their archives are byte-identical to the previous release.

Checked against a local mock model that streams a long answer, on standalone DSH Web `0.2.1-rc.5`, `0.2.2-rc.1`, `0.2.2-rc.2` and `0.2.2-rc.3` at iPhone 15 size in WebKit and Chromium, recording each open popup for 180 frames while the answer grew by about 1,500 characters. With 0.1.25 on `0.2.2-rc.3`, the model menu moved through 28 positions in WebKit and the three readings through about 60 in Chromium; with 0.1.26 every popup on `0.2.2-rc.2` and `0.2.2-rc.3` held one position, 8px above its trigger, in both engines. `0.2.1-rc.5` and `0.2.2-rc.1` do not anchor these popups, were already still, and are left alone. With nothing streaming, every composer popup opens exactly where it did before.

Install or update through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
