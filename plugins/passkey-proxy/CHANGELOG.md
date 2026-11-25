# 更新日志

[English](CHANGELOG.en.md)

DSH Passkey Proxy 的重要改动都记在这里。格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

## [0.2.2] - 2026-11-25

### 修复

- Windows 上 DSH 重启后，通过代理打开只会看到「401 Unauthorized」，没有登录页。原因是检查登录数据文件时用了 Linux 和 macOS 的权限位，Windows 上的文件总被当成别人也能读，于是拒绝加载。其他系统不受影响。

## 0.2.1 - 2026-11-22

### 修复

- 适配 DSH 0.2.3-alpha.1 起的新登录方式：通过代理登录后能直接进入 DSH，不再停在 DSH 的「连接到此 Host」页面。

## [0.2.0] - 2026-11-16

### 变更

- **不兼容变更：** 包名改为 `@timecatbit/dsh-passkey-proxy`（原来是 `@smanx/dsh-proxy`）。先移除旧包再装这一版；账号密码、Passkey 和端口都会保留。见[从旧包名升级](https://github.com/timecatbit/dsh-web-plugins#从旧包名升级)。

## [0.1.16] - 2026-11-14

### 变更

- 文档改为指向「设置 → Pocket UI」设置主屏幕图标。代理本身没有改动。

## 0.1.15 - 2026-11-14

### 变更

- 各处统一叫 **Passkey Proxy**（原来是「局域网代理 / LAN Proxy」）。

### 移除

- 去掉主屏幕图标选项，它已移到 DSH Pocket UI。代理仍然放行 Pocket UI 的主屏幕图标，不需要登录。

## 0.1.14 - 2026-11-14

### 修复

- 手机缓存了旧图标时，新选的主屏幕图标也能显示出来。

## 0.1.13 - 2026-11-14

### 新增

- 可选主屏幕图标：DSH 自带、黑底白鲸、白底黑鲸。

## 0.1.12 - 2026-11-14

### 修复

- 通过代理把 DSH 添加到手机主屏幕时，显示 DeepSeek 图标，不再是空白。

## 0.1.11 - 2026-11-14

### 修复

- 代理设置页的状态卡片适应窄窗口，较长的状态会换行，不再被截断。

## 0.1.10 - 2026-11-14

### 变更

- 在 DSH 0.2.2-rc.3 上测试通过，代码没有改动。

## 0.1.9 - 2026-11-12

### 变更

- 支持 DSH 0.2.1-rc.5 及之后的所有版本；README 列出实际测过的版本。

## 0.1.8 - 2026-11-10

### 新增

- 首次在独立仓库发布，可从 DSH「发现」安装。基于 [smanx/dsh-proxy](https://github.com/smanx/dsh-proxy) 0.1.7，支持账号密码和 HTTPS Passkey 登录。

[未发布]: https://github.com/timecatbit/dsh-passkey-proxy/compare/v0.2.2...HEAD
[0.2.2]: https://github.com/timecatbit/dsh-passkey-proxy/releases/tag/v0.2.2
[0.2.0]: https://github.com/timecatbit/dsh-passkey-proxy/releases/tag/v0.2.0
[0.1.16]: https://github.com/timecatbit/dsh-passkey-proxy/releases/tag/v0.1.16
