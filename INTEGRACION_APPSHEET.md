# 🔗 GUÍA DE INTEGRACIÓN: AppSheet → Backend

## 📱 Configuración en AppSheet

Esta guía te muestra paso a paso cómo conectar AppSheet con tu backend Node.js.

---

## PASO 1: Preparar tu App en AppSheet

### 1.1 Crear Campos Necesarios

En tu app de AppSheet, asegúrate de tener:

- **Campos de texto/números** (para datos del reporte)
- **Campo de imagen** (para las fotos)
- **Campo de fecha** (si lo necesitas)

**Ejemplo de estructura:**

| Campo | Tipo | Ejemplo |
|-------|------|---------|
| Nombre | Text | "Juan Pérez" |
| Fecha | Date | "2024-01-15" |
| Valor | Number | 1234 |
| Foto1 | Image | [imagen] |
| Foto2 | Image | [imagen] |

---

## PASO 2: Crear Acción Personalizada

### 2.1 Crear Nueva Acción

1. Ve a tu app en AppSheet
2. Ve a **Actions** (Acciones)
3. Click en **+ New Action**
4. Nombre: "Generar Reporte Excel"

### 2.2 Configurar la Acción

**Tipo de Acción:** "Webhook" o "HTTP Request"

**Configuración:**

```
Name: Generar Reporte Excel
Type: Webhook
Method: POST
URL: https://tu-backend.railway.app/api/generar-reporte
```

---

## PASO 3: Configurar el Body (Datos a Enviar)

### 3.1 Formato Multipart Form Data

AppSheet debe enviar los datos en formato `multipart/form-data`.

### 3.2 Mapear Campos

En la configuración del Webhook, mapea los campos así:

#### Campo 1: `datos` (JSON)

**Tipo:** Text/JSON

**Valor (usando sintaxis de AppSheet):**

```
{
  "nombrePlantilla": "plantilla.xlsx",
  "nombreHoja": "Sheet1",
  "celdas": {
    "A1": "[Nombre]",
    "B2": "[Fecha]",
    "C3": "[Valor]"
  },
  "celdasFotos": {
    "foto1": "A5",
    "foto2": "B10"
  },
  "anchoImagen": 200,
  "altoImagen": 150
}
```

**Nota:** Reemplaza `[Nombre]`, `[Fecha]`, etc. con los nombres reales de tus columnas en AppSheet.

#### Campo 2: `foto1` (Archivo)

**Tipo:** File/Image

**Valor:** `[Foto1]` (nombre de tu columna de imagen)

#### Campo 3: `foto2` (Archivo) - Si tienes más fotos

**Tipo:** File/Image

**Valor:** `[Foto2]`

---

## PASO 4: Ejemplo Completo de Configuración

### En AppSheet, la acción debería verse así:

```
Action Name: Generar Reporte Excel
Type: Webhook
URL: https://tu-backend.railway.app/api/generar-reporte
Method: POST
Content Type: multipart/form-data

Body Fields:
┌─────────────────┬──────────────┬─────────────────────────────┐
│ Field Name      │ Type         │ Value                        │
├─────────────────┼──────────────┼─────────────────────────────┤
│ datos           │ Text         │ {                            │
│                 │              │   "nombrePlantilla":         │
│                 │              │     "plantilla.xlsx",        │
│                 │              │   "celdas": {                 │
│                 │              │     "A1": "[Nombre]",        │
│                 │              │     "B2": "[Fecha]"           │
│                 │              │   },                         │
│                 │              │   "celdasFotos": {            │
│                 │              │     "foto1": "A5"             │
│                 │              │   }                          │
│                 │              │ }                            │
├─────────────────┼──────────────┼─────────────────────────────┤
│ foto1           │ File         │ [Foto1]                      │
└─────────────────┴──────────────┴─────────────────────────────┘
```

---

## PASO 5: Configurar Respuesta

### 5.1 Manejar Respuesta del Backend

El backend devuelve:

```json
{
  "success": true,
  "mensaje": "Reporte generado exitosamente",
  "archivo": "reporte-1234567890.xlsx",
  "ruta": "/reports/reporte-1234567890.xlsx"
}
```

### 5.2 Opciones para el Usuario

**Opción A: Mostrar Link de Descarga**

En AppSheet, después de la acción, muestra un mensaje con el link:

