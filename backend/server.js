const express = require('express');
const ExcelJS = require('exceljs');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Configuración de Express y middleware
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración para recibir FormData (incluyendo archivos)
const upload = multer({ dest: 'uploads/' });

// Middleware CORS (Importante para comunicación entre Frontend y Render)
app.use((req, res, next) => {
    // Reemplaza '*' con la URL de tu frontend si deseas más seguridad
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Definición de las rutas del archivo, asumiendo que el template está en /templates/
const templatePath = path.join(__dirname, 'templates', 'template_oocc.xlsx');
const imageTempPath = 'uploads/temp_image.png'; // Ruta temporal para la imagen

// -----------------------------------------------------------------------------
// 📋 MAPEO DE CELDAS CRÍTICAS (SECCIONES I, II, III) - ¡CORREGIDO Y ALINEADO CON HTML!
// -----------------------------------------------------------------------------

const cellMapping = {
    // I. DATOS DEL COOPERADOR (USANDO FILA 1, ASUMIENDO UN SOLO COOPERADOR)
    'razon_social': 'E11', 
    'ruc': 'T11',
    'personal_01_nombre': 'D12', 
    'personal_01_cargo': 'K12',
    'personal_01_empresa': 'E14',
    'personal_01_dni': 'M14',

    // II. DATOS DEL PROYECTO Y SITE
    'nombre_site': 'D20', // Nombre Site
    'prioridad': 'M20',
    'direccion': 'D21',
    'distrito': 'D22', 
    'tipo_sitio': 'H22',
    
    // III. DATOS DEL INSPECTOR
    'inspector_nombre': 'D27',
    'inspector_cargo': 'K27',
    'inspector_empresa': 'E28',
    'inspector_dni': 'M28',
    'fecha_inicio': 'E30', // Fecha Inspección (antes fecha_inspeccion)
    'fecha_fin': 'R30'
};

// -----------------------------------------------------------------------------
// 📝 MAPEO DE FILAS PARA CHECKLIST (SECCIÓN IV) - ¡CORREGIDO Y DETALLADO!
// -----------------------------------------------------------------------------
const checklistRows = {
    // CIMENTACIÓN - CONDICIONES DEL CONCRETO (Filas 34-36)
    'p_concreto_1': 34, 
    'p_concreto_2': 35, 
    'p_concreto_3': 36,

    // CIMENTACIÓN - ESTADO DE ANCLAJES (Filas 38-40)
    'p_anclaje_1': 38,
    'p_anclaje_2': 39,
    'p_anclaje_3': 40,

    // CIMENTACIÓN - ESTADO DE PLANCHA BASE (Filas 42-44)
    'p_base_1': 42,
    'p_base_2': 43,
    'p_base_3': 44,

    // ESTRUCTURA METALICA - CONEXIONES (Filas 46-48)
    'p_conexion_1': 46,
    'p_conexion_2': 47,
    'p_conexion_3': 48,
    
    // ESTRUCTURA METALICA - ESTRUCTURA (Filas 49-51)
    'p_estructura_1': 49,
    'p_estructura_2': 50,
    'p_estructura_3': 51,

    // OXIDACIÓN Y CORROSIÓN DE ELEMENTOS (Filas 53-70)
    // Usamos el índice de tu HTML para mantener la coincidencia
    'p_corrosion_1': 53, 
    // ... p_corrosion_2 a p_corrosion_9 (Omitidos, si no están en HTML) ...
    'p_corrosion_10': 62, // Fila 62 (Pregunta 26)
    // ... p_corrosion_11 a p_corrosion_16 (Omitidos, si no están en HTML) ...
    'p_corrosion_17': 69, // Fila 69 (Pregunta 33)
    'p_corrosion_18': 70, // Fila 70 (Pregunta 34)

    // ALINEAMIENTO Y ESTABILIDAD (Filas 72-74)
    'p_alineamiento_1': 72, // Fila 72 (Pregunta 35)
    'p_alineamiento_2': 73, // Fila 73 (Pregunta 36)
    // ... p_alineamiento_3 a p_alineamiento_4 (Omitidos, si no están en HTML) ...

    // ADICIONALES (Filas 77-82)
    'p_adicional_1': 77, // Fila 77 (Pregunta 40)
    // ... p_adicional_2 a p_adicional_4 (Omitidos, si no están en HTML) ...
    'p_adicional_5': 81, // Fila 81 (Pregunta 44)
    // ... p_adicional_6 (Omitido) ...
};

// -----------------------------------------------------------------------------
// FUNCIÓN PRINCIPAL DE GENERACIÓN DE REPORTE
// -----------------------------------------------------------------------------

app.post('/generar-reporte', upload.single('foto'), async (req, res) => {
    // 1. Obtener datos y archivos
    const datosRecibidos = req.body;
    let workbook;
    let imageId;

    try {
        console.log('Iniciando generación de reporte...');
        
        // Cargar el archivo de plantilla
        workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);
        const hojaDatos = workbook.getWorksheet(1); // Hoja 1: Reporte

        // 2. Insertar Datos Generales (Secciones I, II, III)
        for (const key in cellMapping) {
            if (datosRecibidos[key]) {
                hojaDatos.getCell(cellMapping[key]).value = datosRecibidos[key];
            }
        }
        
        // 3. Procesar Checklist (Sección IV) y realizar cálculos
        let countSI = 0;
        let countNO = 0;
        
        for (const key in checklistRows) {
            const rowNumber = checklistRows[key];
            const respuesta = datosRecibidos[key]; // Ejemplo: 'p_concreto_1' -> SI/NO/NA
            
            // 3.1 Insertar Respuesta (Columna G)
            if (respuesta) {
                hojaDatos.getCell(`G${rowNumber}`).value = respuesta;
            }
            
            // 3.2 Insertar Paralización (Columna I)
            const keyParalizacion = `${key}_paralizacion`; // Clave: p_concreto_1_paralizacion
            // El HTML envía "SI" o "NO". Si se envió "SI", insertamos 'X'
            if (datosRecibidos[keyParalizacion] === 'SI') {
                hojaDatos.getCell(`I${rowNumber}`).value = 'X';
            } else if (datosRecibidos[keyParalizacion] === 'NO') {
                // Si el valor es 'NO' lo dejamos vacío o lo limpiamos si es necesario
                hojaDatos.getCell(`I${rowNumber}`).value = ''; 
            }
            
            // 3.3 Insertar Comentarios (Columna K)
            const keyComentario = `${key}_comentario`; // Clave: p_concreto_1_comentario
            if (datosRecibidos[keyComentario]) {
                hojaDatos.getCell(`K${rowNumber}`).value = datosRecibidos[keyComentario];
            }

            // 3.4 Conteo para Resultados (Sección V)
            if (respuesta === 'SI') {
                countSI++;
            } else if (respuesta === 'NO') {
                countNO++;
            }
        }

        // 4. Insertar Resultados (Sección V) - Celdas H88, H89, H90
        const totalAplicable = countSI + countNO;
        let calificacion = 0;
        
        if (totalAplicable > 0) {
            // El porcentaje se calcula como (Respuestas 'NO' / Total Aplicable) * 100
            calificacion = (countNO / totalAplicable) * 100;
        }

        // Se inserta en las celdas H88, H89, H90 (CORREGIDO)
        hojaDatos.getCell('H88').value = totalAplicable; // Cantidad de SI/NO
        hojaDatos.getCell('H89').value = totalAplicable; // Cantidad Preguntas Aplicables
        hojaDatos.getCell('H90').value = calificacion;   // Calificación Lograda %

        // 5. Procesar Imagen (Hoja 4)
        if (req.file) {
            const tempFilePath = req.file.path;
            const extension = path.extname(req.file.originalname).toLowerCase();

            // Usar fs.rename para cambiar el nombre temporal al nombre deseado
            const newImagePath = path.join('uploads', `temp_image${extension}`);
            fs.renameSync(tempFilePath, newImagePath);
            
            // Cargar la imagen en el Workbook
            imageId = workbook.addImage({
                filename: newImagePath,
                extension: extension.replace('.', ''),
            });

            const hojaFoto = workbook.getWorksheet(4); // Hoja 4: Reporte Fotográfico
            
            // Insertar la imagen en la hoja 4
            hojaFoto.addImage(imageId, {
                tl: { col: 1, row: 2 }, // Esquina superior izquierda (Ej: B2)
                br: { col: 11, row: 28 }, // Esquina inferior derecha (Ej: L28)
                editAs: 'absolute', // No reescala con las celdas
            });

            // Insertar la descripción de la foto si existe (Ejemplo: Celda A30)
            if (datosRecibidos.descripcionFoto) {
                hojaFoto.getCell('B30').value = datosRecibidos.descripcionFoto;
            }

            // Limpiar el archivo de imagen temporal
            fs.unlinkSync(newImagePath);
        }


        // 6. Enviar el archivo final
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Reporte_OOCC.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
        console.log('Reporte generado y enviado con éxito.');

    } catch (error) {
        console.error('Error al generar o enviar el reporte:', error);
        res.status(500).send('Error interno del servidor al procesar el reporte: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor OOCC v4 (Alineación Final) - ONLINE en puerto ${PORT}`);
});