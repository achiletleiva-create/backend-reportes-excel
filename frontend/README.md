# 🌐 Frontend Web (HTML/CSS/JS)

Aplicación web básica que se conecta al backend Node.js para generar reportes Excel con imágenes.

## 🚀 Cómo usarla

1. Asegúrate de que el backend esté corriendo:
   ```bash
   cd backend
   npm start
   ```

2. Abre el archivo `frontend/index.html` en tu navegador (doble clic o arrastrar al navegador).

3. Completa el formulario:
   - Nombre del reporte
   - Fecha
   - Descripción
   - Celdas donde se insertarán los datos y la foto
   - Selecciona una imagen

4. Haz clic en **Generar Reporte**.
   - El backend generará el Excel con la imagen.
   - Aparecerá un link para descargar el archivo.

5. En la sección **Reportes generados** verás los reportes almacenados en la base de datos.

## ⚙️ Configuración opcional

Si el backend no está en `http://localhost:3000`, modifica la constante `API_BASE_URL` en `frontend/app.js`.

```js
const API_BASE_URL = 'https://tu-backend.com';
```

## 📁 Estructura
```
frontend/
├── index.html   # UI principal
├── styles.css   # Estilos
├── app.js       # Lógica y llamadas al backend
└── README.md    # Este archivo
```

## 🧪 Requisitos
- Navegador moderno (Chrome, Edge, Firefox)
- Backend corriendo (localhost o servidor con HTTPS)

¡Listo! Ya tienes una app web conectada a tu backend. 🎉



