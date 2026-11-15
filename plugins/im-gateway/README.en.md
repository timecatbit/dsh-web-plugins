# DSH IM Gateway

[简体中文](README.md) · [Download](https://github.com/timecatbit/dsh-im-gateway/releases) · [MIT license](LICENSE)

Use DeepSeek Harness (DSH) from WeChat, Feishu, DingTalk, WeCom, QQ, Telegram, Discord, Slack and other chat apps. A message to the bot drives your agent, and the replies stream back into the chat; tool approvals and the agent's questions can be answered there too. **It installs on its own** and does not need [DSH Pocket UI](https://github.com/timecatbit/dsh-pocket-ui) or [DSH Passkey Proxy](https://github.com/timecatbit/dsh-passkey-proxy).

## Compatibility and installation

**Supported: DSH `0.2.1-rc.5` and every later version** (since 0.3.4). A new DSH release can install and enable it without a compatibility exemption. An untested release may show connection or session problems; please [open an issue](https://github.com/timecatbit/dsh-im-gateway/issues), and fixes ship as new versions.

**Tested versions** are the ones the plugin was actually installed and checked on. A DSH version missing from the table has not been tested yet. The "Tested on DSH …" tags on the Discover card show the same list.

| DSH environment | Tested DSH versions |
| --- | --- |
| Standalone Web (`dsh web`) | `0.2.1-rc.5`, `0.2.2-rc.1`, `0.2.2-rc.2`, `0.2.2-rc.3` |
| Official macOS Desktop | Not tested |
| Official Windows Desktop | Not tested |

The package keeps the name `dsh-im-gateway`. A profile that has the original from npm (0.3.3 or earlier) updates in place and keeps its channel settings, WeChat login and reminders. On DSH 0.2.x the original only loads with a compatibility exemption; after switching to this version you can revoke that exemption.

1. Open **Plugins** from the DSH sidebar and find **Experimental plugins**. If the switch is not listed, click **More** in that section. Turn on **Custom plugin markets** on `0.2.1-rc.5`, or **Custom plugin indexes** on `0.2.2-rc.1` and later.
2. Go to **Discover → Add index source** and add the address below. Pocket UI and Passkey Proxy use the same index, so each profile needs it only once.

   ```text
   https://raw.githubusercontent.com/timecatbit/dsh-web-plugins/main/plugin-index.json
   ```

3. Click the **DSH IM Gateway** card title, then **Versions → Install**. Updates take the same path; there is no need to uninstall first. Enable the plugin and restart the DSH instance if prompted. The first install downloads the platform SDKs and can take a minute or two.

**Manual install:** for standalone Web, use the same system account and `DSH_HOME` that run DSH. Download the [0.3.5 package](https://github.com/timecatbit/dsh-im-gateway/releases/download/v0.3.5/dsh-im-gateway-0.3.5.tgz) and run this in its folder:

```bash
dsh plugin --profile web add "$PWD/dsh-im-gateway-0.3.5.tgz"
```

Replace `web` if you use a custom web profile. Restart that `dsh web` process afterwards.

## Changes from the original 0.3.3

- **Works on DSH 0.2.x without an exemption.** The plugin declares `engines.dsh: >=0.2.1-rc.5`. DSH moved the agent preset service to `@deepseek-ai/dsh-agent-preset-registry`, and the dependencies follow it; the code was type-checked again against the DSH `0.2.2-rc.3` interfaces.
- **The WeChat login QR code is drawn locally.** The original handed the login link to the third-party site `api.qrserver.com` to render the image, and scanning that link signs in. The plugin now draws the image itself, and the browser no longer contacts an outside site.
- **The QR code appears after Connect (scan).** The original stopped refreshing at that point, so the code only showed after reopening Settings.
- **WeChat reconnects after a DSH restart.** The original did not remember channels connected by scanning on the settings page (WeChat, WhatsApp), so every DSH restart left them disconnected until you clicked Connect again (fixed in 0.3.5).
- **The settings page follows the DSH theme.** Button labels no longer disappear in light mode.
- **WhatsApp uses a patched Baileys.** It is limited to 6.7.24 and later 6.7 releases; the original range could install 6.17.16, which is affected by a message-spoofing flaw (GHSA-qvv5-jq5g-4cgg).
- **One name everywhere: DSH IM Gateway.** The plugin list, the settings nav and these docs use the same name.

## Connect a channel

After installing and restarting, open **Settings → IM Gateway**.

- **WeChat / WhatsApp:** click Connect (scan) and scan the code on the page with your phone. WeChat uses Tencent's official iLink protocol, supports private chats only, and is best used with a dedicated account.
- **Feishu / QQ / DingTalk / WeCom:** click the bot QR setup button and confirm in that platform's app, or open the form and enter the credentials yourself.
- **Telegram / Discord / Slack and others:** get the credentials from the official docs linked on the card, fill in the form and save to connect.

No restart is needed after connecting. Every channel shows one of Connected, Not connected, Connecting or Error. After DSH restarts, saved channels reconnect on their own and WeChat does not need a new scan. Disconnect for now only stops a channel and keeps its settings; Delete settings removes the credentials, and the channel then has to be set up again.

See [`docs/qr-login-matrix.md`](docs/qr-login-matrix.md) for why each platform does or does not support QR setup.

## Supported channels

| Channel | Status | Receives via | Set up with |
| --- | --- | --- | --- |
| WeChat | ✅ | Tencent's official iLink long polling | Device QR scan (dedicated account recommended) |
| Feishu / Lark | ✅ | Official SDK long connection | Official QR, or App ID + Secret |
| DingTalk | ✅ | Official Stream connection | Official QR, or Client ID + Secret |
| WeCom | ✅ | Official AI bot WebSocket | Official QR, or Bot ID + Secret |
| QQ bot | ✅ | Official WebSocket | Official QR, or AppID + Secret |
| Telegram | ✅ | Bot API long polling | @BotFather token |
| Discord | ✅ | Gateway WebSocket | Bot token |
| Slack | ✅ | Socket Mode | `xoxb-` + `xapp-` tokens |
| LINE, Matrix, Mattermost, IRC, Twitch, Nextcloud Talk, Synology Chat, Zalo | ✅ | Each platform's API | Card form |
| Signal | ✅ | Local `signal-cli` | Install signal-cli first |
| iMessage | ✅ | `imsg` / osascript | macOS only |
| WhatsApp | ✅ | Baileys device scan | Device QR scan |
| Nostr | Extra dependency | NIP-04 direct messages | Install `@noble/curves` into the profile |
| Teams, Google Chat | 🧪 Experimental | Bot Framework / webhook | Needs a public address |

## Using it in a chat

Plain messages go to the agent. End a message with `..` to say more is coming, or `!!` to send now; short messages within 5 seconds are merged into one. Long replies are split to each platform's length limit.

| Command | What it does |
| --- | --- |
| `/help` | List the commands |
| `/status` | Current session, workspace and pending approvals |
| `/new`, `/clear` | Start a new session |
| `/workspaces`, `/workspace <path>` | List or switch workspaces (applies from the next `/new`) |
| `/sessions [all\|path]`, `/continue <session id>` | List sessions, or continue an existing one |
| `/bind <session id>`, `/unbind` | Bind to or unbind from a live local session (bound mode) |
| `/channels` | Connection state of each channel |
| `/cron list`, `/cron rm <id>` | List or delete this chat's reminders |
| `批准` / `拒绝` | Answer a pending tool approval (yes / no also work) |

- **Approvals:** when the agent asks for a tool permission, the request is posted to the chat; reply approve or deny. The reply is checked against the chat and the session; after a timeout DSH's own approval flow takes over.
- **Questions:** when the agent calls `ask_user_question`, the question goes to the web app and to every chat bound to the session, and the first valid answer wins. Reply with an option number or label, separate several choices with commas, and answer several questions one per line as `question number: answer`.
- **Reminders:** say "remind me to drink water at 9 every day" and the agent creates a reminder bound to that chat; new sessions and DSH restarts do not affect it.
- **Files:** the agent can send workspace files to the chat with `im_send_file`.

## Security and data

- **Everyone is allowed by default.** Anyone who can message the bot can drive your agent, and the agent can run tools on this machine. If the bot account is public, turn the default off in the profile's `cordis.patch.yml` and approve individual users on the settings page:

  ```yaml
  - id: im-gateway
    config:
      allowAllUsers: false
  ```

- **The plugin API does not go through the DSH sign-in.** Like other plugin routes, `/dsh-im-gateway/api`, which the settings page calls, is not checked by DSH itself. Keep the DSH port on the local machine or a trusted network, and use an entry with its own sign-in, such as [DSH Passkey Proxy](https://github.com/timecatbit/dsh-passkey-proxy), for outside access.
- **Where data lives:** channel credentials, the allowlist and reminders are stored in `$DSH_HOME/dsh-im-gateway/` (default `~/.dsh/dsh-im-gateway/`), with the run log in `gateway.log`. Back that folder up before updating; never commit it or share it.

## Troubleshooting

| Symptom | Check first |
| --- | --- |
| No IM Gateway in Settings | Whether the DSH log says `skipping profile bundle "dsh-im-gateway"`, and whether this version is installed (the original needs an exemption) |
| No QR code after Connect (scan) | Wait a few seconds; look for the WeChat login line in `gateway.log`; check that the machine can reach WeChat's servers |
| Connected but the chat gets no reply | Errors in `gateway.log`; with the default turned off, pending access requests at the top of the settings page |
| WeChat dropped out | The login expired; click Refresh QR and scan again |

## Source and license

This repository publishes the built package. The [source, build scripts and shared update index](https://github.com/timecatbit/dsh-web-plugins) are maintained in the main repository. The plugin is based on [zhuiyueya/dsh-im-gateway](https://github.com/zhuiyueya/dsh-im-gateway) 0.3.3 and is released under the [MIT license](LICENSE) with the upstream copyright notice kept; the [third-party notices](THIRD_PARTY_NOTICES.md) ship with the package. Report problems in [Issues](https://github.com/timecatbit/dsh-im-gateway/issues) with your DSH and plugin versions, and remove tokens, secrets and login links first.
