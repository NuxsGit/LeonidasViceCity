@echo off
setlocal
title Leonidas Vice City Stories - Mise a Jour 1-Clic
echo ========================================================
echo  Leonidas Vice City Stories (LVCS) - Mise a Jour 1-Clic
echo ========================================================
echo.
python tools\one_click_update.py
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERREUR] La mise a jour a rencontre un probleme.
    pause
    exit /b %ERRORLEVEL%
)
pause
