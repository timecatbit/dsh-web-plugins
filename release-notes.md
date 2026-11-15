**DSH IM Gateway 0.3.5** joins the collection and reconnects WeChat after a DSH restart. It is a maintained fork of [zhuiyueya/dsh-im-gateway](https://github.com/zhuiyueya/dsh-im-gateway) 0.3.3 for using DSH from WeChat, Feishu, DingTalk, QQ, Telegram and other chat apps.

- **IM Gateway 0.3.5:** channels connected by scanning on the settings page (WeChat, WhatsApp) were never saved as enabled, so every DSH restart left them disconnected until you clicked Connect again. They now start with DSH.
- **IM Gateway since 0.3.4:** loads on DSH 0.2.x without a compatibility exemption (`engines.dsh: >=0.2.1-rc.5`); draws the WeChat login QR code itself instead of sending the login link to `api.qrserver.com`; shows the QR code right after Connect (scan); follows the DSH theme; limits Baileys to the patched 6.7 line; named DSH IM Gateway everywhere. The package name stays `dsh-im-gateway`, so a profile with the npm original updates in place and keeps its channels.
- **Pocket UI** stays at 0.1.23 and **Passkey Proxy** at 0.1.16; their archives are byte-identical to the previous release.

Checked on standalone DSH Web `0.2.1-rc.5`, `0.2.2-rc.1`, `0.2.2-rc.2` and `0.2.2-rc.3` with all three plugins installed: IM Gateway loads without an exemption, the plugin list and **Settings → IM Gateway** show it with all 25 channels, and the WeChat QR is served by the plugin with no browser request to another host. On `0.2.2-rc.3` a connected WeChat channel comes back after restarting DSH.

Install or update through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
