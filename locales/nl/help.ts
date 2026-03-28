// Dutch (Nederlands) -- help namespace
import { helpView as en, visualGuides as enGuides, faq as enFaq } from '../en/help'

export const helpView = {
    ...en,
    title: 'Hulp en ondersteuning',
    subtitle: 'Vind antwoorden op je vragen en leer meer over teelt.',
    tabs: {
        ...en.tabs,
        faq: 'Veelgestelde vragen',
        guides: 'Visuele gidsen',
        lexicon: 'Lexicon',
        manual: 'Gebruikershandleiding',
        faqDescription: 'Snelle antwoorden op de meest gestelde vragen over de app en het kweken.',
        guidesDescription:
            'Stap-voor-stap visuele handleidingen voor trainingstechnieken en app-workflows.',
        lexiconDescription:
            'Een uitgebreide woordenlijst van cannabinoiden, terpenen, flavonoiden en kweektermen.',
        manualDescription:
            'De complete gebruikershandleiding die elke functie van de app in detail behandelt.',
    },
    itemCount: '{{count}} items',
    termCount: '{{count}} termen',
    sectionCount: '{{count}} secties',
    guideCount: '{{count}} gidsen',
}

export const visualGuides = {
    ...enGuides,
}

export const faq = {
    ...enFaq,
}
