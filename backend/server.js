const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getDatabase, ensureDatabase } = require('./database');
const { dbAll, dbGet, dbRun } = require('./db-helpers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Variable para almacenar la conexión a la BD
let db;

// Inicializar base de datos al iniciar
ensureDatabase().then(database => {
  db = database;
  console.log('✅ Base de datos lista para usar');
}).catch(err => {
  console.error('❌ Error inicializando base de datos:', err);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar multer para recibir archivos (fotos)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Nombre único para cada archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'foto-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Límite de 10MB por imagen
});

// Directorio para plantillas y reportes generados
const TEMPLATES_DIR = './templates';
const REPORTS_DIR = './reports';

// Crear directorios si no existen
[TEMPLATES_DIR, REPORTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Endpoint principal: Generar reporte Excel con imágenes
 * 
 * Recibe:
 * - Datos del formulario (JSON)
 * - Fotos (multipart/form-data)
 * 
 * Parámetros esperados en el body:
 * - datos: JSON string con los datos del reporte
 * - foto1, foto2, etc.: Archivos de imagen
 * - celdaFoto1, celdaFoto2, etc.: Celdas donde insertar cada foto (ej: "A5", "B10")
 */
app.post('/api/generar-reporte', upload.any(), async (req, res) => {
  try {
    console.log('📥 Recibiendo solicitud de reporte...');
    
    // Obtener datos del formulario
    const datos = req.body.datos ? JSON.parse(req.body.datos) : req.body;
    const archivos = req.files || [];
    
    // Asegurar que la BD esté inicializada
    if (!db) {
      await ensureDatabase();
      db = getDatabase();
    }
    
    // Crear registro en la base de datos
    let reporteId = null;
    if (datos.guardarEnBD !== false) {
      const nombreReporte = datos.nombreReporte || `Reporte ${new Date().toISOString()}`;
      const result = await dbRun(db, 'INSERT INTO reportes (nombre, datos, estado) VALUES (?, ?, ?)', 
        [nombreReporte, JSON.stringify(datos), 'generando']);
      reporteId = result.lastID;
      console.log('💾 Reporte guardado en BD con ID:', reporteId);
    }
    
    console.log('📊 Datos recibidos:', datos);
    console.log('📸 Archivos recibidos:', archivos.length);
    
    // Nombre de la plantilla (puedes cambiarlo según necesites)
    const nombrePlantilla = datos.nombrePlantilla || 'plantilla.xlsx';
    const rutaPlantilla = path.join(TEMPLATES_DIR, nombrePlantilla);
    
    // Verificar que la plantilla existe
    if (!fs.existsSync(rutaPlantilla)) {
      return res.status(400).json({
        error: 'Plantilla no encontrada',
        mensaje: `No se encontró la plantilla: ${nombrePlantilla}`,
        ayuda: 'Coloca tu plantilla Excel en la carpeta ./templates/'
      });
    }
    
    // Cargar plantilla Excel
    console.log('📄 Cargando plantilla:', rutaPlantilla);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(rutaPlantilla);
    
    // Obtener la primera hoja (o la que especifiques)
    const nombreHoja = datos.nombreHoja || 'Sheet1';
    const worksheet = workbook.getWorksheet(nombreHoja) || workbook.worksheets[0];
    
    console.log('✏️ Trabajando en hoja:', worksheet.name);
    
    // Llenar datos en celdas específicas
    if (datos.celdas) {
      console.log('📝 Llenando datos en celdas...');
      for (const [celda, valor] of Object.entries(datos.celdas)) {
        const cell = worksheet.getCell(celda);
        cell.value = valor;
        console.log(`  ✓ ${celda} = ${valor}`);
      }
    }
    
    // Insertar imágenes en celdas específicas
    console.log('🖼️ Insertando imágenes...');
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];
      const campoFoto = archivo.fieldname; // ej: "foto1", "foto2"
      
      // Obtener la celda donde insertar (puede venir en datos o en el nombre del campo)
      const celdaDestino = datos[`celda${campoFoto}`] || 
                          datos[`celdaFoto${i + 1}`] ||
                          datos.celdasFotos?.[campoFoto] ||
                          datos.celdasFotos?.[i];
      
      if (!celdaDestino) {
        console.log(`⚠️ No se especificó celda para ${campoFoto}, saltando...`);
        continue;
      }
      
      console.log(`  📸 Insertando ${archivo.originalname} en celda ${celdaDestino}...`);
      
      try {
        // Leer la imagen
        const imageBuffer = fs.readFileSync(archivo.path);
        
        // Obtener la celda destino
        const cell = worksheet.getCell(celdaDestino);
        
        // Insertar imagen
        const imageId = workbook.addImage({
          buffer: imageBuffer,
          extension: path.extname(archivo.filename).substring(1) || 'png'
        });
        
        // Obtener posición y tamaño de la celda
        const row = cell.row;
        const col = cell.col;
        
        // Insertar imagen en la celda (ajusta el tamaño según necesites)
        const anchoImagen = datos.anchoImagen || 200; // ancho en píxeles
        const altoImagen = datos.altoImagen || 150;  // alto en píxeles
        
        worksheet.addImage(imageId, {
          tl: { col: col - 1, row: row - 1 },
          ext: { width: anchoImagen, height: altoImagen }
        });
        
        // Ajustar altura de la fila para que quepa la imagen
        const rowObj = worksheet.getRow(row);
        const alturaFila = Math.max(rowObj.height || 15, altoImagen / 1.33); // Convertir píxeles a puntos
        rowObj.height = alturaFila;
        
        console.log(`  ✓ Imagen insertada en ${celdaDestino}`);
        
        // Guardar referencia de la foto en la base de datos
        if (reporteId) {
          await dbRun(db, `
            INSERT INTO fotos (reporte_id, nombre_archivo, ruta_archivo, celda_excel)
            VALUES (?, ?, ?, ?)
          `, [reporteId, archivo.filename, archivo.path, celdaDestino]);
        }
        
        // NO eliminar archivo temporal todavía (se eliminará después de guardar el Excel)
        
      } catch (error) {
        console.error(`  ❌ Error insertando imagen ${archivo.originalname}:`, error.message);
        // Continuar con las demás imágenes
      }
    }
    
    // Generar nombre único para el reporte
    const timestamp = Date.now();
    const nombreReporte = `reporte-${timestamp}.xlsx`;
    const rutaReporte = path.join(REPORTS_DIR, nombreReporte);
    
    // Guardar el Excel generado
    console.log('💾 Guardando reporte...');
    await workbook.xlsx.writeFile(rutaReporte);
    console.log('✅ Reporte guardado:', rutaReporte);
    
    // Actualizar reporte en BD con el archivo generado
    if (reporteId) {
      await dbRun(db, 'UPDATE reportes SET archivo_excel = ?, estado = ? WHERE id = ?',
        [nombreReporte, 'completado', reporteId]);
      
      // Guardar datos en la tabla datos_reportes
      if (datos.celdas) {
        for (const [celda, valor] of Object.entries(datos.celdas)) {
          await dbRun(db, `
            INSERT INTO datos_reportes (reporte_id, campo, valor, celda_excel)
            VALUES (?, ?, ?, ?)
          `, [reporteId, celda, valor, celda]);
        }
      }
    }
    
    // Eliminar archivos temporales de fotos
    archivos.forEach(archivo => {
      if (fs.existsSync(archivo.path)) {
        fs.unlinkSync(archivo.path);
      }
    });
    
    // Enviar respuesta
    res.json({
      success: true,
      mensaje: 'Reporte generado exitosamente',
      archivo: nombreReporte,
      ruta: `/reports/${nombreReporte}`,
      reporteId: reporteId,
      timestamp: timestamp
    });
    
  } catch (error) {
    console.error('❌ Error generando reporte:', error);
    res.status(500).json({
      error: 'Error al generar el reporte',
      mensaje: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Endpoint para descargar reportes generados
 */
app.get('/reports/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(REPORTS_DIR, filename);
  
  if (fs.existsSync(filepath)) {
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error descargando archivo:', err);
        res.status(500).json({ error: 'Error al descargar el archivo' });
      }
    });
  } else {
    res.status(404).json({ error: 'Archivo no encontrado' });
  }
});

/**
 * Endpoint de salud/status
 */
app.get('/api/health', async (req, res) => {
  try {
    if (!db) {
      await ensureDatabase();
      db = getDatabase();
    }
    
    // Verificar conexión a base de datos
    await dbGet(db, 'SELECT 1');
    
    res.json({
      status: 'ok',
      mensaje: 'Servidor funcionando correctamente',
      database: 'conectada',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      mensaje: 'Error en la base de datos',
      error: error.message
    });
  }
});

// ============================================
// ENDPOINTS CRUD - BASE DE DATOS
// ============================================

/**
 * GET /api/reportes - Obtener todos los reportes
 */
app.get('/api/reportes', async (req, res) => {
  try {
    if (!db) {
      await ensureDatabase();
      db = getDatabase();
    }
    
    const { limit = 100, offset = 0 } = req.query;
    
    const reportes = await dbAll(db, `
      SELECT * FROM reportes 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);
    
    const total = await dbGet(db, 'SELECT COUNT(*) as total FROM reportes');
    
    res.json({
      success: true,
      data: reportes,
      total: total.total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error obteniendo reportes:', error);
    res.status(500).json({
      error: 'Error al obtener reportes',
      mensaje: error.message
    });
  }
});

/**
 * GET /api/reportes/:id - Obtener un reporte por ID
 */
app.get('/api/reportes/:id', async (req, res) => {
  try {
    if (!db) {
      await ensureDatabase();
      db = getDatabase();
    }
    
    const { id } = req.params;
    
    const reporte = await dbGet(db, 'SELECT * FROM reportes WHERE id = ?', [id]);
    
    if (!reporte) {
      return res.status(404).json({
        error: 'Reporte no encontrado',
        id: id
      });
    }
    
    // Obtener fotos asociadas
    const fotos = await dbAll(db, 'SELECT * FROM fotos WHERE reporte_id = ?', [id]);
    
    // Obtener datos asociados
    const datos = await dbAll(db, 'SELECT * FROM datos_reportes WHERE reporte_id = ?', [id]);
    
    res.json({
      success: true,
      data: {
        ...reporte,
        fotos: fotos,
        datos: datos
      }
    });
  } catch (error) {
    console.error('Error obteniendo reporte:', error);
    res.status(500).json({
      error: 'Error al obtener reporte',
      mensaje: error.message
    });
  }
});

/**
 * POST /api/reportes - Crear un nuevo reporte
 */
app.post('/api/reportes', async (req, res) => {
  try {
    if (!db) {
      await ensureDatabase();
      db = getDatabase();
    }
    
    const { nombre, datos, estado = 'pendiente' } = req.body;
    
    if (!nombre) {
      return res.status(400).json({
        error: 'El nombre es requerido'
      });
    }
    
    const result = await dbRun(db, `
      INSERT INTO reportes (nombre, datos, estado)
      VALUES (?, ?, ?)
    `, [nombre, JSON.stringify(datos || {}), estado]);
    
    const nuevoReporte = await dbGet(db, 'SELECT * FROM reportes WHERE id = ?', [result.lastID]);
    
    res.status(201).json({
      success: true,
      mensaje: 'Reporte creado exitosamente',
      data: nuevoReporte
    });
  } catch (error) {
    console.error('Error creando reporte:', error);
    res.status(500).json({
      error: 'Error al crear reporte',
      mensaje: error.message
    });
  }
});

/**
 * PUT /api/reportes/:id - Actualizar un reporte
 */
app.put('/api/reportes/:id', async (req, res) => {
  try {
    if (!db) {
      await ensureDatabase();
      db = getDatabase();
    }
    
    const { id } = req.params;
    const { nombre, datos, estado, archivo_excel } = req.body;
    
    // Verificar que el reporte existe
    const reporteExistente = await dbGet(db, 'SELECT * FROM reportes WHERE id = ?', [id]);
    if (!reporteExistente) {
      return res.status(404).json({
        error: 'Reporte no encontrado'
      });
    }
    
    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];
    
    if (nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(nombre);
    }
    if (datos !== undefined) {
      updates.push('datos = ?');
      values.push(JSON.stringify(datos));
    }
    if (estado !== undefined) {
      updates.push('estado = ?');
      values.push(estado);
    }
    if (archivo_excel !== undefined) {
      updates.push('archivo_excel = ?');
      values.push(archivo_excel);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const sql = `UPDATE reportes SET ${updates.join(', ')} WHERE id = ?`;
    await dbRun(db, sql, values);
    
    const reporteActualizado = await dbGet(db, 'SELECT * FROM reportes WHERE id = ?', [id]);
    
    res.json({
      success: true,
      mensaje: 'Reporte actualizado exitosamente',
      data: reporteActualizado
    });
  } catch (error) {
    console.error('Error actualizando reporte:', error);
    res.status(500).json({
      error: 'Error al actualizar reporte',
      mensaje: error.message
    });
  }
});

/**
 * DELETE /api/reportes/:id - Eliminar un reporte
 */
app.delete('/api/reportes/:id', async (req, res) => {
  try {
    if (!db) {
      await ensureDatabase();
      db = getDatabase();
    }
    
    const { id } = req.params;
    
    // Verificar que el reporte existe
    const reporte = await dbGet(db, 'SELECT * FROM reportes WHERE id = ?', [id]);
    if (!reporte) {
      return res.status(404).json({
        error: 'Reporte no encontrado'
      });
    }
    
    // Eliminar reporte (las fotos y datos se eliminan automáticamente por CASCADE)
    await dbRun(db, 'DELETE FROM reportes WHERE id = ?', [id]);
    
    res.json({
      success: true,
      mensaje: 'Reporte eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando reporte:', error);
    res.status(500).json({
      error: 'Error al eliminar reporte',
      mensaje: error.message
    });
  }
});

/**
 * POST /api/reportes/:id/fotos - Agregar foto a un reporte
 */
app.post('/api/reportes/:id/fotos', upload.single('foto'), async (req, res) => {
  try {
    if (!db) {
      await ensureDatabase();
      db = getDatabase();
    }
    
    const { id } = req.params;
    const { celda_excel } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        error: 'No se proporcionó archivo de foto'
      });
    }
    
    // Verificar que el reporte existe
    const reporte = await dbGet(db, 'SELECT * FROM reportes WHERE id = ?', [id]);
    if (!reporte) {
      // Eliminar archivo subido si el reporte no existe
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(404).json({
        error: 'Reporte no encontrado'
      });
    }
    
    const result = await dbRun(db, `
      INSERT INTO fotos (reporte_id, nombre_archivo, ruta_archivo, celda_excel)
      VALUES (?, ?, ?, ?)
    `, [id, file.filename, file.path, celda_excel || null]);
    
    const nuevaFoto = await dbGet(db, 'SELECT * FROM fotos WHERE id = ?', [result.lastID]);
    
    res.status(201).json({
      success: true,
      mensaje: 'Foto agregada exitosamente',
      data: nuevaFoto
    });
  } catch (error) {
    console.error('Error agregando foto:', error);
    res.status(500).json({
      error: 'Error al agregar foto',
      mensaje: error.message
    });
  }
});

/**
 * POST /api/reportes/:id/datos - Agregar datos a un reporte
 */
app.post('/api/reportes/:id/datos', async (req, res) => {
  try {
    if (!db) {
      await ensureDatabase();
      db = getDatabase();
    }
    
    const { id } = req.params;
    const { campo, valor, celda_excel } = req.body;
    
    if (!campo) {
      return res.status(400).json({
        error: 'El campo es requerido'
      });
    }
    
    // Verificar que el reporte existe
    const reporte = await dbGet(db, 'SELECT * FROM reportes WHERE id = ?', [id]);
    if (!reporte) {
      return res.status(404).json({
        error: 'Reporte no encontrado'
      });
    }
    
    const result = await dbRun(db, `
      INSERT INTO datos_reportes (reporte_id, campo, valor, celda_excel)
      VALUES (?, ?, ?, ?)
    `, [id, campo, valor || null, celda_excel || null]);
    
    const nuevoDato = await dbGet(db, 'SELECT * FROM datos_reportes WHERE id = ?', [result.lastID]);
    
    res.status(201).json({
      success: true,
      mensaje: 'Dato agregado exitosamente',
      data: nuevoDato
    });
  } catch (error) {
    console.error('Error agregando dato:', error);
    res.status(500).json({
      error: 'Error al agregar dato',
      mensaje: error.message
    });
  }
});

/**
 * Endpoint para listar plantillas disponibles
 */
app.get('/api/plantillas', (req, res) => {
  try {
    const plantillas = fs.readdirSync(TEMPLATES_DIR)
      .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
      .map(file => ({
        nombre: file,
        ruta: `/templates/${file}`
      }));
    
    res.json({
      success: true,
      plantillas: plantillas,
      total: plantillas.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al listar plantillas',
      mensaje: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Servidor iniciado');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   POST /api/generar-reporte - Generar reporte Excel`);
  console.log(`   GET  /api/health - Estado del servidor`);
  console.log(`   GET  /api/plantillas - Listar plantillas`);
  console.log(`   GET  /reports/:filename - Descargar reporte`);
  console.log('');
  console.log('📊 Endpoints CRUD - Base de Datos:');
  console.log(`   GET    /api/reportes - Listar todos los reportes`);
  console.log(`   GET    /api/reportes/:id - Obtener reporte por ID`);
  console.log(`   POST   /api/reportes - Crear nuevo reporte`);
  console.log(`   PUT    /api/reportes/:id - Actualizar reporte`);
  console.log(`   DELETE /api/reportes/:id - Eliminar reporte`);
  console.log(`   POST   /api/reportes/:id/fotos - Agregar foto a reporte`);
  console.log(`   POST   /api/reportes/:id/datos - Agregar dato a reporte`);
  console.log('');
  console.log('💡 Coloca tu plantilla Excel en: ./templates/plantilla.xlsx');
  console.log('💾 Base de datos SQLite: ./database.db');
});



