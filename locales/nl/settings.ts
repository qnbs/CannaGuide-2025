// Dutch (Nederlands) -- settings namespace
import { settingsView as en } from '../en/settings'

export const settingsView = {
    ...en,
    title: 'Instellingen',
    searchPlaceholder: 'Instellingen zoeken...',
    saveSuccess: 'Instellingen opgeslagen!',
    categories: {
        general: 'Algemeen en interface',
        strains: 'Rassenweergave',
        plants: 'Planten en simulatie',
        notifications: 'Meldingen',
        defaults: 'Standaardwaarden',
        data: 'Gegevensbeheer',
        about: 'Over',
        tts: 'Stem en spraak',
        privacy: 'Privacy en beveiliging',
        accessibility: 'Toegankelijkheid',
        lookAndFeel: 'Uiterlijk',
        interactivity: 'Interactiviteit',
        ai: 'AI-configuratie',
    },
    security: {
        ...en.security,
        title: 'AI-beveiliging (multi-model BYOK)',
        warning:
            'Je API-sleutel wordt alleen op dit apparaat opgeslagen in IndexedDB. Deel nooit je sleutel en verwijder deze op gedeelde apparaten.',
        provider: 'AI-provider',
        providerDesc: 'Selecteer de AI-modelprovider. Elke provider vereist een eigen API-sleutel.',
        apiKey: 'API-sleutel',
        apiKeyDesc: 'Vereist voor alle AI-functies in deze statische app-implementatie.',
        save: 'Sleutel opslaan',
        test: 'Sleutel valideren',
        clear: 'Sleutel verwijderen',
        openAiStudio: 'API-sleutel ophalen',
        stored: 'Er is momenteel een API-sleutel opgeslagen op dit apparaat.',
        notStored: 'Er is nog geen API-sleutel opgeslagen.',
        saved: 'API-sleutel succesvol opgeslagen.',
        cleared: 'API-sleutel verwijderd.',
    },
    aiMode: {
        ...en.aiMode,
        title: 'AI-uitvoeringsmodus',
    },
}
