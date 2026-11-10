# Build from source

Prerequisites: Node.js 24 recommended, pnpm 11, npm, Python 3, and network access to the npm registry on the first build.

```bash
bash scripts/build-release.sh
```

The script checks and bundles the proxy source, fetches the integrity-pinned mobile UI package from npm, applies the compatibility and layout patches, and writes both installable archives and `SHA256SUMS` to `dist/`.

- **Passkey proxy:** derived from `smanx/dsh-proxy` commit `36954a30af329f4f4d54b6961c75f018e93eb873`. TypeScript sources and the pnpm lockfile are in `plugins/passkey-proxy/dsh-proxy`. The dependency license notices are at `plugins/passkey-proxy/THIRD-PARTY-NOTICES.md`.
- **Mobile layout:** based on the published `dsh-ui-mobile@0.1.8` distribution. The scripts pin the upstream SHA-512 integrity and verify both intermediate file manifests. The added layout CSS and JavaScript are in `plugins/mobile-layout`.

Before adding a DSH release candidate to `HOST_RANGE`, install the mobile archive into a disposable `dsh web` profile on that version. Check the merged config with `--dump-config`, then verify sidebar, settings and composer in a narrow browser and check that a wide window still uses the desktop layout. Update the supported versions in the READMEs with the package metadata. Avoid advertising an untested prerelease range: the plugin uses host slots, layout services and DOM attributes that can change between RCs.

The proxy's browser smoke test uses Chrome with a virtual WebAuthn authenticator. Install Playwright separately or point `DSH_TEST_PLAYWRIGHT` at an existing Playwright package directory, then run `node scripts/passkey-smoke.mjs` from `plugins/passkey-proxy/dsh-proxy` after building. OpenSSL is used for a local test certificate. No production service, domain, or account is needed.
