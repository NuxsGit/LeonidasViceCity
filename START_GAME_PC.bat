@echo off
title Leonidas Vice City Stories - PC HD Remake Edition
echo ========================================================
echo  Leonidas Vice City Stories (LVCS) - PC HD Remake Edition
echo  Version: 0.4.6 | Remastered Visuals & HD Textures
echo ========================================================
echo.

if "%~1"=="" (
    set /p ISO_PATH="Glissez-deposez votre fichier ISO GTA Vice City Stories ici puis appuyez sur Entree : "
) else (
    set ISO_PATH=%1
)

if not exist "%ISO_PATH%" (
    echo [ERREUR] Le fichier ISO specifie est introuvable : %ISO_PATH%
    pause
    exit /b 1
)

echo [LVCS] Lancement du jeu en mode HD Remake 4K / Anisotropic 16x...
python tools\run.py "%ISO_PATH%"
pause
