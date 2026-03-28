// French (Francais) -- equipment namespace
import { seedbanks } from '../en/seedbanks'
import { equipmentView as en } from '../en/equipment'

export const equipmentView = {
    ...en,
    tabs: {
        configurator: 'Configurateur',
        setups: 'Configurations sauvegardees',
        calculators: 'Calculateurs',
        growShops: 'Magasins de culture',
        seedbanks: 'Banques de graines',
    },
    configurator: {
        ...en.configurator,
        title: "Configurateur IA d'equipement",
        subtitle: "Obtenez une liste d'equipement personnalisee selon vos besoins.",
        generate: 'Generer la configuration',
        resultsTitle: 'Votre configuration de culture personnalisee',
        total: 'Cout total estime',
        saveSetup: 'Sauvegarder la configuration',
        startOver: 'Recommencer',
        tryAgain: 'Reessayer',
        error: "Une erreur s'est produite lors de la generation de votre configuration.",
        plantCount: 'Nombre de plantes',
        experience: 'Experience',
        budget: 'Budget (EUR)',
        step1Title: 'Bases',
        step2Title: 'Priorites',
        step3Title: 'Details',
        categories: {
            tent: 'Tente de culture',
            light: 'Eclairage',
            ventilation: 'Ventilation',
            circulationFan: 'Ventilateur de circulation',
            pots: 'Pots',
            soil: 'Substrat',
            nutrients: 'Nutriments',
            extra: 'Extras et surveillance',
        },
        priorities: {
            yield: 'Rendement',
            quality: 'Qualite',
            stealth: 'Discretion',
            easeOfUse: "Facilite d'utilisation",
            energy: 'Efficacite energetique',
        },
    },
    savedSetups: {
        ...en.savedSetups,
        noSetups: {
            title: 'Aucune configuration sauvegardee',
            subtitle:
                'Utilisez le Configurateur IA pour generer et sauvegarder votre premiere configuration.',
        },
        editTitle: 'Modifier la configuration',
        exportTitle: 'Exporter les configurations',
    },
    calculators: {
        ...en.calculators,
        title: 'Calculateurs',
        yes: 'Oui',
        no: 'Non',
    },
    growShops: {
        ...en.growShops,
        region: {
            europe: 'Europe',
            usa: 'USA / Canada',
        },
        strengths: 'Points forts',
        shipping: 'Livraison',
        paymentMethods: 'Methodes de paiement',
        visitShop: 'Visiter {{shopName}}',
        searchPlaceholder: 'Rechercher des magasins...',
        sortBy: 'Trier',
        sortRating: 'Note',
        sortName: 'A-Z',
        shopsFound: 'magasins',
        noResults: 'Aucun magasin ne correspond a votre recherche.',
    },
    seedbanks,
    exportModal: {
        ...en.exportModal,
        format: 'Format',
        chooseFormat: 'Choisissez un format parmi les options ci-dessous.',
        downloadReady: 'Telechargement pret',
        clickToDownload:
            'Votre fichier "{{filename}}" est pret. Cliquez sur le bouton ci-dessous pour telecharger.',
    },
}
