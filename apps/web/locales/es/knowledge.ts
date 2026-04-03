export const knowledgeView = {
    title: 'Centro de Conocimiento',
    subtitle: 'Tu guia interactiva para un cultivo exitoso.',
    tabs: {
        mentor: 'Mentor IA',
        guide: 'Guia de Cultivo',
        archive: 'Archivo del Mentor',
        breeding: 'Laboratorio de Cruce',
        sandbox: 'Sandbox',
        growTech: 'Grow Tech 2026',
        lexikon: 'Lexico',
        atlas: 'Atlas de Enfermedades',
        rechner: 'Calculadora',
        lernpfad: 'Rutas de Aprendizaje',
        analytik: 'Analitica',
        navLabel: 'Secciones de conocimiento',
    },
    hub: {
        selectPlant: 'Seleccionar Planta',
        noPlants:
            'No hay plantas activas para consejos contextuales. Comienza un cultivo para empezar!',
        todaysFocus: 'Enfoque de Hoy para {{plantName}}',
    },
    aiMentor: {
        title: 'Mentor IA',
        plantContext: 'Chateando con Mentor IA en el contexto de {{name}}',
        plantContextSubtitle:
            'Selecciona una planta para hacer preguntas contextuales y obtener consejo.',
        startChat: 'Iniciar Chat',
        inputPlaceholder: 'Pregunta al mentor...',
        clearChat: 'Limpiar Chat',
        clearConfirm: 'Estas seguro de que quieres borrar el historial de chat para esta planta?',
    },
    archive: {
        title: 'Archivo del Mentor',
        empty: 'Aun no has archivado ninguna respuesta del mentor.',
        saveButton: 'Guardar en Archivo',
        saveSuccess: 'Respuesta guardada en el archivo!',
        queryLabel: 'Tu Consulta',
        editTitle: 'Editar Respuesta',
    },
    breeding: {
        title: 'Laboratorio de Cruce',
        description:
            'Cruza tus semillas recolectadas para crear nuevas variedades unicas con caracteristicas combinadas.',
        collectedSeeds: 'Semillas Recolectadas',
        noSeeds: 'Recolecta semillas de plantas listas para cosechar para empezar a cruzar.',
        parentA: 'Padre A',
        parentB: 'Padre B',
        clearParent: 'Limpiar {{title}}',
        selectSeed: 'Seleccionar semilla',
        dropSeed: 'Suelta la semilla aqui',
        breedButton: 'Cruzar Nueva Variedad',
        resultsTitle: 'Resultado del Cruce',
        newStrainName: 'Nombre de la Nueva Variedad',
        potentialTraits: 'Rasgos Potenciales',
        saveStrain: 'Guardar Variedad',
        breedingSuccess: 'Se ha cruzado exitosamente "{{name}}"! Se ha anadido a "Mis Variedades".',
        splicingGenes: 'Empalmando genes...',
        flowering: 'Floracion',
        phenoTracking: 'Seguimiento Fenotipico',
        vigor: 'Vigor',
        resin: 'Resina',
        aroma: 'Aroma',
        diseaseResistance: 'Resistencia a Enfermedades',
        automatedGenetics: 'Estimacion Genetica Automatizada',
        stabilityScore: 'Puntuacion de Estabilidad',
        arTitle: 'Vista Previa de Cruce AR',
        arSupported: 'WebXR listo',
        arFallback: 'Respaldo 3D',
        arPreviewLabel: 'Vista previa tridimensional del cruce',
        arLoading: 'Cargando vista previa AR...',
        webglUnavailableTitle: 'Vista previa 3D no disponible',
        webglUnavailableDescription:
            'Tu navegador no pudo crear un contexto WebGL, esta vista previa se muestra como respaldo estatico.',
        webglUnavailableHint:
            'Activa la aceleracion por hardware o cambia a un perfil de navegador con GPU para restaurar la vista previa en vivo.',
    },
    scenarios: {
        toppingVsLst: {
            title: 'Ejecutar Experimento Topping vs. LST',
            description:
                'Simula un periodo de crecimiento de 14 dias comparando una planta que recibe LST contra una que ha sido podada.',
        },
        tempPlus2c: {
            title: 'Ejecutar Experimento Temperatura +2\u00b0C',
            description:
                'Simula un periodo de crecimiento de 14 dias comparando condiciones base contra un aumento de +2\u00b0C en la temperatura del dosel.',
        },
    },
    knowledgebase: {
        'phase1-prep': {
            title: 'Fase 1: Preparacion y Equipamiento',
            content: `<h3>Bienvenido al Cultivo!</h3><p>Una cosecha exitosa comienza con una preparacion solida. Esta fase trata de crear el entorno perfecto antes de que tu semilla toque el medio.</p>
                      <strong>La Limpieza es Clave:</strong> Limpia y desinfecta a fondo todo tu espacio de cultivo, incluyendo paredes de la carpa, suelo y todo el equipo para prevenir plagas y enfermedades desde el primer dia.<br>
                      <strong>Revision del Equipo:</strong>
                      <ul>
                        <li><strong>Luz:</strong> Prueba tu lampara y temporizador. Para plantulas, posiciona la luz mucho mas alta que para una planta madura para evitar estres.</li>
                        <li><strong>Ventilacion:</strong> Asegurate de que tu ventilador extractor, entrada y ventiladores de circulacion funcionen correctamente.</li>
                        <li><strong>Medio y Macetas:</strong> Si usas tierra, humedecela ligeramente antes de plantar. Asegurate de que tus macetas tengan excelente drenaje.</li>
                      </ul>
                      <strong>Calibracion del Entorno:</strong> Calibra tus termo-higrometros. Apunta a un entorno estable alrededor de <strong>22-25\u00b0C</strong> y <strong>65-75% de humedad relativa</strong>.`,
        },
        'phase2-seedling': {
            title: 'Fase 2: Germinacion y Plantula',
            content: `<h3>Las Primeras Semanas de Vida</h3><p>Esta es la fase mas delicada. El lema es: menos es mas. Evita sobre-cuidar tu planta.</p>
                      <strong>Germinacion:</strong> Manten el medio consistentemente humedo, pero nunca empapado. Una campana de humedad puede ayudar a mantener alta humedad (70-80%).<br>
                      <strong>Luz:</strong> Las plantulas no necesitan luz intensa. 18/6 es el ciclo de luz estandar.<br>
                      <strong>Agua:</strong> Riega con moderacion en un pequeno circulo alrededor del tallo.<br>
                      <strong>Nutrientes:</strong> No alimentes con nutrientes todavia! La mayoria de las tierras contienen suficiente para las primeras 2-3 semanas.`,
        },
        'phase3-vegetative': {
            title: 'Fase 3: Crecimiento Vegetativo',
            content: `<h3>Hora de Crecer!</h3><p>Durante esta fase, tu planta se enfocara en desarrollar una estructura fuerte de hojas, ramas y raices.</p>
                      <strong>Luz:</strong> Tu planta ahora puede manejar mucha mas luz. Aumenta gradualmente la intensidad. 18/6 sigue siendo el ciclo estandar.<br>
                      <strong>Nutrientes:</strong> Aumenta lentamente la fuerza de los nutrientes. Un fertilizante rico en Nitrogeno (N) es crucial.<br>
                      <strong>Entrenamiento:</strong> Ahora es el momento perfecto para empezar el entrenamiento. Comienza con <strong>LST</strong> o realiza <strong>Topping</strong>.<br>
                      <strong>Entorno:</strong> La humedad ideal baja a alrededor de 50-70%.`,
        },
        'phase4-flowering': {
            title: 'Fase 4: Floracion',
            content: `<h3>Comienza la Floracion</h3><p>Esta es la fase mas emocionante donde tu planta comienza a producir cogollos.</p>
                      <strong>Ciclo de Luz:</strong> Para iniciar la floracion, debes cambiar a estrictas <strong>12 horas de luz y 12 horas de oscuridad ininterrumpida</strong>.<br>
                      <strong>El Estiramiento:</strong> En las primeras 2-3 semanas de floracion, tu planta puede duplicar o triplicar su altura.<br>
                      <strong>Nutrientes:</strong> Cambia a un fertilizante especifico para floracion, bajo en Nitrogeno (N) y alto en Fosforo (P) y Potasio (K).<br>
                      <strong>Humedad:</strong> Baja gradualmente la humedad a <strong>40-50%</strong>.`,
        },
        'phase5-harvest': {
            title: 'Fase 5: Cosecha, Secado y Curado',
            content: `<h3>Los Toques Finales</h3><p>La paciencia en esta fase final es lo que separa el cannabis mediocre del de primera calidad.</p>
                      <strong>Momento de Cosecha:</strong> El mejor indicador es el color de los tricomas. Cosecha cuando la mayoria esten nublados/lechosos.<br>
                      <strong>Secado:</strong> Cuelga las ramas boca abajo en un espacio oscuro y fresco. Apunta a <strong>18-20\u00b0C</strong> y <strong>55-60% de humedad</strong>. 7-14 dias.<br>
                      <strong>Curado:</strong> Coloca los cogollos en frascos hermeticos de vidrio. Abrelos diariamente durante 5-10 minutos la primera semana.`,
        },
        'fix-overwatering': {
            title: 'Solucion: Riego Excesivo',
            content: `<h3>Mi Planta se Esta Ahogando!</h3><p>El riego excesivo es el error #1 de los nuevos cultivadores.</p>
                      <strong>Sintomas:</strong> La planta entera se ve caida y triste. Las hojas se sienten firmes y pesadas, se curvan hacia abajo.<br>
                      <strong>Acciones Inmediatas:</strong>
                      <ul>
                        <li><strong>Deja de Regar:</strong> No riegues hasta que la maceta sea significativamente mas ligera.</li>
                        <li><strong>Mejora la Circulacion:</strong> Apunta un ventilador a la superficie del suelo.</li>
                        <li><strong>Revisa el Drenaje:</strong> Asegurate de que tu maceta no este en un charco de agua.</li>
                      </ul>`,
        },
        'fix-calcium-deficiency': {
            title: 'Solucion: Deficiencia de Calcio',
            content: `<h3>Solucionar Deficiencia de Calcio</h3><p>El calcio es un nutriente inmovil.</p>
                      <strong>Sintomas:</strong> Manchas pequenas marron-oxido en las hojas, bordes amarillentos. Crecimiento nuevo atrofiado o retorcido.<br>
                      <strong>Causas Comunes:</strong>
                      <ul>
                        <li><strong>pH Incorrecto:</strong> Esta es la causa mas comun.</li>
                        <li><strong>Agua RO/Destilada:</strong> Esta agua carece de minerales.</li>
                        <li><strong>Medio de Fibra de Coco:</strong> El coco se une naturalmente al calcio.</li>
                      </ul>
                      <strong>Solucion:</strong> Primero, siempre verifica y corrige el pH. Usa un suplemento de Cal-Mag.`,
        },
        'fix-nutrient-burn': {
            title: 'Solucion: Quemadura de Nutrientes',
            content: `<h3>Solucionar Quemadura de Nutrientes (Sobrealimentacion)</h3><p>Ocurre cuando una planta recibe mas nutrientes de los que puede usar.</p>
                      <strong>Sintomas:</strong> Las puntas de las hojas se vuelven amarillas, luego marrones y crujientes.<br>
                      <strong>Solucion:</strong>
                      <ol>
                        <li><strong>Lava el medio:</strong> Riega con abundante agua pura ajustada en pH.</li>
                        <li><strong>Reduce la alimentacion:</strong> Usa solo la mitad de la dosis recomendada la proxima vez.</li>
                      </ol>`,
        },
        'fix-pests': {
            title: 'Solucion: Plagas Comunes',
            content: `<h3>Lidiando con Visitantes No Deseados</h3><p>La deteccion temprana es clave.</p>
                      <strong>Acaros Arana:</strong> Manchas blancas o amarillas pequenas en la parte superior de las hojas. Soluciones: aceite de neem o jabon insecticida.<br>
                      <strong>Mosquitos del Hongo:</strong> Moscas negras pequenas alrededor de la superficie del suelo. Solucion: deja secar la capa superior del suelo. Usa trampas adhesivas amarillas.`,
        },
        'concept-training': {
            title: 'Concepto Basico: Entrenamiento de Plantas',
            content: `<h3>Por Que Entrenar Tus Plantas?</h3><p>El entrenamiento manipula el crecimiento para crear una estructura mas eficiente.</p>
                      <strong>Tipos Principales:</strong>
                      <ul>
                        <li><strong>LST (Entrenamiento de Bajo Estres):</strong> Doblar y atar suavemente las ramas.</li>
                        <li><strong>HST (Entrenamiento de Alto Estres):</strong> Tecnicas como <strong>Topping</strong> o <strong>Super Cropping</strong>.</li>
                      </ul>
                      <strong>Resultado:</strong> Multiples cogollos grandes y densos en lugar de uno solo principal.`,
        },
        'concept-environment': {
            title: 'Concepto Basico: El Entorno',
            content: `<h3>Dominando Tu Espacio de Cultivo</h3><p>Los tres pilares son Temperatura, Humedad y Circulacion de Aire.</p>
                      <strong>Temperatura y Humedad:</strong> Estan vinculadas y su relacion se mide por <strong>VPD (Deficit de Presion de Vapor)</strong>.
                      <ul>
                        <li><strong>Plantula/Veg:</strong> Temperaturas mas calidas (22-28\u00b0C) y mayor humedad (50-70%).</li>
                        <li><strong>Floracion:</strong> Temperaturas mas frias (20-26\u00b0C) y menor humedad (40-50%).</li>
                      </ul>
                      <strong>Circulacion de Aire:</strong>
                      <ul>
                        <li><strong>Ventilador Extractor:</strong> Elimina constantemente el aire caliente, viciado y humedo.</li>
                        <li><strong>Ventilador(es) de Circulacion:</strong> Crean una brisa suave dentro de la carpa.</li>
                      </ul>`,
        },
    },
    sandbox: {
        title: 'Sandbox Experimental',
        experimentOn: 'Experimentar en {{name}}',
        scenarioDescription: 'Comparado {{actionA}} vs. {{actionB}} durante {{duration}} dias.',
        runningSimulation: 'Ejecutando simulacion acelerada...',
        startExperiment: 'Nuevo Experimento',
        modal: {
            title: 'Iniciar Nuevo Experimento',
            description:
                'Selecciona una planta para ejecutar una simulacion "Topping vs. LST" de 14 dias.',
            runScenario: 'Iniciar Escenario',
            noPlants: 'Primero debes cultivar una planta para iniciar un experimento.',
        },
        savedExperiments: 'Experimentos Guardados',
        noExperiments: 'Aun no hay experimentos guardados.',
        basedOn: 'Basado en: {{name}}',
        run: 'Ejecucion: {{date}}',
    },
    guide: {
        phases: 'Fases',
        coreConcepts: 'Conceptos Basicos',
        troubleshooting: 'Solucion de Problemas',
        growTech: 'Grow Tech 2026',
        genetics: 'Genetica',
        searchPlaceholder: 'Buscar guias...',
        noResults: 'No se encontraron articulos para "{{term}}"',
        readProgress: '{{read}} de {{total}} articulos leidos',
    },
    growLog: {
        title: 'Grow-Log RAG',
        description:
            'Consulta tu propio diario directamente. Las entradas relevantes del registro se cargan primero, luego son analizadas por la IA.',
        placeholder: 'P. ej., Por que fluctua mi VPD en la semana 4?',
        analyzing: 'Analizando...',
        startAnalysis: 'Iniciar Analisis RAG',
        activeCorpus: 'Plantas activas en el corpus RAG: {{count}}',
    },
    lexikon: {
        searchPlaceholder: 'Buscar terminos...',
        filterLabel: 'Filtrar por categoria',
        all: 'Todos',
        categories: {
            cannabinoid: 'Cannabinoides',
            terpene: 'Terpenos',
            flavonoid: 'Flavonoides',
            nutrient: 'Nutrientes',
            disease: 'Enfermedades',
            general: 'General',
        },
        noResults: 'Sin resultados para "{{term}}"',
        resultCount: '{{count}} de {{total}} terminos',
        totalCount: '{{count}} terminos',
        noDefinition: 'Sin definicion disponible.',
    },
    atlas: {
        searchPlaceholder: 'Buscar diagnosticos...',
        allCategories: 'Todas las categorias',
        allUrgencies: 'Todas las urgencias',
        noResults: 'No se encontraron entradas.',
        filterByCategory: 'Filtrar por categoria',
        filterByUrgency: 'Filtrar por urgencia',
        entryCount: '{{count}} entradas',
        close: 'Cerrar',
        category: {
            deficiency: 'Deficiencia',
            toxicity: 'Toxicidad',
            environmental: 'Ambiental',
            pest: 'Plagas',
            disease: 'Enfermedad',
        },
        severity: {
            low: 'Bajo',
            medium: 'Medio',
            high: 'Alto',
            critical: 'Critico',
        },
        urgency: {
            monitor: 'Monitorear',
            act_soon: 'Actuar pronto',
            act_immediately: 'Actuar de inmediato',
        },
        detail: {
            symptoms: 'Sintomas',
            causes: 'Causas',
            treatment: 'Tratamiento',
            prevention: 'Prevencion',
            relatedTerms: 'Terminos relacionados',
        },
        diseases: {
            'nitrogen-deficiency': {
                name: 'Deficiencia de Nitrogeno',
                symptoms:
                    'El amarillamiento comienza en las hojas inferiores mas viejas y avanza hacia arriba. Las hojas se tornan amarillo palido y luego completamente amarillas. Crecimiento lento.',
                causes: 'Riego excesivo, pH bajo (bloquea N), nitrogeno insuficiente en la solucion nutritiva, dano a las raices.',
                treatment:
                    'Lavar el sustrato con agua ajustada al pH correcto, luego alimentar con solucion rica en nitrogeno. Corregir el pH a 6,0-7,0 (tierra) o 5,5-6,5 (hidro).',
                prevention:
                    'Monitorear el pH constantemente, usar nutrientes equilibrados, evitar el exceso de riego.',
            },
            'phosphorus-deficiency': {
                name: 'Deficiencia de Fosforo',
                symptoms:
                    'Decoloracion purpura o rojiza en el envez de las hojas y tallos. Hojas verde oscuro que pueden curvarse hacia abajo. Crecimiento lento.',
                causes: 'pH bajo (menos de 6,0 en tierra), bajas temperaturas en la zona radicular (menos de 15 C), poco fosforo en la solucion.',
                treatment:
                    'Aumentar el pH si es necesario, elevar la temperatura del cultivo, suplementar con nutriente de floracion rico en fosforo.',
                prevention:
                    'Mantener la zona radicular por encima de 18 C, conservar el pH correcto, usar nutrientes de floracion al entrar en la fase de flores.',
            },
            'potassium-deficiency': {
                name: 'Deficiencia de Potasio',
                symptoms:
                    'Bordes y puntas de hojas marrones y crujientes, comenzando en las hojas mas viejas. Amarillamiento entre las nervaduras. Tallos debiles.',
                causes: 'pH alto (bloquea K), exceso de calcio o magnesio compitiendo por la absorcion, poco potasio en la solucion.',
                treatment:
                    'Verificar y corregir el pH, reducir nutrientes competidores si son excesivos, suplementar potasio.',
                prevention:
                    'Usar formula nutritiva completa con potasio adecuado, especialmente al final de la floracion.',
            },
            'calcium-deficiency': {
                name: 'Deficiencia de Calcio',
                symptoms:
                    'Manchas marrones o de color oxido en hojas nuevas. Nuevo crecimiento retorcido o arrugado. Tallos debiles.',
                causes: 'pH bajo reduciendo la disponibilidad de calcio, uso de agua osmotizada/destilada sin remineralizacion, fibra de coco sin preacondicionar.',
                treatment:
                    'Corregir el pH a 6,2-7,0, anadir suplemento Cal-Mag, acondicionar la fibra de coco antes de usarla.',
                prevention:
                    'Acondicionar la fibra de coco, usar Cal-Mag con agua osmotizada, mantener el pH correcto.',
            },
            'magnesium-deficiency': {
                name: 'Deficiencia de Magnesio',
                symptoms:
                    'Amarillamiento entre las nervaduras (clorosis intervenal) en hojas medias o viejas mientras las nervaduras permanecen verdes. Las hojas pueden curvarse hacia arriba.',
                causes: 'pH bajo, potasio alto compitiendo con la absorcion de magnesio, magnesio insuficiente en la solucion.',
                treatment:
                    'Corregir el pH, reducir el potasio si es excesivo, anadir Cal-Mag o sal de Epsom (MgSO4) -- 1 cucharadita/litro en spray foliar para resultados rapidos.',
                prevention:
                    'Usar formula nutritiva equilibrada, incluir suplemento Cal-Mag, mantener el pH correcto.',
            },
            'iron-deficiency': {
                name: 'Deficiencia de Hierro',
                symptoms:
                    'Hojas de color amarillo brillante (cloroticas) en el crecimiento muy nuevo, mientras las nervaduras permanecen verdes. Patron clasico de clorosis intervenal.',
                causes: 'pH alto (mas frecuente, especialmente por encima de 7,0), raices encharcadas, exceso de fosforo o manganeso compitiendo.',
                treatment:
                    'Bajar el pH a 6,0-6,5, mejorar el drenaje, usar suplemento de hierro quelado.',
                prevention:
                    'Mantener el pH adecuado, evitar el exceso de riego, usar paquete de micronutrientes quelados.',
            },
            'zinc-deficiency': {
                name: 'Deficiencia de Zinc',
                symptoms:
                    'Amarillamiento del tejido foliar nuevo entre las nervaduras. Las hojas pueden parecer moteadas o distorsionadas. Espaciado corto entre nudos.',
                causes: 'pH alto, exceso de fosforo inhibiendo la absorcion de zinc, poco zinc en el sustrato o la solucion.',
                treatment:
                    'Corregir el pH al rango optimo, reducir el fosforo si es excesivo, suplementar zinc.',
                prevention: 'Usar formula completa de micronutrientes, mantener el pH correcto.',
            },
            'sulfur-deficiency': {
                name: 'Deficiencia de Azufre',
                symptoms:
                    'Las hojas nuevas se tornan uniformemente amarillo palido a blancas. A diferencia de la deficiencia de nitrogeno, comienza en el crecimiento joven/nuevo.',
                causes: 'Poco azufre en la solucion nutritiva, pH muy alto, plantas recien trasplantadas o lavadas.',
                treatment:
                    'Anadir nutriente que contenga azufre (muchos nutrientes base lo incluyen), verificar el pH.',
                prevention: 'Usar formula nutritiva completa, evitar pH extremo.',
            },
            'nutrient-burn': {
                name: 'Quemadura por Nutrientes (Toxicidad)',
                symptoms:
                    'Las puntas de las hojas se tornan marrones y crujientes, luego avanzan hacia el interior. Las puntas pueden curvarse hacia arriba. Coloracion verde oscuro brillante en las hojas.',
                causes: 'EC/PPM de la solucion nutritiva demasiado alto, fertilizacion demasiado frecuente, tierra muy enriquecida.',
                treatment:
                    'Lavar el sustrato con 3 veces el volumen de la maceta con agua ajustada al pH. Reducir la siguiente fertilizacion al 50% de concentracion.',
                prevention:
                    'Comenzar con nutrientes en dosis bajas, aumentar gradualmente, medir EC/PPM regularmente.',
            },
            'nitrogen-toxicity': {
                name: 'Toxicidad por Nitrogeno',
                symptoms:
                    'Hojas verde oscuro brillante. Las puntas pueden curvarse hacia abajo (la "garra"). Crecimiento foliar excesivo, menor densidad de flores.',
                causes: 'Demasiado nitrogeno, especialmente durante la floracion cuando la demanda de N disminuye.',
                treatment:
                    'Detener la fertilizacion nitrogenada, lavar con agua ajustada al pH, cambiar a nutrientes de floracion.',
                prevention:
                    'Reducir el nitrogeno al cambiar a la floracion, usar nutrientes especificos para floracion.',
            },
            overwatering: {
                name: 'Riego Excesivo',
                symptoms:
                    'La planta entera se cae. Las hojas se sienten firmes pero caen con curva redondeada. La tierra permanece humeda por muchos dias. Amarillamiento.',
                causes: 'Riego demasiado frecuente, mal drenaje, macetas sin agujeros, sustrato demasiado denso.',
                treatment:
                    'Dejar de regar completamente hasta que la maceta este muy ligera. Mejorar la aireacion alrededor de la maceta. Considerar trasplantar a una mezcla con mejor drenaje.',
                prevention:
                    'Levantar las macetas para sentir el peso -- regar solo cuando esten notablemente mas ligeras. Usar recipientes con buenos agujeros de drenaje. Dejar que el sustrato se seque parcialmente.',
            },
            underwatering: {
                name: 'Riego Insuficiente',
                symptoms:
                    'La planta entera se marchita y cae. Las hojas se sienten delgadas y como papel con una leve curva hacia adentro. La maceta esta muy ligera.',
                causes: 'Riego demasiado infrecuente, clima seco, sustrato de drenaje rapido, planta grande en maceta pequena.',
                treatment:
                    'Regar abundantemente hasta que el drenaje salga por abajo. La planta deberia recuperarse en pocas horas.',
                prevention:
                    'Verificar el peso de la maceta regularmente. Regar cuando la primera capa del sustrato este seca.',
            },
            'heat-stress': {
                name: 'Estres por Calor',
                symptoms:
                    'Los bordes y puntas de las hojas se curvan hacia arriba como tacos. Manchas blanqueadas o quemadas donde las hojas estan mas cerca de la luz. Marchitamiento a pesar de riego adecuado.',
                causes: 'Temperatura del cultivo por encima de 30 C, luces demasiado cerca del dosel, mala ventilacion, puntos calientes.',
                treatment:
                    'Mejorar la ventilacion, elevar las luces, anadir climatizacion. Pulverizar las hojas a corto plazo.',
                prevention:
                    'Mantener la temperatura del dosel por debajo de 28 C. Asegurar un flujo de aire adecuado sobre el dosel.',
            },
            'light-burn': {
                name: 'Quemadura por Luz',
                symptoms:
                    'Manchas blancas o amarillas blanqueadas en las hojas superiores mas cercanas a la luz. Las hojas directamente bajo la luz parecen blanqueadas a pesar de nutrientes adecuados.',
                causes: 'La lampara de cultivo esta demasiado cerca del dosel, intensidad de luz excesiva (PPFD demasiado alto).',
                treatment:
                    'Elevar la luz inmediatamente. Las areas blanqueadas no se recuperaran, pero el nuevo crecimiento sera saludable.',
                prevention:
                    'Seguir las distancias minimas de colgado recomendadas por el fabricante, monitorear el PPFD.',
            },
            'ph-lockout': {
                name: 'Bloqueo de pH',
                symptoms:
                    'Multiples sintomas de deficiencia apareciendo simultaneamente a pesar de nutrientes adecuados. La planta parece generalmente enferma.',
                causes: 'El pH de la solucion nutritiva o el sustrato esta fuera del rango optimo de absorcion para nutrientes clave.',
                treatment:
                    'Probar el pH de la zona radicular (prueba de escorrentia). Lavar el sustrato con agua ajustada al pH correcto. Reanudar la fertilizacion con el pH correcto.',
                prevention:
                    'Siempre ajustar el pH del agua y la solucion nutritiva. Probar el pH de escorrentia semanalmente.',
            },
            'spider-mites': {
                name: 'Acaros Arana',
                symptoms:
                    'Pequenos puntos blancos/amarillos en la superficie de las hojas. Telaranas finas y sedosas entre hojas y tallos. Pequenos puntos en movimiento visibles con lupa.',
                causes: 'Condiciones secas y calientes. Esquejes o sustrato infectado. Mal flujo de aire.',
                treatment:
                    'Pulverizar todas las superficies de las hojas (especialmente el envez) con aceite de neem, jabon insecticida o spinosad. Aumentar la humedad. Repetir cada 3 dias durante 2 semanas.',
                prevention:
                    'Mantener 50-60% de humedad, asegurar flujo de aire, inspeccionar nuevas plantas antes de introducirlas al cultivo.',
            },
            'fungus-gnats': {
                name: 'Mosquitos de Hongos',
                symptoms:
                    'Pequenas moscas negras alrededor de la superficie del sustrato. Plantulas marchitas por dano de larvas en las raices. Pequenas larvas blancas visibles en el sustrato.',
                causes: 'Riego excesivo manteniendo la superficie humeda, permitiendo que los adultos pongan huevos. Mezclas ricas en turba.',
                treatment:
                    'Dejar que las 5 cm superiores del sustrato se sequen completamente. Usar trampas amarillas pegajosas para adultos. Aplicar nematodos beneficos o Bacillus thuringiensis israelensis (Bti).',
                prevention:
                    'Evitar el exceso de riego, dejar que la superficie del sustrato se seque, usar una capa de perlita sobre el sustrato.',
            },
            aphids: {
                name: 'Pulgones',
                symptoms:
                    'Grupos de pequenos insectos de cuerpo blando en el crecimiento nuevo y el envez de las hojas. Residuo pegajoso de mielecilla en las hojas. Nuevas hojas rizadas o distorsionadas.',
                causes: 'Espacio de cultivo abierto, esquejes contaminados o exposicion al exterior.',
                treatment:
                    'Eliminar con agua, aplicar jabon insecticida o aceite de neem, introducir insectos beneficos (mariquitas, crisopas).',
                prevention:
                    'Mantener el entorno de cultivo cerrado, inspeccionar todas las plantas nuevas.',
            },
            thrips: {
                name: 'Trips',
                symptoms:
                    'Rayas o manchas plateadas/blancas en las hojas (marcas de alimentacion). Puntos de heces negros en la superficie de las hojas. Las hojas pueden broncearse.',
                causes: 'Plantas o sustrato contaminados, entorno de cultivo abierto.',
                treatment:
                    'Aplicar spinosad, aceite de neem o insectos depredadores (Amblyseius cucumeris). Repetir regularmente.',
                prevention:
                    'Cuarentena estricta para nuevos esquejes, usar trampas amarillas pegajosas desde el principio.',
            },
            'powdery-mildew': {
                name: 'Oidio (Mildiu Polvoriento)',
                symptoms:
                    'Manchas blancas polvorientas en la superficie de las hojas, tallos y flores. Las manchas se extienden rapidamente. El tejido afectado puede amarillarse y morir.',
                causes: 'Alta humedad (superior al 60%) combinada con mal flujo de aire y temperaturas moderadas (15-27 C). Plantas apinanadas.',
                treatment:
                    'Quitar las hojas muy afectadas. Aplicar bicarbonato de potasio, aceite de neem o spray de peroxido de hidrogeno diluido. Aumentar el flujo de aire y reducir la humedad urgentemente.',
                prevention:
                    'Mantener la humedad por debajo del 50% en floracion. Asegurar un flujo de aire fuerte a traves del dosel. Evitar la saturacion.',
            },
            botrytis: {
                name: 'Botrytis (Podredumbre de Flores / Moho Gris)',
                symptoms:
                    'Moho gris y esponjoso apareciendo dentro de los cogollos densos. Manchas marrones blandas en el centro de las colas. Esporas grises visibles.',
                causes: 'Alta humedad (superior al 50% en floracion), mal flujo de aire, cogollos densos, temperaturas por debajo de 20 C con alta humedad relativa.',
                treatment:
                    'Eliminar y embolsar inmediatamente todo el material afectado. No agitar los cogollos -- las esporas se dispersan. Aumentar el flujo de aire y bajar la humedad drasticamente.',
                prevention:
                    'Mantener la humedad de floracion en 40-50%. Desfoliar el dosel denso para el flujo de aire. Cosechar a tiempo.',
            },
            'root-rot': {
                name: 'Podredumbre de Raices (Pythium/Phytophthora)',
                symptoms:
                    'Las raices se tornan marrones/grises y viscosas en lugar de blancas y firmes. Olor desagradable de la zona radicular. La planta se marchita a pesar del riego adecuado. En hidro: solucion nutritiva descolorida.',
                causes: 'Exceso de riego o mal drenaje. Condiciones anaerobias en la zona radicular. Temperatura del agua superior a 22 C en hidro. Falta de microorganismos beneficos.',
                treatment:
                    'En tierra: reducir el riego, mejorar el drenaje, aplicar bacterias beneficas/micorrizas. En hidro: cambiar el deposito, bajar la temperatura del agua, tratar con peroxido de hidrogeno o bacterias beneficas.',
                prevention:
                    'Evitar el exceso de riego. Mantener el deposito hidro por debajo de 20 C. Usar piedras de aire. Inocular con microorganismos beneficos.',
            },
        },
    },
    lernpfad: {
        title: 'Rutas de Aprendizaje',
        progress: '{{done}} de {{total}} pasos completados',
        filterByLevel: 'Filtrar por nivel',
        allLevels: 'Todos los niveles',
        completed: 'Completado',
        markDone: 'Marcar como hecho',
        resetPath: 'Reiniciar progreso',
        noPaths: 'No hay rutas de aprendizaje disponibles.',
        level: {
            beginner: 'Principiante',
            intermediate: 'Intermedio',
            expert: 'Experto',
        },
        paths: {
            'beginner-first-grow': {
                title: 'Tu Primer Cultivo',
                description: 'Todo lo que necesitas para una primera cosecha exitosa, paso a paso.',
                steps: {
                    'step-setup': {
                        title: 'Configuracion y Equipamiento',
                        description:
                            'Aprende que necesitas para comenzar: tienda, lampara, ventilador, macetas y sustrato.',
                    },
                    'step-germination': {
                        title: 'Germinacion',
                        description:
                            'Como germinar semillas de forma fiable usando el metodo de papel de cocina o directamente en el sustrato.',
                    },
                    'step-veg': {
                        title: 'Crecimiento Vegetativo',
                        description:
                            'Nutrir tu plantula hasta convertirla en una planta vegetativa fuerte. Basicos de riego, nutrientes y luz.',
                    },
                    'step-flower': {
                        title: 'Floracion',
                        description:
                            'Desencadenar y gestionar la fase de floracion. Horario de luz, cambio de nutrientes y desarrollo de cogollos.',
                    },
                    'step-harvest': {
                        title: 'Cosecha y Curacion',
                        description:
                            'Leer los tricomas, elegir el momento de cosecha y el crucial proceso de secado y curacion.',
                    },
                    'step-vpd-practice': {
                        title: 'Practica VPD',
                        description:
                            'Usar la calculadora VPD para entender como la temperatura y la humedad afectan a tu planta.',
                    },
                },
            },
            'environment-mastery': {
                title: 'Dominio del Ambiente',
                description:
                    'Inmersion profunda en temperatura, humedad, VPD, CO2 y flujo de aire.',
                steps: {
                    'step-env-basics': {
                        title: 'Conceptos Basicos de Temp. y Humedad',
                        description:
                            'Rangos optimos para cada fase de crecimiento y como controlarlos.',
                    },
                    'step-vpd-deep': {
                        title: 'VPD en Profundidad',
                        description:
                            'Entender y usar el deficit de presion de vapor para maximizar la salud y el rendimiento de las plantas.',
                    },
                    'step-airflow': {
                        title: 'Flujo de Aire y CO2',
                        description:
                            'Por que es importante el flujo de aire, como configurar ventiladores de circulacion y extraccion y conceptos basicos de CO2.',
                    },
                    'step-env-calc': {
                        title: 'Practica con Calculadoras',
                        description:
                            'Usar la calculadora VPD en diferentes fases para desarrollar una intuicion de las condiciones ideales.',
                    },
                },
            },
            'nutrient-mastery': {
                title: 'Dominio de Nutrientes',
                description:
                    'Dominar macro y micronutrientes, EC, pH y diagnostico de deficiencias.',
                steps: {
                    'step-macros': {
                        title: 'Macronutrientes (N-P-K)',
                        description:
                            'El papel del nitrogeno, fosforo y potasio en todas las fases de crecimiento.',
                    },
                    'step-micros': {
                        title: 'Micro y Secundarios',
                        description:
                            'Calcio, magnesio, azufre, hierro, zinc y sus sintomas de deficiencia.',
                    },
                    'step-ec-ph': {
                        title: 'EC, PPM y pH',
                        description:
                            'Como medir y controlar la fuerza y el pH de la solucion nutritiva.',
                    },
                    'step-deficiency-atlas': {
                        title: 'Atlas de Deficiencias',
                        description:
                            'Usar el Atlas de Enfermedades para identificar y tratar deficiencias de nutrientes.',
                    },
                    'step-nutrient-calc': {
                        title: 'Calculadora de Nutrientes',
                        description:
                            'Usar la calculadora de ratios de nutrientes para planificar las fertilizaciones por fase de crecimiento.',
                    },
                },
            },
            'pest-disease-control': {
                title: 'Control de Plagas y Enfermedades',
                description:
                    'Identificar, tratar y prevenir las plagas y enfermedades mas comunes.',
                steps: {
                    'step-plant-hygiene': {
                        title: 'Higiene y Prevencion',
                        description:
                            'Protocolos de limpieza, cuarentena para plantas nuevas y prevencion ambiental.',
                    },
                    'step-pest-id': {
                        title: 'Identificacion de Plagas',
                        description:
                            'Detectar acaros arana, mosquitos de hongos, pulgones y trips a tiempo.',
                    },
                    'step-disease-id': {
                        title: 'Identificacion de Enfermedades',
                        description:
                            'Reconocer oidio, botrytis y podredumbre de raices antes de que destruyan una cosecha.',
                    },
                },
            },
            'advanced-training': {
                title: 'Entrenamiento Avanzado de Plantas',
                description:
                    'LST, topping, super cropping, SCROG y manifolding para el maximo rendimiento.',
                steps: {
                    'step-why-train': {
                        title: 'Por Que Entrenar Plantas?',
                        description:
                            'Entender la dominancia apical y como el entrenamiento la rompe para obtener mejores rendimientos.',
                    },
                    'step-lst-topping': {
                        title: 'LST y Topping',
                        description:
                            'Fundamentos de entrenamiento de bajo estres y topping con detalles de tiempo y tecnica.',
                    },
                    'step-scrog-manifold': {
                        title: 'SCROG y Manifolding',
                        description:
                            'Tecnicas avanzadas para un dosel perfectamente uniforme con el maximo numero de puntos de brotes.',
                    },
                },
            },
            firstGrow: {
                title: 'Tu Primer Cultivo',
                description: 'Todo lo que necesitas para una primera cosecha exitosa, paso a paso.',
                step1Title: 'Configuracion y Equipamiento',
                step1Desc:
                    'Aprende que necesitas para comenzar: tienda, lampara, ventilador, macetas y sustrato.',
                step2Title: 'Germinacion',
                step2Desc:
                    'Como germinar semillas de forma fiable -- metodo papel de cocina o directamente en el sustrato.',
                step3Title: 'Crecimiento Vegetativo',
                step3Desc:
                    'Nutrir tu plantula hasta convertirla en una planta vegetativa fuerte. Basicos de riego, nutrientes y luz.',
                step4Title: 'Floracion',
                step4Desc:
                    'Desencadenar y gestionar la fase de floracion. Horario de luz, cambio de nutrientes y desarrollo de cogollos.',
                step5Title: 'Cosecha y Curacion',
                step5Desc:
                    'Leer los tricomas, elegir el momento de cosecha y el crucial proceso de secado y curacion.',
                step6Title: 'Practica VPD',
                step6Desc:
                    'Usar la calculadora VPD para entender como la temperatura y la humedad afectan a tu planta.',
            },
            environment: {
                title: 'Dominio del Ambiente',
                description:
                    'Inmersion profunda en temperatura, humedad, VPD, CO2 y flujo de aire.',
                step1Title: 'Conceptos Basicos de Temp. y Humedad',
                step1Desc: 'Rangos optimos para cada fase de crecimiento y como controlarlos.',
                step2Title: 'VPD en Profundidad',
                step2Desc:
                    'Entender y usar el deficit de presion de vapor para maximizar la salud de las plantas.',
                step3Title: 'Flujo de Aire y CO2',
                step3Desc: 'Por que es importante el flujo de aire y como configurar ventiladores.',
                step4Title: 'Practica con Calculadoras',
                step4Desc:
                    'Usar la calculadora VPD en diferentes fases para desarrollar una intuicion de las condiciones ideales.',
            },
            nutrients: {
                title: 'Dominio de Nutrientes',
                description:
                    'Dominar macro y micronutrientes, EC, pH y diagnostico de deficiencias.',
                step1Title: 'Guia de pH',
                step1Desc: 'Entender y controlar el pH para una absorcion optima de nutrientes.',
                step2Title: 'Calculadora de Nutrientes',
                step2Desc:
                    'Usar la calculadora de ratios de nutrientes para planificar fertilizaciones por fase.',
                step3Title: 'Deficiencia de Calcio',
                step3Desc:
                    'Reconocer y tratar la deficiencia de calcio -- uno de los problemas mas comunes.',
                step4Title: 'Quemadura por Nutrientes',
                step4Desc:
                    'Reconocer la sobredosis de nutrientes y ayudar a la planta a recuperarse.',
                step5Title: 'Practica con el Atlas',
                step5Desc:
                    'Usar el Atlas de Enfermedades para identificar y tratar problemas nutricionales.',
            },
            pests: {
                title: 'Control de Plagas y Enfermedades',
                description:
                    'Identificar, tratar y prevenir las plagas y enfermedades mas comunes.',
                step1Title: 'Guia de Control de Plagas',
                step1Desc:
                    'Estrategias integradas de control de plagas para mantener el cultivo libre de plagas.',
                step2Title: 'Acaros Arana',
                step2Desc:
                    'Detectar y tratar los acaros arana -- la plaga mas destructiva del cultivo.',
                step3Title: 'Oidio',
                step3Desc: 'Reconocer y tratar el oidio antes de que destruya el cultivo.',
            },
            training: {
                title: 'Entrenamiento Avanzado de Plantas',
                description:
                    'LST, topping, super cropping, SCROG y manifolding para el maximo rendimiento.',
                step1Title: 'Fundamentos del Entrenamiento',
                step1Desc:
                    'Entender los principios del entrenamiento de plantas y aplicar LST y topping.',
                step2Title: 'Topping vs. LST',
                step2Desc:
                    'Comparar topping y entrenamiento de bajo estres y encontrar el mejor enfoque para tu cultivo.',
                step3Title: 'Solucion al Riego Excesivo',
                step3Desc:
                    'Reconocer y solucionar el riego excesivo -- un problema comun al entrenar doseles densos.',
            },
        },
    },
    growTech: {
        title: 'Cannabis Grow Technologies 2026',
        subtitle: 'Precision, automation, AI, and sustainability -- the future of cultivation.',
        badge2026: '2026 Tech Overview',
        intro: 'The cannabis cultivation technology landscape in 2026 is defined by data-driven, scalable systems that maximize yield, quality, and efficiency.',
        keyBenefits: 'Key Benefits',
        categories: {
            dynamicLighting: {
                title: 'Dynamic LED Lighting',
                tagline: 'Full-spectrum LEDs with adaptive spectra for each growth phase',
                content:
                    'High-efficiency full-spectrum LEDs with strong red emphasis reach >2.8 umol/J efficiency and reduce power consumption by up to 40% versus legacy HPS lamps.',
                benefits:
                    '<ul><li>20-40% higher yield with optimized spectra</li><li>Up to 40% lower electricity costs</li><li>Better THC production through targeted wavelengths</li></ul>',
                tip: 'A 350-600W LED panel in a 1.2 x 1.2m tent covers 4-6 plants.',
            },
            sensorsIoT: {
                title: 'Sensors, IoT & VPD Optimization',
                tagline: 'Wireless environmental monitoring with AI-driven control loops',
                content:
                    'Wireless sensors for temperature, humidity, VPD, EC, pH, PAR/PPFD, CO2, and soil moisture form the backbone of precision cultivation.',
                benefits:
                    '<ul><li>Real-time VPD optimization</li><li>Predictive environmental adjustments</li><li>Integration with CannaGuide via MQTT and BLE</li></ul>',
                tip: 'VPD is the "invisible killer" -- wrong values cause stress, mold, or low trichome production.',
            },
            aiAutomation: {
                title: 'AI & Automation',
                tagline: 'AI platforms that detect problems before visible symptoms appear',
                content:
                    'AI platforms analyze real-time sensor data, detect pests and deficiencies before visible symptoms, and automatically optimize nutrient, light, and irrigation schedules.',
                benefits:
                    '<ul><li>Proactive pest and deficiency detection</li><li>Automated nutrient and irrigation scheduling</li><li>Data-driven compliance logging</li></ul>',
                tip: 'CannaGuide already includes AI-powered plant diagnostics, proactive advisor, and local AI fallback -- all working offline.',
            },
            digitalTwin: {
                title: 'Digital Twin Simulation',
                tagline: 'Virtual grow room replicas for risk-free experimentation',
                content:
                    'A Digital Twin creates a virtual replica of your grow environment using sensor data and CFD models.',
                benefits:
                    '<ul><li>Zero-risk experimentation</li><li>Predictive yield modeling</li><li>Optimize HVAC and lighting virtually</li></ul>',
                tip: 'CannaGuide Sandbox already offers what-if experiments on cloned plants.',
            },
            hydroAero: {
                title: 'Hydroponics & Aeroponics',
                tagline: 'Soilless systems with up to 30% faster growth and 90% less water',
                content:
                    'Aeroponics suspends roots in air and delivers nutrients via fine mist -- achieving up to 30% faster growth with 90% less water usage.',
                benefits:
                    '<ul><li>Dramatically faster growth cycles</li><li>90% water reduction</li><li>Precise nutrient control</li></ul>',
                tip: 'CannaGuide supports Soil, Coco, Hydro, and Aeroponics as grow media.',
            },
            tissueCulture: {
                title: 'Tissue Culture & Micropropagation',
                tagline: 'Virus-free cloning of elite genetics at scale',
                content:
                    'Home-lab kits and professional tissue culture systems enable virus-free propagation of elite genetics.',
                benefits:
                    '<ul><li>100% genetic consistency</li><li>Virus and pathogen elimination</li><li>Faster scaling of prized phenotypes</li></ul>',
                tip: 'Track your phenotypes in CannaGuide Breeding Lab and Genealogy Explorer.',
            },
            smartGrowBoxes: {
                title: 'All-in-One Smart Grow Boxes',
                tagline: 'Integrated systems with LEDs, fans, sensors, and app control',
                content:
                    'Complete systems integrate LEDs, ventilation fans, sensors, and app control into a single unit.',
                benefits:
                    '<ul><li>Zero setup complexity</li><li>Integrated environmental control</li><li>App-based monitoring</li></ul>',
                tip: 'Even with an all-in-one box, use CannaGuide to track your grow journal and get AI advice.',
            },
            sustainability: {
                title: 'Sustainability & Post-Harvest Tech',
                tagline: 'Energy savings, regenerative soils, and precision curing',
                content:
                    'LED + HVAC optimization dramatically reduces energy and water consumption. Regenerative soil practices maximize terpene retention.',
                benefits:
                    '<ul><li>30-50% reduction in energy costs</li><li>Superior terpene preservation</li><li>Sustainable practices</li></ul>',
                tip: 'CannaGuide post-harvest simulation tracks jar humidity, chlorophyll breakdown, terpene retention, and mold risk.',
            },
        },
        impact: {
            title: 'Technology Impact Matrix',
            headers: {
                area: 'Technology',
                homeGrower: 'Home Grower Advantage',
                commercial: 'Commercial Advantage',
                effort: 'Setup Effort',
            },
            areas: {
                ledSensors: 'LED + Sensors',
                aiAutomation: 'AI / Automation',
                aeroponics: 'Aeroponics',
                digitalTwin: 'Digital Twin',
            },
            home: {
                ledSensors: '20-40% more yield, lower power bills',
                aiAutomation: 'Less daily work, proactive alerts',
                aeroponics: 'Faster growth, space-saving',
                digitalTwin: 'Risk-free experimentation',
            },
            commercial: {
                ledSensors: 'Cost savings, consistent quality',
                aiAutomation: 'Scalability, data compliance',
                aeroponics: 'Maximum efficiency at scale',
                digitalTwin: 'Predictive planning, optimization',
            },
            effort: {
                medium: 'Medium',
                high: 'High',
                highInitial: 'High (initial)',
                mediumHigh: 'Medium-High',
            },
        },
        cannaGuideIntegration: {
            title: 'Already in CannaGuide',
            content:
                'CannaGuide integrates many of these 2026 technologies: real-time VPD simulation, AI-powered diagnostics, what-if sandbox experiments, IoT sensor integration, and a 3-layer local AI fallback for fully offline operation.',
        },
    },
    rechner: {
        title: 'Centro de Calculadoras',
        vpdTab: 'VPD',
        nutrientTab: 'Nutrientes',
        phTab: 'pH / CE',
        terpeneEntourageTab: 'Entourage',
        transpirationTab: 'Transpiracion',
        ecTdsTab: 'CE/TDS',
        lightSpectrumTab: 'Luz',
        cannabinoidRatioTab: 'Cannabinoides',
        equipmentLink: 'Para calculadoras avanzadas, ve la seccion de Equipamiento.',
        vpd: {
            temperature: 'Temperatura del Aire',
            humidity: 'Humedad Relativa',
            leafOffset: 'Offset Temp. Hoja',
            celsius: '\u00b0C',
            result: 'Resultado VPD',
            statusLow: 'VPD demasiado bajo -- riesgo de moho y crecimiento lento.',
            statusOk: 'VPD optimo -- transpiracion ideal.',
            statusHigh: 'VPD demasiado alto -- riesgo de estres por calor y marchitamiento.',
            refTitle: 'Rangos de Referencia VPD',
            rangeSeedling: 'Plantula',
            rangeVeg: 'Vegetativo',
            rangeFlower: 'Floracion',
            rangeLateFlower: 'Floracion Tardia',
            simulate: 'Simular 7 dias',
            simulationTitle: 'Curva VPD 7 dias',
            explainAi: 'Explicar con IA',
            aiExplanationTitle: 'Explicacion IA',
            aiLoading: 'Generando explicacion...',
            deepDive: 'Aprender mas: Ruta de Aprendizaje ->',
        },
        nutrient: {
            growStage: 'Fase de Crecimiento',
            volume: 'Volumen de Agua (L)',
            seedling: 'Plantula',
            veg: 'Vegetativo',
            earlyFlower: 'Floracion Temprana',
            lateFlower: 'Floracion Tardia',
            seedlingDesc: 'Nutricion ligera, alto N para desarrollo de raices y hojas.',
            vegDesc: 'N fuerte, P/K moderado para crecimiento vegetativo vigoroso.',
            earlyFlowerDesc: 'Reduce N, aumenta P/K al formarse los cogollos.',
            lateFlowerDesc: 'N minimo -- fase de maduracion, foco en P/K y minerales lavables.',
            targetEc: 'CE Objetivo (mS/cm)',
            dosage: 'Dosis Aproximada',
            disclaimer:
                'Los valores son orientativos. Mide siempre la CE y el pH despues de mezclar.',
        },
        ph: {
            intro: 'Los rangos optimos de pH y CE varian segun el medio de cultivo. Mantenerse dentro de estos rangos garantiza la disponibilidad optima de nutrientes.',
            medium: 'Medio',
            phRange: 'Rango pH',
            ecRange: 'Rango CE (mS/cm)',
            note: 'Ajusta siempre el pH del agua y la solucion nutritiva despues de cada mezcla. Usa un medidor de pH calibrado.',
        },
        terpeneEntourage: {
            description:
                'Introduce tu perfil de terpenos para calcular la puntuacion del efecto entourage y la matriz de sinergias. Basado en Russo (2011) y Booth & Bohlmann (2019).',
            terpeneName: 'Terpeno',
            terpenePercent: 'Porcentaje',
            addTerpene: 'Anadir terpeno',
            remove: 'Eliminar',
            score: 'Puntuacion Entourage',
            dominant: 'Dominante',
            profile: 'Perfil',
            synergyMatrix: 'Pares de Sinergia',
            learnMore: 'Mas sobre la ciencia de terpenos ->',
            explainAi: 'Explicar con IA',
            aiExplanationTitle: 'Explicacion IA',
            aiLoading: 'Generando explicacion...',
            deepDive: 'Aprender mas: Ruta de Aprendizaje ->',
        },
        transpiration: {
            description:
                'Calcula la tasa de transpiracion del dosel a partir del VPD, la conductancia estomatica y el Indice de Area Foliar (aproximacion Penman-Monteith).',
            vpd: 'VPD',
            gsmmol: 'Conductancia Estomatica',
            lai: 'Indice de Area Foliar (LAI)',
            hours: 'Fotoperiodo (h/dia)',
            leafRate: 'Transpiracion Foliar',
            canopyRate: 'Transpiracion del Dosel',
            dailyWater: 'Uso Diario de Agua',
            learnMore: 'Mas sobre la gestion del agua en plantas ->',
            simulate: 'Simular 7 dias',
            simulationTitle: 'Proyeccion 7 dias',
            explainAi: 'Explicar con IA',
            aiExplanationTitle: 'Explicacion IA',
            aiLoading: 'Generando explicacion...',
            deepDive: 'Aprender mas: Ruta de Aprendizaje ->',
        },
        ecTds: {
            description:
                'Convierte entre CE (mS/cm) y TDS en las tres escalas habituales. Introduce lecturas de pH en el tiempo para una prediccion de deriva.',
            ecInput: 'CE (mS/cm)',
            tds500: 'TDS-500',
            tds640: 'TDS-640',
            tds700: 'TDS-700',
            phReadings: 'Lecturas de pH (separadas por coma)',
            drift: 'Deriva de pH',
            prediction: 'Proyeccion Dia 7',
            learnMore: 'Mas sobre la gestion de CE, TDS y pH ->',
            simulate: 'Simular 7 dias',
            simulationTitle: 'Deriva CE 7 dias',
            explainAi: 'Explicar con IA',
            aiExplanationTitle: 'Explicacion IA',
            aiLoading: 'Generando explicacion...',
            deepDive: 'Aprender mas: Ruta de Aprendizaje ->',
        },
        lightSpectrum: {
            description:
                'Calcula el DLI, la eficiencia fotosintetica y el aumento estimado de produccion de terpenos a partir de tu configuracion de espectro de luz.',
            ppfd: 'PPFD',
            redPercent: '% Banda Roja',
            bluePercent: '% Banda Azul',
            hours: 'Fotoperiodo (h/dia)',
            stage: 'Fase de Crecimiento',
            dli: 'Integral de Luz Diaria (DLI)',
            efficiency: 'Eficiencia Fotosintetica',
            terpeneBoost: 'Potenciador de Terpenos',
            recommended: 'Relacion Recomendada',
            learnMore: 'Mas sobre espectro de luz y produccion de terpenos ->',
            simulate: 'Simular 7 dias',
            simulationTitle: 'Curva DLI 7 dias',
            explainAi: 'Explicar con IA',
            aiExplanationTitle: 'Explicacion IA',
            aiLoading: 'Generando explicacion...',
            deepDive: 'Aprender mas: Ruta de Aprendizaje ->',
        },
        cannabinoidRatio: {
            description:
                'Analiza las relaciones THC:CBD:CBG, el tipo de perfil y la puntuacion de armonia entourage.',
            ratio: 'Relacion',
            profile: 'Tipo de Perfil',
            harmony: 'Puntuacion de Armonia',
            learnMore: 'Mas sobre perfiles de cannabinoides ->',
            explainAi: 'Explicar con IA',
            aiExplanationTitle: 'Explicacion IA',
            aiLoading: 'Generando explicacion...',
            deepDive: 'Aprender mas: Ruta de Aprendizaje ->',
        },
    },
}

