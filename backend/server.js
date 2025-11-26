const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// RUTA DE MONITOREO
app.get('/', (req, res) => {
    res.send('✅ Backend Reportes OOCC - Listo para recibir datos.');
});

// RUTA PRINCIPAL
app.post('/generar-reporte', upload.single('foto'), async (req, res) => {
    try {
        console.log('--- Iniciando generación de Reporte Piloto ---');

        // 1. UBICAR PLANTILLA
        const templatePath = path.join(__dirname, 'templates', 'template_oocc.xlsx');
        if (!fs.existsSync(templatePath)) {
            throw new Error(`No se encuentra la plantilla en: ${templatePath}`);
        }

        // 2. CARGAR EXCEL EN MEMORIA
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);

        // 3. RECIBIR DATOS DEL FORMULARIO WEB
        // (Estos datos son dinámicos, cambian según lo que escriba el usuario)
        const { 
            nombreSite,       // Irá a E20
            fechaInspeccion,  // Irá a F30
            nombreInspector,  // Irá a D28
            descripcionFoto   // Irá debajo de la foto
        } = req.body;

        console.log(`Datos recibidos -> Site: ${nombreSite}, Inspector: ${nombreInspector}`);

        // ---------------------------------------------------------
        // PASO A: LLENAR HOJA 1 "Insp. Estructura" (Textos)
        // ---------------------------------------------------------
        const hojaDatos = workbook.getWorksheet('Insp. Estructura');
        
        if (hojaDatos) {
            // Inyectamos los valores en las coordenadas confirmadas
            if(nombreSite)      hojaDatos.getCell('E20').value = nombreSite;
            if(nombreInspector) hojaDatos.getCell('D28').value = nombreInspector;
            if(fechaInspeccion) hojaDatos.getCell('F30').value = fechaInspeccion;
        } else {
            console.warn('⚠️ No se encontró la hoja "Insp. Estructura"');
        }

        // ---------------------------------------------------------
        // PASO B: LLENAR HOJA 4 "Reporte Fotografico" (Imagen)
        // ---------------------------------------------------------
        const hojaFotos = workbook.getWorksheet('Reporte Fotografico');

        if (hojaFotos && req.file) {
            // Convertir imagen
            const imageId = workbook.addImage({
                buffer: req.file.buffer,
                extension: 'jpeg',
            });

            // COORDENADAS EXACTAS FOTO 1
            // Inicio: B11 (Columna B=1, Fila 11=10 en índice base-0)
            // Fin estimado: I23 (Para que tenga un tamaño decente de cuadro)
            hojaFotos.addImage(imageId, {
                tl: { col: 1, row: 10 }, // B11
                br: { col: 9, row: 23 }, // I24 (Aprox, ajustaremos si queda chica/grande)
                editAs: 'oneCell'
            });

            // Descripción de la foto (Opcional, la pondremos en B24 justo abajo)
            if(descripcionFoto) {
                hojaFotos.getCell('B24').value = descripcionFoto;
            }
        }

        // 4. GENERAR Y ENVIAR ARCHIVO
        // El nombre del archivo lleva el nombre del Site para identificarlo fácil
        const nombreArchivo = `Reporte_${nombreSite || 'Generado'}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);

        await workbook.xlsx.write(res);
        res.end();
        console.log('--- Reporte enviado exitosamente ---');

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).send('Error generando reporte: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor en puerto ${PORT}`);
});