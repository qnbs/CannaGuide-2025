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
