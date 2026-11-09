#!/usr/bin/env python3
"""Repackage the verified dsh-ui-mobile 0.1.8 release for DSH 0.2.1-rc.5."""
import base64
import hashlib
import io
import json
import pathlib
import re
import sys
import tarfile
import urllib.request

HOST = "0.2.1-rc.5"
VERSION = "0.1.8-subuntu.3"
REGISTRY = "https://registry.npmjs.org/dsh-ui-mobile"
CLIENT_HASH = "3083babff87493f149bf399016df0059994640cae7a3ba17c2dd83100628fac7"
HOST_HASH = "6d3edd4616a8ae948c0b1448406ab13837ce7f67fe727970afcecde4b07ef0c3"
UPSTREAM_INTEGRITY = "sha512-zSbu/Jervz4lsEcC2O5oMBBO9WVO3KNn7D8BRMLY9rq64q4OgEC6JM+hSf+6ZxHlRfcLz0WTxzVhQdQ7IkoZdQ=="


def substitute(source, old, new, count):
    assert source.count(old) == count, old
    return source.replace(old, new)


def download(url):
    assert url.startswith(REGISTRY + "/")
    with urllib.request.urlopen(url, timeout=15) as response:
        return response.read(4 * 1024 * 1024)


def main(target):
    metadata = json.loads(download(REGISTRY + "/0.1.8"))
    upstream = download(metadata["dist"]["tarball"])
    integrity = "sha512-" + base64.b64encode(hashlib.sha512(upstream).digest()).decode()
    assert integrity == metadata["dist"]["integrity"] == UPSTREAM_INTEGRITY
    with tarfile.open(fileobj=io.BytesIO(upstream), mode="r:gz") as archive:
        files = {m.name: archive.extractfile(m).read() for m in archive if m.isfile()}
    client = "package/lib/client.js"
    server = "package/lib/index.js"
    assert hashlib.sha256(files[client]).hexdigest() == CLIENT_HASH
    assert hashlib.sha256(files[server]).hexdigest() == HOST_HASH
    s = files[client].decode()
    for old, new, count in [
        ("data-details-collapsed", "data-rightbar-collapsed", 4),
        ("IconDownloadOutline16", "IconDownloadOutlineRegular", 2),
        ("IconCloseOutline16", "IconCloseOutlineRegular", 2),
        ("IconPanelLeftOutline16", "IconPanelLeftOutlineRegular", 2),
        ("#JuWO4a_root", "#root", 1),
        ('"sessions"\n\t\t];', '"uiWorkspace"\n\t\t];', 1),
        ("ctx.sessions.open(sessionId)", "ctx.uiWorkspace.openSession(sessionId)", 1),
        ("conversation.session.header.left", "conversation.header.leading", 3),
        (".VDoJnG_banner{top:calc(env(safe-area-inset-top) + 12px)", ".VDoJnG_banner{top:calc(env(safe-area-inset-top) + 64px)", 1),
        (".juySiW_button{top:", "body:has(.x8foHq_button) .juySiW_button{display:none}.juySiW_button{top:", 1),
    ]:
        s = substitute(s, old, new, count)
    files[client] = s.encode()
    s = files[server].decode()
    # DSH 0.2 hydrates its own [data-dsh-boot] node. A sibling placeholder
    # inserted ahead of it leaves that overlay orphaned above the live app.
    s = substitute(
        s,
        "injectBootSkeleton(injectPwaHead(stripHostPwa(html)))",
        "injectPwaHead(stripHostPwa(html))",
        1,
    )
    s = substitute(s, "const CACHE_NAME = 'dsh-ui-mobile-shell-v1';\n", "", 1)
    s = substitute(
        s,
        "keys.filter((key) => key !== CACHE_NAME)",
        "keys.filter((key) => key.startsWith('dsh-ui-mobile-shell-'))",
        1,
    )
    # Let the browser fetch pages, modules and API responses normally. Keep
    # the worker for push and notification clicks; clear only old DSH caches.
    s, n = re.subn(r"self\.addEventListener\('fetch', \(event\) => \{\n.*?\n\}\);\n", "", s, flags=re.S)
    assert n == 1 and "caches.match" not in s and "caches.open" not in s
    files[server] = s.encode()
    pkg = json.loads(files["package/package.json"])
    assert pkg["name"] == "dsh-ui-mobile" and pkg["version"] == "0.1.8"
    pkg["version"] = VERSION
    pkg.setdefault("engines", {})["dsh"] = HOST
    for legacy in ("dsh-client-runtime", "dsh-client-ui-primitives", "dsh-client-ui-slots", "dsh-invariants"):
        del pkg["peerDependencies"]["@deepseek-ai/" + legacy]
    for component in ("dsh-client-ui-conversation", "dsh-client-ui-layout", "dsh-client-ui-theme", "dsh-host-webserver", "dsh-client-ui-workspace", "dsh-client-ui-cordis"):
        pkg["peerDependencies"]["@deepseek-ai/" + component] = HOST
    pkg["dsh"]["client"]["inject"] = [
        "@deepseek-ai/dsh-client-ui-cordis",
        "@deepseek-ai/dsh-client-ui-layout",
        "@deepseek-ai/dsh-client-ui-workspace",
    ]
    # Already built. A file-based install needs no lifecycle script.
    pkg["scripts"].pop("prepare", None)
    files["package/package.json"] = (json.dumps(pkg, indent=2) + "\n").encode()
    files["package/SUBUNTU-PATCH.txt"] = (
        f"Upstream dsh-ui-mobile 0.1.8, integrity {integrity}\n"
        f"Target DSH: {HOST}\n"
        "Use the host's current icons, header slot, workspace service and right drawer attributes.\n"
        "Let DSH own its loading markup so React can complete the boot handoff.\n"
        "Keep the install banner below the toolbar; show a single drawer button.\n"
        "Keep PWA and push routes; do not cache the DSH shell, assets, plugins or API in the service worker.\n"
    ).encode()
    target.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(target, "w:gz") as archive:
        for name, content in sorted(files.items()):
            assert name.startswith("package/") and ".." not in pathlib.PurePosixPath(name).parts
            m = tarfile.TarInfo(name)
            m.size = len(content)
            m.mode = 0o644
            archive.addfile(m, io.BytesIO(content))
    print(hashlib.sha256(target.read_bytes()).hexdigest(), target)


if __name__ == "__main__":
    main(pathlib.Path(sys.argv[1]))
