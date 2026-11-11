#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "$0")/.." && pwd -P)
temp=$(mktemp -d)
trap 'rm -rf -- "$temp"' EXIT
dist="$root/dist"
proxy="$root/plugins/passkey-proxy"
mobile="$root/plugins/mobile-layout"
mkdir -p "$dist"
(
  cd "$proxy/dsh-proxy"
  pnpm install --frozen-lockfile
  pnpm run check
)
(
  cd "$proxy"
  npm pack --ignore-scripts --pack-destination "$dist"
)
python3 "$mobile/build_dsh_ui_mobile_compat.py" "$temp/compat.tgz"
python3 "$mobile/build_dsh_ui_mobile_layout_only.py" "$temp/compat.tgz" "$temp/layout.tgz"
python3 "$mobile/build_dsh_phone_layout.py" "$temp/layout.tgz" "$dist/dsh-ui-mobile-0.1.15.tgz"
(
  cd "$dist"
  if command -v sha256sum >/dev/null; then
    sha256sum dsh-ui-mobile-0.1.15.tgz smanx-dsh-proxy-0.1.8.tgz > SHA256SUMS
  else
    shasum -a 256 dsh-ui-mobile-0.1.15.tgz smanx-dsh-proxy-0.1.8.tgz > SHA256SUMS
  fi
)
