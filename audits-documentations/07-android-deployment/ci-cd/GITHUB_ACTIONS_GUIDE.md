# 📱 Compilación de APK con GitHub Actions

Este repositorio está configurado para compilar automáticamente APKs de Android usando GitHub Actions.

## 🚀 Workflows Disponibles

### 1. **Build Android APK** (Debug)
- **Trigger**: Push a `main`, `master`, o `develop`
- **Archivo**: `.github/workflows/build-apk.yml`
- **Output**: APK debug sin firmar
- **Uso**: Desarrollo y testing

### 2. **Build Release APK** (Signed)
- **Trigger**: Push de tags (`v*`)
- **Archivo**: `.github/workflows/build-release-apk.yml`
- **Output**: APK firmada para producción
- **Uso**: Releases públicas

---

## 📦 Descargar APK Compiladas

### Opción 1: Desde Actions (Artifacts)

1. Ve a: `https://github.com/TU_USUARIO/TU_REPO/actions`
2. Click en el workflow más reciente (✅ verde)
3. Scroll down a **Artifacts**
4. Download: `athenea-debug-apk.zip`
5. Descomprime para obtener `app-debug.apk`

**Nota**: Los artifacts duran 30 días

### Opción 2: Desde Releases

1. Ve a: `https://github.com/TU_USUARIO/TU_REPO/releases`
2. Click en la versión más reciente
3. Descarga directamente `app-release.apk`

**Nota**: Las releases son permanentes

---

## 🔧 Ejecutar Manualmente

### Build Debug:
1. Ve a **Actions** → **Build Android APK**
2. Click en **Run workflow**
3. Selecciona la rama
4. Click **Run workflow**
5. Espera 5-10 minutos
6. Descarga desde Artifacts

### Build Release (con tag):
```bash
# Crea un tag
git tag v1.0.0

# Push el tag
git push origin v1.0.0

# GitHub Actions compila automáticamente
```

---

## 🔐 Configurar APK Firmada (Release)

Para compilar APKs firmadas necesitas configurar un **keystore** y secrets en GitHub.

### Paso 1: Generar Keystore (solo una vez)

```bash
# En tu máquina local
keytool -genkey -v -keystore athenea-keystore.jks \
  -alias athenea-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Te pedirá:
# - Password del keystore (guárdalo!)
# - Password del key alias (guárdalo!)
# - Nombre, organización, etc.
```

### Paso 2: Convertir Keystore a Base64

```bash
# Windows PowerShell
$bytes = [System.IO.File]::ReadAllBytes("athenea-keystore.jks")
[Convert]::ToBase64String($bytes) | Out-File keystore-base64.txt

# Linux/Mac
base64 athenea-keystore.jks > keystore-base64.txt
```

### Paso 3: Configurar Secrets en GitHub

1. Ve a tu repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Agrega estos 4 secrets:

| Secret Name | Valor |
|-------------|-------|
| `KEYSTORE_BASE64` | Contenido de `keystore-base64.txt` |
| `KEYSTORE_PASSWORD` | Password del keystore |
| `KEY_ALIAS` | `athenea-key` |
| `KEY_PASSWORD` | Password del alias |

### Paso 4: Configurar build.gradle

Edita `android/app/build.gradle`:

```gradle
android {
    ...
    
    signingConfigs {
        release {
            if (System.getenv("KEYSTORE_PASSWORD")) {
                storeFile file('keystore.jks')
                storePassword System.getenv("KEYSTORE_PASSWORD")
                keyAlias System.getenv("KEY_ALIAS")
                keyPassword System.getenv("KEY_PASSWORD")
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## 📊 Tiempo de Compilación

| Tipo | Tiempo Aprox. | Tamaño |
|------|---------------|--------|
| Debug | 5-7 minutos | ~7 MB |
| Release | 6-8 minutos | ~5 MB |

**Factores**:
- Primera compilación: +2 minutos (cache de dependencias)
- Cambios pequeños: -1 minuto (cache reutilizado)

---

## 🐛 Troubleshooting

### Error: "Build failed"
**Solución**: Ve a Actions → Click en el workflow fallido → Revisa logs

### Error: "Keystore not found"
**Solución**: Verifica que `KEYSTORE_BASE64` secret esté configurado correctamente

### Error: "Gradle daemon disappeared"
**Solución**: Ya está configurado con `--no-daemon` en el workflow

### APK muy grande
**Solución**: 
- Usa `assembleRelease` en lugar de `assembleDebug`
- Activa `minifyEnabled true` en build.gradle

---

## 📱 Instalar APK en Dispositivo

### Desde archivo descargado:

**Android:**
1. Descarga APK en tu teléfono
2. Abre el archivo
3. Permite "Instalar desde fuentes desconocidas"
4. Click Instalar

**Desde PC con ADB:**
```bash
adb install app-debug.apk
```

---

## 🔄 Workflow de Desarrollo Completo

### 1. Desarrollo Local
```bash
# Hacer cambios en código
git add .
git commit -m "feat: nueva funcionalidad"
git push origin develop
```

### 2. Testing Automático
- GitHub Actions compila APK debug automáticamente
- Descarga desde Artifacts
- Prueba en dispositivo

### 3. Release
```bash
# Cuando esté listo para release
git checkout main
git merge develop
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

### 4. Publicación
- GitHub Actions compila APK firmada
- Se crea Release automáticamente
- APK disponible en Releases

---

## 🎯 Mejores Prácticas

### Versioning
Usa **Semantic Versioning**:
- `v1.0.0` - Major release
- `v1.1.0` - Nueva funcionalidad
- `v1.1.1` - Bug fix

### Commits
```bash
git commit -m "feat: sistema autónomo de ejecución"    # Nueva feature
git commit -m "fix: corregir bug en audio feedback"    # Bug fix
git commit -m "docs: actualizar README"                # Documentación
```

### Branches
- `main` - Código estable para producción
- `develop` - Desarrollo activo
- `feature/*` - Nuevas funcionalidades

---

## 📝 Checklist Pre-Release

Antes de crear un tag para release:

- [ ] Código testeado localmente
- [ ] APK debug funciona en dispositivo
- [ ] Versión actualizada en `package.json`
- [ ] Changelog actualizado
- [ ] KEYSTORE secrets configurados
- [ ] Build.gradle configurado para firma

---

## 🚀 Próximos Pasos

### Automatización Adicional:
- [ ] Tests automáticos antes de build
- [ ] Deploy a Google Play Store
- [ ] Notificaciones de build en Slack/Discord
- [ ] Build APK por cada PR

---

## 📞 Soporte

Si tienes problemas:
1. Revisa logs en Actions
2. Verifica que todos los secrets estén configurados
3. Prueba compilar localmente primero

---

**¡Listo para compilar APKs en la nube! 🎉**
