export const settingsView = {
    title: 'Parametres',
    searchPlaceholder: 'Rechercher dans les parametres...',
    saveSuccess: 'Parametres enregistres !',
    categories: {
        general: 'General & Interface',
        strains: 'Vue des varietes',
        plants: 'Plantes & Simulation',
        notifications: 'Notifications',
        defaults: 'Valeurs par defaut',
        data: 'Gestion des donnees',
        about: 'A propos',
        tts: 'Voix & Synthese vocale',
        privacy: 'Confidentialite & Securite',
        accessibility: 'Accessibilite',
        lookAndFeel: 'Apparence & Style',
        interactivity: 'Interactivite',
        ai: 'Configuration IA',
        iot: 'Materiel & IoT', // machine-translated, review needed
        grows: 'Gestion des cultures',
    },
    security: {
        title: 'Securite IA (Multi-Model BYOK)',
        warning:
            'Votre cle API est stockee uniquement sur cet appareil dans IndexedDB. Ne partagez jamais votre cle et supprimez-la sur les appareils partages.',
        geminiFreeNote:
            'Astuce : La cle API Gemini de Google AI Studio est gratuite avec un compte Google sur aistudio.google.com.', // machine-translated, review needed
        provider: 'Fournisseur IA',
        providerDesc:
            'Selectionnez le fournisseur de modele IA. Chaque fournisseur necessite sa propre cle API.',
        apiKey: 'Cle API',
        apiKeyDesc: 'Requise pour toutes les fonctionnalites IA dans ce deploiement statique.',
        save: 'Enregistrer la cle',
        test: 'Valider la cle',
        clear: 'Supprimer la cle',
        openAiStudio: 'Obtenir une cle API',
        stored: 'Une cle API est actuellement enregistree sur cet appareil.',
        notStored: 'Aucune cle API enregistree.',
        maskedPrefix: 'Cle enregistree :',
        invalid: 'Veuillez entrer une cle API valide.',
        saved: 'Cle API enregistree avec succes.',
        testSuccessStored:
            'La cle API enregistree est valide et prete pour toutes les fonctionnalites IA.',
        testSuccessUnsaved:
            'La cle API saisie est valide. Enregistrez-la pour activer toutes les fonctionnalites IA.',
        cleared: 'Cle API supprimee.',
        loadError: 'Impossible de charger le statut de la cle API.',
        saveError: "Impossible d'enregistrer la cle API.",
        testError:
            'La validation de la cle API a echoue. Veuillez verifier la validite et les permissions de la cle.',
        clearError: 'Impossible de supprimer la cle API.',
        usageToday:
            "Aujourd'hui : {{requests}} requetes, ~{{tokens}} tokens estimes, {{remaining}} requetes restantes (par minute).",
        rotationLabel: 'Rotation de la cle',
        rotationToday: "mise a jour aujourd'hui",
        rotationAge: 'mise a jour il y a {{days}} jours',
        rotationUnknown: 'date de rotation inconnue',
        rotationAdvice:
            'Changez regulierement les cles stockees et supprimez-les immediatement apres utilisation sur les appareils partages.',
        rotationDue:
            'Cette cle a depasse la fenetre de rotation de 90 jours et doit etre remplacee avant que les requetes IA ne fonctionnent a nouveau.',
        rotationBadge: 'Pivoter maintenant',
        auditLog: "Journal d'audit IA local",
        auditLogEmpty: "Aucune requete IA n'a encore ete enregistree.",
        clearAuditLog: "Effacer le journal d'audit",
        panicButton: "Effacement d'urgence des cles", // machine-translated, review needed
        panicButtonDesc:
            'Supprimez immediatement TOUTES les cles API stockees et la cle de chiffrement de cet appareil. Cette action est irreversible.',
        panicButtonConfirm: 'Effacer toutes les cles',
        panicButtonSuccess: 'Toutes les cles API et la cle de chiffrement ont ete supprimees.',
        encryptionNotice: 'Transparence du chiffrement',
        encryptionNoticeDesc:
            'Les cles API sont chiffrees avec AES-256-GCM via une cle non exportable dans IndexedDB. Protege contre la navigation desinvolte et les attaques XSS basiques.',
        providerConsent: 'Consentement de transmission de donnees',
        providerConsentPrompt:
            "Vous etes sur le point d'envoyer des donnees de plante (y compris des photos) a {{provider}}. Acceptez-vous ?",
        providerConsentRemember: 'Retenir mon choix pour ce fournisseur',
        providerDpaLink: "Voir l'accord de traitement des donnees",
    },
    costTracking: {
        title: 'Suivi des couts IA',
        disclaimer:
            'Les estimations de couts sont approximatives et basees sur les tarifs publies des API. Les frais reels peuvent varier.',
        tokensToday: "Tokens aujourd'hui",
        costToday: "Cout est. aujourd'hui",
        last7Days: '7 derniers jours',
        monthlyBudget: 'Budget mensuel',
        unlimited: 'Illimite',
        budgetPlaceholder: 'Limite de tokens (0 = desactive)',
        setBudget: 'Definir',
        resetHistory: "Reinitialiser l'historique des couts",
        budgetWarning: 'Vous avez atteint votre budget mensuel de tokens.',
    },
    aiMode: {
        title: "Mode d'execution IA",
        description:
            "Choisissez comment l'application traite les requetes IA. Le mode Cloud utilise votre cle API pour la meilleure qualite, le mode Local execute tout sur votre appareil pour une confidentialite maximale, et le mode Hybride choisit automatiquement la meilleure option.",
        label: 'Mode IA',
        cloud: 'Cloud',
        cloudDesc:
            'Toutes les requetes IA sont envoyees au fournisseur cloud (Gemini, OpenAI, etc.). Meilleure qualite, necessite une cle API et une connexion internet.',
        local: 'Local',
        localDesc:
            "Toute l'IA s'execute sur votre appareil avec des modeles locaux. Aucune donnee ne quitte l'appareil. Fonctionne entierement hors ligne une fois les modeles precharges.",
        hybrid: 'Hybride (Intelligent)',
        hybridDesc:
            "Utilise automatiquement les modeles locaux lorsqu'ils sont precharges, sinon bascule vers le cloud. Le meilleur des deux mondes.",
        eco: 'Eco',
        ecoDesc:
            'Mode economie de batterie pour appareils bas de gamme ou mobiles. Utilise uniquement le petit modele texte 0.5B et des heuristiques basees sur des regles. Pas de cloud, pas de modeles lourds.',
        ecoAutoDetected:
            'Le mode Eco a ete active automatiquement car votre appareil dispose de peu de memoire ou de batterie.',
        activeIndicator: 'Mode actif : {{mode}}',
        localNotReady:
            'Les modeles IA locaux ne sont pas encore precharges. Prechargez-les ci-dessous pour une meilleure experience locale.',
        localReady: "Les modeles IA locaux sont charges et prets pour l'inference.",
        switchingToLocal: 'Passage en mode local -- les modeles seront precharges automatiquement.',
        imageGenCloudOnly:
            "Remarque : La generation d'images est disponible uniquement en mode Cloud ou Hybride.",
    },
    offlineAi: {
        title: 'Cache IA locale hors ligne',
        description:
            'Prechargez les modeles locaux de texte et de vision pendant que vous etes en ligne afin que les diagnostics fonctionnent encore lorsque le reseau est indisponible.',
        preload: 'Precharger les modeles hors ligne',
        preloading: 'Prechargement...',
        ready: 'Les modeles hors ligne sont prets.',
        partial:
            'Certains actifs de modeles sont prets, mais le prechauffage du cache est incomplet.',
        error: 'Le prechargement du modele a echoue. Reessayez avec une connexion stable.',
        idle: "Aucun prechargement de modele hors ligne n'a encore ete effectue.",
        cacheState: 'Details du cache : {{value}}',
        persistentStorage: 'Stockage persistant : {{value}}',
        webGpuSupported: 'WebGPU est disponible sur cet appareil.',
        webGpuUnavailable:
            "WebGPU n'est pas disponible, l'application utilisera le repli Transformer.js.",
        onnxBackend: 'Backend ONNX : {{value}}',
        webLlmReady: 'WebLLM est pret comme runtime local haute performance.',
        webLlmFallback: "WebLLM n'est pas actif ; l'IA locale utilisera le repli Transformer.js.",
        readyAt: 'Dernier prechargement reussi : {{value}}',
        yes: 'accorde',
        no: 'non accorde',
        unknown: 'inconnu',
        offlineHint:
            "Mettez l'application en ligne pour prechauffer le cache de modeles avant de compter sur l'IA hors ligne.",
        forceWasm: 'Forcer le backend WASM',
        forceWasmHint:
            'Ignorer la detection automatique de WebGPU et toujours utiliser le backend WASM. Utile pour le debogage.',
        enableWebGpu: "Activer l'acceleration WebGPU", // machine-translated, review needed
        enableWebGpuHint:
            "Utiliser le GPU pour l'inference IA locale lorsque disponible. Offre une inference 3-8x plus rapide. Desactivez pour forcer le mode CPU uniquement.",
        webGpuTier: 'Niveau GPU : {{value}}',
        webGpuVram: 'VRAM GPU : {{value}} Mo',
        webGpuVendor: 'GPU : {{value}}',
        webGpuBatteryGated:
            'WebGPU en pause -- batterie en dessous de 15%. Branchez pour reactiver.',
        webGpuFeatureF16: 'shader-f16 : {{value}}',
        webGpuDeviceCleanup:
            "La memoire GPU est automatiquement liberee lorsque l'onglet est masque pendant 30 secondes.",
        preferredModel: 'Modele texte prefere',
        modelAuto: 'Auto (Qwen2.5-1.5B)',
        modelQwen25: 'Qwen2.5-1.5B (Equilibre)',
        modelQwen3: 'Qwen2.5-0.5B (Leger)',
        benchPreloadTime: 'Dernier prechargement : {{value}} s',
        benchInferenceSpeed: "Vitesse d'inference : {{value}} tok/s",
        benchNotAvailable: 'Lancez un prechargement pour voir les donnees de performance.',
        // Selecteur de modele LLM
        modelSelector: {
            title: 'Selection du modele LLM',
            subtitle: 'Choisissez quel modele IA local utiliser pour la generation de texte.',
            autoLabel: 'Auto (Recommande)',
            autoDesc: 'Selectionne automatiquement le meilleur modele pour votre appareil.',
            currentAuto: 'Votre appareil : {{model}}',
            recommended: 'Recommande',
            downloadSize: '{{size}} Mo telechargement',
            largeDownload: 'Telechargement volumineux',
            loading: 'Chargement du modele...',
            'model_0.5B_desc':
                'Modele ultra-leger pour tout appareil. Rapide mais qualite limitee.',
            'model_1.5B_desc':
                'Modele equilibre pour GPUs milieu de gamme. Bon support multilingue.',
            model_3B_desc: 'Raisonnement de haute qualite. Meilleur choix pour GPUs performants.',
            model_4B_desc: 'Raisonnement fort et suivi des instructions. Option la plus grande.',
        },
        // Embedding & Semantic RAG
        embeddingModelReady:
            "Le modele d'embedding (MiniLM) est pret pour la recherche semantique.",
        embeddingModelMissing:
            "Modele d'embedding non charge. Le RAG semantique utilisera le repli par mots-cles.",
        enableSemanticRag: 'Recherche RAG semantique',
        enableSemanticRagHint:
            'Utiliser des embeddings vectoriels pour une recuperation plus precise du contexte du journal de culture au lieu de la correspondance par mots-cles.',
        // NLP Models
        sentimentModelReady: "Le modele d'analyse de sentiment est pret.",
        sentimentModelMissing: 'Modele de sentiment non charge.',
        summarizationModelReady: 'Le modele de resume est pret.',
        summarizationModelMissing: 'Modele de resume non charge.',
        zeroShotTextModelReady: 'Le modele de classification de requetes est pret.',
        zeroShotTextModelMissing: 'Modele de classification de requetes non charge.',
        enableSentiment: 'Analyse de sentiment du journal',
        enableSentimentHint:
            "Analyser le ton emotionnel des entrees du journal pour suivre l'humeur du cultivateur et detecter des tendances.",
        enableSummarization: 'Resume de texte',
        enableSummarizationHint:
            'Condenser les longs journaux de culture et les historiques de chat du mentor en resumes concis.',
        enableQueryClassification: 'Routage intelligent des requetes',
        enableQueryClassificationHint:
            'Categoriser automatiquement les questions pour ameliorer la pertinence des reponses IA.',
        // Eco Mode
        ecoMode: 'Mode Eco',
        ecoModeHint:
            "Forcer le backend WASM et les modeles les plus petits pour reduire l'utilisation CPU/GPU jusqu'a 70 %. Ideal pour les appareils bas de gamme ou les economies de batterie.",
        // Persistent Cache
        enablePersistentCache: "Cache d'inference persistant",
        enablePersistentCacheHint:
            "Stocker les reponses IA dans IndexedDB afin que les requetes repetees retournent instantanement, meme apres le rechargement de l'application.",
        persistentCacheSize: 'Reponses en cache : {{value}}',
        clearPersistentCache: "Vider le cache d'inference",
        // Telemetry
        enableTelemetry: 'Telemetrie IA locale',
        enableTelemetryHint:
            "Suivre la vitesse d'inference, le debit de tokens et l'utilisation des modeles localement. Aucune donnee ne quitte l'appareil.",
        telemetryInferences: 'Total des inferences : {{value}}',
        telemetryAvgLatency: 'Latence moyenne : {{value}} ms',
        telemetryAvgSpeed: 'Vitesse moyenne : {{value}} tok/s',
        telemetryCacheHitRate: 'Taux de succes du cache : {{value}}%',
        telemetrySuccessRate: 'Taux de reussite : {{value}}%',
        telemetryPeakSpeed: 'Vitesse maximale : {{value}} tok/s',
        // Advanced
        inferenceTimeout: "Delai d'inference",
        inferenceTimeoutHint:
            'Temps maximum en secondes pour attendre une reponse IA locale unique.',
        maxCacheSize: "Nombre max d'entrees en cache",
        maxCacheSizeHint: "Nombre maximum de resultats d'inference mis en cache dans IndexedDB.",
        // Progressive Quantization
        quantizationLevel: 'Quantification du modele',
        quantizationLevelHint:
            'Controle la precision et la taille du modele. Auto selectionne la meilleure option en fonction de votre GPU et de votre memoire. q4f16 utilise le float16 4 bits pour les GPU haut de gamme, q4 utilise le modele leger 0.5B pour une compatibilite elargie.',
        quantAuto: 'Auto (base sur la VRAM)',
        quantQ4f16: 'q4f16 (Premium, 1.5B)',
        quantQ4: 'q4 (Standard, 0.5B)',
        quantNone: 'Aucune (Precision complete)',
        quantActiveProfile:
            "Profil actif : {{sizeTier}} {{quantLevel}} -- ~{{savings}}% d'economies",
        // Model Status Section
        modelStatusTitle: "Apercu de l'etat des modeles",
        modelsLoaded: '{{loaded}} sur {{total}} modeles prets',
        // Health & Device
        healthStatus: 'Sante IA : {{value}}',
        deviceClass: "Classe d'appareil : {{value}}",
        // Language Detection
        langDetectionReady: 'Le modele de detection de langue est pret.',
        langDetectionMissing: 'Modele de detection de langue non charge.',
        // Image Similarity
        imgSimilarityReady: "La similarite d'images (caracteristiques CLIP) est prete.",
        imgSimilarityMissing: "Modele de similarite d'images non charge.",
        // Performance Alerts
        perfDegradedWarning:
            "L'IA locale est lente ({{tokPerSec}} tok/s). Envisagez de fermer d'autres onglets ou de passer a un modele plus leger.",
        perfDegradedDowngrade:
            "La vitesse d'inference a diminue. Il est recommande de passer a un modele plus leger.",
        perfDegradedCloseTabs:
            "La vitesse d'inference a diminue. Fermer les onglets inutilises peut liberer de la memoire GPU.",
    },
    localAiDiag: {
        reasons: {
            active: 'WebLLM est actif et fonctionne sur le GPU.',
            'insecure-context': 'WebGPU necessite un contexte securise (HTTPS ou localhost).',
            'no-webgpu-api': 'Ce navigateur ne prend pas en charge WebGPU.',
            'no-gpu-adapter': "Aucun adaptateur GPU compatible n'a ete trouve.",
            'vram-insufficient': 'Pas assez de memoire GPU (VRAM) pour le modele selectionne.',
            'no-model-profile':
                "Aucun profil de modele ne correspond aux capacites actuelles de l'appareil.",
            'force-wasm-override':
                'WebGPU desactive -- Forcer WASM est active dans les parametres.',
            'browser-unsupported':
                'Votre navigateur ne prend pas en charge les fonctionnalites WebGPU requises.',
            'adapter-request-timeout': "La requete de l'adaptateur GPU a expire apres 5 secondes.",
            'unknown-error':
                "Une erreur inattendue s'est produite lors de l'initialisation de WebGPU.",
        },
    },
    general: {
        title: 'Parametres generaux',
        language: 'Langue',
        theme: 'Theme',
        themes: {
            midnight: 'Minuit',
            forest: 'Foret',
            purpleHaze: 'Brume violette',
            desertSky: 'Ciel du desert',
            roseQuartz: 'Quartz rose',
            rainbowKush: 'Rainbow Kush',
            ogKushGreen: 'OG Kush Green',
            runtzRainbow: 'Runtz Rainbow',
            lemonSkunk: 'Lemon Skunk',
        },
        fontSize: 'Taille de police',
        fontSizes: {
            sm: 'Petite',
            base: 'Normale',
            lg: 'Grande',
        },
        defaultView: 'Vue par defaut au demarrage',
        installApp: "Installer l'application",
        installAppDesc:
            "Installez CannaGuide 2025 sur votre appareil pour une experience native, y compris l'acces hors ligne.",
        uiDensity: "Densite de l'interface",
        uiDensities: {
            comfortable: 'Confortable',
            compact: 'Compact',
        },
        dyslexiaFont: 'Police adaptee a la dyslexie',
        dyslexiaFontDesc: 'Utilise la police Atkinson Hyperlegible pour une meilleure lisibilite.',
        reducedMotion: 'Mouvement reduit',
        reducedMotionDesc: 'Desactive ou reduit les animations et les effets de mouvement.',
        highContrastMode: 'Mode contraste eleve',
        highContrastModeDesc:
            "Augmente le contraste et la definition des bords pour les surfaces critiques de l'interface.",
        colorblindMode: 'Mode daltonien',
        colorblindModeDesc:
            "Ajuste les couleurs de l'application pour differents types de deficience de la vision des couleurs.",
        colorblindModes: {
            none: 'Aucun',
            protanopia: 'Protanopie (daltonisme rouge)',
            deuteranopia: 'Deuteranopie (daltonisme vert)',
            tritanopia: 'Tritanopie (daltonisme bleu)',
        },
    },
    languages: {
        en: 'Anglais',
        de: 'Allemand',
        es: 'Espagnol',
        fr: 'Francais',
        nl: 'Neerlandais',
    },
    tts: {
        title: 'Voix & Synthese vocale',
        ttsOutput: 'Sortie vocale (Synthese vocale)',
        voiceControlInput: 'Commande vocale (Entree)',
        ttsEnabled: 'Activer la synthese vocale',
        ttsEnabledDesc:
            "Ajoute des boutons pour faire lire le contenu de l'application a voix haute.",
        voice: 'Voix',
        noVoices: 'Aucune voix disponible pour la langue actuelle.',
        rate: 'Debit vocal',
        pitch: 'Hauteur',
        volume: 'Volume',
        highlightSpeakingText: 'Surligner le texte en cours de lecture',
        highlightSpeakingTextDesc:
            'Met visuellement en evidence le bloc de texte en cours de lecture.',
        testVoice: 'Tester la voix',
        testVoiceSentence: 'Ceci est un test de la voix selectionnee.',
        voiceControl: {
            enabled: 'Activer la commande vocale',
            enabledDesc: "Controlez l'application a l'aide de commandes vocales simples.",
            hotwordEnabled: 'Mot-cle permanent',
            hotwordEnabledDesc:
                'Garde le microphone pret pour les mots de reveil mains libres lorsque le navigateur le prend en charge.',
            confirmationSound: 'Sons de confirmation',
            confirmationSoundDesc:
                "Joue un court son lorsqu'une commande vocale est reconnue avec succes.",
        },
        commands: {
            title: 'Reference des commandes',
            description:
                'Voici une liste de commandes que vous pouvez utiliser lorsque la commande vocale est active. Commencez simplement par "Aller a..." ou "Rechercher...".',
            searchPlaceholder: 'Rechercher des commandes...',
            groups: {
                navigation: 'Navigation',
                strains: 'Varietes',
                plants: 'Plantes',
            },
            goTo: 'Aller a {{view}}',
            searchFor: 'Rechercher [nom de la variete]',
            resetFilters: 'Reinitialiser les filtres',
            showFavorites: 'Afficher les favoris',
            waterAll: 'Arroser toutes les plantes',
        },
        readThis: 'Lire cette section a voix haute',
        play: 'Lecture',
        pause: 'Pause',
        next: 'Suivant',
        stop: 'Arreter',
    },
    strains: {
        title: 'Parametres de la vue des varietes',
        defaultSort: 'Ordre de tri par defaut',
        defaultViewMode: "Mode d'affichage par defaut",
        strainsPerPage: 'Elements par page',
        viewModes: {
            list: 'Liste',
            grid: 'Grille',
        },
        visibleColumns: 'Colonnes visibles (vue liste)',
        visibleColumnsDesc: 'Choisissez les colonnes de donnees a afficher dans la vue liste.',
        columns: {
            type: 'Type',
            thc: 'THC',
            cbd: 'CBD',
            floweringTime: 'Temps de floraison',
        },
        sortKeys: {
            name: 'Nom',
            thc: 'THC',
            cbd: 'CBD',
            floweringTime: 'Temps de floraison',
            difficulty: 'Difficulte',
            type: 'Type',
            yield: 'Rendement',
            height: 'Hauteur',
        },
        sortDirections: {
            asc: 'Croissant',
            desc: 'Decroissant',
        },
        defaults: {
            title: 'Valeurs par defaut & Comportement',
            prioritizeTitle: 'Prioriser mes varietes & favoris',
            prioritizeDesc:
                'Toujours afficher vos varietes personnalisees et favorites en haut de la liste.',
            sortDirection: 'Direction du tri',
        },
        listView: {
            title: 'Personnalisation de la vue liste',
            description: 'Personnalisez les colonnes affichees dans la vue liste.',
        },
        advanced: {
            title: 'Fonctionnalites avancees',
            genealogyLayout: 'Disposition genealogique par defaut',
            genealogyDepth: 'Profondeur initiale de la genealogie par defaut',
            aiTipsExperience: "Niveau d'experience par defaut pour les conseils IA",
            aiTipsFocus: 'Focus par defaut des conseils IA',
        },
    },
    plants: {
        title: 'Plantes & Simulation',
        realtimeEngine: 'Moteur temps reel',
        behavior: 'Comportement de la simulation',
        calibration: 'Calibration environnementale',
        physics: 'Physique avancee de simulation (Expert)',
        showArchived: 'Afficher les cultures terminees',
        showArchivedDesc: 'Affiche les plantes terminees/recoltees sur le tableau de bord.',
        archivedHiddenTitle: 'Culture archivee masquee',
        archivedHiddenDesc:
            'Cet emplacement contient une culture terminee actuellement masquee pour un tableau de bord en direct plus propre.',
        inspectArchived: 'Inspecter la culture archivee',
        autoGenerateTasks: 'Generation automatique des taches',
        autoGenerateTasksDesc: "Cree automatiquement des taches pour les actions comme l'arrosage.",
        realtimeSimulation: 'Simulation en temps reel',
        realtimeSimulationDesc: 'La simulation de plantes continue de fonctionner en arriere-plan.',
        autoJournaling: 'Journalisation automatique',
        logStageChanges: "Enregistrer les changements d'etape",
        logProblems: 'Enregistrer les problemes',
        logTasks: 'Enregistrer les taches',
        simulationProfile: 'Profil de simulation',
        simulationProfileDesc:
            'Applique un ensemble documente de courbes de reponse pour le stress environnemental, la volatilite des nutriments, la pression parasitaire et la precision post-recolte tout en gardant la chronologie strictement en temps reel.',
        simulationProfiles: {
            beginner: 'Debutant',
            intermediate: 'Intermediaire',
            expert: 'Expert',
        },
        pestPressure: 'Pression parasitaire',
        pestPressureDesc:
            "Alimente une courbe de pression parasitaire non lineaire. Les valeurs basses restent indulgentes ; les valeurs elevees augmentent la probabilite d'epidemie beaucoup plus rapidement.",
        nutrientSensitivity: 'Sensibilite aux nutriments',
        nutrientSensitivityDesc:
            'Intensite de la reaction de la plante aux desequilibres nutritifs.',
        environmentalStability: 'Stabilite environnementale',
        environmentalStabilityDesc:
            "Pilote une courbe d'instabilite deterministe pour la derive quotidienne de temperature et d'humidite. Les valeurs basses amplifient les oscillations de maniere forte au lieu de lineaire.",
        leafTemperatureOffset: 'Decalage de temperature foliaire (degC)',
        leafTemperatureOffsetDesc:
            "Simule combien les feuilles sont plus froides (negatif) ou plus chaudes (positif) que l'air ambiant. Impact direct sur le calcul du VPD.",
        lightExtinctionCoefficient: 'Penetration de la lumiere (valeur k)',
        lightExtinctionCoefficientDesc:
            'Controle la penetration de la lumiere dans la canopee. Une valeur plus basse signifie une meilleure penetration. Affecte la photosynthese des feuilles inferieures.',
        nutrientConversionEfficiency: 'Efficacite de conversion des nutriments',
        nutrientConversionEfficiencyDesc:
            'Efficacite avec laquelle la plante convertit les nutriments absorbes en biomasse. Une valeur plus elevee signifie plus de croissance pour la meme quantite de nutriments.',
        stomataSensitivity: 'Sensibilite des stomates',
        stomataSensitivityDesc:
            "Controle la rapidite avec laquelle la plante ferme ses stomates en conditions de VPD eleve pour conserver l'eau. Une valeur plus elevee signifie une meilleure tolerance a la secheresse.",
        altitudeM: 'Altitude de culture',
        altitudeMDesc:
            "Applique une correction barometrique du VPD basee sur l'elevation de votre salle de culture au-dessus du niveau de la mer.",
        growTech2026: 'Technologies de culture 2026', // machine-translated, review needed
        dynamicLighting: 'Eclairage dynamique',
        dynamicLightingDesc:
            "Active l'eclairage adaptatif au spectre qui ajuste automatiquement la sortie LED (bleu pour veg, rouge pour floraison) selon la phase de croissance et le VPD.",
        enableAeroponics: 'Mode aeroponique',
        enableAeroponicsDesc:
            "Active les parametres de simulation specifiques a l'aeroponique : absorption plus rapide, modele de consommation d'eau reduite et timings de brumisation.",
        co2Enrichment: "Simulation d'enrichissement CO2",
        co2EnrichmentDesc:
            'Active les effets CO2 dans le moteur de simulation. Definissez la ppm cible pour les calculs de rendement.',
        co2TargetPpm: 'Cible CO2 (ppm)',
        smartFertigationAlerts: 'Alertes de fertirrigation intelligentes',
        smartFertigationAlertsDesc:
            'Recevez des alertes automatisees lorsque le pH ou la CE sort des plages optimales.',
    },
    notifications: {
        title: 'Notifications',
        enableAll: 'Activer toutes les notifications',
        enableAllDesc:
            'Interrupteur principal pour les alertes du navigateur et du service worker.',
        stageChange: "Changement d'etape",
        problemDetected: 'Probleme detecte',
        harvestReady: 'Recolte prete',
        newTask: 'Nouvelle tache',
        lowWaterWarning: "Avertissement niveau d'eau bas",
        phDriftWarning: 'Avertissement derive du pH',
        quietHours: 'Heures calmes',
        enableQuietHours: 'Activer les heures calmes',
        quietHoursDesc: 'Les notifications seront mises en sourdine pendant cette periode.',
        quietHoursStart: 'Debut des heures calmes',
        quietHoursEnd: 'Fin des heures calmes',
    },
    defaults: {
        title: 'Valeurs par defaut',
        growSetup: 'Configuration de culture par defaut',
        export: "Format d'export par defaut",
        journalNotesTitle: 'Notes de journal par defaut',
        wateringNoteLabel: "Note pour l'arrosage",
        feedingNoteLabel: "Note pour l'alimentation",
    },
    data: {
        title: 'Gestion des donnees',
        storageInsights: 'Apercu du stockage',
        dbStore: {
            title: 'Details du stockage IndexedDB',
            loading: 'Chargement des donnees...',
            empty: 'Informations de stockage indisponibles.',
        },
        backupAndRestore: 'Sauvegarde & Restauration',
        dangerZone: 'Zone de danger',
        importData: 'Importer des donnees',
        importDataDesc:
            "Restaurer une sauvegarde de l'application a partir d'un fichier JSON. Cela ecrasera toutes les donnees actuelles.",
        importConfirmTitle: "Confirmer l'importation",
        importConfirmText:
            'Etes-vous sur ? Toutes vos donnees actuelles seront remplacees par le contenu du fichier selectionne. Cette action est irreversible.',
        importConfirmButton: 'Importer & Ecraser',
        importSuccess: "Donnees importees avec succes. L'application va maintenant se recharger.",
        importError:
            "L'importation a echoue. Veuillez vous assurer qu'il s'agit d'un fichier de sauvegarde valide.",
        growExportTitle: 'Sauvegarde par Culture',
        growExportDesc: 'Exporter "{{name}}" avec {{count}} plantes en fichier JSON portable.',
        exportGrow: 'Exporter cette Culture',
        importGrow: 'Importer une Culture',
        growImportDesc: 'Importer un fichier de culture exporte precedemment (format v2.0).',
        growImportSuccess: 'Culture "{{name}}" importee avec succes.',
        growImportError:
            "Importation echouee. Veuillez verifier qu'il s'agit d'un fichier d'exportation de culture valide (v2.0).",
        totalUsage: 'Utilisation totale',
        lastBackup: 'Derniere sauvegarde',
        noBackup: 'Aucune sauvegarde creee',
        autoBackup: 'Sauvegarde automatique',
        persistenceTitle: 'Persistance & Instantanes',
        persistenceInterval: 'Cadence de sauvegarde',
        backupOptions: {
            off: 'Desactive',
            daily: 'Quotidien',
            weekly: 'Hebdomadaire',
        },
        persistenceOptions: {
            fast: 'Rapide (0.5s)',
            balanced: 'Equilibre (1.5s)',
            batterySaver: 'Economie de batterie (5s)',
        },
        localOnlyBadge: 'Local uniquement',
        localOnlyDesc:
            'Toutes vos donnees restent sur cet appareil. Aucun compte necessaire -- jamais. Activez eventuellement la synchronisation cloud en un clic ci-dessous pour sauvegarder via un Gist GitHub anonyme.',
        sync: {
            title: 'Synchronisation cloud en un clic',
            description:
                "Sauvegardez et restaurez l'integralite de l'etat de votre application via un Gist GitHub anonyme. Aucun compte ni inscription requis.",
            pushButton: 'Envoyer vers le cloud',
            pullButton: 'Recuperer depuis le cloud',
            pushSuccess: 'Toutes les donnees synchronisees vers le Gist avec succes.',
            pullSuccess: "Donnees restaurees depuis le Gist. L'application va se recharger.",
            pushFailed: 'La synchronisation a echoue (HTTP {{status}}).',
            pullFailed: 'La recuperation a echoue (HTTP {{status}}).',
            noSyncFile: 'Aucune donnee de synchronisation CannaGuide trouvee dans ce Gist.',
            invalidPayload:
                'Les donnees du Gist sont corrompues ou ne constituent pas une sauvegarde CannaGuide valide.',
            invalidGistUrl: 'URL ou ID de Gist invalide.',
            lastSynced: 'Derniere synchronisation',
            never: 'Jamais',
            gistIdLabel: 'ID du Gist',
            gistIdPlaceholder: "Collez l'URL ou l'ID du Gist pour restaurer",
            enableSync: 'Activer la synchronisation cloud',
            disableSync: 'Desactiver la synchronisation cloud',
            enabled: 'Active',
            disabled: 'Desactive',
            confirmPull:
                'Cela ecrasera TOUTES les donnees actuelles avec la sauvegarde du Gist. Continuer ?',
            confirmPullTitle: 'Restaurer depuis le cloud ?',
            syncing: 'Synchronisation...',
            connected: 'Connecte au Gist',
            blockedByLocalOnly:
                'La synchronisation cloud est desactivee tant que le mode Local uniquement est actif. Desactivez le mode Local uniquement dans Confidentialite & Securite pour utiliser la synchronisation cloud.',
            gistSecurityWarning:
                "Vos donnees sont dans un Gist GitHub non liste. Bien que chiffrees, l'URL du Gist est accessible publiquement si elle est connue. Activez E2EE ci-dessous pour la protection.", // machine-translated, review needed
            encryptionKeyRequired:
                'Cette sauvegarde est chiffree. Veuillez fournir la cle de chiffrement pour la restaurer.',
            e2ee: {
                title: 'Chiffrement de bout en bout',
                description:
                    "Chiffrez votre sauvegarde avant l'envoi. Sans la cle, vos donnees Gist sont illisibles -- meme pour GitHub.",
                active: 'E2EE actif -- les sauvegardes sont chiffrees',
                generateKey: 'Generer une cle de chiffrement',
                keyGenerated:
                    "Cle de chiffrement generee. Conservez-la en securite -- vous en aurez besoin pour restaurer les sauvegardes sur d'autres appareils.",
                showKey: 'Afficher la cle',
                hideKey: 'Masquer la cle',
                copyKey: 'Copier la cle',
                keyCopied: 'Cle de chiffrement copiee dans le presse-papiers.',
            },
            conflictTitle: 'Conflit de synchronisation detecte',
            conflictDescription:
                'Vos donnees locales et la version cloud ont des modifications divergentes. Choisissez comment resoudre :',
            localChanges: 'Local uniquement',
            remoteChanges: 'Distant uniquement',
            conflictingItems: 'En conflit',
            merge: 'Fusion intelligente',
            keepLocal: 'Garder local',
            useCloud: 'Utiliser le cloud',
            viewDetails: 'Voir les details',
            pendingSync: 'Synchronisation en attente -- nouvelle tentative des la connexion...',
            synced: 'Synchronise a {{time}}',
            syncError: 'Echec de la synchronisation',
            statusIdle: 'Non synchronise',
            keepLocalConfirm:
                'Ceci supprimera toutes les modifications distantes et enverra votre etat local vers le cloud. Cette action est irreversible.',
            useCloudConfirm:
                'Ceci supprimera toutes les modifications locales et remplacera vos donnees par la version cloud. Cette action est irreversible.',
            migrating:
                'Migration de l ancien format de synchronisation -- l application va se recharger...',
        },
        replayOnboarding: 'Revoir le tutoriel',
        replayOnboardingConfirm:
            "Cela affichera le tutoriel de bienvenue au prochain demarrage de l'application. Continuer ?",
        replayOnboardingSuccess: 'Le tutoriel sera affiche au prochain demarrage.',
        resetPlants: 'Reinitialiser les plantes',
        resetPlantsConfirm:
            'Etes-vous sur de vouloir supprimer toutes vos plantes actuelles ? Cette action est irreversible.',
        resetPlantsSuccess: 'Toutes les plantes ont ete reinitialisees.',
        resetAll: 'Reinitialiser toutes les donnees',
        resetAllConfirm:
            'ATTENTION : Cela supprimera definitivement toutes vos plantes, parametres, favoris et varietes personnalisees. Etes-vous absolument sur ?',
        resetAllConfirmInput: "Pour confirmer, veuillez taper '{{phrase}}'.",
        resetAllConfirmPhrase: 'supprimer toutes les donnees',
        resetAllSuccess:
            "Toutes les donnees de l'application ont ete reinitialisees. L'application va se recharger.",
        exportAll: 'Exporter toutes les donnees',
        exportAsJson: 'Exporter en JSON',
        exportAsXml: 'Exporter en XML',
        exportConfirm:
            'Etes-vous sur de vouloir exporter toutes les donnees de votre application comme sauvegarde ?',
        exportSuccess: 'Toutes les donnees exportees avec succes !',
        exportError: "L'exportation a echoue.",
        clearArchives: 'Effacer les archives IA',
        clearArchivesDesc:
            'Supprime toutes les reponses sauvegardees du Mentor et du Conseiller IA.',
        clearArchivesConfirm:
            'Etes-vous sur de vouloir supprimer toutes vos reponses IA sauvegardees ?',
        clearArchivesSuccess: 'Toutes les archives IA ont ete effacees.',
        runCleanup: 'Lancer le nettoyage du stockage maintenant',
        runCleanupDesc:
            "Archive automatiquement les anciens journaux de culture et supprime les anciennes photos pour liberer de l'espace.",
        cleanupRunning: 'Nettoyage du stockage...',
        cleanupSuccess:
            'Nettoyage du stockage termine. {{count}} anciennes photos supprimees et anciens journaux archives.',
        cleanupError: 'Le nettoyage du stockage a echoue. Veuillez reessayer.',
        storageWarningTitle: 'Le stockage se remplit.',
        storageWarningBody:
            "Envisagez de lancer un nettoyage bientot pour eviter les echecs d'enregistrement.",
        storageCriticalTitle: 'Stockage critiquement plein.',
        storageCriticalBody:
            "Lancez un nettoyage maintenant pour reduire le risque d'erreurs de quota IndexedDB.",
        storageCalculating: 'Calcul du stockage...',
        storageUnavailable: 'Informations de stockage indisponibles.',
        storageUsage: 'Utilisation du stockage',
        storageBreakdown: {
            plants: 'Donnees des plantes & Journaux',
            images: 'Photos sauvegardees',
            archives: 'Archives IA',
            customStrains: 'Varietes personnalisees',
            savedItems: 'Elements sauvegardes',
        },
        sliceReset: {
            title: 'Reinitialiser des sections individuelles',
            desc: 'Reinitialiser une seule section de donnees a ses valeurs par defaut sans affecter les autres donnees.',
            confirmTitle: 'Reinitialiser "{{slice}}" ?',
            confirmText:
                'Cela supprimera definitivement toutes les donnees de la section "{{slice}}" et rechargera l\'application. Cette action est irreversible.',
            confirmButton: 'Reinitialiser & Recharger',
            slices: {
                simulation: 'Plantes & Simulation',
                genealogy: 'Cache de genealogie',
                sandbox: 'Experiences sandbox',
                favorites: 'Favoris',
                notes: 'Notes sur les varietes',
                archives: 'Archives IA',
                savedItems: 'Elements sauvegardes',
                knowledge: 'Progression des connaissances',
                breeding: 'Donnees de croisement',
                userStrains: 'Varietes personnalisees',
            },
        },
        gdprTitle: 'Confidentialite (GDPR/DSGVO)',
        gdprExport: 'Exporter toutes les donnees personnelles',
        gdprExportDesc: 'Telecharger une copie complete de toutes les donnees (Art. 20 GDPR).',
        gdprErase: 'Effacer toutes les donnees',
        gdprEraseDesc:
            'Supprimer definitivement TOUTES les donnees de cet appareil (Art. 17 GDPR). Cette action est irreversible.',
        gdprEraseWarning:
            'Cela supprimera definitivement TOUTES les bases de donnees, le stockage local, les caches et les service workers. Tapez DELETE ALL pour confirmer.',
        gdprEraseConfirmPlaceholder: 'DELETE ALL',
        gdprSelectiveTitle: 'Suppression Selective de Bases de Donnees',
        gdprSelectiveDesc:
            'Supprimer des bases de donnees individuelles au lieu de toutes les donnees en une fois (Art. 17 GDPR suppression partielle).',
        gdprSelectiveDelete: 'Supprimer',
        gdprSelectiveConfirm:
            'Etes-vous sur de vouloir supprimer la base de donnees "{{name}}" ? Cette action est irreversible.',
        gdprSelectiveSuccess: 'Base de donnees "{{name}}" supprimee avec succes.',
        gdprSelectiveError: 'Echec de la suppression de la base de donnees "{{name}}".',
    },
    privacy: {
        title: 'Confidentialite & Securite',
        localOnlyMode: 'Mode local uniquement',
        localOnlyModeDesc:
            "Bloque TOUT le trafic reseau sortant : suivi d'erreurs Sentry, requetes IA cloud et synchronisation Gist. Seuls l'inference IA locale et le stockage local sont autorises.",
        localOnlyModeActive:
            'Le mode local uniquement est actif. Toutes les requetes reseau externes sont bloquees. Desactivez cette option pour restaurer les fonctionnalites cloud.',
        requirePin: 'Exiger un PIN au demarrage',
        requirePinDesc: 'Protegez votre application avec un PIN a 4 chiffres.',
        setPin: 'Definir/Modifier le PIN',
        setPinDesc:
            'Enregistrer un PIN de deverrouillage local a 4 chiffres pour la protection au demarrage.',
        pinPlaceholder: 'Entrez 4 chiffres',
        savePin: 'Enregistrer le PIN',
        clearPin: 'Supprimer le PIN',
        clearAiHistory: "Effacer l'historique IA a la fermeture",
        clearAiHistoryDesc:
            "Efface automatiquement tous les historiques de chat IA lorsque l'application est fermee.",
        unlockTitle: 'Deverrouiller CannaGuide',
        unlockDesc: 'Entrez votre PIN a 4 chiffres pour continuer.',
        unlockFailed: 'PIN incorrect. Reessayez.',
        unlockButton: 'Deverrouiller',
    },
    about: {
        title: "A propos de l'application",
        projectInfo: 'Infos du projet & README',
        version: 'Version',
        whatsNew: {
            title: 'Nouveautes de la v1.1',
            items: {
                simulation:
                    "Shell de simulation adapte au mobile : Transitions de vue plus rapides, meilleure resilience hors ligne et espacement inferieur plus propre dans toute l'application.",
                strains:
                    'Renforcement de la bibliotheque de varietes : Les champs de varietes herites manquants reviennent maintenant en securite au lieu de faire planter la page.',
                help: "Structure du centre d'aide : La FAQ et les guides visuels sont separes en sujets d'application et de culture pour une navigation plus rapide.",
                settings:
                    "Rafraichissement A propos & README : Informations de version mises a jour, portee actuelle de l'application et documentation du projet plus claire.",
            },
        },
        techStack: {
            title: 'Pile technologique',
            geminiLabel: 'Google Gemini:',
            gemini: 'Alimente toutes les fonctionnalites IA pour des diagnostics et conseils intelligents.',
            react: 'Pour une interface utilisateur moderne, performante et reactive.',
            indexedDb: 'Base de donnees client robuste pour une fonctionnalite 100% hors ligne.',
            webWorkersLabel: 'Web Workers:',
            webWorkers:
                "Execute les simulations complexes hors du thread principal pour garder l'interface fluide.",
        },
        credits: {
            title: 'Remerciements & Liens',
            phosphorLabel: 'Phosphor Icons:',
            phosphor: 'Icones fournies par Phosphor Icons.',
            dataProvidersLabel: 'Fournisseurs de Donnees:',
            strainProviders:
                'Enrichissement des varietes via Otreeba, Cannlytics, StrainAPI, CannSeek, OpenTHC, Cansativa et Kushy.', // machine-translated, review needed
            webLlmOnnxLabel: 'WebLLM / ONNX:',
            corsProxiesLabel: 'Proxies CORS:',
            corsProxies: 'Relais de proxy CORS par allorigins.win et corsproxy.io.',
            transformersJs:
                'NLP et embeddings sur appareil via Transformers.js (Xenova/Hugging Face).',
            webLlm: 'Inference LLM locale via WebLLM (MLC AI).',
            onnx: 'Runtime ML par ONNX Runtime Web et TensorFlow.js.',
            radixUi: 'Primitives UI accessibles par Radix UI.',
            recharts: 'Visualisations de graphiques par Recharts et D3.js.',
            tailwind: 'Style utilitaire par Tailwind CSS.',
            sentry: 'Suivi des erreurs par Sentry.',
            vite: 'Outils de build par Vite et TurboRepo.',
        },
        githubLinkText: 'Voir le projet sur GitHub',
        aiStudioLinkText: 'Forker le projet dans AI Studio',
        devJourney: {
            title: 'Parcours de developpement',
            subtitle:
                'Construit de maniere iterative avec le developpement assiste par IA en 4 phases :',
            phase1Title: 'Prototypage',
            phase1Desc:
                "Scaffolding de l'application et ensemble de fonctionnalites initial construits avec Google Gemini 2.5 Pro & 3.1 Pro dans Google AI Studio, puis exportes vers GitHub.",
            phase2Title: 'Evaluation & Conseil',
            phase2Desc:
                "Evaluation continue de l'architecture, conseil en securite et assurance qualite par xAI Grok 4.20 tout au long du processus de developpement.",
            phase3Title: 'Developpement principal',
            phase3Desc:
                'Iteration et raffinement principaux dans GitHub Codespaces avec VS Code Copilot propulse par Claude Opus 4.6 -- la majorite du developpement de fonctionnalites, du renforcement de la securite, des tests et du travail sur le pipeline CI/CD.',
            phase4Title: 'Deploiement & Distribution',
            phase4Desc:
                'Deploiement en production sur GitHub Pages, previews Netlify PR, conteneurs Docker, bureau Tauri et builds mobiles Capacitor.',
            secondaryNote: 'Contributions mineures par GPT-4 Mini et GPT-5.3 Codex.',
        },
        disclaimer: {
            title: 'Avertissement',
            content:
                'Toutes les informations de cette application sont fournies a des fins educatives et de divertissement uniquement. La culture du cannabis est soumise a des reglementations legales strictes. Veuillez vous informer sur les lois de votre region et agissez toujours de maniere responsable et conforme a la loi.',
        },
        readmeContent: {
            header: `
          <h1>CannaGuide 2025 (Francais)</h1>
          <p><strong>Le compagnon de culture de cannabis ultime propulse par l'IA</strong></p>
          <p>CannaGuide 2025 est votre copilote numerique ultime propulse par l'IA pour l'ensemble du cycle de vie de la culture du cannabis. Concu pour les enthousiastes debutants comme pour les cultivateurs experts, cette <strong>Progressive Web App (PWA)</strong> de pointe vous guide de la selection des graines a une recolte parfaitement sechee.</p>
        `,
            philosophyTitle: 'Philosophie du projet',
            philosophyContent: `
            <p>CannaGuide 2025 repose sur un ensemble de principes fondamentaux concus pour offrir une experience de premier ordre :</p>
            <blockquote><strong>Offline First</strong> : Votre jardin ne s'arrete pas quand votre internet s'arrete. L'application est concue pour etre <strong>100% fonctionnelle hors ligne</strong>.</blockquote>
            <blockquote><strong>Performance is Key</strong> : Une interface fluide et reactive est non negociable. Les calculs lourds, comme la simulation multi-plantes complexe, sont delegues a un <strong>Web Worker</strong> dedie.</blockquote>
            <blockquote><strong>Data Sovereignty</strong> : Vos donnees sont les votres, point final. La possibilite d'<strong>exporter et importer l'integralite de l'etat de votre application</strong> vous donne un controle total.</blockquote>
            <blockquote><strong>AI as a Co-pilot</strong> : Nous utilisons l'API Google Gemini non comme un gadget, mais comme un outil puissant pour fournir des <strong>informations exploitables et contextuelles</strong>.</blockquote>
        `,
            featuresTitle: 'Fonctionnalites principales',
            featuresContent: `
            <h4>1. La salle de culture (Vue <code>Plants</code>)</h4>
            <ul>
                <li><strong>Moteur de simulation avance</strong> : Decouvrez une simulation de pointe basee sur le <strong>VPD (Vapor Pressure Deficit)</strong>.</li>
                <li><strong>Diagnostics propulses par l'IA</strong> : Telechargez une photo de votre plante pour obtenir un diagnostic instantane base sur l'IA.</li>
                <li><strong>Journalisation complete</strong> : Suivez chaque action dans un journal detaille et filtrable pour chaque plante.</li>
            </ul>
            <h4>2. L'encyclopedie des varietes (Vue <code>Strains</code>)</h4>
            <ul>
                <li><strong>Vaste bibliotheque</strong> : Accedez a des informations detaillees sur <strong>plus de 700 varietes de cannabis</strong>.</li>
                <li><strong>Arbre genealogique interactif</strong> : Visualisez la lignee genetique complete de n'importe quelle variete.</li>
                <li><strong>Conseils de culture IA</strong> : Generez des conseils de culture uniques propulses par l'IA pour n'importe quelle variete.</li>
            </ul>
            <h4>3. L'atelier (Vue <code>Equipment</code>)</h4>
            <ul>
                <li><strong>Configurateur de setup IA avance</strong> : Recevez une liste d'equipements complete et specifique par marque generee par Gemini AI.</li>
                <li><strong>Suite de calculatrices</strong> : Accedez a un ensemble complet d'outils de precision.</li>
            </ul>
            <h4>4. La bibliotheque (Vue <code>Knowledge</code>)</h4>
            <ul>
                <li><strong>Mentor IA contextuel</strong> : Posez vos questions de culture au Mentor IA, qui exploite les donnees de votre plante active pour des conseils personnalises.</li>
                <li><strong>Laboratoire de croisement</strong> : Croisez vos graines de haute qualite collectees pour creer de nouvelles <strong>varietes hybrides permanentes</strong>.</li>
                <li><strong>Sandbox interactif</strong> : Executez des scenarios "et si" sans risquer vos vraies plantes.</li>
            </ul>
            <h4>5. Le centre d'aide (Vue <code>Help</code>)</h4>
            <ul>
                <li>Manuel utilisateur complet, FAQ consultable, Lexique du cultivateur et Guides visuels.</li>
            </ul>
            <h4>6. Le centre de commande (Vue <code>Settings</code>)</h4>
            <ul>
                <li>Personnalisez les themes, tailles de police, options d'accessibilite, et bien plus encore.</li>
            </ul>
        `,
            techTitle: 'Approfondissement technique',
            techContent: `
            <h4>Technologies cles</h4>
            <ul>
                <li><strong>Frontend</strong> : React 19 avec TypeScript</li>
                <li><strong>Gestion d'etat</strong> : Redux Toolkit</li>
                <li><strong>Integration IA</strong> : Google Gemini API (<code>@google/genai</code>)</li>
                <li><strong>Operations asynchrones</strong> : RTK Query</li>
                <li><strong>Concurrence</strong> : Web Workers</li>
                <li><strong>Persistance des donnees</strong> : IndexedDB</li>
                <li><strong>PWA & Hors ligne</strong> : Service Workers</li>
                <li><strong>Style</strong> : Tailwind CSS</li>
            </ul>
            <h4>Abstraction du service Gemini (<code>geminiService.ts</code>)</h4>
            <p>Comme indique dans le <a href="https://deepwiki.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer">DeepWiki du projet</a>, le fichier <code>geminiService.ts</code> est un composant essentiel qui sert de couche d'abstraction centrale pour toute communication avec l'API Google Gemini. Cette conception decouple la logique API des composants UI et de la couche de gestion d'etat Redux (RTK Query), rendant le code plus propre, plus maintenable et plus facile a tester.</p>
            <p><strong>Responsabilites et methodes cles :</strong></p>
            <ul>
                <li><strong>Initialisation & Contexte</strong> : Le service initialise une seule instance <code>GoogleGenAI</code> et formate automatiquement les donnees de plantes en temps reel et les instructions de langue pour chaque prompt.</li>
                <li><strong>Sortie JSON structuree</strong> : Pour des fonctionnalites comme <code>getEquipmentRecommendation</code> et <code>diagnosePlant</code>, le service exploite le mode JSON de Gemini avec un <code>responseSchema</code> pour garantir des objets JSON valides et typage-sur.</li>
                <li><strong>Entree multimodale (Vision)</strong> : La methode <code>diagnosePlant</code> combine une image encodee en Base64 avec du texte dans une requete multipart, permettant au modele <code>gemini-2.5-flash</code> d'analyser a la fois les donnees visuelles et textuelles.</li>
                <li><strong>Generation d'images</strong> : La methode <code>generateStrainImage</code> utilise le modele specialise <code>gemini-2.5-flash-image</code> pour creer des images uniques et artistiques pour la fonctionnalite AI Grow Tips.</li>
                <li><strong>Selection de modele & Gestion d'erreurs</strong> : Le service selectionne intelligemment entre <code>gemini-2.5-flash</code> et le plus puissant <code>gemini-2.5-pro</code>. Chaque methode inclut des blocs <code>try...catch</code> robustes qui fournissent des messages d'erreur conviviaux a l'interface.</li>
            </ul>
        `,
            devTitle: 'Developpement local (Guide du developpeur)',
            devContent: `
            <h4>Prerequis</h4>
            <ul>
                <li>Node.js (v18.x ou ulterieur)</li>
                <li>npm</li>
                <li>Une cle API Google Gemini</li>
            </ul>
            <h4>Installation & Configuration</h4>
            <ol>
                <li>Cloner le depot : <code>git clone https://github.com/qnbs/CannaGuide-2025.git</code></li>
                <li>Installer les dependances : <code>pnpm install</code></li>
            <li>Lancer le serveur de developpement : <code>pnpm dev</code></li>
            <li>Ouvrir Parametres -> General & Interface -> Securite IA (Multi-Model BYOK) et enregistrer votre cle API dans l'application.</li>
            </ol>
        `,
            troubleshootingTitle: 'Depannage',
            troubleshootingContent: `
            <ul>
            <li><strong>Les fonctionnalites IA ne fonctionnent pas</strong> : Ouvrez Parametres -> General & Interface -> Securite IA (Multi-Model BYOK), validez votre cle et assurez-vous qu'une cle est stockee sur cet appareil.</li>
                <li><strong>L'application ne se met pas a jour (Cache PWA)</strong> : Si vous avez fait des modifications mais ne les voyez pas, effacez les donnees du navigateur ou desenregistrez le Service Worker dans les outils de developpement.</li>
            </ul>
        `,
            aiStudioTitle: 'Parcours de developpement & Open Source',
            aiStudioContent: `
            <p>CannaGuide 2025 a ete construit grace a un processus de developpement assiste par IA transparent et iteratif :</p>
            <ol>
                <li><strong>Prototypage</strong> : Scaffolding initial de l'application et ensemble de fonctionnalites construit avec <strong>Google Gemini 2.5 Pro & 3.1 Pro</strong> dans <strong>Google AI Studio</strong>, puis exporte vers GitHub.</li>
                <li><strong>Evaluation & Conseil</strong> : Revue continue de l'architecture, conseil en securite et assurance qualite par <strong>xAI Grok 4.20</strong> tout au long du processus.</li>
                <li><strong>Developpement principal</strong> : Iteration principale dans <strong>GitHub Codespaces</strong> avec <strong>VS Code Copilot propulse par Claude Opus 4.6</strong> -- la majorite du raffinement des fonctionnalites, du renforcement de la securite, des 643+ tests, du CI/CD et de la pile IA locale.</li>
                <li><strong>Deploiement</strong> : Production via GitHub Pages, Netlify, Docker, Tauri v2 et Capacitor.</li>
            </ol>
            <p><em>Contributions mineures par GPT-4 Mini et GPT-5.3 Codex.</em></p>
            <p>Ce projet est entierement open source. Plongez dans le code, forkez le projet ou contribuez sur GitHub.</p>
            <ul>
                <li><a href="https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-" target="_blank" rel="noopener noreferrer">Forker le projet dans AI Studio</a></li>
                <li><a href="https://github.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer">Voir le code source sur GitHub</a></li>
                <li><a href="https://deepwiki.com/qnbs/CannaGuide-2025/" target="_blank" rel="noopener noreferrer">Voir la documentation du projet sur DeepWiki</a></li>
            </ul>
        `,
            contributingTitle: 'Contribuer',
            contributingContent: `
            <p>Nous accueillons les contributions de la communaute ! Que vous souhaitiez corriger un bug, ajouter une nouvelle fonctionnalite ou ameliorer les traductions, votre aide est appreciee.</p>
            <ol>
                <li><strong>Signaler des problemes</strong> : Si vous trouvez un bug ou avez une idee, veuillez d'abord ouvrir une issue sur GitHub pour en discuter.</li>
                <li><strong>Apporter des modifications</strong> : Forkez le depot, creez une nouvelle branche, committez vos modifications et creez une nouvelle Pull Request.</li>
            </ol>
        `,
            disclaimerTitle: 'Avertissement',
            disclaimerContent: `<p>Toutes les informations de cette application sont fournies a des fins educatives et de divertissement uniquement. La culture du cannabis est soumise a des reglementations legales strictes. Veuillez vous informer sur les lois de votre region et agissez toujours de maniere responsable et conforme a la loi.</p>`,
        },
    },
    communityShare: {
        title: 'Partages communautaires de varietes',
        description: 'Partage anonyme via GitHub Gist (alternative legere a IPFS).',
        exportButton: 'Exporter les varietes utilisateur vers un Gist anonyme',
        gistPlaceholder: "Collez l'URL ou l'ID du Gist",
        importButton: 'Importer des varietes depuis un Gist',
        exportSuccess: 'Gist anonyme cree.',
        exportError: "L'exportation Gist a echoue.",
        importSuccess_one: '1 variete importee.',
        importSuccess_other: '{{count}} varietes importees.',
        importError: "L'importation Gist a echoue.",
    },
    plugins: {
        title: 'Plugins',
        description:
            'Etendez CannaGuide avec des calendriers nutritifs, des integrations materielles et des profils de culture.',
        installed: 'Plugins installes',
        noPlugins: 'Aucun plugin installe.',
        install: 'Installer un plugin',
        uninstall: 'Desinstaller',
        enable: 'Activer',
        disable: 'Desactiver',
        importJson: 'Importer depuis JSON',
        exportJson: 'Exporter en JSON',
        invalidManifest: 'Manifeste de plugin invalide.',
        installSuccess: 'Plugin "{{name}}" installe avec succes.',
        uninstallSuccess: 'Plugin "{{name}}" desinstalle.',
        maxPluginsReached: 'Nombre maximum de plugins atteint.',
        categories: {
            'nutrient-schedule': 'Calendrier nutritif',
            hardware: 'Integration materielle',
            'grow-profile': 'Profil de culture',
        },
    },
    timeSeries: {
        title: 'Stockage des donnees de capteurs',
        description:
            'Les lectures de capteurs sont automatiquement compactees : les donnees brutes sont conservees pendant 24 heures, les moyennes horaires pendant 7 jours et les moyennes quotidiennes indefiniment.',
        entryCount: '{{count}} entrees de series temporelles stockees',
        compactionRun:
            'Compactage termine : {{hourly}} agregations horaires, {{daily}} quotidiennes.',
        clearDevice: "Effacer les donnees de l'appareil",
        clearConfirm:
            'Cela supprimera definitivement toutes les donnees de capteurs pour cet appareil.',
    },
    predictiveAnalytics: {
        title: 'Analyses predictives',
        description:
            "Predictions propulsees par l'IA basees sur les donnees historiques des capteurs.",
        botrytisRisk: 'Risque de Botrytis',
        environmentAlerts: 'Alertes environnementales',
        yieldImpact: 'Impact sur le rendement',
        noData: "Aucune donnee de capteur disponible pour l'analyse.",
        riskLevels: {
            low: 'Faible',
            moderate: 'Modere',
            high: 'Eleve',
            critical: 'Critique',
        },
    },
    pwa: {
        installBannerTitle: 'Installer CannaGuide',
        installBannerDesc:
            "Ajoutez CannaGuide a votre ecran d'accueil pour un acces hors ligne et une experience native.",
        installNow: 'Installer maintenant',
        later: 'Plus tard',
        dontShowAgain: 'Ne plus afficher',
        offlineNotice: 'Vous etes hors ligne -- certaines fonctionnalites peuvent etre limitees.',
        updateAvailable: 'Une nouvelle version est disponible!',
        updateNow: 'Mettre a jour',
        installed: 'App installee',
        notAvailable: 'Installation non disponible dans ce navigateur',
    },
    grows: {
        title: 'Gestion des cultures',
        subtitle: '{{count}} sur {{max}} cultures',
        createGrow: 'Nouvelle culture',
        editGrow: 'Modifier la culture',
        name: 'Nom',
        namePlaceholder: 'Ex. Interieur Hiver 2025',
        description: 'Description',
        descriptionPlaceholder: 'Notes optionnelles sur cette culture',
        color: 'Couleur',
        activate: 'Activer',
        active: 'Actif',
        archive: 'Archiver',
        delete: 'Supprimer',
        confirmDelete: 'Confirmer la suppression',
        archived: 'Cultures archivees',
        limitReached: 'Maximum de {{max}} cultures atteint (limite CanG allemande).',
        activeGrow: 'Culture active: {{name}}',
        plantCount_one: '{{count}} plante',
        plantCount_other: '{{count}} plantes',
        statsPlants_one: '{{count}} plante',
        statsPlants_other: '{{count}} plantes',
        statsJournal_one: '{{count}} entree',
        statsJournal_other: '{{count}} entrees',
        statsHealth: 'Sante: {{value}}%',
        statsAge: 'Plus ancienne: {{days}}j',
    },
}
