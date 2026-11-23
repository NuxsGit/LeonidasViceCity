# Leonidas ViceCityStories (LVCS) - Version Android, Recompilateur ARM64 & HUD TouchPort

Ce guide explique l'architecture et le fonctionnement du portage Android de **Leonidas Vice City Stories**, son **recompilateur ARM64 natif**, son **HUD tactile inspiré de TouchPort**, et son lanceur APK dédié.

---

## ⚡ Recompilateur ARM64 Android (AArch64)

Le portage mobile Leonidas repose sur la recompilation statique du binaire MIPS R5900 (Emotion Engine) de la PlayStation 2 vers du code C++20 hautement optimisé pour l'architecture **ARM64 (aarch64 / arm64-v8a)** :

1. **Pipeline de recompilation** :
   - Extraction de l'exécutable MIPS ELF `SLUS_215.90` depuis l'image disque `.iso`.
   - Recompilation des fonctions EE vers du code C++ natif (`generated/ee/`).
   - Recompilation des micro-programmes VU1 (Vector Unit 1) vers du code C++ optimisé (`generated/vu1/vu1_compiled.cpp`).
   - Compilation avec le NDK Clang ciblant `-march=armv8-a+fp+simd`.

2. **Traduction Vectorielle SIMD (NEON)** :
   - Les registres 128-bit de l'Emotion Engine et les calculs matriciels du VU1 sont convertis directement en instructions vectorielles **ARM NEON** grâce à `third_party/sse2neon`.
   - Précision arithmétique garantie avec `SSE2NEON_PRECISE_MINMAX=1`, `SSE2NEON_PRECISE_DIV=1` et `SSE2NEON_PRECISE_SQRT=1` pour éliminer tout bug de géométrie ou de physique sur GPU mobile.

3. **Système de Fichiers & Accès Disque Sans Copie (`openFd`)** :
   - Prise en charge native du Storage Access Framework (SAF) d'Android.
   - `vcs::IsoImage::openFd(int fd)` permet de mapper directement l'ISO en mémoire virtuelle via `mmap` sans duplication de fichier.
   - Accès instantané aux flux audio VAG et secteurs de textures du jeu.

4. **Pont d'Entrée Tactile JNI (`ps2_android_runtime`)** :
   - Connexion directe sans latence entre la surface tactile Java/Kotlin et le backend manette DualShock 2 (`PSPadBackend::readState`).
   - `vcs::android::setPadState` et `getAndroidPadState` transmettent les 16 boutons et les axes analogiques avec une fréquence de rafraîchissement calée sur le taux d'affichage de l'écran (60 Hz / 120 Hz).

---

## 🕹️ HUD Tactile Mobile Inspiré de TouchPort

Inspiré des travaux d'ergonomie mobile de **TouchPort (v1.0.0)**, l'interface en jeu propose des contrôles tactiles fluides :

1. **Joystick Virtuel Flottant (`Floating Joystick`)** :
   - Le joystick apparaît dynamiquement là où le pouce gauche touche l'écran.
   - Zone morte radiale de 12 % pour éviter les micro-dérives.
   - **Auto-Sprint automatique** : lorsque le joystick est poussé à plus de 80-85 % vers l'avant, la touche de sprint ($\times$) s'enclenche automatiquement pour une navigation fluide sans fatigue du pouce.

2. **Visée par Glissement (`Drag-to-Aim`)** :
   - La moitié droite de l'écran permet d'orienter la caméra et de viser librement par simple glissement du doigt, exactement comme dans les TPS mobiles modernes.
   - Ajustement de la sensibilité de visée en temps réel.

3. **Boutons PlayStation Distinctifs & Design Épuré** :
   - Disques translucides avec lueur d'activation et anneau néon.
   - Touches d'action PlayStation :
     - $\triangle$ (Triangle - Vert `#00e676`) : Entrer / Sortir d'un véhicule
     - $\square$ (Carré - Rose `#ff1493`) : Sauter / Frein à main
     - $\bigcirc$ (Rond - Rouge `#ff3d00`) : Tirer / Frapper
     - $\times$ (Croix - Bleu `#00f0ff`) : Sprint / Accélération
     - $L_1 / L_2$ : Visée verrouillée / Arme précédente
     - $R_1 / R_2$ : Tir / Arme suivante
     - START / SELECT : Pause, carte radar, changement de caméra

4. **Menu de Configuration en Jeu (Bouton ⚙️ HUD)** :
   - Accès instantané aux réglages sans quitter la partie.
   - Réglage de l'opacité (35 %, 55 %, 75 %, 100 %).
   - Bascule Joystick Flottant ou Fixe.
   - Taille des boutons (Normal ou Grand).
   - Activation ou désactivation du retour haptique vibrant.

---

## 📱 Lanceur Dédié & Gestionnaire de ROMs

- Interface aux couleurs néon / synthwave de Leonidas Vice City.
- Logo officiel du crocodile **Macca sans fond** en icône d'application.
- Détection et sélection d'ISO automatique ou saisie personnalisée de chemin.
- Cartes mémoires PS2 virtuelles (8 MB) automatiquement montées dans le stockage applicatif.

---

## 🛠️ Compilation & Packaging de l'APK

### Compilation du Recompilateur & Packaging de l'APK :
```bash
python3 tools/build_android.py --out LeonidasLauncher.apk
```
Options disponibles :
- `--out <fichier.apk>` : spécifie l'emplacement de l'APK généré.
- `--recompile [ISO]` : extrait et recompile le binaire MIPS ELF depuis l'image disque.
- `--debug` : package en mode debug avec symboles JNI.

### Compilation avec Android Studio / NDK :
1. Ouvrez le dossier `android/` dans **Android Studio**.
2. Compilez le projet avec Gradle et le NDK (`arm64-v8a`).
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   L'APK produit est situé dans `android/app/build/outputs/apk/debug/app-debug.apk`.
