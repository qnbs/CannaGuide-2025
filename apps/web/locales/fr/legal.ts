export const legal = {
    ageGate: {
        title: "Verification d'Age Requise",
        subtitle: 'Cette application contient du contenu lie a la culture du cannabis.',
        body: "Selon la loi allemande sur le cannabis (KCanG), l'acces est restreint aux personnes agees de 18 ans et plus. En continuant, vous confirmez avoir au moins 18 ans et que la culture du cannabis est legale dans votre juridiction.",
        confirm: "J'ai 18 ans ou plus",
        deny: "J'ai moins de 18 ans",
        denied: "L'acces a cette application est restreint aux personnes agees de 18 ans et plus.",
    },
    geoLegal: {
        title: 'Avis Juridique',
        body: 'Les lois sur la culture du cannabis varient selon les pays et les regions. Cette application est concue pour une utilisation dans les juridictions ou la culture personnelle de cannabis est legale (p. ex., Allemagne sous KCanG). Verifiez toujours les lois applicables dans votre localite avant de cultiver du cannabis.',
        dismiss: 'Je comprends',
    },
    privacyPolicy: {
        title: 'Politique de Confidentialite',
        lastUpdated: 'Derniere mise a jour : {{date}}',
        sections: {
            overview: {
                title: 'Apercu',
                content:
                    "CannaGuide 2025 est une application axee sur la confidentialite. Toutes vos donnees sont stockees localement sur votre appareil. Nous n'exploitons pas de serveurs qui collectent ou stockent vos donnees personnelles.",
            },
            dataStorage: {
                title: 'Stockage des Donnees',
                content:
                    "Tous les journaux de culture, donnees de plantes, parametres et preferences sont stockes exclusivement dans l'IndexedDB et le localStorage de votre navigateur. Aucune donnee n'est transmise a nos serveurs.",
            },
            aiServices: {
                title: 'Services IA (Optionnel)',
                content:
                    "Si vous choisissez d'utiliser les fonctionnalites IA, vos requetes et images eventuellement telechargees sont envoyees directement depuis votre navigateur au fournisseur IA que vous avez selectionne (p. ex., Google Gemini, OpenAI, Anthropic, xAI). Votre cle API est chiffree localement avec AES-256-GCM et ne quitte jamais votre appareil non chiffree. Nous n'avons pas acces a vos cles API ni a vos conversations IA.",
            },
            imageProcessing: {
                title: 'Traitement des Images',
                content:
                    "Les images telechargees pour le diagnostic IA des plantes sont reencodees via canvas pour supprimer les metadonnees EXIF/GPS avant la transmission. Le telechargement d'images necessite votre consentement explicite.",
            },
            cookies: {
                title: 'Cookies et Stockage Local',
                content:
                    "Cette application n'utilise pas de cookies de suivi. Nous utilisons le localStorage et IndexedDB uniquement pour les fonctionnalites de l'application (parametres, donnees de plantes, drapeaux de consentement). Aucune analytique ni suivi tiers n'est employe.",
            },
            thirdParty: {
                title: 'Services Tiers',
                content:
                    "Les seules connexions externes sont : (1) Google Fonts pour la typographie, (2) les APIs des fournisseurs IA si vous activez les fonctionnalites IA avec votre propre cle API. Aucune donnee n'est partagee avec des annonceurs ou des fournisseurs d'analytique.",
            },
            rights: {
                title: 'Vos Droits (RGPD/DSGVO)',
                content:
                    "Puisque toutes les donnees sont stockees localement, vous avez un controle total. Vous pouvez exporter toutes les donnees via les Parametres, ou supprimer toutes les donnees en vidant le stockage de votre navigateur. Aucune demande aupres de nous n'est necessaire.",
            },
            contact: {
                title: 'Contact',
                content:
                    'Pour les questions liees a la confidentialite, veuillez ouvrir un issue sur le depot GitHub du projet.',
            },
        },
    },
    consent: {
        title: 'Consentement de Confidentialite',
        body: "Cette application stocke des donnees localement sur votre appareil (IndexedDB et localStorage) pour sauvegarder vos plantes, parametres et journaux de culture. Aucune donnee n'est envoyee a des serveurs externes sauf si vous utilisez explicitement les fonctionnalites IA avec votre propre cle API.",
        accept: 'Accepter et Continuer',
        learnMore: 'Politique de Confidentialite',
        required: 'Le consentement est requis pour utiliser cette application.',
    },
    impressum: {
        title: 'Mentions Legales (Impressum)',
        content:
            "CannaGuide 2025 est un projet open source heberge sur GitHub. Il s'agit d'une application educative non commerciale. Aucun Impressum selon le paragraphe 5 TMG n'est requis pour les projets prives non commerciaux.",
    },
    imageConsent: {
        banner: "L'image sera envoyee a votre fournisseur IA selectionne pour analyse. Les metadonnees EXIF/GPS sont automatiquement supprimees avant la transmission.",
        accept: 'Je comprends et je consens',
        accepted: 'Consentement donne',
        revoke: 'Revoquer le consentement image',
        revoked:
            'Consentement image revoque. Il vous sera demande a nouveau avant le prochain telechargement.',
    },
    medicalDisclaimer:
        "Ceci n'est pas un avis medical. Consultez toujours un professionnel qualifie pour les decisions liees a la sante.",
}
