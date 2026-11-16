# Changelog

All notable changes to DSH Pocket UI are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-11-16

### Changed

- **Breaking:** the package is now `@timecatbit/dsh-pocket-ui` (was `dsh-ui-mobile`). Remove the old package before installing this one, then choose the home-screen icon again. See [Upgrading from the old package names](https://github.com/timecatbit/dsh-web-plugins/blob/main/README.en.md#upgrading-from-the-old-package-names).
- Where DSH has fixed a problem itself, its own styles now stay. This covers the composer font that made iOS zoom, the 45% model-picker cap, long-word wrapping and the transcript rubber band. Pocket UI checks each of these on the page and steps in only where the problem remains.

## [0.1.26] - 2026-11-15

### Fixed

- While an answer streams, the model menu and the session, token and context popups no longer jump with every new line.

## 0.1.25 - 2026-11-15

### Changed

- With the keyboard up, the readings under the composer move 8px down, so they no longer hug the top of their bar.

## 0.1.24 - 2026-11-15

### Fixed

- The chat no longer rubber-bands past its top or bottom on iOS.

## 0.1.23 - 2026-11-14

### Fixed

- The page no longer drops 14px a moment after the app opens on a phone.

## 0.1.22 - 2026-11-14

### Changed

- The home-screen icon choice moved to its own page, **Settings → Pocket UI**.

### Fixed

- Installs from Discover or GitHub show the name DSH Pocket UI in the plugin list.

## 0.1.21 - 2026-11-14

### Added

- A home-screen icon choice: DSH's own icon, a white whale on black, or a black whale on white.

### Changed

- The plugin list shows **DSH Pocket UI**.

## 0.1.20 - 2026-11-14

### Fixed

- Settings pages keep the same margin on both sides; dropdowns and the Appearance buttons are no longer cut off at the right edge.
- On Built-in plugins, the agent preset switcher moves to its own line when it does not fit.

## 0.1.19 - 2026-11-14

### Fixed

- The Settings title is no longer squeezed behind the tabs on DSH 0.2.2-rc.2 and later.

## 0.1.18 - 2026-11-12

### Fixed

- The page's sidebar button fades in and out with the sidebar instead of popping in.

## 0.1.17 - 2026-11-12

### Fixed

- The page moves together with the sidebar drawer as it opens and closes.

## 0.1.16 - 2026-11-12

### Changed

- Supports DSH 0.2.1-rc.5 and every later version. The README lists the versions actually tested.

## 0.1.15 - 2026-11-11

### Changed

- The sidebar, the page and the status bar share one surface; a soft shadow replaces the rounded corners and the divider, and the duplicate close buttons are gone.

### Fixed

- Opening a drawer while typing closes the keyboard.

## 0.1.14 - 2026-11-11

### Changed

- The session readings below the composer form a status bar with one cell per reading, so nothing is cut off.
- The model picker uses the free space in its row, so a full model name fits.

## 0.1.9 – 0.1.13 - 2026-11-10 to 2026-11-11

### Added

- First releases: a phone layout for DSH built on [dsh-ui-mobile](https://github.com/jasondu/dsh-ui-mobile) 0.1.8, with touch drawers, tap-to-focus chat input and a page that follows the iOS keyboard without jumping.

[Unreleased]: https://github.com/timecatbit/dsh-pocket-ui/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/timecatbit/dsh-pocket-ui/releases/tag/v0.2.0
[0.1.26]: https://github.com/timecatbit/dsh-pocket-ui/releases/tag/v0.1.26
