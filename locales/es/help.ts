export const helpView = {
    title: 'Ayuda y Soporte',
    subtitle: 'Encuentra respuestas a tus preguntas y aprende mas sobre el cultivo.',
    tabs: {
        faq: 'FAQ',
        guides: 'Guias Visuales',
        lexicon: 'Lexico',
        manual: 'Manual de Usuario',
        faqDescription: 'Respuestas rapidas a las preguntas mas comunes sobre la app y el cultivo.',
        guidesDescription:
            'Guias visuales paso a paso para tecnicas de entrenamiento y flujos de trabajo de la app.',
        lexiconDescription:
            'Un glosario completo de cannabinoides, terpenos, flavonoides y terminos de cultivo.',
        manualDescription:
            'El manual de usuario completo que cubre cada funcion de la app en detalle.',
    },
    itemCount: '{{count}} elementos',
    termCount: '{{count}} terminos',
    sectionCount: '{{count}} secciones',
    subSectionCount: '{{count}} sub-secciones',
    guideCount: '{{count}} guias',
    faq: {
        title: 'Preguntas Frecuentes',
        subtitle: 'Dividido en operaciones de la app, soporte IA/offline y temas de cultivo.',
        searchPlaceholder: 'Buscar preguntas...',
        noResults: 'No se encontraron resultados para "{{term}}".',
        expandAll: 'Expandir Todo',
        collapseAll: 'Contraer Todo',
        resultCount: '{{count}} preguntas encontradas',
        resultCountFiltered: '{{count}} de {{total}} preguntas coinciden',
        groups: {
            localAi: 'IA Local, Sincronizacion y Recuperacion de la App',
            grow: 'Cultivo y Cuidado de Plantas',
        },
    },
    guides: {
        title: 'Guias Visuales',
        subtitle: 'Guias visuales paso a paso para tecnicas esenciales de cultivo.',
    },
    lexicon: {
        title: 'Lexico del Cultivador',
        subtitle:
            'Explora la ciencia detras de cannabinoides, terpenos, flavonoides y terminologia esencial de cultivo.',
        searchPlaceholder: 'Buscar terminos...',
        noResults: 'No se encontraron terminos para "{{term}}".',
        resultCount: 'Mostrando {{count}} de {{total}} terminos',
        categories: {
            all: 'Todos',
            cannabinoid: 'Cannabinoides',
            terpene: 'Terpenos',
            flavonoid: 'Flavonoides',
            general: 'General',
        },
        cannabinoids: {
            thc: {
                term: 'THC (Tetrahidrocannabinol)',
                definition:
                    'El cannabinoide psicoactivo mas conocido y principal del cannabis, responsable de la sensacion de "colocon".',
            },
            cbd: {
                term: 'CBD (Cannabidiol)',
                definition:
                    'Un cannabinoide no psicoactivo conocido por sus propiedades terapeuticas, incluyendo efectos analgesicos y antiinflamatorios.',
            },
            cbg: {
                term: 'CBG (Cannabigerol)',
                definition:
                    'Un cannabinoide no psicoactivo a menudo llamado la "madre de todos los cannabinoides" porque es precursor del THC y CBD.',
            },
            cbn: {
                term: 'CBN (Cannabinol)',
                definition:
                    'Un cannabinoide levemente psicoactivo que se forma cuando el THC se degrada. Es conocido por sus propiedades sedantes.',
            },
            cbc: {
                term: 'CBC (Cannabicromeno)',
                definition:
                    'Un cannabinoide no psicoactivo que muestra potencial para efectos antiinflamatorios y analgesicos.',
            },
            thca: {
                term: 'THCA (Acido Tetrahidrocannabinolico)',
                definition:
                    'El precursor acido no psicoactivo del THC que se encuentra en el cannabis crudo. Se convierte en THC mediante calor (descarboxilacion).',
            },
            cbda: {
                term: 'CBDA (Acido Cannabidiolico)',
                definition:
                    'El precursor acido del CBD que se encuentra en el cannabis crudo. Tiene sus propios efectos terapeuticos potenciales, particularmente antiinflamatorios.',
            },
            thcv: {
                term: 'THCV (Tetrahidrocannabivarina)',
                definition:
                    'Un cannabinoide estructuralmente similar al THC pero con efectos diferentes. Es conocido como supresor del apetito y puede ser psicoactivo en dosis altas.',
            },
            cbdv: {
                term: 'CBDV (Cannabidivarina)',
                definition:
                    'Un cannabinoide no psicoactivo estructuralmente similar al CBD, siendo estudiado por su potencial en el tratamiento de condiciones neurologicas.',
            },
        },
        terpenes: {
            myrcene: {
                term: 'Mirceno',
                definition:
                    'Un terpeno comun con aroma terroso y almizclado. Tambien se encuentra en los mangos. Conocido por sus propiedades calmantes y relajantes.',
            },
            limonene: {
                term: 'Limoneno',
                definition:
                    'Un terpeno con fuerte aroma citrico. Es conocido por sus efectos elevadores del animo y alivio del estres.',
            },
            caryophyllene: {
                term: 'Cariofileno',
                definition:
                    'Un terpeno con aroma picante y apimentado. Es el unico terpeno que tambien puede unirse a los receptores cannabinoides y tiene propiedades antiinflamatorias.',
            },
            pinene: {
                term: 'Pineno',
                definition:
                    'Un terpeno con aroma fresco a pino. Puede promover el estado de alerta y tiene propiedades antiinflamatorias.',
            },
            linalool: {
                term: 'Linalol',
                definition:
                    'Un terpeno con aroma floral similar a la lavanda. Es conocido por sus efectos calmantes, ansioliticos y promotores del sueno.',
            },
            terpinolene: {
                term: 'Terpinoleno',
                definition:
                    'Un terpeno con aroma complejo frutal-floral. A menudo tiene un efecto ligeramente estimulante y propiedades antioxidantes.',
            },
            humulene: {
                term: 'Humuleno',
                definition:
                    'Un terpeno con aroma terroso y lenoso, tambien encontrado en el lupulo. Es conocido por sus propiedades antiinflamatorias y supresoras del apetito.',
            },
            ocimene: {
                term: 'Ocimeno',
                definition:
                    'Un terpeno con aroma dulce, herbaceo y lenoso. Puede tener efectos estimulantes y se estudia por sus propiedades antivirales.',
            },
            bisabolol: {
                term: 'Bisabolol',
                definition:
                    'Un terpeno con aroma ligero, dulce y floral, tambien encontrado en la manzanilla. Es conocido por sus propiedades antiinflamatorias y calmantes para la piel.',
            },
            nerolidol: {
                term: 'Nerolidol',
                definition:
                    'Un terpeno con aroma lenoso y floral que recuerda a la corteza de arbol. Tiene propiedades sedantes y ansioliticas.',
            },
        },
        flavonoids: {
            cannaflavin: {
                term: 'Cannaflavinas (A, B, C)',
                definition:
                    'Un grupo de flavonoides encontrados exclusivamente en el cannabis. Tienen potentes propiedades antiinflamatorias.',
            },
            quercetin: {
                term: 'Quercetina',
                definition:
                    'Un flavonoide encontrado en muchas frutas y verduras. Es un potente antioxidante con propiedades antivirales.',
            },
            kaempferol: {
                term: 'Kaempferol',
                definition:
                    'Un flavonoide con fuertes propiedades antioxidantes que puede ayudar a prevenir el estres oxidativo.',
            },
            apigenin: {
                term: 'Apigenina',
                definition:
                    'Un flavonoide con propiedades ansioliticas y sedantes, tambien encontrado en la manzanilla.',
            },
            luteolin: {
                term: 'Luteolina',
                definition: 'Un flavonoide con propiedades antioxidantes y antiinflamatorias.',
            },
            orientin: {
                term: 'Orientina',
                definition:
                    'Un flavonoide con propiedades antioxidantes, antiinflamatorias y potencialmente antibioticas.',
            },
            vitexin: {
                term: 'Vitexina',
                definition: 'Un flavonoide que puede exhibir efectos analgesicos y antioxidantes.',
            },
        },
        general: {
            phValue: {
                term: 'Valor pH',
                definition:
                    'Una medida de la acidez o alcalinidad de una solucion. En el cultivo de cannabis, un pH correcto es crucial para la absorcion de nutrientes.',
            },
            ecValue: {
                term: 'EC (Conductividad Electrica)',
                definition:
                    'Una medida de la cantidad total de sales disueltas (nutrientes) en una solucion. Ayuda a monitorear la concentracion de nutrientes.',
            },
            vpd: {
                term: 'VPD (Deficit de Presion de Vapor)',
                definition:
                    'Una medida de la presion combinada de temperatura y humedad sobre la planta. Un valor VPD optimo permite una transpiracion eficiente.',
            },
            trichomes: {
                term: 'Tricomas',
                definition:
                    'Las pequenas glandulas resinosas en las flores y hojas del cannabis que producen cannabinoides y terpenos. Su color es un indicador clave de madurez.',
            },
            topping: {
                term: 'Topping',
                definition:
                    'Una tecnica de entrenamiento donde se corta la punta superior de la planta para fomentar el crecimiento de dos nuevas colas principales, creando una forma mas arbustiva.',
            },
            fimming: {
                term: 'FIM (F*ck I Missed)',
                definition:
                    'Una tecnica similar al topping, pero donde solo se remueve parte de la punta, a menudo resultando en cuatro o mas nuevos brotes principales.',
            },
            lst: {
                term: 'LST (Entrenamiento de Bajo Estres)',
                definition:
                    'Una tecnica de entrenamiento donde las ramas se doblan suavemente y se atan, creando un dosel mas ancho y plano y maximizando la exposicion a la luz.',
            },
            lollipopping: {
                term: 'Lollipopping',
                definition:
                    'La eliminacion de hojas inferiores y pequenos brotes que reciben poca luz para centrar la energia de la planta en las flores superiores mas grandes.',
            },
            scrog: {
                term: 'SCROG (Pantalla Verde)',
                definition:
                    'Una tecnica avanzada de entrenamiento donde se coloca una red o malla sobre las plantas para guiar los brotes horizontalmente, creando un dosel uniforme y productivo.',
            },
            sog: {
                term: 'SOG (Mar Verde)',
                definition:
                    'Un metodo de cultivo donde muchas plantas pequenas se cultivan juntas y se envian rapidamente a floracion para lograr una cosecha rapida y abundante.',
            },
            curing: {
                term: 'Curado',
                definition:
                    'El proceso de almacenar flores de cannabis secas en contenedores hermeticos para descomponer la clorofila y mejorar el sabor, aroma y suavidad del humo.',
            },
            nutrientLockout: {
                term: 'Bloqueo de Nutrientes',
                definition:
                    'Un estado donde la planta no puede absorber los nutrientes disponibles debido a un pH incorrecto en la zona radicular, incluso si estan presentes.',
            },
            flushing: {
                term: 'Lavado (Flushing)',
                definition:
                    'La practica de regar la planta solo con agua pura con pH ajustado durante las ultimas una o dos semanas antes de la cosecha para eliminar el exceso de sales de nutrientes.',
            },
            phenotype: {
                term: 'Fenotipo',
                definition:
                    'Las caracteristicas observables de una planta (apariencia, olor, efecto) que resultan de la interaccion de su genotipo y el ambiente.',
            },
            genotype: {
                term: 'Genotipo',
                definition:
                    'La composicion genetica de una planta, que determina su potencial para ciertos rasgos.',
            },
            landrace: {
                term: 'Landrace',
                definition:
                    'Una variedad de cannabis pura y original que se ha adaptado y estabilizado naturalmente en una region geografica especifica durante un largo periodo.',
            },
        },
    },
    manual: {
        title: 'Manual de Usuario',
        toc: 'Ir a Seccion',
        introduction: {
            title: 'Introduccion y Filosofia',
            content: `Bienvenido a CannaGuide 2025, tu copiloto definitivo para el cultivo de cannabis. Este manual te guia a traves de las funciones avanzadas de la app.<h4>Nuestros Principios Fundamentales:</h4><ul><li><strong>Offline First:</strong> 100% de funcionalidad sin conexion a internet. Las acciones se ponen en cola y se sincronizan despues. Una pila de IA local de tres capas asegura que los diagnosticos y consejos esten disponibles incluso sin red.</li><li><strong>Orientado al Rendimiento:</strong> Una UI fluida gracias a la descarga de simulaciones complejas a un Web Worker e inferencia optimizada con ONNX y cache LRU.</li><li><strong>Soberania de Datos:</strong> Control completo con respaldo total, restauracion y sincronizacion cifrada en la nube con un solo toque via GitHub Gist. Ningun servidor jamas ve tus datos.</li><li><strong>IA Multi-Proveedor:</strong> Trae tu propia clave para Google Gemini, OpenAI, Anthropic o xAI/Grok -- o usa la pila de IA local en el dispositivo sin necesidad de claves API.</li></ul>`,
        },
        general: {
            title: 'Funciones de toda la Plataforma',
            content: 'Funciones que mejoran tu experiencia en toda la app.',
            pwa: {
                title: 'PWA y Funcionalidad 100% Offline',
                content:
                    'Instala CannaGuide como una <strong>Progressive Web App</strong> para una experiencia nativa a traves del icono en el encabezado. El robusto Service Worker almacena en cache todos los datos de la app, incluyendo plantas, notas e incluso archivos de IA, asegurando <strong>funcionalidad 100% offline (excluyendo solicitudes IA en vivo)</strong>.',
            },
            commandPalette: {
                title: 'Paleta de Comandos (Cmd/Ctrl + K)',
                content:
                    'Presiona <code>Cmd/Ctrl + K</code> para abrir la paleta de comandos. Esta es la herramienta avanzada para navegacion instantanea y acciones, como buscar variedades o regar plantas, sin dejar el teclado.',
            },
            voiceControl: {
                title: 'Control por Voz y Habla',
                content:
                    'Controla la app sin manos. Presiona el <strong>boton del microfono</strong> en el encabezado para activar la escucha y di comandos como "Ir a Variedades" o "Buscar Blue Dream". Tambien puedes activar <strong>Texto a Voz (TTS)</strong> en Configuracion para que las guias, consejos de IA y descripciones se lean en voz alta.',
            },
            dataManagement: {
                title: 'Soberania de Datos: Respaldo y Restauracion',
                content:
                    'Bajo <code>Configuracion > Gestion de Datos</code>, tienes control total. Exporta todo el estado de tu app (plantas, configuracion, etc.) como un archivo JSON para <strong>respaldo</strong>. Importa este archivo despues para <strong>restaurar</strong> completamente tu estado en cualquier dispositivo.',
            },
            accessibility: {
                title: 'Accesibilidad Mejorada',
                content:
                    'La app ofrece opciones de accesibilidad completas en Configuracion. Activa una <strong>fuente amigable para dislexia</strong>, un <strong>modo de movimiento reducido</strong>, varios <strong>filtros de daltonismo</strong> y usa la funcion integrada de <strong>Texto a Voz (TTS)</strong> para que se lea el contenido en voz alta.',
            },
            localAi: {
                title: 'IA Local y Modelos Offline',
                content:
                    'CannaGuide incluye una <strong>pila de IA local de tres capas</strong> para que los consejos nunca se detengan:<ol><li><strong>WebLLM</strong> -- Inferencia acelerada por GPU via WebGPU (Qwen3-0.5B). Mejor calidad en dispositivos de alta gama.</li><li><strong>Transformers.js</strong> -- Inferencia ONNX via WASM/WebGPU (Qwen2.5-1.5B-Instruct). Funciona en cualquier navegador moderno.</li><li><strong>Reglas Heuristicas</strong> -- Analisis basado en palabras clave y VPD cuando no hay modelo cargado.</li></ol>Abre <strong>Configuracion -> General y UI</strong> para precargar modelos mientras estas en linea. El toggle <strong>Forzar WASM</strong> bloquea la inferencia a WASM cuando WebGPU causa inestabilidad. CLIP-ViT-L-14 maneja la clasificacion visual con 33 etiquetas especificas de cannabis. Los resultados de inferencia se almacenan en una cache LRU-64 para evitar trabajo repetido.',
            },
            cloudSync: {
                title: 'Sincronizacion en la Nube con un Toque',
                content:
                    'Respalda todo el estado de tu app en un <strong>Gist privado de GitHub</strong> con un solo toque. Abre <strong>Configuracion -> Gestion de Datos</strong> e ingresa un Token de Acceso Personal de GitHub con alcance <code>gist</code>. La app crea o actualiza un Gist privado que tu posees -- tus datos nunca tocan un servidor de terceros. Restaura en cualquier dispositivo importando desde el mismo Gist.',
            },
            multiProvider: {
                title: 'IA Multi-Proveedor (BYOK)',
                content:
                    'CannaGuide soporta <strong>cuatro proveedores de IA en la nube</strong> a traves de un modelo Trae-Tu-Propia-Clave (BYOK): Google Gemini, OpenAI, Anthropic y xAI/Grok. Cambia de proveedor en <strong>Configuracion -> IA</strong>. Las claves API estan cifradas en reposo con AES-256-GCM a traves del servicio criptografico integrado. Todos los proveedores comparten el mismo limitador de tasa (15 sol/min ventana deslizante) y la misma cadena de respaldo de IA local.',
            },
            dailyStrains: {
                title: 'Actualizaciones Diarias del Catalogo de Variedades',
                content:
                    'La biblioteca de variedades se actualiza automaticamente cada dia a las 04:20 UTC a traves de un flujo de trabajo de GitHub Actions. Las nuevas variedades contribuidas por la comunidad se validan contra duplicados y se fusionan en el catalogo. Recibes las ultimas adiciones a traves de la proxima actualizacion PWA sin ninguna accion manual.',
            },
        },
        strains: {
            title: 'Vista de Variedades',
            content:
                'El corazon de tu base de conocimiento de cannabis. Explora mas de 700 variedades, agrega las tuyas y usa herramientas de analisis potentes.',
            library: {
                title: 'Biblioteca (Todas/Mias/Favoritas)',
                content:
                    'Alterna entre la biblioteca completa, tus variedades personalizadas y tus favoritas. Usa la busqueda potente, el filtro alfabetico y el cajon de filtro avanzado para encontrar exactamente lo que necesitas. Cambia entre vistas de lista y cuadricula para tu diseno preferido.',
            },
            genealogy: {
                title: 'Explorador de Genealogia',
                content:
                    'Visualiza el linaje genetico de cualquier variedad. Usa las <strong>Herramientas de Analisis</strong> para resaltar landraces, trazar herencia Sativa/Indica y calcular la influencia genetica de los principales ancestros. Tambien puedes descubrir descendientes conocidos de una variedad seleccionada.',
            },
            aiTips: {
                title: 'Consejos de Cultivo IA',
                content:
                    'Genera consejos de cultivo unicos impulsados por IA para cualquier variedad basados en tu nivel de experiencia y objetivos. Cada solicitud tambien genera una imagen artistica unica para la variedad. Guarda tus consejos favoritos en el archivo "Consejos" para acceso offline.',
            },
            exports: {
                title: 'Exportaciones y Gestion de Datos',
                content:
                    'Selecciona una o mas variedades y usa el boton de exportacion en la barra de herramientas para generar un archivo PDF o TXT. Gestiona todas tus exportaciones pasadas en la pestana "Exportaciones", donde puedes volver a descargar o eliminarlas.',
            },
        },
        plants: {
            title: 'Vista de Plantas (La Sala de Cultivo)',
            content: 'Tu centro de mando para gestionar y simular hasta tres cultivos simultaneos.',
            dashboard: {
                title: 'Panel y Signos Vitales del Jardin',
                content:
                    'Obtiene una vision rapida de la salud general de tu jardin, el conteo de plantas activas y el ambiente promedio. Usa el <strong>Medidor VPD</strong> para evaluar el potencial de transpiracion. Aqui tambien puedes realizar acciones globales como "Regar Todas las Plantas" o solicitar un resumen de estado por IA.',
            },
            simulation: {
                title: 'Simulacion Avanzada',
                content:
                    'La app simula el crecimiento de las plantas en tiempo real basandose en principios cientificos como el <strong>Deficit de Presion de Vapor (VPD)</strong>. Este valor combina temperatura y humedad para determinar la capacidad de transpiracion de la planta. Cambia al <strong>Perfil Experto</strong> en <code>Configuracion > Plantas y Simulacion</code> para revelar y ajustar parametros fisicos avanzados para una simulacion mas granular.',
            },
            diagnostics: {
                title: 'Diagnosticos IA y Asesor',
                content:
                    'Usa herramientas de IA para mantener tus plantas saludables.<ul><li><strong>Diagnostico por Foto:</strong> Sube una foto de una hoja o area problematica para obtener un diagnostico instantaneo basado en IA.</li><li><strong>Asesor Proactivo:</strong> Obtiene consejos basados en datos de la IA segun los signos vitales en tiempo real y el historial reciente de tu planta.</li></ul>Todas las respuestas de IA se pueden guardar en el Archivo del Asesor.',
            },
            journal: {
                title: 'Diario Completo',
                content:
                    'Registra cada accion -- desde riego y entrenamiento hasta control de plagas y enmiendas. El diario es tu registro detallado y con marca de tiempo del ciclo de vida completo de la planta, que se puede filtrar por tipo de evento.',
            },
        },
        equipment: {
            title: 'Vista de Equipos (El Taller)',
            content:
                'Tu caja de herramientas para planificar y optimizar tu configuracion de cultivo.',
            configurator: {
                title: 'Configurador IA de Equipos',
                content:
                    'Responde unas pocas preguntas simples sobre tu presupuesto, experiencia y prioridades (como rendimiento vs. calidad) para recibir una lista completa de equipos con marcas especificas de la IA Gemini.',
            },
            calculators: {
                title: 'Calculadoras de Precision',
                content:
                    'Usa un conjunto de calculadoras para <strong>Ventilacion</strong>, <strong>Iluminacion (PPFD/DLI)</strong>, <strong>Costo Electrico</strong>, <strong>Mezcla de Nutrientes</strong> y mas para optimizar cada aspecto de tu cultivo.',
            },
            shops: {
                title: 'Tiendas de Cultivo y Bancos de Semillas',
                content:
                    'Explora listas curadas y especificas por region de Tiendas de Cultivo y Bancos de Semillas recomendados, con valoraciones, fortalezas e info de envio.',
            },
        },
        knowledge: {
            title: 'Vista de Conocimiento (La Biblioteca)',
            content: 'Tu recurso central para aprender, experimentar y dominar el cultivo.',
            mentor: {
                title: 'Mentor IA Contextual',
                content:
                    'Haz preguntas de cultivo al Mentor IA. Selecciona una de tus plantas activas para permitir que el mentor incorpore sus datos especificos en tiempo real en sus consejos para una consulta verdaderamente personalizada.',
            },
            breeding: {
                title: 'Laboratorio de Cruce',
                content:
                    'Las plantas cosechadas de alta calidad pueden producir semillas. En el Laboratorio de Cruce, puedes cruzar dos de estas semillas recolectadas para crear una <strong>variedad hibrida nueva y permanente</strong> que se agrega a tu biblioteca personal "Mis Variedades" para futuros cultivos.',
            },
            sandbox: {
                title: 'Sandbox Interactivo',
                content:
                    'Ejecuta escenarios "que pasaria si" sin riesgo. Clona una de tus plantas activas y ejecuta una simulacion acelerada de 14 dias para comparar los efectos de diferentes tecnicas de entrenamiento (p. ej., Topping vs. LST) sin arriesgar tus plantas reales.',
            },
            guide: {
                title: 'Guia de Cultivo Integrada',
                content:
                    'Accede a una referencia completa que incluye este Manual de Usuario, un Lexico del Cultivador, guias visuales claramente separadas y un FAQ buscable organizado por temas de la app y cultivo.',
            },
        },
    },
}

