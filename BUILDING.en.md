# Build from source

[简体中文](BUILDING.md)

Prerequisites: Node.js 24 recommended, pnpm 11, npm, Python 3, and network access to the npm registry on the first build.

```bash
bash scripts/build-release.sh
```

The script checks and bundles the proxy source, fetches the integrity-pinned mobile UI package from npm, applies the compatibility and layout patches, type-checks, builds and tests the IM gateway, and writes the three installable archives and `SHA256SUMS` to `dist/`.

For each release, unpack the archive's `package/` contents at the root of its release repository (`dsh-pocket-ui`, `dsh-passkey-proxy` or `dsh-im-gateway`). Commit, tag with the package version, and publish the matching tarball as a release asset. These Git repositories ship prebuilt files so DSH can install them without a build script. Keep the package names (`@timecatbit/dsh-pocket-ui`, `@timecatbit/dsh-passkey-proxy`, `@timecatbit/dsh-im-gateway` since Pocket UI 0.2.0, Passkey Proxy 0.2.0 and IM Gateway 0.4.0) unchanged so installations remain updatable.

### Changelog and release notes

Every user-visible change goes into the plugin's changelog under **Unreleased**, in Chinese in `CHANGELOG.md` and in English in `CHANGELOG.en.md` (`plugins/<plugin>/`, [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)). At release time that section becomes `## [x.y.z] - YYYY-MM-DD` in both files, and the link list at the bottom gets the new tag. The archives ship both files, so each release repository has them at its root. The combined releases are listed in the root `CHANGELOG.md` and `CHANGELOG.en.md`. Like the READMEs, every document is kept in Chinese (`name.md`) and English (`name.en.md`), each linking to the other at the top.

A GitHub release note is written in Chinese first, followed by the same text in English inside a collapsed `<details><summary>English</summary>` block. It only says what a user needs to know:
- one or two sentences on what changes for them;
- anything they must do, such as a breaking change with a link to the upgrade steps;
- where to install or update, and a link to the changelog.

Leave out test details, causes and the history of earlier versions; those live in the changelog and the commits. The combined release note lists the bundled versions in a table, plus the same short summary. `release-notes.md` holds the combined note for the next release.

After the commits are public, update the Discover index in this repository:

```bash
python3 scripts/update-plugin-index.py plugin-index.json dist/timecatbit-dsh-pocket-ui-<version>.tgz <mobile-commit-sha>
python3 scripts/update-plugin-index.py plugin-index.json dist/timecatbit-dsh-passkey-proxy-<version>.tgz <proxy-commit-sha>
python3 scripts/update-plugin-index.py plugin-index.json dist/timecatbit-dsh-im-gateway-<version>.tgz <gateway-commit-sha>
```

Each entry pins the release repository's full commit and takes the compatibility range from the built package. The index keeps each plugin's newest version plus a few milestone versions to roll back to, not every release. When a version is dropped from the index, also delete its release and tag in the release repository. Combined releases in this repository follow the same milestones: keep the one that bundles each kept pair and delete the rest.

- **Passkey proxy:** derived from `smanx/dsh-proxy` commit `36954a30af329f4f4d54b6961c75f018e93eb873`. TypeScript sources and the pnpm lockfile are in `plugins/passkey-proxy/dsh-proxy`. The dependency license notices are at `plugins/passkey-proxy/THIRD-PARTY-NOTICES.md`.
- **Mobile layout:** based on the published `dsh-ui-mobile@0.1.8` distribution. The scripts pin the upstream SHA-512 integrity and verify both intermediate file manifests. The added layout CSS and JavaScript are in `plugins/mobile-layout`.
- **IM gateway:** derived from `zhuiyueya/dsh-im-gateway` commit `8e8fbca125dda15b5cdd2ae79ac63a91e21f7c37` (the npm `dsh-im-gateway@0.3.3` release). The TypeScript sources, the upstream tests, the browser half (`client.js`) and the pnpm lockfile are in `plugins/im-gateway`; the first commit there is the unchanged import, so `git log -p plugins/im-gateway` shows every change since. The dev dependencies pin the DSH packages the code is type-checked against; move them to the newest tested DSH when you add one. The published manifest has no `prepare` or `prepack` script, so a Git install never tries to build it.

## Supported range and tested versions

All three packages declare `engines.dsh` as `>=0.2.1-rc.5` (`HOST_RANGE` in `build_dsh_phone_layout.py`, `plugins/passkey-proxy/package.json` and `plugins/im-gateway/package.json`). DSH checks only `engines.dsh` when a package has one, so the gateway's older `peerDependencies` ranges no longer decide whether it loads. DSH matches the range with prereleases included, so every later release, RC or stable, can install the plugins without a new build. Keep the range open. Close it only when a known DSH release breaks a plugin; then ship a plugin version whose range excludes that release.

