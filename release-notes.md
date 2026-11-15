**DSH IM Gateway 0.3.4** joins the collection. It is a maintained fork of [zhuiyueya/dsh-im-gateway](https://github.com/zhuiyueya/dsh-im-gateway) 0.3.3 that lets you use DSH from WeChat, Feishu, DingTalk, QQ, Telegram and other chat apps.

- **IM Gateway (new):** loads on DSH 0.2.x without a compatibility exemption (`engines.dsh: >=0.2.1-rc.5`). The WeChat login QR code is drawn by the plugin instead of being sent to `api.qrserver.com`, and it now appears right after Connect (scan). The settings page follows the DSH theme, Baileys is limited to the patched 6.7 line, and the plugin is named DSH IM Gateway everywhere. The package name stays `dsh-im-gateway`, so a profile with the npm original updates in place and keeps its channels.
- **Pocket UI** stays at 0.1.23 and **Passkey Proxy** at 0.1.16; their archives are byte-identical to the previous release.

Checked on standalone DSH Web `0.2.1-rc.5`, `0.2.2-rc.1`, `0.2.2-rc.2` and `0.2.2-rc.3` with all three plugins installed: IM Gateway loads without an exemption, the plugin list and **Settings → IM Gateway** show it with all 25 channels, and the WeChat QR is served by the plugin with no browser request to another host. Messages from a real chat account have not been tested in this release.

Install or update through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
