**DSH Pocket UI 0.1.16 and DSH Passkey Proxy 0.1.9** run on DSH `0.2.1-rc.5` and every later version, and list the DSH versions they were tested on.

- Both plugins now declare `>=0.2.1-rc.5` instead of a fixed list of versions. New DSH releases can install and enable them without waiting for a plugin update. The previous builds accepted only `0.2.1-rc.5` and `0.2.2-rc.1`, so DSH `0.2.2-rc.2` refused to load them.
- The READMEs now separate the supported range from the tested versions. The Discover cards carry "Tested on DSH …" tags with the same list. A DSH version without a tag can still be used; it just has not been checked yet.
- The plugin code is unchanged from Pocket UI 0.1.15 and Passkey Proxy 0.1.8.

Newly tested on standalone DSH Web `0.2.2-rc.2`. In WebKit and Chromium with iPhone emulation, the phone layout, drawers, keyboard dismissal and composer focus rules behave as before, and a wide window keeps the desktop layout. Through the proxy, password sign-in works, the app loads, and its WebSocket connects. **Settings → LAN Proxy** shows the proxy running. Earlier tests on Web `0.2.1-rc.5` and `0.2.2-rc.1` and on the macOS desktop app `0.2.2-rc.1` still apply; Windows desktop remains untested.

If you already upgraded DSH to `0.2.2-rc.2`, DSH will not load the previous plugin versions. Update both plugins through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新), or install the new archives over the old ones.
