# 📦 GUÍA DE INSTALACIÓN - Aplicación Móvil con React Native
## ⚡ OPTIMIZADA PARA PC CON 8GB RAM

### 💡 ESTRATEGIA LIGERA (RECOMENDADA PARA 8GB RAM)

**Opción A: Usar EXPO (MÁS LIGERO - RECOMENDADO)**
- ✅ No necesitas Android Studio completo
- ✅ No necesitas emulador pesado
- ✅ Puedes usar tu teléfono Android físico
- ✅ Usa menos RAM y recursos
- ✅ Más fácil de configurar

**Opción B: Android Studio Completo (MÁS PESADO)**
- ⚠️ Requiere más RAM (recomendado 16GB+)
- ⚠️ Emulador consume mucha memoria
- ✅ Más control sobre el desarrollo

**🎯 RECOMENDACIÓN: Usa EXPO + Teléfono Android Físico**

---

## ✅ PASO 1: Instalar Node.js (OBLIGATORIO - LIGERO ~50MB)

**Descarga:**
- Ve a: https://nodejs.org/
- Descarga la versión **LTS (Long Term Support)** - Recomendada
- Ejecuta el instalador `.msi`
- **IMPORTANTE:** Durante la instalación, marca la opción "Add to PATH" si aparece
- Sigue el asistente de instalación (Next, Next, Install)
- Reinicia PowerShell/Terminal después de instalar

**Verificar instalación:**
```powershell
node --version
npm --version
```

---

## ✅ PASO 2: Instalar Git (OBLIGATORIO - LIGERO ~50MB)

**Descarga:**
- Ve a: https://git-scm.com/download/win
- Descarga el instalador para Windows
- Ejecuta el instalador
- **Configuración recomendada:**
  - Usar Git desde la línea de comandos de Windows
  - Usar OpenSSL library
  - Checkout Windows-style, commit Unix-style line endings
- Reinicia PowerShell después de instalar

**Verificar instalación:**
```powershell
git --version
```

---

## ✅ PASO 3: Instalar Visual Studio Code (RECOMENDADO - LIGERO ~200MB)

**Descarga:**
- Ve a: https://code.visualstudio.com/
- Descarga la versión para Windows
- Ejecuta el instalador
- Durante la instalación, marca "Add to PATH"
- Instala las extensiones recomendadas cuando se abra:
  - React Native Tools
  - ES7+ React/Redux/React-Native snippets

**Verificar instalación:**
```powershell
code --version
```

---

## ✅ PASO 4: OPCIÓN A - EXPO (RECOMENDADO PARA 8GB RAM) ⚡

**🎯 VENTAJAS:**
- ✅ No necesitas Android Studio (ahorra ~2GB RAM)
- ✅ No necesitas emulador (ahorra ~1-2GB RAM)
- ✅ Usa tu teléfono Android físico
- ✅ Configuración más simple
- ✅ Menos recursos del sistema

**Instalación:**
```powershell
npm install -g expo-cli
```

**Para probar en tu teléfono:**
1. Instala la app **"Expo Go"** desde Google Play Store (GRATIS)
2. Conecta tu teléfono a la misma red WiFi que tu PC
3. Ejecuta `expo start` y escanea el código QR con Expo Go

**✅ CON ESTA OPCIÓN NO NECESITAS:**
- ❌ Android Studio completo
- ❌ Emulador Android
- ❌ Java JDK (opcional)

---

## ✅ PASO 4: OPCIÓN B - Android Studio (SOLO SI NECESITAS EMULADOR)

**⚠️ ADVERTENCIA: PESADO PARA 8GB RAM**
- Consume ~2-3GB RAM solo Android Studio
- Emulador consume ~1-2GB RAM adicionales
- Puede hacer lenta tu PC

**Si aún así quieres instalarlo:**

**Descarga:**
- Ve a: https://developer.android.com/studio
- Descarga Android Studio
- Ejecuta el instalador

**Configuración optimizada para 8GB RAM:**
1. Durante la instalación, instala SOLO:
   - Android SDK
   - Android SDK Platform
   - **NO instales AVD (emulador) por ahora**

2. Después de instalar, abre Android Studio
3. Ve a: **File → Settings → Appearance & Behavior → System Settings → Android SDK**
4. En la pestaña **SDK Platforms**, marca SOLO:
   - ✅ Android 13.0 (Tiramisu) - solo uno, no varios
5. En la pestaña **SDK Tools**, marca:
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Platform-Tools
   - ❌ **NO marques Android Emulator** (muy pesado)
6. Click **Apply**

