# 📱 GUÍA VISUAL PASO A PASO: INSTALAR ATHENEA EN TU TELÉFONO

## PARTE 1: PREPARAR EL TELÉFONO (5 minutos)

### Paso 1A: Abre Configuración

```
En tu teléfono Android:
┌─────────────────────────────┐
│ 🏠 Pantalla de inicio       │
│                             │
│ Busca el ícono de engranaje │
│ (⚙️) que es "Configuración"│
│                             │
│ ← Tap aquí                  │
└─────────────────────────────┘
```

**Verás algo como esto:**
```
        CONFIGURACIÓN
───────────────────────────
 Wi-Fi
 Bluetooth
 Display
 Sonido
 Aplicaciones
 ...
 Acerca del teléfono  ⬅️ ESTE
───────────────────────────
```

---

### Paso 1B: Ve a "Acerca de el teléfono"

**Dentro de Configuración:**
1. **Scroll hacia abajo** hasta el final
2. Busca **"Acerca de el teléfono"** (en algunos teléfonos es "Acerca de")
3. **Tap en "Acerca de el teléfono"**

```
        CONFIGURACIÓN
───────────────────────────
[Anterior]
 Wi-Fi
 Bluetooth
 Display
 Almacenamiento
 Batería
 Seguridad
 ↓ ↓ ↓ (scroll hacia abajo)
 Acerca de el teléfono  ⬅️ TAP AQUÍ
───────────────────────────
```

---

### Paso 1C: Find "Número de compilación"

**Ahora estás en "Acerca de el teléfono". Verás:**
```
    ACERCA DE EL TELÉFONO
───────────────────────────
 Nombre del dispositivo
 Modelo de teléfono
 Android version
 ...
 📝 Número de compilación  ⬅️ ESTE
───────────────────────────
```

**Busca "Número de compilación" - probablemente está al final**

---

### Paso 1D: ¡EL SECRETO! Toca 7 veces

**Ahora viene lo importante:**

```
Toca el "Número de compilación" 7 veces seguidas
(como si lo clickearas rápidamente)

TAP! TAP! TAP! TAP! TAP! TAP! TAP!

Verás un mensaje como:
"Eres un desarrollador" o
"Modo de desarrollador activado"
```

**Genial, ya pasó el paso difícil ✅**

---

### Paso 1E: Activa la Depuración USB

1. **Vuelve hacia atrás** (botón atrás del teléfono o en pantalla)
2. En Configuración, ahora verás una **opción nueva llamada "Opciones de desarrollador"**
3. **Tap en "Opciones de desarrollador"**

```
        CONFIGURACIÓN
───────────────────────────
 Display
 Sonido
 Aplicaciones
 Acerca de el teléfono
 ✨ Opciones de desarrollador  ⬅️ NUEVA (antes no estaba)
───────────────────────────
```

---

4. **Dentro de Opciones de desarrollador:**
   - Busca **"Depuración USB"** (puede estar cerca del inicio)
   - Hay un **switch (botón) al lado** que dice OFF (apagado)
   - **Tap en el switch para activarlo** → debe ponerse AZUL o verde (ON)

```
    OPCIONES DE DESARROLLADOR
───────────────────────────
 Sistema UI
 Mostrar toques
 ↑ ↑ ↑ Scroll hacia arriba ↑ ↑ ↑
 🔵 Depuración USB  ← Switch ACTIVO (azul)
 🔵 Depuración inalámbrica
 Verificación de apps USB
───────────────────────────
```

**✅ ¡Teléfono PREPARADO!**

---

---

## PARTE 2: DESCARGAR EL APK (2 minutos)

### Paso 2A: Abre GitHub en tu PC

**En tu computadora:**

1. Abre **Google Chrome** (o cualquier navegador)
2. En la barra de búsqueda, copia y pega:
   ```
   https://github.com/Gaboozc/ATHENEA/actions
   ```
3. Presiona **Enter**

```
┌─────────────────────────────────────┐
│ https://github...../actions         │
├─────────────────────────────────────┤
│                                     │
│ ATHENEA / Actions                   │
│                                     │
│ Recent workflows:                   │
│                                     │
│ [✅] Build APK  branch: single...   │ ⬅️ ESTE
│     Completed about 1 hour ago      │
│                                     │
└─────────────────────────────────────┘
```

---

### Paso 2B: Haz click en el workflow "Build APK"

**Verás una lista de builds. El más arriba es el más reciente.**

- Busca el que tenga un **✅ verde** (significa que compiló bien)
- Di **click en ese workflow**

