**DSH Pocket UI 0.1.18** fades the page's sidebar button in and out with the sidebar.

- When the phone sidebar closed, the sidebar button at the top left of the page appeared in a single frame, already at the page's dimmed opacity. On global pages such as Settings or Plugins it appeared at full strength. It now fades in over the same 300 ms ease-in-out as the drawer, starting from fully transparent. When the sidebar opens, the button fades out and stops taking taps once the fade ends. When DSH switches the drawer instantly, the button switches with it.
- Also included from 0.1.17: the page slides and fades with the sidebar drawer frame by frame.

Measured frame by frame in WebKit and Chromium with iPhone emulation, on standalone DSH Web `0.2.1-rc.5`, `0.2.2-rc.1` and `0.2.2-rc.2`, on conversation and global pages. The button starts closing at opacity 0 and rises without a jump, and the page and sidebar edges stay within 1 px. On `0.2.2-rc.2` the composer focus rules, keyboard dismissal when a drawer opens, the colors and the wide desktop layout were checked again.

**DSH Passkey Proxy remains at 0.1.9.** Update Pocket UI through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
