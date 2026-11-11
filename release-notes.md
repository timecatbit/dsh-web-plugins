**DSH Pocket UI 0.1.14** turns the session readings below the composer into a status bar on phones.

The turn and step counts, speed, token total, cache hit, and context usage previously sat in one crowded row right under the composer buttons, and most of it was cut off. They now form a separate bar with a divider line, one equal cell per reading. Each cell shows its value with a short description below, for example `1%` over `上下文已用`. Nothing is truncated, and each cell still opens DSH's details when tapped.

The model picker in the composer toolbar now uses the free space in the row, so a full model name such as `DeepSeek V4.1 Flash` is no longer cut short. It still shrinks with an ellipsis when the row is full.

Also included from 0.1.13: the page follows Safari's own keyboard animation without jumping afterwards, and a command list opened from a toolbar button does not bring up the keyboard.

WebKit and Chromium checks cover the keyboard behavior, the composer focus rules, and the status bar layout (equal cells, no truncation, localized context caption, untouched when there are no readings yet). Tested on DSH Web `0.2.1-rc.5`.

**DSH Passkey Proxy remains at 0.1.8.** Update Pocket UI through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
