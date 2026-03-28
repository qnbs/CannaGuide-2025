// Dutch (Nederlands) -- equipment namespace
import { seedbanks } from '../en/seedbanks'
import { equipmentView as en } from '../en/equipment'

export const equipmentView = {
    ...en,
    tabs: {
        configurator: 'Configurator',
        setups: 'Opgeslagen opstellingen',
        calculators: 'Calculators',
        growShops: 'Kweekwinkels',
        seedbanks: 'Zaadbanken',
    },
    configurator: {
        ...en.configurator,
        title: 'AI-opstellingsconfigurateur',
        subtitle: 'Ontvang een gepersonaliseerde apparatuurlijst op basis van je behoeften.',
        generate: 'Opstelling genereren',
        resultsTitle: 'Je persoonlijke kweekopstelling',
        total: 'Totale geschatte kosten',
        saveSetup: 'Opstelling opslaan',
        startOver: 'Opnieuw beginnen',
        tryAgain: 'Opnieuw proberen',
        error: 'Er is een fout opgetreden bij het genereren van je opstelling.',
        plantCount: 'Aantal planten',
        experience: 'Ervaring',
        budget: 'Budget (EUR)',
        step1Title: 'Basisgegevens',
        step2Title: 'Prioriteiten',
        step3Title: 'Details',
        categories: {
            tent: 'Kweektent',
            light: 'Verlichting',
            ventilation: 'Ventilatie',
            circulationFan: 'Circulatieventilator',
            pots: 'Potten',
            soil: 'Medium/Substraat',
            nutrients: 'Voedingsstoffen',
            extra: "Extra's en monitoring",
        },
        priorities: {
            yield: 'Opbrengst',
            quality: 'Kwaliteit',
            stealth: 'Discretie',
            easeOfUse: 'Gebruiksgemak',
            energy: 'Energie-efficientie',
        },
    },
    savedSetups: {
        ...en.savedSetups,
        noSetups: {
            title: 'Geen opgeslagen opstellingen',
            subtitle:
                'Gebruik de AI-configurator om je eerste opstelling te genereren en op te slaan.',
        },
        editTitle: 'Opstelling bewerken',
        exportTitle: 'Opstellingen exporteren',
    },
    calculators: {
        ...en.calculators,
        title: 'Calculators',
        yes: 'Ja',
        no: 'Nee',
    },
    growShops: {
        ...en.growShops,
        region: {
            europe: 'Europa',
            usa: 'VS / Canada',
        },
        strengths: 'Sterke punten',
        shipping: 'Verzending',
        paymentMethods: 'Betaalmethoden',
        visitShop: '{{shopName}} bezoeken',
        searchPlaceholder: 'Winkels zoeken...',
        sortBy: 'Sorteren',
        sortRating: 'Beoordeling',
        sortName: 'A-Z',
        shopsFound: 'winkels',
        noResults: 'Geen winkels komen overeen met je zoekopdracht.',
    },
    seedbanks,
    exportModal: {
        ...en.exportModal,
        format: 'Formaat',
        chooseFormat: 'Kies een formaat uit de onderstaande opties.',
        downloadReady: 'Download gereed',
        clickToDownload:
            'Je bestand "{{filename}}" is gereed. Klik op de knop hieronder om te downloaden.',
    },
}
