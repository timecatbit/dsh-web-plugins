#!/usr/bin/env python3
"""Record the DSH versions a plugin's newest release was tested on as Discover labels.

Discover shows a plugin's labels as tags on its card, so users can see whether
their DSH version has been tested. Pass the complete list each time; it replaces
the plugin's previous tested labels.
"""

import argparse
import json
from pathlib import Path
import re

PREFIX = "tested-dsh-"
SEMVER = re.compile(r"(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z.-]+)?")


def sort_key(version):
    core, _, pre = version.partition("-")
    parts = [int(x) for x in core.split(".")]
    # A prerelease sorts before its release; numeric identifiers compare as numbers.
    ids = [(0, int(x), "") if x.isdigit() else (1, 0, x) for x in pre.split(".")] if pre else []
    return parts, 0 if pre else 1, ids


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("index", type=Path)
    parser.add_argument("plugin", help="Package name, e.g. dsh-ui-mobile")
    parser.add_argument("versions", nargs="+", help="Exact DSH versions, e.g. 0.2.2-rc.2")
    args = parser.parse_args()
    for version in args.versions:
        if not SEMVER.fullmatch(version):
            parser.error(f"{version!r} is not an exact SemVer version")
    index = json.loads(args.index.read_text())
    plugin = next((item for item in index["plugins"] if item["name"] == args.plugin), None)
    if plugin is None:
        parser.error(f"{args.plugin} is not in {args.index}")
    versions = sorted(set(args.versions), key=sort_key)
    metadata = plugin.setdefault("metadata", {})
    others = [label for label in metadata.get("labels", []) if not label.startswith(PREFIX)]
    metadata["labels"] = others + [PREFIX + version for version in versions]
    declared = index.setdefault("metadata", {}).setdefault("labels", {})
    for version in versions:
        declared[PREFIX + version] = {"title": {"en": f"Tested on DSH {version}", "zh": f"已测 DSH {version}"}}
    used = {label for item in index["plugins"] for label in item.get("metadata", {}).get("labels", [])}
    for label in [label for label in declared if label.startswith(PREFIX) and label not in used]:
        del declared[label]
    index["metadata"]["labels"] = dict(sorted(declared.items(), key=lambda item: (
        not item[0].startswith(PREFIX), sort_key(item[0][len(PREFIX):]) if item[0].startswith(PREFIX) else item[0])))
    # Keep metadata ahead of the lists it describes, so the file reads top-down.
    index = before(index, "metadata", "plugins")
    index["plugins"] = [before(item, "metadata", "versions") for item in index["plugins"]]
    args.index.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")


def before(record, key, anchor):
    if key not in record or anchor not in record:
        return record
    out = {}
    for name, value in record.items():
        if name == anchor:
            out[key] = record[key]
        if name != key:
            out[name] = value
    return out


if __name__ == "__main__":
    main()
