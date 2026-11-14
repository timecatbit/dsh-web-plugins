# Build from source

Prerequisites: Node.js 24 recommended, pnpm 11, npm, Python 3, and network access to the npm registry on the first build.

```bash
bash scripts/build-release.sh
```

The script checks and bundles the proxy source, fetches the integrity-pinned mobile UI package from npm, applies the compatibility and layout patches, and writes both installable archives and `SHA256SUMS` to `dist/`.

For each release, unpack the archive's `package/` contents at the root of its release repository (`dsh-pocket-ui` or `dsh-passkey-proxy`). Commit, tag with the package version, and publish the matching tarball as a release asset. These Git repositories ship prebuilt files so DSH can install them without a build script. Keep package names unchanged so previous installations remain updatable.

After the commits are public, update the Discover index in this repository:

```bash
python3 scripts/update-plugin-index.py plugin-index.json dist/dsh-ui-mobile-<version>.tgz <mobile-commit-sha>
python3 scripts/update-plugin-index.py plugin-index.json dist/smanx-dsh-proxy-<version>.tgz <proxy-commit-sha>
```

Each entry pins the release repository's full commit and takes the compatibility range from the built package. The index keeps each plugin's newest version plus a few milestone versions to roll back to, not every release. When a version is dropped from the index, also delete its release and tag in the release repository. Combined releases in this repository follow the same milestones: keep the one that bundles each kept pair and delete the rest.

- **Passkey proxy:** derived from `smanx/dsh-proxy` commit `36954a30af329f4f4d54b6961c75f018e93eb873`. TypeScript sources and the pnpm lockfile are in `plugins/passkey-proxy/dsh-proxy`. The dependency license notices are at `plugins/passkey-proxy/THIRD-PARTY-NOTICES.md`.
- **Mobile layout:** based on the published `dsh-ui-mobile@0.1.8` distribution. The scripts pin the upstream SHA-512 integrity and verify both intermediate file manifests. The added layout CSS and JavaScript are in `plugins/mobile-layout`.

## Supported range and tested versions

Both packages declare `engines.dsh` as `>=0.2.1-rc.5` (`HOST_RANGE` in `build_dsh_phone_layout.py` and `plugins/passkey-proxy/package.json`). DSH matches the range with prereleases included, so every later release, RC or stable, can install the plugins without a new build. Keep the range open. Close it only when a known DSH release breaks a plugin; then ship a plugin version whose range excludes that release.

The tested versions are a separate, shorter list. Add a DSH version to it only after you have checked it:

1. Install DSH at that version into a temporary directory and start `dsh web` with a disposable `DSH_HOME` and its own ports. Put `{"listenPort": <free port>}` in that home's `dsh-proxy.json` first so the proxy does not collide with a running instance on 3081.
2. Install both archives into the `web` profile. Check in a narrow browser that the sidebar, settings and composer work and a wide window keeps the desktop layout. Sign in through the proxy port and check that the app loads and its WebSocket connects, and that **Settings → Passkey Proxy** shows the proxy running, and that **Settings → Pocket UI → Home-screen icon** switches the served icon.
3. Add the version to the tested-version tables in `README.md`, `README.en.md`, and both plugins' READMEs. The plugin READMEs ship inside the archives, so a table change reaches the release repositories with the next build.
4. Record the full list for each plugin in the Discover index. Discover shows these as "Tested on DSH …" tags on the plugin cards:

   ```bash
   python3 scripts/set-tested-dsh.py plugin-index.json dsh-ui-mobile 0.2.1-rc.5 0.2.2-rc.1 0.2.2-rc.2 0.2.2-rc.3
   python3 scripts/set-tested-dsh.py plugin-index.json @smanx/dsh-proxy 0.2.1-rc.5 0.2.2-rc.1 0.2.2-rc.2 0.2.2-rc.3
   ```

   The script replaces the plugin's tested tags and drops declarations no plugin uses. The tags describe the newest version of each plugin. A DSH release that only needs a new tag does not need a new plugin build.

## Regression checks

The proxy's browser smoke test uses Chrome with a virtual WebAuthn authenticator. Install Playwright separately or point `DSH_TEST_PLAYWRIGHT` at an existing Playwright package directory, then run `node scripts/passkey-smoke.mjs` from `plugins/passkey-proxy/dsh-proxy` after building. OpenSSL is used for a local test certificate. No production service, domain, or account is needed.

The mobile viewport regression check is independent of a DSH account. Point `DSH_TEST_PLAYWRIGHT` at an installed Playwright package, install its browser engine, and run:

```bash
DSH_TEST_BROWSER=webkit node scripts/mobile-viewport-check.mjs
DSH_TEST_BROWSER=chromium node scripts/mobile-viewport-check.mjs
```

Chromium uses the installed Chrome channel by default; override it with `DSH_TEST_CHROME_CHANNEL`. A custom WebKit executable can be supplied through `DSH_TEST_WEBKIT_EXECUTABLE`. The check replays keyboard-like VisualViewport events in a fixture with a scrolling transcript and a sticky composer. It checks that those events never move or resize the app, which the browser's own pan already carries, and that a pan left after dismissal is reset only once the viewport is quiet. It also covers zoom, focused editors, desktop widths, cleanup, draft and scroll retention, and the composer and command-search focus rules. It does not emulate a real iOS software keyboard; verify the animation on a physical iPhone as well.