export const visualGuides = {
    topping: {
        title: 'Topping',
        description:
            'Aprende como cortar la parte superior de tu planta para fomentar un crecimiento mas frondoso y mas colas principales.',
    },
    lst: {
        title: 'Entrenamiento de Bajo Estres (LST)',
        description:
            'Dobla y ata las ramas de tu planta para abrir el dosel y maximizar la exposicion a la luz.',
    },
    defoliation: {
        title: 'Defoliacion',
        description:
            'Remueve hojas estrategicamente para mejorar el flujo de aire y permitir que mas luz llegue a los sitios de cogollos inferiores.',
    },
    harvesting: {
        title: 'Cosecha',
        description:
            'Identifica el momento perfecto para cosechar y maximizar la potencia y aroma de tus cogollos.',
    },
}

export const faq = {
    phValue: {
        question: 'Por que es tan importante el valor del pH?',
        answer: 'El pH de tu agua y medio determina que tan bien tu planta puede absorber nutrientes. Un pH incorrecto provoca bloqueo de nutrientes, incluso si hay suficientes presentes. Para tierra, el rango ideal es 6.0-6.8; para hidro/coco, es 5.5-6.5.',
    },
    yellowLeaves: {
        question: 'Que significan las hojas amarillas?',
        answer: 'Las hojas amarillas (clorosis) pueden tener muchas causas. Si comienzan en la parte inferior y suben, a menudo es una deficiencia de nitrogeno. Las manchas pueden indicar deficiencia de calcio o magnesio. El riego excesivo o insuficiente tambien puede causar hojas amarillas. Siempre verifica el pH y los habitos de riego primero.',
    },
    whenToHarvest: {
        question: 'Como se cuando es hora de cosechar?',
        answer: 'El mejor indicador son los tricomas (los pequenos cristales de resina en los cogollos). Usa una lupa. La cosecha es optima cuando la mayoria de los tricomas son blanco-lechosos con algunos ambar. Tricomas transparentes son demasiado temprano; demasiados tricomas ambar daran un efecto mas sedante.',
    },
    lightDistanceSeedling: {
        question: 'A que distancia debe estar mi luz de las plantulas?',
        answer: 'Esto depende mucho del tipo de luz y vataje. Una buena regla general para la mayoria de luces LED es una distancia de 45-60 cm (18-24 pulgadas). Observa tus plantulas de cerca. Si se estiran demasiado (se vuelven largas y delgadas), la luz esta demasiado lejos. Si las hojas muestran signos de quemadura o blanqueamiento, esta demasiado cerca.',
    },
    whenToFeed: {
        question: 'Cuando debo empezar a alimentar con nutrientes?',
        answer: 'La mayoria de tierras pre-fertilizadas tienen suficientes nutrientes para las primeras 2-3 semanas. Para plantulas, espera hasta que tengan 3-4 juegos de hojas verdaderas antes de comenzar con una solucion nutritiva muy debil (1/4 de la dosis recomendada). Observa la reaccion de la planta antes de aumentar la dosis.',
    },
    npkMeaning: {
        question: 'Que significan los numeros N-P-K en los fertilizantes?',
        answer: 'N-P-K significa Nitrogeno (N), Fosforo (P) y Potasio (K). Estos son los tres macronutrientes primarios que tu planta necesita. Los numeros representan el porcentaje de cada nutriente en el fertilizante. <ul><li><strong>N (Nitrogeno):</strong> Crucial para el crecimiento vegetativo (hojas, tallos).</li><li><strong>P (Fosforo):</strong> Esencial para el desarrollo de raices y la produccion de flores.</li><li><strong>K (Potasio):</strong> Importante para la salud general de la planta, resistencia a enfermedades y densidad de flores.</li></ul>',
    },
    calmagUsage: {
        question: 'Cuando y por que debo usar Cal-Mag?',
        answer: 'Cal-Mag (suplemento de Calcio-Magnesio) es importante cuando usas agua filtrada (como osmosis inversa) que carece de estos nutrientes secundarios, o cuando cultivas en fibra de coco, que tiende a retener calcio. Las deficiencias a menudo aparecen como pequenas manchas color oxido en las hojas.',
    },
    flushingPlants: {
        question: 'Que es el "flushing" y necesito hacerlo?',
        answer: 'El flushing es la practica de regar la planta solo con agua pura con pH ajustado durante las ultimas 1-2 semanas antes de la cosecha. La idea es eliminar el exceso de sales de nutrientes del medio y la planta, lo que se cree resulta en un sabor mas limpio y suave. A menudo es innecesario en cultivos organicos en tierra pero es practica comun en sistemas hidroponicos o de coco.',
    },
    vpdImportance: {
        question: 'Que es el VPD y por que deberia importarme?',
        answer: 'VPD (Deficit de Presion de Vapor) es una medicion avanzada que combina temperatura y humedad para describir la "sed" del aire. Un VPD optimo permite que la planta transpire (evapore agua) eficientemente, impulsando la absorcion de nutrientes y el crecimiento. Un VPD demasiado alto significa que el aire esta muy seco, causando estres. Un VPD demasiado bajo significa que el aire esta muy humedo, aumentando el riesgo de moho y ralentizando la absorcion de nutrientes.',
    },
    idealTempHumidity: {
        question: 'Cuales son los niveles ideales de temperatura y humedad?',
        answer: 'Depende de la etapa:<ul><li><strong>Plantulas:</strong> 22-26 grados C (72-79 grados F), 70-80% HR</li><li><strong>Vegetativo:</strong> 22-28 grados C (72-82 grados F), 50-70% HR</li><li><strong>Floracion:</strong> 20-26 grados C (68-79 grados F), 40-50% HR</li><li><strong>Floracion Tardia:</strong> 18-24 grados C (64-75 grados F), 30-40% HR</li></ul>El objetivo es alcanzar el rango VPD ideal para cada etapa.',
    },
    airCirculation: {
        question: 'Que tan importante es la circulacion de aire?',
        answer: 'Extremadamente importante. Uno o mas ventiladores oscilantes dentro de la carpa mantienen el aire en movimiento alrededor de las plantas. Esto fortalece los tallos, previene la formacion de "bolsas" humedas alrededor de las hojas y reduce significativamente el riesgo de moho y plagas.',
    },
    nutrientBurn: {
        question: 'Que es la quemadura de nutrientes?',
        answer: 'La quemadura de nutrientes aparece como hojas verde oscuro con puntas quemadas, amarillas o marrones que a menudo se curvan hacia arriba. Significa que la planta esta recibiendo mas nutrientes de los que puede procesar. La solucion es reducir la concentracion de nutrientes (EC) y/o lavar el medio con agua con pH ajustado.',
    },
    spiderMites: {
        question: 'Como detecto y combato los acaros rojos?',
        answer: 'Los acaros rojos son plagas diminutas que viven en el enves de las hojas. Los signos tempranos son pequenos puntos blancos o amarillos en las hojas. En una infestacion severa, veras telaranas finas. Se reproducen extremadamente rapido en ambientes calidos y secos. Se pueden usar pulverizaciones de aceite de neem o jabones insecticidas para combatirlos. Una buena prevencion incluye un ambiente limpio y no dejar que la humedad baje demasiado.',
    },
    stretchingCauses: {
        question: 'Por que mi planta se estira tanto?',
        answer: 'El estiramiento excesivo, donde la planta desarrolla tallos largos y delgados con grandes espacios entre nudos, es casi siempre causado por luz insuficiente. La planta esta "buscando" la fuente de luz. Acerca tu luz o usa una mas potente. Algunas variedades Sativa tambien son geneticamente propensas a estirarse, especialmente al inicio de la fase de floracion.',
    },
    toppingVsFimming: {
        question: 'Cual es la diferencia entre Topping y FIMing?',
        answer: 'Ambas son tecnicas de "entrenamiento de alto estres" para romper la dominancia apical y crear mas colas principales. Con <strong>Topping</strong>, cortas limpiamente la parte superior del brote principal, resultando en dos nuevos brotes principales. Con <strong>FIMing</strong> (F*ck I Missed), pellizcas la punta, dejando una pequena cantidad. Si se hace correctamente, esto puede resultar en cuatro o mas nuevos brotes. El Topping es mas preciso; el FIMing puede resultar en un crecimiento mas frondoso.',
    },
    whatIsScrog: {
        question: 'Que es un SCROG?',
        answer: 'SCROG significa "Screen of Green" (Pantalla Verde). Es una tecnica avanzada de entrenamiento donde una red o malla se coloca horizontalmente sobre las plantas. A medida que la planta crece, los brotes se tuckan debajo de la malla y se entrenan para crecer horizontalmente. Esto crea un dosel ancho, plano y uniforme donde todos los sitios de cogollos reciben la misma cantidad optima de luz, maximizando el rendimiento.',
    },
    whatIsLollipopping: {
        question: 'Que significa "lollipopping"?',
        answer: '"Lollipopping" es una tecnica de defoliacion que generalmente se realiza justo antes o al inicio de la fase de floracion. Implica remover todas las hojas inferiores y pequenos brotes que estan en la sombra y nunca se desarrollarian en cogollos densos. Esto concentra toda la energia de la planta en las flores superiores del dosel, resultando en colas principales mas grandes y densas.',
    },
    dryingDuration: {
        question: 'Cuanto tiempo debo secar mi cosecha?',
        answer: 'El secado generalmente toma 7-14 dias. El objetivo es un secado lento y controlado en un espacio oscuro y fresco a aproximadamente 18-20 grados C (64-68 grados F) y 55-60% de humedad. Una buena prueba es la "prueba del tallo": si los tallos mas pequenos se rompen en vez de solo doblarse cuando los doblas, los cogollos estan listos para el curado en frascos.',
    },
    curingImportance: {
        question: 'Por que es tan importante el curado?',
        answer: 'El curado es un paso crucial para la calidad final. Durante este proceso, que se realiza en frascos hermeticos, las bacterias descomponen la clorofila y otras sustancias no deseadas. Esto lleva a un humo mucho mas suave y permite que el complejo perfil de terpenos de la variedad (aroma y sabor) se desarrolle completamente. Un buen curado puede ser la diferencia entre cannabis mediocre y de primera calidad.',
    },
    storageHarvest: {
        question: 'Como debo almacenar mi cosecha terminada?',
        answer: 'Despues del curado, los cogollos deben almacenarse a largo plazo en contenedores de vidrio hermeticos en un lugar fresco y oscuro. La luz, el calor y el oxigeno son los principales enemigos que degradan los cannabinoides y terpenos. La temperatura ideal de almacenamiento es por debajo de 21 grados C (70 grados F). Los paquetes de humedad (p. ej., 62% HR) en los frascos pueden ayudar a mantener el nivel de humedad perfecto.',
    },
    autoflowerVsPhotoperiod: {
        question: 'Autoflower vs. Fotoperiodo: Cual es la diferencia?',
        answer: 'Las plantas de <strong>Fotoperiodo</strong> requieren un cambio en el ciclo de luz (cambiar a 12 horas de luz / 12 horas de oscuridad) para iniciar la floracion. Tienen una fase vegetativa mas larga y tipicamente crecen mas grandes y producen mas. Las <strong>Autoflowers</strong> florecen automaticamente despues de cierto tiempo (generalmente 3-4 semanas), independientemente del ciclo de luz. Son mas rapidas de terminar, se mantienen mas pequenas y a menudo son mas faciles para principiantes, pero el rendimiento generalmente es menor.',
    },
    howOftenToWater: {
        question: 'Con que frecuencia necesito regar?',
        answer: 'No hay un horario fijo. El mejor metodo es levantar la maceta y sentir su peso. Riega abundantemente hasta que algo salga por el fondo (drenaje), luego espera hasta que la maceta se sienta significativamente mas ligera. Esto asegura que las raices reciban suficiente oxigeno entre riegos. Tambien, introduce tu dedo unos 2-3 cm en la tierra; si sale seco, probablemente es momento de regar.',
    },
    potSize: {
        question: 'Que tamano de maceta debo usar?',
        answer: 'El tamano de la maceta depende del tipo de planta y tu tamano final deseado. Una buena regla general:<ul><li><strong>Autoflowers:</strong> Macetas de 10-15 litros (3-4 galones) son ideales, ya que no les gusta ser trasplantadas.</li><li><strong>Fotoperiodo:</strong> Comienza en macetas mas pequenas (1-3 litros) y trasplanta 1-2 veces a mas grandes, p. ej., 15-25 litros (4-7 galones) para la etapa final. Esto promueve un sistema radicular saludable.</li></ul>Macetas mas grandes significan mas espacio para raices y potencialmente plantas mas grandes, pero necesitan regarse con menos frecuencia.',
    },
    localAiFallback: {
        question: 'Que pasa si Gemini no esta disponible?',
        answer: 'CannaGuide automaticamente recurre a la pila de IA local. Si el modelo en linea no puede responder, la app usa analisis heuristico de plantas para que los diagnosticos y consejos permanezcan disponibles.',
    },
    localAiPreload: {
        question: 'Como uso la IA Local offline?',
        answer: 'Abre Configuracion -> General y UI y presiona <strong>Precargar Modelos Offline</strong> mientras estas en linea. Esto prepara los modelos de texto, vision, embeddings y NLP locales para uso offline.',
    },
    localAiStorage: {
        question: 'Cuanto almacenamiento necesitan los modelos locales?',
        answer: 'Espera aproximadamente unos cientos de megabytes de almacenamiento del navegador para los modelos de IA local actuales. Usa un dispositivo con suficiente espacio libre y almacenamiento persistente habilitado para mejores resultados.',
    },
    localAiWebGpu: {
        question: 'Necesito WebGPU?',
        answer: 'No. WebGPU permite que CannaGuide use el runtime WebLLM en dispositivos compatibles, pero la app automaticamente recurre a Transformer.js si WebGPU no esta disponible.',
    },
    localAiTroubleshooting: {
        question: 'Que debo hacer si falla la precarga del modelo offline?',
        answer: 'Reintenta con una conexion estable, asegurate de que el almacenamiento del navegador no este lleno y confirma que el dispositivo tiene permiso para persistir almacenamiento. Si es necesario, limpia la cache offline en Configuracion y precarga de nuevo.',
    },
    localAiSemanticRag: {
        question: 'Que es el RAG Semantico?',
        answer: 'El RAG Semantico usa un modelo de embeddings local (MiniLM) para encontrar las entradas de registro de cultivo mas relevantes por significado -- no solo por palabras clave. Esto mejora dramaticamente la calidad del contexto de IA al responder preguntas sobre tu historial de cultivo.',
    },
    localAiSentiment: {
        question: 'Que hace el analisis de sentimiento del diario?',
        answer: 'El modelo de sentimiento local analiza el tono emocional de las entradas de tu diario para detectar patrones a lo largo del tiempo. Puede mostrar si tu experiencia de cultivo esta tendiendo positiva, negativa o estable -- ayudandote a detectar problemas temprano.',
    },
    localAiSummarization: {
        question: 'Como funciona la sumarizacion de texto local?',
        answer: 'El modelo de sumarizacion condensa largos registros de cultivo e historiales de chat del mentor en resumenes concisos. Esto te ayuda a revisar rapidamente sesiones pasadas sin desplazarte por cientos de entradas.',
    },
    localAiQueryRouting: {
        question: 'Que es el enrutamiento inteligente de consultas?',
        answer: 'El modelo de clasificacion zero-shot automaticamente categoriza tus preguntas (p. ej., riego, nutrientes, plagas) para ayudar a la IA a proporcionar respuestas mas relevantes -- incluso sin conexion a internet.',
    },
    localAiPersistentCache: {
        question: 'Que es la cache de inferencia persistente?',
        answer: 'Las respuestas de IA se almacenan en IndexedDB para que preguntas identicas se respondan instantaneamente -- incluso despues de recargar la app. La cache mantiene hasta 256 entradas y automaticamente desaloja las mas antiguas cuando esta llena.',
    },
    localAiTelemetry: {
        question: 'Que rastrea la telemetria de IA local?',
        answer: 'La telemetria mide la velocidad de inferencia, el rendimiento de tokens, las tasas de acierto de cache y el uso de modelos -- todo localmente en tu dispositivo. Ningun dato sale jamas del navegador. Esto te ayuda a entender si tu dispositivo es lo suficientemente potente para la IA local.',
    },
    cloudSync: {
        question: 'Como funciona la Sincronizacion en la Nube con un Toque?',
        answer: 'CannaGuide respalda todo el estado de tu app en un <strong>Gist privado de GitHub</strong> que solo tu posees. Abre Configuracion -> Gestion de Datos, agrega un Token de Acceso Personal de GitHub con alcance <code>gist</code> y toca Sincronizar. Restaura en cualquier dispositivo importando desde el mismo Gist. Ningun servidor de terceros jamas toca tus datos.',
    },
    multiProviderAi: {
        question: 'Puedo usar un proveedor de IA diferente?',
        answer: 'Si. CannaGuide soporta <strong>Google Gemini, OpenAI, Anthropic y xAI/Grok</strong> a traves de un modelo Trae-Tu-Propia-Clave. Cambia proveedores en Configuracion -> IA. Todas las claves API estan cifradas en reposo con AES-256-GCM. Si todos los proveedores no estan disponibles, la app recurre a la pila de IA local.',
    },
    forceWasm: {
        question: 'Que hace el toggle Forzar WASM?',
        answer: 'Bloquea el backend de inferencia de IA Local a WASM incluso cuando se detecta WebGPU. Usalo cuando WebGPU cause fallos o artefactos visuales en tu dispositivo. El toggle se encuentra en Configuracion -> General y UI.',
    },
    visionClassification: {
        question: 'Como funciona el diagnostico de plantas por foto offline?',
        answer: 'La app usa un modelo de vision CLIP-ViT-L-14 que reconoce 33 etiquetas especificas de cannabis -- desde hojas saludables hasta deficiencias de nutrientes, plagas y moho. El modelo se ejecuta completamente en el navegador via ONNX y no envia imagenes a ningun servidor. Precargalo en Configuracion -> General y UI mientras estas en linea.',
    },
}
