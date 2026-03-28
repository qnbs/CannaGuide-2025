// Dutch (Nederlands) -- knowledge namespace
import { knowledgeView as en } from '../en/knowledge'

export const knowledgeView = {
    ...en,
    title: 'Kenniscentrum',
    subtitle: 'Je interactieve gids voor succesvolle teelt.',
    tabs: {
        mentor: 'AI-mentor',
        guide: 'Kweekgids',
        archive: 'Mentorarchief',
        breeding: 'Kruisingslaboratorium',
        sandbox: 'Sandbox',
    },
    hub: {
        selectPlant: 'Plant selecteren',
        noPlants: 'Geen actieve planten voor contextueel advies. Start een kweek om te beginnen!',
        todaysFocus: 'Focus van vandaag voor {{plantName}}',
    },
    aiMentor: {
        title: 'AI-mentor',
        plantContext: 'Chatten met AI-mentor in de context van {{name}}',
        plantContextSubtitle:
            'Selecteer een plant om contextuele vragen te stellen en advies te krijgen.',
        startChat: 'Chat starten',
        inputPlaceholder: 'Vraag de mentor...',
        clearChat: 'Chat wissen',
        clearConfirm: 'Weet je zeker dat je de chatgeschiedenis voor deze plant wilt wissen?',
    },
    archive: {
        title: 'Mentorarchief',
        empty: 'Je hebt nog geen mentorreacties gearchiveerd.',
        saveButton: 'Opslaan in archief',
        saveSuccess: 'Reactie opgeslagen in archief!',
        queryLabel: 'Je vraag',
        editTitle: 'Reactie bewerken',
    },
    breeding: {
        ...en.breeding,
        title: 'Kruisingslaboratorium',
        description:
            'Kruis je verzamelde zaden om nieuwe, unieke rassen te creeren met gecombineerde eigenschappen.',
        collectedSeeds: 'Verzamelde zaden',
        noSeeds: 'Verzamel zaden van oogstrijpe planten om te beginnen met kruisen.',
        parentA: 'Ouder A',
        parentB: 'Ouder B',
        breedButton: 'Nieuw ras kruisen',
        resultsTitle: 'Kruisingsresultaat',
        newStrainName: 'Naam van het nieuwe ras',
        potentialTraits: 'Potentiele eigenschappen',
        saveStrain: 'Ras opslaan',
        breedingSuccess: 'Ras "{{name}}" succesvol gekruist! Het is toegevoegd aan "Mijn rassen".',
        splicingGenes: 'Genen splicen...',
        flowering: 'Bloei',
        vigor: 'Groeikracht',
        resin: 'Hars',
        aroma: 'Aroma',
        diseaseResistance: 'Ziekteresistentie',
    },
}
