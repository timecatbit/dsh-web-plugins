**DSH Pocket UI 0.1.24** stops the chat from bouncing at the bottom on phones. Once a conversation is scrolled to its end, dragging further up leaves the page where it is.

- **Pocket UI 0.1.24:** the phone layout set `overscroll-behavior-y: contain` on the chat scroller, which outranks DSH's own `none` (DSH Web 0.2.2-rc.2 and later), so iOS kept rubber-banding the transcript past its ends. It now sets `none`, at the top and the bottom alike, on every supported DSH version. Scrolling within the conversation is unchanged.
- **Passkey Proxy** stays at 0.1.16 and **IM Gateway** at 0.3.5; their archives are byte-identical to the previous release.

Checked on standalone DSH Web `0.2.1-rc.5`, `0.2.2-rc.1`, `0.2.2-rc.2` and `0.2.2-rc.3` at iPhone 15 size in WebKit and Chromium: the chat scroller reports `overscroll-behavior-y: none` (`contain` with 0.1.23), and a touch drag in Chromium still scrolls a long transcript up and back to its end. Desktop emulation cannot show the iOS rubber band itself; check on an iPhone.

Install or update through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