export const tipOfTheDay = {
    title: 'Consejo del Dia',
    tips: [
        'Siempre verifica el pH de tu agua despues de agregar nutrientes. Los nutrientes pueden alterar significativamente el nivel de pH.',
        'Una brisa suave de un ventilador dirigido a tus plantas ayuda a fortalecer los tallos y prevenir el moho.',
        'Menos es mas, especialmente con los nutrientes. Es mas facil corregir una deficiencia que una toxicidad (quemadura de nutrientes).',
        'Observa el color de tus hojas. Un verde rico y saludable es bueno. Verde demasiado oscuro puede indicar exceso de nitrogeno, mientras que verde palido o amarillo sugiere una deficiencia.',
        'Las macetas de tela son una gran opcion para principiantes ya que hacen el riego excesivo casi imposible y proporcionan oxigeno a las raices.',
    ],
}

export const analytics = {
    gardenScore: 'Puntuacion del Jardin',
    avgHealth: 'Salud Promedio',
    envStability: 'Estabilidad Ambiental',
    activePlants: 'Plantas Activas',
    stageDistribution: 'Distribucion por Fase',
    riskFactors: 'Factores de Riesgo',
    strainPerformance: 'Rendimiento por Variedad',
    nextMilestone: 'Proximo Hito',
    daysAway: 'dias restantes',
    analyticsEmpty: 'Agrega plantas para ver analiticas',
    strain: 'Variedad',
    health: 'Salud',
    plants: 'Plantas',
    avgAge: 'Edad Promedio',
    relatedKnowledge: 'Conocimiento Relacionado',
    milestoneType: {
        flip: 'Cambio a Floracion',
        harvest: 'Listo para Cosecha',
        curing_done: 'Curado Completo',
        transplant: 'Trasplante',
    },
    recommendations: {
        title: 'Recomendaciones',
        adjustVpd: 'Ajustar VPD',
        adjustVpdDesc: 'VPD esta fuera del rango optimo. Ajusta temperatura o humedad.',
        considerTraining: 'Considerar Entrenamiento',
        considerTrainingDesc:
            'Planta en fase vegetativa tardia. LST o topping podria mejorar el rendimiento.',
        checkTrichomes: 'Revisar Tricomas',
        checkTrichomesDesc:
            'Planta en floracion tardia. Monitorea tricomas para el momento de cosecha.',
        improveHealth: 'Mejorar Salud de Planta',
        improveHealthDesc:
            'Salud de la planta por debajo del optimo. Revisa nutrientes, pH y ambiente.',
    },
    riskType: {
        health: 'Salud',
        environment: 'Ambiente',
        nutrient: 'Nutriente',
        pest: 'Plaga/Enfermedad',
        overdue_task: 'Tarea Pendiente',
    },
    risks: {
        healthCritical: '{{name}} salud criticamente baja al {{health}}%',
        vpdOutOfRange: '{{name}} VPD fuera de rango: {{vpd}} kPa',
        severeProblem: '{{name}}: {{problem}} (severidad {{severity}}/10)',
        overdueTask: '{{name}}: Tarea pendiente -- {{task}}',
    },
}

export const growBible = {
    title: 'CannaGuide Biblia del Cultivo',
    generated: 'Generado',
    plants: 'Plantas',
    appVersion: 'Version de la App',
    toc: 'Tabla de Contenidos',
    analyticsSummary: 'Resumen de Analiticas',
    relatedKnowledge: 'Conocimiento Relacionado',
    relatedKnowledgeDesc:
        'Basado en tu cultivo actual, estos temas de conocimiento son los mas relevantes:',
    footer: 'Generado por CannaGuide 2025',
    property: 'Propiedad',
    value: 'Valor',
    strain: 'Variedad',
    stage: 'Fase',
    age: 'Edad',
    days: 'dias',
    health: 'Salud',
    temperature: 'Temperatura',
    humidity: 'Humedad',
    environment: 'Ambiente',
    moisture: 'Humedad del sustrato',
    activeProblems: 'Problemas Activos',
    severity: 'severidad',
    journal: 'Diario',
    noNotes: 'Sin notas',
    harvestData: 'Datos de Cosecha',
    wetWeight: 'Peso Humedo',
    dryWeight: 'Peso Seco',
    quality: 'Calidad',
    count: 'Cantidad',
}