```
┌──────────────────────────────────┐
│                                  │
│ ✅ Build APK                     │ ⬅️ CLICK AQUÍ
│    branch: single-person         │
│    on push                       │
│    Completed at 14:32            │
│                                  │
│ ❌ Build APK (anterior, falló)   │
│    ...                           │
│                                  │
└──────────────────────────────────┘
```

---

### Paso 2C: Descarga los Artifacts

**Ya dentro del workflow, scroll hacia ABAJO**

Verás una sección que dice:
```
📦 ARTIFACTS
────────────────────
ATHENEA-APK
(Size: ~3.5 MB)
```

Di **click en "ATHENEA-APK"** para descargar

```
┌────────────────────────────────────┐
│  📦 ARTIFACTS                      │
├────────────────────────────────────┤
│                                    │
│  📁 ATHENEA-APK                    │ ⬅️ CLICK AQUÍ
│     (se descargará como .zip)      │
│                                    │
└────────────────────────────────────┘
```

**⏳ Espera a que termine la descarga (2-3 minutos)**

---

### Paso 2D: Descomprime el archivo

**Cuando termine:**

1. Abre tu carpeta **Downloads** (Descargas)
2. Busca el archivo **"ATHENEA-APK"** o **"ATHENEA-APK.zip"**
3. **Click derecho** en el archivo
4. Elige **"Extraer aquí"** o **"Descomprimir"**

```
Carpeta Downloads:
────────────────────────────
📁 ATHENEA-APK.zip
   ↓ Click derecho → Extraer
📁 ATHENEA-APK/
   └── ATHENEA-release.apk  ⬅️ ESTE Es EL APK
   └── otros-archivos
────────────────────────────
```

**Recuerda la ruta:**
```
C:\Users\gazav\Downloads\ATHENEA-APK\ATHENEA-release.apk
                       ↑
                   Tu usuario
```

**✅ APK LISTO PARA INSTALAR**

---

---

## PARTE 3: CONECTAR EL TELÉFONO (3 minutos)

### Paso 3A: Prepara el cable USB

```
USB en PC → USB Type-C (o micro USB) → Teléfono

Asegúrate de usar un cable BUENO
(los cables baratos a veces no funcionan)
```

---

### Paso 3B: Conecta el teléfono

**Enchufa el cable USB a tu PC y al teléfono**

```
En tu teléfono aparecerá un popup:

┌─────────────────────────────────┐
│  🔐 Permitir acceso de depuración│
│                                 │
│  ¿Permitir depuración USB de    │
│  la computadora?                │
│                                 │
│  [Cancelar]  [Permitir]         │ ⬅️ TAP "Permitir"
│                                 │
│  ☑️ Recordar para esta          │
│     computadora                 │ ⬅️ Marca esto
│                                 │
└─────────────────────────────────┘
```

**Acciones:**
1. **Marca la casilla** "Recordar para esta computadora"
2. **Tap en "Permitir"**

---

### Paso 3C: Elige "Transferencia de archivos"

**Otro popup puede aparecer:**

```
┌────────────────────────────────┐
│  Forma de conexión USB         │
│                                │
│  ⭐ Transferencia de archivos   │ ⬅️ Elige ESTE
│  ⭒ Solo cargar                 │
│  ⭒ Canon camera (?)            │
│  ⭒ Instrumento MIDI            │
│                                │
└────────────────────────────────┘
```

**Haz tap en "Transferencia de archivos"**

---

**✅ TELÉFONO CONECTADO**

---

---

## PARTE 4: INSTALAR EL APK (1 minuto)

### Paso 4A: Abre PowerShell en tu PC

**En Windows:**

1. Presiona **Windows + R** (botones del teclado juntos)
2. Deberías ver un cuadro pequeño que dice "Ejecutar"
3. Escribe: `powershell`
4. Presiona **Enter**

```
┌─────────────────────┐
│ Ejecutar            │
│                     │
│ powershell          │
│                     │
│ [Aceptar] [Cancelar]│
└─────────────────────┘
```

**Verás una ventana **negra** que es PowerShell:**
```
Windows PowerShell
Copyright (C) 2021 Microsoft Corporation.

PS C:\Users\gazav>
```

---

### Paso 4B: Escribe el comando de instalación

**En PowerShell, copia y pega esto:**

```powershell
adb install -r "C:\Users\gazav\Downloads\ATHENEA-APK\ATHENEA-release.apk"
```

⚠️ **IMPORTANTE:** Si tu usuario **NO es "gazav"**, cambia la parte azul:
```
C:\Users\[TU_USUARIO_AQUI]\Downloads\ATHENEA-APK\ATHENEA-release.apk
         ↑ Reemplaza esto
```

