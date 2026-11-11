**DSH Pocket UI 0.1.13** stops the page from jumping after the iPhone keyboard opens or closes.

Safari moves the page together with the keyboard animation and reports the new size only after the animation ends. Earlier versions moved the page again from that late report, which caused a second jump. The page now stays at its normal size and follows Safari's own motion. If Safari leaves the page slightly offset after the keyboard closes, the plugin resets it.

- While the keyboard is open, the conversation header scrolls out of view, as on other pages in Safari. The composer stays right above the keyboard.
- The welcome area and bottom spacing no longer change when the keyboard opens.
- A command list opened from a toolbar button no longer brings up the keyboard. The search field still opens it when tapped.
- After a command is chosen while typing, the keyboard stays open and the cursor returns to the composer.

WebKit and Chromium regression tests check that keyboard viewport events leave the page in place, that a leftover offset is reset only after dismissal, and that drafts, transcript position, and the composer focus rules are kept. Also tested on DSH Web `0.2.1-rc.5` with iPhone emulation. The keyboard animation itself still needs to be checked on a physical iPhone.

**DSH Passkey Proxy remains at 0.1.8.** Update Pocket UI through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
