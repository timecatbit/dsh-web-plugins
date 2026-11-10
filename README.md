# DSH Web Plugins

[English](README.en.md) · [MIT 许可证](LICENSE) · [下载 Release](https://github.com/timecatbit/dsh-web-plugins/releases/latest)

给 DeepSeek Harness 网页版的两个插件，**可单独安装，也可一起安装**。手机布局只改网页界面；Passkey 登录由局域网代理处理。两者没有相互依赖，因此保留独立安装和回退。

本仓库提供独立 `dsh web` 和 [DeepSeek Harness 官方桌面 App](https://www.deepseek.com/en/harness/) 的安装说明。桌面版用它自己的插件管理器安装；Safari 则用于把可访问的 DSH 网页加到主屏幕或程序坞。

| 插件 | 包名 | 作用 |
| --- | --- | --- |
| [DSH Pocket UI](https://github.com/timecatbit/dsh-pocket-ui) | `dsh-ui-mobile` | 手机布局、侧栏和聊天输入 |
| [DSH Passkey Proxy](https://github.com/timecatbit/dsh-passkey-proxy) | `@smanx/dsh-proxy` | 局域网代理、密码和 HTTPS Passkey 登录 |

## 测试范围

| 环境 | 状态 | 实测 DSH 版本 |
| --- | --- | --- |
| 独立 Web 版（`dsh web`） | **已测试** | `0.2.1-rc.5`、`0.2.2-rc.1` |
| 官方 macOS 桌面版（Apple Silicon） | **已测试** | `0.2.2-rc.1` |
| 官方 Windows 桌面版 | **未测试，兼容性未确认** | — |

手机布局依赖 DSH 的客户端接口，新 RC 要验证后才加入支持范围。命令行版的 Node.js 版本以 DSH CLI 要求为准，官方桌面 App 自带运行环境。

<a id="安装"></a>

## 安装与更新

### 在 DSH 里安装和更新

1. 打开「插件」，在实验性插件中启用「自定义插件索引」。
2. 进入「发现 → 添加索引源」，添加以下地址。只需添加一次：

   ```text
   https://raw.githubusercontent.com/timecatbit/dsh-web-plugins/main/plugin-index.json
   ```

3. 点开 **DSH Pocket UI** 或 **DSH Passkey Proxy** 的卡片标题，在「版本」里选择新版并安装。原来通过本仓库的 `.tgz` 安装过，也可以按此操作，包名和设置路径保持一致。若 DSH 提示重启，重启当前实例。 看到「有更新」时，仍然点卡片标题进入「版本」；更新由你确认。

### 手动安装：官方桌面 App

1. 在 App 左侧点「插件 → 添加插件」；「设置 → 内置插件」是查看列表的入口。
2. 粘贴所需安装包的完整地址，一次装一个：

   ```text
   https://github.com/timecatbit/dsh-pocket-ui/releases/download/v0.1.9/dsh-ui-mobile-0.1.9.tgz
   https://github.com/timecatbit/dsh-passkey-proxy/releases/download/v0.1.8/smanx-dsh-proxy-0.1.8.tgz
   ```

3. 也可以下载 `.tgz` 后在同一输入框填入文件的绝对路径。安装后点「立即启用」。如果 App 提示重启，完全退出后重新打开。别用系统 npm 安装的 `dsh` CLI 往 `desktop` profile 装包；它不管理桌面 App 的插件。
4. 若要让手机访问**这个桌面实例**，还要给它提供一个手机能访问的网页入口。用本仓库代理时，在桌面 App 的「设置 → 局域网代理」里设置账号密码，开启「允许局域网设备访问」，并在「高级」里开启「认证后自动进入 DSH」。保存后用手机打开 `http://电脑的局域网IP:代理端口`。也可给代理配置 HTTPS 后使用 Passkey。两个插件不相互依赖；Mobile UI 单独安装不会开启远程入口。

### 手动安装：独立 `dsh web`

在运行 `dsh web` 的机器上安装。用与网页进程相同的系统账号和 `DSH_HOME`（默认 `~/.dsh`）；如果用了自定义网页 profile，将命令中的 `web` 换成实际名称。

从 [Release](https://github.com/timecatbit/dsh-web-plugins/releases/latest) 下载需要的 `.tgz`，进入下载目录，然后按需执行：

```bash
# 手机布局
dsh plugin --profile web add "$PWD/dsh-ui-mobile-0.1.9.tgz"

# Passkey 代理
dsh plugin --profile web add "$PWD/smanx-dsh-proxy-0.1.8.tgz"
```

安装后**重启对应的 `dsh web` 进程**，再重新打开网页。只刷新页面不会挂载新装的插件。同名上游插件会被替换。**手机布局不需要 Passkey、局域网代理插件或域名。** 继续用原有 DSH 地址和登录方式即可；如果该网页已允许局域网访问，也可以用局域网 IP 和端口。

## 用 Safari 保存为网页 App

1. 用 Safari 打开手机或 Mac 能访问的 **DSH 网页地址**。已配置 Passkey 代理的，打开平时登录用的 HTTPS 地址。保存日常访问地址，避免把带 `?token=` 的启动链接加到桌面。
2. **iPhone / iPad**：点「分享」→「添加到主屏幕」，如果看到「作为网页 App 打开」，将它开启，再点「添加」。以后从主屏幕图标打开。[Apple 操作说明](https://support.apple.com/guide/iphone/bookmark-a-website-iph42ab2f3a7/ios)
3. **Mac（macOS Sonoma 14 或更新版本）**：Safari 菜单栏选「文件 → 添加到程序坞」，或点分享按钮后选「添加到程序坞」。[Apple 操作说明](https://support.apple.com/104996)

图标打开的仍是保存时的网页地址。Safari 不会安装插件，也不会修改 Electron 的 profile。布局主要在宽度小于 768 CSS 像素时生效，也适配部分触屏横屏窗口；普通桌面宽窗口看不到手机侧栏等变化。

## 配置 Passkey 代理

桌面版将代理设置和 Passkey 记录存到 `~/.dsh/profiles/desktop/`，自动跟随桌面宿主的端口。不会自动导入旧的全局代理配置。桌面版默认监听 `127.0.0.1`，也默认关闭代理代办 DSH 启动令牌校验；两项都可以在设置里按需开启。

独立 `dsh web` 保留原来的 `~/.dsh/dsh-proxy.json`、Passkey 记录和默认设置。共用同一 `DSH_HOME` 的独立网页 profile 仍共用这份配置。两种入口的默认代理端口都是 `3081`；同机同时运行时，请给它们设置不同端口。代理自己的认证始终有效。不要把未加 TLS 的入口直接暴露到公网。

1. 第一次在**服务器原来的 DSH 网页**打开「设置 → 局域网代理」，设置代理账号和密码。未配置时代理拒绝未登录请求。密码登录默认开启，Passkey 可选。
2. **只用局域网**：打开 `http://服务器IP:3081`（或自己的代理端口）。浏览器把账号密码交给代理，代理验证后签发登录 Cookie，再把请求转发给 DSH。HTTP 不加密，只在可信局域网使用。启用「认证后自动进入 DSH」时，代理会在认证成功后代办 DSH 自己的启动令牌校验。
3. **要用 HTTPS 或 Passkey**：把自己的 HTTPS 域名反代到代理端口。反代须保留原始 `Host`、设置 `X-Forwarded-Proto: https` 并支持 WebSocket。填写完整 HTTPS 地址，例如 `https://dsh.example.com`。反代在同机、通过 `127.0.0.1` 或 `::1` 连接时，可以不填反代 IP；留空只信任这两个地址。
4. **反代在另一台机器或用容器地址连接**：填写 DSH 实际收到的来源 IP。找不到时，先保存域名，从另一标签页打开它一次，再回到设置点「检查最近的反代来源」。核对后手动填写；检测结果不会自动加入信任列表。
5. 打开「Passkey 登录」开关，在 HTTPS 域名用密码登录一次，进入「管理 Passkey」注册并试用。最多 5 个。你可以随后关闭密码登录；关闭后，**局域网 HTTP 也不能用密码登录**。密码仍用于验证添加或移除 Passkey，但不能用于登录。系统会拒绝关闭两种方式，或在仅允许 Passkey 时移除最后一个可用凭据。

HTTPS 域名和 Passkey 开关相互独立：可以保留 HTTPS、关闭 Passkey，只用密码登录。设置 `DSH_PROXY_PASSKEY_ORIGIN` 和 `DSH_PROXY_TLS_PROXIES` 时，域名及来源地址由环境变量管理，网页上只读，登录开关仍可修改。更改域名或可信来源前，先保留或重新开启密码登录。

## 回退与源码

- 回退时，把上一版的可信 `.tgz` 装回同一个 profile，再重启对应的 DSH 实例。两个插件可以分别回退。
- 退回不支持登录开关的旧版代理时，旧版不会保留「仅 Passkey」策略。
- 代理设置和凭据记录保存在各自部署的 DSH 数据目录。备份时妥善保管；不要把数据文件或服务配置提交到仓库。
- [代理源码](plugins/passkey-proxy) · [手机布局构建补丁](plugins/mobile-layout) · [构建说明](BUILDING.md)

代理基于 [smanx/dsh-proxy](https://github.com/smanx/dsh-proxy) 0.1.7；手机布局基于 [jasondu/dsh-ui-mobile](https://github.com/jasondu/dsh-ui-mobile) 0.1.8。两个衍生包均保留上游 MIT 许可证；代理随包附带第三方依赖许可。
