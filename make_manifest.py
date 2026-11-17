#!/usr/bin/env python3
"""
Create or update manifest.json for the site updater.

Run it from the root of your site repo (or pass --dir):

    python make_manifest.py                 # bump patch version (1.0.0 -> 1.0.1), or start at 1.0.0
    python make_manifest.py --bump minor    # 1.0.1 -> 1.1.0
    python make_manifest.py --bump major    # 1.1.0 -> 2.0.0
    python make_manifest.py --version 3.2.1 # set an exact version
    python make_manifest.py --keep          # keep the current version, just refresh the file list
    python make_manifest.py --dry-run       # show what would be written

Files are skipped if they match the built-in excludes, any --exclude pattern,
or a pattern listed (one per line) in a .manifestignore file in the folder.
"""
import argparse
import fnmatch
import json
import re
import sys
from pathlib import Path

MANIFEST = "manifest.json"
DEFAULT_EXCLUDES = [
    MANIFEST, ".git", ".git/*", ".github", ".github/*", ".gitignore", ".gitattributes",
    ".DS_Store", "Thumbs.db", "node_modules", "node_modules/*", "__pycache__", "__pycache__/*",
    "*.pyc", "*.py", ".manifestignore", "README.md", "LICENSE", "Pages/Games/Files/*",
]


def load_ignore_file(root: Path):
    f = root / ".manifestignore"
    if not f.exists():
        return []
    lines = f.read_text(encoding="utf-8").splitlines()
    return [l.strip() for l in lines if l.strip() and not l.strip().startswith("#")]


def is_excluded(rel: str, patterns):
    parts = rel.split("/")
    for pat in patterns:
        pat = pat.rstrip("/")
        if fnmatch.fnmatch(rel, pat) or fnmatch.fnmatch(parts[-1], pat):
            return True
        # a pattern matching any parent folder excludes everything inside it
        if any(fnmatch.fnmatch(p, pat) for p in parts[:-1]):
            return True
    return False


def parse_version(v: str):
    m = re.fullmatch(r"v?(\d+)\.(\d+)\.(\d+)", v.strip())
    return tuple(int(x) for x in m.groups()) if m else None


def bump(v: str, kind: str):
    t = parse_version(v)
    if not t:
        return "1.0.0"
    major, minor, patch = t
    if kind == "major":
        return f"{major + 1}.0.0"
    if kind == "minor":
        return f"{major}.{minor + 1}.0"
    return f"{major}.{minor}.{patch + 1}"


def main():
    ap = argparse.ArgumentParser(description="Create or update manifest.json")
    ap.add_argument("--dir", default=".", help="site folder (default: current folder)")
    ap.add_argument("--version", help="set an exact version, e.g. 2.0.0")
    ap.add_argument("--bump", choices=["patch", "minor", "major"], default="patch",
                    help="how to bump the existing version (default: patch)")
    ap.add_argument("--keep", action="store_true", help="do not change the version")
    ap.add_argument("--exclude", action="append", default=[], help="extra glob to skip (repeatable)")
    ap.add_argument("--dry-run", action="store_true", help="print the result without writing")
    args = ap.parse_args()

    root = Path(args.dir).resolve()
    if not root.is_dir():
        sys.exit(f"Not a folder: {root}")

    manifest_path = root / MANIFEST
    old_version, old_files = None, []
    if manifest_path.exists():
        try:
            data = json.loads(manifest_path.read_text(encoding="utf-8"))
            old_version = data.get("version") if isinstance(data, dict) else None
            old_files = data.get("files", []) if isinstance(data, dict) else data
        except Exception as e:
            print(f"Warning: could not read existing {MANIFEST} ({e}); starting fresh.")

    patterns = DEFAULT_EXCLUDES + load_ignore_file(root) + args.exclude
    files = []
    for p in root.rglob("*"):
        if p.is_file():
            rel = p.relative_to(root).as_posix()
            if not is_excluded(rel, patterns):
                files.append(rel)
    files.sort()

    if args.version:
        if not parse_version(args.version):
            sys.exit("Version must look like 1.2.3")
        version = args.version.lstrip("v")
    elif args.keep and old_version:
        version = old_version
    elif old_version:
        version = bump(old_version, args.bump)
    else:
        version = "1.0.0"

    out = {"version": version, "files": files}
    text = json.dumps(out, indent=2) + "\n"

    added = sorted(set(files) - set(old_files))
    removed = sorted(set(old_files) - set(files))
    print(f"Version: {old_version or '(none)'} -> {version}")
    print(f"Files:   {len(files)} total, {len(added)} added, {len(removed)} removed")
    for f in added:
        print(f"  + {f}")
    for f in removed:
        print(f"  - {f}")

    if args.dry_run:
        print("\n(dry run, nothing written)")
        return
    manifest_path.write_text(text, encoding="utf-8")
    print(f"\nWrote {manifest_path}")
    print(f"Next: git add -A && git commit -m \"v{version}\" && git tag v{version} && git push --tags")


if __name__ == "__main__":
    main()