# 📚 DOCUMENTACIÓN DE API - Backend con Base de Datos SQL

## 🌐 Base URL

```
http://localhost:3000
```

---

## 📊 ENDPOINTS DE BASE DE DATOS (CRUD)

### 1. Listar Todos los Reportes

**GET** `/api/reportes`

**Query Parameters:**
- `limit` (opcional): Número de resultados (default: 100)
- `offset` (opcional): Número de resultados a saltar (default: 0)

**Ejemplo:**
```bash
GET /api/reportes?limit=10&offset=0
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Reporte 2024-01-15",
      "fecha_creacion": "2024-01-15 10:30:00",
      "datos": "{\"campo1\":\"valor1\"}",
      "archivo_excel": "reporte-1234567890.xlsx",
      "estado": "completado",
      "created_at": "2024-01-15 10:30:00",
      "updated_at": "2024-01-15 10:30:00"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

---

### 2. Obtener Reporte por ID

**GET** `/api/reportes/:id`

**Ejemplo:**
```bash
GET /api/reportes/1
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Reporte 2024-01-15",
    "fecha_creacion": "2024-01-15 10:30:00",
    "datos": "{\"campo1\":\"valor1\"}",
    "archivo_excel": "reporte-1234567890.xlsx",
    "estado": "completado",
    "fotos": [
      {
        "id": 1,
        "reporte_id": 1,
        "nombre_archivo": "foto-1234567890.jpg",
        "ruta_archivo": "./uploads/foto-1234567890.jpg",
        "celda_excel": "A5"
      }
    ],
    "datos": [
      {
        "id": 1,
        "reporte_id": 1,
        "campo": "A1",
        "valor": "Título del Reporte",
        "celda_excel": "A1"
      }
    ]
  }
}
```

---

### 3. Crear Nuevo Reporte

**POST** `/api/reportes`

**Body (JSON):**
```json
{
  "nombre": "Mi Reporte",
  "datos": {
    "campo1": "valor1",
    "campo2": "valor2"
  },
  "estado": "pendiente"
}
```

**Respuesta:**
```json
{
  "success": true,
  "mensaje": "Reporte creado exitosamente",
  "data": {
    "id": 1,
    "nombre": "Mi Reporte",
    "fecha_creacion": "2024-01-15 10:30:00",
    "datos": "{\"campo1\":\"valor1\",\"campo2\":\"valor2\"}",
    "estado": "pendiente"
  }
}
```

---

### 4. Actualizar Reporte

**PUT** `/api/reportes/:id`

**Body (JSON) - Todos los campos son opcionales:**
```json
{
  "nombre": "Reporte Actualizado",
  "estado": "completado",
  "archivo_excel": "reporte-nuevo.xlsx"
}
```

**Respuesta:**
```json
{
  "success": true,
  "mensaje": "Reporte actualizado exitosamente",
  "data": {
    "id": 1,
    "nombre": "Reporte Actualizado",
    "estado": "completado",
    "archivo_excel": "reporte-nuevo.xlsx"
  }
}
```

---

### 5. Eliminar Reporte

**DELETE** `/api/reportes/:id`

**Ejemplo:**
```bash
DELETE /api/reportes/1
```

**Respuesta:**
```json
{
  "success": true,
  "mensaje": "Reporte eliminado exitosamente"
}
```

**Nota:** Al eliminar un reporte, se eliminan automáticamente todas sus fotos y datos asociados (CASCADE).

---

### 6. Agregar Foto a Reporte

**POST** `/api/reportes/:id/fotos`

**Content-Type:** `multipart/form-data`

**Body:**
- `foto` (file): Archivo de imagen
- `celda_excel` (text, opcional): Celda donde insertar (ej: "A5")

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/reportes/1/fotos \
  -F "foto=@/ruta/a/imagen.jpg" \
  -F "celda_excel=A5"
```

**Respuesta:**
```json
{
  "success": true,
  "mensaje": "Foto agregada exitosamente",
  "data": {
    "id": 1,
    "reporte_id": 1,
    "nombre_archivo": "foto-1234567890.jpg",
    "ruta_archivo": "./uploads/foto-1234567890.jpg",
    "celda_excel": "A5"
  }
}
```

---

### 7. Agregar Dato a Reporte

**POST** `/api/reportes/:id/datos`

**Body (JSON):**
```json
{
  "campo": "nombre_campo",
  "valor": "valor del campo",
  "celda_excel": "B2"
}
```

