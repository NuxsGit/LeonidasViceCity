# Leonidas Vice City Stories (LVCS) — PC HD Remake Remaster Edition

Bienvenue dans l'édition **PC HD Remake Remaster** de Leonidas Vice City Stories (v0.4.6).

Cette version transforme GTA Vice City Stories en un véritable remaster PC haute fidélité :
- **Fini les pixels et arêtes crénelées** : Rendu interne jusqu'en 4K UHD avec filtrage anisotrope 16x (Anisotropic 16x), anticrénelage MSAA matériel et passe de post-traitement FXAA intégrée.
- **Pack de textures HD retravaillées** : Textures de routes en asphalte haute résolution (`road_asphalt.png`), dalles de trottoirs modernes (`pavement_tiles.png`), sable d'Ocean Beach soyeux (`sand_beach.png`), eau turquoise caribéenne (`water_clear.png`) et végétation anti-aliasing sans effet de grille.
- **Interface & HUD Haute Définition** : Radar vectoriel net au format 16:9 (`radardisc.png`), réticules de visée tactiques (`crosshair.png`), icônes d'action PlayStation haute résolution et typographie Pricedown mise à l'échelle.
- **Atmosphère 80s Neon Wave** : Shaders de tonemapping ACES filmic, bloom néon sur les éclairages nocturnes, reflets de carrosserie panoramiques et distance de vue étendue à 3 200 mètres.
- **Gameplay & Contrôles PC Modernes** : Conduite ZQSD / WASD réactive, visée libre et précise à la souris, physique et timings normalisés pour les écrans 60 Hz à 144 Hz+, balistique recalibrée et trafic urbain quadruplé.

---

## 🎮 Lancement Rapide (Quick Start)

### Prérequis
- Votre image disque originale de **GTA Vice City Stories PS2** (`.iso`).
- Système d'exploitation : Windows 10/11 (64 bits) ou Linux (Ubuntu 22.04+ / Arch / Fedora).
- Carte graphique compatible Vulkan 1.2+ ou DirectX 11/12.

### Lancement avec le Launcher Officiel :
1. Lancez votre **VCSLauncher.exe** (ou `VCSLauncher` sous Linux).
2. Cliquez sur le bouton rose **`▶ Play`** pour démarrer le jeu en mode HD Remake.
3. Accédez aux mods à tout moment via le bouton **Mods** ou la carte **Mods & HD** (13 mods HD Remake pré-activés).

### Lancement direct par script :
- **Sous Windows** : Double-cliquez sur `START_GAME_PC.bat`.
- **Sous Linux** : Lancez `./START_GAME_PC.sh /chemin/vers/vcs.iso`.

---

## ⚡ Mise à Jour en 1-Clic
- **Depuis votre Launcher natif** : Cliquez sur la carte **Updates** en bas à droite, puis cliquez sur **"Update now"**. Le launcher télécharge et applique automatiquement la mise à jour en préservant vos réglages et sauvegardes.
- **En ligne de commande / script** : Double-cliquez sur `MISE_A_JOUR_1CLIC.bat` (ou `./MISE_A_JOUR_1CLIC.sh`).

---

## 🎛️ Gestion des Mods (VFS Mod Loader)
Tous les 13 mods Remake sont préactivés dans `mods/mods_config.json`.
Vous pouvez gérer, activer ou désactiver chaque mod individuellement via la ligne de commande :
```bash
# Lister les mods installés et leur statut
python3 tools/modctl.py list

# Obtenir des informations détaillées sur un mod
python3 tools/modctl.py info hd_textures_overhaul

# Désactiver ou réactiver un mod spécifique
python3 tools/modctl.py disable 05_extreme_city_life
python3 tools/modctl.py enable 05_extreme_city_life
```

---

## ⌨️ Raccourcis Clavier Utiles en Jeu
- **F2** : Ouvrir le menu complet des paramètres (Display, Graphics, Audio, Mods & Remake).
- **F3** : Menu Trainer / Débogage (spawner de véhicules, armes, météo, téléportation).
- **Alt + Entrée** : Basculer entre le mode Plein écran sans bordure et Fenêtré.
- **F11** : Afficher / Masquer le compteur de FPS et les métriques de rendu.
