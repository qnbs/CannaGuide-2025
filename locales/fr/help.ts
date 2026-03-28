// French (Francais) -- help namespace
import { helpView as en, visualGuides as enGuides, faq as enFaq } from '../en/help'

export const helpView = {
    ...en,
    title: 'Aide et support',
    subtitle: 'Trouvez des reponses a vos questions et apprenez-en plus sur la culture.',
    tabs: {
        ...en.tabs,
        faq: 'FAQ',
        guides: 'Guides visuels',
        lexicon: 'Lexique',
        manual: 'Manuel utilisateur',
        faqDescription:
            "Reponses rapides aux questions les plus courantes sur l'application et la culture.",
        guidesDescription:
            "Guides visuels pas a pas pour les techniques d'entrainement et les flux de l'application.",
        lexiconDescription:
            'Un glossaire complet des cannabinoides, terpenes, flavonoides et termes de culture.',
        manualDescription:
            "Le manuel utilisateur complet couvrant chaque fonctionnalite de l'application en detail.",
    },
    itemCount: '{{count}} elements',
    termCount: '{{count}} termes',
    sectionCount: '{{count}} sections',
    guideCount: '{{count}} guides',
}

export const visualGuides = {
    ...enGuides,
}

export const faq = {
    ...enFaq,
}
