# DSH Passkey Proxy

[English](README.en.md) · [下载](https://github.com/timecatbit/dsh-passkey-proxy/releases) · [MIT 许可证](LICENSE)

给 DeepSeek Harness（DSH）增加一个独立的网页入口，支持局域网账号密码、HTTPS Passkey 和 WebSocket 转发。**可以单独安装**，不依赖 [DSH Pocket UI](https://github.com/timecatbit/dsh-pocket-ui)。没有域名也可以在可信局域网用 IP 和密码；Passkey 需要配置受浏览器信任的 HTTPS 域名。

## 兼容性和安装

**支持范围：DSH `0.2.1-rc.5` 及之后的所有版本**（从 0.1.9 起）。DSH 发布新版后可以直接安装和启用。没测过的新版本可能出现登录或连接问题，遇到请[提 issue](https://github.com/timecatbit/dsh-passkey-proxy/issues)，修复后发布新版。

**已测试版本**是实际装上测过的版本；你的 DSH 版本不在表里，只表示还没测过。DSH「发现」里卡片上的「已测 DSH …」标签也是这份列表。

| DSH 环境 | 已测试的 DSH 版本 |
| --- | --- |
| 独立 Web 版（`dsh web`） | `0.2.1-rc.5`、`0.2.2-rc.1`、`0.2.2-rc.2`、`0.2.2-rc.3` |
| 官方 macOS 桌面版（Apple Silicon） | `0.2.2-rc.1` |
| 官方 Windows 桌面版 | 未测试 |

包名保留为 `@smanx/dsh-proxy`，同一个 profile 可直接更新旧版。

1. 从 DSH 左侧栏点「插件」，找到「实验性插件」。没有看到开关就点该栏右侧「更多」。在 `0.2.1-rc.5` 打开 **「自定义插件市场」**，在 `0.2.2-rc.1` 及之后打开 **「自定义插件索引」**。
2. 进「发现 → 添加索引源」，添加下面的地址。和 Pocket UI 共用，只需每个 profile 添加一次。

   ```text
   https://raw.githubusercontent.com/timecatbit/dsh-web-plugins/main/plugin-index.json
   ```

3. 点 **DSH Passkey Proxy 的卡片标题 → 版本 → 安装**。更新也走这条路径，无需先卸载。安装后如有提示，启用插件并重启当前 DSH 实例。

**手动安装：** 官方 macOS 桌面 App 用左侧「插件 → 添加插件」，粘贴 [0.1.15 安装包下载地址](https://github.com/timecatbit/dsh-passkey-proxy/releases/download/v0.1.15/smanx-dsh-proxy-0.1.15.tgz) 或已下载文件的绝对路径；启用后按提示完全退出并重新打开 App。独立 Web 版用运行 DSH 的同一个系统账号和 `DSH_HOME`，在文件所在目录运行：

```bash
dsh plugin --profile web add "$PWD/smanx-dsh-proxy-0.1.15.tgz"
```

使用自定义 Web profile 时替换 `web`。装完重启该 `dsh web` 进程。不要用独立 CLI 安装到官方桌面 App 的 `desktop` profile。

## 只在局域网用账号密码

1. 从原来的 DSH 网页或桌面 App 打开「设置 → Passkey Proxy」，设置代理用户名和密码，保留「允许密码登录」。
2. 默认代理端口是 `3081`，它和 DSH 自己的端口是两个端口。桌面版默认只监听本机；要让同网手机访问，打开「允许局域网设备访问」。保存并确认代理显示「运行中」。
3. 手机连接同一个局域网，打开 `http://服务器局域网IP:3081`（端口改过就用实际值）。登录用的是刚设的**代理账号**。代理验证密码后签发浏览器会话 Cookie，再把请求转发给 DSH。没有 HTTPS 的 HTTP 不加密，请只在可信局域网用。

如果代理登录后还遇到 DSH 自己的启动令牌验证，在「高级」按需打开「认证后自动进入 DSH」。它只在代理验证用户之后代办这一步，代理登录仍然需要。此项在桌面版默认关闭，独立 Web 版保留原默认值。

## 用 HTTPS 和 Passkey

1. 将自己的 HTTPS 域名反代到 **代理端口**。保留原始 `Host`，设置 `X-Forwarded-Proto: https`，启用 WebSocket 转发。在设置的「对外 HTTPS 域名」填写完整源地址，例如 `https://dsh.example.com`，不要加路径。
2. **反代在同机且从回环连接**：反代来源 IP 可留空，默认只信任 `127.0.0.1` 和 `::1`。**反代在另一台机器或从容器地址连接**：填写 DSH 实际收到的来源 IP，多个值用英文逗号分隔。可以先保存域名，从另一标签页访问一次，再点「检查最近的反代来源」。核对后手填，检测结果不会自动受信任。
3. 保留密码登录，打开「Passkey 登录」。用该 HTTPS 域名以密码登录一次，进「管理 Passkey」添加并测试。最多 5 个。注册和登录都使用同一个 HTTPS 域名。
4. 确认 Passkey 可用后，可按需关闭「允许密码登录」。关闭后，HTTP 局域网入口也不能用密码登录；旧密码仍用于验证添加或移除 Passkey。两种登录方式不能同时关闭，仅允许 Passkey 时不能移除最后一个可用凭据。

只想用 HTTPS 密码登录，可以关闭 Passkey。部署通过 `DSH_PROXY_PASSKEY_ORIGIN` 或 `DSH_PROXY_TLS_PROXIES` 管理入口时，地址字段在网页上只读，登录开关仍可改。

## 添加到手机主屏幕

主屏幕图标和网页清单不经过代理登录，所以手机通过代理把 DSH 添加到主屏幕时能拿到图标。建议先登录进入 DSH 页面，再用浏览器的「添加到主屏幕」。图标默认是 DSH 自带的；想换成黑白鲸鱼，安装 [DSH Pocket UI](https://github.com/timecatbit/dsh-pocket-ui)，在「设置 → 通用 → 主屏幕图标」里选。

## 维护和排查

| 现象 | 先检查 |
| --- | --- |
| 手机打不开局域网地址 | 手机和服务器是否在同一局域网，代理是否运行，桌面版是否允许局域网访问，端口是否正确 |
| 登录页提示「请求来源不匹配」或没有 Passkey | HTTPS 域名是否完全匹配、反代是否保留 Host 和 HTTPS 协议头、实际反代来源 IP 是否已信任 |
| 密码验证后还要登录一次 | 检查「认证后自动进入 DSH」，以及使用的是代理端口还是 DSH 原生端口 |
| 代理启动失败 | 检查端口是否被占用；同一台机器上的两个实例需要不同代理端口 |
| 聊天能开但实时连接失败 | 检查反代是否转发 WebSocket |

桌面版配置在 `$DSH_HOME/profiles/desktop/`，会跟随桌面宿主端口，不自动导入旧全局配置。独立 Web 版使用 `$DSH_HOME/`（默认 `~/.dsh/`），共用同一数据根目录的独立 Web profile 仍共用这份配置。更新或回退前可以备份其中的 `dsh-proxy.json` 和 `dsh-proxy-auth.json`；不要把这些文件提交到仓库。回退时将上一版可信安装包装到同一 profile 后重启。早期不支持登录开关的代理版本不会继续执行「仅 Passkey」策略。

## 源码和许可证

这里发布已构建的安装包。[代理源码、构建脚本和统一更新索引](https://github.com/timecatbit/dsh-web-plugins)在原仓库维护。此插件基于 [smanx/dsh-proxy](https://github.com/smanx/dsh-proxy)，采用 [MIT 许可证](LICENSE)，保留上游版权声明。[第三方依赖许可证](THIRD-PARTY-NOTICES.md)随包分发。问题可报到 [Issues](https://github.com/timecatbit/dsh-passkey-proxy/issues)，请注明 DSH 和插件版本，并删去密码、Cookie 和启动令牌。
