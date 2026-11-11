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

Each entry pins the release repository's full commit and takes the compatibility range from the built package. Keep previous versions in the index so users can select an earlier release.

- **Passkey proxy:** derived from `smanx/dsh-proxy` commit `36954a30af329f4f4d54b6961c75f018e93eb873`. TypeScript sources and the pnpm lockfile are in `plugins/passkey-proxy/dsh-proxy`. The dependency license notices are at `plugins/passkey-proxy/THIRD-PARTY-NOTICES.md`.
- **Mobile layout:** based on the published `dsh-ui-mobile@0.1.8` distribution. The scripts pin the upstream SHA-512 integrity and verify both intermediate file manifests. The added layout CSS and JavaScript are in `plugins/mobile-layout`.

Before adding a DSH release candidate to `HOST_RANGE`, install the mobile archive into a disposable `dsh web` profile on that version. Check the merged config with `--dump-config`, then verify sidebar, settings and composer in a narrow browser and check that a wide window still uses the desktop layout. Update the supported versions in the READMEs with the package metadata. Avoid advertising an untested prerelease range: the plugin uses host slots, layout services and DOM attributes that can change between RCs.

The proxy's browser smoke test uses Chrome with a virtual WebAuthn authenticator. Install Playwright separately or point `DSH_TEST_PLAYWRIGHT` at an existing Playwright package directory, then run `node scripts/passkey-smoke.mjs` from `plugins/passkey-proxy/dsh-proxy` after building. OpenSSL is used for a local test certificate. No production service, domain, or account is needed.

The mobile viewport regression check is independent of a DSH account. Point `DSH_TEST_PLAYWRIGHT` at an installed Playwright package, install its browser engine, and run:

```bash
DSH_TEST_BROWSER=webkit node scripts/mobile-viewport-check.mjs
DSH_TEST_BROWSER=chromium node scripts/mobile-viewport-check.mjs
```

Chromium uses the installed Chrome channel by default; override it with `DSH_TEST_CHROME_CHANNEL`. A custom WebKit executable can be supplied through `DSH_TEST_WEBKIT_EXECUTABLE`. The check replays keyboard-like VisualViewport events and the associated native document pan in a scrolling editor fixture. It checks the app position in the same event, before the next animation frame, plus draft/scroll retention, zoom, delayed geometry, and cleanup. It does not emulate a real iOS software keyboard; verify the animation on a physical iPhone as well.
