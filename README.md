# Leonidas ViceCityStories (LVCS) — GTA: Vice City Stories Native Recompiler & HD Remake Engine

<p align="center">
  <img src="launcher/launcher.png" alt="Leonidas ViceCityStories (LVCS) Logo" width="220" />
</p>

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-0.4.7-blueviolet.svg)](docs/releases/v0.4.7.md)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS%20%7C%20Android-brightgreen.svg)]()
[![Graphics](https://img.shields.io/badge/Renderer-Direct3D%2011%20%7C%20Vulkan%20%7C%20Metal%20%7C%20GLES-orange.svg)]()

**Leonidas ViceCityStories (LVCS)** est un portage natif sur PC (Windows, Linux, macOS) et **Android** de **Grand Theft Auto: Vice City Stories** (PS2, USA, SLUS-21590), utilisant la recompilation statique d'exécutable PS2 vers C++ natif, équipé d'un **moteur de mods complet (VFS)** et d'un **preset HD Remake intégré par défaut**.

Ce projet permet de redécouvrir Vice City Stories avec des graphismes modernes en haute définition (résolution interne 4K, 60+ FPS débloqué, shaders néon rétro-futuristes des années 80, distance d'affichage x3, trafic dense), un lanceur Android dédié (`LeonidasLauncher.apk`) avec sélecteur de ROM et manette tactile complète sur l'écran, et d'installer ou créer des mods par simple glisser-déposer.

---

## 🌟 Points Forts & Fonctionnalités Clés

### 1. 🎮 Recompilation Statique Native
- Le code MIPS de la PS2 est recompilé directement en C++ optimisé (ThinLTO), tournant nativement sur votre processeur et votre carte graphique (Direct3D 11 sous Windows, Vulkan sous Linux, Metal sous macOS).
- **Pas d'émulateur lourd** : performances extrêmes, faible latence d'entrée, temps de chargement quasi-instantanés.

### 2. 🌴 Moteur de Mods Intégré par Défaut (VFS Mod Loader)
- **Système de fichiers virtuel (Virtual File System)** : le jeu intercepte à la volée les requêtes de fichiers du disque virtuel `cdrom0:` et les remplace de manière transparente par vos fichiers moddés sur disque sans jamais corrompre l'ISO.
- **Remplacement de textures HD** : injecte automatiquement des textures haute résolution (PNG / DDS) à la place des textures PS2 d'origine (`mods/*/textures/`).
- **Remplacement d'archives et scripts** : modifiez directement `MAIN.SCM`, les fichiers de configuration de maniabilité (`HANDLING.DAT`), les couleurs (`CARCOLS.DAT`), les modèles (`GTA3PS2.IMG`), l'audio ou les écrans de chargement (`SPLASH/`).
- **Gestionnaire graphique et en ligne de commande** : activez ou désactivez vos mods en un clic depuis l'onglet **Mods** du Launcher ou avec l'outil `tools/modctl.py`.

### 3. ✨ Mode "Vice City HD Remake" (Graphismes & Ambiance)
- **Shaders 80s Neon Wave** : post-processing moderne avec Tone Mapping filmique ACES, bloom lumineux sur les néons et phares de voitures, étalonnage des couleurs pastel et couchers de soleil emblématiques de Vice City.
- **Ultra Haute Définition** : échelle de résolution interne jusqu'à 4K/8K, anticrénelage MSAA 8x, filtrage anisotrope 16x.
- **Widescreen & Ultrawide** : affichage natif 16:9, 21:9 et 32:9 (Hor+) avec interface et radar positionnés sur les bords de l'écran.
- **Fluidité 60 / 120 / 144+ FPS** : moteur physique et scripts recalibrés sur le temps réel pour éliminer les bugs de vitesse de la version 30 FPS console.
- **Distance d'affichage x3 (300%)** : bâtiments détaillés, palmiers et véhicules visibles à perte de vue sans aucun popping.

### 4. 🌐 Mode Multijoueur & Éditeur de Personnage Intégré (LVCS-MP)
- **Éditeur de Personnage dans le Launcher C++** : personnalisation en direct avec rendu visuel dynamique du portrait (sexe, teint de peau, coupe et couleur de cheveux, tenues et hauts rétro 80s, pantalons, lunettes aviator, chaîne en or et accessoires).
- **Sauvegardes Multijoueur Isolées** : les profils et sauvegardes multijoueur sont gérés séparément dans `build/multiplayer/saves/` sans jamais altérer les sauvegardes de la campagne solo (`mc0/`).
- **Outil Développeur Double Session** : lancez en un clic 2 sessions distinctes du jeu (Session 1 Hôte sur port 7777 / Session 2 Client rejoignant 127.0.0.1:7777) synchronisées via le serveur relais loopback local (`tools/multiplayer_relay.py`).
- **Extreme City Life** : densité de trafic et de piétons jusqu'à 300% avec persistance (les véhicules ne disparaissent plus instantanément lorsque vous tournez la caméra).

---

## 📦 Mods Inclus Par Défaut

| Mod | Catégorie | Description |
|---|---|---|
| **Vice City HD Remake Essentials** | *Visuels* | Timecycle amélioré, éclairage vibrant des années 80, météo atmosphérique, particules et pluie HD. |
| **80s Neon Wave Shaders & PostFX** | *Shaders* | Bloom néon rétro, color grading chaud/magenta, courbes de contraste et tonemapping ACES. |
| **HD Widescreen HUD & Radar** | *Interface* | Radar haute définition repositionné pour écrans larges, polices vectorielles nettes et réticules modernes. |
| **Modern PC Controls & QoL** | *Gameplay* | Contrôles caméra à la souris moderne, visée fluide, changement d'arme rapide et saut direct des intros. |
| **Extreme City Life** | *Immersion* | Augmentation massive du trafic et des piétons (jusqu'à 300%) sans disparition intempestive des voitures. |

---

## 🚀 Guide de Démarrage Rapide

### Prérequis
1. **Une image disque ISO** de la version PS2 USA du jeu : `Grand Theft Auto - Vice City Stories (USA).iso` (SLUS-21590).
2. **Python 3** et **Git** installés sur votre ordinateur.

### Option 1 : Via le Launcher Graphique (Le plus simple)

1. Lancez **`VCSLauncher`** (ou compilez-le avec `python tools/build.py --launcher`).
2. Le launcher vous guide à travers les étapes :
   - **Folder** : dossier de compilation.
   - **Disc** : glissez-déposez votre fichier `.iso`.
   - **Build tools** : vérification et installation automatique des compilateurs (clang/llvm-mingw).
   - **Build** : recompilation et optimisation du jeu.
3. Cliquez sur l'onglet **Mods** dans la barre de titre pour activer/désactiver les mods ou appliquer le preset **LVCS HD Remake**.
4. Cliquez sur **Play** !

### Option 2 : En Ligne de Commande (Ligne de commande)

1. Placez votre ISO dans le dossier du projet ou renseignez son chemin :
```bash
python3 tools/vcs_disc.py info "Grand Theft Auto - Vice City Stories (USA).iso"
```

2. Recompilez et construisez le jeu avec les mods :
```bash
# Windows
python tools/build.py --recompile

# Linux / macOS
python3 tools/build.py --recompile
```

3. Lancez le jeu :
```bash
./build/vcs          # Linux / macOS
build\vcs.exe        # Windows
```

### Option 3 : Sur Android (Smartphones & Tablettes)

1. Compilez ou préparez l'APK du lanceur Android :
   ```bash
   python3 tools/build_android.py --out LeonidasLauncher.apk
   ```
   *(Ou ouvrez directement le dossier `android/` avec Android Studio)*
2. Installez **`LeonidasLauncher.apk`** sur votre appareil Android.
3. Ouvrez le lanceur, sélectionnez votre fichier ISO via le sélecteur de ROM intégré.
4. Cliquez sur **"LANCER LE JEU"** : le jeu démarre en plein écran avec la **manette tactile virtuelle** complète (joystick analogique, touches PlayStation, gâchettes $L_1/R_1/L_2/R_2$, vibrations haptiques et opacité réglable) ou votre manette sans fil Bluetooth !
   *(Consultez `docs/ANDROID.md` pour tous les détails).*

---

## 🛠️ Gestionnaire de Mods (`tools/modctl.py`)

Un utilitaire en ligne de commande complet est fourni pour gérer vos mods :

```bash
# Lister tous les mods installés et leur statut
python3 tools/modctl.py list

# Activer ou désactiver un mod
python3 tools/modctl.py enable hd_hud_and_ui
python3 tools/modctl.py disable neon_vice_postfx

# Appliquer le preset HD Remake en un clic
python3 tools/modctl.py preset hd

# Revenir au jeu PS2 original fidèle
python3 tools/modctl.py preset ps2

# Installer un mod depuis un dossier ou une archive .zip
python3 tools/modctl.py install /chemin/vers/mon_mod.zip

# Afficher les informations détaillées d'un mod
python3 tools/modctl.py info hd_remake_essentials
```

---

## 📁 Comment Créer ou Ajouter un Mod

Pour ajouter un mod, créez un nouveau sous-dossier dans le répertoire `mods/` (ex: `mods/mon_super_mod/`) :

1. Ajoutez un fichier `mod.json` décrivant votre mod :
```json
{
  "id": "mon_super_mod",
  "name": "Mon Super Mod",
  "version": "1.0.0",
  "author": "VotreNom",
  "category": "Visuals",
  "description": "Nouvelles textures de routes et véhicules HD pour Vice City.",
  "enabled": true,
  "priority": 75
}
```

2. Déposez vos fichiers modifiés en conservant l'arborescence du disque PS2 :
   - Fichiers de données : `DATA/HANDLING.DAT`, `DATA/CARCOLS.DAT`, `DATA/TIMECYC.DAT`
   - Modèles et géométries : `MODELS/GTA3PS2.IMG`, `MODELS/DEFAULT.IDE`
   - Scripts de missions : `MAIN.SCM`
   - Textures HD : placez vos images PNG dans un dossier `textures/` (ex: `mods/mon_super_mod/textures/radardisc.png`)

Le moteur Virtual File System (VFS) de Leonidas ViceCityStories (LVCS) prend automatiquement le relais lors du lancement !

---

## ⌨️ Raccourcis en Jeu

- **F2** : Menu des paramètres (Presets graphiques, Shaders, Résolution, Contrôles, Mods, Audio).
- **F3** : Affichage des statistiques de performances (FPS, temps de rendu CPU/GPU, mémoire).
- **F5** : Trainer intégré complet (véhicules, armes, téléportation, météo, niveau de recherche).
- **F8** : Capture d'écran HD enregistrée dans le dossier `screenshots/`.
- **Alt + Entrée** : Basculer entre le mode Plein écran et le mode Fenêtré.

---

## 🏗️ Architecture du Projet

| Répertoire | Rôle |
|---|---|
| `src/mods/` | Moteur de modding, Virtual File System (VFS), gestionnaire de textures HD |
| `mods/` | Répertoire des mods intégrés par défaut et des mods communautaires |
| `launcher/` | Launcher natif avec interface graphique, animations et onglet Mods |
| `src/render/` | Moteur de rendu moderne D3D11 / Vulkan / Metal et shaders HD Remake |
| `src/game/` | Overrides du jeu (caméra moderne, densité de trafic, audio natif) |
| `third_party/PS2Recomp` | Recompilateur statique PS2 MIPS vers C++ |
| `tools/` | Scripts Python de recompilation, vérification disque et `modctl.py` |

---

## ⚖️ Licence & Propriété Intellectuelle

- Ce projet est sous licence libre **GPL-3.0** (héritée de PS2Recomp).
- **Aucun code source ni contenu propriétaire de jeu n'est distribué dans ce dépôt.**
- Grand Theft Auto, Vice City Stories et l'ensemble de leurs éléments audiovisuels sont la propriété exclusive de Rockstar Games et Take-Two Interactive. L'utilisateur doit posséder une copie légale de son disque PS2.
