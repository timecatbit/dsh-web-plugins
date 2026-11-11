**DSH Pocket UI 0.1.12** follows the native keyboard geometry directly. It restores the `0.1.10` mobile layout and applies the reported height and offset in the same viewport event, including offset-only changes.

Opening and dismissal use the same native geometry. The plugin does not predict a keyboard dismissal from blur or add its own closing animation. If Safari reports a resize late, the app applies it when received.

WebKit and Chromium regression tests replay the iPhone event sequence and check that the page remains anchored, applies each reported height immediately, and retains the draft and scroll position. DSH Web was tested on `0.2.1-rc.5` and `0.2.2-rc.1`.

**DSH Passkey Proxy remains at 0.1.8.** Update Pocket UI through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新).
