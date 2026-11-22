#!/usr/bin/env python3
"""Leonidas ViceCityStories (LVCS) - Mod Management Tool

Commands:
    python tools/modctl.py list                 List all installed mods and their status
    python tools/modctl.py enable <mod_id>      Enable a specific mod
    python tools/modctl.py disable <mod_id>     Disable a specific mod
    python tools/modctl.py preset [hd|ps2]      Apply 'hd' (LVCS HD Remake) or 'ps2' (Original) preset
    python tools/modctl.py install <path>       Install a mod folder or zip archive
    python tools/modctl.py info <mod_id>        Show detailed mod information
"""

import argparse
import json
import os
import shutil
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODS_DIR = os.path.join(ROOT, "mods")
CONFIG_PATH = os.path.join(MODS_DIR, "mods_config.json")


def load_config():
    if os.path.isfile(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"hd_remake_active": True, "mods": {}}


def save_config(cfg):
    os.makedirs(MODS_DIR, exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)


def get_mods():
    cfg = load_config()
    cfg_mods = cfg.get("mods", {})
    mods = []

    if not os.path.isdir(MODS_DIR):
        return mods

    for item in sorted(os.listdir(MODS_DIR)):
        mod_path = os.path.join(MODS_DIR, item)
        if not os.path.isdir(mod_path):
            continue

        manifest_path = os.path.join(mod_path, "mod.json")
        info = {
            "id": item,
            "name": item.replace("_", " ").replace("-", " ").title(),
            "version": "1.0",
            "author": "Unknown",
            "category": "General",
            "description": "",
            "priority": 50,
            "enabled": True,
            "path": mod_path,
        }

        if os.path.isfile(manifest_path):
            try:
                with open(manifest_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    info.update(data)
            except Exception as e:
                info["description"] = f"(error parsing mod.json: {e})"

        # Override enabled from config
        if info["id"] in cfg_mods:
            info["enabled"] = bool(cfg_mods[info["id"]])

        mods.append(info)

    return mods


def cmd_list(args):
    cfg = load_config()
    mods = get_mods()
    hd_active = cfg.get("hd_remake_active", True)

    print("=" * 70)
    print(" Leonidas ViceCityStories (LVCS) - Mod Loader & HD Remake Engine")
    print("=" * 70)
    print(f" HD Remake Preset: {'[ENABLED]' if hd_active else '[DISABLED]'}")
    print(f" Mods Directory:   {MODS_DIR}")
    print(f" Total Mods:       {len(mods)}")
    print("-" * 70)
    print(f" {'STATUS':<10} {'ID':<24} {'CATEGORY':<12} {'NAME'}")
    print("-" * 70)

    for m in mods:
        status = "[ACTIVE]" if m["enabled"] else "[OFF]"
        print(f" {status:<10} {m['id']:<24} {m.get('category',''):<12} {m['name']}")

    print("=" * 70)


def cmd_enable(args):
    cfg = load_config()
    mod_id = args.mod_id
    mods = {m["id"]: m for m in get_mods()}

    if mod_id not in mods:
        print(f"Error: Mod '{mod_id}' not found in {MODS_DIR}")
        return 1

    cfg.setdefault("mods", {})[mod_id] = True
    save_config(cfg)
    print(f"Mod '{mod_id}' ({mods[mod_id]['name']}) is now ENABLED.")
    return 0


def cmd_disable(args):
    cfg = load_config()
    mod_id = args.mod_id
    mods = {m["id"]: m for m in get_mods()}

    if mod_id not in mods:
        print(f"Error: Mod '{mod_id}' not found in {MODS_DIR}")
        return 1

    cfg.setdefault("mods", {})[mod_id] = False
    save_config(cfg)
    print(f"Mod '{mod_id}' ({mods[mod_id]['name']}) is now DISABLED.")
    return 0


def cmd_preset(args):
    cfg = load_config()
    preset = args.preset.lower()

    if preset in ("hd", "hd-remake", "remake"):
        cfg["hd_remake_active"] = True
        for m in get_mods():
            if m.get("category") in ("Visuals", "UI", "Gameplay"):
                cfg.setdefault("mods", {})[m["id"]] = True
        save_config(cfg)
        print("LVCS HD Remake Preset APPLIED: All HD enhancements, shaders, and visual mods ENABLED.")
    elif preset in ("ps2", "authentic", "vanilla"):
        cfg["hd_remake_active"] = False
        for m in get_mods():
            cfg.setdefault("mods", {})[m["id"]] = False
        save_config(cfg)
        print("Authentic PS2 Preset APPLIED: All mods DISABLED.")
    else:
        print(f"Unknown preset '{args.preset}'. Available presets: 'hd' or 'ps2'")
        return 1
    return 0


def cmd_install(args):
    src = args.path
    if not os.path.exists(src):
        print(f"Error: Path '{src}' does not exist.")
        return 1

    os.makedirs(MODS_DIR, exist_ok=True)

    if os.path.isdir(src):
        target_name = os.path.basename(os.path.abspath(src))
        dst = os.path.join(MODS_DIR, target_name)
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
        print(f"Installed mod directory into: {dst}")
    elif zipfile.is_zipfile(src):
        target_name = os.path.splitext(os.path.basename(src))[0]
        dst = os.path.join(MODS_DIR, target_name)
        os.makedirs(dst, exist_ok=True)
        with zipfile.ZipFile(src, "r") as zf:
            zf.extractall(dst)
        print(f"Extracted and installed mod into: {dst}")
    else:
        print(f"Error: '{src}' is neither a folder nor a zip archive.")
        return 1

    return 0


def cmd_info(args):
    mods = {m["id"]: m for m in get_mods()}
    mod_id = args.mod_id
    if mod_id not in mods:
        print(f"Error: Mod '{mod_id}' not found.")
        return 1

    m = mods[mod_id]
    print("=" * 60)
    print(f" Mod: {m['name']} ({m['id']})")
    print("=" * 60)
    print(f" Status:      {'ENABLED' if m['enabled'] else 'DISABLED'}")
    print(f" Version:     {m.get('version', '1.0')}")
    print(f" Author:      {m.get('author', 'Unknown')}")
    print(f" Category:    {m.get('category', 'General')}")
    print(f" Priority:    {m.get('priority', 50)}")
    print(f" Directory:   {m['path']}")
    print(f" Description: {m.get('description', '')}")
    print("=" * 60)
    return 0


def main():
    p = argparse.ArgumentParser(description="Leonidas ViceCityStories (LVCS) Mod Management Utility")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("list", help="List installed mods")

    p_en = sub.add_parser("enable", help="Enable a mod")
    p_en.add_argument("mod_id", help="ID of the mod")

    p_dis = sub.add_parser("disable", help="Disable a mod")
    p_dis.add_argument("mod_id", help="ID of the mod")

    p_pre = sub.add_parser("preset", help="Apply a mod preset")
    p_pre.add_argument("preset", choices=["hd", "ps2", "remake", "authentic"], help="Preset name")

    p_ins = sub.add_parser("install", help="Install a mod from folder or zip")
    p_ins.add_argument("path", help="Folder or .zip archive to install")

    p_inf = sub.add_parser("info", help="Detailed info on a mod")
    p_inf.add_argument("mod_id", help="ID of the mod")

    args = p.parse_args()

    dispatch = {
        "list": cmd_list,
        "enable": cmd_enable,
        "disable": cmd_disable,
        "preset": cmd_preset,
        "install": cmd_install,
        "info": cmd_info,
    }

    ret = dispatch[args.cmd](args)
    sys.exit(ret or 0)


if __name__ == "__main__":
    main()