The tested versions are a separate, shorter list. Add a DSH version to it only after you have checked it:

1. Install DSH at that version into a temporary directory and start `dsh web` with a disposable `DSH_HOME` and its own ports. Put `{"listenPort": <free port>}` in that home's `dsh-proxy.json` first so the proxy does not collide with a running instance on 3081.
2. Install the three archives into the `web` profile. Check in a narrow browser that the sidebar, settings and composer work and a wide window keeps the desktop layout. Sign in through the proxy port and check that the app loads and its WebSocket connects, and that **Settings → Passkey Proxy** shows the proxy running, and that **Settings → Pocket UI → Home-screen icon** switches the served icon. Check that the DSH log has no `skipping profile bundle` line, that `gateway.log` reports the API registered and the gateway started, that **Settings → IM Gateway** lists the channels, and that **Connect (scan)** on the WeChat card shows a QR image served from `/dsh-im-gateway/api/channels/wechat/login-qr` with no browser request to another host. Use a disposable `DSH_HOME`: the gateway takes a lock on it, and a WeChat scan there would sign that account into the test instance.
   Also start that DSH once without any plugin and check each host problem Pocket UI works around. DSH's own fix wins: Pocket UI must not engage where DSH has fixed a problem. The editor font, long-word wrapping, the 45% picker cap and the transcript rubber band are measured on the page (`dshPhoneHostChecks` in `dsh-phone-layout.js`), so Pocket UI steps aside there by itself. The rest still need DSH to fix them: popups that jump while an answer streams (`installPhonePopupPin`), **+** raising the keyboard over its list (`installPhoneComposerFocus`), and settings controls past the screen edge. When DSH fixes one of these, remove the workaround, or limit it to the DSH versions that still need it.
3. Add the version to the tested-version tables in `README.md`, `README.en.md`, and the three plugins' READMEs. The plugin READMEs ship inside the archives, so a table change reaches the release repositories with the next build.
4. Record the full list for each plugin in the Discover index. Discover shows these as "Tested on DSH …" tags on the plugin cards:

   ```bash
   python3 scripts/set-tested-dsh.py plugin-index.json @timecatbit/dsh-pocket-ui 0.2.1-rc.5 0.2.2-rc.1 0.2.2-rc.2 0.2.2-rc.3 0.2.2-rc.5 0.2.3-alpha.2
   python3 scripts/set-tested-dsh.py plugin-index.json @timecatbit/dsh-passkey-proxy 0.2.1-rc.5 0.2.2-rc.1 0.2.2-rc.2 0.2.2-rc.3 0.2.2-rc.5 0.2.3-alpha.2
   python3 scripts/set-tested-dsh.py plugin-index.json @timecatbit/dsh-im-gateway 0.2.1-rc.5 0.2.2-rc.1 0.2.2-rc.2 0.2.2-rc.3 0.2.2-rc.5 0.2.3-alpha.2
   ```

   The script replaces the plugin's tested tags and drops declarations no plugin uses. The tags describe the newest version of each plugin. A DSH release that only needs a new tag does not need a new plugin build.

## Regression checks

The IM gateway's checks run with `pnpm run check` in `plugins/im-gateway`: a type check against the pinned DSH packages, the build, and the upstream `node --test` suite plus the local QR tests. They use mock contexts and need no chat account.

The proxy's browser smoke test uses Chrome with a virtual WebAuthn authenticator. Install Playwright separately or point `DSH_TEST_PLAYWRIGHT` at an existing Playwright package directory, then run `node scripts/passkey-smoke.mjs` from `plugins/passkey-proxy/dsh-proxy` after building. OpenSSL is used for a local test certificate. No production service, domain, or account is needed.

The mobile viewport regression check is independent of a DSH account. Point `DSH_TEST_PLAYWRIGHT` at an installed Playwright package, install its browser engine, and run:

```bash
DSH_TEST_BROWSER=webkit node scripts/mobile-viewport-check.mjs
DSH_TEST_BROWSER=chromium node scripts/mobile-viewport-check.mjs
```

Chromium uses the installed Chrome channel by default; override it with `DSH_TEST_CHROME_CHANNEL`. A custom WebKit executable can be supplied through `DSH_TEST_WEBKIT_EXECUTABLE`. The check replays keyboard-like VisualViewport events in a fixture with a scrolling transcript and a sticky composer. It checks that those events never move or resize the app, which the browser's own pan already carries, and that a pan left after dismissal is reset only once the viewport is quiet. It also covers zoom, focused editors, desktop widths, cleanup, draft and scroll retention, and the composer and command-search focus rules. It does not emulate a real iOS software keyboard; verify the animation on a physical iPhone as well.
