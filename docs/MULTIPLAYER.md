# Leonidas Vice City Stories — Mode Multijoueur & Éditeur de Personnage (LVCS-MP)

Le mode **Multijoueur Leonidas (LVCS-MP)** intègre un environnement réseau local et en ligne directement au sein du **Launcher PC C++**, avec un éditeur de personnage complet, un système de sauvegardes multijoueur indépendantes et un outil développeur pour lancer et tester simultanément deux sessions de jeu.

---

## 🌟 Fonctionnalités Implémentées

### 1. 🎨 Éditeur de Personnage Intégré au Launcher C++
Accessible directement depuis la barre de titre (`Multiplayer`) ou via le bouton **`Multijoueur [ONLINE]`** de l'écran d'accueil :
- **Aperçu visuel dynamique en direct (Live Canvas Preview)** : portrait animé avec aura rétro synthwave 80s aux couleurs de Vice City (rose néon et cyan).
- **Genre / Sexe** : Homme (`Male`) / Femme (`Female`).
- **Teint de peau** :
  - Clair (`Fair`)
  - Bronzé / Hâlé (`Tanned / Sun-kissed`)
  - Métis / Olive (`Olive`)
  - Ébène (`Deep / Dark`)
- **Coupe de cheveux (6 styles par genre)** :
  - **Homme** : Pompadour 80s, Dégradé Miami, Afro Volumineux, Gominés Arrière, Coupe Fade, Crâne Rasé.
  - **Femme** : Queue de Cheval Haute, Carré Rétro 80s, Ondulé Mi-Long, Permanente Volume, Cheveux Lisses, Nattes Miami.
- **Teinte de cheveux (7 coloris)** : Noir Corbeau, Brun Foncé, Blond Platine, Roux Flamboyant, Rose Néon, Cyan Vice City, Blanc Argenté.
- **Hauts & Tenues (6 styles 80s)** : Chemise Hawaïenne Fleurie, Costume Pastel 80s (style Crockett), Blouson Cuir Rétro, Débardeur Muscle Beach, Survêtement Veloce, Veste Denim Vintage.
- **Couleurs de Tenue** : Rose Pastel, Cyan Océan, Blanc Pur, Noir Nuit, Pourpre Synthwave, Or Solaire.
- **Bas / Pantalons** : Pantalon Lin Blanc, Jean Délavé 80s, Bermuda Ocean Beach, Pantalon Cuir Noir.
- **Accessoires Emblématiques** :
  - Lunettes Aviator Rétro (verres sombres et reflets cyan/blanc).
  - Chaîne en Or Massif avec médaillon brillant.
  - Bandana Synthwave.
  - Gants de Conduite en cuir.
- **Sauvegarde du Personnage** : bouton dédié `Sauvegarder le Personnage` exportant instantanément le profil dans `build/multiplayer/multiplayer_profile.json`.

---

### 2. 💾 Système de Sauvegardes Dédiées Multijoueur
Pour garantir l'intégrité de vos parties, les données du mode multijoueur sont **strictement isolées** des sauvegardes du mode histoire solo (`mc0/`) :
- **Dossier indépendant** : `build/multiplayer/saves/`
- **Slots de sauvegarde** : `MP_SLOT_01.json`, `MP_SLOT_02.json`, `MP_SLOT_03.json`, etc.
- **Données sauvegardées** : Nom du joueur, apparence complète (genre, teint, cheveux, tenue, accessoires), solde bancaire ($), réputation (RP), rôle réseau et date de sauvegarde.
- **Boutons de gestion** :
  - `Charger` : charge instantanément un profil existant.
  - `Sauvegarder` : met à jour le slot sélectionné.
  - `Nouveau Slot MP` : crée automatiquement un nouvel emplacement de sauvegarde indépendant.

---

### 3. 🛠️ Outil Développeur : Test Multijoueur Double Session
Un banc d'essai complet pour tester le gameplay réseau et la synchronisation multijoueur en local :
- **Principe** :
  - **Session 1 (Hôte / Serveur Local)** : port `7777`, positionnée sur la moitié gauche de l'écran (`LVCS_WINDOW_X=50`), mémoire carte isolée dans `build/multiplayer/session1/`.
  - **Session 2 (Client 2 Connecté)** : se connecte automatiquement à `127.0.0.1:7777`, positionnée sur la moitié droite de l'écran (`LVCS_WINDOW_X=980`), mémoire carte isolée dans `build/multiplayer/session2/`.
- **Relais Réseau Local (`tools/multiplayer_relay.py`)** :
  - Serveur UDP boucle locale ultra-rapide (latence < 1ms).
  - Synchronise les paquets de position des joueurs, orientation, véhicules, armes et tchat.
- **Boutons Développeur dans le Launcher** :
  - **`▶ Lancer 2 Sessions (Host & Client)`** : prépare les profils et démarre les deux instances côte à côte.
  - **`⏹ Arrêter les Sessions de Test`** : stoppe proprement les processus et le serveur relais.
  - **`⚡ Tester Relais (Ping 7777)`** : valide instantanément la connectivité loopback avec mesure de latence en temps réel.

---

## 🚀 Commandes Ligne de Commande Utiles

```bash
# Vérifier le statut du relais multijoueur local
python3 tools/multiplayer_relay.py --status

# Tester la latence réseau (Ping UDP loopback)
python3 tools/multiplayer_relay.py --ping

# Lancer la configuration double session directement en CLI
python3 tools/multiplayer_relay.py --launch-dual

# Stopper le relais réseau
python3 tools/multiplayer_relay.py --stop
```
