# DSH Pocket UI

[English](README.en.md)

基于 [jasondu/dsh-ui-mobile](https://github.com/jasondu/dsh-ui-mobile) 0.1.8 的布局分支，适配 DeepSeek Harness **0.2.1-rc.5 和 0.2.2-rc.1** 的网页设置、侧栏和输入区。可单独使用，不依赖 Passkey 代理。使用 DSH 原有的网页入口，不注册额外的 PWA Service Worker、安装提示或 Web Push。

按[安装与更新说明](https://github.com/timecatbit/dsh-web-plugins#安装与更新)装到 `dsh web` 或官方桌面 App。保留包名 `dsh-ui-mobile`，已有安装可以直接更新。Safari 可以把可访问的 DSH 网页[添加到主屏幕或程序坞](https://github.com/timecatbit/dsh-web-plugins#用-safari-保存为网页-app)。布局主要面向宽度小于 768 CSS 像素的页面。

本仓库分发可直接安装的构建包；[布局补丁和构建脚本](https://github.com/timecatbit/dsh-web-plugins/tree/main/plugins/mobile-layout)在主仓库维护。原作者与许可见 [LICENSE](LICENSE)。
