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

// --- RUTA DE STATUS (Para que Render sepa que estamos vivos) ---
app.get('/', (req, res) => {
    res.send('✅ Servidor de Reportes OOCC - ONLINE');
});

// --- RUTA PRINCIPAL: GENERAR REPORTE PILOTO ---
app.post('/generar-reporte', upload.single('foto'), async (req, res) => {
    try {
        console.log('--- Iniciando generación de Reporte Piloto ---');

        // 1. UBICAR PLANTILLA
        // Busca en: backend/templates/template_oocc.xlsx
        const templatePath = path.join(__dirname, 'templates', 'template_oocc.xlsx');
        
        if (!fs.existsSync(templatePath)) {
            throw new Error(`CRÍTICO: No se encuentra la plantilla en ${templatePath}`);
        }

        // 2. CARGAR EXCEL
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);

        // 3. RECIBIR DATOS DEL FRONTEND
        const { 
            nombreSite,       // E20
            fechaInspeccion,  // F30
            nombreInspector,  // D28
            descripcionFoto   // Debajo de la foto
        } = req.body;

        console.log(`Datos: Site=${nombreSite}, Insp=${nombreInspector}`);

        // ---------------------------------------------------------
        // PASO A: TEXTOS EN HOJA 1 ("Insp. Estructura")
        // ---------------------------------------------------------
        const hojaDatos = workbook.getWorksheet('Insp. Estructura');
        
        if (hojaDatos) {
            // Coordenadas confirmadas por el usuario
            if(nombreSite)      hojaDatos.getCell('E20').value = nombreSite;
            if(nombreInspector) hojaDatos.getCell('D28').value = nombreInspector;
            if(fechaInspeccion) hojaDatos.getCell('F30').value = fechaInspeccion;
        } else {
            console.warn('⚠️ No se encontró la hoja "Insp. Estructura"');
        }

        // ---------------------------------------------------------
        // PASO B: FOTO EN HOJA 4 ("Reporte Fotografico")
        // ---------------------------------------------------------
        const hojaFotos = workbook.getWorksheet('Reporte Fotografico');

        if (hojaFotos && req.file) {
            const imageId = workbook.addImage({
                buffer: req.file.buffer,
                extension: 'jpeg',
            });

            // COORDENADAS: Inicio B11 (Col 1, Row 10)
            // Calculamos un tamaño para que se vea bien (aprox hasta I23)
            hojaFotos.addImage(imageId, {
                tl: { col: 1, row: 10 }, // B11
                br: { col: 9, row: 23 }, // I24
                editAs: 'oneCell'
            });

            // Descripción de la foto (en B24, justo debajo)
            if(descripcionFoto) {
                hojaFotos.getCell('B24').value = descripcionFoto;
            }
        }

        // 4. GENERAR Y ENVIAR
        const nombreArchivo = `Reporte_${nombreSite || 'OOCC'}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);

        await workbook.xlsx.write(res);
        res.end();
        console.log('--- ¡Reporte Enviado! ---');

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).send('Error generando reporte: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});