# 📊 Backend Generador de Reportes Excel con Imágenes y Base de Datos SQL

Backend Node.js con base de datos SQLite para:
- Generar reportes Excel con imágenes desde AppSheet
- Almacenar y gestionar reportes en base de datos SQL
- Operaciones CRUD completas (Crear, Leer, Actualizar, Eliminar)

## 🚀 Instalación Rápida

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env`:

```bash
copy .env.example .env
```

### 3. Crear carpetas necesarias

El servidor creará automáticamente estas carpetas, pero puedes crearlas manualmente:

```
backend/
├── templates/     ← Coloca aquí tu plantilla Excel
├── uploads/       ← Fotos temporales (se crea automáticamente)
├── reports/       ← Reportes generados (se crea automáticamente)
└── database.db    ← Base de datos SQLite (se crea automáticamente)
```

**Nota:** La base de datos SQLite se crea automáticamente al iniciar el servidor.

### 4. Colocar plantilla Excel

Coloca tu plantilla Excel en la carpeta `templates/` con el nombre `plantilla.xlsx` (o especifica otro nombre al enviar la petición).

### 5. Iniciar servidor

```bash
npm start
```

Para desarrollo con auto-reload:

```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:3000`

---

## 🗄️ Base de Datos

El backend usa **SQLite** (base de datos SQL local) que se crea automáticamente.

**Tablas creadas:**
- `reportes` - Almacena los reportes generados
- `fotos` - Almacena las fotos asociadas a cada reporte
- `datos_reportes` - Almacena los datos de cada reporte

**Ubicación:** `./database.db`

**Ventajas de SQLite:**
- ✅ No requiere servidor de base de datos
- ✅ Archivo local, fácil de respaldar
- ✅ 100% gratuito
- ✅ Perfecto para desarrollo y producción pequeña/mediana

---

## 📡 Endpoints Disponibles

### 📊 Endpoints CRUD - Base de Datos

- **GET** `/api/reportes` - Listar todos los reportes
- **GET** `/api/reportes/:id` - Obtener reporte por ID
- **POST** `/api/reportes` - Crear nuevo reporte
- **PUT** `/api/reportes/:id` - Actualizar reporte
- **DELETE** `/api/reportes/:id` - Eliminar reporte
- **POST** `/api/reportes/:id/fotos` - Agregar foto a reporte
- **POST** `/api/reportes/:id/datos` - Agregar dato a reporte

**Ver documentación completa en:** `API_DOCUMENTATION.md`

### 📄 Endpoints de Reportes Excel

### POST `/api/generar-reporte`

Genera un reporte Excel con imágenes.

**Formato:** `multipart/form-data`

**Campos esperados:**

- `datos` (JSON string): Objeto con la configuración del reporte
- `foto1`, `foto2`, etc.: Archivos de imagen
- `celdaFoto1`, `celdaFoto2`, etc.: Celdas donde insertar cada foto (opcional, puede ir en el JSON)

**Ejemplo de JSON `datos`:**

```json
{
  "nombrePlantilla": "plantilla.xlsx",
  "nombreHoja": "Sheet1",
  "celdas": {
    "A1": "Título del Reporte",
    "B2": "Fecha: 2024-01-15",
    "C3": "Valor: 1234"
  },
  "celdasFotos": {
    "foto1": "A5",
    "foto2": "B10"
  },
  "anchoImagen": 200,
  "altoImagen": 150
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "mensaje": "Reporte generado exitosamente",
  "archivo": "reporte-1234567890.xlsx",
  "ruta": "/reports/reporte-1234567890.xlsx",
  "timestamp": 1234567890
}
```

### GET `/api/health`

Verifica el estado del servidor.

### GET `/api/plantillas`

Lista las plantillas Excel disponibles.

### GET `/reports/:filename`

Descarga un reporte generado.

---

## 🔗 Integración con AppSheet

### Configuración en AppSheet

1. **Crear acción personalizada:**
   - Ve a tu app en AppSheet
   - Crea una acción que envíe datos al backend

2. **Configurar Webhook/HTTP Request:**
   - URL: `http://tu-servidor.com/api/generar-reporte`
   - Método: POST
   - Tipo: Multipart Form Data

3. **Mapear campos:**
   - `datos`: JSON con la configuración
   - `foto1`, `foto2`, etc.: Campos de imagen de tu app

### Ejemplo de configuración en AppSheet

**En la acción personalizada:**

```
URL: https://tu-backend.railway.app/api/generar-reporte
Método: POST
Headers: (ninguno necesario, el servidor acepta CORS)

Body (Form Data):
- datos: [JSON]
  {
    "nombrePlantilla": "plantilla.xlsx",
    "celdas": {
      "A1": [Nombre],
      "B2": [Fecha]
    },
    "celdasFotos": {
      "foto1": "A5"
    }
  }
- foto1: [Campo de imagen de tu app]
```

---

## 📝 Ejemplo de Uso con cURL

```bash
curl -X POST http://localhost:3000/api/generar-reporte \
  -F "datos={\"nombrePlantilla\":\"plantilla.xlsx\",\"celdas\":{\"A1\":\"Test\"},\"celdasFotos\":{\"foto1\":\"A5\"}}" \
  -F "foto1=@/ruta/a/tu/imagen.jpg"
```

---

## 🛠️ Estructura del Proyecto

```
backend/
├── server.js           # Servidor principal
├── package.json        # Dependencias
├── .env               # Variables de entorno
├── templates/         # Plantillas Excel
├── uploads/          # Fotos temporales
└── reports/          # Reportes generados
```

---

## 📦 Dependencias

- **express**: Servidor web
- **multer**: Manejo de archivos multipart
- **exceljs**: Manipulación de archivos Excel
- **cors**: Habilitar CORS para AppSheet
- **dotenv**: Variables de entorno
- **better-sqlite3**: Base de datos SQLite (SQL)

---

## 🚢 Despliegue en Servidor Gratuito

### Railway (Recomendado)

1. Crea cuenta en [Railway](https://railway.app)
2. Conecta tu repositorio GitHub
3. Railway detectará automáticamente Node.js
4. Agrega variable de entorno `PORT` (Railway la asigna automáticamente)
5. ¡Listo! Tu backend estará en línea

### Render

1. Crea cuenta en [Render](https://render.com)
2. Nuevo Web Service
3. Conecta repositorio
4. Build: `npm install`
5. Start: `npm start`
6. ¡Listo!

### Heroku

1. Crea cuenta en [Heroku](https://heroku.com)
2. Instala Heroku CLI
3. `heroku create tu-app`
4. `git push heroku main`
5. ¡Listo!

---

## ⚠️ Notas Importantes

1. **Plantilla Excel:** Debe estar en formato `.xlsx` (Excel 2007+)
2. **Tamaño de imágenes:** Límite de 10MB por imagen
3. **Celdas:** Usa notación estándar (A1, B2, etc.)
4. **Formato:** Las imágenes se insertan manteniendo la relación de aspecto

---

## 🐛 Solución de Problemas

### Error: "Plantilla no encontrada"
- Verifica que la plantilla esté en `./templates/`
- Verifica el nombre de la plantilla en el JSON

### Error: "Error al generar el reporte"
- Revisa los logs del servidor
- Verifica que las celdas especificadas existan
- Verifica el formato de las imágenes

### Las imágenes no se ven
- Verifica que las celdas especificadas sean correctas
- Aumenta el tamaño de la imagen si es muy pequeña
- Verifica que el archivo de imagen sea válido

---

## 📞 Soporte

Si tienes problemas, revisa los logs del servidor para más detalles.



