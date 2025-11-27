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

app.get('/', (req, res) => res.send('✅ Servidor OOCC v3 (Checklist & Cálculos) - ONLINE'));

app.post('/generar-reporte', upload.single('foto'), async (req, res) => {
    try {
        console.log('--- Nueva solicitud de reporte ---');
        
        // 1. CARGAR PLANTILLA
        const templatePath = path.join(__dirname, 'templates', 'template_oocc.xlsx');
        if (!fs.existsSync(templatePath)) throw new Error(`No existe plantilla en ${templatePath}`);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);

        const datosRecibidos = req.body;
        const hojaDatos = workbook.getWorksheet('Insp. Estructura');

        if (!hojaDatos) {
            console.warn('⚠️ No se encontró la hoja "Insp. Estructura"');
            throw new Error('No se encontró la hoja de datos principal.');
        }

        // ---------------------------------------------------------
        // A. MAPEO DE DATOS DE TEXTO SIMPLES
        // ---------------------------------------------------------
        const cellMapping = {
            // SECCIÓN I: COOPERADOR (Ajustado según capturas/ejemplo)
            'cooperador_nombre':  'C12',
            'cooperador_cargo':   'E12',
            'cooperador_empresa': 'L12',
            'cooperador_dni':     'Q12', 

            // SECCIÓN II: SITE / PROYECTO
            'site_nombre':    'E20', // Nombre Site
            'site_proyecto':  'G20', // Proyecto
            'site_direccion': 'E22', // Dirección
            'site_distrito':  'C24', // Dpto/Prov/Dist
            'site_tipo':      'G24', // Tipo de sitio

            // SECCIÓN III: INSPECTOR
            'inspector_nombre':   'C28', // Asumido
            'inspector_cargo':    'E28',
            'inspector_empresa':  'L28',
            'fecha_inspeccion':   'F30',
            
            // Sección V: Comentarios Generales (si aplica)
            'descripcionFoto': 'N8', // Usamos un campo de texto de ejemplo para la descripción de la foto en la hoja de datos, si es necesario.
        };

        // Recorremos el mapa e inyectamos valores si existen en el body
        Object.keys(cellMapping).forEach(key => {
            if (datosRecibidos[key]) {
                const celda = cellMapping[key];
                hojaDatos.getCell(celda).value = datosRecibidos[key];
            }
        });
        console.log('✅ Datos de texto inyectados en Hoja 1');


        // ---------------------------------------------------------
        // B. LOGICA DE CHECKLIST (SI/NO/NA) - Columna Dinámica
        // ---------------------------------------------------------
        const checklistRows = {
            // CIMENTACIÓN - CONDICIONES DEL CONCRETO (Inicio Fila 34)
            'p_concreto_1': 34, // Fisuras
            'p_concreto_2': 35, // Desprendimientos
            'p_concreto_3': 36, // Humedad
            // ESTADO DE ANCLAJES (Inicio Fila 38)
            'p_anclaje_1': 38, // Grouting
            'p_anclaje_2': 39, // Codo
            'p_anclaje_3': 40, // Tuerca y contra tuerca
            // ESTADO DE PLANCHA BASE (Inicio Fila 42)
            'p_base_1': 42, // Deformación
            'p_base_2': 43, // Codo
            'p_base_3': 44, // Fisuras en plancha
            // ESTRUCTURA METALICA - CONEXIONES (Inicio Fila 46)
            'p_conexion_1': 47, // Pernos faltantes
            'p_conexion_2': 48, // Óxido en pernos
            'p_conexion_3': 49, // Tuerca y contratuerca
            // ESTRUCTURA METALICA - ESTRUCTURA
            'p_estructura_1': 50, // Óxido en planchas (codo)
            'p_estructura_2': 51, // Fisuras en plancha
            'p_estructura_3': 52, // Fisuras en soldadura
            // OXIDACIÓN Y CORROSIÓN (Inicio Fila 54)
            'p_corrosion_1': 55, // Óxido en montantes (Tu código de HTML parece haber omitido algunas, asegúrate que las que envías estén mapeadas aquí)
            'p_corrosion_10': 64, // Corrosión en horizontales (Asumo p_corrosion_10 mapea a la fila 64 en base a la captura)
            'p_corrosion_17': 70, // Pérdida de pintura
            'p_corrosion_18': 71, // Pérdida de galvanizado
            // ALINEAMIENTO Y ESTABILIDAD (Inicio Fila 73)
            'p_alineamiento_1': 74, // Deformación visible
            'p_alineamiento_2': 75, // Movimiento perceptible
            // ADICIONALES (Inicio Fila 78)
            'p_adicional_1': 79, // Empozamiento de agua
            'p_adicional_5': 83, // Crecimiento de vegetación
        };

        // Mapeo de Columna: F=SI, G=NO, H=NA (Según tu plantilla de Excel)
        const colMap = { 'SI': 'F', 'NO': 'G', 'NA': 'H' };

        // Contadores para los resultados de la Sección V
        let countSI = 0;
        let countNO = 0;
        let countNA = 0;

        Object.keys(checklistRows).forEach(inputName => {
            const respuesta = datosRecibidos[inputName];
            const row = checklistRows[inputName];
            
            if (respuesta && colMap[respuesta]) {
                const col = colMap[respuesta];
                const cellId = `${col}${row}`;
                
                // 1. Inyectar la 'X'
                hojaDatos.getCell(cellId).value = 'X'; 
                hojaDatos.getCell(cellId).alignment = { vertical: 'middle', horizontal: 'center' };
                
                // 2. Contar para los Resultados (Sección V)
                if (respuesta === 'SI') {
                    countSI++;
                } else if (respuesta === 'NO') {
                    countNO++;
                } else if (respuesta === 'NA') {
                    countNA++;
                }
            }
        });
        console.log('✅ Checklist de preguntas inyectado y contado.');

        // ---------------------------------------------------------
        // C. CÁLCULO DE RESULTADOS (SECCIÓN V)
        // ---------------------------------------------------------
        const totalAplicable = countSI + countNO;

        let calificacionLograda = 0;
        if (totalAplicable > 0) {
            // Fórmula: (Cantidad de NO / Cantidad Preguntas Aplicables) * 100
            // Asumiendo que "NO" (no hay defecto) es la respuesta de cumplimiento
            calificacionLograda = (countNO / totalAplicable) * 100;
        }

        // Inyectar Resultados en el Excel (Filas 87, 88, 89)
        // Según tu captura, los valores van en la columna E (Ej. E87)
        hojaDatos.getCell('E87').value = totalAplicable; // Cantidad de SI/NO
        hojaDatos.getCell('E88').value = totalAplicable; // Cantidad Preguntas Aplicables
        
        // E89: Calificación Lograda %
        hojaDatos.getCell('E89').value = `${calificacionLograda.toFixed(2)} %`; 
        console.log('✅ Resultados de Sección V calculados e inyectados.');


        // ---------------------------------------------------------
        // D. FOTO (Mantenemos la lógica original)
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
        // E. DESCARGA
        // ---------------------------------------------------------
        const nombreArchivo = `Reporte_${datosRecibidos.site_nombre || 'OOCC'}_${Date.now()}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);
        
        // Esto fuerza a Excel a re-calcular las fórmulas que tengas en la plantilla
        workbook.calcProperties.fullCalcOnLoad = true; 
        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);

    } catch (error) {
        console.error('❌ Error Grave en el proceso de reporte:', error);
        // Enviamos el código 500 al cliente con el mensaje de error
        res.status(500).send('Error en servidor: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor listo en puerto ${PORT}`));