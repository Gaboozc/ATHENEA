@echo off
setlocal

title ATHENEA - Iniciando...
color 0B

echo.
echo  ==========================================
echo            ATHENEA v1.0
echo     Personal AI Operating System
echo  ==========================================
echo.

REM Verificar si Ollama esta corriendo
tasklist /fi "imagename eq ollama.exe" 2>NUL | find /i "ollama.exe" >NUL
if errorlevel 1 (
  echo  [1/2] Iniciando Ollama...
  start "" "%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
  timeout /t 3 /nobreak >NUL
  echo  [OK] Ollama iniciado
) else (
  echo  [OK] Ollama ya estaba corriendo
)

echo.
echo  [2/2] Iniciando ATHENEA...
cd /d "%~dp0"
start "" npm run electron-dev

echo.
echo  [OK] ATHENEA iniciandose...
echo  (Esta ventana se puede cerrar)
echo.
timeout /t 5 /nobreak >NUL
endlocal
