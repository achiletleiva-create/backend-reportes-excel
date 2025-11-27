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

app.get('/', (req, res) => res.send('✅ Servidor OOCC v7 (Personal 01-05 OK) - ONLINE'));

// Endpoint principal para generar el reporte
app.post('/generar-reporte', upload.single('foto'), async (req, res) => {
    try {
        console.log("📥 Recibiendo solicitud de reporte...");
        
        // 1. CARGA DE PLANTILLA
        // NOTA: Asegúrate de que tu archivo 'template_oocc.xlsx' exista en la carpeta 'templates'
        const templatePath = path.join(__dirname, 'templates', 'template_oocc.xlsx');
        if (!fs.existsSync(templatePath)) {
            return res.status(500).send(`Error Crítico: No se encontró la plantilla en ${templatePath}`);
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);
        
        const body = req.body; 
        const hojaDatos = workbook.getWorksheet('Insp. Estructura'); // Nombre de la hoja de datos

        if (hojaDatos) {
            
            // =======================================================
            // --- A. MAPEOS DE TEXTO Y VALORES DE CABECERA Y COMENTARIOS ---
            // =======================================================
            const textMapping = {
                // I. DATOS DEL COOPERADOR (NUEVOS CAMPOS AÑADIDOS)
                'razon_social': 'E11', // NUEVO
                'ruc': 'T11', // NUEVO
                
                // Personal 01
                'personal_01_nombre': 'D12', 'personal_01_cargo': 'H12', 'personal_01_empresa': 'O12', 'personal_01_dni': 'T12',
                
                // Personal 02
                'personal_01_nombre_2': 'D13', 'personal_01_cargo_2': 'H13', 'personal_01_empresa_2': 'O13', 'personal_01_dni_2': 'T13', // NUEVO
                
                // Personal 03
                'personal_01_nombre_3': 'D14', 'personal_01_cargo_3': 'H14', 'personal_01_empresa_3': 'O14', 'personal_01_dni_3': 'T14', // NUEVO
                
                // Personal 04
                'personal_01_nombre_4': 'D15', 'personal_01_cargo_4': 'H15', 'personal_01_empresa_4': 'O15', 'personal_01_dni_4': 'T15', // NUEVO
                
                // Personal 05
                'personal_01_nombre_5': 'D16', 'personal_01_cargo_5': 'H16', 'personal_01_empresa_5': 'O16', 'personal_01_dni_5': 'T16', // NUEVO
                
                // II. DATOS DEL PROYECTO Y SITE
                'nombre_site': 'E20', 'prioridad': 'E21', 
                'direccion': 'E22', 
                'distrito': 'E24',
                'tipo_sitio': 'L24',
                
                // III. DATOS DEL INSPECTOR 
                'inspector_nombre': 'D28', 
                'inspector_cargo': 'I28', 
                'inspector_empresa': 'O28', 
                'inspector_dni': 'T28',
                'fecha_inicio': 'F30', 
                'fecha_fin': 'R30',
                
                // --- MAPEO DE COMENTARIOS (Columna K) ---
                'p_concreto_1_comentario': 'K34', 'p_concreto_2_comentario': 'K35', 'p_concreto_3_comentario': 'K36',
                // ... (El resto del mapeo de comentarios sigue igual)
                'p_anclaje_1_comentario': 'K38', 'p_anclaje_2_comentario': 'K39', 'p_anclaje_3_comentario': 'K40',
                'p_base_1_comentario': 'K42', 'p_base_2_comentario': 'K43', 'p_base_3_comentario': 'K44',
                'p_conexion_1_comentario': 'K47', 'p_conexion_2_comentario': 'K48', 'p_conexion_3_comentario': 'K49',
                'p_estructura_1_comentario': 'K50', 'p_estructura_2_comentario': 'K51', 'p_estructura_3_comentario': 'K52',
                'p_corrosion_1_comentario': 'K54', 
                'p_corrosion_10_comentario': 'K65', 
                'p_corrosion_17_comentario': 'K70', 'p_corrosion_18_comentario': 'K71',
                'p_alineamiento_1_comentario': 'K73', 'p_alineamiento_2_comentario': 'K74',
                'p_adicional_1_comentario': 'K79', 
                'p_adicional_5_comentario': 'K83', 
                
                // --- MAPEO DE PARALIZACIÓN (Columna I) ---
                'p_concreto_1_paralizacion': 'I34', 'p_concreto_2_paralizacion': 'I35', 'p_concreto_3_paralizacion': 'I36',
                // ... (El resto del mapeo de paralización sigue igual)
                'p_anclaje_1_paralizacion': 'I38', 'p_anclaje_2_paralizacion': 'I39', 'p_anclaje_3_paralizacion': 'I40',
                'p_base_1_paralizacion': 'I42', 'p_base_2_paralizacion': 'I43', 'p_base_3_paralizacion': 'I44',
                'p_conexion_1_paralizacion': 'I47', 'p_conexion_2_paralizacion': 'I48', 'p_conexion_3_paralizacion': 'I49',
                'p_estructura_1_paralizacion': 'I50', 'p_estructura_2_paralizacion': 'I51', 'p_estructura_3_paralizacion': 'I52',
                'p_corrosion_1_paralizacion': 'I54', 
                'p_corrosion_10_paralizacion': 'I65', 
                'p_corrosion_17_paralizacion': 'I70', 'p_corrosion_18_paralizacion': 'I71',
                'p_alineamiento_1_paralizacion': 'I73', 'p_alineamiento_2_paralizacion': 'I74',
                'p_adicional_1_paralizacion': 'I79', 
                'p_adicional_5_paralizacion': 'I83',
            };

            // Escribir los valores de texto y selects (paralización/comentarios) en el Excel
            Object.keys(textMapping).forEach(key => {
                const value = body[key];
                if (value) {
                    hojaDatos.getCell(textMapping[key]).value = String(value).toUpperCase();
                }
            });

            // =======================================================
            // --- B. LÓGICA DE CHECKLIST (Las X en la Columna G, H o I) ---
            // =======================================================
            
            // ... (Esta sección se mantiene exactamente igual para el checklist)
            const checklistResponses = {
                'p_concreto_1': 34, 'p_concreto_2': 35, 'p_concreto_3': 36,
                'p_anclaje_1': 38, 'p_anclaje_2': 39, 'p_anclaje_3': 40,
                'p_base_1': 42, 'p_base_2': 43, 'p_base_3': 44,
                'p_conexion_1': 47, 'p_conexion_2': 48, 'p_conexion_3': 49,
                'p_estructura_1': 50, 'p_estructura_2': 51, 'p_estructura_3': 52,
                'p_corrosion_1': 54, 'p_corrosion_10': 65, 'p_corrosion_17': 70, 'p_corrosion_18': 71,
                'p_alineamiento_1': 73, 'p_alineamiento_2': 74,
                'p_adicional_1': 79, 'p_adicional_5': 83,
            };

            const responseColMap = { 'SI': 'G', 'NO': 'H', 'NA': 'I' };

            Object.keys(checklistResponses).forEach(inputName => {
                const respuesta = body[inputName];
                const row = checklistResponses[inputName];
                
                if (respuesta && responseColMap[respuesta]) {
                    const cellId = `${responseColMap[respuesta]}${row}`;
                    hojaDatos.getCell(cellId).value = 'X';
                    hojaDatos.getCell(cellId).alignment = { vertical: 'middle', horizontal: 'center' };
                }
            });
        }

        // --- C. PROCESAMIENTO DE FOTO ---
        const hojaFotos = workbook.getWorksheet('Reporte Fotografico');
        if (hojaFotos && req.file) {
            console.log("📸 Procesando imagen...");
            const imageId = workbook.addImage({
                buffer: req.file.buffer,
                extension: 'jpeg'
            });

            hojaFotos.addImage(imageId, {
                tl: { col: 1, row: 10 }, 
                br: { col: 5, row: 24 }, 
                editAs: 'twoCell'
            });

            if(body.descripcionFoto) {
                hojaFotos.getCell('B24').value = String(body.descripcionFoto);
            }
        }

        // --- D. RESPUESTA Y DESCARGA ---
        const nombreArchivo = `Reporte_${body.nombre_site || 'OOCC'}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);
        
        workbook.calcProperties.fullCalcOnLoad = true;

        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);
        console.log("✅ Reporte generado y enviado con éxito.");

    } catch (error) {
        console.error("❌ Error generando reporte:", error);
        res.status(500).send('Error interno en el servidor: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor listo en puerto ${PORT}`));