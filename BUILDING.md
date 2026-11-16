# 从源码构建

[English](BUILDING.en.md)

准备：推荐 Node.js 24，另需 pnpm 11、npm、Python 3；第一次构建要能访问 npm 仓库。

```bash
bash scripts/build-release.sh
```

脚本会检查并打包代理源码，从 npm 拉取锁定了完整性校验的手机界面上游包，应用兼容和布局补丁，对 IM 网关做类型检查、构建和测试，最后把三个安装包和 `SHA256SUMS` 写进 `dist/`。

每次发布，把安装包里 `package/` 的内容解压到对应发布仓库（`dsh-pocket-ui`、`dsh-passkey-proxy` 或 `dsh-im-gateway`）的根目录，提交，用包版本号打标签，并把同一个安装包作为 release 附件发布。这几个 Git 仓库存放已构建的文件，DSH 不用跑构建脚本就能安装。包名保持不变（从 Pocket UI 0.2.0、Passkey Proxy 0.2.0、IM Gateway 0.4.0 起是 `@timecatbit/dsh-pocket-ui`、`@timecatbit/dsh-passkey-proxy`、`@timecatbit/dsh-im-gateway`），已有安装才能继续更新。

### 更新日志和 release 说明

用户看得到的改动，都先写进插件更新日志的「未发布」一节：中文写在 `CHANGELOG.md`，英文写在 `CHANGELOG.en.md`（位于 `plugins/<插件>/`，格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)）。发布时，两个文件里的这一节都改成 `## [x.y.z] - YYYY-MM-DD`，文末链接列表加上新标签。安装包会带上这两个文件，所以每个发布仓库的根目录都有。合集版本记在根目录的 `CHANGELOG.md` 和 `CHANGELOG.en.md`。和 README 一样，所有文档都有中文（`名称.md`）和英文（`名称.en.md`）两份，开头互相链接。

GitHub release 说明先写中文，后面把同样的内容用英文写在折叠的 `<details><summary>English</summary>` 里。只写用户需要知道的：
- 一两句话说明对用户有什么变化；
- 用户需要做的事，比如不兼容变更，附升级步骤链接；
- 去哪安装或更新，附更新日志链接。

不写测试细节、问题原因和以前版本的历史，这些留在更新日志和提交记录里。合集 release 说明用表格列出打包的版本，再加同样简短的说明。下一次合集的说明放在 `release-notes.md`。

提交公开后，更新本仓库的「发现」索引：

```bash
python3 scripts/update-plugin-index.py plugin-index.json dist/timecatbit-dsh-pocket-ui-<version>.tgz <mobile-commit-sha>
python3 scripts/update-plugin-index.py plugin-index.json dist/timecatbit-dsh-passkey-proxy-<version>.tgz <proxy-commit-sha>
python3 scripts/update-plugin-index.py plugin-index.json dist/timecatbit-dsh-im-gateway-<version>.tgz <gateway-commit-sha>
```

每一项都锁定发布仓库的完整提交，兼容范围取自构建好的包。索引只保留每个插件的最新版和几个可回退的里程碑版本，不是每次发布都留。从索引里去掉某个版本时，也要删掉发布仓库里对应的 release 和标签。本仓库的合集版本按同样的里程碑保留：留下打包了保留版本的那几个，其余删除。

- **Passkey Proxy：** 源自 `smanx/dsh-proxy` 的提交 `36954a30af329f4f4d54b6961c75f018e93eb873`。TypeScript 源码和 pnpm 锁文件在 `plugins/passkey-proxy/dsh-proxy`，依赖的许可声明在 `plugins/passkey-proxy/THIRD-PARTY-NOTICES.md`。
- **Pocket UI：** 基于已发布的 `dsh-ui-mobile@0.1.8`。脚本锁定上游的 SHA-512 完整性校验，并核对两个中间产物的文件清单。新增的布局 CSS 和 JavaScript 在 `plugins/mobile-layout`。
- **IM Gateway：** 源自 `zhuiyueya/dsh-im-gateway` 的提交 `8e8fbca125dda15b5cdd2ae79ac63a91e21f7c37`（npm 上的 `dsh-im-gateway@0.3.3`）。TypeScript 源码、上游测试、浏览器端（`client.js`）和 pnpm 锁文件在 `plugins/im-gateway`；那里的第一个提交是原样导入，所以 `git log -p plugins/im-gateway` 能看到之后的每一处改动。开发依赖锁定了做类型检查用的 DSH 包版本；新增测试版本时，把它们升到最新测过的 DSH。发布的清单里没有 `prepare` 或 `prepack` 脚本，所以从 Git 安装时不会尝试构建。

## 支持范围和已测版本

三个包都声明 `engines.dsh` 为 `>=0.2.1-rc.5`（分别在 `build_dsh_phone_layout.py` 的 `HOST_RANGE`、`plugins/passkey-proxy/package.json` 和 `plugins/im-gateway/package.json` 里）。包里有 `engines.dsh` 时 DSH 只看它，所以网关旧的 `peerDependencies` 范围不再决定能否加载。DSH 匹配范围时包含预发布版本，所以之后的每个版本，不论 RC 还是正式版，都不用重新构建就能安装这些插件。范围保持开放；只有已知某个 DSH 版本让插件出问题时才收窄，并发布一个排除该版本的插件新版。