**Respuesta:**
```json
{
  "success": true,
  "mensaje": "Dato agregado exitosamente",
  "data": {
    "id": 1,
    "reporte_id": 1,
    "campo": "nombre_campo",
    "valor": "valor del campo",
    "celda_excel": "B2"
  }
}
```

---

## 📄 ENDPOINTS DE REPORTES EXCEL

### Generar Reporte Excel con Imágenes

**POST** `/api/generar-reporte`

**Content-Type:** `multipart/form-data`

**Body:**
- `datos` (JSON string): Configuración del reporte
- `foto1`, `foto2`, etc. (files): Archivos de imagen

**Ejemplo de JSON `datos`:**
```json
{
  "nombrePlantilla": "plantilla.xlsx",
  "nombreHoja": "Sheet1",
  "nombreReporte": "Reporte Personalizado",
  "guardarEnBD": true,
  "celdas": {
    "A1": "Título",
    "B2": "Fecha: 2024-01-15"
  },
  "celdasFotos": {
    "foto1": "A5",
    "foto2": "B10"
  },
  "anchoImagen": 200,
  "altoImagen": 150
}
```

**Respuesta:**
```json
{
  "success": true,
  "mensaje": "Reporte generado exitosamente",
  "archivo": "reporte-1234567890.xlsx",
  "ruta": "/reports/reporte-1234567890.xlsx",
  "reporteId": 1,
  "timestamp": 1234567890
}
```

---

## 🔍 OTROS ENDPOINTS

### Health Check

**GET** `/api/health`

**Respuesta:**
```json
{
  "status": "ok",
  "mensaje": "Servidor funcionando correctamente",
  "database": "conectada",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Listar Plantillas

**GET** `/api/plantillas`

**Respuesta:**
```json
{
  "success": true,
  "plantillas": [
    {
      "nombre": "plantilla.xlsx",
      "ruta": "/templates/plantilla.xlsx"
    }
  ],
  "total": 1
}
```

### Descargar Reporte

**GET** `/reports/:filename`

Descarga el archivo Excel generado.

---

## 💡 EJEMPLOS DE USO

### Flujo Completo: Crear Reporte → Agregar Datos → Generar Excel

```bash
# 1. Crear reporte
POST /api/reportes
{
  "nombre": "Reporte de Inspección",
  "estado": "pendiente"
}
# Respuesta: { "data": { "id": 1 } }

# 2. Agregar datos
POST /api/reportes/1/datos
{
  "campo": "fecha",
  "valor": "2024-01-15",
  "celda_excel": "A1"
}

POST /api/reportes/1/datos
{
  "campo": "inspector",
  "valor": "Juan Pérez",
  "celda_excel": "B1"
}

# 3. Agregar fotos
POST /api/reportes/1/fotos
- foto: [archivo]
- celda_excel: "A5"

# 4. Generar Excel (usa los datos de la BD)
POST /api/generar-reporte
- datos: {
    "reporteId": 1,
    "nombrePlantilla": "plantilla.xlsx"
  }
```

---

## 🗄️ ESTRUCTURA DE LA BASE DE DATOS

### Tabla: `reportes`
- `id` (INTEGER, PRIMARY KEY)
- `nombre` (TEXT)
- `fecha_creacion` (DATETIME)
- `datos` (TEXT, JSON)
- `archivo_excel` (TEXT)
- `estado` (TEXT)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Tabla: `fotos`
- `id` (INTEGER, PRIMARY KEY)
- `reporte_id` (INTEGER, FOREIGN KEY)
- `nombre_archivo` (TEXT)
- `ruta_archivo` (TEXT)
- `celda_excel` (TEXT)
- `created_at` (DATETIME)

### Tabla: `datos_reportes`
- `id` (INTEGER, PRIMARY KEY)
- `reporte_id` (INTEGER, FOREIGN KEY)
- `campo` (TEXT)
- `valor` (TEXT)
- `celda_excel` (TEXT)
- `created_at` (DATETIME)

---

## 🔐 NOTAS IMPORTANTES

1. **CORS:** El servidor acepta peticiones desde cualquier origen (configurado para desarrollo)
2. **Límite de archivos:** 10MB por imagen
3. **Base de datos:** SQLite (archivo local `database.db`)
4. **Formato de fechas:** ISO 8601 (YYYY-MM-DD HH:MM:SS)

---

## 🆘 CÓDIGOS DE ERROR

- `200` - Éxito
- `201` - Creado exitosamente
- `400` - Solicitud incorrecta
- `404` - No encontrado
- `500` - Error del servidor

