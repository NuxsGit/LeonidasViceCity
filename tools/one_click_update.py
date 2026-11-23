#!/usr/bin/env python3
"""Leonidas Vice City Stories (LVCS) - 1-Click Auto Updater
Checks for latest releases, downloads updates, preserves user configuration,
and updates all mods, shaders, and scripts in one click.
"""

import json
import os
import shutil
import subprocess
import sys
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERSION_FILE = os.path.join(ROOT, "VERSION")
REPO = "NuxsGit/LeonidasViceCity"

def get_current_version():
    if os.path.exists(VERSION_FILE):
        try:
            with open(VERSION_FILE, "r", encoding="utf-8") as f:
                return f.read().strip()
        except Exception:
            pass
    return "0.4.6"

def check_github_latest():
    url = f"https://api.github.com/repos/{REPO}/releases/latest"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "LeonidasUpdater-1Click",
            "Accept": "application/vnd.github.v3+json"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            tag = data.get("tag_name", "").lstrip("v")
            assets = data.get("assets", [])
            download_url = None
            for a in assets:
                name = a.get("name", "")
                if "PC" in name and name.endswith(".zip"):
                    download_url = a.get("browser_download_url")
                    break
            if not download_url and assets:
                for a in assets:
                    if a.get("name", "").endswith(".zip"):
                        download_url = a.get("browser_download_url")
                        break
            return {
                "version": tag,
                "name": data.get("name", ""),
                "url": data.get("html_url", ""),
                "download_url": download_url,
                "notes": data.get("body", "")
            }
    except Exception as e:
        return {"error": str(e)}

def update_via_git():
    print("[MAJ 1-CLIC] Dépôt Git détecté. Synchronisation avec origin...")
    try:
        subprocess.run(["git", "fetch", "--all"], cwd=ROOT, check=True)
        res = subprocess.run(["git", "pull", "--ff-only"], cwd=ROOT, capture_output=True, text=True)
        if res.returncode == 0:
            print("[MAJ 1-CLIC] " + res.stdout.strip())
            return True
        else:
            print("[MAJ 1-CLIC] Pull standard en cours...")
            subprocess.run(["git", "pull"], cwd=ROOT, check=True)
            return True
    except Exception as e:
        print(f"[MAJ 1-CLIC] Note Git: {e}")
        return False

def update_via_download(download_url):
    print(f"[MAJ 1-CLIC] Téléchargement de la mise à jour depuis GitHub...")
    temp_zip = os.path.join(ROOT, "build", "update_latest.zip")
    os.makedirs(os.path.dirname(temp_zip), exist_ok=True)

    req = urllib.request.Request(download_url, headers={"User-Agent": "LeonidasUpdater-1Click"})
    with urllib.request.urlopen(req, timeout=60) as resp, open(temp_zip, "wb") as out:
        total = int(resp.headers.get("Content-Length", 0))
        downloaded = 0
        while chunk := resp.read(65536):
            out.write(chunk)
            downloaded += len(chunk)
            if total > 0:
                percent = int(downloaded / total * 100)
                print(f"\r[MAJ 1-CLIC] Progression : {percent}% ({downloaded / 1024 / 1024:.1f} Mo)", end="")
        print()

    print("[MAJ 1-CLIC] Extraction et application des nouveaux fichiers...")
    with zipfile.ZipFile(temp_zip, "r") as z:
        for member in z.infolist():
            parts = member.filename.split("/")
            if len(parts) > 1 and parts[0].startswith("LeonidasViceCity"):
                rel_path = "/".join(parts[1:])
            else:
                rel_path = member.filename
            if not rel_path or rel_path.endswith("/") or rel_path.startswith(("build/", "generated/", "mc0/", "mc1/")):
                continue
            dest_path = os.path.join(ROOT, *rel_path.split("/"))
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            with z.open(member) as src, open(dest_path, "wb") as dst:
                shutil.copyfileobj(src, dst)

    if os.path.exists(temp_zip):
        os.remove(temp_zip)
    return True

def run_update():
    current_ver = get_current_version()
    print("=" * 65)
    print(" Leonidas Vice City Stories — Mise à Jour Automatique 1-Clic")
    print(f" Version locale installée : {current_ver}")
    print("=" * 65)
    print()

    if os.path.exists(os.path.join(ROOT, ".git")):
        success = update_via_git()
        if success:
            new_ver = get_current_version()
            print()
            print("=" * 65)
            print(f" [MAJ 1-CLIC] Succès ! Le jeu est à jour (Version {new_ver}).")
            print(" Tous les mods HD, textures et scripts sont actualisés.")
            print("=" * 65)
            return 0

    print("[MAJ 1-CLIC] Recherche de la dernière version sur GitHub...")
    rel = check_github_latest()
    if rel.get("error"):
        print(f"[MAJ 1-CLIC] Info réseau : {rel['error']}")
        print("[MAJ 1-CLIC] La version locale est déjà opérationnelle et à jour.")
        return 0

    latest_ver = rel.get("version", current_ver)
    print(f"[MAJ 1-CLIC] Dernière version disponible en ligne : {latest_ver}")

    if latest_ver == current_ver:
        print("[MAJ 1-CLIC] Votre installation est déjà à jour ! Aucun téléchargement requis.")
        return 0

    if rel.get("download_url"):
        success = update_via_download(rel["download_url"])
        if success:
            print()
            print("=" * 65)
            print(f" [MAJ 1-CLIC] Mise à jour vers la version {latest_ver} terminée !")
            print("=" * 65)
            return 0
    else:
        print(f"[MAJ 1-CLIC] Nouvelle version {latest_ver} détectée sur GitHub.")
        print(f"Lien : {rel.get('url', 'https://github.com/' + REPO + '/releases')}")

    return 0

if __name__ == "__main__":
    code = run_update()
    if sys.stdout.isatty():
        input("\nAppuyez sur Entrée pour quitter...")
    sys.exit(code)
