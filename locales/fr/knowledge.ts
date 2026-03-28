// French (Francais) -- knowledge namespace
import { knowledgeView as en } from '../en/knowledge'

export const knowledgeView = {
    ...en,
    title: 'Centre de connaissances',
    subtitle: 'Votre guide interactif pour une culture reussie.',
    tabs: {
        mentor: 'Mentor IA',
        guide: 'Guide de culture',
        archive: 'Archives du mentor',
        breeding: 'Laboratoire de croisement',
        sandbox: 'Bac a sable',
    },
    hub: {
        selectPlant: 'Selectionner une plante',
        noPlants:
            'Aucune plante active pour des conseils contextuels. Demarrez une culture pour commencer !',
        todaysFocus: 'Focus du jour pour {{plantName}}',
    },
    aiMentor: {
        title: 'Mentor IA',
        plantContext: 'Discussion avec le Mentor IA dans le contexte de {{name}}',
        plantContextSubtitle:
            'Selectionnez une plante pour poser des questions contextuelles et obtenir des conseils.',
        startChat: 'Demarrer le chat',
        inputPlaceholder: 'Demandez au mentor...',
        clearChat: 'Effacer le chat',
        clearConfirm: "Voulez-vous vraiment effacer l'historique de chat de cette plante ?",
    },
    archive: {
        title: 'Archives du mentor',
        empty: "Vous n'avez pas encore archive de reponses du mentor.",
        saveButton: 'Sauvegarder dans les archives',
        saveSuccess: 'Reponse sauvegardee dans les archives !',
        queryLabel: 'Votre requete',
        editTitle: 'Modifier la reponse',
    },
    breeding: {
        ...en.breeding,
        title: 'Laboratoire de croisement',
        description:
            'Croisez vos graines collectees pour creer de nouvelles varietes uniques avec des caracteristiques combinees.',
        collectedSeeds: 'Graines collectees',
        noSeeds: 'Collectez des graines de plantes pretes a recolter pour commencer le croisement.',
        parentA: 'Parent A',
        parentB: 'Parent B',
        breedButton: 'Croiser une nouvelle variete',
        resultsTitle: 'Resultat du croisement',
        newStrainName: 'Nom de la nouvelle variete',
        potentialTraits: 'Traits potentiels',
        saveStrain: 'Sauvegarder la variete',
        breedingSuccess:
            'Variete "{{name}}" croisee avec succes ! Elle a ete ajoutee a "Mes varietes".',
        splicingGenes: 'Epissage des genes...',
        flowering: 'Floraison',
        vigor: 'Vigueur',
        resin: 'Resine',
        aroma: 'Arome',
        diseaseResistance: 'Resistance aux maladies',
    },
}
