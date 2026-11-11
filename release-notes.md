**DSH Pocket UI 0.1.11** keeps the mobile page anchored while the keyboard opens or closes.

- Keep the application in the normal page layout instead of moving its root by the visual viewport offset.
- Confirm keyboard size changes across frames before applying them, so a brief opposite-height report does not resize the conversation.
- Keep the welcome area visible during typing. Preserve tap-to-focus, drafts, and the transcript scroll position.

**DSH Passkey Proxy stays at 0.1.8.**

### Validation

Compared `0.1.10` and `0.1.11` on DSH `0.2.1-rc.5` and `0.2.2-rc.1` using WebKit and Chromium. Injected opening and closing sequences that previously moved the page or briefly restored its full height. The new build held the page top and filtered the transient heights; the editor stayed visible after resizing. Desktop layout and focus were unchanged.

These tests simulate keyboard geometry. The native keyboard animation still needs confirmation on an iPhone.

Update Pocket UI via [DSH Discover](https://github.com/timecatbit/dsh-web-plugins#安装与更新). The `0.1.10` package remains available for rollback.
