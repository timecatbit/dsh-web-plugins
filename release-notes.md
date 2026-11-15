**DSH Pocket UI 0.1.25** tidies the bottom of the phone chat: the readings under the composer no longer hug its rule while the keyboard is up, and the transcript no longer bounces at its ends.

- **Pocket UI 0.1.25:** with the keyboard open, the status bar under the composer (turns, tokens, context) sat about 5px below its top rule while the home-indicator inset left empty space beneath it. While the composer is focused the readings now move 8px down out of that inset, in step with the keyboard. The bar keeps its height, so the input card and the rule do not move. With the keyboard closed nothing changes.
- **Since 0.1.24:** the phone layout set `overscroll-behavior-y: contain` on the chat scroller, which outranks DSH's own `none` (DSH Web 0.2.2-rc.2 and later), so iOS rubber-banded the transcript past its ends. It sets `none` now, at the top and the bottom alike, on every supported DSH version.
- **Passkey Proxy** stays at 0.1.16 and **IM Gateway** at 0.3.5; their archives are byte-identical to the previous release.

Checked on standalone DSH Web `0.2.1-rc.5`, `0.2.2-rc.1`, `0.2.2-rc.2` and `0.2.2-rc.3` at iPhone 15 size in WebKit and Chromium, with the iPhone's 34px bottom inset applied: focusing the composer moves the readings 8px down (4.7px → 12.7px below the rule), and the input card stays on the same pixel in every frame of the change and back. Without a bottom inset the card rises 2–4px with the keyboard. The chat scroller reports `overscroll-behavior-y: none`, and a touch drag still scrolls a long transcript up and back to its end. Desktop emulation shows neither the iOS keyboard nor its rubber band; check on an iPhone.

Install or update through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
