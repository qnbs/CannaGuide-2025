export const knowledgeView = {
    title: 'Centro de Conocimiento',
    subtitle: 'Tu guia interactiva para un cultivo exitoso.',
    tabs: {
        mentor: 'Mentor IA',
        guide: 'Guia de Cultivo',
        archive: 'Archivo del Mentor',
        breeding: 'Laboratorio de Cruce',
        sandbox: 'Sandbox',
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
