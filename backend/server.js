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

app.get('/', (req, res) => res.send('✅ Servidor OOCC v2 - ONLINE'));

app.post('/generar-reporte', upload.single('foto'), async (req, res) => {
    try {
        console.log('--- Nueva solicitud de reporte ---');
        
        // 1. CARGAR PLANTILLA
        const templatePath = path.join(__dirname, 'templates', 'template_oocc.xlsx');
        if (!fs.existsSync(templatePath)) throw new Error(`No existe plantilla en ${templatePath}`);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);

        // ---------------------------------------------------------
        // MAPEO DE DATOS (INGENIERÍA INTELIGENTE)
        // Relacionamos: "name del HTML" : "Celda del Excel"
        // ---------------------------------------------------------
        const cellMapping = {
            // SECCIÓN I: COOPERADOR
            'cooperador_nombre':  'C12',
            'cooperador_cargo':   'E12',
            'cooperador_empresa': 'L12',
            'cooperador_dni':     'Q12',

            // SECCIÓN II: SITE / PROYECTO
            'site_nombre':    'E20', // Nombre Site
            'site_proyecto':  'G20', // Proyecto
            'site_direccion': 'E22', // Dirección
            'site_distrito':  'C24', // Dpto/Prov/Dist
            'site_tipo':      'G24', // Tipo de sitio

            // SECCIÓN III: INSPECTOR
            'inspector_nombre':   'C28', // Ojo: en tu captura parece ser C28 (Personal 01) o D28
            'inspector_cargo':    'E28',
            'inspector_empresa':  'L28',
            'fecha_inspeccion':   'F30',

            // SECCIÓN IV: CHECKLIST (EJEMPLO PILOTO 1-3)
            // Según captura: Col G es "SI/NO"? Vamos a asumir G=Respuesta por ahora
            'check_1': 'G34', // Fisuras
            'check_2': 'G35', // Desprendimientos
            'check_3': 'G36', // Humedad
        };

        const datosRecibidos = req.body;
        const hojaDatos = workbook.getWorksheet('Insp. Estructura');

        if (hojaDatos) {
            // Recorremos el mapa e inyectamos valores si existen en el body
            Object.keys(cellMapping).forEach(key => {
                if (datosRecibidos[key]) {
                    const celda = cellMapping[key];
                    hojaDatos.getCell(celda).value = datosRecibidos[key];
                }
            });
            console.log('✅ Datos de texto inyectados en Hoja 1');
        } else {
            console.warn('⚠️ No se encontró la hoja "Insp. Estructura"');
        }

        // ---------------------------------------------------------
        // FOTO (MANTENEMOS LA LÓGICA QUE YA FUNCIONA)
        // ---------------------------------------------------------
        const hojaFotos = workbook.getWorksheet('Reporte Fotografico');
        if (hojaFotos && req.file) {
            const imageId = workbook.addImage({ buffer: req.file.buffer, extension: 'jpeg' });
            
            hojaFotos.addImage(imageId, {
                tl: { col: 1, row: 10 }, // B11
                br: { col: 4, row: 11 }, // E12
                editAs: 'twoCell'
            });

            if(datosRecibidos.descripcionFoto) {
                hojaFotos.getCell('B24').value = datosRecibidos.descripcionFoto;
            }
            console.log('✅ Foto inyectada en Hoja 4');
        }

        // ---------------------------------------------------------
        // DESCARGA
        // ---------------------------------------------------------
        const nombreArchivo = `Reporte_${datosRecibidos.site_nombre || 'OOCC'}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);
        
        workbook.calcProperties.fullCalcOnLoad = true;
        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);

    } catch (error) {
        console.error('❌ Error Grave:', error);
        res.status(500).send('Error en servidor: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor listo en puerto ${PORT}`));