#!/usr/bin/env python3
"""Build the verified mobile layout without the plugin's authenticated PWA assets."""
import gzip
import hashlib
import io
import json
from pathlib import Path
import sys
import tarfile

EXPECTED = "fa4ce28cbc034de8d6a92653a1c1579fa733163f6577d75d203b611d1316613f"
VERSION = "0.1.8-subuntu.4"


def replace(text, old, new=""):
    assert text.count(old) == 1, old
    return text.replace(old, new)


def main(source, target):
    with tarfile.open(source, "r:gz") as archive:
        files = {item.name: archive.extractfile(item).read() for item in archive if item.isfile()}
    manifest = {name: hashlib.sha256(blob).hexdigest() for name, blob in files.items()}
    assert hashlib.sha256(json.dumps(manifest, sort_keys=True).encode()).hexdigest() == EXPECTED

    # Leave the document head and stock manifest to DSH. The proxy does not
    # exempt the external plugin's /pwa/* routes from Basic Auth.
    files["package/lib/index.js"] = b"export function apply() {}\n"
    client = "package/lib/client.js"
    text = files[client].decode()
    for line in (
        "\t\t\tregisterServiceWorker();\n",
        "\t\t\tconst install = new InstallController();\n",
        "\t\t\tconst push = new PushController((sessionId) => {\n"
        "\t\t\t\tctx.uiWorkspace.openSession(sessionId);\n"
        "\t\t\t});\n",
        "\t\t\t\tinstall.start();\n",
        "\t\t\t\tpush.start();\n",
        "\t\t\t\t\tinstall.stop();\n",
        "\t\t\t\t\tpush.stop();\n",
        "\t\t\t\t\tregisterBanner();\n",
        "\t\t\t\t\tregisterPushPrompt();\n",
    ):
        text = replace(text, line)
    start = text.index("\t\t\t\tconst registerBanner = ctx.slots.register(")
    end = text.index("\n\t\t\t\treturn () => {", start)
    assert "const registerPushPrompt" in text[start:end]
    text = text[:start] + text[end + 1:]
    text = replace(text, '"slots",\n\t\t\t"uiWorkspace"', '"slots"')
    text = replace(text, "ui-mobile: frame stabilization + install controller", "ui-mobile: frame stabilization")
    files[client] = text.encode()

    pkg = json.loads(files["package/package.json"])
    assert pkg["version"] == "0.1.8-subuntu.3"
    pkg["version"] = VERSION
    pkg["description"] = "DeepSeek Harness mobile layout with touch drawers; uses the stock web entry"
    del pkg["dependencies"]["web-push"]
    for name in ("dsh-host-webserver", "dsh-client-ui-workspace"):
        del pkg["peerDependencies"]["@deepseek-ai/" + name]
    pkg["dsh"]["client"]["inject"].remove("@deepseek-ai/dsh-client-ui-workspace")
    files["package/package.json"] = (json.dumps(pkg, indent=2) + "\n").encode()
    files["package/SUBUNTU-PATCH.txt"] += (
        "\nLayout-only build: preserve the stock HTML and manifest. "
        "Do not register plugin PWA assets, a worker, install prompts, or Web Push.\n"
    ).encode()
    with target.open("wb") as output:
        with gzip.GzipFile(filename="", fileobj=output, mode="wb", mtime=0) as zipped:
            with tarfile.open(fileobj=zipped, mode="w") as archive:
                for name, content in sorted(files.items()):
                    info = tarfile.TarInfo(name)
                    info.size = len(content)
                    info.mode = 0o644
                    archive.addfile(info, io.BytesIO(content))
    print(hashlib.sha256(target.read_bytes()).hexdigest(), target)


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
