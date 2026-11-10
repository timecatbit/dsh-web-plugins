Both plugins can now be installed through the official macOS desktop app's **Plugins → Add plugin** dialog using a release tarball URL or absolute local path. Standalone `dsh web` installation still works. See the [installation guide](https://github.com/timecatbit/dsh-web-plugins#安装).

- Passkey Proxy `0.1.7-passkeys.4` follows Desktop's current loopback port and keeps its settings separate from standalone Web. Desktop requires an explicit opt-in for LAN binding and automatic entry after proxy sign-in.
- Mobile Layout `0.1.8-mobile.15` includes Desktop installation guidance and retains the same narrow-screen layout.

### 测试范围 / Tested environments

| Environment | Status | Tested DSH versions |
| --- | --- | --- |
| Standalone Web (`dsh web`) | **已测试 / Tested** | `0.2.1-rc.5`, `0.2.2-rc.1` |
| Official macOS Desktop (Apple Silicon) | **已测试 / Tested** | `0.2.2-rc.1` |
| Official Windows Desktop | **未测试，兼容性未确认 / Not tested; compatibility unconfirmed** | — |
