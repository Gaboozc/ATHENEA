# ATHENEA APK Build Guide

## Opción 1: Descarga Automática (GitHub Actions - RECOMENDADO ⭐)

El APK se compila **automáticamente en la nube** cuando hagas push a la rama `main`.

### Pasos:
1. Asegúrate de estar en la rama `main`
   ```bash
   git checkout main
   ```

2. Commit y push tus cambios
   ```bash
   git add -A
   git commit -m "tu mensaje"
   git push origin main
   ```

3. Ve a **GitHub → Actions** en tu repositorio
4. Espera a que termine el workflow "Build APK" (2-5 minutos)
5. En la sección **Artifacts**, descarga `ATHENEA-APK`
6. También encontrarás el APK en **Releases**

**Instalación en Android:**
```bash
# Conecta tu teléfono USB con depuración habilitada
adb install path/to/ATHENEA-release.apk
```

---

## Opción 2: Compilación Local (Requiere Java + Android SDK)

### Requisitos:
- **Java JDK 17+** (descargar desde https://adoptium.net/)
- **Android SDK** (instalar via Android Studio)
- **Node.js 18+** (ya instalado)

### Pasos:

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Compilar la app web**
   ```bash
   npm run build
   ```

3. **Sincronizar con Capacitor**
   ```bash
   npx cap sync android
   ```

4. **Compilar APK**
   ```bash
   cd android
   ./gradlew assembleRelease  # En Mac/Linux
   # o en Windows:
   gradlew.bat assembleRelease
   ```

5. **APK generado en:**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

6. **Instalar en tu teléfono**
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

---

## Habilitación de Depuración USB en Android

1. Abre **Configuración** → **Acerca de**
2. Toca **Número de compilación** 7 veces
3. Regresa a **Configuración** → **Opciones de desarrollador**
4. Activa **Depuración por USB**
5. Conecta por USB a tu PC

---

## Características de la APK

✅ **Offline-First**: Todo funciona sin internet (localStorage)
✅ **Proyectos**: Crear, editar, eliminar proyectos
✅ **Tareas**: Gestión completa de tareas personales
✅ **Dashboard**: Vista general con widgets
✅ **Notas**: Sistema de notas con markdown
✅ **Idioma**: Toggle EN/ES en la app
✅ **Responsive**: Funciona perfecto en pantalla táctil

---

## Solución de Problemas

### Error: "adb: command not found"
Asegúrate de instalar Android SDK Platform Tools:
- Descargar desde https://developer.android.com/studio/releases/platform-tools
- Agregar a PATH de Windows

### Error: "Java not found"
- Instalar JDK desde https://adoptium.net/
- Verificar: `java -version`

### APK no se instala
- Habilita "Fuentes desconocidas" en tu Android
- O instala como app de prueba: `adb install -r app.apk`

---

## Estadísticas de la Build

- **Tamaño**: ~3.5 MB (app + assets)
- **Versión**: 1.0.0
- **Compilación**: ~2-5 minutos (local o cloud)
- **Bytes del JavaScript**: ~885 KB (minificado)
- **CSS**: ~110 KB
- **Imagen**: Logo incluido (1.7 MB)

---

## Desarrollo Futuro

Para actualizar el APK:

```bash
# Hacer cambios en el código
git add -A
git commit -m "Nueva feature"
git push origin main

# El APK se compila automáticamente en GitHub Actions
# Descarga desde Actions o Releases
```

---

**¡Tu app ATHENEA está lista para Android! 🎉**
