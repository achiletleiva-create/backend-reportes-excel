const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ruta de la base de datos
const DB_PATH = path.join(__dirname, 'database.db');

// Crear conexión a la base de datos
let db;

/**
 * Inicializar la base de datos
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    try {
      db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('❌ Error conectando a la base de datos:', err);
          reject(err);
          return;
        }
        
        console.log('✅ Base de datos conectada:', DB_PATH);
        
        // Habilitar foreign keys
        db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            console.warn('⚠️ No se pudieron habilitar foreign keys:', err);
          }
        });
        
        // Crear tablas si no existen
        createTables()
          .then(() => resolve(db))
          .catch(reject);
      });
    } catch (error) {
      console.error('❌ Error creando conexión a la base de datos:', error);
      reject(error);
    }
  });
}

/**
 * Crear tablas en la base de datos
 * 
 * Puedes modificar esta función para crear tus propias tablas
 */
function createTables() {
  return new Promise((resolve, reject) => {
    const queries = [
      // Tabla de reportes
      `CREATE TABLE IF NOT EXISTS reportes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        datos TEXT,
        archivo_excel TEXT,
        estado TEXT DEFAULT 'pendiente',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Tabla de fotos/imágenes
      `CREATE TABLE IF NOT EXISTS fotos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporte_id INTEGER,
        nombre_archivo TEXT NOT NULL,
        ruta_archivo TEXT NOT NULL,
        celda_excel TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE
      )`,
      
      // Tabla de datos del reporte
      `CREATE TABLE IF NOT EXISTS datos_reportes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporte_id INTEGER,
        campo TEXT NOT NULL,
        valor TEXT,
        celda_excel TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE
      )`
    ];
    
    let completed = 0;
    let hasError = false;
    
    queries.forEach((query, index) => {
      db.run(query, (err) => {
        if (err && !hasError) {
          hasError = true;
          console.error(`❌ Error creando tabla ${index + 1}:`, err);
          reject(err);
          return;
        }
        
        completed++;
        if (completed === queries.length && !hasError) {
          console.log('✅ Tablas creadas/verificadas');
          resolve();
        }
      });
    });
  });
}

/**
 * Obtener conexión a la base de datos
 */
function getDatabase() {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.');
  }
  return db;
}

/**
 * Cerrar conexión a la base de datos
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('❌ Error cerrando base de datos:', err);
          reject(err);
        } else {
          console.log('🔒 Base de datos cerrada');
          db = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

// Inicializar automáticamente al cargar el módulo
let dbInitialized = false;

async function ensureDatabase() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
  return db;
}

// Inicializar en el siguiente tick para permitir que el módulo se cargue
setImmediate(() => {
  ensureDatabase().catch(err => {
    console.error('❌ Error inicializando base de datos:', err);
  });
});

module.exports = {
  getDatabase: () => {
    if (!db) {
      throw new Error('Base de datos no inicializada. Espera a que se inicialice.');
    }
    return db;
  },
  ensureDatabase,
  closeDatabase,
  initDatabase
};
