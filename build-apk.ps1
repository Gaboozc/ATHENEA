# ==============================================================================
# ATHENEA — Release APK Builder (Windows PowerShell)
# ==============================================================================
# Uso: .\build-apk.ps1
# Requiere: Java JDK 17+, Android SDK, keytool en PATH
# ==============================================================================

param(
    [string]$KeystorePassword = $env:KEYSTORE_PASSWORD,
    [string]$KeyAlias         = $env:KEY_ALIAS,
    [string]$KeyPassword      = $env:KEY_PASSWORD
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ATHENEA — Release Build" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── 1. Verificar keystore ──────────────────────────────────────────────────────
$KeystorePath = Join-Path $ScriptDir "android\app\keystore.jks"

if (-not (Test-Path $KeystorePath)) {
    Write-Host "⚠  keystore.jks no encontrado en android/app/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Generando keystore nuevo..." -ForegroundColor Cyan
    Write-Host "(Se te pedirán datos: nombre, organización, ciudad, país, y contraseña)" -ForegroundColor Gray
    Write-Host ""

    $alias = if ($KeyAlias) { $KeyAlias } else { "athenea" }

    & keytool -genkey -v `
        -keystore $KeystorePath `
        -keyAlias $alias `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000

    if (-not (Test-Path $KeystorePath)) {
        Write-Host "✗ Error: no se pudo generar el keystore." -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "✓ Keystore generado en android/app/keystore.jks" -ForegroundColor Green
    Write-Host ""
    Write-Host "  GUARDA LAS CONTRASEÑAS EN UN LUGAR SEGURO." -ForegroundColor Yellow
    Write-Host "  Sin ellas NO puedes actualizar la app en el futuro." -ForegroundColor Yellow
    Write-Host ""
}

# ── 2. Pedir contraseñas si no están en env ────────────────────────────────────
if (-not $KeystorePassword) {
    $KeystorePassword = Read-Host "KEYSTORE_PASSWORD (contraseña del keystore)"
}
if (-not $KeyAlias) {
    $KeyAlias = Read-Host "KEY_ALIAS (alias del key, default: athenea)"
    if (-not $KeyAlias) { $KeyAlias = "athenea" }
}
if (-not $KeyPassword) {
    $KeyPassword = Read-Host "KEY_PASSWORD (contraseña del key, puede ser igual al keystore)"
}

$env:KEYSTORE_PASSWORD = $KeystorePassword
$env:KEY_ALIAS         = $KeyAlias
$env:KEY_PASSWORD      = $KeyPassword

# ── 3. Build web ───────────────────────────────────────────────────────────────
Write-Host "▶ npm run build..." -ForegroundColor Cyan
Set-Location $ScriptDir
& npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "✗ Build web fallido" -ForegroundColor Red; exit 1 }

# ── 4. Capacitor sync ──────────────────────────────────────────────────────────
Write-Host "▶ npx cap sync android..." -ForegroundColor Cyan
& npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Host "✗ cap sync fallido" -ForegroundColor Red; exit 1 }

# ── 5. Gradle release ─────────────────────────────────────────────────────────
Write-Host "▶ Compilando APK de release..." -ForegroundColor Cyan
Set-Location (Join-Path $ScriptDir "android")
& .\gradlew.bat assembleRelease
if ($LASTEXITCODE -ne 0) { Write-Host "✗ Gradle build fallido" -ForegroundColor Red; exit 1 }

# ── 6. Resultado ───────────────────────────────────────────────────────────────
$ApkPath = Join-Path $ScriptDir "android\app\build\outputs\apk\release\app-release.apk"

Write-Host ""
Write-Host "══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✓ APK generado exitosamente" -ForegroundColor Green
Write-Host "══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Ubicación: $ApkPath" -ForegroundColor White
Write-Host ""
Write-Host "  Instalar en dispositivo conectado:" -ForegroundColor Gray
Write-Host "    adb install -r `"$ApkPath`"" -ForegroundColor Gray
Write-Host ""
