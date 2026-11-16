# 更新日志

[English](CHANGELOG.en.md)

DSH IM Gateway 的重要改动都记在这里。格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

## [0.4.0] - 2026-11-16

### 变更

- **不兼容变更：** 包名改为 `@timecatbit/dsh-im-gateway`（原来是 `dsh-im-gateway`，和 npm 上的原版同名）。先移除旧包再装这一版；渠道配置、微信登录状态和定时提醒都会保留。见[从旧包名升级](https://github.com/timecatbit/dsh-web-plugins#从旧包名升级)。
- 聊天里的帮助回复显示「DSH IM Gateway」。

## [0.3.5] - 2026-11-15

### 修复

- 扫码连接的渠道（如微信、WhatsApp）在 DSH 重启后会自动重连。

## 0.3.4 - 2026-11-15

本项目基于 [zhuiyueya/dsh-im-gateway](https://github.com/zhuiyueya/dsh-im-gateway) 0.3.3 维护的第一个版本。

### 变更

- 插件列表、设置和文档里都叫 DSH IM Gateway。

### 修复

- 在 DSH 0.2.x 上不需要兼容豁免也能加载。
- 点「连接（扫码）」后，微信登录二维码立即出现。
- 设置页跟随 DSH 主题，浅色模式下按钮文字看得清。

### 安全

- 微信登录二维码在本机生成。原版会把登录链接发给第三方图片服务。
- Baileys 限定在已修补的 6.7 系列（GHSA-qvv5-jq5g-4cgg）。

[未发布]: https://github.com/timecatbit/dsh-im-gateway/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/timecatbit/dsh-im-gateway/releases/tag/v0.4.0
[0.3.5]: https://github.com/timecatbit/dsh-im-gateway/releases/tag/v0.3.5
