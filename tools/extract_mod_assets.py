#!/usr/bin/env python3
"""Extract base assets from GTA: Vice City Stories PS2 ISO for mod creation.

Used to inspect the original disc image, extract data files (handling, weapons,
timecycles, carcols, text, etc.), and scaffold new Leonidas VCS mods.

Usage:
    python tools/extract_mod_assets.py list <iso> [--filter PATTERN]
    python tools/extract_mod_assets.py extract-data <iso> [--out-dir DIR]
    python tools/extract_mod_assets.py extract-file <iso> <internal_path> <out_file>
    python tools/extract_mod_assets.py scaffold <mod_id> <name> <category> [author]
"""

import argparse
import fnmatch
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import vcs_disc  # noqa: E402


def cmd_list(args):
    img = vcs_disc.IsoImage(args.iso)
    count = 0
    total_bytes = 0
    print(f"ISO Volume: {img.volume_id}")
    print("-" * 60)
    for path, rec in img.walk():
        clean_path = path.lstrip("/")
        if args.filter and not fnmatch.fnmatch(clean_path.lower(), args.filter.lower()):
            continue
        print(f"{clean_path:<45} {rec['size']:>12,} bytes")
        count += 1
        total_bytes += rec["size"]
    print("-" * 60)
    print(f"Total matching files: {count} ({total_bytes / (1024 * 1024):.2f} MB)")


def cmd_extract_data(args):
    img = vcs_disc.IsoImage(args.iso)
    out_dir = os.path.abspath(args.out_dir or "mods/01_hd_remake_essentials/files/DATA")
    os.makedirs(out_dir, exist_ok=True)
    print(f"Extracting DATA configuration files from {args.iso} to {out_dir}...")

    extracted = 0
    for path, rec in img.walk():
        clean = path.lstrip("/")
        parts = clean.split("/")
        if len(parts) >= 2 and parts[0].upper() == "DATA":
            rel_file = os.path.join(*parts[1:])
            dest_file = os.path.join(out_dir, rel_file)
            os.makedirs(os.path.dirname(dest_file), exist_ok=True)
            data = img.read_file(rec)
            with open(dest_file, "wb") as f:
                f.write(data)
            print(f"  [+] Extracted {clean} -> {dest_file} ({len(data):,} bytes)")
            extracted += 1

    print(f"Successfully extracted {extracted} base data files into {out_dir}.")


def cmd_extract_file(args):
    img = vcs_disc.IsoImage(args.iso)
    rec = img.find(args.internal_path)
    if not rec or rec.get("dir"):
        print(f"Error: file '{args.internal_path}' not found in ISO.", file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.dirname(os.path.abspath(args.out_file)), exist_ok=True)
    data = img.read_file(rec)
    with open(args.out_file, "wb") as f:
        f.write(data)
    print(f"Extracted {args.internal_path} ({len(data):,} bytes) -> {args.out_file}")


def cmd_scaffold(args):
    mod_dir = os.path.join("mods", args.mod_id)
    files_dir = os.path.join(mod_dir, "files")
    os.makedirs(files_dir, exist_ok=True)

    mod_json = f"""{{
  "id": "{args.mod_id}",
  "name": "{args.name}",
  "version": "1.0.0",
  "author": "{args.author or 'Leonidas Community'}",
  "description": "{args.name} for Leonidas Vice City Stories PC.",
  "category": "{args.category}",
  "enabled": true,
  "priority": 50,
  "tags": ["{args.category.lower()}", "hd"]
}}
"""
    readme_md = f"""# {args.name}

Created for Leonidas Vice City Stories (LVCS).

## File Structure
Place game replacement files inside `files/`:
- `files/DATA/...` (HANDLING.CFG, CARCOLS.DAT, TIMECYC.DAT, etc.)
- `files/MODELS/...` (GTA3.IMG, HUD.TXD, etc.)
- `files/TEXT/...` (AMERICAN.GXT)
"""
    with open(os.path.join(mod_dir, "mod.json"), "w") as f:
        f.write(mod_json)
    with open(os.path.join(mod_dir, "README.md"), "w") as f:
        f.write(readme_md)

    print(f"Created mod template in {mod_dir}")


def main():
    p = argparse.ArgumentParser(description="Extract base assets from GTA VCS ISO for modding")
    sub = p.add_subparsers(dest="cmd", required=True)

    p_list = sub.add_parser("list", help="List files inside ISO")
    p_list.add_argument("iso", help="Path to VCS ISO")
    p_list.add_argument("--filter", help="Glob pattern filter (e.g. 'data/*', '*.txd')")

    p_data = sub.add_parser("extract-data", help="Extract all DATA/ files from ISO")
    p_data.add_argument("iso", help="Path to VCS ISO")
    p_data.add_argument("--out-dir", help="Output directory (default: mods/01_hd_remake_essentials/files/DATA)")

    p_file = sub.add_parser("extract-file", help="Extract single file from ISO")
    p_file.add_argument("iso", help="Path to VCS ISO")
    p_file.add_argument("internal_path", help="Path inside ISO (e.g. DATA/HANDLING.CFG)")
    p_file.add_argument("out_file", help="Destination file path")

    p_scaffold = sub.add_parser("scaffold", help="Generate new mod scaffold")
    p_scaffold.add_argument("mod_id", help="Mod folder and ID name")
    p_scaffold.add_argument("name", help="Display name")
    p_scaffold.add_argument("category", help="Category (Visuals, Gameplay, Audio, UI)")
    p_scaffold.add_argument("author", nargs="?", default="Leonidas Community", help="Author name")

    args = p.parse_args()
    if args.cmd == "list":
        cmd_list(args)
    elif args.cmd == "extract-data":
        cmd_extract_data(args)
    elif args.cmd == "extract-file":
        cmd_extract_file(args)
    elif args.cmd == "scaffold":
        cmd_scaffold(args)


if __name__ == "__main__":
    main()
