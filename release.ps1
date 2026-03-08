# 🚀 Script de Release Rápido para Athenea

param(
    [Parameter(Mandatory=$false)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [string]$Message = "Release version",
    
    [Parameter(Mandatory=$false)]
    [switch]$Debug
)

Write-Host "🚀 ATHENEA Release Helper" -ForegroundColor Cyan
Write-Host "===========================`n" -ForegroundColor Cyan

# Si no se especifica versión, preguntar
if (-not $Version) {
    $Version = Read-Host "Ingresa la versión (ej: 1.0.0)"
}

# Validar formato de versión
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Host "❌ Error: Versión debe ser formato X.Y.Z (ej: 1.0.0)" -ForegroundColor Red
    exit 1
}

$Tag = "v$Version"

Write-Host "📦 Preparando release:" -ForegroundColor Yellow
Write-Host "   Versión: $Tag"
Write-Host "   Mensaje: $Message`n"

# Confirmar
$Confirm = Read-Host "¿Continuar? (y/n)"
if ($Confirm -ne 'y') {
    Write-Host "❌ Cancelado" -ForegroundColor Red
    exit 0
}

Write-Host "`n🔄 Proceso iniciado...`n" -ForegroundColor Green

# 1. Verificar git status
Write-Host "1️⃣ Verificando estado de Git..." -ForegroundColor Cyan
$Status = git status --porcelain
if ($Status) {
    Write-Host "⚠️ Hay cambios sin commit:" -ForegroundColor Yellow
    git status --short
    
    $CommitNow = Read-Host "`n¿Hacer commit ahora? (y/n)"
    if ($CommitNow -eq 'y') {
        git add .
        git commit -m "$Message $Tag"
        Write-Host "✅ Commit realizado" -ForegroundColor Green
    } else {
        Write-Host "❌ Debes hacer commit primero" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Working tree limpio" -ForegroundColor Green
}

# 2. Push a rama actual
Write-Host "`n2️⃣ Haciendo push a rama actual..." -ForegroundColor Cyan
$CurrentBranch = git rev-parse --abbrev-ref HEAD
git push origin $CurrentBranch
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push exitoso a $CurrentBranch" -ForegroundColor Green
} else {
    Write-Host "❌ Error en push" -ForegroundColor Red
    exit 1
}

# 3. Crear y push tag (solo si no es debug)
if (-not $Debug) {
    Write-Host "`n3️⃣ Creando tag $Tag..." -ForegroundColor Cyan
    
    # Verificar si el tag ya existe
    $ExistingTag = git tag -l $Tag
    if ($ExistingTag) {
        Write-Host "⚠️ El tag $Tag ya existe" -ForegroundColor Yellow
        $Overwrite = Read-Host "¿Sobrescribir? (y/n)"
        if ($Overwrite -eq 'y') {
            git tag -d $Tag
            git push origin --delete $Tag 2>$null
            Write-Host "✅ Tag anterior eliminado" -ForegroundColor Green
        } else {
            Write-Host "❌ Cancelado" -ForegroundColor Red
            exit 1
        }
    }
    
    git tag -a $Tag -m "$Message $Tag"
    git push origin $Tag
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tag $Tag creado y pusheado" -ForegroundColor Green
    } else {
        Write-Host "❌ Error creando tag" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`n3️⃣ Modo Debug - No se crea tag" -ForegroundColor Yellow
}

# 4. Información final
Write-Host "`n✨ ¡Proceso completado! ✨`n" -ForegroundColor Green

if (-not $Debug) {
    Write-Host "GitHub Actions está compilando la APK..." -ForegroundColor Cyan
    Write-Host "`n📱 Para descargar la APK:" -ForegroundColor Yellow
    Write-Host "   1. Ve a: https://github.com/TU_USUARIO/TU_REPO/actions"
    Write-Host "   2. Espera 5-10 minutos"
    Write-Host "   3. Descarga desde Artifacts o Releases"
    Write-Host "`n🔗 O directamente: https://github.com/TU_USUARIO/TU_REPO/releases/tag/$Tag`n"
} else {
    Write-Host "APK Debug se compilará automáticamente en GitHub Actions" -ForegroundColor Cyan
    Write-Host "Descárgala desde: https://github.com/TU_USUARIO/TU_REPO/actions`n"
}

Write-Host "⏱️ Tiempo estimado de compilación: 5-10 minutos`n" -ForegroundColor Gray
