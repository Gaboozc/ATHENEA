# Script de configuracion de auto-inicio de ATHENEA
# Ejecutar como administrador una sola vez

Write-Host "Configurando auto-inicio de ATHENEA..." -ForegroundColor Cyan

# 1. Auto-inicio de Ollama
$ollamaPath = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"

if (Test-Path $ollamaPath) {
  $regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"

  # Agregar Ollama al inicio de Windows
  Set-ItemProperty -Path $regPath -Name "OllamaATHENEA" -Value "`"$ollamaPath`" serve"

  Write-Host "[OK] Ollama configurado para auto-inicio" -ForegroundColor Green
} else {
  Write-Host "[WARN] Ollama no encontrado en $ollamaPath" -ForegroundColor Yellow
  Write-Host "       Busca ollama.exe en tu sistema y ajusta la ruta" -ForegroundColor Yellow
}

# 2. Variable de entorno OLLAMA_ORIGINS permanente (si no existe)
$existingOrigins = [System.Environment]::GetEnvironmentVariable('OLLAMA_ORIGINS', 'Machine')
if (-not $existingOrigins) {
  [System.Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', '*', 'Machine')
  Write-Host "[OK] OLLAMA_ORIGINS=* configurado" -ForegroundColor Green
}

# 3. Variable OLLAMA_GPU_LAYERS=0 permanente (si no existe)
$existingGPU = [System.Environment]::GetEnvironmentVariable('OLLAMA_GPU_LAYERS', 'Machine')
if (-not $existingGPU) {
  [System.Environment]::SetEnvironmentVariable('OLLAMA_GPU_LAYERS', '0', 'Machine')
  Write-Host "[OK] OLLAMA_GPU_LAYERS=0 configurado" -ForegroundColor Green
}

Write-Host ""
Write-Host "[OK] Configuracion completada." -ForegroundColor Green
Write-Host "     Reinicia la PC para verificar el auto-inicio." -ForegroundColor Cyan
