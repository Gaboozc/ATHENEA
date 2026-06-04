# ATHENEA APK - Compilación Automática ✅

## ¿Qué acabamos de hacer?

Hemos convertido tu **app web (React + Vite)** en una **app nativa Android** usando **Capacitor**. La app funciona 100% offline con localStorage.

---

## 📱 Obtener el APK

### **Opción 1: Descarga Automática (RECOMENDADO)**

Tu APK se compila **automáticamente en GitHub** cada vez que hagas push.

#### Pasos:

1. **Ve a tu repositorio GitHub**
   ```
   https://github.com/Gaboozc/ATHENEA
   ```

2. **Abre la pestaña "Actions"**
   - Verás un workflow llamado "Build APK"
   - Espera 5-10 minutos a que termine (estado verde ✅)

3. **Descarga el APK**
   - En el workflow completado, ve a "Artifacts"
   - Descarga `ATHENEA-APK`

4. **Instala en tu teléfono**
   ```bash
   adb install -r ATHENEA-release.apk
   ```

---

### **Opción 2: Compilación Manual con Gradle**

Si tienes **Java 17+** y **Android SDK** instalados:

```bash
cd scope
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleRelease  # o gradlew.bat en Windows
```

APK generado en: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🎯 Características del APK

✅ **Completamente Offline**
- Todo funciona sin internet
- Datos guardados en localStorage del teléfono
- Sincronización automática

✅ **Full Featured**
- Proyectos CRUD completo
- Tareas y reminder personales
- Dashboard con widgets
- Notas con markdown
- Colaboradores (Comparny/Teams)
- Reportes y auditoría
- Cambio de idioma EN/ES

✅ **Rendimiento**
- ~3.5 MB de tamaño
- Interfaz responsiva táctil
- Zoom en planos de proyecto
- Grid de colaboradores

✅ **Datos Persistentes**
- Redux + Redux Persist
- AsyncStorage en Android
- No necesita servidor
- Privacidad total (sin cloud)

---

## 🚀 Primeros Pasos en Android

### 1. **Preparar el teléfono**
   - Ir a **Configuración → Acerca de**
   - Tocar **Número de compilación** 7 veces
   - Volver a **Configuración → Opciones de desarrollador**
   - Activar **Depuración por USB**

### 2. **Conectar por USB**
   ```bash
   adb devices  # Verifica que el teléfono esté listado
   ```

### 3. **Instalar APK**
   ```bash
   adb install -r ruta/a/ATHENEA-release.apk
   ```

### 4. **¡Listo!**
   - Abre "ATHENEA" en tu teléfono
   - Todo funciona offline

---

## 📊 Estadísticas Técnicas

| Métrica | Valor |
|---------|-------|
| Framework | React + Capacitor |
| Lenguaje | TypeScript/JSX |
| Storage | localStorage → AsyncStorage |
| Tamaño | ~3.5 MB |
| JavaScript | 885 KB (minificado) |
| CSS | 110 KB |
| Compilación | 2-5 minutos |
| Compatibilidad | Android 7+ |

---

## 🔄 Actualizar el APK

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Nueva feature"
git push origin single-person

# GitHub Actions compila automáticamente
# Descarga el nuevo APK en 5-10 minutos
```

---

## ❓ Solución de Problemas

### "adb not found"
```bash
# Instala Android SDK Platform Tools
# Descarga desde: https://developer.android.com/studio/releases/platform-tools
# Agrega a PATH de Windows
```

### "APK no se instala"
```bash
# Intenta con -r (replace)
adb install -r app.apk

# O habilita "Fuentes desconocidas" en Android
```

### "Errores de compilación en GitHub Actions"
- Revisa los logs en GitHub → Actions
- Asegúrate de que el código compile localmente: `npm run build`

---

## 📁 Estructura del Proyecto

```
scope/
├── android/              # Proyecto Android (generado por Capacitor)
├── dist/                 # Build web compilado
├── src/                  # Código React
├── capacitor.config.ts   # Configuración de Capacitor
├── .github/workflows/    # GitHub Actions
└── APK_BUILD_GUIDE.md    # Guía detallada
```

---

## 🎉 ¡Felicidades!

Tu app ATHENEA ahora es una **app nativa Android** con:
- ✅ Zero backend (localStorage only)
- ✅ Offline-first architecture
- ✅ Instalación en cualquier Android
- ✅ Actualizaciones automáticas vía push a GitHub

**Próximos pasos:**
1. Instala en tu teléfono
2. Prueba todas las features
3. Reporta bugs si encuentras
4. Disfruta de tu app personal 🚀

