export const settingsView = {
    title: 'Configuracion',
    searchPlaceholder: 'Buscar configuracion...',
    saveSuccess: 'Configuracion guardada!',
    categories: {
        general: 'General e Interfaz',
        strains: 'Vista de Variedades',
        plants: 'Plantas y Simulacion',
        notifications: 'Notificaciones',
        defaults: 'Valores Predeterminados',
        data: 'Gestion de Datos',
        about: 'Acerca de',
        tts: 'Voz y Habla',
        privacy: 'Privacidad y Seguridad',
        accessibility: 'Accesibilidad',
        lookAndFeel: 'Apariencia',
        interactivity: 'Interactividad',
        ai: 'Configuracion de AI',
        iot: 'Hardware y IoT', // machine-translated, review needed
        grows: 'Gestion de cultivos',
    },
    security: {
        title: 'Seguridad AI (Multi-Modelo BYOK)',
        warning:
            'Tu clave API se almacena solo en este dispositivo en IndexedDB. Nunca compartas tu clave y eliminala en dispositivos compartidos.',
        geminiFreeNote:
            'Consejo: La clave API de Gemini de Google AI Studio es gratuita con una cuenta de Google en aistudio.google.com.', // machine-translated, review needed
        provider: 'Proveedor AI',
        providerDesc:
            'Selecciona el proveedor del modelo AI. Cada proveedor requiere su propia clave API.',
        apiKey: 'Clave API',
        apiKeyDesc: 'Requerida para todas las funciones AI en esta aplicacion estatica.',
        save: 'Guardar Clave',
        test: 'Validar Clave',
        clear: 'Eliminar Clave',
        openAiStudio: 'Obtener Clave API',
        stored: 'Una clave API esta guardada actualmente en este dispositivo.',
        notStored: 'Aun no se ha guardado ninguna clave API.',
        maskedPrefix: 'Clave guardada:',
        invalid: 'Por favor, introduce una clave API valida.',
        saved: 'Clave API guardada exitosamente.',
        testSuccessStored:
            'La clave API almacenada es valida y esta lista para todas las funciones AI.',
        testSuccessUnsaved:
            'La clave API ingresada es valida. Guardala para habilitar todas las funciones AI.',
        cleared: 'Clave API eliminada.',
        loadError: 'No se pudo cargar el estado de la clave API.',
        saveError: 'No se pudo guardar la clave API.',
        testError:
            'La validacion de la clave API fallo. Por favor verifica la validez y los permisos de la clave.',
        clearError: 'No se pudo eliminar la clave API.',
        usageToday:
            'Hoy: {{requests}} solicitudes, ~{{tokens}} tokens estimados, {{remaining}} solicitudes restantes (por minuto).',
        rotationLabel: 'Rotacion de clave',
        rotationToday: 'actualizada hoy',
        rotationAge: 'actualizada hace {{days}} dias',
        rotationUnknown: 'fecha de rotacion desconocida',
        rotationAdvice:
            'Rota las claves almacenadas regularmente y eliminalas inmediatamente despues de usarlas en dispositivos compartidos.',
        rotationDue:
            'Esta clave ha superado la ventana de rotacion de 90 dias y debe ser reemplazada antes de que las solicitudes AI funcionen de nuevo.',
        rotationBadge: 'Rotar ahora',
        auditLog: 'Registro de auditoria AI local',
        auditLogEmpty: 'Aun no se han registrado solicitudes AI.',
        clearAuditLog: 'Borrar registro de auditoria',
        panicButton: 'Borrado de emergencia de claves', // machine-translated, review needed
        panicButtonDesc:
            'Elimina inmediatamente TODAS las claves API almacenadas y la clave de cifrado de este dispositivo. Esto no se puede deshacer.',
        panicButtonConfirm: 'Borrar todas las claves',
        panicButtonSuccess: 'Todas las claves API y la clave de cifrado han sido eliminadas.',
        encryptionNotice: 'Transparencia del Cifrado',
        encryptionNoticeDesc:
            'Las claves API se cifran con AES-256-GCM usando una clave no exportable en IndexedDB. Protege contra la navegacion casual y ataques XSS basicos.',
        providerConsent: 'Consentimiento de Transmision de Datos',
        providerConsentPrompt:
            'Estas a punto de enviar datos de plantas (incluyendo fotos) a {{provider}}. Das tu consentimiento?',
        providerConsentRemember: 'Recordar mi eleccion para este proveedor',
        providerDpaLink: 'Ver el Acuerdo de Procesamiento de Datos',
    },
    costTracking: {
        title: 'Seguimiento de Costos AI',
        disclaimer:
            'Las estimaciones de costos son aproximadas y se basan en los precios publicados de las API. Los cargos reales pueden variar.',
        tokensToday: 'Tokens hoy',
        costToday: 'Costo est. hoy',
        last7Days: 'Ultimos 7 dias',
        monthlyBudget: 'Presupuesto mensual',
        unlimited: 'Ilimitado',
        budgetPlaceholder: 'Limite de tokens (0 = desactivado)',
        setBudget: 'Establecer',
        resetHistory: 'Restablecer historial de costos',
        budgetWarning: 'Has alcanzado tu presupuesto mensual de tokens.',
    },
    aiMode: {
        title: 'Modo de Ejecucion AI',
        description:
            'Elige como la aplicacion procesa las solicitudes AI. El modo Nube usa tu clave API para la mejor calidad, el modo Local ejecuta todo en tu dispositivo para maxima privacidad, y el modo Hibrido elige automaticamente la mejor opcion.',
        label: 'Modo AI',
        cloud: 'Nube',
        cloudDesc:
            'Todas las solicitudes AI se envian al proveedor en la nube (Gemini, OpenAI, etc.). Mejor calidad, requiere clave API y conexion a internet.',
        local: 'Local',
        localDesc:
            'Todo el AI se ejecuta en tu dispositivo usando modelos locales. Ningun dato sale del dispositivo. Funciona completamente sin conexion una vez que los modelos estan precargados.',
        hybrid: 'Hibrido (Inteligente)',
        hybridDesc:
            'Usa automaticamente modelos locales cuando estan precargados, de lo contrario recurre a la nube. Lo mejor de ambos mundos.',
        eco: 'Eco',
        ecoDesc:
            'Modo de ahorro de bateria para dispositivos de gama baja o moviles. Usa solo el modelo de texto pequeno de 0.5B y heuristicas basadas en reglas. Sin nube, sin modelos pesados.',
        ecoAutoDetected:
            'El modo Eco se activo automaticamente porque tu dispositivo tiene poca memoria o bateria.',
        activeIndicator: 'Modo activo: {{mode}}',
        localNotReady:
            'Los modelos AI locales aun no estan precargados. Precargalos a continuacion para la mejor experiencia local.',
        localReady: 'Los modelos AI locales estan cargados y listos para la inferencia.',
        switchingToLocal: 'Cambiando al modo local -- los modelos se precargaran automaticamente.',
        imageGenCloudOnly:
            'Nota: La generacion de imagenes solo esta disponible en modo Nube o Hibrido.',
    },
    offlineAi: {
        title: 'Cache AI Local Sin Conexion',
        description:
            'Precarga los modelos locales de texto y vision mientras estes en linea para que los diagnosticos sigan funcionando cuando la red no este disponible.',
        preload: 'Precargar Modelos Sin Conexion',
        preloading: 'Precargando...',
        ready: 'Los modelos sin conexion estan listos.',
        partial:
            'Algunos recursos del modelo estan listos, pero el calentamiento de la cache esta incompleto.',
        error: 'La precarga del modelo fallo. Intentalo de nuevo con una conexion estable.',
        idle: 'Aun no se ha ejecutado ninguna precarga de modelos sin conexion.',
        cacheState: 'Detalles de la cache: {{value}}',
        persistentStorage: 'Almacenamiento persistente: {{value}}',
        webGpuSupported: 'WebGPU esta disponible en este dispositivo.',
        webGpuUnavailable:
            'WebGPU no esta disponible, por lo que la aplicacion usara el respaldo de Transformer.js.',
        onnxBackend: 'Backend ONNX: {{value}}',
        webLlmReady: 'WebLLM esta listo como un entorno de ejecucion local de alto rendimiento.',
        webLlmFallback: 'WebLLM no esta activo; el AI local recurrira a Transformer.js.',
        readyAt: 'Ultima precarga exitosa: {{value}}',
        yes: 'concedido',
        no: 'no concedido',
        unknown: 'desconocido',
        offlineHint:
            'Conecta la aplicacion a internet para calentar la cache del modelo antes de depender del AI sin conexion.',
        forceWasm: 'Forzar Backend WASM',
        forceWasmHint:
            'Anula la deteccion automatica de WebGPU y siempre usa el backend WASM. Util para depuracion.',
        enableWebGpu: 'Habilitar Aceleracion WebGPU', // machine-translated, review needed
        enableWebGpuHint:
            'Usa el GPU para la inferencia AI local cuando este disponible. Ofrece inferencia 3-8x mas rapida en dispositivos compatibles. Deshabilita para forzar el modo solo CPU.',
        webGpuTier: 'Nivel GPU: {{value}}',
        webGpuVram: 'VRAM GPU: {{value}} MB',
        webGpuVendor: 'GPU: {{value}}',
        webGpuBatteryGated:
            'WebGPU en pausa -- bateria por debajo del 15%. Conecta para rehabilitar la aceleracion GPU.',
        webGpuFeatureF16: 'shader-f16: {{value}}',
        webGpuDeviceCleanup:
            'La memoria GPU se libera automaticamente cuando la pestana esta oculta durante 30 segundos.',
        preferredModel: 'Modelo de Texto Preferido',
        modelAuto: 'Auto (Qwen2.5-1.5B)',
        modelQwen25: 'Qwen2.5-1.5B (Equilibrado)',
        modelQwen3: 'Qwen2.5-0.5B (Ligero)',
        benchPreloadTime: 'Ultima precarga: {{value}} s',
        benchInferenceSpeed: 'Velocidad de inferencia: {{value}} tok/s',
        benchNotAvailable: 'Ejecuta una precarga para ver datos de rendimiento.',
        // Selector de modelo LLM
        modelSelector: {
            title: 'Seleccion de modelo LLM',
            subtitle: 'Elige que modelo de IA local usar para la generacion de texto.',
            autoLabel: 'Auto (Recomendado)',
            autoDesc: 'Selecciona automaticamente el mejor modelo para tu dispositivo.',
            currentAuto: 'Tu dispositivo: {{model}}',
            recommended: 'Recomendado',
            downloadSize: '{{size}} MB descarga',
            largeDownload: 'Descarga grande',
            loading: 'Cargando modelo...',
            'model_0.5B_desc':
                'Modelo ultraligero para cualquier dispositivo. Rapido pero calidad limitada.',
            'model_1.5B_desc':
                'Modelo equilibrado para GPUs de gama media. Buen soporte multilingue.',
            model_3B_desc: 'Razonamiento de alta calidad. Mejor opcion para GPUs potentes.',
            model_4B_desc: 'Fuerte razonamiento y seguimiento de instrucciones. Opcion mas grande.',
        },
        // Embedding & Semantic RAG
        embeddingModelReady: 'El modelo de embedding (MiniLM) esta listo para busqueda semantica.',
        embeddingModelMissing:
            'Modelo de embedding no cargado. El RAG semantico usara busqueda por palabras clave.',
        enableSemanticRag: 'Busqueda RAG Semantica',
        enableSemanticRagHint:
            'Usa embeddings vectoriales para una recuperacion de contexto de registro de cultivo mas precisa en lugar de busqueda por palabras clave.',
        // NLP Models
        sentimentModelReady: 'El modelo de analisis de sentimiento esta listo.',
        sentimentModelMissing: 'Modelo de sentimiento no cargado.',
        summarizationModelReady: 'El modelo de resumen esta listo.',
        summarizationModelMissing: 'Modelo de resumen no cargado.',
        zeroShotTextModelReady: 'El modelo de clasificacion de consultas esta listo.',
        zeroShotTextModelMissing: 'Modelo de clasificacion de consultas no cargado.',
        enableSentiment: 'Analisis de Sentimiento del Diario',
        enableSentimentHint:
            'Analiza el tono emocional de las entradas del diario para rastrear el animo del cultivador y detectar patrones.',
        enableSummarization: 'Resumen de Texto',
        enableSummarizationHint:
            'Condensa registros de cultivo largos e historiales de chat del mentor en resumenes concisos.',
        enableQueryClassification: 'Enrutamiento Inteligente de Consultas',
        enableQueryClassificationHint:
            'Categoriza automaticamente las preguntas para mejorar la relevancia de las respuestas AI.',
        // Eco Mode
        ecoMode: 'Modo Eco',
        ecoModeHint:
            'Fuerza el backend WASM y los modelos mas pequenos para reducir el uso de CPU/GPU hasta un 70%. Ideal para dispositivos de gama baja o ahorro de bateria.',
        // Persistent Cache
        enablePersistentCache: 'Cache de Inferencia Persistente',
        enablePersistentCacheHint:
            'Almacena respuestas AI en IndexedDB para que las consultas repetidas se devuelvan al instante, incluso despues de recargar la aplicacion.',
        persistentCacheSize: 'Respuestas en cache: {{value}}',
        clearPersistentCache: 'Borrar Cache de Inferencia',
        // Telemetry
        enableTelemetry: 'Telemetria AI Local',
        enableTelemetryHint:
            'Rastrea la velocidad de inferencia, el rendimiento de tokens y el uso de modelos localmente. Ningun dato sale del dispositivo.',
        telemetryInferences: 'Total de inferencias: {{value}}',
        telemetryAvgLatency: 'Latencia promedio: {{value}} ms',
        telemetryAvgSpeed: 'Velocidad promedio: {{value}} tok/s',
        telemetryCacheHitRate: 'Tasa de aciertos de cache: {{value}}%',
        telemetrySuccessRate: 'Tasa de exito: {{value}}%',
        telemetryPeakSpeed: 'Velocidad maxima: {{value}} tok/s',
        // Advanced
        inferenceTimeout: 'Tiempo Limite de Inferencia',
        inferenceTimeoutHint:
            'Tiempo maximo en segundos para esperar una respuesta AI local individual.',
        maxCacheSize: 'Maximo de Entradas en Cache',
        maxCacheSizeHint:
            'Numero maximo de resultados de inferencia almacenados en cache en IndexedDB.',
        // Progressive Quantization
        quantizationLevel: 'Cuantizacion del Modelo',
        quantizationLevelHint:
            'Controla la precision y el tamano del modelo. Auto selecciona la mejor opcion basada en tu GPU y memoria. q4f16 usa 4-bit float16 para GPUs de gama alta, q4 usa el modelo ligero de 0.5B para amplia compatibilidad.',
        quantAuto: 'Auto (basado en VRAM)',
        quantQ4f16: 'q4f16 (Premium, 1.5B)',
        quantQ4: 'q4 (Estandar, 0.5B)',
        quantNone: 'Ninguno (Precision completa)',
        quantActiveProfile: 'Perfil activo: {{sizeTier}} {{quantLevel}} -- ~{{savings}}% de ahorro',
        // Model Status Section
        modelStatusTitle: 'Resumen del Estado de Modelos',
        modelsLoaded: '{{loaded}} de {{total}} modelos listos',
        // Health & Device
        healthStatus: 'Salud AI: {{value}}',
        deviceClass: 'Clase de dispositivo: {{value}}',
        // Language Detection
        langDetectionReady: 'El modelo de deteccion de idioma esta listo.',
        langDetectionMissing: 'Modelo de deteccion de idioma no cargado.',
        // Image Similarity
        imgSimilarityReady: 'La similitud de imagenes (caracteristicas CLIP) esta lista.',
        imgSimilarityMissing: 'Modelo de similitud de imagenes no cargado.',
        // Performance Alerts
        perfDegradedWarning:
            'El AI local se esta ejecutando lentamente ({{tokPerSec}} tok/s). Considera cerrar otras pestanas o cambiar a un modelo mas ligero.',
        perfDegradedDowngrade:
            'La velocidad de inferencia ha disminuido. Se recomienda cambiar a un modelo mas ligero.',
        perfDegradedCloseTabs:
            'La velocidad de inferencia ha disminuido. Cerrar pestanas no utilizadas puede liberar memoria GPU.',
    },
    localAiDiag: {
        reasons: {
            active: 'WebLLM esta activo y ejecutandose en GPU.',
            'insecure-context': 'WebGPU requiere un contexto seguro (HTTPS o localhost).',
            'no-webgpu-api': 'Este navegador no soporta WebGPU.',
            'no-gpu-adapter': 'No se encontro un adaptador GPU compatible.',
            'vram-insufficient':
                'No hay suficiente memoria GPU (VRAM) para el modelo seleccionado.',
            'no-model-profile':
                'Ningun perfil de modelo coincide con las capacidades actuales del dispositivo.',
            'force-wasm-override':
                'WebGPU deshabilitado -- Forzar WASM esta habilitado en la configuracion.',
            'browser-unsupported':
                'Tu navegador no soporta las caracteristicas requeridas de WebGPU.',
            'adapter-request-timeout':
                'La solicitud del adaptador GPU expiro despues de 5 segundos.',
            'unknown-error': 'Ocurrio un error inesperado durante la inicializacion de WebGPU.',
        },
    },
    general: {
        title: 'Configuracion General',
        language: 'Idioma',
        theme: 'Tema',
        themes: {
            midnight: 'Medianoche',
            forest: 'Bosque',
            purpleHaze: 'Neblina Purpura',
            desertSky: 'Cielo del Desierto',
            roseQuartz: 'Cuarzo Rosa',
            rainbowKush: 'Rainbow Kush',
            ogKushGreen: 'OG Kush Green',
            runtzRainbow: 'Runtz Rainbow',
            lemonSkunk: 'Lemon Skunk',
        },
        fontSize: 'Tamano de Fuente',
        fontSizes: {
            sm: 'Pequeno',
            base: 'Normal',
            lg: 'Grande',
        },
        defaultView: 'Vista Predeterminada al Iniciar',
        installApp: 'Instalar Aplicacion',
        installAppDesc:
            'Instala CannaGuide 2025 en tu dispositivo para una experiencia de aplicacion nativa, incluyendo acceso sin conexion.',
        uiDensity: 'Densidad de la Interfaz',
        uiDensities: {
            comfortable: 'Comoda',
            compact: 'Compacta',
        },
        dyslexiaFont: 'Fuente para Dislexia',
        dyslexiaFontDesc: 'Usa la fuente Atkinson Hyperlegible para mejorar la legibilidad.',
        reducedMotion: 'Movimiento Reducido',
        reducedMotionDesc: 'Deshabilita o reduce animaciones y efectos basados en movimiento.',
        highContrastMode: 'Modo de Alto Contraste',
        highContrastModeDesc:
            'Aumenta el contraste y la definicion de bordes para superficies criticas de la interfaz.',
        colorblindMode: 'Modo para Daltonismo',
        colorblindModeDesc:
            'Ajusta los colores de la aplicacion para diferentes tipos de deficiencia en la vision del color.',
        colorblindModes: {
            none: 'Ninguno',
            protanopia: 'Protanopia (Ceguera al Rojo)',
            deuteranopia: 'Deuteranopia (Ceguera al Verde)',
            tritanopia: 'Tritanopia (Ceguera al Azul)',
        },
    },
    languages: {
        en: 'Ingles',
        de: 'Aleman',
        es: 'Espanol',
        fr: 'Frances',
        nl: 'Holandes',
    },
    tts: {
        title: 'Voz y Habla',
        ttsOutput: 'Salida de Voz (Texto a Voz)',
        voiceControlInput: 'Control por Voz (Entrada)',
        ttsEnabled: 'Habilitar Texto a Voz',
        ttsEnabledDesc: 'Agrega botones para leer en voz alta el contenido de la aplicacion.',
        voice: 'Voz',
        noVoices: 'No hay voces disponibles para el idioma actual.',
        rate: 'Velocidad de Habla',
        pitch: 'Tono',
        volume: 'Volumen',
        highlightSpeakingText: 'Resaltar Texto Hablado',
        highlightSpeakingTextDesc:
            'Resalta visualmente el bloque de texto que se esta leyendo actualmente.',
        testVoice: 'Probar Voz',
        testVoiceSentence: 'Esta es una prueba de la voz seleccionada.',
        voiceControl: {
            enabled: 'Habilitar Control por Voz',
            enabledDesc: 'Controla la aplicacion usando comandos de voz simples.',
            hotwordEnabled: 'Palabra Clave Siempre Activa',
            hotwordEnabledDesc:
                'Mantiene el microfono listo para palabras de activacion manos libres cuando el navegador lo soporta.',
            confirmationSound: 'Sonidos de Confirmacion',
            confirmationSoundDesc:
                'Reproduce un sonido corto cuando un comando de voz se reconoce exitosamente.',
        },
        commands: {
            title: 'Referencia de Comandos',
            description:
                'Aqui hay una lista de comandos que puedes usar cuando el control por voz esta activo. Simplemente comienza con "Ir a..." o "Buscar...".',
            searchPlaceholder: 'Buscar comandos...',
            groups: {
                navigation: 'Navegacion',
                strains: 'Variedades',
                plants: 'Plantas',
            },
            goTo: 'Ir a {{view}}',
            searchFor: 'Buscar [nombre de variedad]',
            resetFilters: 'Restablecer filtros',
            showFavorites: 'Mostrar favoritos',
            waterAll: 'Regar todas las plantas',
        },
        readThis: 'Leer esta seccion en voz alta',
        play: 'Reproducir',
        pause: 'Pausar',
        next: 'Siguiente',
        stop: 'Detener',
    },
    strains: {
        title: 'Configuracion de Vista de Variedades',
        defaultSort: 'Orden Predeterminado',
        defaultViewMode: 'Modo de Vista Predeterminado',
        strainsPerPage: 'Elementos por Pagina',
        viewModes: {
            list: 'Lista',
            grid: 'Cuadricula',
        },
        visibleColumns: 'Columnas Visibles (Vista de Lista)',
        visibleColumnsDesc: 'Elige que columnas de datos mostrar en la vista de lista.',
        columns: {
            type: 'Tipo',
            thc: 'THC',
            cbd: 'CBD',
            floweringTime: 'Tiempo de Floracion',
        },
        sortKeys: {
            name: 'Nombre',
            thc: 'THC',
            cbd: 'CBD',
            floweringTime: 'Tiempo de Floracion',
            difficulty: 'Dificultad',
            type: 'Tipo',
            yield: 'Rendimiento',
            height: 'Altura',
        },
        sortDirections: {
            asc: 'Ascendente',
            desc: 'Descendente',
        },
        defaults: {
            title: 'Valores Predeterminados y Comportamiento',
            prioritizeTitle: 'Priorizar Mis Variedades y Favoritos',
            prioritizeDesc:
                'Siempre muestra tus variedades personalizadas y favoritas en la parte superior de la lista.',
            sortDirection: 'Direccion de Ordenamiento',
        },
        listView: {
            title: 'Personalizacion de Vista de Lista',
            description: 'Personaliza las columnas mostradas en la vista de lista.',
        },
        advanced: {
            title: 'Funciones Avanzadas',
            genealogyLayout: 'Diseno de Genealogia Predeterminado',
            genealogyDepth: 'Profundidad Inicial de Genealogia Predeterminada',
            aiTipsExperience: 'Nivel de Experiencia Predeterminado para Consejos AI',
            aiTipsFocus: 'Enfoque Predeterminado para Consejos AI',
        },
    },
    plants: {
        title: 'Plantas y Simulacion',
        realtimeEngine: 'Motor en Tiempo Real',
        behavior: 'Comportamiento de Simulacion',
        calibration: 'Calibracion Ambiental',
        physics: 'Fisica Avanzada de Simulacion (Experto)',
        showArchived: 'Mostrar Cultivos Completados',
        showArchivedDesc: 'Muestra plantas terminadas/cosechadas en el panel de control.',
        archivedHiddenTitle: 'Cultivo archivado oculto',
        archivedHiddenDesc:
            'Esta ranura contiene un cultivo terminado que actualmente esta oculto para un panel de control en vivo mas limpio.',
        inspectArchived: 'Inspeccionar cultivo archivado',
        autoGenerateTasks: 'Auto-Generar Tareas',
        autoGenerateTasksDesc: 'Crea automaticamente tareas para acciones como el riego.',
        realtimeSimulation: 'Simulacion en Tiempo Real',
        realtimeSimulationDesc:
            'La simulacion de la planta continua ejecutandose en segundo plano.',
        autoJournaling: 'Registro Automatico en Diario',
        logStageChanges: 'Registrar cambios de etapa',
        logProblems: 'Registrar problemas',
        logTasks: 'Registrar tareas',
        simulationProfile: 'Perfil de Simulacion',
        simulationProfileDesc:
            'Aplica un conjunto documentado de curvas de respuesta para estres ambiental, volatilidad de nutrientes, presion de plagas y precision post-cosecha manteniendo la linea temporal estrictamente en tiempo real.',
        simulationProfiles: {
            beginner: 'Principiante',
            intermediate: 'Intermedio',
            expert: 'Experto',
        },
        pestPressure: 'Presion de Plagas',
        pestPressureDesc:
            'Alimenta una curva de presion de plagas no lineal. Los valores bajos son indulgentes; los valores altos escalan la probabilidad de brote mucho mas rapido.',
        nutrientSensitivity: 'Sensibilidad a Nutrientes',
        nutrientSensitivityDesc:
            'Que tan fuertemente reacciona la planta a desequilibrios de nutrientes.',
        environmentalStability: 'Estabilidad Ambiental',
        environmentalStabilityDesc:
            'Impulsa una curva de inestabilidad deterministica para la variacion diaria de temperatura y humedad. Los valores mas bajos amplifican las oscilaciones bruscamente en lugar de linealmente.',
        leafTemperatureOffset: 'Compensacion de Temperatura de la Hoja (C)',
        leafTemperatureOffsetDesc:
            'Simula cuanto mas fria (negativo) o caliente (positivo) estan las hojas que el aire ambiente. Impacta directamente el calculo de VPD.',
        lightExtinctionCoefficient: 'Penetracion de Luz (valor-k)',
        lightExtinctionCoefficientDesc:
            'Controla que tan bien penetra la luz en el dosel. Un valor mas bajo significa mejor penetracion. Afecta la fotosintesis de las hojas inferiores.',
        nutrientConversionEfficiency: 'Eficiencia de Conversion de Nutrientes',
        nutrientConversionEfficiencyDesc:
            'Que tan eficientemente la planta convierte los nutrientes absorbidos en biomasa. Un valor mas alto significa mas crecimiento con la misma cantidad de nutrientes.',
        stomataSensitivity: 'Sensibilidad Estomatica',
        stomataSensitivityDesc:
            'Controla que tan rapido la planta cierra sus estomas en condiciones de VPD alto para conservar agua. Un valor mas alto significa mayor tolerancia a la sequia.',
        altitudeM: 'Altitud del Cultivo',
        altitudeMDesc:
            'Aplica correccion barometrica de VPD basada en la elevacion de tu sala de cultivo sobre el nivel del mar.',
        growTech2026: 'Tecnologias de Cultivo 2026', // machine-translated, review needed
        dynamicLighting: 'Iluminacion Dinamica',
        dynamicLightingDesc:
            'Habilita la iluminacion adaptativa al espectro que ajusta automaticamente la salida LED (azul para veg, rojo para floracion) segun la fase de crecimiento y el VPD.',
        enableAeroponics: 'Modo Aeroponia',
        enableAeroponicsDesc:
            'Activa los parametros de simulacion especificos de aeroponia: absorcion rapida de nutrientes, modelo de uso de agua reducido y temporizado de ciclo de niebla.',
        co2Enrichment: 'Simulacion de Enriquecimiento de CO2',
        co2EnrichmentDesc:
            'Habilita los efectos de enriquecimiento de CO2 en el motor de simulacion. Establece ppm objetivo para calculos de rendimiento.',
        co2TargetPpm: 'Objetivo CO2 (ppm)',
        smartFertigationAlerts: 'Alertas de Fertirriego Inteligente',
        smartFertigationAlertsDesc:
            'Recibe alertas automatizadas cuando el pH o CE se desvia fuera de los rangos optimos basados en datos de sensores en tiempo real.',
    },
    notifications: {
        title: 'Notificaciones',
        enableAll: 'Habilitar Todas las Notificaciones',
        enableAllDesc:
            'Interruptor principal para alertas de cultivo del navegador y service worker.',
        stageChange: 'Cambio de Etapa',
        problemDetected: 'Problema Detectado',
        harvestReady: 'Cosecha Lista',
        newTask: 'Nueva Tarea',
        lowWaterWarning: 'Advertencia de Agua Baja',
        phDriftWarning: 'Advertencia de Desviacion de pH',
        quietHours: 'Horas de Silencio',
        enableQuietHours: 'Habilitar Horas de Silencio',
        quietHoursDesc: 'Las notificaciones se silenciaran durante este periodo.',
        quietHoursStart: 'Inicio de Horas de Silencio',
        quietHoursEnd: 'Fin de Horas de Silencio',
    },
    defaults: {
        title: 'Valores Predeterminados',
        growSetup: 'Configuracion de Cultivo Predeterminada',
        export: 'Formato de Exportacion Predeterminado',
        journalNotesTitle: 'Notas de Diario Predeterminadas',
        wateringNoteLabel: 'Nota para Riego',
        feedingNoteLabel: 'Nota para Alimentacion',
    },
    data: {
        title: 'Gestion de Datos',
        storageInsights: 'Informacion de Almacenamiento',
        dbStore: {
            title: 'Detalles del almacen IndexedDB',
            loading: 'Cargando datos del almacen...',
            empty: 'Informacion del almacen no disponible.',
        },
        backupAndRestore: 'Copia de Seguridad y Restauracion',
        dangerZone: 'Zona de Peligro',
        importData: 'Importar Datos',
        importDataDesc:
            'Restaura una copia de seguridad de la aplicacion desde un archivo JSON. Esto sobrescribira todos los datos actuales.',
        importConfirmTitle: 'Confirmar Importacion',
        importConfirmText:
            'Estas seguro? Todos tus datos actuales seran reemplazados por el contenido del archivo seleccionado. Esta accion no se puede deshacer.',
        importConfirmButton: 'Importar y Sobrescribir',
        importSuccess: 'Datos importados exitosamente. La aplicacion se recargara ahora.',
        importError:
            'La importacion fallo. Por favor asegurate de que sea un archivo de copia de seguridad valido.',
        growExportTitle: 'Copia de Seguridad por Cultivo',
        growExportDesc: 'Exportar "{{name}}" con {{count}} plantas como archivo JSON portable.',
        exportGrow: 'Exportar este Cultivo',
        importGrow: 'Importar Cultivo',
        growImportDesc: 'Importar un archivo de cultivo exportado previamente (formato v2.0).',
        growImportSuccess: 'Cultivo "{{name}}" importado exitosamente.',
        growImportError: 'Importacion fallida. Asegurate de que sea un archivo de exportacion de cultivo valido (v2.0).',
        totalUsage: 'Uso Total',
        lastBackup: 'Ultima Copia de Seguridad',
        noBackup: 'Aun no se ha creado ninguna copia de seguridad',
        autoBackup: 'Copia de Seguridad Automatica',
        persistenceTitle: 'Persistencia y Capturas',
        persistenceInterval: 'Cadencia de guardado',
        backupOptions: {
            off: 'Desactivado',
            daily: 'Diario',
            weekly: 'Semanal',
        },
        persistenceOptions: {
            fast: 'Rapido (0.5s)',
            balanced: 'Equilibrado (1.5s)',
            batterySaver: 'Ahorro de Bateria (5s)',
        },
        localOnlyBadge: 'Solo Local',
        localOnlyDesc:
            'Todos tus datos viven en este dispositivo. No se necesita cuenta -- nunca. Opcionalmente habilita la Sincronizacion en la Nube con Un Toque a continuacion para respaldar via GitHub Gist anonimo.',
        sync: {
            title: 'Sincronizacion en la Nube con Un Toque',
            description:
                'Respalda y restaura todo el estado de tu aplicacion via GitHub Gist anonimo. No se requiere cuenta ni registro.',
            pushButton: 'Enviar a la Nube',
            pullButton: 'Obtener de la Nube',
            pushSuccess: 'Todos los datos sincronizados al Gist exitosamente.',
            pullSuccess: 'Datos restaurados desde el Gist. La aplicacion se recargara.',
            pushFailed: 'El envio de sincronizacion fallo (HTTP {{status}}).',
            pullFailed: 'La obtencion de sincronizacion fallo (HTTP {{status}}).',
            noSyncFile: 'No se encontraron datos de sincronizacion de CannaGuide en este Gist.',
            invalidPayload:
                'Los datos del Gist estan corruptos o no son una copia de seguridad valida de CannaGuide.',
            invalidGistUrl: 'URL o ID de Gist invalido.',
            lastSynced: 'Ultima sincronizacion',
            never: 'Nunca',
            gistIdLabel: 'ID del Gist',
            gistIdPlaceholder: 'Pega la URL o ID del Gist para restaurar',
            enableSync: 'Habilitar Sincronizacion en la Nube',
            disableSync: 'Deshabilitar Sincronizacion en la Nube',
            enabled: 'Habilitado',
            disabled: 'Deshabilitado',
            confirmPull:
                'Esto sobrescribira TODOS los datos actuales con la copia de seguridad del Gist. Continuar?',
            confirmPullTitle: 'Restaurar desde la Nube?',
            syncing: 'Sincronizando...',
            connected: 'Conectado al Gist',
            blockedByLocalOnly:
                'La sincronizacion en la nube esta deshabilitada mientras el Modo Solo Local esta activo. Deshabilita el Modo Solo Local en Privacidad y Seguridad para usar la sincronizacion en la nube.',
            gistSecurityWarning:
                'Tus datos se almacenan en un GitHub Gist no listado. Aunque cifrado, la URL del Gist es publicamente accesible si se conoce. Habilita E2EE para proteccion.', // machine-translated, review needed
            encryptionKeyRequired:
                'Esta copia de seguridad esta cifrada. Por favor proporciona la clave de cifrado para restaurarla.',
            e2ee: {
                title: 'Cifrado de Extremo a Extremo',
                description:
                    'Cifra tu copia de seguridad antes de subirla. Sin la clave, los datos de tu Gist son ilegibles -- incluso para GitHub.',
                active: 'E2EE activo -- las copias de seguridad estan cifradas',
                generateKey: 'Generar Clave de Cifrado',
                keyGenerated:
                    'Clave de cifrado generada. Guardala de forma segura -- la necesitas para restaurar copias de seguridad en otros dispositivos.',
                showKey: 'Mostrar Clave',
                hideKey: 'Ocultar Clave',
                copyKey: 'Copiar Clave',
                keyCopied: 'Clave de cifrado copiada al portapapeles.',
            },
            conflictTitle: 'Conflicto de sincronizacion detectado',
            conflictDescription:
                'Tus datos locales y la version en la nube tienen cambios divergentes. Elige como resolver:',
            localChanges: 'Solo local',
            remoteChanges: 'Solo remoto',
            conflictingItems: 'En conflicto',
            merge: 'Fusion inteligente',
            keepLocal: 'Mantener local',
            useCloud: 'Usar nube',
            viewDetails: 'Ver detalles',
            pendingSync: 'Sincronizacion pendiente -- se reintentara cuando haya conexion...',
            synced: 'Sincronizado a las {{time}}',
            syncError: 'Sincronizacion fallida',
            statusIdle: 'No sincronizado',
            keepLocalConfirm:
                'Esto descartara todos los cambios remotos y subira tu estado local a la nube. No se puede deshacer.',
            useCloudConfirm:
                'Esto descartara todos los cambios locales y reemplazara tus datos con la version de la nube. No se puede deshacer.',
            migrating: 'Migrando formato de sincronizacion antiguo -- la aplicacion se recargara...',
        },
        replayOnboarding: 'Mostrar Tutorial de Nuevo',
        replayOnboardingConfirm:
            'Esto mostrara el tutorial de bienvenida en el proximo inicio de la aplicacion. Continuar?',
        replayOnboardingSuccess: 'El tutorial se mostrara en el proximo inicio.',
        resetPlants: 'Restablecer Plantas',
        resetPlantsConfirm:
            'Estas seguro de que quieres eliminar todas tus plantas actuales? Esta accion no se puede deshacer.',
        resetPlantsSuccess: 'Todas las plantas han sido restablecidas.',
        resetAll: 'Restablecer Todos los Datos de la Aplicacion',
        resetAllConfirm:
            'ADVERTENCIA: Esto eliminara permanentemente todas tus plantas, configuracion, favoritos y variedades personalizadas. Estas absolutamente seguro?',
        resetAllConfirmInput: "Para confirmar, por favor escribe '{{phrase}}'.",
        resetAllConfirmPhrase: 'eliminar todos los datos',
        resetAllSuccess:
            'Todos los datos de la aplicacion han sido restablecidos. La aplicacion se recargara ahora.',
        exportAll: 'Exportar Todos los Datos',
        exportAsJson: 'Exportar como JSON',
        exportAsXml: 'Exportar como XML',
        exportConfirm:
            'Estas seguro de que quieres exportar todos los datos de tu aplicacion como copia de seguridad?',
        exportSuccess: 'Todos los datos exportados exitosamente!',
        exportError: 'La exportacion fallo.',
        clearArchives: 'Borrar Archivos AI',
        clearArchivesDesc: 'Elimina todas las respuestas guardadas del Mentor y Asesor AI.',
        clearArchivesConfirm:
            'Estas seguro de que quieres eliminar todas tus respuestas AI guardadas?',
        clearArchivesSuccess: 'Todos los archivos AI han sido borrados.',
        runCleanup: 'Ejecutar Limpieza de Almacenamiento Ahora',
        runCleanupDesc:
            'Archiva automaticamente registros de cultivo antiguos y elimina fotos guardadas mas antiguas para liberar espacio.',
        cleanupRunning: 'Limpiando almacenamiento...',
        cleanupSuccess:
            'Limpieza de almacenamiento completada. Se eliminaron {{count}} fotos antiguas y se archivaron registros mas antiguos.',
        cleanupError: 'La limpieza de almacenamiento fallo. Por favor intentalo de nuevo.',
        storageWarningTitle: 'El almacenamiento se esta llenando.',
        storageWarningBody: 'Considera ejecutar la limpieza pronto para evitar fallos al guardar.',
        storageCriticalTitle: 'Almacenamiento criticamente lleno.',
        storageCriticalBody:
            'Ejecuta la limpieza ahora para reducir el riesgo de errores de cuota de IndexedDB.',
        storageCalculating: 'Calculando almacenamiento...',
        storageUnavailable: 'Informacion de almacenamiento no disponible.',
        storageUsage: 'Uso de Almacenamiento',
        storageBreakdown: {
            plants: 'Datos de Plantas y Diarios',
            images: 'Fotos Guardadas',
            archives: 'Archivos AI',
            customStrains: 'Variedades Personalizadas',
            savedItems: 'Elementos Guardados',
        },
        sliceReset: {
            title: 'Restablecer Secciones Individuales',
            desc: 'Restablece una seccion de datos individual a sus valores de fabrica sin afectar otros datos.',
            confirmTitle: 'Restablecer "{{slice}}"?',
            confirmText:
                'Esto eliminara permanentemente todos los datos en la seccion "{{slice}}" y recargara la aplicacion. Esto no se puede deshacer.',
            confirmButton: 'Restablecer y Recargar',
            slices: {
                simulation: 'Plantas y Simulacion',
                genealogy: 'Cache de Genealogia',
                sandbox: 'Experimentos del Sandbox',
                favorites: 'Favoritos',
                notes: 'Notas de Variedades',
                archives: 'Archivos AI',
                savedItems: 'Elementos Guardados',
                knowledge: 'Progreso de Conocimiento',
                breeding: 'Datos de Cruce',
                userStrains: 'Variedades Personalizadas',
            },
        },
        gdprTitle: 'Privacidad (GDPR/DSGVO)',
        gdprExport: 'Exportar Todos los Datos Personales',
        gdprExportDesc: 'Descarga una copia completa de todos los datos (Art. 20 GDPR).',
        gdprErase: 'Borrar Todos los Datos',
        gdprEraseDesc:
            'Elimina permanentemente TODOS los datos de este dispositivo (Art. 17 GDPR). Esto no se puede deshacer.',
        gdprEraseWarning:
            'Esto eliminara permanentemente TODAS las bases de datos, almacenamiento local, caches y service workers. Escribe DELETE ALL para confirmar.',
        gdprEraseConfirmPlaceholder: 'DELETE ALL',
        gdprSelectiveTitle: 'Eliminacion Selectiva de Bases de Datos',
        gdprSelectiveDesc:
            'Eliminar bases de datos individuales en lugar de todos los datos a la vez (Art. 17 GDPR eliminacion parcial).',
        gdprSelectiveDelete: 'Eliminar',
        gdprSelectiveConfirm:
            'Esta seguro de que desea eliminar la base de datos "{{name}}"? Esto no se puede deshacer.',
        gdprSelectiveSuccess: 'Base de datos "{{name}}" eliminada con exito.',
        gdprSelectiveError: 'Error al eliminar la base de datos "{{name}}".',
    },
    privacy: {
        title: 'Privacidad y Seguridad',
        localOnlyMode: 'Modo Solo Local',
        localOnlyModeDesc:
            'Bloquea TODO el trafico de red saliente: rastreo de errores Sentry, solicitudes AI en la nube y sincronizacion Gist. Solo se permiten la inferencia AI local y el almacenamiento local.',
        localOnlyModeActive:
            'El Modo Solo Local esta activo. Todas las solicitudes de red externas estan bloqueadas. Deshabilita este interruptor para restaurar las funciones en la nube.',
        requirePin: 'Requerir PIN al Iniciar',
        requirePinDesc: 'Protege tu aplicacion con un PIN de 4 digitos.',
        setPin: 'Establecer/Cambiar PIN',
        setPinDesc: 'Almacena un PIN local de 4 digitos para proteccion al iniciar la aplicacion.',
        pinPlaceholder: 'Ingresa 4 digitos',
        savePin: 'Guardar PIN',
        clearPin: 'Eliminar PIN',
        clearAiHistory: 'Borrar Historial AI al Salir',
        clearAiHistoryDesc:
            'Borra automaticamente todos los historiales de chat AI cuando se cierra la aplicacion.',
        unlockTitle: 'Desbloquear CannaGuide',
        unlockDesc: 'Ingresa tu PIN de 4 digitos para continuar.',
        unlockFailed: 'PIN incorrecto. Intentalo de nuevo.',
        unlockButton: 'Desbloquear',
    },
    about: {
        title: 'Acerca de la Aplicacion',
        projectInfo: 'Informacion del Proyecto y README',
        version: 'Version',
        whatsNew: {
            title: 'Novedades en v1.1',
            items: {
                simulation:
                    'Shell de simulacion segura para moviles: Transiciones de vista mas rapidas, mayor resistencia sin conexion y mejor espaciado inferior en toda la aplicacion.',
                strains:
                    'Fortalecimiento de la biblioteca de variedades: Los campos de variedades heredados faltantes ahora recurren a valores seguros en lugar de bloquear la pagina.',
                help: 'Estructura del centro de ayuda: Las preguntas frecuentes y las guias visuales estan separadas en temas de la aplicacion y de cultivo para una navegacion mas rapida.',
                settings:
                    'Acerca de y actualizacion del README: Informacion de version actualizada, alcance actual de la aplicacion y documentacion del proyecto mas clara.',
            },
        },
        techStack: {
            title: 'Pila Tecnologica',
            geminiLabel: 'Google Gemini:',
            gemini: 'Potencia todas las funciones AI para diagnosticos inteligentes y consejos.',
            react: 'Para una interfaz de usuario moderna, eficiente y responsiva.',
            indexedDb:
                'Base de datos robusta del lado del cliente para funcionalidad 100% sin conexion.',
            webWorkersLabel: 'Web Workers:',
            webWorkers:
                'Ejecuta simulaciones complejas fuera del hilo principal para mantener la interfaz fluida.',
        },
        credits: {
            title: 'Agradecimientos y Enlaces',
            phosphorLabel: 'Phosphor Icons:',
            phosphor: 'Iconos proporcionados por Phosphor Icons.',
            dataProvidersLabel: 'Proveedores de Datos:',
            strainProviders:
                'Enriquecimiento de variedades via Otreeba, Cannlytics, StrainAPI, CannSeek, OpenTHC, Cansativa y Kushy.', // machine-translated, review needed
            webLlmOnnxLabel: 'WebLLM / ONNX:',
            corsProxiesLabel: 'Proxies CORS:',
            corsProxies: 'Servicio de proxy CORS por allorigins.win y corsproxy.io.',
            transformersJs:
                'NLP e incrustaciones en el dispositivo via Transformers.js (Xenova/Hugging Face).',
            webLlm: 'Inferencia LLM local via WebLLM (MLC AI).',
            onnx: 'Runtime ML por ONNX Runtime Web y TensorFlow.js.',
            radixUi: 'Primitivas de UI accesibles por Radix UI.',
            recharts: 'Visualizaciones de graficos por Recharts y D3.js.',
            tailwind: 'Estilos utility-first por Tailwind CSS.',
            sentry: 'Seguimiento de errores por Sentry.',
            vite: 'Herramientas de build por Vite y TurboRepo.',
        },
        githubLinkText: 'Ver Proyecto en GitHub',
        aiStudioLinkText: 'Bifurcar Proyecto en AI Studio',
        devJourney: {
            title: 'Trayectoria de Desarrollo',
            subtitle: 'Construido iterativamente con desarrollo asistido por AI en 4 fases:',
            phase1Title: 'Prototipado',
            phase1Desc:
                'Estructura de la aplicacion y conjunto de funciones iniciales construidas con Google Gemini 2.5 Pro y 3.1 Pro en Google AI Studio, luego exportado a GitHub.',
            phase2Title: 'Evaluacion y Asesoria',
            phase2Desc:
                'Evaluacion continua de arquitectura, consultoria de seguridad y asesoria de calidad por xAI Grok 4.20 a lo largo de todo el proceso de desarrollo.',
            phase3Title: 'Desarrollo Principal',
            phase3Desc:
                'Iteracion y refinamiento principales en GitHub Codespaces con VS Code Copilot potenciado por Claude Opus 4.6 -- la mayoria del desarrollo de funciones, fortalecimiento de seguridad, pruebas y trabajo de pipeline CI/CD.',
            phase4Title: 'Despliegue y Distribucion',
            phase4Desc:
                'Despliegue de produccion en GitHub Pages, vistas previas de PR en Netlify, contenedores Docker, escritorio Tauri y compilaciones moviles Capacitor.',
            secondaryNote: 'Contribuciones menores de GPT-4 Mini y GPT-5.3 Codex.',
        },
        disclaimer: {
            title: 'Aviso Legal',
            content:
                'Toda la informacion en esta aplicacion es solo para fines educativos y de entretenimiento. El cultivo de cannabis esta sujeto a regulaciones legales estrictas. Por favor informate sobre las leyes de tu region y actua siempre de manera responsable y conforme a la ley.',
        },
        readmeContent: {
            header: `
          <h1>CannaGuide 2025 (Espanol)</h1>
          <p><strong>El Companero Definitivo de Cultivo de Cannabis Potenciado por AI</strong></p>
          <p>CannaGuide 2025 es tu copiloto digital definitivo potenciado por AI para todo el ciclo de vida del cultivo de cannabis. Disenado tanto para entusiastas novatos como para cultivadores expertos, esta <strong>Aplicacion Web Progresiva (PWA)</strong> de ultima generacion te guia desde la seleccion de semillas hasta una cosecha perfectamente curada.</p>
        `,
            philosophyTitle: 'Filosofia del Proyecto',
            philosophyContent: `
            <p>CannaGuide 2025 esta construido sobre un conjunto de principios fundamentales disenados para ofrecer una experiencia de primera clase:</p>
            <blockquote><strong>Sin Conexion Primero</strong>: Tu jardin no se detiene cuando tu internet lo hace. La aplicacion esta disenada para ser <strong>100% funcional sin conexion</strong>.</blockquote>
            <blockquote><strong>El Rendimiento es Clave</strong>: Una interfaz fluida y responsiva no es negociable. El trabajo pesado, como la simulacion compleja de multiples plantas, se descarga a un <strong>Web Worker</strong> dedicado.</blockquote>
            <blockquote><strong>Soberania de Datos</strong>: Tus datos son tuyos, punto. La capacidad de <strong>exportar e importar todo el estado de tu aplicacion</strong> te da control completo.</blockquote>
            <blockquote><strong>AI como Copiloto</strong>: Aprovechamos la Google Gemini API no como un truco, sino como una herramienta poderosa para proporcionar <strong>informacion accionable y contextualizada</strong>.</blockquote>
        `,
            featuresTitle: 'Funciones Principales',
            featuresContent: `
            <h4>1. La Sala de Cultivo (Vista <code>Plants</code>)</h4>
            <ul>
                <li><strong>Motor de Simulacion Avanzado</strong>: Experimenta una simulacion de ultima generacion basada en <strong>VPD (Deficit de Presion de Vapor)</strong>.</li>
                <li><strong>Diagnosticos Potenciados por AI</strong>: Sube una foto de tu planta para obtener un diagnostico instantaneo basado en AI.</li>
                <li><strong>Registro Completo</strong>: Rastrea cada accion en un diario detallado y filtrable para cada planta.</li>
            </ul>
            <h4>2. La Enciclopedia de Variedades (Vista <code>Strains</code>)</h4>
            <ul>
                <li><strong>Biblioteca Extensa</strong>: Accede a informacion detallada sobre <strong>mas de 700 variedades de cannabis</strong>.</li>
                <li><strong>Arbol Genealogico Interactivo</strong>: Visualiza el linaje genetico completo de cualquier variedad.</li>
                <li><strong>Consejos de Cultivo AI</strong>: Genera consejos de cultivo unicos potenciados por AI para cualquier variedad.</li>
            </ul>
            <h4>3. El Taller (Vista <code>Equipment</code>)</h4>
            <ul>
                <li><strong>Configurador Avanzado de Equipamiento AI</strong>: Recibe una lista de equipos completa y especifica por marca generada por Gemini AI.</li>
                <li><strong>Suite de Calculadoras</strong>: Accede a un conjunto completo de herramientas de precision.</li>
            </ul>
            <h4>4. La Biblioteca (Vista <code>Knowledge</code>)</h4>
            <ul>
                <li><strong>Mentor AI Consciente del Contexto</strong>: Haz preguntas de cultivo al Mentor AI, que aprovecha los datos de tu planta activa para consejos personalizados.</li>
                <li><strong>Laboratorio de Cruce</strong>: Cruza tus semillas de alta calidad recolectadas para crear <strong>variedades hibridas permanentes</strong> completamente nuevas.</li>
                <li><strong>Sandbox Interactivo</strong>: Ejecuta escenarios hipoteticos sin arriesgar tus plantas reales.</li>
            </ul>
            <h4>5. El Centro de Ayuda (Vista <code>Help</code>)</h4>
            <ul>
                <li>Manual de usuario completo, preguntas frecuentes con busqueda, Lexico del Cultivador y Guias Visuales.</li>
            </ul>
            <h4>6. El Centro de Control (Vista <code>Settings</code>)</h4>
            <ul>
                <li>Personaliza temas, tamanos de fuente, opciones de accesibilidad y mucho mas.</li>
            </ul>
        `,
            techTitle: 'Profundizacion Tecnica',
            techContent: `
            <h4>Tecnologias Clave</h4>
            <ul>
                <li><strong>Frontend</strong>: React 19 con TypeScript</li>
                <li><strong>Gestion de Estado</strong>: Redux Toolkit</li>
                <li><strong>Integracion AI</strong>: Google Gemini API (<code>@google/genai</code>)</li>
                <li><strong>Operaciones Asincronas</strong>: RTK Query</li>
                <li><strong>Concurrencia</strong>: Web Workers</li>
                <li><strong>Persistencia de Datos</strong>: IndexedDB</li>
                <li><strong>PWA y Sin Conexion</strong>: Service Workers</li>
                <li><strong>Estilos</strong>: Tailwind CSS</li>
            </ul>
            <h4>Abstraccion del Servicio Gemini (<code>geminiService.ts</code>)</h4>
            <p>Como se indica en el <a href="https://deepwiki.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer">DeepWiki del proyecto</a>, el archivo <code>geminiService.ts</code> es un componente critico que actua como una capa de abstraccion central para toda la comunicacion con la Google Gemini API. Este diseno desacopla la logica de la API de los componentes de la interfaz y la capa de gestion de estado Redux (RTK Query), haciendo el codigo mas limpio, mantenible y facil de probar.</p>
            <p><strong>Responsabilidades y Metodos Clave:</strong></p>
            <ul>
                <li><strong>Inicializacion y Contexto</strong>: El servicio inicializa una unica instancia de <code>GoogleGenAI</code> y formatea automaticamente datos de plantas en tiempo real e instrucciones de idioma para cada prompt.</li>
                <li><strong>Salida JSON Estructurada</strong>: Para funciones como <code>getEquipmentRecommendation</code> y <code>diagnosePlant</code>, el servicio aprovecha el modo JSON de Gemini con un <code>responseSchema</code> para forzar objetos JSON validos y con tipos seguros.</li>
                <li><strong>Entrada Multimodal (Vision)</strong>: El metodo <code>diagnosePlant</code> combina una imagen codificada en Base64 con texto en una solicitud multiparte, permitiendo al modelo <code>gemini-2.5-flash</code> analizar datos visuales y textuales.</li>
                <li><strong>Generacion de Imagenes</strong>: El metodo <code>generateStrainImage</code> usa el modelo especializado <code>gemini-2.5-flash-image</code> para crear imagenes unicas y artisticas para la funcion de Consejos de Cultivo AI.</li>
                <li><strong>Seleccion de Modelo y Manejo de Errores</strong>: El servicio selecciona inteligentemente entre <code>gemini-2.5-flash</code> y el mas potente <code>gemini-2.5-pro</code>. Cada metodo incluye bloques <code>try...catch</code> robustos que proporcionan mensajes de error amigables a la interfaz.</li>
            </ul>
        `,
            devTitle: 'Desarrollo Local (Guia del Desarrollador)',
            devContent: `
            <h4>Requisitos Previos</h4>
            <ul>
                <li>Node.js (v18.x o posterior)</li>
                <li>npm</li>
                <li>Una Clave API de Google Gemini</li>
            </ul>
            <h4>Instalacion y Configuracion</h4>
            <ol>
                <li>Clona el repositorio: <code>git clone https://github.com/qnbs/CannaGuide-2025.git</code></li>
                <li>Instala las dependencias: <code>npm install</code></li>
            <li>Ejecuta el servidor de desarrollo: <code>npm run dev</code></li>
            <li>Abre Configuracion -> General e Interfaz -> Seguridad AI (Multi-Modelo BYOK) y guarda tu clave API en la aplicacion.</li>
            </ol>
        `,
            troubleshootingTitle: 'Solucion de Problemas',
            troubleshootingContent: `
            <ul>
            <li><strong>Las Funciones AI No Funcionan</strong>: Abre Configuracion -> General e Interfaz -> Seguridad AI (Multi-Modelo BYOK), valida tu clave y asegurate de que haya una clave almacenada en este dispositivo.</li>
                <li><strong>La Aplicacion No Se Actualiza (Cache PWA)</strong>: Si has hecho cambios pero no los ves, borra los datos del navegador o desregistra el Service Worker en las herramientas de desarrollo.</li>
            </ul>
        `,
            aiStudioTitle: 'Trayectoria de Desarrollo y Codigo Abierto',
            aiStudioContent: `
            <p>CannaGuide 2025 fue construido a traves de un proceso de desarrollo asistido por AI transparente e iterativo:</p>
            <ol>
                <li><strong>Prototipado</strong>: Estructura inicial de la aplicacion y conjunto de funciones construidos con <strong>Google Gemini 2.5 Pro y 3.1 Pro</strong> en <strong>Google AI Studio</strong>, luego exportado a GitHub.</li>
                <li><strong>Evaluacion y Asesoria</strong>: Revision continua de arquitectura, consultoria de seguridad y guia de calidad por <strong>xAI Grok 4.20</strong> a lo largo de todo el proceso.</li>
                <li><strong>Desarrollo Principal</strong>: Iteracion principal en <strong>GitHub Codespaces</strong> con <strong>VS Code Copilot potenciado por Claude Opus 4.6</strong> -- la mayoria del refinamiento de funciones, fortalecimiento de seguridad, mas de 643 pruebas, CI/CD y la pila AI local.</li>
                <li><strong>Despliegue</strong>: Produccion via GitHub Pages, Netlify, Docker, Tauri v2 y Capacitor.</li>
            </ol>
            <p><em>Contribuciones menores de GPT-4 Mini y GPT-5.3 Codex.</em></p>
            <p>Este proyecto es completamente de codigo abierto. Explora el codigo, bifurca el proyecto o contribuye en GitHub.</p>
            <ul>
                <li><a href="https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-" target="_blank" rel="noopener noreferrer">Bifurcar proyecto en AI Studio</a></li>
                <li><a href="https://github.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer">Ver codigo fuente en GitHub</a></li>
                <li><a href="https://deepwiki.com/qnbs/CannaGuide-2025/" target="_blank" rel="noopener noreferrer">Ver documentacion del proyecto en DeepWiki</a></li>
            </ul>
        `,
            contributingTitle: 'Contribuir',
            contributingContent: `
            <p>Damos la bienvenida a contribuciones de la comunidad! Ya sea que quieras corregir un error, agregar una nueva funcion o mejorar traducciones, tu ayuda es apreciada.</p>
            <ol>
                <li><strong>Reportar Problemas</strong>: Si encuentras un error o tienes una idea, por favor abre un issue en GitHub primero para discutirlo.</li>
                <li><strong>Hacer Cambios</strong>: Bifurca el repositorio, crea una nueva rama, confirma tus cambios y crea un nuevo Pull Request.</li>
            </ol>
        `,
            disclaimerTitle: 'Aviso Legal',
            disclaimerContent: `<p>Toda la informacion en esta aplicacion es solo para fines educativos y de entretenimiento. El cultivo de cannabis esta sujeto a regulaciones legales estrictas. Por favor informate sobre las leyes de tu region y actua siempre de manera responsable y conforme a la ley.</p>`,
        },
    },
    communityShare: {
        title: 'Compartir Variedades con la Comunidad',
        description: 'Compartir anonimo via GitHub Gist (alternativa ligera a IPFS).',
        exportButton: 'Exportar Variedades de Usuario a Gist Anonimo',
        gistPlaceholder: 'Pega la URL o ID del Gist',
        importButton: 'Importar Variedades desde Gist',
        exportSuccess: 'Gist anonimo creado.',
        exportError: 'La exportacion al Gist fallo.',
        importSuccess_one: '1 variedad importada.',
        importSuccess_other: '{{count}} variedades importadas.',
        importError: 'La importacion del Gist fallo.',
    },
    plugins: {
        title: 'Plugins',
        description:
            'Extiende CannaGuide con programas de nutrientes, integraciones de hardware y perfiles de cultivo.',
        installed: 'Plugins Instalados',
        noPlugins: 'Aun no hay plugins instalados.',
        install: 'Instalar Plugin',
        uninstall: 'Desinstalar',
        enable: 'Habilitar',
        disable: 'Deshabilitar',
        importJson: 'Importar desde JSON',
        exportJson: 'Exportar como JSON',
        invalidManifest: 'Manifiesto de plugin invalido.',
        installSuccess: 'Plugin "{{name}}" instalado exitosamente.',
        uninstallSuccess: 'Plugin "{{name}}" desinstalado.',
        maxPluginsReached: 'Numero maximo de plugins alcanzado.',
        categories: {
            'nutrient-schedule': 'Programa de Nutrientes',
            hardware: 'Integracion de Hardware',
            'grow-profile': 'Perfil de Cultivo',
        },
    },
    timeSeries: {
        title: 'Almacenamiento de Datos de Sensores',
        description:
            'Las lecturas de sensores se compactan automaticamente: los datos crudos se mantienen por 24 horas, los promedios por hora por 7 dias y los promedios diarios indefinidamente.',
        entryCount: '{{count}} entradas de series temporales almacenadas',
        compactionRun:
            'Compactacion completada: {{hourly}} por hora, {{daily}} agregaciones diarias.',
        clearDevice: 'Borrar datos del dispositivo',
        clearConfirm:
            'Esto eliminara permanentemente todos los datos de sensores de este dispositivo.',
    },
    predictiveAnalytics: {
        title: 'Analitica Predictiva',
        description: 'Predicciones potenciadas por AI basadas en datos historicos de sensores.',
        botrytisRisk: 'Riesgo de Botrytis',
        environmentAlerts: 'Alertas Ambientales',
        yieldImpact: 'Impacto en el Rendimiento',
        noData: 'No hay datos de sensores disponibles para el analisis.',
        riskLevels: {
            low: 'Bajo',
            moderate: 'Moderado',
            high: 'Alto',
            critical: 'Critico',
        },
    },
    pwa: {
        installBannerTitle: 'Instalar CannaGuide',
        installBannerDesc:
            'Agrega CannaGuide a tu pantalla de inicio para acceso sin conexion y una experiencia nativa.',
        installNow: 'Instalar ahora',
        later: 'Mas tarde',
        dontShowAgain: 'No mostrar de nuevo',
        offlineNotice: 'Estas sin conexion -- algunas funciones pueden estar limitadas.',
        updateAvailable: 'Una nueva version esta disponible!',
        updateNow: 'Actualizar ahora',
        installed: 'App instalada',
        notAvailable: 'Instalacion no disponible en este navegador',
    },
    grows: {
        title: 'Gestion de cultivos',
        subtitle: '{{count}} de {{max}} cultivos',
        createGrow: 'Nuevo cultivo',
        editGrow: 'Editar cultivo',
        name: 'Nombre',
        namePlaceholder: 'Ej. Interior Invierno 2025',
        description: 'Descripcion',
        descriptionPlaceholder: 'Notas opcionales sobre este cultivo',
        color: 'Color',
        activate: 'Activar',
        active: 'Activo',
        archive: 'Archivar',
        delete: 'Eliminar',
        confirmDelete: 'Confirmar eliminacion',
        archived: 'Cultivos archivados',
        limitReached: 'Maximo de {{max}} cultivos alcanzado (limite CanG aleman).',
        activeGrow: 'Cultivo activo: {{name}}',
        plantCount_one: '{{count}} planta',
        plantCount_other: '{{count}} plantas',
        statsPlants_one: '{{count}} planta',
        statsPlants_other: '{{count}} plantas',
        statsJournal_one: '{{count}} entrada',
        statsJournal_other: '{{count}} entradas',
        statsHealth: 'Salud: {{value}}%',
        statsAge: 'Mas antigua: {{days}}d',
    },
}
