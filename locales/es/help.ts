// Spanish (Espanol) -- help namespace
import { helpView as en, visualGuides as enGuides, faq as enFaq } from '../en/help'

export const helpView = {
    ...en,
    title: 'Ayuda y soporte',
    subtitle: 'Encuentra respuestas a tus preguntas y aprende mas sobre el cultivo.',
    tabs: {
        ...en.tabs,
        faq: 'Preguntas frecuentes',
        guides: 'Guias visuales',
        lexicon: 'Lexico',
        manual: 'Manual de usuario',
        faqDescription: 'Respuestas rapidas a las preguntas mas comunes sobre la app y el cultivo.',
        guidesDescription:
            'Guias visuales paso a paso para tecnicas de entrenamiento y flujos de la app.',
        lexiconDescription:
            'Un glosario completo de cannabinoides, terpenos, flavonoides y terminos de cultivo.',
        manualDescription:
            'El manual de usuario completo que cubre cada funcion de la app en detalle.',
    },
    itemCount: '{{count}} elementos',
    termCount: '{{count}} terminos',
    sectionCount: '{{count}} secciones',
    guideCount: '{{count}} guias',
}

export const visualGuides = {
    ...enGuides,
}

export const faq = {
    ...enFaq,
}
