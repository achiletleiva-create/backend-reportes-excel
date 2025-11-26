/**
 * Funciones auxiliares para trabajar con sqlite3 de forma más fácil
 */

/**
 * Ejecutar query y obtener todos los resultados
 */
function dbAll(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Ejecutar query y obtener un solo resultado
 */
function dbGet(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Ejecutar query (INSERT, UPDATE, DELETE) y obtener el resultado
 */
function dbRun(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      }
    });
  });
}

module.exports = {
  dbAll,
  dbGet,
  dbRun
};

