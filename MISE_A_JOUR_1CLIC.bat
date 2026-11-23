@echo off
setlocal
title Leonidas Vice City Stories - Mise a Jour
echo ========================================================
echo  Leonidas Vice City Stories (LVCS) - Mise a Jour
echo ========================================================
echo.
if exist "python\python.exe" (
    "python\python.exe" tools\update.py apply
) else (
    python tools\update.py apply
)
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERREUR] La mise a jour a rencontre un probleme.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [LVCS] Mise a jour terminee avec succes.
pause
