# Leonidas ViceCityStories (LVCS) - Version Android & Launcher APK

Ce guide explique le fonctionnement du portage Android de **Leonidas Vice City Stories**, son lanceur APK dédié, et son contrôleur tactile sur l'écran.

---

## 📱 Fonctionnalités de la version Android

1. **Lanceur Android Dédié (`LeonidasLauncher.apk`)** :
   - Interface aux couleurs néon / synthwave de Leonidas Vice City.
   - Logo officiel du crocodile **Macca sans fond** en icône d'application et dans le lanceur.
   - Sélecteur de ROM / ISO intégré (Storage Access Framework) compatible avec tout stockage interne ou carte SD.
   - Mémorisation automatique de la dernière ROM sélectionnée.
   - Bouton **"LANCER LE JEU"** en un clic.

2. **Mode Manette Tactile sur l'écran (`TouchControllerView`)** :
   - **Joystick analogique virtuel gauche** : base flottante réactive, suivi de vecteur d'orientation fluide avec zone morte automatique.
   - **Croix directionnelle (D-Pad)** : touches directionnelles haut, bas, gauche, droite.
   - **Boutons d'action PlayStation** :
     - $\times$ (Croix) : Accélérer / Sprinter
     - $\square$ (Carré) : Freiner / Reculer / Sauter
     - $\triangle$ (Triangle) : Entrer / Sortir d'un véhicule
     - $\bigcirc$ (Rond) : Attaquer / Tirer / Frein à main
   - **Gâchettes supérieures** : $L_1, R_1, L_2, R_2$ (Visée libre, Verrouillage cible, Changement d'armes).
   - **Boutons Système** : START (Pause / Carte), SELECT (Changement de vue caméra).
   - **Retour haptique** : vibration physique à chaque appui sur les boutons.
   - **Transparence réglable** : réglage de l'opacité (de 10 % à 100 %) pour ne pas masquer l'action du jeu.
   - Prise en charge des manettes physiques externes (Bluetooth / USB) : les contrôles tactiles s'estompent automatiquement.

3. **Moteur Graphique & HD Remake Mobile** :
   - Rendu Vulkan / OpenGL ES 3.2.
   - Prise en charge du format large natif 16:9 / 20:9 pour smartphones.
   - Mode 60 FPS fluide.
   - Preset HD Remake mobile activé par défaut.

---

## 🛠️ Compilation & Packaging de l'APK

### Méthode 1 : Via l'outil intégré
```bash
python3 tools/build_android.py --out LeonidasLauncher.apk
```

### Méthode 2 : Via Android Studio / Gradle
1. Ouvrez le dossier `android/` dans **Android Studio**.
2. Branchez votre smartphone Android en mode débogage USB.
3. Cliquez sur **Run** ou compilez le paquet :
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   L'APK généré se trouvera dans `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🚀 Installation & Utilisation sur Android

1. Copiez `LeonidasLauncher.apk` sur votre téléphone et installez-le.
2. Démarrez l'application **Leonidas Vice City**.
3. Touchez **"Choisir la ROM (ISO)"** et sélectionnez votre image disque de *Grand Theft Auto: Vice City Stories* (format `.iso`).
4. Cliquez sur **"LANCER LE JEU"** : le jeu démarre en plein écran avec la manette tactile prête à l'emploi !
