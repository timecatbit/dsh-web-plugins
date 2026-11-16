# Changelog

[简体中文](CHANGELOG.md)

All notable changes to DSH Passkey Proxy are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-11-16

### Changed

- **Breaking:** the package is now `@timecatbit/dsh-passkey-proxy` (was `@smanx/dsh-proxy`). Remove the old package before installing this one; your username, password, Passkeys and port carry over. See [Upgrading from the old package names](https://github.com/timecatbit/dsh-web-plugins/blob/main/README.en.md#upgrading-from-the-old-package-names).

## [0.1.16] - 2026-11-14

### Changed

- The docs point to **Settings → Pocket UI** for the home-screen icon. The proxy itself is unchanged.

## 0.1.15 - 2026-11-14

### Changed

- Named **Passkey Proxy** everywhere (was 局域网代理 / LAN Proxy).

### Removed

- The home-screen icon choice, which moved to DSH Pocket UI. The proxy still lets Pocket UI's home-screen icons through without a login.

## 0.1.14 - 2026-11-14

### Fixed

- A newly chosen home-screen icon shows up even when the phone has cached the old one.

## 0.1.13 - 2026-11-14

### Added

- A home-screen icon choice: DSH's own icon, a white whale on black, or a black whale on white.

## 0.1.12 - 2026-11-14

### Fixed

- A phone that adds DSH to its home screen through the proxy shows the DeepSeek icon instead of a blank tile.

## 0.1.11 - 2026-11-14

### Fixed

- The status card in the proxy settings fits narrow windows; long values wrap instead of being cut off.

## 0.1.10 - 2026-11-14

### Changed

- Tested on DSH 0.2.2-rc.3. No code change.

## 0.1.9 - 2026-11-12

### Changed

- Supports DSH 0.2.1-rc.5 and every later version. The README lists the versions actually tested.

## 0.1.8 - 2026-11-10

### Added

- First release in its own repository, installable from DSH Discover. Derived from [smanx/dsh-proxy](https://github.com/smanx/dsh-proxy) 0.1.7, with password and HTTPS Passkey sign-in.

[Unreleased]: https://github.com/timecatbit/dsh-passkey-proxy/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/timecatbit/dsh-passkey-proxy/releases/tag/v0.2.0
[0.1.16]: https://github.com/timecatbit/dsh-passkey-proxy/releases/tag/v0.1.16
