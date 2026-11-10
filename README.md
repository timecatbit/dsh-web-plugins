# DSH Web Plugins

[English](README.en.md) · [MIT 许可证](LICENSE) · [下载 Release](https://github.com/timecatbit/dsh-web-plugins/releases/latest)

给 DeepSeek Harness 网页版的两个插件，**可单独安装，也可一起安装**。手机布局只改网页界面；Passkey 登录由局域网代理处理。两者没有相互依赖，因此保留独立安装和回退。

| 需求 | 安装包 | 作用 |
| --- | --- | --- |
| 手机设置和侧栏更好用 | `dsh-ui-mobile-0.1.8-mobile.13.tgz` | 窄屏单栏设置、可横滑的分类、手机抽屉和输入区适配 |
| 用密码或 Passkey 访问 DSH | `smanx-dsh-proxy-0.1.7-passkeys.3.tgz` | 局域网代理、持久网页登录、HTTPS Passkey 和 WebSocket 转发 |
| 两项都要 | 两个安装包 | 装到同一个正在使用的 profile，无安装顺序要求 |

本版支持 **DSH 0.2.1-rc.5 / 0.2.2-rc.1**。其他版本请先在测试实例验证。Passkey 代理的构建目标是 Node.js 22 或更新版本。

## 安装

先确认**提供当前页面的 DSH 实例**使用哪个 profile。服务器若以 `web` profile 运行，就装到 `web`；桌面 GUI 若以 `desktop` profile 运行，就装到 `desktop`。用手机或浏览器打开页面，不会改变服务器的 profile。安装时用与该实例相同的系统账号和 `DSH_HOME`（默认 `~/.dsh`）。

从 [Release](https://github.com/timecatbit/dsh-web-plugins/releases/latest) 下载需要的 `.tgz`，进入下载目录，然后按需执行：

```bash
# 改成实际使用的 profile：例如 web 或 desktop
dsh_profile=web

# 手机布局
dsh plugin --profile "$dsh_profile" add "$PWD/dsh-ui-mobile-0.1.8-mobile.13.tgz"

# Passkey 代理
dsh plugin --profile "$dsh_profile" add "$PWD/smanx-dsh-proxy-0.1.7-passkeys.3.tgz"
```

重启提供该页面的 DSH 实例；如果用的是桌面 GUI，完全退出后重开。文件安装沿用上游插件 ID，已安装同名上游插件时会替换原版本。**手机布局不需要 Passkey、局域网代理插件或域名。** 单独装手机布局后，继续使用已有的 DSH 网址和原有登录方式；若原 DSH 已允许局域网访问，可用它的 IP 和端口。若想给局域网 IP 加上独立的账号密码登录，再安装代理插件。

## 配置 Passkey 代理

代理会读取 DSH 数据根目录里的 `dsh-proxy.json`（默认 `~/.dsh/dsh-proxy.json`），不是 `profiles/<名称>/` 下的文件。共用同一数据根目录的不同 profile 会读到同一份设置和凭据记录。旧配置会继续生效；默认端口是 `3081`，如另一实例已在监听同一地址和端口，第二个代理会启动失败。只需要一个入口时，只在提供该入口的实例安装代理。

1. 第一次在**服务器原来的 DSH 网页**打开「设置 → 局域网代理」，设置代理账号和密码。未配置时代理拒绝未登录请求。密码登录默认开启，Passkey 可选。
2. **只用局域网**：打开 `http://服务器IP:3081`（或自己的代理端口）。浏览器把账号密码交给代理，代理验证后签发登录 Cookie，再把请求转发给 DSH。HTTP 不加密，只在可信局域网使用。默认情况下，代理认证成功后会自动完成 DSH 自己的启动令牌校验；如旧配置关闭了这项功能，可在「高级」开启。
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
