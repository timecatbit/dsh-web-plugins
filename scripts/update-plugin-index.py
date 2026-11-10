#!/usr/bin/env python3
"""Add released bundles to the DSH Discover index with immutable Git sources."""

import argparse
import json
from pathlib import Path
import re
import tarfile
import time


PLUGINS = {
    "dsh-ui-mobile": {
        "repo": "dsh-pocket-ui",
        "title": {"en": "DSH Pocket UI", "zh": "DSH Pocket UI · 手机界面"},
        "description": {
            "en": "Mobile conversation layout, touch drawers, and tap-to-focus chat input.",
            "zh": "适配手机的对话页面、侧栏和输入框。",
        },
    },
    "@smanx/dsh-proxy": {
        "repo": "dsh-passkey-proxy",
        "title": {"en": "DSH Passkey Proxy", "zh": "DSH Passkey Proxy · 局域网代理"},
        "description": {
            "en": "LAN reverse proxy with password and HTTPS Passkey sign-in.",
            "zh": "提供局域网代理、密码和 HTTPS Passkey 登录。",
        },
    },
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("index", type=Path)
    parser.add_argument("archive", type=Path)
    parser.add_argument("commit", help="Commit of the unpacked bundle in its release repository")
    args = parser.parse_args()
    if not re.fullmatch(r"[a-f0-9]{40}", args.commit):
        parser.error("commit must be a full lowercase Git SHA")
    with tarfile.open(args.archive, "r:gz") as archive:
        package = json.load(archive.extractfile("package/package.json"))
        if package.get("private") or not package.get("dsh", {}).get("bundle", {}).get("patch"):
            parser.error("archive must declare a public DSH bundle")
        archive.getmember("package/" + package["dsh"]["bundle"]["patch"].removeprefix("./"))
    name, version = package["name"], package["version"]
    if name not in PLUGINS or not re.fullmatch(r"(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)", version):
        parser.error("expected a known package with a stable SemVer")
    product = PLUGINS[name]
    repo = "https://github.com/timecatbit/" + product["repo"]
    if package.get("repository", {}).get("url") != "git+" + repo + ".git":
        parser.error("package and index must point to the same release repository")
    index = json.loads(args.index.read_text()) if args.index.exists() else {
        "format": 1, "title": {"en": "DSH Web Plugins", "zh": "DSH 网页插件"}, "plugins": [],
    }
    plugin = next((item for item in index["plugins"] if item["name"] == name), None)
    if plugin is None:
        plugin = {
            "name": name, "title": product["title"], "description": product["description"],
            "author": "timecatbit", "homepage": repo, "repository": {"url": repo}, "versions": [],
        }
        index["plugins"].append(plugin)
    entry = {
        "version": version,
        "source": {"type": "git", "url": repo, "commit": args.commit},
        "engines": {"dsh": package["engines"]["dsh"]},
    }
    for old in plugin["versions"]:
        if old["version"] == version:
            if any(old.get(key) != value for key, value in entry.items()):
                parser.error(f"{name}@{version} already refers to a different release")
            return
    plugin["versions"].insert(0, {"publishTimestamp": int(time.time()), **entry})
    args.index.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
