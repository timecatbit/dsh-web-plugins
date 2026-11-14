**DSH Pocket UI 0.1.23** stops the page from dropping a few pixels each time the app opens on a phone.

- **Pocket UI:** On a phone, the empty conversation page first painted with a 40px header. About 0.1 s later DSH added the right-panel button, and only then did Pocket UI give the header its phone height of 54px, so everything below moved down 14px (the centered composer about 7px). The header now has its phone height from the first frame, and nothing below it moves. The final layout is unchanged.
- **Passkey Proxy** stays at 0.1.16.

Checked by recording every frame of a cold start at iPhone 15 size in WebKit and Chromium on standalone DSH Web `0.2.1-rc.5`, `0.2.2-rc.1`, `0.2.2-rc.2` and `0.2.2-rc.3`: the header is 54px from the first painted frame, the composer and both header buttons keep their positions, and Chromium reports no vertical layout shift. The Pocket UI settings page, sign-in through the proxy and the plugin list were rechecked on `0.2.2-rc.3`.

Update through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