已测版本是另一份更短的列表。只有实际检查过的 DSH 版本才能加进去：

1. 把该版本的 DSH 装到临时目录，用一次性的 `DSH_HOME` 和独立端口启动 `dsh web`。先在这个目录的 `dsh-proxy.json` 里写上 `{"listenPort": <空闲端口>}`，免得代理和 3081 上正在运行的实例冲突。
2. 把三个安装包装进 `web` profile。用窄窗口检查侧栏、设置和输入框正常，宽窗口仍是桌面布局。通过代理端口登录，确认网页加载、WebSocket 连上，「设置 → Passkey Proxy」显示代理在运行，「设置 → Pocket UI → 主屏幕图标」切换后提供的图标跟着变。确认 DSH 日志里没有 `skipping profile bundle`，`gateway.log` 显示 API 已注册、网关已启动，「设置 → IM Gateway」列出了各渠道，微信卡片上点「连接（扫码）」会显示由 `/dsh-im-gateway/api/channels/wechat/login-qr` 提供的二维码，浏览器不请求其他主机。一定要用一次性的 `DSH_HOME`：网关会锁住它，在那里扫码会把这个微信账号登录到测试实例上。
   再不装任何插件启动一次这个 DSH，逐项检查 Pocket UI 修补的那些宿主问题。以 DSH 自己的修复为准：DSH 已修好的地方，Pocket UI 不能介入。输入框字号、长单词换行、45% 选择器宽度上限和聊天记录回弹是在页面上实测的（`dsh-phone-layout.js` 里的 `dshPhoneHostChecks`），Pocket UI 会自动让开。其余几项还要等 DSH 修复：模型输出时跳动的弹窗（`installPhonePopupPin`）、点 **+** 后键盘挡住列表（`installPhoneComposerFocus`），以及超出屏幕的设置项。DSH 修好其中一项时，删掉对应的修补，或只在仍需要它的 DSH 版本上生效。
3. 把该版本加进 `README.md`、`README.en.md` 和三个插件 README 里的已测版本表。插件 README 会打进安装包，所以表格的改动随下一次构建进入发布仓库。
4. 在「发现」索引里为每个插件记录完整列表。「发现」会把它们显示成插件卡片上的「已测 DSH …」标签：

   ```bash
   python3 scripts/set-tested-dsh.py plugin-index.json @timecatbit/dsh-pocket-ui 0.2.1-rc.5 0.2.2-rc.1 0.2.2-rc.2 0.2.2-rc.3
   python3 scripts/set-tested-dsh.py plugin-index.json @timecatbit/dsh-passkey-proxy 0.2.1-rc.5 0.2.2-rc.1 0.2.2-rc.2 0.2.2-rc.3
   python3 scripts/set-tested-dsh.py plugin-index.json @timecatbit/dsh-im-gateway 0.2.1-rc.5 0.2.2-rc.1 0.2.2-rc.2 0.2.2-rc.3
   ```

   脚本会替换该插件的已测标签，并删掉没有插件用的标签声明。标签描述的是每个插件的最新版。只需加标签的 DSH 新版不需要重新构建插件。

## 回归检查

IM Gateway 的检查在 `plugins/im-gateway` 里用 `pnpm run check` 运行：对锁定的 DSH 包做类型检查、构建，再跑上游的 `node --test` 测试和本地的二维码测试。测试用的是模拟上下文，不需要聊天账号。

代理的浏览器冒烟测试用 Chrome 加虚拟 WebAuthn 认证器。另行安装 Playwright，或把 `DSH_TEST_PLAYWRIGHT` 指向已有的 Playwright 包目录，构建后在 `plugins/passkey-proxy/dsh-proxy` 里运行 `node scripts/passkey-smoke.mjs`。本地测试证书用 OpenSSL 生成。不需要任何正式服务、域名或账号。

手机视口回归检查不需要 DSH 账号。把 `DSH_TEST_PLAYWRIGHT` 指向已安装的 Playwright 包，装好它的浏览器引擎，然后运行：

```bash
DSH_TEST_BROWSER=webkit node scripts/mobile-viewport-check.mjs
DSH_TEST_BROWSER=chromium node scripts/mobile-viewport-check.mjs
```

Chromium 默认用已安装的 Chrome 渠道，可用 `DSH_TEST_CHROME_CHANNEL` 改；自定义的 WebKit 可执行文件用 `DSH_TEST_WEBKIT_EXECUTABLE` 指定。检查会在一个带滚动聊天记录和吸底输入框的测试页里重放类似键盘的 VisualViewport 事件，确认这些事件从不移动或缩放应用（浏览器自己的平移已经带着它走），并且收起键盘后留下的平移只在视口静止后才复位。它还覆盖缩放、聚焦中的输入框、桌面宽度、清理、草稿和滚动位置的保留，以及输入框和命令搜索的聚焦规则。它不模拟真实的 iOS 软键盘，动画效果还要在 iPhone 真机上确认。
