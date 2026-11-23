#!/usr/bin/env python3
"""Leonidas Vice City Stories (LVCS) - PC HD Remake Desktop Launcher
Provides an interactive launcher with Mod Manager, ISO selector, and HD Remake engine settings.
"""

import argparse
import http.server
import json
import os
import socketserver
import subprocess
import sys
import threading
import urllib.parse
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
MODS_DIR = os.path.join(ROOT, "mods")
CONFIG_FILE = os.path.join(MODS_DIR, "mods_config.json")

def load_mods_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"hd_remake_active": True, "mods": {}}

def save_mods_config(cfg):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
    except Exception as e:
        print(f"[Launcher] Error saving config: {e}")

def get_installed_mods():
    mods = []
    if not os.path.isdir(MODS_DIR):
        return mods
    cfg = load_mods_config()
    for entry in sorted(os.listdir(MODS_DIR)):
        entry_path = os.path.join(MODS_DIR, entry)
        if not os.path.isdir(entry_path):
            continue
        meta_file = os.path.join(entry_path, "mod.json")
        if os.path.isfile(meta_file):
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                mod_id = data.get("id", entry)
                enabled = cfg.get("mods", {}).get(mod_id, data.get("enabled", True))
                mods.append({
                    "id": mod_id,
                    "folder": entry,
                    "name": data.get("name", mod_id),
                    "category": data.get("category", "General"),
                    "version": data.get("version", "1.0.0"),
                    "description": data.get("description", ""),
                    "enabled": enabled
                })
            except Exception:
                pass
    return mods

