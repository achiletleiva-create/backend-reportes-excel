const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
// 🟢 USAMOS MEMORIA: Es más rápido y evita errores de carpetas en Render
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => res.send('✅ Servidor OOCC v4 (Frontend Update) - ONLINE'));

app.post('/generar-reporte', upload.single('foto'), async (req, res) => {
    try {
        console.log("📥 Recibiendo solicitud de reporte...");
        
        // 1. CARGA DE PLANTILLA
        const templatePath = path.join(__dirname, 'templates', 'template_oocc.xlsx');
        if (!fs.existsSync(templatePath)) throw new Error(`CRÍTICO: No existe plantilla en ${templatePath}`);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);
        
        const body = req.body; // Aquí vienen los datos del HTML
        const hojaDatos = workbook.getWorksheet('Insp. Estructura'); // Asegúrate que la hoja se llame así en el Excel

        if (hojaDatos) {
            // --- A. MAPEOS DE TEXTO (Inputs de texto y Paralización) ---
            // Mapeamos los 'name' del HTML a las celdas EXCEL específicas.
            const textMapping = {
                // Cabecera
                'personal_01_nombre': 'D13', 'personal_01_cargo': 'H13', 'personal_01_empresa': 'J13', 'personal_01_dni': 'M13',
                'nombre_site': 'D17', 'prioridad': 'D18', 
                'direccion': 'D20', 'distrito': 'D21', 'tipo_sitio': 'K21',
                'inspector_nombre': 'E28', 'inspector_cargo': 'E28', // Asumiendo celdas (ajusta según tu excel real)
                'inspector_empresa': 'H28', 'inspector_dni': 'L28',
                'fecha_inicio': 'E29', 'fecha_fin': 'I29',

                // Campos de "Paralización" (Selects SI/NO) y "Comentarios"
                // Basado en tu HTML: name="p_concreto_1_paralizacion"
                'p_concreto_1_paralizacion': 'F34', 'p_concreto_1_comentario': 'I34',
                'p_concreto_2_paralizacion': 'F35', 'p_concreto_2_comentario': 'I35',
                'p_concreto_3_paralizacion': 'F36', 'p_concreto_3_comentario': 'I36',
                
                'p_anclaje_1_paralizacion': 'F38', 'p_anclaje_1_comentario': 'I38',
                'p_anclaje_2_paralizacion': 'F39', 'p_anclaje_2_comentario': 'I39',
                'p_anclaje_3_paralizacion': 'F40', 'p_anclaje_3_comentario': 'I40',

                'p_base_1_paralizacion': 'F42', 'p_base_1_comentario': 'I42',
                'p_base_2_paralizacion': 'F43', 'p_base_2_comentario': 'I43',
                'p_base_3_paralizacion': 'F44', 'p_base_3_comentario': 'I44',

                'p_conexion_1_paralizacion': 'F47', 'p_conexion_1_comentario': 'I47',
                'p_conexion_2_paralizacion': 'F48', 'p_conexion_2_comentario': 'I48',
                'p_conexion_3_paralizacion': 'F49', 'p_conexion_3_comentario': 'I49',

                'p_estructura_1_paralizacion': 'F50', 'p_estructura_1_comentario': 'I50',
                'p_estructura_2_paralizacion': 'F51', 'p_estructura_2_comentario': 'I51',
                'p_estructura_3_paralizacion': 'F52', 'p_estructura_3_comentario': 'I52',

                'p_corrosion_1_paralizacion': 'F55', 'p_corrosion_1_comentario': 'I55',
                'p_corrosion_10_paralizacion': 'F65', 'p_corrosion_10_comentario': 'I65',
                'p_corrosion_17_paralizacion': 'F70', 'p_corrosion_17_comentario': 'I70',
                'p_corrosion_18_paralizacion': 'F71', 'p_corrosion_18_comentario': 'I71',

                'p_alineamiento_1_paralizacion': 'F74', 'p_alineamiento_1_comentario': 'I74',
                'p_alineamiento_2_paralizacion': 'F75', 'p_alineamiento_2_comentario': 'I75',

                'p_adicional_1_paralizacion': 'F79', 'p_adicional_1_comentario': 'I79',
                'p_adicional_5_paralizacion': 'F83', 'p_adicional_5_comentario': 'I83',
            };

            Object.keys(textMapping).forEach(key => {
                if (body[key]) {
                    hojaDatos.getCell(textMapping[key]).value = body[key].toUpperCase(); // Convertimos a mayúsculas
                }
            });

            // --- B. LÓGICA DE CHECKLIST (Las X) ---
            // Diccionario: 'name del input': Fila en Excel
            const checklistRows = {
                'p_concreto_1': 34, 'p_concreto_2': 35, 'p_concreto_3': 36,
                'p_anclaje_1': 38, 'p_anclaje_2': 39, 'p_anclaje_3': 40,
                'p_base_1': 42, 'p_base_2': 43, 'p_base_3': 44,
                'p_conexion_1': 47, 'p_conexion_2': 48, 'p_conexion_3': 49,
                'p_estructura_1': 50, 'p_estructura_2': 51, 'p_estructura_3': 52,
                'p_corrosion_1': 55, 'p_corrosion_10': 65, 'p_corrosion_17': 70, 'p_corrosion_18': 71,
                'p_alineamiento_1': 74, 'p_alineamiento_2': 75,
                'p_adicional_1': 79, 'p_adicional_5': 83
            };

            const colMap = { 'SI': 'C', 'NO': 'D', 'NA': 'E' };

            Object.keys(checklistRows).forEach(inputName => {
                const respuesta = body[inputName]; // "SI", "NO", "NA"
                const row = checklistRows[inputName]; // Número de fila
                
                if (respuesta && colMap[respuesta]) {
                    const cellId = `${colMap[respuesta]}${row}`; // Ej: "C34"
                    hojaDatos.getCell(cellId).value = 'X'; 
                    hojaDatos.getCell(cellId).alignment = { vertical: 'middle', horizontal: 'center' };
                }
            });
        }

        // --- C. PROCESAMIENTO DE FOTO ---
        const hojaFotos = workbook.getWorksheet('Reporte Fotografico');
        if (hojaFotos && req.file) {
            console.log("📸 Procesando imagen...");
            // Agregar imagen al libro
            const imageId = workbook.addImage({
                buffer: req.file.buffer,
                extension: 'jpeg' // ExcelJS maneja png/jpeg. Si subes png, puedes cambiar esto dinámicamente o dejarlo en jpeg que es compatible.
            });

            // Insertar en celda B10:E11 (ajustar según tu plantilla)
            hojaFotos.addImage(imageId, {
                tl: { col: 1, row: 10 }, // Columna B (index 1), Fila 11 (index 10)
                br: { col: 4, row: 11 }, // Extender hasta E
                editAs: 'twoCell'
            });

            // Descripción de la foto
            if(body.descripcionFoto) {
                hojaFotos.getCell('B24').value = body.descripcionFoto;
            }
        }

        // --- D. RESPUESTA ---
        const nombreArchivo = `Reporte_${body.nombre_site || 'OOCC'}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);
        
        // Forzar recálculo de fórmulas al abrir el Excel
        workbook.calcProperties.fullCalcOnLoad = true;

        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);
        console.log("✅ Reporte generado y enviado con éxito.");

    } catch (error) {
        console.error("❌ Error generando reporte:", error);
        res.status(500).send('Error interno: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor listo en puerto ${PORT}`));