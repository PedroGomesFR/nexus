@echo off
title NEXUS - veille tech
cd /d "%~dp0"

set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY (
  where python >nul 2>nul && set "PY=python"
)
if not defined PY (
  echo.
  echo   Python est introuvable.
  echo   Installez-le depuis https://www.python.org/downloads/  ^(cochez "Add to PATH"^)
  echo   ou ouvrez simplement index.html : mode direct, moins de sources.
  echo.
  pause
  exit /b 1
)

%PY% serveur.py %*
pause