**Para saber tu usuario:**
- Mira la carpeta donde vive: `C:\Users\` 
- Tu usuario es la carpeta que aparece ahí

---

**Pasos en PowerShell:**

1. **Click derecho** en la ventana negra de PowerShell
2. Elige **"Paste"** (pegar)
3. Presiona **Enter**

```
PS C:\Users\gazav> adb install -r "C:\Users\gazav\Downloads\ATHENEA-APK\ATHENEA-release.apk"
```

---

### Paso 4C: Espera el resultado

**PowerShell mostrará:**

```
adb install -r "C:\Users\gazav\Downloads\ATHENEA-APK\ATHENEA-release.apk"
Performing Streaming Install
    0 B/s (0 B in 0.001s)

Success!
```

✅ **SI VES "Success!" = ¡INSTALADO!**

---

### Paso 4D: Si sale error "adb not found"

Si ves:
```
adb: The term 'adb' is not recognized
```

**Solución rápida:**

1. Descarga aquí: https://developer.android.com/studio/releases/platform-tools
2. Descomprime en: `C:\adb`
3. En PowerShell, ejecuta:
   ```powershell
   $env:Path += ";C:\adb\platform-tools"
   ```
4. Prueba de nuevo el comando de instalación

---

---

## PARTE 5: ¡ABRE LA APP! (1 minuto)

### Paso 5A: Desconecta el teléfono

1. Desconecta el cable USB

```
PC ← [Cable USB] ← X
      [USB desconectado]
```

---

### Paso 5B: Busca la app en tu teléfono

**En tu teléfono:**

1. Abre el **App Drawer** (cuadrícula de apps, usualmente abajo 👇)
2. **Scroll hacia arriba o abajo** para buscar "ATHENEA"
3. Busca el ícono que dice **ATHENEA**

```
┌───────────────────────┐
│ 🏠 Finder             │
├───────────────────────┤
│                       │
│ 📱 ATHENEA  ⬅️ ESTE  │
│ 📧 Gmail              │
│ 🎵 Spotify            │
│ 📸 Cámara            │
│ ...                   │
│                       │
└───────────────────────┘
```

---

### Paso 5C: Abre ATHENEA

**Tap en el ícono de ATHENEA**

La app se abrirá lentamente (la primera vez tarda más):

```
┌─────────────────────────┐
│                         │
│     ATHENEA             │
│                         │
│   ⏳ Cargando...        │
│                         │
│   [Login Screen]        │
│                         │
└─────────────────────────┘
```

---

### Paso 5D: ¡Bienvenido a ATHENEA!

```
┌────────────────────────────┐
│    ATHENEA                 │
│                            │
│  Username: (vacío)         │
│  Password: (vacío)         │
│                            │
│  [Login] [Crear Cuenta]    │
│                            │
│ ✨ Por defecto:            │
│  Usuario: test             │
│  Contraseña: test          │
│                            │
└────────────────────────────┘
```

**Escribi:**
- Usuario: `test`
- Contraseña: `test`
- Tap en **Login**

---

## ✅ ¡LISTO! 

Ahora tienes ATHENEA funcionando en tu teléfono completamente **offline** 🎉

### Lo que puedes hacer:
- ✅ Crear proyectos
- ✅ Agregar tareas
- ✅ Ver  dashboard
- ✅ Escribir notas
- ✅ Todo funciona SIN internet
- ✅ Cambiar idioma EN/ES

---

## 🆘 SI ALGO SALE MAL

### Problema: "Device not found" en PowerShell

**Solución:**
1. Desconecta el USB
2. En el teléfono: Configuración → Opciones de desarrollador
3. Desactiva y reactiva "Depuración USB"
4. Vuelve a conectar
5. Vuelve a aceptar el popup de "Permitir depuración"
6. Intenta de nuevo

---

### Problema: "Installation failed"

**Solución:**
1. En PowerShell:
   ```powershell
   adb uninstall com.athenea.app
   ```
2. Espera a que termine
3. Intenta instalar de nuevo

---

### Problema: La app no abre / pantalla negra

**Solución:**
1. Espera 30 segundos (la primera vez es lenta)
2. Si sigue negro, reinicia el teléfono
3. Abre la app de nuevo

---

### ÚLTIMO RECURSO: Llámame a la función WhatsApp 📞

Si nada funciona, avísame exactamente:
- ¿En qué paso te atascas?
- ¿Qué mensaje de error ves?
- ¿Qué tipo de teléfono tienes?

---

**¿Necesitas que explique algo de nuevo? Dime en qué paso estás ** 👀
