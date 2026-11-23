@echo off
setlocal
title Leonidas Vice City Stories - Mise a Jour
echo ========================================================
echo  Leonidas Vice City Stories (LVCS) - Mise a Jour
echo ========================================================
echo.
python tools\update.py apply
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERREUR] La mise a jour a rencontre un probleme.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [LVCS] Mise a jour terminee avec succes.
pause
