// ... (Configuración de Express, Multer, ExcelJS, y CORS - NO MODIFICADA) ...

app.post('/generar-reporte', upload.single('foto'), async (req, res) => {
    try {
        console.log("📥 Recibiendo solicitud de reporte...");
        
        // 1. CARGA DE PLANTILLA (Lógica NO MODIFICADA)
        // ...
        
        const body = req.body; 
        const hojaDatos = workbook.getWorksheet('Insp. Estructura'); 

        if (hojaDatos) {
            
            // =======================================================
            // --- A. MAPEOS DE TEXTO Y VALORES DE CABECERA Y COMENTARIOS ---
            // =======================================================
            const textMapping = {
                // I. DATOS DEL COOPERADOR (SIN CAMBIOS, MANTENIDO)
                'razon_social': 'E11', 'ruc': 'T11', 
                'personal_01_nombre': 'D12', 'personal_01_cargo': 'H12', 'personal_01_empresa': 'O12', 'personal_01_dni': 'T12',
                'personal_01_nombre_2': 'D13', 'personal_01_cargo_2': 'H13', 'personal_01_empresa_2': 'O13', 'personal_01_dni_2': 'T13',
                'personal_01_nombre_3': 'D14', 'personal_01_cargo_3': 'H14', 'personal_01_empresa_3': 'O14', 'personal_01_dni_3': 'T14',
                'personal_01_nombre_4': 'D15', 'personal_01_cargo_4': 'H15', 'personal_01_empresa_4': 'O15', 'personal_01_dni_4': 'T15',
                'personal_01_nombre_5': 'D16', 'personal_01_cargo_5': 'H16', 'personal_01_empresa_5': 'O16', 'personal_01_dni_5': 'T16', 
                
                // II. DATOS DEL PROYECTO Y SITE (SIN CAMBIOS, MANTENIDO)
                'nombre_site': 'E20', 'proyecto': 'L20', 'solucion': 'T20', 
                'prioridad': 'E21', 'actividad_campo': 'L21', 'n_mop': 'T21', 
                'direccion': 'E22', 'actividad_mop': 'L22', 'n_contrato': 'T22',
                'acceso_contingente': 'E23', 'comentarios_proyecto': 'L23',
                'distrito': 'E24', 'tipo_sitio': 'L24', 'servicio_inspeccionado': 'T24',
                
                // III. DATOS DEL INSPECTOR (CAMPOS AGREGADOS RECIENTEMENTE)
                'inspector_01_nombre': 'D28', 'inspector_01_cargo': 'I28', 'inspector_01_empresa': 'O28', 'inspector_01_dni': 'T28',
                'inspector_02_nombre': 'D29', 'inspector_02_cargo': 'I29', 'inspector_02_empresa': 'O29', 'inspector_02_dni': 'T29',
                'fecha_inicio': 'F30', 'fecha_fin': 'R30',
                
                // --- MAPEO DE COMENTARIOS (Columna K) - TODOS AGREGADOS ---
                // CIMENTACIÓN - CONDICIONES DEL CONCRETO (K34-K36)
                'p_concreto_1_comentario': 'K34', 'p_concreto_2_comentario': 'K35', 'p_concreto_3_comentario': 'K36',
                // CIMENTACIÓN - ESTADO DE ANCLAJES Y PERNOS DE CIMENTACIÓN (K38-K40)
                'p_anclaje_1_comentario': 'K38', 'p_anclaje_2_comentario': 'K39', 'p_anclaje_3_comentario': 'K40',
                // CIMENTACIÓN - ESTADO DE PLANCHA BASE (K42-K45)
                'p_base_1_comentario': 'K42', 'p_base_2_comentario': 'K43', 'p_base_3_comentario': 'K44', 'p_base_4_comentario': 'K45', 
                // ESTRUCTURA METALICA - CONEXIONES (K47-K52)
                'p_conexion_1_comentario': 'K47', 'p_conexion_2_comentario': 'K48', 'p_conexion_3_comentario': 'K49',
                'p_conexion_4_comentario': 'K50', 
                'p_conexion_5_comentario': 'K51', 
                'p_conexion_6_comentario': 'K52', 
                // ESTRUCTURA METALICA - OXIDACIÓN Y CORROSIÓN DE ELEMENTOS ESTRUCTURALES (K54-K71)
                'p_corrosion_1_comentario': 'K54', 'p_corrosion_2_comentario': 'K55', 'p_corrosion_3_comentario': 'K56', 'p_corrosion_4_comentario': 'K57', 'p_corrosion_5_comentario': 'K58', 'p_corrosion_6_comentario': 'K59', 'p_corrosion_7_comentario': 'K60', 'p_corrosion_8_comentario': 'K61',
                'p_corrosion_9_comentario': 'K62', 'p_corrosion_10_comentario': 'K63', 'p_corrosion_11_comentario': 'K64', 'p_corrosion_12_comentario': 'K65', 'p_corrosion_13_comentario': 'K66', 'p_corrosion_14_comentario': 'K67', 'p_corrosion_15_comentario': 'K68', 'p_corrosion_16_comentario': 'K69',
                'p_corrosion_17_comentario': 'K70', 'p_corrosion_18_comentario': 'K71',
                // ESTRUCTURA METALICA - ALINEAMIENTO Y ESTABILIDAD (K73-K77)
                'p_alineamiento_1_comentario': 'K73', 'p_alineamiento_2_comentario': 'K74', 'p_alineamiento_3_comentario': 'K75', 'p_alineamiento_4_comentario': 'K76', 'p_alineamiento_5_comentario': 'K77',
                // ADICIONALES (K79-K84)
                'p_adicional_1_comentario': 'K79', 'p_adicional_2_comentario': 'K80', 'p_adicional_3_comentario': 'K81', 'p_adicional_4_comentario': 'K82', 'p_adicional_5_comentario': 'K83', 'p_adicional_6_comentario': 'K84',

                // --- MAPEO DE PARALIZACIÓN (Columna I) - TODOS AGREGADOS ---
                // CIMENTACIÓN - CONDICIONES DEL CONCRETO
                'p_concreto_1_paralizacion': 'I34', 'p_concreto_2_paralizacion': 'I35', 'p_concreto_3_paralizacion': 'I36',
                // CIMENTACIÓN - ESTADO DE ANCLAJES Y PERNOS DE CIMENTACIÓN
                'p_anclaje_1_paralizacion': 'I38', 'p_anclaje_2_paralizacion': 'I39', 'p_anclaje_3_paralizacion': 'I40',
                // CIMENTACIÓN - ESTADO DE PLANCHA BASE
                'p_base_1_paralizacion': 'I42', 'p_base_2_paralizacion': 'I43', 'p_base_3_paralizacion': 'I44', 'p_base_4_paralizacion': 'I45', 
                // ESTRUCTURA METALICA - CONEXIONES
                'p_conexion_1_paralizacion': 'I47', 'p_conexion_2_paralizacion': 'I48', 'p_conexion_3_paralizacion': 'I49',
                'p_conexion_4_paralizacion': 'I50', 
                'p_conexion_5_paralizacion': 'I51', 
                'p_conexion_6_paralizacion': 'I52', 
                // ESTRUCTURA METALICA - OXIDACIÓN Y CORROSIÓN DE ELEMENTOS ESTRUCTURALES
                'p_corrosion_1_paralizacion': 'I54', 'p_corrosion_2_paralizacion': 'I55', 'p_corrosion_3_paralizacion': 'I56', 'p_corrosion_4_paralizacion': 'I57', 'p_corrosion_5_paralizacion': 'I58', 'p_corrosion_6_paralizacion': 'I59', 'p_corrosion_7_paralizacion': 'I60', 'p_corrosion_8_paralizacion': 'I61',
                'p_corrosion_9_paralizacion': 'I62', 'p_corrosion_10_paralizacion': 'I63', 'p_corrosion_11_paralizacion': 'I64', 'p_corrosion_12_paralizacion': 'I65', 'p_corrosion_13_paralizacion': 'I66', 'p_corrosion_14_paralizacion': 'I67', 'p_corrosion_15_paralizacion': 'I68', 'p_corrosion_16_paralizacion': 'I69',
                'p_corrosion_17_paralizacion': 'I70', 'p_corrosion_18_paralizacion': 'I71',
                // ESTRUCTURA METALICA - ALINEAMIENTO Y ESTABILIDAD
                'p_alineamiento_1_paralizacion': 'I73', 'p_alineamiento_2_paralizacion': 'I74', 'p_alineamiento_3_paralizacion': 'I75', 'p_alineamiento_4_paralizacion': 'I76', 'p_alineamiento_5_paralizacion': 'I77',
                // ADICIONALES
                'p_adicional_1_paralizacion': 'I79', 'p_adicional_2_paralizacion': 'I80', 'p_adicional_3_paralizacion': 'I81', 'p_adicional_4_paralizacion': 'I82', 'p_adicional_5_paralizacion': 'I83', 'p_adicional_6_paralizacion': 'I84',
            };

            // Escribir los valores de texto y selects (Lógica NO MODIFICADA)
            Object.keys(textMapping).forEach(key => {
                // ...
            });

            // =======================================================
            // --- B. LÓGICA DE CHECKLIST (Las X en la Columna G o H) ---
            // =======================================================
            
            // Mapeo de campos del formulario a filas de Excel (TODOS AGREGADOS)
            const checklistResponses = {
                // CIMENTACIÓN - CONDICIONES DEL CONCRETO
                'p_concreto_1': 34, 'p_concreto_2': 35, 'p_concreto_3': 36,
                // CIMENTACIÓN - ESTADO DE ANCLAJES Y PERNOS DE CIMENTACIÓN
                'p_anclaje_1': 38, 'p_anclaje_2': 39, 'p_anclaje_3': 40,
                // CIMENTACIÓN - ESTADO DE PLANCHA BASE
                'p_base_1': 42, 'p_base_2': 43, 'p_base_3': 44, 'p_base_4': 45, 
                // ESTRUCTURA METALICA - CONEXIONES
                'p_conexion_1': 47, 'p_conexion_2': 48, 'p_conexion_3': 49,
                'p_conexion_4': 50, 'p_conexion_5': 51, 'p_conexion_6': 52, 
                // ESTRUCTURA METALICA - OXIDACIÓN Y CORROSIÓN DE ELEMENTOS ESTRUCTURALES
                'p_corrosion_1': 54, 'p_corrosion_2': 55, 'p_corrosion_3': 56, 'p_corrosion_4': 57, 'p_corrosion_5': 58, 'p_corrosion_6': 59, 'p_corrosion_7': 60, 'p_corrosion_8': 61,
                'p_corrosion_9': 62, 'p_corrosion_10': 63, 'p_corrosion_11': 64, 'p_corrosion_12': 65, 'p_corrosion_13': 66, 'p_corrosion_14': 67, 'p_corrosion_15': 68, 'p_corrosion_16': 69,
                'p_corrosion_17': 70, 'p_corrosion_18': 71, 
                // ESTRUCTURA METALICA - ALINEAMIENTO Y ESTABILIDAD
                'p_alineamiento_1': 73, 'p_alineamiento_2': 74, 'p_alineamiento_3': 75, 'p_alineamiento_4': 76, 'p_alineamiento_5': 77, 
                // ADICIONALES
                'p_adicional_1': 79, 'p_adicional_2': 80, 'p_adicional_3': 81, 'p_adicional_4': 82, 'p_adicional_5': 83, 'p_adicional_6': 84, 
            };

            // ... (La lógica de marcar la X en G, H o I - NO MODIFICADA) ...
            
        }

        // --- C. PROCESAMIENTO DE FOTO (Lógica NO MODIFICADA) ---
        // ...

        // --- D. RESPUESTA Y DESCARGA (Lógica NO MODIFICADA) ---
        // ...

    } catch (error) {
        // ...
    }
});

// ... (Puerto de escucha - NO MODIFICADO) ...