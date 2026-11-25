#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "$0")/.." && pwd -P)
temp=$(mktemp -d)
trap 'rm -rf -- "$temp"' EXIT
dist="$root/dist"
proxy="$root/plugins/passkey-proxy"
mobile="$root/plugins/mobile-layout"
gateway="$root/plugins/im-gateway"
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
(
  cd "$mobile/home-screen"
  pnpm install --frozen-lockfile
  pnpm run check
)
python3 "$mobile/build_dsh_ui_mobile_compat.py" "$temp/compat.tgz"
python3 "$mobile/build_dsh_ui_mobile_layout_only.py" "$temp/compat.tgz" "$temp/layout.tgz"
python3 "$mobile/build_dsh_phone_layout.py" "$temp/layout.tgz" "$dist/timecatbit-dsh-pocket-ui-0.2.1.tgz"
(
  cd "$gateway"
  pnpm install --frozen-lockfile
  pnpm run check
  npm pack --ignore-scripts --pack-destination "$dist"
)
(
  cd "$dist"
  if command -v sha256sum >/dev/null; then
    sha256sum timecatbit-dsh-pocket-ui-0.2.1.tgz timecatbit-dsh-passkey-proxy-0.2.1.tgz timecatbit-dsh-im-gateway-0.4.1.tgz > SHA256SUMS
  else
    shasum -a 256 timecatbit-dsh-pocket-ui-0.2.1.tgz timecatbit-dsh-passkey-proxy-0.2.1.tgz timecatbit-dsh-im-gateway-0.4.1.tgz > SHA256SUMS
  fi
)
