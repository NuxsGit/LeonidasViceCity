#!/usr/bin/env bash
set -e

echo "========================================================"
echo " Leonidas Vice City Stories (LVCS) - PC HD Remake Edition"
echo " Version: 0.4.6 | Remastered Visuals & HD Textures"
echo "========================================================"
echo ""

ISO_PATH="$1"
if [ -z "$ISO_PATH" ]; then
    read -rp "Entrez le chemin vers votre ISO GTA Vice City Stories : " ISO_PATH
fi

if [ ! -f "$ISO_PATH" ]; then
    echo "[ERREUR] Le fichier ISO spécifié est introuvable : $ISO_PATH"
    exit 1
fi

echo "[LVCS] Vérification et préparation du jeu..."
python3 tools/build.py --recompile-if-needed "$ISO_PATH"

echo ""
echo "[LVCS] Lancement du jeu en mode HD Remake 4K / Anisotropic 16x..."
python3 tools/run.py 0 run --iso "$ISO_PATH"
