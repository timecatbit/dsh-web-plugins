**DSH Pocket UI 0.1.10** fixes a viewport-handling bug that can leave a large blank area or cause an extra layout jump while the iPhone keyboard opens or closes.

- Bound the reported visual viewport offset to the part actually hidden by the keyboard; discard a stale offset once the full height returns.
- Keep the keyboard layout during the dismissal animation instead of expanding as soon as the editor blurs.
- Move viewport updates out of the full sidebar/conversation scan and recheck once after the resize event burst.
- Preserve drafts and transcript scroll state. Keep tap-to-focus input and the previous mobile header fixes.

**DSH Passkey Proxy remains at 0.1.8.** This release changes the mobile UI only.

### Validation

WebKit and Chromium regression tests cover repeated keyboard cycles, stale offsets, blur-before-resize ordering, draft and scroll retention, browser toolbar changes, pinch zoom, delayed final geometry, desktop behavior, and cleanup. The keyboard viewport changes are simulated: these tests do not replace a physical iPhone keyboard test.

Supported DSH versions remain `0.2.1-rc.5` and `0.2.2-rc.1`. The project has previously tested standalone Web and the official macOS desktop app (Apple Silicon); Windows desktop remains untested.

Update Pocket UI through [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新) or install the new tarball into the same profile.
