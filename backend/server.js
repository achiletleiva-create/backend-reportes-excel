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
        const hojaDatos = workbook.getWorksheet('Insp. Estructura'); // Asumiendo que es el nombre de la hoja correcta.

        if (!hojaDatos) {
            console.warn('⚠️ No se encontró la hoja "Insp. Estructura"');
            throw new Error('No se encontró la hoja de datos principal.');
        }

        // ---------------------------------------------------------
        // A. MAPEO DE DATOS DE TEXTO SIMPLES (USANDO TUS CELDAS FINALES)
        // ---------------------------------------------------------
        const cellMapping = {
            // SECCIÓN I: COOPERADOR (USANDO CELDAS E11, T11, D12, etc.)
            'razon_social': 'E11', 
            'ruc': 'T11',
            'personal_01_nombre': 'D12',
            'personal_01_cargo': 'H12',
            'personal_01_empresa': 'O12',
            'personal_01_dni': 'T12',
            'personal_01_nombre_2': 'D13',
            'personal_01_cargo_2': 'H13',
            'personal_01_empresa_2': 'O13',
            'personal_01_dni_2': 'T13',
            'personal_01_nombre_3': 'D14',
            'personal_01_cargo_3': 'H14',
            'personal_01_empresa_3': 'O14',
            'personal_01_dni_3': 'T14',
            'personal_01_nombre_4': 'D15',
            'personal_01_cargo_4': 'H15',
            'personal_01_empresa_4': 'O15',
            'personal_01_dni_4': 'T15',
            'personal_01_nombre_5': 'D16',
            'personal_01_cargo_5': 'H16',
            'personal_01_empresa_5': 'O16',
            'personal_01_dni_5': 'T16',
            
            // SECCIÓN II: SITE / PROYECTO (USANDO CELDAS E20, L20, T20, etc.)
            'nombre_site': 'E20',
            'proyecto': 'L20',
            'solucion': 'T20',
            'prioridad': 'E21',
            'ACTIVIDAD_IDENTIFICADA_EN_CAMPO': 'L21',
            'N_MOP': 'T21',
            'direccion': 'E22',
            'ACTIVIDAD_IDENTIFICADA_EN_MOP': 'L22',
            'N_CONTRATO': 'T22',
            'ACCESO_CONTINGENTE': 'E23',
            'comentarios': 'L23',
            'DPTO_PROV_DISTRITO': 'E24',
            'TIPO_DE_SITIO': 'L24',
            'SERVICIO_INSPECCIONADO': 'T24',

            // SECCIÓN III: INSPECTOR (USANDO CELDAS D28, I28, O28, etc.)
            'inspector_01_nombre': 'D28',
            'inspector_01_cargo': 'I28',
            'inspector_01_empresa': 'O28',
            'inspector_01_dni': 'T28',
            'inspector_02_nombre': 'D29',
            'inspector_02_cargo': 'I29',
            'inspector_02_empresa': 'O29',
            'inspector_02_dni': 'T29',
            'fecha_inicio': 'F30',
            'fecha_fin': 'R30',
            
            // Si la descripción de la foto va en la hoja de datos, mapea el campo
            'descripcionFoto': 'N8', // Mantenido, asumiendo que aplica.
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
        // B. LOGICA DE CHECKLIST (SI/NO/NA, COMENTARIOS, PARALIZACIÓN)
        // ---------------------------------------------------------
        
        // Mapeo de FILA: p_nombre_campo -> Fila del Excel
        const checklistRows = {
            // CIMENTACIÓN - CONDICIONES DEL CONCRETO (Inicio Fila 34)
            'p_concreto_1': 34, // Fisuras (G34, I34, K34)
            'p_concreto_2': 35, // Desprendimientos
            'p_concreto_3': 36, // Humedad
            // ESTADO DE ANCLAJES (Inicio Fila 38)
            'p_anclaje_1': 38, // Grouting
            'p_anclaje_2': 39, // Óxido
            'p_anclaje_3': 40, // Tuerca y contra tuerca
            // ESTADO DE PLANCHA BASE (Inicio Fila 42)
            'p_base_1': 42, // Deformación
            'p_base_2': 43, // Óxido
            'p_base_3': 44, // Fisuras en plancha
            'p_base_4': 45, // Fisuras en soldadura
            // ESTRUCTURA METALICA - CONEXIONES (Inicio Fila 47)
            'p_conexion_1': 47, // Pernos faltantes
            'p_conexion_2': 48, // Óxido en pernos
            'p_conexion_3': 49, // Tuerca y contratuerca
            // ESTRUCTURA METALICA - ESTRUCTURA
            'p_estructura_1': 50, // Óxido en planchas
            'p_estructura_2': 51, // Fisuras en plancha
            'p_estructura_3': 52, // Fisuras en soldadura
            // OXIDACIÓN Y CORROSIÓN (Inicio Fila 54)
            'p_corrosion_1': 54, // Óxido en montantes (Corregido a Fila 54)
            'p_corrosion_2': 55, // Óxido en diagonales
            'p_corrosion_3': 56, // Óxido en redundantes
            'p_corrosion_4': 57, // Óxido en horizontales
            'p_corrosion_5': 58, // Óxido en escaleras de acceso y cables
            'p_corrosion_6': 59, // Óxido en línea de vida
            'p_corrosion_7': 60, // Óxido en roldanas
            'p_corrosion_8': 61, // Óxido en soportes
            'p_corrosion_9': 62, // Corrosión en montantes
            'p_corrosion_10': 63, // Corrosión en diagonales
            'p_corrosion_11': 64, // Corrosión en redundantes
            'p_corrosion_12': 65, // Corrosión en horizontales
            'p_corrosion_13': 66, // Corrosión en escaleras de acceso y cables
            'p_corrosion_14': 67, // Corrosión en línea de vida
            'p_corrosion_15': 68, // Corrosión en roldanas
            'p_corrosion_16': 69, // Corrosión en soportes
            'p_corrosion_17': 70, // Pérdida de pintura
            'p_corrosion_18': 71, // Pérdida de galvanizado
            // ALINEAMIENTO Y ESTABILIDAD (Inicio Fila 73)
            'p_alineamiento_1': 73, // Deformación visible (Corregido a Fila 73)
            'p_alineamiento_2': 74, // Movimiento perceptible
            'p_alineamiento_3': 75, // Tensión adecuada
            'p_alineamiento_4': 76, // Fijación adecuada
            'p_alineamiento_5': 77, // Línea de vida no continuidad
            // ADICIONALES (Inicio Fila 79)
            'p_adicional_1': 79, // Empozamiento de agua
            'p_adicional_2': 80, // Filtraciones
            'p_adicional_3': 81, // Falta de limpieza
            'p_adicional_4': 82, // Acumulación de desperdicios
            'p_adicional_5': 83, // Crecimiento de vegetación
            'p_adicional_6': 84, // Acumulación de heces de aves
        };

        // NOTA CLAVE: La respuesta SI/NO/NA va en la columna G.
        // La Columna I (Paralización) y K (Comentarios) también son necesarias.

        // Mapeo de Columna para la respuesta (la respuesta SI/NO/NA va en la misma celda G)
        const colMapRespuesta = 'G'; 
        const colMapParalizacion = 'I'; 
        const colMapComentario = 'K'; 

        // Contadores para los resultados de la Sección V
        let countSI = 0;
        let countNO = 0;
        let countNA = 0;

        Object.keys(checklistRows).forEach(inputName => {
            const row = checklistRows[inputName];
            
            // 1. Manejo de la Respuesta SI/NO/NA (Columna G)
            const respuesta = datosRecibidos[inputName]; // Ejemplo: 'SI', 'NO', 'NA'
            if (respuesta) {
                const cellIdRespuesta = `${colMapRespuesta}${row}`;
                hojaDatos.getCell(cellIdRespuesta).value = respuesta; // Inyecta el texto SI/NO/NA en G34
                
                // Contar para los Resultados (Sección V)
                if (respuesta === 'SI') {
                    countSI++;
                } else if (respuesta === 'NO') {
                    countNO++;
                } else if (respuesta === 'NA') {
                    countNA++;
                }
            }
            
            // 2. Manejo de Comentario (Columna K)
            const comentario = datosRecibidos[`${inputName}_comentario`]; // Asumiendo que el campo se llama p_concreto_1_comentario
            if (comentario) {
                const cellIdComentario = `${colMapComentario}${row}`;
                hojaDatos.getCell(cellIdComentario).value = comentario; // Inyecta el comentario en K34
            }
            
            // 3. Manejo de Paralización (Columna I)
            const paralizacion = datosRecibidos[`${inputName}_paralizacion`]; // Asumiendo que el campo se llama p_concreto_1_paralizacion
            if (paralizacion) {
                const cellIdParalizacion = `${colMapParalizacion}${row}`;
                hojaDatos.getCell(cellIdParalizacion).value = 'X'; // Inyecta la 'X' si aplica paralización en I34
                hojaDatos.getCell(cellIdParalizacion).alignment = { vertical: 'middle', horizontal: 'center' };
            }
        });
        console.log('✅ Checklist de preguntas (G, I, K) inyectado y contado.');

        // ---------------------------------------------------------
        // C. CÁLCULO DE RESULTADOS (SECCIÓN V)
        // ---------------------------------------------------------
        const totalAplicable = countSI + countNO;

        let calificacionLograda = 0;
        if (totalAplicable > 0) {
            // Fórmula: (Cantidad de NO / Cantidad Preguntas Aplicables) * 100
            calificacionLograda = (countNO / totalAplicable) * 100;
        }

        // Inyectar Resultados en el Excel (USANDO TUS CELDAS H88, H89, H90)
        hojaDatos.getCell('H88').value = totalAplicable; // Cantidad de SI/NO
        hojaDatos.getCell('H89').value = totalAplicable; // Cantidad Preguntas Aplicables
        
        // H90: Calificación Lograda %
        // Nota: Asegúrate que H90 esté libre y no sea una celda que contenga una fórmula de Excel.
        hojaDatos.getCell('H90').value = `${calificacionLograda.toFixed(2)} %`; 
        console.log('✅ Resultados de Sección V calculados e inyectados.');


        // ---------------------------------------------------------
        // D. FOTO (Mantenemos la lógica original)
        // ---------------------------------------------------------
        // ... (Lógica de la foto se mantiene igual)

        // ---------------------------------------------------------
        // E. DESCARGA
        // ---------------------------------------------------------
        const nombreArchivo = `Reporte_${datosRecibidos.nombre_site || 'OOCC'}_${Date.now()}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);
        
        workbook.calcProperties.fullCalcOnLoad = true; 
        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);

    } catch (error) {
        console.error('❌ Error Grave en el proceso de reporte:', error);
        res.status(500).send('Error en servidor: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor listo en puerto ${PORT}`));