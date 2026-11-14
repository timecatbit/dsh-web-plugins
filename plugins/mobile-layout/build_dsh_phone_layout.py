#!/usr/bin/env python3
"""Repackage the layout-only plugin with the mobile viewport and navigation fixes."""
import gzip
import hashlib
import io
import json
from pathlib import Path
import re
import sys
import tarfile

BASE = "5d6d45192464553bcec75f3e6501d9d20eb87a12b8a56dfb04560fd47f06ca01"
VERSION = "0.1.23"
HOST_RANGE = ">=0.2.1-rc.5"
PHONE_QUERY = "(max-width: 767px), (max-width: 980px) and (max-height: 520px) and (pointer: coarse)"
ROOT = Path(__file__).parent
HOME = ROOT / "home-screen"
LOCALE = {
    "en": {"title": "DSH Pocket UI", "description": "Phone layout for DSH: touch drawers and tap-to-focus chat input, with its own settings page for the home-screen icon."},
    "zh": {"title": "DSH Pocket UI", "description": "适配手机的对话页面、侧栏和输入框，自带设置页可选主屏幕图标。"},
}


def replace(s, old, new):
    assert s.count(old) == 1, old
    return s.replace(old, new)


def main(source, target):
    with tarfile.open(source, "r:gz") as f:
        files = {m.name: f.extractfile(m).read() for m in f if m.isfile()}
    manifest = {name: hashlib.sha256(blob).hexdigest() for name, blob in files.items()}
    assert hashlib.sha256(json.dumps(manifest, sort_keys=True).encode()).hexdigest() == BASE
    name = "package/lib/client.js"
    s = files[name].decode()
    assert s.count("(max-width: 767px)") >= 3
    s = s.replace("(max-width: 767px)", PHONE_QUERY)
    s = replace(s, "className: HeaderMenuButton_module_css_default.button,",
        'className: HeaderMenuButton_module_css_default.button,\n\t\t\t\t"data-dsh-phone-header-menu": true,')
    s = replace(s, '["data-sidebar-collapsed", "data-rightbar-collapsed"]',
        '["data-sidebar-collapsed", "data-rightbar-collapsed", "data-rightbar-fullscreen"]')
    s = replace(s, 'detailsOpen: !frame.hasAttribute("data-rightbar-collapsed")',
        'detailsOpen: frame.hasAttribute("data-rightbar-fullscreen") || !frame.hasAttribute("data-rightbar-collapsed")')
    s = replace(s, 'if (frame === null || frame === this.frame) return;',
        'if (frame === null) return;\n\t\t\t\tstampDshPhoneColumns(frame);\n\t\t\t\tif (frame === this.frame) return;')
    s, removed = re.subn(r'\n\t{4}for \(const \[index, role\] of COLUMN_ROLES\.entries\(\)\) \{.*?\n\t{4}\}', '', s, flags=re.S)
    assert removed == 1
    css = (ROOT / "dsh-phone-layout.css").read_text()
    s, changed = re.subn(r'(?m)^\t\tconst css = ".*?";$', lambda _: "\t\tconst css = " + json.dumps(css) + ";", s)
    assert changed == 1, changed
    before = "\t\tfunction apply(ctx) {"
    s = replace(s, before, (ROOT / "dsh-phone-layout.js").read_text() + "\n" + (ROOT / "dsh-pocket-settings.js").read_text() + "\n" + before)
    # Upstream only blurs untrusted focus, but focus() fires trusted events.
    # installPhoneComposerFocus guards the command popup's search instead.
    s = replace(s, '\t\t\tctx.effect(() => suppressCommandPanelScriptFocus(), "ui-mobile: command panel keyboard guard");\n', "")
    s = replace(s,
        '\t\t\tctx.effect(() => enableMobileEnterSend(), "ui-mobile: keyboard send action");\n'
        '\t\t\tctx.effect(() => lockMobilePageZoom(), "ui-mobile: page zoom lock");',
        '\t\t\tctx.effect(() => installPhoneLayout(ctx.layout), "ui-mobile: adaptive phone layout");\n'
        '\t\t\tinstallPocketSettings(ctx);')
    s = replace(s, "if (!state.mobile || !state.sidebarOpen) return null;",
        "if (!state.mobile || (!state.sidebarOpen && !state.detailsOpen)) return null;")
    # The host's ChatView already owns a scroll-to-bottom button and follow state.
    bottom_css = re.search(r'(?m)^\t\t//#region [^\n]*BackToBottom\.module\.css\.mjs\n', s)
    drawer_css = re.search(r'(?m)^\t\t//#region [^\n]*DrawerScrim\.module\.css\.mjs\n', s)
    assert bottom_css and drawer_css and bottom_css.start() < drawer_css.start()
    s = s[:bottom_css.start()] + s[drawer_css.start():]
    register = s.index("\t\t\t\tconst registerBackToBottom = ctx.slots.register({")
    teardown = s.index("\t\t\t\treturn () => {", register)
    s = s[:register] + s[teardown:]
    s = replace(s, "\t\t\t\t\tregisterBackToBottom();\n", "")
    assert "mobile-back-to-bottom" not in s
    s = replace(s, "inject: () => drawerControls()\n\t\t\t\t}, DrawerScrim);",
        "inject: () => ({\n"
        "\t\t\t\t\t\t...drawerControls(),\n"
        "\t\t\t\t\t\ttoggleSidebar: () => controller.snapshot().detailsOpen ? ctx.layout.closeRightbar() : ctx.layout.toggleSidebar()\n"
        "\t\t\t\t\t})\n\t\t\t\t}, DrawerScrim);")
    files[name] = s.encode()
    # Host part: the home-screen icon choice (built by home-screen/build.mjs).
    files["package/lib/index.js"] = (HOME / "lib" / "index.js").read_bytes()
    files["package/THIRD-PARTY-NOTICES.md"] = (HOME / "lib" / "THIRD-PARTY-NOTICES.md").read_bytes()
    for icon in [n for n in files if n.startswith("package/assets/icons/")]:
        del files[icon]  # upstream's PWA icons, unused since the layout-only build
    for png in sorted((HOME / "assets" / "home-screen").glob("*.png")):
        files["package/assets/home-screen/" + png.name] = png.read_bytes()
    for lang, meta in LOCALE.items():
        files[f"package/locale/{lang}.json"] = (json.dumps({"meta": meta}, ensure_ascii=False, indent=2) + "\n").encode()
    pkg = json.loads(files["package/package.json"])
    assert pkg["version"] == "0.1.8-subuntu.4"
    pkg["version"] = VERSION
    pkg["license"] = "MIT"
    pkg["description"] = "DSH Pocket UI: mobile layout, touch drawers, tap-to-focus chat input, and a home-screen icon choice"
    pkg["repository"] = {"type": "git", "url": "git+https://github.com/timecatbit/dsh-pocket-ui.git"}
    pkg["homepage"] = "https://github.com/timecatbit/dsh-pocket-ui#readme"
    pkg["bugs"] = {"url": "https://github.com/timecatbit/dsh-pocket-ui/issues"}
    pkg["keywords"] = ["dsh-plugin", "deepseek-harness", "mobile"]
    pkg.pop("scripts", None)
    pkg.pop("devDependencies", None)
    pkg["engines"]["dsh"] = HOST_RANGE
    pkg["exports"]["./locale/*"] = "./locale/*"
    # A git install only copies `files`; without these DSH lists the plugin
    # by its package name and the notices go missing.
    for entry in ("locale", "THIRD-PARTY-NOTICES.md"):
        if entry not in pkg["files"]:
            pkg["files"].append(entry)
    for dep in ("@deepseek-ai/dsh-client-ui-settings", "@deepseek-ai/dsh-client-locale"):
        if dep not in pkg["dsh"]["client"]["inject"]:
            pkg["dsh"]["client"]["inject"].append(dep)
    for name, version in pkg["peerDependencies"].items():
        if name.startswith("@deepseek-ai/dsh-") and version == "0.2.1-rc.5":
            pkg["peerDependencies"][name] = HOST_RANGE
    files["package/package.json"] = (json.dumps(pkg, indent=2) + "\n").encode()
    # This derivative only adds a layout bundle; it does not replace host PWA support.
    patch_name = "package/cordis.patch.yml"
    patch = files[patch_name].decode()
    files[patch_name] = replace(patch,
        "# Standalone bundle layer: this plugin owns the mobile PWA surface, so it\n"
        "# replaces the Web bundle's built-in ui-mobile entry before mounting itself.\n"
        "- id: ui-mobile\n  disabled: true\n\n", "").encode()
    del files["package/SUBUNTU-PATCH.txt"]
    files["package/README.md"] = (ROOT / "README.md").read_bytes()
    files["package/README.en.md"] = (ROOT / "README.en.md").read_bytes()
    with target.open("wb") as out:
        with gzip.GzipFile(filename="", fileobj=out, mode="wb", mtime=0) as gz:
            with tarfile.open(fileobj=gz, mode="w") as f:
                for name, content in sorted(files.items()):
                    entry = tarfile.TarInfo(name)
                    entry.size = len(content)
                    entry.mode = 0o644
                    f.addfile(entry, io.BytesIO(content))
    print(hashlib.sha256(target.read_bytes()).hexdigest(), target)


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
