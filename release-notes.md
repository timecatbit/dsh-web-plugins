**DSH Pocket UI 0.1.15** makes the phone sidebar read as one surface and closes the keyboard when a drawer opens.

- The sidebar, the page beside it and the status bar now share one background color. In dark mode the sidebar used to be lighter than the status bar above it.
- The page no longer has rounded corners or a divider line while the sidebar is open. A soft shadow marks the edge, and the page fades back.
- The sidebar keeps DSH's own collapse button. The extra close button and the page's second sidebar button next to it are gone; tapping the faded page still closes the sidebar.
- Opening the sidebar or the right panel while typing, by an edge swipe or a button, now dismisses the keyboard.

Also included from 0.1.14: the composer readings form a status bar, and the model picker shows the full model name.

WebKit and Chromium checks cover the keyboard behavior, the composer focus rules, the status bar, and keyboard dismissal when either drawer opens. Checked on DSH Web `0.2.1-rc.5` with iPhone emulation in dark mode.

**DSH Passkey Proxy remains at 0.1.8.** Update Pocket UI through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