```
"Reporte generado: https://tu-backend.railway.app/reports/[archivo]"
```

**Opción B: Descargar Automáticamente**

Configura AppSheet para abrir el link automáticamente.

**Opción C: Enviar por Email**

Modifica el backend para enviar el Excel por email (requiere configuración adicional).

---

## PASO 6: Probar la Integración

### 6.1 Prueba Básica

1. Abre tu app en AppSheet
2. Llena el formulario con datos de prueba
3. Toma una foto de prueba
4. Ejecuta la acción "Generar Reporte Excel"
5. Verifica que el Excel se genere correctamente

### 6.2 Verificar Logs

Revisa los logs del backend para ver:
- Si recibió los datos
- Si procesó las imágenes
- Si generó el Excel correctamente

---

## PASO 7: Manejo de Errores

### 7.1 Configurar Manejo de Errores en AppSheet

En la acción, configura qué hacer si falla:

```
On Error: Show Message
Message: "Error al generar reporte. Por favor intenta de nuevo."
```

### 7.2 Errores Comunes

**Error: "Plantilla no encontrada"**
- Verifica que la plantilla esté en `./templates/`
- Verifica el nombre de la plantilla en el JSON

**Error: "No se puede conectar"**
- Verifica la URL del backend
- Verifica que el backend esté en línea
- Verifica la configuración de CORS

**Error: "Imagen no válida"**
- Verifica el formato de la imagen
- Verifica el tamaño (máximo 10MB)

---

## 📝 EJEMPLO COMPLETO: Sintaxis AppSheet

Si AppSheet usa sintaxis específica, aquí hay ejemplos:

### Para datos dinámicos:

```
CONCATENATE(
  "{",
  "\"nombrePlantilla\": \"plantilla.xlsx\",",
  "\"celdas\": {",
  "\"A1\": \"", [Nombre], "\",",
  "\"B2\": \"", TEXT([Fecha]), "\"",
  "},",
  "\"celdasFotos\": {",
  "\"foto1\": \"A5\"",
  "}",
  "}"
)
```

### Para múltiples fotos:

```
{
  "celdasFotos": {
    "foto1": "A5",
    "foto2": "B10",
    "foto3": "C15"
  }
}
```

Y en los campos del body:
- `foto1`: `[Foto1]`
- `foto2`: `[Foto2]`
- `foto3`: `[Foto3]`

---

## 🔧 CONFIGURACIÓN AVANZADA

### Variables de Entorno en AppSheet

Si necesitas cambiar la URL del backend fácilmente:

1. Crea una columna "Config" en tu app
2. Guarda la URL del backend ahí
3. Usa `[Config]` en la URL del webhook

### Múltiples Plantillas

Para usar diferentes plantillas según el caso:

```
IF([Tipo] = "Reporte A", "plantilla-a.xlsx", "plantilla-b.xlsx")
```

---

## ✅ CHECKLIST DE INTEGRACIÓN

- [ ] Backend desplegado y funcionando
- [ ] URL del backend obtenida
- [ ] Acción creada en AppSheet
- [ ] Webhook configurado con URL correcta
- [ ] Campos mapeados correctamente
- [ ] JSON de datos formateado correctamente
- [ ] Fotos mapeadas correctamente
- [ ] Prueba básica realizada
- [ ] Excel se genera correctamente
- [ ] Imágenes aparecen en las celdas correctas
- [ ] Manejo de errores configurado
- [ ] Usuario puede descargar el Excel

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### El webhook no se ejecuta
- Verifica que la acción esté configurada correctamente
- Verifica que tengas datos en los campos necesarios
- Revisa los logs de AppSheet

### Los datos no llegan al backend
- Verifica el formato del JSON
- Verifica que los nombres de los campos sean correctos
- Revisa los logs del backend

### Las imágenes no se insertan
- Verifica que las celdas especificadas sean correctas
- Verifica que las fotos se estén enviando correctamente
- Revisa los logs del backend para errores específicos

---

## 📞 PRÓXIMOS PASOS

Una vez que la integración básica funcione:

1. Agregar más campos de datos
2. Agregar más fotos
3. Mejorar el formato del Excel
4. Agregar validaciones
5. Mejorar manejo de errores
6. Agregar notificaciones al usuario

---

¡Éxito con tu integración! 🚀



