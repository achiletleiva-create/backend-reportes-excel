const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
// Configuración de Multer para guardar en memoria RAM
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// --- RUTA DE MONITOREO ---
app.get('/', (req, res) => {
    res.send('✅ Servidor de Reportes OOCC - ONLINE');
});

// --- RUTA PRINCIPAL: GENERAR REPORTE ---
app.post('/generar-reporte', upload.single('foto'), async (req, res) => {
    try {
        console.log('--- Iniciando generación de Reporte ---');

        // 1. UBICAR LA PLANTILLA
        const templatePath = path.join(__dirname, 'templates', 'template_oocc.xlsx');
        
        if (!fs.existsSync(templatePath)) {
            throw new Error(`CRÍTICO: No se encuentra la plantilla en ${templatePath}`);
        }

        // 2. CARGAR EXCEL
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);

        // 3. OBTENER DATOS
        const { 
            nombreSite,       // E20
            fechaInspeccion,  // F30
            nombreInspector,  // D28
            descripcionFoto   // B24
        } = req.body;

        console.log(`Procesando: Site=${nombreSite}, Insp=${nombreInspector}`);

        // ---------------------------------------------------------
        // PASO A: LLENAR TEXTOS (Hoja "Insp. Estructura")
        // ---------------------------------------------------------
        const hojaDatos = workbook.getWorksheet('Insp. Estructura');
        
        if (hojaDatos) {
            if(nombreSite)      hojaDatos.getCell('E20').value = nombreSite;
            if(nombreInspector) hojaDatos.getCell('D28').value = nombreInspector;
            if(fechaInspeccion) hojaDatos.getCell('F30').value = fechaInspeccion;
        } else {
            console.warn('⚠️ No se encontró la hoja "Insp. Estructura"');
        }

// ---------------------------------------------------------
        // PASO B: FOTO EN HOJA 4 (MODO AUTO-AJUSTE PERFECTO)
        // ---------------------------------------------------------
        const hojaFotos = workbook.getWorksheet('Reporte Fotografico');

        if (hojaFotos && req.file) {
            const imageId = workbook.addImage({
                buffer: req.file.buffer,
                extension: 'jpeg',
            });

            // ESTRATEGIA: 'twoCell'
            // Esto ancla la imagen a las celdas. Si cambias el ancho de columna en Excel,
            // la imagen se estirará con ella. Llenará el recuadro perfectamente.
            
            hojaFotos.addImage(imageId, {
                tl: { col: 1, row: 10 },  // Esquina Sup. Izq: Inicio de Celda B11
                br: { col: 5, row: 11 },  // Esquina Inf. Der: Final de Celda J24 (aprox)
                editAs: 'twoCell'         // CLAVE: "Estírate entre estas dos coordenadas"
            });

            // Descripción de la foto (en B24)
            if(descripcionFoto) {
                hojaFotos.getCell('B24').value = descripcionFoto;
            }
        }

        // ---------------------------------------------------------
        // PASO 4: FINALIZAR Y ENVIAR
        // ---------------------------------------------------------
        const nombreArchivo = `Reporte_${nombreSite || 'OOCC'}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);

        // Truco para asegurar que Excel recalcule todo al abrir
        workbook.calcProperties.fullCalcOnLoad = true;

        // Generar Buffer y enviar
        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);
        
        console.log('--- ¡Reporte generado exitosamente! ---');

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).send('Error generando reporte: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);

});
