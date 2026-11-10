# DSH 手机布局

[English](README.en.md)

基于 [jasondu/dsh-ui-mobile](https://github.com/jasondu/dsh-ui-mobile) 0.1.8 的布局分支，适配 DeepSeek Harness **0.2.1-rc.5 和 0.2.2-rc.1** 的网页设置、侧栏和输入区。可单独使用，不依赖 Passkey 代理。使用 DSH 原有的网页入口，不注册额外的 PWA Service Worker、安装提示或 Web Push。

按[安装说明](https://github.com/timecatbit/dsh-web-plugins#安装)装到 `dsh web` 或通过官方桌面 App 的「插件 → 添加插件」安装。保留上游插件 ID `dsh-ui-mobile`，已安装上游版本时会替换原插件。Safari 可以把可访问的 DSH 网页[添加到主屏幕或程序坞](https://github.com/timecatbit/dsh-web-plugins#用-safari-保存为网页-app)。布局主要面向宽度小于 768 CSS 像素的页面。

构建脚本以固定完整性校验的上游 npm 包为输入，应用布局补丁后重新打包。原作者与许可见 [LICENSE](LICENSE)。
