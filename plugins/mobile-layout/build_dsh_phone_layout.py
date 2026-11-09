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
VERSION = "0.1.8-mobile.8"
HOST_RANGE = "0.2.1-rc.5 || 0.2.2-rc.1"
PHONE_QUERY = "(max-width: 767px), (max-width: 980px) and (max-height: 520px) and (pointer: coarse)"
ROOT = Path(__file__).parent


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
    s = replace(s, before, (ROOT / "dsh-phone-layout.js").read_text() + "\n" + before)
    s = replace(s,
        '\t\t\tctx.effect(() => enableMobileEnterSend(), "ui-mobile: keyboard send action");\n'
        '\t\t\tctx.effect(() => lockMobilePageZoom(), "ui-mobile: page zoom lock");',
        '\t\t\tctx.effect(() => installPhoneLayout(ctx.layout), "ui-mobile: adaptive phone layout");')
    s = replace(s, "if (!state.mobile || !state.sidebarOpen) return null;",
        "if (!state.mobile || (!state.sidebarOpen && !state.detailsOpen)) return null;")
    s = replace(s, "inject: () => drawerControls()\n\t\t\t\t}, DrawerScrim);",
        "inject: () => ({\n"
        "\t\t\t\t\t\t...drawerControls(),\n"
        "\t\t\t\t\t\ttoggleSidebar: () => controller.snapshot().detailsOpen ? ctx.layout.closeRightbar() : ctx.layout.toggleSidebar()\n"
        "\t\t\t\t\t})\n\t\t\t\t}, DrawerScrim);")
    files[name] = s.encode()
    pkg = json.loads(files["package/package.json"])
    assert pkg["version"] == "0.1.8-subuntu.4"
    pkg["version"] = VERSION
    pkg["license"] = "MIT"
    pkg["engines"]["dsh"] = HOST_RANGE
    for name, version in pkg["peerDependencies"].items():
        if name.startswith("@deepseek-ai/dsh-") and version == "0.2.1-rc.5":
            pkg["peerDependencies"][name] = HOST_RANGE
    files["package/package.json"] = (json.dumps(pkg, indent=2) + "\n").encode()
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
