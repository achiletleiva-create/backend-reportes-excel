const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // Asumiendo que usas CORS

// Importa aquí tu módulo para generar Excel (Ejemplo: require('./excelGenerator');)
// const { generateExcel } = require('./excelGenerator'); 

// --- 🛠️ SOLUCIÓN AL ERROR ENOENT EN RENDER 🛠️ ---
// Define la ruta de la carpeta de subidas
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Verifica si la carpeta 'uploads' existe. Si no, la crea (síncrono al iniciar el servidor).
if (!fs.existsSync(UPLOAD_DIR)) {
    console.log(`Creando directorio de subidas: ${UPLOAD_DIR}`);
    fs.mkdirSync(UPLOAD_DIR, { recursive: true }); // El flag recursive: true ayuda a crear carpetas anidadas si fuera necesario
}
// ----------------------------------------------------

// 1. Configuración de Multer (Middleware para manejo de archivos)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Multer debe usar el directorio que acabamos de crear
        cb(null, UPLOAD_DIR); 
    },
    filename: (req, file, cb) => {
        // Usamos un nombre de archivo fijo para simplificar (como se ve en el error)
        cb(null, 'temp_image.png'); 
    }
});
const upload = multer({ storage: storage });

const app = express();
const port = process.env.PORT || 3000;

// Configuración básica
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Ruta para generar el reporte
// Usa 'upload.single('foto')' para procesar el campo de archivo llamado 'foto'
app.post('/generar-reporte', upload.single('foto'), async (req, res) => {
    let filePath = null;
    
    try {
        const data = req.body;
        // La ruta del archivo subido está en req.file.path
        filePath = req.file ? req.file.path : null; 

        // 🟢 Lógica de generación de Excel 
        // Reemplaza esta línea con tu llamada a la función que genera el Excel
        // const excelBuffer = await generateExcel(data, filePath);
        
        // --- SIMULACIÓN (Reemplazar con tu lógica real) ---
        const excelBuffer = Buffer.from("Simulated Excel Content"); 
        // ---------------------------------------------------

        // Establecer encabezados para la descarga del archivo
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte.xlsx');
        
        // Enviar el archivo Excel
        res.send(excelBuffer);

    } catch (error) {
        console.error("Error al procesar el reporte:", error);
        res.status(500).send("Error interno del servidor al generar el reporte.");
    } finally {
        // 🗑️ LIMPIEZA: Eliminar el archivo subido (es crucial en entornos sin estado como Render)
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log(`Archivo temporal eliminado: ${filePath}`);
            } catch (e) {
                console.error("No se pudo eliminar el archivo temporal:", e);
            }
        }
    }
});

// 3. Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
    console.log(`URL de Render: ${process.env.RENDER_EXTERNAL_URL}`);
});