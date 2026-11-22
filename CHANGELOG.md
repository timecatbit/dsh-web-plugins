# 更新日志

[English](CHANGELOG.en.md)

DSH Web Plugins 合集版本：每个合集打包了哪些插件版本，以及主要改动。各插件的完整历史见各自的更新日志：[Pocket UI](plugins/mobile-layout/CHANGELOG.md)、[Passkey Proxy](plugins/passkey-proxy/CHANGELOG.md)、[IM Gateway](plugins/im-gateway/CHANGELOG.md)。格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [未发布]

## [1.5.1] - 2026-11-22

Pocket UI 0.2.1、Passkey Proxy 0.2.1、IM Gateway 0.4.0。

- 适配 DSH 0.2.3-alpha：通过 Passkey Proxy 登录后能进入 DSH，主屏幕图标照常显示。用 DSH 0.2.3-alpha 或更新版本时请装这两个新版。

## [1.5.0] - 2026-11-16

Pocket UI 0.2.0、Passkey Proxy 0.2.0、IM Gateway 0.4.0。

- **不兼容变更：** 三个插件改用本项目自己的包名。安装前先移除旧包，见[从旧包名升级](README.md#从旧包名升级)。
- Pocket UI 保留 DSH 自己的修复。

## [1.4.22] - 2026-11-15

Pocket UI 0.1.26、Passkey Proxy 0.1.16、IM Gateway 0.3.5。旧包名下的最后一个合集版本。

- 模型输出时，输入框区域的弹窗保持不动。

## 1.4.21 - 2026-11-15

Pocket UI 0.1.25：键盘弹出时，输入框下方的统计不再贴着上边。

## 1.4.20 - 2026-11-15

Pocket UI 0.1.24：iOS 上聊天记录到顶或到底不再回弹。

## 1.4.19 - 2026-11-15

IM Gateway 0.3.5：DSH 重启后微信自动重连。

## 1.4.18 - 2026-11-15

IM Gateway 0.3.4 加入合集。

## 1.4.17 - 2026-11-14

Pocket UI 0.1.23：打开 App 时页面不再下掉。

## 1.4.16 - 2026-11-14

Pocket UI 0.1.22 和 Passkey Proxy 0.1.16：Pocket UI 有了自己的设置页。

## 1.4.15 - 2026-11-14

Pocket UI 0.1.21 和 Passkey Proxy 0.1.15：主屏幕图标选项移到 Pocket UI；代理改名为 Passkey Proxy。

## 1.4.12 – 1.4.14 - 2026-11-14

Passkey Proxy 0.1.12 至 0.1.14：通过代理也能显示主屏幕图标。

## 1.4.10 – 1.4.11 - 2026-11-14

Pocket UI 0.1.19、0.1.20 和 Passkey Proxy 0.1.10、0.1.11：支持 DSH 0.2.2-rc.3，手机设置页不再超出屏幕。

## 1.4.7 – 1.4.9 - 2026-11-12

Pocket UI 0.1.16 至 0.1.18 和 Passkey Proxy 0.1.9：支持 DSH 0.2.1-rc.5 之后的所有版本；页面跟着侧栏移动。

## 1.4.5 – 1.4.6 - 2026-11-11

Pocket UI 0.1.14、0.1.15 和 Passkey Proxy 0.1.8：输入框下方的状态栏，侧栏与页面统一底色。

[未发布]: https://github.com/timecatbit/dsh-web-plugins/compare/v1.5.1...HEAD
[1.5.1]: https://github.com/timecatbit/dsh-web-plugins/releases/tag/v1.5.1
[1.5.0]: https://github.com/timecatbit/dsh-web-plugins/releases/tag/v1.5.0
[1.4.22]: https://github.com/timecatbit/dsh-web-plugins/releases/tag/v1.4.22
