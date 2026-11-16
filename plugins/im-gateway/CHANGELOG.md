# Changelog

All notable changes to DSH IM Gateway are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.4.0] - 2026-11-16

### Changed

- **Breaking:** the package is now `@timecatbit/dsh-im-gateway` (was `dsh-im-gateway`, the same name as the original on npm). Remove the old package before installing this one; channels, WeChat login and reminders carry over. See [Upgrading from the old package names](https://github.com/timecatbit/dsh-web-plugins/blob/main/README.en.md#upgrading-from-the-old-package-names).
- The help reply in chat reads "DSH IM Gateway".

## [0.3.5] - 2026-11-15

### Fixed

- Channels connected by scanning, such as WeChat and WhatsApp, reconnect after a DSH restart.

## 0.3.4 - 2026-11-15

First release of this fork of [zhuiyueya/dsh-im-gateway](https://github.com/zhuiyueya/dsh-im-gateway) 0.3.3.

### Changed

- Named DSH IM Gateway in the plugin list, the settings and the docs.

### Fixed

- Loads on DSH 0.2.x without a compatibility exemption.
- The WeChat login QR code appears right after **Connect (scan)**.
- The settings page follows the DSH theme, so buttons are readable in light mode.

### Security

- The WeChat login QR code is drawn locally. The original sent the login link to a third-party image service.
- Baileys is limited to the patched 6.7 line (GHSA-qvv5-jq5g-4cgg).

[Unreleased]: https://github.com/timecatbit/dsh-im-gateway/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/timecatbit/dsh-im-gateway/releases/tag/v0.4.0
[0.3.5]: https://github.com/timecatbit/dsh-im-gateway/releases/tag/v0.3.5
