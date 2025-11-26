# 🗂️ PLAN - Frontend Web Básico (HTML/CSS/JS)

## 🎯 Objetivos
- Crear una interfaz web sencilla que se conecte al backend existente.
- Permitir capturar datos y fotos desde la web para generar reportes Excel.
- Mostrar reportes guardados en la base de datos.

## 🧱 Estructura Propuesta
```
frontend/
├── index.html        # Estructura principal
├── styles.css        # Estilos básicos
└── app.js            # Lógica (fetch, eventos)
```

## 🖥️ Pantallas / Secciones
1. **Formulario de Reporte**
   - Campos: nombre, fecha, descripción, celdas, imagen
   - Botón "Generar Reporte"
   - Feedback: mensaje + link de descarga

2. **Listado de Reportes**
   - Tabla con reportes almacenados
   - Botón para refrescar
   - Link de descarga del Excel existente

## 🔌 Conexiones al Backend
- `POST /api/generar-reporte` (multipart/form-data)
- `GET /api/reportes` (listado)
- `GET /reports/:filename` (descarga)

## ⚙️ Flujo del Formulario
1. Usuario completa campos + selecciona foto.
2. JS arma `FormData` y llama a `POST /api/generar-reporte`.
3. Backend responde con `archivo` y `ruta`.
4. Mostrar link de descarga y mensaje de éxito.

## 📋 Tareas
- [ ] Crear estructura base en `frontend/`.
- [ ] Diseñar `index.html` con dos secciones (formulario + listado).
- [ ] Agregar estilos básicos en `styles.css`.
- [ ] Implementar lógica en `app.js` (fetch, manejo de estados).
- [ ] Documentar cómo abrir la app web (archivo local o servidor estático).

{
  "cells": [],
  "metadata": {
    "language_info": {
      "name": "python"
    }
  },
  "nbformat": 4,
  "nbformat_minor": 2
}