**Configurar variables de entorno:**
1. Busca en Windows: "Variables de entorno"
2. Agrega estas variables de sistema:
   - `ANDROID_HOME` = `C:\Users\LENOVO\AppData\Local\Android\Sdk`
   - Agrega a `Path`:
     - `%ANDROID_HOME%\platform-tools`
     - `%ANDROID_HOME%\tools`
     - `%ANDROID_HOME%\tools\bin`

**💡 TIP: Usa tu teléfono Android físico en lugar del emulador**

---

## ✅ PASO 5: Instalar Expo CLI (RECOMENDADO)

**Después de instalar Node.js, ejecuta:**

```powershell
npm install -g expo-cli
```

**O si prefieres React Native CLI (más pesado):**

```powershell
npm install -g react-native-cli
```

---

## ✅ PASO 6: Instalar Java JDK (SOLO SI USAS OPCIÓN B - Android Studio)

**Descarga:**
- Ve a: https://adoptium.net/ (OpenJDK - GRATIS)
- Descarga **Temurin 17 (LTS)** para Windows x64
- Ejecuta el instalador
- Agrega a variables de entorno:
  - `JAVA_HOME` = `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`

---

## 📋 CHECKLIST DE INSTALACIÓN (OPCIÓN LIGERA - EXPO)

**Instalación mínima necesaria:**

- [ ] Node.js instalado (~50MB)
- [ ] Git instalado (~50MB)
- [ ] Visual Studio Code instalado (~200MB)
- [ ] Expo CLI instalado (ligero)
- [ ] App "Expo Go" en tu teléfono Android (GRATIS en Play Store)

**Total aproximado: ~300MB en disco, ~200MB RAM en uso**

---

## 📋 CHECKLIST DE INSTALACIÓN (OPCIÓN COMPLETA - Android Studio)

**Si eliges la opción pesada:**

- [ ] Node.js instalado
- [ ] Git instalado
- [ ] Visual Studio Code instalado
- [ ] Android Studio instalado (~2GB)
- [ ] Java JDK instalado (~200MB)
- [ ] Variables de entorno configuradas
- [ ] React Native CLI instalado

**Total aproximado: ~3GB en disco, ~3-4GB RAM en uso**

---

## 🧪 VERIFICAR INSTALACIÓN (OPCIÓN LIGERA)

Ejecuta estos comandos uno por uno:

```powershell
node --version      # Debe mostrar v18.x.x o superior
npm --version       # Debe mostrar 9.x.x o superior
git --version       # Debe mostrar git version 2.x.x
code --version      # Debe mostrar 1.x.x
npx expo --version  # Debe mostrar versión de Expo
```

## 🧪 VERIFICAR INSTALACIÓN (OPCIÓN COMPLETA)

Si instalaste Android Studio, también verifica:

```powershell
java -version       # Debe mostrar openjdk version 17.x.x
adb version         # Debe mostrar Android Debug Bridge version
```

---

## 💾 CONSUMO DE RECURSOS COMPARADO

### Opción Ligera (EXPO + Teléfono):
- **Disco:** ~300MB
- **RAM en uso:** ~200-400MB
- **CPU:** Bajo
- ✅ **Ideal para 8GB RAM**

### Opción Completa (Android Studio):
- **Disco:** ~3GB
- **RAM en uso:** ~3-4GB (con emulador)
- **CPU:** Alto
- ⚠️ **Puede hacer lenta tu PC con 8GB**

---

## ⚠️ IMPORTANTE

1. **Reinicia PowerShell/Terminal** después de cada instalación
2. **Reinicia tu computadora** después de configurar variables de entorno
3. Si algo no funciona, verifica que las rutas en variables de entorno sean correctas
4. **Para 8GB RAM, usa EXPO + teléfono físico** (más rápido y ligero)

---

## 🎯 RECOMENDACIÓN FINAL

**Para tu PC con 8GB RAM:**
1. ✅ Instala: Node.js, Git, VS Code, Expo CLI
2. ✅ Usa tu teléfono Android físico con Expo Go
3. ❌ **NO instales Android Studio** (a menos que realmente lo necesites)
4. ❌ **NO uses emulador** (consume mucha RAM)

**Con esta configuración:**
- Tu PC seguirá funcionando rápido
- Podrás desarrollar sin problemas
- Todo será gratuito y de código abierto

---

## 🆘 SI TIENES PROBLEMAS

- Asegúrate de tener permisos de administrador
- Verifica que las rutas en variables de entorno sean correctas
- Reinicia la computadora después de instalar todo
- Si tu PC se pone lenta, cierra programas innecesarios
- Considera usar EXPO en lugar de Android Studio

