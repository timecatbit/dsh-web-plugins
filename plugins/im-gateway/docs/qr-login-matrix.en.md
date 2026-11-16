# QR setup support by channel

[简体中文](qr-login-matrix.md)

> "Scan to connect" can mean three quite different things: (1) linking a personal device; (2) scanning to create a bot app; (3) drawing an ordinary OAuth or login URL as a QR code. Only the first two count as QR setup here; the third is never presented as "one-scan setup".

## Implemented

| Channel | Type | Basis | Implementation |
|---|---|---|---|
| WeChat | Device link | Tencent iLink / `openclaw-weixin` | Scan with WeChat on the phone; the login is kept locally |
| WhatsApp | Device link (unofficial Web protocol) | Baileys linked-device flow | Scan with WhatsApp on the phone to link a device |
| Feishu / Lark | Official scan-to-create app | [Feishu Open Platform: scan to create an app in one click (Node.js)](https://open.feishu.cn/document/mcp_open_tools/integrating-agents-with-feishu/scan-to-create-an-app-in-one-click-nodejs.md) | Official Node SDK `registerApp()`; requests message permissions and events, and returns the App ID and Secret |
| QQ Bot | Official scan-to-create bot | [Tencent's dsh-qqbot](https://github.com/tencent-connect/dsh-qqbot) / `@tencent-connect/qqbot-connector` | Scan with QQ on the phone; returns the AppID, AppSecret and the scanner's openid |
| DingTalk | Official device authorization to create a bot | [DingTalk's official connector](https://github.com/DingTalk-Real-AI/dingtalk-openclaw-connector) | Device authorization init/begin/poll; returns the Client ID and Secret |
| WeCom | Official scan-to-create smart bot | [WeCom smart bot long connection](https://developer.work.weixin.qq.com/document/path/101463) | Scan with the WeCom app; returns the Bot ID and Secret |

Feishu, QQ, DingTalk and WeCom also keep manual credential entry. QR codes are drawn locally on the host with `qrcode`, never through a third-party QR site.

## A related protocol exists, but it should not be labeled "one-scan setup" yet

| Channel | Status | Conclusion |
|---|---|---|
| Nextcloud Talk | Nextcloud Login Flow v2 can produce a login URL and poll for an app password, but the instance address and the Talk room token are still needed first | A possible later "scan to authorize an instance", not zero-configuration bot creation |
| Signal | `signal-cli link` can produce a linked-device URI, but signal-cli is a community project and the current adapter needs a registered number | Could be an experimental device link; account discovery and storage need rework first |
| Nostr | [NIP-46](https://nips.nostr.com/46) supports remote signers / nostrconnect QR codes | Local key signing would have to become a remote signer, which changes the security model; it is more than adding a QR button |
| Matrix | [MSC4108](https://github.com/matrix-org/matrix-spec-proposals/blob/19628930fa795a6cc02e9538d45aacc1778dbfc1/proposals/4108-oidc-qr-login.md) defines OIDC + E2EE QR login | Still a proposal, with uneven homeserver and client support; not suitable as a default |
| Twitch | OAuth needs a pre-registered app; device codes and bot scopes still depend on a Client ID | Suits an OAuth wizard, not scan-to-create |
| Zalo OA | OAuth needs a pre-registered Zalo app and redirect URI | Suits an OAuth wizard, not zero-configuration scanning |

## No official scan-to-create bot flow

- Telegram: the bot must be created with `@BotFather` to get a Bot Token.
- Discord: an app and bot must be created in the Developer Portal, then invited to a server.
- Slack: the official route is an App Manifest plus OAuth installation; Socket Mode still needs a Bot Token and an App Token.
- Microsoft Teams: needs Azure / Bot Framework resources and app credentials.
- LINE: a Messaging API channel must be created in the Developers Console.
- Mattermost: needs a Personal Access Token or a pre-registered OAuth app.
- Google Chat: needs a Google Cloud project and a Chat app configuration.
- IRC, Synology Chat, iMessage, Tlon, Tencent Yuanbao, Twilio Voice: no common official protocol for creating a bot by scanning.

## Security principles

1. A scan URL becomes a data URL only inside the local host; the browser never calls a third-party QR service.
2. Secrets returned by a scan are not sent back through the status API; they are written only to the local channel configuration.
3. The person who scans Feishu or QQ is added to that channel's allowlist automatically; manual credentials still rely on the platform's visibility settings and the gateway allowlist.
4. DingTalk's `sessionWebhook` only accepts `https://*.dingtalk.com`, so it cannot be used to request arbitrary URLs.
5. Third-party or draft protocols are never presented as "official scanning".
