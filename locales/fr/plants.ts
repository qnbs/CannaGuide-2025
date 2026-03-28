// French (Francais) -- plants namespace
import { plantsView as en } from '../en/plants'

export const plantsView = {
    ...en,
    emptySlot: {
        title: 'Demarrer une nouvelle culture',
        subtitle: 'Cliquez pour selectionner une variete',
        subtitleInline: 'et commencer un nouveau cycle de culture.',
    },
    inlineSelector: {
        title: "Demarrage d'une nouvelle culture !",
        subtitle:
            'Choisissez un emplacement vide ci-dessous pour planter votre variete selectionnee :',
    },
    hero: {
        ...en.hero,
        badge: 'Centre de commande du jardin',
        description:
            'Telemetrie en direct du jardin, sante des plantes et flux de travail de culture dans un espace concentre.',
        slots: 'Emplacements',
        tasks: 'Taches',
        alerts: 'Alertes',
    },
    gardenVitals: {
        ...en.gardenVitals,
        title: 'Sante du jardin',
    },
    journal: {
        ...en.journal,
    },
}
