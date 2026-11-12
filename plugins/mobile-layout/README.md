# DSH Pocket UI

[English](README.en.md) · [下载](https://github.com/timecatbit/dsh-pocket-ui/releases) · [MIT 许可证](LICENSE)

让 DeepSeek Harness（DSH）的网页在 iPhone、iPad 和 Android 窄屏上更好用。**可以单独安装。** 不需要 Passkey、域名或代理插件，继续用原来的 DSH 地址和登录方式即可。

## 安装后有什么变化

- 窄屏侧栏打开时，主页面向右移并淡化，仍能看到部分内容；侧栏、页面和顶部状态栏同色，没有分隔线。打字时打开侧栏或右侧面板，键盘会收起。
- 进入已有对话时不自动弹键盘；点输入框后才开始输入。
- 输入框下方的会话数据（轮次和步数、速度、token 用量、缓存命中、上下文占用）显示为单独的底部状态栏，每项一格，上行是数值，下行是说明，不再截断；点开可看详情。
- 键盘弹出和收起时，页面跟随 Safari 自带的动画移动，结束后不会再跳一次。键盘打开期间，对话顶部栏会移出屏幕，与 Safari 中其他网页一致。
- 设置页适配窄屏。手机聊天顶部只保留一个左侧栏入口；保留原生右侧栏按钮。
- 手机模式隐藏 Better Sidebar 的底部工作台按钮。桌面宽窗口保留原有工具栏。

布局主要在宽度小于 768 CSS 像素时生效，也覆盖部分触屏横屏窗口。插件只改界面，不开端口，也不额外注册 Service Worker、安装提示或 Web Push。

## 兼容性

**支持范围：DSH `0.2.1-rc.5` 及之后的所有版本**（从 0.1.16 起）。DSH 发布新版后可以直接安装和启用。没测过的新版本可能出现布局问题，遇到请[提 issue](https://github.com/timecatbit/dsh-pocket-ui/issues)，修复后发布新版。

**已测试版本**是实际装上测过的版本；你的 DSH 版本不在表里，只表示还没测过。DSH「发现」里卡片上的「已测 DSH …」标签也是这份列表。

| DSH 环境 | 已测试的 DSH 版本 |
| --- | --- |
| 独立 Web 版（`dsh web`） | `0.2.1-rc.5`、`0.2.2-rc.1`、`0.2.2-rc.2` |
| 官方 macOS 桌面版（Apple Silicon） | `0.2.2-rc.1`；宽窗口没有手机布局变化属正常 |
| 官方 Windows 桌面版 | 未测试 |

安装包名是 `dsh-ui-mobile`。已经装过本项目的旧版，可覆盖更新。同名上游插件也会被替换，请先确认要使用这个分支。

## 在 DSH 里安装或更新

1. 从 **DSH 左侧栏**打开「插件」，找到「实验性插件」。找不到开关就点这一栏右侧的「更多」。在 DSH `0.2.1-rc.5` 里打开 **「自定义插件市场」**；在 `0.2.2-rc.1` 及之后打开 **「自定义插件索引」**。
2. 在「发现 → 添加索引源」粘贴以下地址。同一个 profile 只需添加一次；如果已为 Passkey Proxy 添加过，直接跳到下一步。

   ```text
   https://raw.githubusercontent.com/timecatbit/dsh-web-plugins/main/plugin-index.json
   ```

3. 点 **DSH Pocket UI 的卡片标题 → 版本 → 安装**，确认后按提示启用。以后升级仍从这里选新版，无需先卸载。看到「有更新」也请点卡片标题。若 DSH 提示重启，重启当前实例后再刷新网页。

## 手动安装

- **官方 macOS 桌面 App**：在 App 左侧点「插件 → 添加插件」，粘贴 [0.1.17 安装包的下载地址](https://github.com/timecatbit/dsh-pocket-ui/releases/download/v0.1.17/dsh-ui-mobile-0.1.17.tgz)，或粘贴下载后文件的绝对路径。安装后点「立即启用」。如提示重启，完全退出再打开。桌面 App 的 profile 由 App 自己管理。
- **独立 `dsh web`**：从 [Releases](https://github.com/timecatbit/dsh-pocket-ui/releases) 下载 `.tgz`。用运行 DSH 的同一个系统账号和 `DSH_HOME`，在文件所在目录执行：

  ```bash
  dsh plugin --profile web add "$PWD/dsh-ui-mobile-0.1.17.tgz"
  ```

  使用自定义 profile 时替换 `web`，安装后重启该 `dsh web` 进程。

## 在手机上使用

- 手机已经能打开 DSH 网页：继续使用原地址。能在局域网访问的 IP 加端口也可以。
- 手机打不开电脑上的桌面 DSH：先给桌面实例提供一个手机能访问的网页入口。需要代理和登录时，可选装 [DSH Passkey Proxy](https://github.com/timecatbit/dsh-passkey-proxy)。
- **iPhone / iPad**：在 Safari 打开日常访问地址，点「分享 → 添加到主屏幕」，如有「作为网页 App 打开」就打开它。**Mac**：在 Safari 选「文件 → 添加到程序坞」。保存日常访问地址，别保存带 `?token=` 的启动链接。Safari 只是保存网页入口，插件装在 DSH 实例里。
- **Android**：用手机浏览器打开同一个 DSH 地址即可。

## 排查、回退与许可证

如果装完没变化，先确认手机访问的是安装插件的 DSH 实例、插件已启用、该实例已经按提示重启，再用窄屏刷新。若要回退，在「发现」选择索引里仍列出的旧版本，或用上一版可信的 `.tgz` 安装到同一 profile，再重启。遇到布局问题，可以在 [Issues](https://github.com/timecatbit/dsh-pocket-ui/issues) 提供 DSH 版本、插件版本、手机系统和浏览器，以及问题是在空白页还是已有对话里出现。

本仓库分发已构建的安装包。[布局补丁和构建脚本](https://github.com/timecatbit/dsh-web-plugins/tree/main/plugins/mobile-layout)在 [DSH Web Plugins](https://github.com/timecatbit/dsh-web-plugins) 维护。基于 [jasondu/dsh-ui-mobile](https://github.com/jasondu/dsh-ui-mobile) 0.1.8，采用 [MIT 许可证](LICENSE)，保留上游版权声明。
