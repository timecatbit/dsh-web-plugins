# DSH IM Gateway

[English](README.en.md) · [下载](https://github.com/timecatbit/dsh-im-gateway/releases) · [更新日志](CHANGELOG.md) · [MIT 许可证](LICENSE)

在微信、飞书、钉钉、企业微信、QQ、Telegram、Discord、Slack 等聊天软件里使用 DeepSeek Harness（DSH）。给机器人发消息就是在驱动 agent，回复会实时推回聊天；工具审批和 agent 的提问也可以直接在聊天里回答。**可以单独安装**，不依赖 [DSH Pocket UI](https://github.com/timecatbit/dsh-pocket-ui) 或 [DSH Passkey Proxy](https://github.com/timecatbit/dsh-passkey-proxy)。

## 兼容性和安装

**支持范围：DSH `0.2.1-rc.5` 及之后的所有版本**（从 0.3.4 起）。DSH 发布新版后可以直接安装和启用，不需要兼容豁免。没测过的新版本可能出现连接或会话问题，遇到请[提 issue](https://github.com/timecatbit/dsh-im-gateway/issues)，修复后发布新版。

**已测试版本**是实际装上测过的版本；你的 DSH 版本不在表里，只表示还没测过。DSH「发现」里卡片上的「已测 DSH …」标签也是这份列表。

| DSH 环境 | 已测试的 DSH 版本 |
| --- | --- |
| 独立 Web 版（`dsh web`） | `0.2.1-rc.5`、`0.2.2-rc.1`、`0.2.2-rc.2`、`0.2.2-rc.3`、`0.2.2-rc.5`、`0.2.3-alpha.2` |
| 官方 macOS 桌面版 | 未测试 |
| 官方 Windows 桌面版 | 未测试 |

从 0.4.0 起包名是 `@timecatbit/dsh-im-gateway`（之前和 npm 上的原版一样叫 `dsh-im-gateway`）。从本项目 0.3.x 或 npm 原版升级，要先移除旧包再装新版，渠道配置、微信登录状态和定时提醒都保留，见[从旧包名升级](https://github.com/timecatbit/dsh-web-plugins#从旧包名升级)。原版在 DSH 0.2.x 上要靠兼容豁免才能加载；换成本版后，旧豁免可以撤销。

1. 从 DSH 左侧栏点「插件」，找到「实验性插件」。没有看到开关就点该栏右侧「更多」。在 `0.2.1-rc.5` 打开 **「自定义插件市场」**，在 `0.2.2-rc.1` 及之后打开 **「自定义插件索引」**。
2. 进「发现 → 添加索引源」，添加下面的地址。和 Pocket UI、Passkey Proxy 共用，只需每个 profile 添加一次。

   ```text
   https://raw.githubusercontent.com/timecatbit/dsh-web-plugins/main/plugin-index.json
   ```

3. 点 **DSH IM Gateway 的卡片标题 → 版本 → 安装**。更新也走这条路径，无需先卸载。安装后如有提示，启用插件并重启当前 DSH 实例。第一次安装要下载各平台的 SDK，可能需要一两分钟。

用 pnpm 11 或更新版本安装时，DSH 会先报「需要允许安装脚本」（Baileys 和 protobufjs），点 **允许这些脚本并重试** 即可。

**手动安装：** 独立 Web 版用运行 DSH 的同一个系统账号和 `DSH_HOME`，下载 [0.4.1 安装包](https://github.com/timecatbit/dsh-im-gateway/releases/download/v0.4.1/timecatbit-dsh-im-gateway-0.4.1.tgz)，在文件所在目录运行：

```bash
dsh plugin --profile web add "$PWD/timecatbit-dsh-im-gateway-0.4.1.tgz"
```

使用自定义 Web profile 时替换 `web`。装完重启该 `dsh web` 进程。

## 和原版 0.3.3 的区别

- **支持 DSH 0.2.x，不再需要豁免。** 插件声明 `engines.dsh: >=0.2.1-rc.5`。DSH 把 agent preset 服务移到了 `@deepseek-ai/dsh-agent-preset-registry`，依赖随之更新；代码按 DSH `0.2.2-rc.5` 的接口重新做过类型检查。
- **微信登录二维码在本机生成。** 原版把登录链接交给第三方网站 `api.qrserver.com` 生成图片，而这个链接扫码就能登录。现在由插件自己画成图片，浏览器不再访问外部网站。
- **点「连接（扫码）」后二维码会自动出现。** 原版此时停止刷新，要重新打开设置页才看得到二维码。
- **重启 DSH 后微信自动重连。** 原版在设置页扫码连上的渠道（微信、WhatsApp）不会记下来，每次重启 DSH 都要回设置页重新点「连接」（0.3.5 修复）。
- **设置页颜色跟随 DSH 主题。** 浅色模式下按钮文字不再看不见。
- **WhatsApp 改用 Baileys 7，pnpm 11 及以上也能装。** 原版的 Baileys 6.7 要从 GitHub 拉取 libsignal，pnpm 11 起默认拒绝这种依赖，整个网关都装不上。现在固定为 Baileys 7.0.0-rc14：依赖都来自 npm，也已修复消息伪造漏洞（GHSA-qvv5-jq5g-4cgg）。
- **WhatsApp 在设置页扫码，登录会保存下来。** 原版只把配对码写进服务器上的文件，也不保存扫码后的登录凭据，配对完成不了。WhatsApp 仍是实验性的：扫码之后的收发消息还没有用真实账号验证过。
- **名称统一为 DSH IM Gateway。** 插件列表、设置导航和说明文档用同一个名字。

## 连接渠道

安装并重启后，打开 **「设置 → IM Gateway」**。

- **微信 / WhatsApp：** 点「连接（扫码）」，用手机扫描页面上的二维码。微信走腾讯官方 iLink 协议，只支持私聊，建议用专用小号。
- **飞书 / QQ / 钉钉 / 企业微信：** 点「扫码接入机器人」，在对应平台的 App 里扫码确认；也可以展开表单手动填写凭据。
- **Telegram / Discord / Slack 等：** 按卡片里的官方文档拿到凭据，填入表单后「保存并连接」。

连接后不用重启。状态统一显示为「已连接 / 未连接 / 连接中 / 异常」。DSH 重启后，保存过配置的渠道会自动恢复，微信不用重新扫码。「暂时断开」只停止运行、保留配置；「删除配置」会删除凭据，之后要重新接入。

各平台为什么支持或不支持扫码，见 [`docs/qr-login-matrix.md`](docs/qr-login-matrix.md)。

## 支持的渠道

| 渠道 | 状态 | 接收方式 | 接入方式 |
| --- | --- | --- | --- |
| 微信 | ✅ | 腾讯官方 iLink 长轮询 | 设备扫码（建议专用账号） |
| 飞书 / Lark | ✅ | 官方 SDK 长连接 | 官方扫码，或 App ID + Secret |
| 钉钉 | ✅ | 官方 Stream 长连接 | 官方扫码，或 Client ID + Secret |
| 企业微信 | ✅ | 官方智能机器人 WebSocket | 官方扫码，或 Bot ID + Secret |
| QQ 机器人 | ✅ | 官方 WebSocket | 官方扫码，或 AppID + Secret |
| Telegram | ✅ | Bot API 长轮询 | @BotFather token |
| Discord | ✅ | Gateway WebSocket | Bot token |
| Slack | ✅ | Socket Mode | `xoxb-` + `xapp-` token |
| LINE、Matrix、Mattermost、IRC、Twitch、Nextcloud Talk、Synology Chat、Zalo | ✅ | 各平台接口 | 卡片表单 |
| Signal | ✅ | 本机 `signal-cli` | 需要先装 signal-cli |
| iMessage | ✅ | `imsg` / osascript | 仅 macOS |
| WhatsApp | 实验性 | Baileys 7 关联设备 | 设置页扫码（手机「已关联的设备」） |
| Nostr | 需另装依赖 | NIP-04 私信 | 在 profile 里另装 `@noble/curves` |
| Teams、Google Chat | 🧪 实验性 | Bot Framework / webhook | 需要公网地址 |

## 在聊天里使用

普通消息直接发给 agent。消息结尾加 `..` 表示还没说完，加 `!!` 立即提交；几段短消息在 5 秒内会合并成一次。长回复按各平台的长度上限分段发送。

| 命令 | 作用 |
| --- | --- |
| `/help` | 列出命令 |
| `/status` | 当前会话、工作区和待批准的请求 |
| `/new`、`/clear` | 开一个新会话 |
| `/workspaces`、`/workspace <路径>` | 列出或切换工作区（之后 `/new` 生效） |
| `/sessions [all\|路径]`、`/continue <会话 id>` | 列出会话，或继续已有会话 |
| `/bind <会话 id>`、`/unbind` | 绑定或解绑本机正在运行的会话（bound 模式） |
| `/channels` | 各渠道的连接状态 |
| `/cron list`、`/cron rm <id>` | 查看或删除本聊天的定时提醒 |
| `批准` / `拒绝` | 回答待批准的工具请求（也认 yes / no / 同意） |

- **审批：** agent 请求工具权限时，请求会推到聊天里，回复「批准」或「拒绝」即可。回复会核对聊天和会话是否对应；超时后回到 DSH 本机的审批流程。
- **提问：** agent 调用 `ask_user_question` 时，问题会同时发到网页和绑定的聊天，哪边先给出有效回答就用哪边。单选回编号或选项文字，多选用逗号分隔，多个问题每行写 `问题序号: 答案`。
- **定时提醒：** 在聊天里说「每天 9 点提醒我喝水」，agent 会建一个绑定到这个聊天的提醒，换会话或重启 DSH 都不影响。
- **发文件：** agent 可以用 `im_send_file` 把工作区里的文件发到聊天。

## 安全和数据

- **默认放行所有人。** 任何能给机器人发消息的人都能驱动你的 agent，而 agent 能在这台机器上运行工具。机器人账号对外公开时，在 profile 的 `cordis.patch.yml` 里关掉默认放行，再在设置页批准具体用户：

  ```yaml
  - id: im-gateway
    config:
      allowAllUsers: false
  ```

- **插件接口不经过 DSH 登录。** 设置页调用的 `/dsh-im-gateway/api` 和 DSH 其他插件接口一样，DSH 自己不校验登录。让 DSH 端口只监听本机或可信网络；需要从外面访问时，用 [DSH Passkey Proxy](https://github.com/timecatbit/dsh-passkey-proxy) 这类带登录的入口。
- **数据位置：** 渠道凭据、白名单和定时提醒保存在 `$DSH_HOME/dsh-im-gateway/`（默认 `~/.dsh/dsh-im-gateway/`），运行日志是其中的 `gateway.log`。更新前可以备份这个目录；不要把它提交到仓库或发给别人。

## 维护和排查

| 现象 | 先检查 |
| --- | --- |
| 设置里没有 IM Gateway | DSH 日志里有没有 `skipping profile bundle "@timecatbit/dsh-im-gateway"`；装的是不是本版（原版要豁免） |
| 点了「连接（扫码）」没有二维码 | 等几秒；`gateway.log` 里有没有「请用微信扫码登录」；本机能否访问微信服务器 |
| 已连接但聊天没反应 | `gateway.log` 里的报错；关掉默认放行后，设置页顶部有没有待批准的访问请求 |
| 微信突然掉线 | 登录过期，点「刷新二维码」重新扫码 |

## 源码和许可证

这里发布已构建的安装包。[源码、构建脚本和统一更新索引](https://github.com/timecatbit/dsh-web-plugins)在原仓库维护。此插件基于 [zhuiyueya/dsh-im-gateway](https://github.com/zhuiyueya/dsh-im-gateway) 0.3.3，采用 [MIT 许可证](LICENSE)，保留上游版权声明；[第三方说明](THIRD_PARTY_NOTICES.md)随包分发。问题可报到 [Issues](https://github.com/timecatbit/dsh-im-gateway/issues)，请注明 DSH 和插件版本，并删去 token、密钥和登录链接。
