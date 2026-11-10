# DSH 局域网代理与 Passkey

基于 [smanx/dsh-proxy](https://github.com/smanx/dsh-proxy) 0.1.7。与手机布局插件独立，可单独安装。用 `dsh plugin --profile web add /绝对路径/安装包.tgz` 安装并重启 `dsh web` 进程。若网页进程使用自定义 profile，请将 `web` 换成实际名称。Electron 的 `desktop` profile 不支持通过 CLI 安装。

- **访问入口**：第一次从服务器原来的 DSH 页面进入「设置 → 局域网代理」设置账号密码。代理默认端口为 `3081`。未配置凭据时拒绝未登录请求。局域网 HTTP 可在密码登录开启时直接使用，但不加密。
- **对外 HTTPS**：反代应保留 `Host`，设置 `X-Forwarded-Proto: https`，并支持 WebSocket。同机回环可留空；跨机器或容器来源需要核对实际来源 IP。先保存域名、打开域名，再用「检查最近的反代来源」定位候选地址。插件不会自动信任观察到的来源。
- **登录方式**：密码和 Passkey 可独立开关，至少保留一个。仅用 Passkey 时，关闭了网页密码与 Basic Auth 登录，旧密码会话也会失效。管理凭据仍需验证原密码。
- **Passkey 管理**：在 HTTPS 域名注册并先试用，再关闭密码登录。最多 5 个。仅用 Passkey 时不能移除最后一个可用凭据。
- **启动令牌**：在默认设置下，代理会先完成自己的认证，再代用户完成 DSH 的启动令牌校验。高级设置可保留 DSH 的独立校验。代理不会跳过自己的认证。
- **配置和回退**：`DSH_PROXY_PASSKEY_ORIGIN` / `DSH_PROXY_TLS_PROXIES` 可覆盖网页中的地址设置；登录方式仍由设置页保存。密码和凭据在本机 DSH 数据目录，勿公开。可用之前的可信安装包覆盖安装并重启来回退。

MIT 许可见 [LICENSE](LICENSE)。
