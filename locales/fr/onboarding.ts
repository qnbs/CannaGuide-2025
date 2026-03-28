// French (Francais) -- onboarding namespace
import { onboarding as en } from '../en/onboarding'

export const onboarding = {
    ...en,
    languageTitle: 'Choisissez votre langue',
    languageSubtitle: 'Selectionnez votre langue preferee pour continuer.',
    german: 'Allemand',
    english: 'Anglais',
    step1: {
        title: 'Encyclopedie des varietes',
        text: 'Decouvrez plus de 700 varietes avec des filtres detailles, explorez leur lignee genetique dans un arbre interactif ou ajoutez les votres. Obtenez des conseils de culture par IA.',
    },
    step2: {
        title: 'La salle de culture numerique',
        text: "Gerez jusqu'a trois plantes dans une simulation ultra-realiste en temps reel. Intervenez, enregistrez tout et regardez-les pousser.",
    },
    step3: {
        title: "L'atelier",
        text: 'Planifiez votre configuration parfaite avec le configurateur IA, utilisez des calculateurs precis et sauvegardez votre equipement pour de futurs projets.',
    },
    step4: {
        title: 'Le centre de connaissances',
        text: 'Apprenez avec le guide interactif, demandez conseil au mentor IA et utilisez les lexiques pour approfondir vos connaissances.',
    },
    startGrow: 'Commencons votre premiere culture !',
    localOnlyNote:
        'Pas de compte necessaire. Toutes les donnees restent sur votre appareil. Vous pouvez activer la synchronisation cloud plus tard dans les Parametres.',
    wizard: {
        stepExperience: {
            title: "Votre niveau d'experience",
            text: 'Cela personnalise la difficulte de la simulation et les conseils IA pour vous.',
            beginner: { label: 'Debutant', desc: 'Premiere culture -- gardons ca simple !' },
            intermediate: { label: 'Intermediaire', desc: 'Quelques cultures a mon actif.' },
            expert: { label: 'Expert', desc: 'Cultivateur avance -- realisme maximum.' },
        },
        stepGoal: {
            title: 'Votre objectif principal',
            text: 'Nous mettrons en avant les fonctionnalites et varietes les plus pertinentes pour vous.',
            medical: { label: 'Medical / CBD', desc: 'Culture riche en CBD, faible stress.' },
            recreational: { label: 'Recreatif', desc: 'Rendement et puissance maximaux.' },
            hobbyist: { label: 'Amateur', desc: 'Apprendre et explorer a mon rythme.' },
        },
        stepSetup: {
            title: 'Espace et budget',
            text: 'Nous vous suggererons la meilleure configuration de demarrage et les 3 meilleures varietes.',
            small: { label: 'Petit (< 0,5 m2)', desc: 'Micro-tente ou placard.' },
            medium: { label: 'Moyen (0,6-1,5 m2)', desc: 'Tente classique 80x80 ou 1x1.' },
            large: { label: 'Grand (> 1,5 m2)', desc: 'Tente 1,2x1,2 ou piece.' },
            budgetLabel: 'Budget de demarrage',
            budgetLow: '< 150 EUR',
            budgetMid: '150 - 400 EUR',
            budgetHigh: '> 400 EUR',
        },
        finish: 'Parfait -- cultivons !',
    },
}
