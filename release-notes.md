**DSH Web Plugins 1.5.0** gives the three plugins this project's own package names, and Pocket UI now leaves alone the host problems DSH has fixed itself.

| Plugin | Version | New package | Old package |
| --- | --- | --- | --- |
| DSH Pocket UI | 0.2.0 | `@timecatbit/dsh-pocket-ui` | `dsh-ui-mobile` |
| DSH Passkey Proxy | 0.2.0 | `@timecatbit/dsh-passkey-proxy` | `@smanx/dsh-proxy` |
| DSH IM Gateway | 0.4.0 | `@timecatbit/dsh-im-gateway` | `dsh-im-gateway` |

- **Upgrading:** DSH tells plugins apart by package name, so remove the old package before installing the new one ([steps](https://github.com/timecatbit/dsh-web-plugins/blob/main/README.en.md#upgrading-from-the-old-package-names)). Passkey Proxy keeps its username, password, Passkeys and port, and IM Gateway keeps its channels, WeChat login and reminders: their data paths in `DSH_HOME` are unchanged. Pocket UI's home-screen icon has to be chosen again, or its row in the profile's `cordis.patch.yml` renamed to `id: dsh-pocket-ui`.
- **Pocket UI 0.2.0:** DSH fixed four of the problems Pocket UI patched: the composer font that made iOS zoom (from 0.2.2-rc.1), the 45% model-picker cap (0.2.2-rc.1), long-word wrapping in the composer, and the transcript rubber band (0.2.2-rc.2). Pocket UI now measures each of these on the page and steps in only where the host still has the problem, so DSH's own styles stay where it has fixed them, including in future releases. On 0.2.2-rc.3 the composer now uses DSH's 24px line height instead of Pocket UI's 23.2px; everything else looks the same. The popup pin from 0.1.26, the **+** keyboard guard and the settings layout stay, because DSH 0.2.2-rc.3 still needs them.
- **Passkey Proxy 0.2.0** and **IM Gateway 0.4.0** change only their names. IM Gateway's help reply in chat now reads "DSH IM Gateway".

Checked on standalone DSH Web `0.2.1-rc.5`, `0.2.2-rc.1`, `0.2.2-rc.2` and `0.2.2-rc.3` at iPhone 15 size:
- Without any plugin, the four fixed problems are present on rc.5, and absent where noted above.
- With Pocket UI 0.2.0, its own fixes engage only where the host still has them, and the results match 0.1.26. On rc.5 the composer is pixel-identical; on rc.3 the composer popups open where they did and hold one position while an answer streams, in WebKit and Chromium.
- A copy of a production-shaped profile was moved from the old packages to the new ones with `dsh plugin remove` and `add`. The proxy still signed in with its existing password and its WebSocket connected. The gateway reused its data directory. The home-screen icon came back after its config row was renamed, and the DSH log stayed clean.

Install or update through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
