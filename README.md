# DSH Web Plugins

[English](README.en.md) · [下载 Release](https://github.com/timecatbit/dsh-web-plugins/releases/latest)

给 DeepSeek Harness 网页版的两个插件，**可单独安装，也可一起安装**。手机布局只改网页界面；Passkey 登录由局域网代理处理。两者没有相互依赖，因此保留独立安装和回退。

| 需求 | 安装包 | 作用 |
| --- | --- | --- |
| 手机设置和侧栏更好用 | `dsh-ui-mobile-0.1.8-mobile.7.tgz` | 窄屏单栏设置、可横滑的分类、手机抽屉和输入区适配 |
| 用密码或 Passkey 访问 DSH | `smanx-dsh-proxy-0.1.7-passkeys.2.tgz` | 局域网代理、持久网页登录、HTTPS Passkey 和 WebSocket 转发 |
| 两项都要 | 两个安装包 | 可装在同一个 `web` profile，无安装顺序要求 |

本版在 **DSH 0.2.1-rc.5** 上验证。手机布局使用了该版本的页面结构，其他版本请先在测试实例验证。Passkey 代理的构建目标是 Node.js 22 或更新版本。

## 安装

从 [Release](https://github.com/timecatbit/dsh-web-plugins/releases/latest) 下载需要的 `.tgz`，进入下载目录，然后按需执行：

```bash
# 手机布局
dsh plugin --profile web add "$PWD/dsh-ui-mobile-0.1.8-mobile.7.tgz"

# Passkey 代理
dsh plugin --profile web add "$PWD/smanx-dsh-proxy-0.1.7-passkeys.2.tgz"
```

重启现有的 DSH 网页进程。文件安装沿用上游插件 ID，已安装同名上游插件时，这是替换升级，不是另装一份；同一 profile 中保留每种插件的一个版本。手机布局插件单独安装后，直接打开原来的 DSH 网页即可。

## 配置 Passkey 代理

1. 在 DSH 打开「设置 → 局域网代理」，先设置代理的**账号和密码**。在开放外部访问前，用局域网入口测试密码登录。默认代理端口为 `3081`；DSH 原来的服务端口无需对公网开放。
2. 用自己的域名和有效证书，把 **HTTPS 域名**反代到 DSH 局域网代理的端口。反代应保留客户端的原始 `Host`，设置 `X-Forwarded-Proto: https`，并支持 WebSocket 升级。可以用 Lucky、Nginx 或其他具备这些能力的反代；插件不需要特定服务商。
3. 在同一设置页的「Passkey 登录」填写完整 HTTPS 源，例如 `https://dsh.example.com`，以及 **DSH 实际看到的反代来源 IP**。多个 IP 用英文逗号隔开，只接受具体 IPv4/IPv6 地址。容器、跨网段路由或 NAT 可能改变这个来源；不要填整个网段。
4. 打开配置的 HTTPS 域名。首次选择「改用账号密码」，登录后进入「管理 Passkey」，确认密码并按设备提示添加。最多可添加 5 个。以后需要登录时可直接选「使用 Passkey 登录」；正常会话可保留 30 天。

没有 HTTPS 时，两项留空，仍可以用账号密码；IP 地址上的普通 HTTP 入口不支持 Passkey。服务器也可通过 `DSH_PROXY_PASSKEY_ORIGIN` 和 `DSH_PROXY_TLS_PROXIES` 管理这两项，环境变量配置会在网页上显示为只读。修改对外域名后，需要在新域名下重新添加 Passkey。

若公网入口只出现密码表单，或提交时提示「请求来源不匹配」，优先检查上面第 2、3 步。信任的是连接到 DSH 的**直接反代来源**，不是手机 IP，也不一定是 NAS 的管理 IP。

## 回退与源码

- 回退时，把上一版的可信 `.tgz` 用相同的 `dsh plugin --profile web add` 命令装回，再重启 DSH。两个插件可以分别回退。
- 代理设置和凭据记录保存在各自部署的 DSH 数据目录。备份时妥善保管；不要把数据文件或服务配置提交到仓库。
- [代理源码](plugins/passkey-proxy) · [手机布局构建补丁](plugins/mobile-layout) · [构建说明](BUILDING.md)

代理基于 [smanx/dsh-proxy](https://github.com/smanx/dsh-proxy) 0.1.7；手机布局基于 [jasondu/dsh-ui-mobile](https://github.com/jasondu/dsh-ui-mobile) 0.1.8。两个衍生包均保留上游 MIT 许可证；代理随包附带第三方依赖许可。
