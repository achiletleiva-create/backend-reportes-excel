# 🔄 Flujo Completo: Web → Backend → Excel → Base de Datos

Guía paso a paso, en modo súper básico, para entender qué ocurre cuando usas la app web y se genera un reporte.

---

## 📁 Archivos y carpetas importantes

```
ANTHONY APP/
├── backend/
│   ├── server.js          ← Servidor (cerebro)
│   ├── database.db        ← Base de datos (archivo)
│   ├── templates/         ← Plantilla Excel original
│   │   └── plantilla.xlsx
│   ├── reports/           ← Reportes generados
│   └── uploads/           ← Fotos temporales
└── frontend/
    ├── index.html         ← Pantalla que ves
    ├── app.js             ← Lógica de la página
    └── styles.css         ← Estilos
```

---

## 🧠 ¿Qué ocurre paso a paso?

### 1. Usas la App Web (`frontend/index.html`)
- Es el formulario que ves en el navegador.
- Tú escribes: nombre, fecha, descripción, celdas, eliges una foto.
- Cuando haces clic en **“Generar Reporte”**, se activa `app.js`.

### 2. `app.js` prepara el envío
- Toma todos los datos del formulario.
- Crea un paquete llamado `FormData` (incluye texto + foto).
- Envía ese paquete a la dirección: `http://localhost:3000/api/generar-reporte`.
  - Esto es una petición HTTP (como cuando visitas una página, pero aquí enviamos datos).

### 3. El Backend recibe la petición (`backend/server.js`)
- `server.js` escucha en el puerto 3000.
- Cuando llega tu solicitud:
  1. Revisa que exista la plantilla `backend/templates/plantilla.xlsx`.
  2. Guarda la información en la base de datos `database.db`.
  3. Descarga la foto y la guarda temporalmente en `backend/uploads/`.

### 4. Generación del Excel
- `server.js` abre la plantilla original.
- Inserta tus textos en las celdas que indicaste (ej: A1, A2).
- Inserta la foto en la celda para la imagen (ej: C4).
- Guarda un nuevo archivo en `backend/reports/` con un nombre tipo `reporte-12345.xlsx`.

### 5. Respuesta al navegador
- El backend responde con un mensaje JSON como:
  ```json
  {
    "success": true,
    "ruta": "/reports/reporte-12345.xlsx"
  }
  ```
- `app.js` recibe esta respuesta y muestra un enlace para descargar el Excel.

### 6. Descarga y visualización
- Cuando das clic en el enlace, tu navegador abre `http://localhost:3000/reports/reporte-12345.xlsx`.
- Se descarga el archivo que se generó en `backend/reports/`.

---

## 🗄️ ¿Dónde se guarda la información?

### Base de datos (`backend/database.db`)
- Tipo: SQLite (archivo único).
- Tablas principales:
  - `reportes`: nombre, fecha, estado, ruta del archivo, etc.
  - `fotos`: nombre del archivo, celda donde se insertó.
  - `datos_reportes`: qué valor se puso en cada celda.

Puedes abrir este archivo con cualquier visor de SQLite (ej: [DB Browser for SQLite](https://sqlitebrowser.org/)).

---

## 🧾 Resumen del recorrido

```
[Tu navegador]      → Envía formulario + foto →  [Backend Node.js]
frontend/app.js                                      backend/server.js
      ↓                                                      ↓
   FormData                                           Lee plantilla Excel
      ↓                                                 Inserta datos
  HTTP POST  ─────────────────────────────────────►  Guarda Excel nuevo
                                                         Guarda en BD
                                                   Responde con enlace
◄──────────────────────────────  backend responde  ────────────────┘

Descargas el Excel desde el enlace (servido por el backend).
```

---

## 🧱 PUNTOS CLAVE

1. **Base de datos**: `backend/database.db` (archivo SQLite).
2. **Plantilla original**: `backend/templates/plantilla.xlsx`.
3. **Reportes nuevos**: `backend/reports/reporte-*.xlsx`.
4. **Servidor corriendo**: `npm start` dentro de `backend/`.
5. **App web**: abrir `frontend/index.html` en el navegador.

---

## 🧪 ¿Cómo probar todo desde cero?

1. **Inicia backend**:
   ```bash
   cd backend
   npm.cmd start
   ```
2. **Abre la app web**: doble clic en `frontend/index.html`.
3. **Llena el formulario y genera un reporte**.
4. **Descarga el Excel generado** (enlace que aparece).
5. **Opcional**: abre `backend/reports/` y verás el archivo creado.

---

¿Quieres que este flujo se muestre en la propia app (como un tutorial) o lo dejamos en este archivo? Puedo agregarte un botón “Ver explicación” en la web si te ayuda. 😊