def launch_game(iso_path):
    print(f"\n[LVCS] Launching Leonidas Vice City Stories with ISO: {iso_path}")
    print("[LVCS] Applying HD Remake 4K / Anisotropic 16x / ACES Shaders...")
    
    # Check/Build game
    build_cmd = [sys.executable, os.path.join(ROOT, "tools", "build.py"), "--recompile-if-needed", iso_path]
    res = subprocess.run(build_cmd, cwd=ROOT)
    if res.returncode != 0:
        print("[LVCS] Build or preparation step failed.")
        return res.returncode

    # Run game
    run_cmd = [sys.executable, os.path.join(ROOT, "tools", "run.py"), "0", "run", "--iso", iso_path]
    return subprocess.run(run_cmd, cwd=ROOT).returncode

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Leonidas Vice City Stories — PC HD Remake Launcher</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #0A0A0C;
    color: #F8F4F6;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    min-height: 100vh;
    padding: 24px;
    user-select: none;
  }
  .container { max-width: 980px; margin: 0 auto; }
  .header {
    background: #101014;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  .title-group h1 { font-size: 26px; font-weight: 800; letter-spacing: 0.5px; }
  .title-group h1 span { color: #ED1E79; }
  .title-group p { color: #ADA6AC; font-size: 14px; margin-top: 4px; }
  .badge {
    background: rgba(41, 171, 226, 0.15);
    color: #29ABE2;
    border: 1px solid rgba(41, 171, 226, 0.4);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
  }
  .card {
    background: #101014;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }
  .card h2 { font-size: 18px; margin-bottom: 12px; color: #29ABE2; display: flex; align-items: center; gap: 8px; }
  .iso-input {
    width: 100%;
    padding: 12px 16px;
    background: #17171C;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    color: #F8F4F6;
    font-size: 15px;
    margin-bottom: 12px;
  }
  .iso-input:focus { outline: none; border-color: #ED1E79; }
  .btn-launch {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #ED1E79, #F7931E);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 18px;
    font-weight: 800;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    letter-spacing: 1px;
  }
  .btn-launch:hover { opacity: 0.95; transform: scale(1.01); }
  .btn-launch:active { transform: scale(0.99); }
  .mods-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
    margin-top: 14px;
  }
  .mod-item {
    background: #17171C;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
    padding: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: border-color 0.2s;
  }
  .mod-item.active { border-color: rgba(41, 171, 226, 0.4); }
  .mod-info { max-width: 80%; }
  .mod-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
  .mod-cat { font-size: 11px; color: #ADA6AC; text-transform: uppercase; }
  .switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
  }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider {
    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
    background-color: #2A2A33;
    transition: .3s;
    border-radius: 24px;
  }
  .slider:before {
    position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
    background-color: white;
    transition: .3s;
    border-radius: 50%;
  }
  input:checked + .slider { background-color: #ED1E79; }
  input:checked + .slider:before { transform: translateX(20px); }
  .footer { text-align: center; color: #726B71; font-size: 13px; margin-top: 30px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="title-group">
      <h1>LEONIDAS <span>VICE CITY STORIES</span></h1>
      <p>PC HD Remake Remaster Edition — 4K UHD · 16x Anisotropic · ACES Filmic Shaders</p>
    </div>
    <div class="badge">v0.4.6 PC</div>
  </div>

  <div class="card">
    <h2>Image Disque (ROM / ISO)</h2>
    <input type="text" id="isoPath" class="iso-input" placeholder="Chemin d'accès ou nom du fichier ISO (ex: ViceCityStories.iso)" value="ViceCityStories.iso">
    <button class="btn-launch" onclick="launchGame()">LANCER LE JEU (PC HD REMAKE)</button>
  </div>

  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h2>Gestionnaire de Mods VFS (13 Mods)</h2>
      <span style="font-size: 13px; color: #00E676; font-weight: 600;">PRESET HD REMAKE ACTIF</span>
    </div>
    <div class="mods-grid" id="modsGrid">
      <!-- Injected dynamically -->
    </div>
  </div>

  <div class="footer">
    Leonidas Vice City Stories PC Remaster &copy; 2026 — F2 en jeu pour les paramètres · F3 pour le Trainer
  </div>
</div>

<script>
  let mods = [];

  async function loadMods() {
    try {
      const res = await fetch('/api/mods');
      mods = await res.json();
      renderMods();
    } catch(e) {
      console.error(e);
    }
  }

  function renderMods() {
    const grid = document.getElementById('modsGrid');
    grid.innerHTML = '';
    mods.forEach(mod => {
      const div = document.createElement('div');
      div.className = 'mod-item ' + (mod.enabled ? 'active' : '');
      div.innerHTML = `
        <div class="mod-info">
          <div class="mod-name">${mod.name}</div>
          <div class="mod-cat">${mod.category} · v${mod.version}</div>
        </div>
        <label class="switch">
          <input type="checkbox" ${mod.enabled ? 'checked' : ''} onchange="toggleMod('${mod.id}', this.checked)">
          <span class="slider"></span>
        </label>
      `;
      grid.appendChild(div);
    });
  }

  async function toggleMod(id, enabled) {
    await fetch('/api/toggle?id=' + encodeURIComponent(id) + '&enabled=' + (enabled ? '1' : '0'));
    const m = mods.find(x => x.id === id);
    if (m) m.enabled = enabled;
    renderMods();
  }

  async function launchGame() {
    const iso = document.getElementById('isoPath').value.trim();
    if (!iso) {
      alert("Veuillez entrer le chemin de votre fichier ISO.");
      return;
    }
    alert("Lancement du jeu en cours avec l'ISO : " + iso + "\\nLe terminal exécutera la vérification du build et le jeu démarre !");
    await fetch('/api/launch?iso=' + encodeURIComponent(iso));
  }

  loadMods();
</script>
</body>
</html>
"""

class LauncherHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/" or parsed.path == "/index.html":
            self.send_response(200)
            self.send_header("Content-type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(HTML_TEMPLATE.encode("utf-8"))
        elif parsed.path == "/api/mods":
            mods = get_installed_mods()
            data = json.dumps(mods).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(data)
        elif parsed.path == "/api/toggle":
            qs = urllib.parse.parse_qs(parsed.query)
            mod_id = qs.get("id", [""])[0]
            enabled = qs.get("enabled", ["1"])[0] == "1"
            cfg = load_mods_config()
            cfg.setdefault("mods", {})[mod_id] = enabled
            save_mods_config(cfg)
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
        elif parsed.path == "/api/launch":
            qs = urllib.parse.parse_qs(parsed.query)
            iso = qs.get("iso", [""])[0]
            threading.Thread(target=launch_game, args=(iso,), daemon=True).start()
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"launching"}')
        else:
            self.send_response(404)
            self.end_headers()

def run_web_launcher(port=8080):
    print("=" * 65)
    print(" Leonidas Vice City Stories — PC HD Remake Desktop Launcher")
    print(f" Web Interface active sur : http://localhost:{port}")
    print("=" * 65)
    try:
        webbrowser.open(f"http://localhost:{port}")
    except Exception:
        pass
    with socketserver.TCPServer(("0.0.0.0", port), LauncherHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nArrêt du lanceur.")

def main():
    p = argparse.ArgumentParser(description="Leonidas Vice City Stories PC Launcher")
    p.add_argument("iso", nargs="?", help="Chemin vers le fichier ISO du jeu")
    p.add_argument("--gui", action="store_true", help="Démarrer l'interface web de contrôle")
    p.add_argument("--port", type=int, default=8080, help="Port du serveur de contrôle (défaut: 8080)")
    args = p.parse_args()

    if args.iso and not args.gui:
        sys.exit(launch_game(args.iso))
    else:
        run_web_launcher(args.port)

if __name__ == "__main__":
    main()
