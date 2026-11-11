# DSH Pocket UI

[简体中文](README.md) · [Releases](https://github.com/timecatbit/dsh-pocket-ui/releases) · [MIT license](LICENSE)

A narrow-screen layout for DeepSeek Harness (DSH). **Install it on its own.** It works with your existing DSH URL and sign-in method, including a reachable LAN IP and port. It needs no proxy, Passkey, or domain.

## What changes

- On phones, opening the left sidebar pushes the conversation to the right and leaves part of it visible.
- Opening a conversation does not bring up the keyboard. Tap the composer to type.
- When the keyboard opens or closes, the page follows Safari's own animation and does not jump again afterwards. While the keyboard is open, the conversation header moves off screen, as on other pages in Safari.
- The settings fit narrow screens. There is one left-sidebar button in chat, and the native right-sidebar button stays available.
- Better Sidebar's bottom-workbench button is hidden in phone mode. The desktop toolbar is unchanged.

The layout applies mainly below 768 CSS pixels and also covers some touch devices in landscape. It opens no network port and adds no Service Worker, installation prompt, or Web Push.

## Compatibility

| Environment | Tested |
| --- | --- |
| Standalone Web (`dsh web`) | DSH `0.2.1-rc.5` and `0.2.2-rc.1` |
| Official macOS desktop app (Apple Silicon) | DSH `0.2.2-rc.1`; a wide window keeps the desktop layout |
| Official Windows desktop app | Not tested |

The package remains `dsh-ui-mobile`. It replaces a previous build of this project or the upstream package with the same ID in the selected profile.

## Install or update in DSH

1. In the DSH sidebar, open **Plugins**. Under **Experimental plugins**, click **More** if the switch is not visible. Enable **Custom plugin markets** on DSH `0.2.1-rc.5` or **Custom plugin indexes** on `0.2.2-rc.1`.
2. Go to **Discover → Add index source** and paste the address below. Add it once per profile. If you already added it for Passkey Proxy, skip to the next step.

   ```text
   https://raw.githubusercontent.com/timecatbit/dsh-web-plugins/main/plugin-index.json
   ```

3. Click the **DSH Pocket UI card title → Versions → Install**. Use the same path when the card says **Update available**. Confirm the update without uninstalling first, enable the plugin if prompted, and restart the same DSH instance if requested.

## Install manually

- **Official macOS desktop app:** Open **Plugins → Add plugin** in the app. Paste the [0.1.13 asset URL](https://github.com/timecatbit/dsh-pocket-ui/releases/download/v0.1.13/dsh-ui-mobile-0.1.13.tgz) or the absolute path of the downloaded file. Choose **Enable now**, then quit and reopen the app if asked. The desktop app manages its own profile.
- **Standalone `dsh web`:** Download the `.tgz` from [Releases](https://github.com/timecatbit/dsh-pocket-ui/releases). Use the same system account and `DSH_HOME` as the running instance. From the directory containing the download, run:

  ```bash
  dsh plugin --profile web add "$PWD/dsh-ui-mobile-0.1.13.tgz"
  ```

  Replace `web` if you use a custom profile, then restart that `dsh web` process.

## Use it on a phone

Open your existing DSH website in Safari or an Android browser. If the DSH instance on your desktop is not reachable from the phone, give it a reachable web address first; [DSH Passkey Proxy](https://github.com/timecatbit/dsh-passkey-proxy) is one option. On iPhone or iPad, Safari can save the regular site via **Share → Add to Home Screen → Open as Web App** (if shown). On Mac, use **File → Add to Dock**. Save the everyday address rather than a launch URL containing `?token=`. These shortcuts open the site; plugins are installed in DSH itself.

## Troubleshoot, roll back, and contribute

If nothing changes, check that the phone reaches the profile you updated, the plugin is enabled, and you restarted that DSH instance if prompted. Test in a narrow viewport. To roll back, select a previous version if listed in Discover, or install a trusted older `.tgz` into the same profile and restart. For a layout issue, include the DSH and plugin versions, OS, browser, and whether it occurs in a blank or existing conversation in [Issues](https://github.com/timecatbit/dsh-pocket-ui/issues).

This repository distributes prebuilt bundles. The [patches and build scripts](https://github.com/timecatbit/dsh-web-plugins/tree/main/plugins/mobile-layout) are maintained in [DSH Web Plugins](https://github.com/timecatbit/dsh-web-plugins). Derived from [jasondu/dsh-ui-mobile](https://github.com/jasondu/dsh-ui-mobile) 0.1.8. [MIT licensed](LICENSE), with the original copyright notice retained.
