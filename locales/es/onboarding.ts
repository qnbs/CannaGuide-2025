// Spanish (Espanol) -- onboarding namespace
import { onboarding as en } from '../en/onboarding'

export const onboarding = {
    ...en,
    languageTitle: 'Elige tu idioma',
    languageSubtitle: 'Selecciona tu idioma preferido para continuar.',
    german: 'Aleman',
    english: 'Ingles',
    step1: {
        title: 'Enciclopedia de variedades',
        text: 'Descubre mas de 700 variedades con filtros detallados, explora su linaje genetico en un arbol interactivo o agrega las tuyas. Obtiene consejos de cultivo con IA.',
    },
    step2: {
        title: 'La sala de cultivo digital',
        text: 'Gestiona hasta tres plantas en una simulacion ultrarealista en tiempo real. Interviene, registra todo y observa como crecen.',
    },
    step3: {
        title: 'El taller',
        text: 'Planifica tu configuracion perfecta con el configurador de IA, usa calculadoras precisas y guarda tu equipamiento para futuros proyectos.',
    },
    step4: {
        title: 'El centro de conocimiento',
        text: 'Aprende con la guia interactiva, pide consejo al mentor de IA y usa los lexicos para profundizar tu conocimiento.',
    },
    startGrow: 'Comencemos tu primer cultivo!',
    localOnlyNote:
        'No se necesita cuenta. Todos los datos permanecen en tu dispositivo. Puedes activar la sincronizacion en la nube mas tarde en Ajustes.',
    wizard: {
        stepExperience: {
            title: 'Tu nivel de experiencia',
            text: 'Esto personaliza la dificultad de la simulacion y los consejos de IA para ti.',
            beginner: { label: 'Principiante', desc: 'Mi primer cultivo -- mantenlo simple!' },
            intermediate: { label: 'Intermedio', desc: 'Algunos cultivos en mi haber.' },
            expert: { label: 'Experto', desc: 'Cultivador avanzado -- maximo realismo.' },
        },
        stepGoal: {
            title: 'Tu objetivo principal',
            text: 'Destacaremos las funciones y variedades mas relevantes para ti.',
            medical: { label: 'Medicinal / CBD', desc: 'Cultivo alto en CBD, bajo estres.' },
            recreational: { label: 'Recreativo', desc: 'Maximo rendimiento y potencia.' },
            hobbyist: { label: 'Aficionado', desc: 'Aprender y explorar a mi ritmo.' },
        },
        stepSetup: {
            title: 'Espacio y presupuesto',
            text: 'Te sugeriremos la mejor configuracion inicial y las 3 mejores variedades.',
            small: { label: 'Pequeno (< 0,5 m2)', desc: 'Micro-carpa o armario.' },
            medium: { label: 'Mediano (0,6-1,5 m2)', desc: 'Carpa clasica 80x80 o 1x1.' },
            large: { label: 'Grande (> 1,5 m2)', desc: 'Carpa 1,2x1,2 o habitacion.' },
            budgetLabel: 'Presupuesto inicial',
            budgetLow: '< 150 EUR',
            budgetMid: '150 - 400 EUR',
            budgetHigh: '> 400 EUR',
        },
        finish: 'Perfecto -- a cultivar!',
    },
}
