// French (Francais) -- settings namespace
import { settingsView as en } from '../en/settings'

export const settingsView = {
    ...en,
    title: 'Parametres',
    searchPlaceholder: 'Rechercher dans les parametres...',
    saveSuccess: 'Parametres sauvegardes !',
    categories: {
        general: 'General et interface',
        strains: 'Vue des varietes',
        plants: 'Plantes et simulation',
        notifications: 'Notifications',
        defaults: 'Valeurs par defaut',
        data: 'Gestion des donnees',
        about: 'A propos',
        tts: 'Voix et parole',
        privacy: 'Confidentialite et securite',
        accessibility: 'Accessibilite',
        lookAndFeel: 'Apparence',
        interactivity: 'Interactivite',
        ai: 'Configuration IA',
    },
    security: {
        ...en.security,
        title: 'Securite IA (multi-modele BYOK)',
        warning:
            'Votre cle API est stockee uniquement sur cet appareil dans IndexedDB. Ne partagez jamais votre cle et supprimez-la sur les appareils partages.',
        provider: 'Fournisseur IA',
        providerDesc:
            'Selectionnez le fournisseur du modele IA. Chaque fournisseur necessite sa propre cle API.',
        apiKey: 'Cle API',
        apiKeyDesc:
            "Requise pour toutes les fonctionnalites IA dans ce deploiement d'application statique.",
        save: 'Sauvegarder la cle',
        test: 'Valider la cle',
        clear: 'Supprimer la cle',
        openAiStudio: 'Obtenir une cle API',
        stored: 'Une cle API est actuellement sauvegardee sur cet appareil.',
        notStored: "Aucune cle API n'est encore sauvegardee.",
        saved: 'Cle API sauvegardee avec succes.',
        cleared: 'Cle API supprimee.',
    },
    aiMode: {
        ...en.aiMode,
        title: "Mode d'execution IA",
    },
}
