# Changelog

[简体中文](CHANGELOG.md)

Combined releases of DSH Web Plugins: which plugin versions each one bundles, and the main change. Each plugin's full history is in its own changelog: [Pocket UI](plugins/mobile-layout/CHANGELOG.en.md), [Passkey Proxy](plugins/passkey-proxy/CHANGELOG.en.md), [IM Gateway](plugins/im-gateway/CHANGELOG.en.md). The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.5.1] - 2026-11-22

Pocket UI 0.2.1, Passkey Proxy 0.2.1, IM Gateway 0.4.0.

- Works with DSH 0.2.3-alpha: signing in through Passkey Proxy reaches DSH, and the home-screen icon shows as before. Install these two versions for DSH 0.2.3-alpha or later.

## [1.5.0] - 2026-11-16

Pocket UI 0.2.0, Passkey Proxy 0.2.0, IM Gateway 0.4.0.

- **Breaking:** the plugins use this project's own package names. Remove the old packages before installing; see [Upgrading from the old package names](README.en.md#upgrading-from-the-old-package-names).
- Pocket UI leaves DSH's own fixes in place.

## [1.4.22] - 2026-11-15

Pocket UI 0.1.26, Passkey Proxy 0.1.16, IM Gateway 0.3.5. The last release under the old package names.

- Composer popups stay still while an answer streams.

## 1.4.21 - 2026-11-15

Pocket UI 0.1.25: readings under the composer clear the keyboard edge.

## 1.4.20 - 2026-11-15

Pocket UI 0.1.24: no rubber band at the ends of the chat on iOS.

## 1.4.19 - 2026-11-15

IM Gateway 0.3.5: WeChat reconnects after a DSH restart.

## 1.4.18 - 2026-11-15

IM Gateway 0.3.4 joins the collection.

## 1.4.17 - 2026-11-14

Pocket UI 0.1.23: no drop of the page when the app opens.

## 1.4.16 - 2026-11-14

Pocket UI 0.1.22 and Passkey Proxy 0.1.16: Pocket UI gets its own settings page.

## 1.4.15 - 2026-11-14

Pocket UI 0.1.21 and Passkey Proxy 0.1.15: the home-screen icon choice moves to Pocket UI; the proxy is named Passkey Proxy.

## 1.4.12 – 1.4.14 - 2026-11-14

Passkey Proxy 0.1.12 to 0.1.14: home-screen icons through the proxy.

## 1.4.10 – 1.4.11 - 2026-11-14

Pocket UI 0.1.19 and 0.1.20, Passkey Proxy 0.1.10 and 0.1.11: DSH 0.2.2-rc.3 support and phone settings pages that fit the screen.

## 1.4.7 – 1.4.9 - 2026-11-12

Pocket UI 0.1.16 to 0.1.18 and Passkey Proxy 0.1.9: every DSH release from 0.2.1-rc.5 on is supported; the page follows the sidebar drawer.

## 1.4.5 – 1.4.6 - 2026-11-11

Pocket UI 0.1.14 and 0.1.15 with Passkey Proxy 0.1.8: composer status bar and one-surface sidebar.

[Unreleased]: https://github.com/timecatbit/dsh-web-plugins/compare/v1.5.1...HEAD
[1.5.1]: https://github.com/timecatbit/dsh-web-plugins/releases/tag/v1.5.1
[1.5.0]: https://github.com/timecatbit/dsh-web-plugins/releases/tag/v1.5.0
[1.4.22]: https://github.com/timecatbit/dsh-web-plugins/releases/tag/v1.4.22
