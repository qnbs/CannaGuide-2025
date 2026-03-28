// Dutch (Nederlands) -- onboarding namespace
import { onboarding as en } from '../en/onboarding'

export const onboarding = {
    ...en,
    languageTitle: 'Kies je taal',
    languageSubtitle: 'Selecteer je voorkeurstaal om door te gaan.',
    german: 'Duits',
    english: 'Engels',
    step1: {
        title: 'Rassenencyclopedie',
        text: 'Ontdek meer dan 700 rassen met gedetailleerde filters, verken hun genetische stamboom in een interactieve boom of voeg je eigen toe. Krijg AI-aangedreven kweektips.',
    },
    step2: {
        title: 'De digitale kweekruimte',
        text: 'Beheer tot drie planten in een ultrarealistisch realtime simulatie. Grijp in, log alles en kijk hoe ze groeien.',
    },
    step3: {
        title: 'De werkplaats',
        text: 'Plan je perfecte opstelling met de AI-configurator, gebruik nauwkeurige calculators en bewaar je apparatuur voor toekomstige projecten.',
    },
    step4: {
        title: 'Het kenniscentrum',
        text: 'Leer met de interactieve gids, vraag de AI-mentor om advies en gebruik de lexicons om je kennis te verdiepen.',
    },
    startGrow: 'Laten we beginnen met je eerste kweek!',
    localOnlyNote:
        'Geen account nodig. Alle gegevens blijven op je apparaat. Je kunt later optioneel cloudsynchronisatie inschakelen in Instellingen.',
    wizard: {
        stepExperience: {
            title: 'Je ervaringsniveau',
            text: 'Dit past de simulatiemoeilijkheid en AI-advies aan voor jou.',
            beginner: { label: 'Beginner', desc: 'Eerste kweek ooit -- houd het simpel!' },
            intermediate: { label: 'Gevorderd', desc: 'Een paar kweken achter de rug.' },
            expert: { label: 'Expert', desc: 'Ervaren kweker -- maximaal realisme.' },
        },
        stepGoal: {
            title: 'Je belangrijkste doel',
            text: 'We markeren de meest relevante functies en rassen voor jou.',
            medical: { label: 'Medicinaal / CBD', desc: 'Hoog-CBD, stressarme teelt.' },
            recreational: { label: 'Recreatief', desc: 'Maximale opbrengst en potentie.' },
            hobbyist: { label: 'Hobbyist', desc: 'Leren en ontdekken op mijn eigen tempo.' },
        },
        stepSetup: {
            title: 'Ruimte en budget',
            text: 'We stellen de beste startersopstelling en top 3 rassen voor je voor.',
            small: { label: 'Klein (< 0,5 m2)', desc: 'Micro-tent of kast.' },
            medium: { label: 'Middel (0,6-1,5 m2)', desc: 'Klassieke 80x80 of 1x1 tent.' },
            large: { label: 'Groot (> 1,5 m2)', desc: '1,2x1,2 tent of kamer.' },
            budgetLabel: 'Startbudget',
            budgetLow: '< 150 EUR',
            budgetMid: '150 - 400 EUR',
            budgetHigh: '> 400 EUR',
        },
        finish: 'Perfect -- laten we kweken!',
    },
}
