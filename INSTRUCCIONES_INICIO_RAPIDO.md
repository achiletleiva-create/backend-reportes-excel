# 🚀 INICIO RÁPIDO - Backend Generador de Reportes

## ⚡ Empezar en 5 minutos

### 1. Instalar Node.js (si no lo tienes)

Ve a: https://nodejs.org/
Descarga e instala la versión LTS

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Crear archivo .env

Crea un archivo `.env` en la carpeta `backend/` con:

```
PORT=3000
NODE_ENV=development
```

### 4. Crear carpeta templates y colocar plantilla

```bash
mkdir templates
```

Coloca tu plantilla Excel en `backend/templates/plantilla.xlsx`

### 5. Iniciar servidor

```bash
npm start
```

¡Listo! El servidor estará en: http://localhost:3000

---

## 📝 Probar que funciona

### Opción 1: Usar el endpoint de salud

Abre en tu navegador:
```
http://localhost:3000/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "mensaje": "Servidor funcionando correctamente"
}
```

### Opción 2: Probar con Postman

1. Abre Postman
2. Crea nueva petición POST
3. URL: `http://localhost:3000/api/generar-reporte`
4. Body → form-data
5. Agrega:
   - `datos`: `{"nombrePlantilla":"plantilla.xlsx","celdas":{"A1":"Test"},"celdasFotos":{"foto1":"A5"}}`
   - `foto1`: Selecciona un archivo de imagen
6. Envía la petición

---

## ✅ Checklist de inicio

- [ ] Node.js instalado
- [ ] `npm install` ejecutado
- [ ] Archivo `.env` creado
- [ ] Carpeta `templates/` creada
- [ ] Plantilla Excel colocada en `templates/`
- [ ] Servidor iniciado (`npm start`)
- [ ] Endpoint `/api/health` responde correctamente

---

## 🎯 Próximos pasos

1. Lee `PLAN_SEMANAL.md` para el plan de trabajo
2. Lee `INTEGRACION_APPSHEET.md` para integrar con AppSheet
3. Lee `backend/README.md` para más detalles técnicos

---

## 🆘 Problemas comunes

### "npm no se reconoce"
- Reinicia PowerShell/Terminal después de instalar Node.js
- Verifica que Node.js esté instalado: `node --version`

### "Plantilla no encontrada"
- Verifica que la plantilla esté en `backend/templates/`
- Verifica el nombre exacto (debe ser `plantilla.xlsx` o el que especifiques)

### "Puerto en uso"
- Cambia el puerto en `.env` a otro número (ej: 3001)
- O cierra el programa que está usando el puerto 3000

---

¡Listo para empezar! 🚀



