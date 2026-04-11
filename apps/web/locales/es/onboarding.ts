export const onboarding = {
    legalStep: {
        title: 'Bienvenido a CannaGuide 2025',
        subtitle: 'Antes de comenzar, confirma lo siguiente.',
        ageLabel: 'Verificacion de edad',
        ageText:
            'Segun la Ley Alemana del Cannabis (KCanG), el acceso esta restringido a personas mayores de 18 anos. Al continuar, confirmas que tienes al menos 18 anos.',
        consentLabel: 'Privacidad y datos',
        consentText:
            'Todos tus datos se almacenan localmente en tu dispositivo (IndexedDB y localStorage). No se requiere cuenta. Las funciones opcionales de IA envian consultas directamente al proveedor que elijas -- no se almacenan datos en nuestros servidores.',
        geoLabel: 'Aviso legal',
        geoText:
            'Las leyes de cultivo de cannabis varian segun el pais y la region. Esta aplicacion esta disenada para su uso en jurisdicciones donde el cultivo personal de cannabis es legal.',
        accept: 'Tengo 18+ y acepto',
        deny: 'Soy menor de 18',
        denied: 'El acceso a esta aplicacion esta restringido a personas mayores de 18 anos.',
        bilingualHint: 'Welcome / Willkommen -- Select language above',
    },
    languageTitle: 'Elige Tu Idioma',
    languageSubtitle: 'Selecciona tu idioma preferido para continuar.',
    german: 'Aleman',
    english: 'Ingles',
    step1: {
        title: 'Enciclopedia de Variedades',
        text: 'Descubre mas de 700 variedades con filtros detallados, explora su linaje genetico en un arbol interactivo o agrega las tuyas. Obtiene consejos de cultivo con IA.',
    },
    step2: {
        title: 'La Sala de Cultivo Digital',
        text: 'Gestiona hasta tres plantas en una simulacion en tiempo real ultra-realista. Interviene, registra todo y observa como crecen.',
    },
    step3: {
        title: 'El Taller',
        text: 'Planifica tu configuracion perfecta con el configurador IA, usa calculadoras precisas y guarda tu equipo para futuros proyectos.',
    },
    step4: {
        title: 'El Centro de Conocimiento',
        text: 'Aprende con la guia interactiva, pide consejo al mentor IA y usa los lexicos para profundizar tu conocimiento.',
    },
    step5: {
        title: 'Sincronizacion Sin Conexion',
        text: 'Tus datos se sincronizan perfectamente entre dispositivos usando tecnologia CRDT libre de conflictos. Funciona sin conexion -- los cambios se fusionan automaticamente al reconectarte.',
    },
    startGrow: 'Comencemos Tu Primer Cultivo!',
    localOnlyNote:
        'No se necesita cuenta. Todos los datos permanecen en tu dispositivo. Puedes activar la sincronizacion en la nube mas tarde en Configuracion.',
    wizard: {
        stepExperience: {
            title: 'Tu Nivel de Experiencia',
            text: 'Esto personaliza la dificultad de la simulacion y los consejos de IA para ti.',
            beginner: { label: 'Principiante', desc: 'Mi primer cultivo -- mantenlo simple!' },
            intermediate: { label: 'Intermedio', desc: 'Ya tengo algunos cultivos.' },
            expert: { label: 'Experto', desc: 'Cultivador avanzado -- maximo realismo.' },
        },
        stepGoal: {
            title: 'Tu Objetivo Principal',
            text: 'Destacaremos las caracteristicas y variedades mas relevantes para ti.',
            medical: { label: 'Medicinal / CBD', desc: 'Alto CBD, cultivo de bajo estres.' },
            recreational: { label: 'Recreativo', desc: 'Maximo rendimiento y potencia.' },
            hobbyist: { label: 'Aficionado', desc: 'Aprender y explorar a mi ritmo.' },
        },
        stepSetup: {
            title: 'Espacio y Presupuesto',
            text: 'Te sugeriremos la mejor configuracion inicial y las 3 mejores variedades para ti.',
            small: { label: 'Pequeno (< 0.5 m2)', desc: 'Micro-carpa o armario.' },
            medium: { label: 'Mediano (0.6-1.5 m2)', desc: 'Carpa clasica 80x80 o 1x1.' },
            large: { label: 'Grande (> 1.5 m2)', desc: 'Carpa 1.2x1.2 o habitacion.' },
            budgetLabel: 'Presupuesto Inicial',
            budgetLow: '< 150 EUR',
            budgetMid: '150 - 400 EUR',
            budgetHigh: '> 400 EUR',
        },
        finish: 'Perfecto -- a cultivar!',
    },
}
