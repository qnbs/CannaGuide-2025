export const settingsView = {
    title: 'Instellingen',
    searchPlaceholder: 'Instellingen zoeken...',
    saveSuccess: 'Instellingen opgeslagen!',
    categories: {
        general: 'Algemeen & UI',
        strains: 'Rassen weergave',
        plants: 'Planten & Simulatie',
        notifications: 'Meldingen',
        defaults: 'Standaardwaarden',
        data: 'Gegevensbeheer',
        about: 'Over',
        tts: 'Spraak & Stem',
        privacy: 'Privacy & Beveiliging',
        accessibility: 'Toegankelijkheid',
        lookAndFeel: 'Uiterlijk',
        interactivity: 'Interactiviteit',
        ai: 'AI-configuratie',
        iot: 'Hardware & IoT', // machine-translated, review needed
    },
    security: {
        title: 'AI-beveiliging (Multi-Model BYOK)',
        warning:
            'Je API-sleutel wordt alleen op dit apparaat opgeslagen in IndexedDB. Deel je sleutel nooit en verwijder deze op gedeelde apparaten.',
        geminiFreeNote:
            'Tip: De Gemini API-sleutel van Google AI Studio is gratis met een Google-account op aistudio.google.com.', // machine-translated, review needed
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
        maskedPrefix: 'Opgeslagen sleutel:',
        invalid: 'Voer een geldige API-sleutel in.',
        saved: 'API-sleutel succesvol opgeslagen.',
        testSuccessStored: 'Opgeslagen API-sleutel is geldig en gereed voor alle AI-functies.',
        testSuccessUnsaved:
            'Ingevoerde API-sleutel is geldig. Sla deze op om alle AI-functies in te schakelen.',
        cleared: 'API-sleutel verwijderd.',
        loadError: 'Kon de status van de API-sleutel niet laden.',
        saveError: 'Kon de API-sleutel niet opslaan.',
        testError:
            'Validatie van de API-sleutel mislukt. Controleer de geldigheid en machtigingen.',
        clearError: 'Kon de API-sleutel niet verwijderen.',
        usageToday:
            'Vandaag: {{requests}} verzoeken, ~{{tokens}} tokens geschat, {{remaining}} verzoeken resterend (per minuut).',
        rotationLabel: 'Sleutelrotatie',
        rotationToday: 'vandaag bijgewerkt',
        rotationAge: '{{days}} dagen geleden bijgewerkt',
        rotationUnknown: 'rotatiedatum onbekend',
        rotationAdvice:
            'Roteer opgeslagen sleutels regelmatig en verwijder ze onmiddellijk na gebruik op gedeelde apparaten.',
        rotationDue:
            'Deze sleutel is voorbij het 90-dagen rotatievenster en moet worden vervangen voordat AI-verzoeken weer werken.',
        rotationBadge: 'Nu roteren',
        auditLog: 'Lokaal AI-auditlogboek',
        auditLogEmpty: 'Er zijn nog geen AI-verzoeken geregistreerd.',
        clearAuditLog: 'Auditlogboek wissen',
        panicButton: 'Noodwissing sleutels', // machine-translated, review needed
        panicButtonDesc:
            'Verwijder onmiddellijk ALLE opgeslagen API-sleutels en de versleutelingssleutel van dit apparaat. Dit kan niet ongedaan worden gemaakt.',
        panicButtonConfirm: 'Alle sleutels wissen',
        panicButtonSuccess: 'Alle API-sleutels en versleutelingssleutel zijn verwijderd.',
        encryptionNotice: 'Transparantie van versleuteling',
        encryptionNoticeDesc:
            'API-sleutels worden versleuteld met AES-256-GCM met een niet-exporteerbare sleutel in IndexedDB. Beschermt tegen toevallig browsen en basis XSS-aanvallen.',
        providerConsent: 'Toestemming gegevensoverdracht',
        providerConsentPrompt:
            'U staat op het punt plantengegevens (inclusief fotos) te sturen naar {{provider}}. Stemt u in?',
        providerConsentRemember: 'Mijn keuze onthouden voor deze provider',
        providerDpaLink: 'Gegevensverwerkingsovereenkomst bekijken',
    },
    aiMode: {
        title: 'AI-uitvoeringsmodus',
        description:
            'Kies hoe de app AI-verzoeken verwerkt. Cloudmodus gebruikt je API-sleutel voor de beste kwaliteit, Lokale modus draait alles op je apparaat voor maximale privacy, en Hybride modus kiest automatisch de beste optie.',
        label: 'AI-modus',
        cloud: 'Cloud',
        cloudDesc:
            'Alle AI-verzoeken worden naar de cloudprovider gestuurd (Gemini, OpenAI, etc.). Beste kwaliteit, vereist een API-sleutel en internetverbinding.',
        local: 'Lokaal',
        localDesc:
            'Alle AI draait op je apparaat met lokale modellen. Er verlaten geen gegevens het apparaat. Werkt volledig offline zodra modellen zijn voorgeladen.',
        hybrid: 'Hybride (Slim)',
        hybridDesc:
            'Gebruikt automatisch lokale modellen wanneer voorgeladen, anders terugval naar de cloud. Het beste van beide werelden.',
        eco: 'Eco',
        ecoDesc:
            'Batterijbesparende modus voor low-end of mobiele apparaten. Gebruikt alleen het kleine 0.5B-tekstmodel en regelgebaseerde heuristieken. Geen cloud, geen zware modellen.',
        ecoAutoDetected:
            'Eco-modus is automatisch geactiveerd omdat je apparaat weinig geheugen of batterij heeft.',
        activeIndicator: 'Actieve modus: {{mode}}',
        localNotReady:
            'Lokale AI-modellen zijn nog niet voorgeladen. Laad ze hieronder voor de beste lokale ervaring.',
        localReady: 'Lokale AI-modellen zijn geladen en gereed voor inferentie.',
        switchingToLocal:
            'Overschakelen naar lokale modus -- modellen worden automatisch voorgeladen.',
        imageGenCloudOnly:
            'Let op: Beeldgeneratie is alleen beschikbaar in Cloud- of Hybride modus.',
    },
    offlineAi: {
        title: 'Lokale AI Offline Cache',
        description:
            'Laad de lokale tekst- en visiemodellen voor terwijl je online bent, zodat diagnoses nog steeds werken wanneer het netwerk niet beschikbaar is.',
        preload: 'Offline modellen voorladen',
        preloading: 'Voorladen...',
        ready: 'Offline modellen zijn gereed.',
        partial: 'Sommige modelbestanden zijn gereed, maar de cache-opwarming is onvolledig.',
        error: 'Voorladen van modellen mislukt. Probeer het opnieuw met een stabiele verbinding.',
        idle: 'Er is nog geen offline model voorgeladen.',
        cacheState: 'Cachedetails: {{value}}',
        persistentStorage: 'Persistente opslag: {{value}}',
        webGpuSupported: 'WebGPU is beschikbaar op dit apparaat.',
        webGpuUnavailable:
            'WebGPU is niet beschikbaar, dus de app gebruikt de Transformer.js-terugval.',
        onnxBackend: 'ONNX-backend: {{value}}',
        webLlmReady: 'WebLLM is gereed als krachtige lokale runtime.',
        webLlmFallback: 'WebLLM is niet actief; lokale AI valt terug op Transformer.js.',
        readyAt: 'Laatste succesvolle voorlading: {{value}}',
        yes: 'toegekend',
        no: 'niet toegekend',
        unknown: 'onbekend',
        offlineHint:
            'Breng de app online om de modelcache op te warmen voordat je op offline AI vertrouwt.',
        forceWasm: 'WASM-backend forceren',
        forceWasmHint:
            'Overschrijf WebGPU-autodetectie en gebruik altijd de WASM-backend. Nuttig voor foutopsporing.',
        enableWebGpu: 'WebGPU-versnelling inschakelen', // machine-translated, review needed
        enableWebGpuHint:
            'Gebruik de GPU voor lokale AI-inferentie indien beschikbaar. Levert 3-8x snellere inferentie op ondersteunde apparaten. Schakel uit voor CPU-only modus.',
        webGpuTier: 'GPU-niveau: {{value}}',
        webGpuVram: 'GPU VRAM: {{value}} MB',
        webGpuVendor: 'GPU: {{value}}',
        webGpuBatteryGated:
            'WebGPU gepauzeerd -- batterij onder 15%. Sluit aan om GPU-versnelling opnieuw in te schakelen.',
        webGpuFeatureF16: 'shader-f16: {{value}}',
        webGpuDeviceCleanup:
            'GPU-geheugen wordt automatisch vrijgegeven wanneer het tabblad 30 seconden verborgen is.',
        preferredModel: 'Voorkeurstekstmodel',
        modelAuto: 'Automatisch (Qwen2.5-1.5B)',
        modelQwen25: 'Qwen2.5-1.5B (Gebalanceerd)',
        modelQwen3: 'Qwen2.5-0.5B (Lichtgewicht)',
        benchPreloadTime: 'Laatste voorlading: {{value}} s',
        benchInferenceSpeed: 'Inferentiesnelheid: {{value}} tok/s',
        benchNotAvailable: 'Voer een voorlading uit om prestatiegegevens te zien.',
        // LLM-modelselectie
        modelSelector: {
            title: 'LLM-modelselectie',
            subtitle: 'Kies welk lokaal AI-model wordt gebruikt voor tekstgeneratie.',
            autoLabel: 'Auto (Aanbevolen)',
            autoDesc: 'Selecteert automatisch het beste model voor je apparaat.',
            currentAuto: 'Jouw apparaat: {{model}}',
            recommended: 'Aanbevolen',
            downloadSize: '{{size}} MB download',
            largeDownload: 'Grote download',
            loading: 'Model laden...',
            'model_0.5B_desc': 'Ultralicht model voor elk apparaat. Snel maar beperkte kwaliteit.',
            'model_1.5B_desc':
                'Gebalanceerd model voor middenklasse GPUs. Goede meertalige ondersteuning.',
            model_3B_desc: 'Hoge kwaliteit redenering. Beste keuze voor krachtige GPUs.',
            model_4B_desc: 'Sterk redeneren en instructies volgen. Grootste optie.',
        },
        // Embedding & Semantic RAG
        embeddingModelReady: 'Embeddingmodel (MiniLM) is gereed voor semantisch zoeken.',
        embeddingModelMissing:
            'Embeddingmodel niet geladen. Semantische RAG gebruikt zoekwoord-terugval.',
        enableSemanticRag: 'Semantisch RAG zoeken',
        enableSemanticRagHint:
            'Gebruik vectorembeddings voor nauwkeurigere ophaling van kweeklogboekcontext in plaats van zoekwoordovereenkomst.',
        // NLP Models
        sentimentModelReady: 'Sentimentanalysemodel is gereed.',
        sentimentModelMissing: 'Sentimentmodel niet geladen.',
        summarizationModelReady: 'Samenvattingsmodel is gereed.',
        summarizationModelMissing: 'Samenvattingsmodel niet geladen.',
        zeroShotTextModelReady: 'Vraagclassificatiemodel is gereed.',
        zeroShotTextModelMissing: 'Vraagclassificatiemodel niet geladen.',
        enableSentiment: 'Dagboek sentimentanalyse',
        enableSentimentHint:
            'Analyseer de emotionele toon van dagboeknotities om de stemming van de kweker te volgen en patronen te detecteren.',
        enableSummarization: 'Tekstsamenvatting',
        enableSummarizationHint:
            'Vat lange kweeklogboeken en mentorchatgeschiedenissen samen tot beknopte samenvattingen.',
        enableQueryClassification: 'Slimme vraagroutering',
        enableQueryClassificationHint:
            'Categoriseer vragen automatisch om de relevantie van AI-antwoorden te verbeteren.',
        // Eco Mode
        ecoMode: 'Eco-modus',
        ecoModeHint:
            'Forceer WASM-backend en kleinste modellen om CPU/GPU-gebruik tot 70% te verminderen. Ideaal voor low-end apparaten of batterijbesparing.',
        // Persistent Cache
        enablePersistentCache: 'Persistente inferentiecache',
        enablePersistentCacheHint:
            'Sla AI-antwoorden op in IndexedDB zodat herhaalde vragen direct worden beantwoord, zelfs na het herladen van de app.',
        persistentCacheSize: 'Gecachte antwoorden: {{value}}',
        clearPersistentCache: 'Inferentiecache wissen',
        // Telemetry
        enableTelemetry: 'Lokale AI-telemetrie',
        enableTelemetryHint:
            'Volg inferentiesnelheid, tokendoorvoer en modelgebruik lokaal. Er verlaten geen gegevens het apparaat.',
        telemetryInferences: 'Totaal aantal inferenties: {{value}}',
        telemetryAvgLatency: 'Gem. latentie: {{value}} ms',
        telemetryAvgSpeed: 'Gem. snelheid: {{value}} tok/s',
        telemetryCacheHitRate: 'Cache-hitpercentage: {{value}}%',
        telemetrySuccessRate: 'Slagingspercentage: {{value}}%',
        telemetryPeakSpeed: 'Pieksnelheid: {{value}} tok/s',
        // Advanced
        inferenceTimeout: 'Inferentie-timeout',
        inferenceTimeoutHint: 'Maximale wachttijd in seconden voor een enkel lokaal AI-antwoord.',
        maxCacheSize: 'Max. cache-items',
        maxCacheSizeHint: 'Maximaal aantal gecachte inferentieresultaten opgeslagen in IndexedDB.',
        // Progressive Quantization
        quantizationLevel: 'Modelkwantisatie',
        quantizationLevelHint:
            "Regelt modelprecisie en -grootte. Automatisch selecteert de beste optie op basis van je GPU en geheugen. q4f16 gebruikt 4-bit float16 voor high-end GPU's, q4 gebruikt het lichtgewicht 0.5B-model voor brede compatibiliteit.",
        quantAuto: 'Automatisch (VRAM-gebaseerd)',
        quantQ4f16: 'q4f16 (Premium, 1.5B)',
        quantQ4: 'q4 (Standaard, 0.5B)',
        quantNone: 'Geen (Volledige precisie)',
        quantActiveProfile:
            'Actief profiel: {{sizeTier}} {{quantLevel}} -- ~{{savings}}% besparing',
        // Model Status Section
        modelStatusTitle: 'Modelstatusoverzicht',
        modelsLoaded: '{{loaded}} van {{total}} modellen gereed',
        // Health & Device
        healthStatus: 'AI-gezondheid: {{value}}',
        deviceClass: 'Apparaatklasse: {{value}}',
        // Language Detection
        langDetectionReady: 'Taaldetectiemodel is gereed.',
        langDetectionMissing: 'Taaldetectiemodel niet geladen.',
        // Image Similarity
        imgSimilarityReady: 'Beeldgelijkenis (CLIP-kenmerken) is gereed.',
        imgSimilarityMissing: 'Beeldgelijkenismodel niet geladen.',
        // Performance Alerts
        perfDegradedWarning:
            'Lokale AI draait traag ({{tokPerSec}} tok/s). Overweeg andere tabbladen te sluiten of over te schakelen naar een lichter model.',
        perfDegradedDowngrade:
            'Inferentiesnelheid is gedaald. Overschakelen naar een lichter model wordt aanbevolen.',
        perfDegradedCloseTabs:
            'Inferentiesnelheid is gedaald. Het sluiten van ongebruikte tabbladen kan GPU-geheugen vrijmaken.',
    },
    localAiDiag: {
        reasons: {
            active: 'WebLLM is actief en draait op GPU.',
            'insecure-context': 'WebGPU vereist een beveiligde context (HTTPS of localhost).',
            'no-webgpu-api': 'Deze browser ondersteunt geen WebGPU.',
            'no-gpu-adapter': 'Geen compatibele GPU-adapter gevonden.',
            'vram-insufficient': 'Niet genoeg GPU-geheugen (VRAM) voor het geselecteerde model.',
            'no-model-profile':
                'Geen modelprofiel komt overeen met de huidige apparaatmogelijkheden.',
            'force-wasm-override':
                'WebGPU uitgeschakeld -- WASM forceren is ingeschakeld in instellingen.',
            'browser-unsupported': 'Je browser ondersteunt de vereiste WebGPU-functies niet.',
            'adapter-request-timeout': 'GPU-adapterverzoek verlopen na 5 seconden.',
            'unknown-error': 'Er is een onverwachte fout opgetreden tijdens WebGPU-initialisatie.',
        },
    },
    general: {
        title: 'Algemene instellingen',
        language: 'Taal',
        theme: 'Thema',
        themes: {
            midnight: 'Middernacht',
            forest: 'Bos',
            purpleHaze: 'Paarse Nevel',
            desertSky: 'Woestijnlucht',
            roseQuartz: 'Rozenkwarts',
            rainbowKush: 'Rainbow Kush',
            ogKushGreen: 'OG Kush Green',
            runtzRainbow: 'Runtz Rainbow',
            lemonSkunk: 'Lemon Skunk',
        },
        fontSize: 'Lettergrootte',
        fontSizes: {
            sm: 'Klein',
            base: 'Normaal',
            lg: 'Groot',
        },
        defaultView: 'Standaardweergave bij opstarten',
        installApp: 'App installeren',
        installAppDesc:
            'Installeer CannaGuide 2025 op je apparaat voor een native app-ervaring, inclusief offline toegang.',
        uiDensity: 'UI-dichtheid',
        uiDensities: {
            comfortable: 'Comfortabel',
            compact: 'Compact',
        },
        dyslexiaFont: 'Dyslexievriendelijk lettertype',
        dyslexiaFontDesc:
            'Gebruikt het Atkinson Hyperlegible lettertype voor verbeterde leesbaarheid.',
        reducedMotion: 'Verminderde beweging',
        reducedMotionDesc:
            'Schakelt animaties en op beweging gebaseerde effecten uit of vermindert ze.',
        highContrastMode: 'Hoog contrast',
        highContrastModeDesc: 'Verhoogt contrast en randdefinitie voor kritieke UI-elementen.',
        colorblindMode: 'Kleurenblindmodus',
        colorblindModeDesc: 'Past app-kleuren aan voor verschillende typen kleurenzienstoornissen.',
        colorblindModes: {
            none: 'Geen',
            protanopia: 'Protanopie (Roodblind)',
            deuteranopia: 'Deuteranopie (Groenblind)',
            tritanopia: 'Tritanopie (Blauwblind)',
        },
    },
    languages: {
        en: 'Engels',
        de: 'Duits',
        es: 'Spaans',
        fr: 'Frans',
        nl: 'Nederlands',
    },
    tts: {
        title: 'Spraak & Stem',
        ttsOutput: 'Spraakuitvoer (Tekst-naar-spraak)',
        voiceControlInput: 'Spraakbesturing (Invoer)',
        ttsEnabled: 'Tekst-naar-spraak inschakelen',
        ttsEnabledDesc: 'Voegt knoppen toe om app-inhoud voor te laten lezen.',
        voice: 'Stem',
        noVoices: 'Geen stemmen beschikbaar voor de huidige taal.',
        rate: 'Spraaksnelheid',
        pitch: 'Toonhoogte',
        volume: 'Volume',
        highlightSpeakingText: 'Gesproken tekst markeren',
        highlightSpeakingTextDesc:
            'Markeert visueel het tekstblok dat momenteel wordt voorgelezen.',
        testVoice: 'Stem testen',
        testVoiceSentence: 'Dit is een test van de geselecteerde stem.',
        voiceControl: {
            enabled: 'Spraakbesturing inschakelen',
            enabledDesc: 'Bedien de app met eenvoudige spraakopdrachten.',
            hotwordEnabled: 'Altijd-aan wekwoord',
            hotwordEnabledDesc:
                'Houdt de microfoon gereed voor handsfree wekwoorden wanneer ondersteund door de browser.',
            confirmationSound: 'Bevestigingsgeluiden',
            confirmationSoundDesc:
                'Speelt een kort geluid af wanneer een spraakopdracht succesvol wordt herkend.',
        },
        commands: {
            title: 'Opdrachtenoverzicht',
            description:
                'Hier is een lijst met opdrachten die je kunt gebruiken wanneer spraakbesturing actief is. Begin simpelweg met "Ga naar..." of "Zoek naar...".',
            searchPlaceholder: 'Opdrachten zoeken...',
            groups: {
                navigation: 'Navigatie',
                strains: 'Rassen',
                plants: 'Planten',
            },
            goTo: 'Ga naar {{view}}',
            searchFor: 'Zoek naar [rasnaam]',
            resetFilters: 'Filters resetten',
            showFavorites: 'Favorieten tonen',
            waterAll: 'Alle planten water geven',
        },
        readThis: 'Dit gedeelte voorlezen',
        play: 'Afspelen',
        pause: 'Pauzeren',
        next: 'Volgende',
        stop: 'Stoppen',
    },
    strains: {
        title: 'Instellingen rassenweergave',
        defaultSort: 'Standaard sorteervolgorde',
        defaultViewMode: 'Standaard weergavemodus',
        strainsPerPage: 'Items per pagina',
        viewModes: {
            list: 'Lijst',
            grid: 'Raster',
        },
        visibleColumns: 'Zichtbare kolommen (Lijstweergave)',
        visibleColumnsDesc: 'Kies welke gegevenskolommen in de lijstweergave worden weergegeven.',
        columns: {
            type: 'Type',
            thc: 'THC',
            cbd: 'CBD',
            floweringTime: 'Bloeitijd',
        },
        sortKeys: {
            name: 'Naam',
            thc: 'THC',
            cbd: 'CBD',
            floweringTime: 'Bloeitijd',
            difficulty: 'Moeilijkheid',
            type: 'Type',
            yield: 'Opbrengst',
            height: 'Hoogte',
        },
        sortDirections: {
            asc: 'Oplopend',
            desc: 'Aflopend',
        },
        defaults: {
            title: 'Standaardwaarden & Gedrag',
            prioritizeTitle: 'Mijn rassen & favorieten prioriteren',
            prioritizeDesc: 'Toon je aangepaste en favoriete rassen altijd bovenaan de lijst.',
            sortDirection: 'Sorteerrichting',
        },
        listView: {
            title: 'Lijstweergave aanpassen',
            description: 'Pas de kolommen aan die in de lijstweergave worden weergegeven.',
        },
        advanced: {
            title: 'Geavanceerde functies',
            genealogyLayout: 'Standaard genealogie-indeling',
            genealogyDepth: 'Standaard genealogie begindiepte',
            aiTipsExperience: 'Standaard ervaringsniveau AI-tips',
            aiTipsFocus: 'Standaard focus AI-tips',
        },
    },
    plants: {
        title: 'Planten & Simulatie',
        realtimeEngine: 'Realtime-engine',
        behavior: 'Simulatiegedrag',
        calibration: 'Omgevingskalibratie',
        physics: 'Geavanceerde simulatiefysica (Expert)',
        showArchived: 'Voltooide kweekrondes tonen',
        showArchivedDesc: 'Toont voltooide/geoogste planten op het dashboard.',
        archivedHiddenTitle: 'Gearchiveerde kweekronde verborgen',
        archivedHiddenDesc:
            'Dit slot bevat een voltooide kweekronde die momenteel verborgen is voor een overzichtelijker live dashboard.',
        inspectArchived: 'Gearchiveerde kweekronde bekijken',
        autoGenerateTasks: 'Taken automatisch genereren',
        autoGenerateTasksDesc: 'Maakt automatisch taken aan voor acties zoals water geven.',
        realtimeSimulation: 'Realtime simulatie',
        realtimeSimulationDesc: 'De plantensimulatie blijft op de achtergrond draaien.',
        autoJournaling: 'Automatisch dagboek',
        logStageChanges: 'Fasewijzigingen loggen',
        logProblems: 'Problemen loggen',
        logTasks: 'Taken loggen',
        simulationProfile: 'Simulatieprofiel',
        simulationProfileDesc:
            'Past een gedocumenteerde responscurveset toe voor omgevingsstress, voedingsstofvolatiliteit, plaagdruk en naoogstprecisie, terwijl de tijdlijn strikt realtime blijft.',
        simulationProfiles: {
            beginner: 'Beginner',
            intermediate: 'Gevorderd',
            expert: 'Expert',
        },
        pestPressure: 'Plaagdruk',
        pestPressureDesc:
            'Voedt een niet-lineaire plaagdrukcurve. Lage waarden blijven vergevingsgezind; hoge waarden escaleren de uitbraakkans veel sneller.',
        nutrientSensitivity: 'Voedingsstofgevoeligheid',
        nutrientSensitivityDesc: 'Hoe sterk de plant reageert op voedingsstofonevenwichtigheden.',
        environmentalStability: 'Omgevingsstabiliteit',
        environmentalStabilityDesc:
            'Stuurt een deterministische instabiliteitscurve aan voor dagelijkse temperatuur- en vochtigheidsdrift. Lagere waarden versterken schommelingen scherp in plaats van lineair.',
        leafTemperatureOffset: 'Bladtemperatuurverschil (graden C)',
        leafTemperatureOffsetDesc:
            'Simuleert hoeveel koeler (negatief) of warmer (positief) de bladeren zijn dan de omgevingslucht. Heeft direct invloed op de VPD-berekening.',
        lightExtinctionCoefficient: 'Lichtpenetratie (k-waarde)',
        lightExtinctionCoefficientDesc:
            'Regelt hoe goed licht het bladerdak binnendringt. Een lagere waarde betekent betere penetratie. Beinvloedt fotosynthese van lagere bladeren.',
        nutrientConversionEfficiency: 'Voedingsstofconversie-efficientie',
        nutrientConversionEfficiencyDesc:
            'Hoe efficient de plant opgenomen voedingsstoffen omzet in biomassa. Een hogere waarde betekent meer groei bij dezelfde hoeveelheid voedingsstoffen.',
        stomataSensitivity: 'Huidmondjesgevoeligheid',
        stomataSensitivityDesc:
            'Regelt hoe snel de plant haar huidmondjes sluit bij hoge VPD-omstandigheden om water te besparen. Een hogere waarde betekent hogere droogtetolerantie.',
        altitudeM: 'Kweekhoogte',
        altitudeMDesc:
            'Past barometrische VPD-correctie toe op basis van de hoogte van je kweekruimte boven zeeniveau.',
        growTech2026: '2026 Kweeektechnologieen', // machine-translated, review needed
        dynamicLighting: 'Dynamische verlichting',
        dynamicLightingDesc:
            'Schakel spectrumadaptieve verlichting in die automatisch de LED-uitvoer aanpast (blauw voor veg, rood voor bloei) op basis van de groeifase en VPD.',
        enableAeroponics: 'Aeroponiemodus',
        enableAeroponicsDesc:
            'Activeert aeroponiespecifieke simulatieparameters: snellere nutrientopname, verminderd waterverbruiksmodel en mist-cyclustiming.',
        co2Enrichment: 'CO2-verrijkingssimulatie',
        co2EnrichmentDesc:
            'Schakelt CO2-verrijkingseffecten in de simulatie-engine in. Stel doel-ppm in voor opbrengstberekeningen.',
        co2TargetPpm: 'CO2-doel (ppm)',
        smartFertigationAlerts: 'Slimme fertigatiewaarschuwingen',
        smartFertigationAlertsDesc:
            'Ontvang geautomatiseerde waarschuwingen wanneer pH of EC buiten de optimale bereiken drifts op basis van realtime sensorgegevens.',
    },
    notifications: {
        title: 'Meldingen',
        enableAll: 'Alle meldingen inschakelen',
        enableAllDesc: 'Hoofdschakelaar voor browser- en service worker-kweekmeldingen.',
        stageChange: 'Fasewijziging',
        problemDetected: 'Probleem gedetecteerd',
        harvestReady: 'Oogstklaar',
        newTask: 'Nieuwe taak',
        lowWaterWarning: 'Laag water waarschuwing',
        phDriftWarning: 'pH-driftwaarschuwing',
        quietHours: 'Stille uren',
        enableQuietHours: 'Stille uren inschakelen',
        quietHoursDesc: 'Meldingen worden gedempt tijdens deze periode.',
        quietHoursStart: 'Begin stille uren',
        quietHoursEnd: 'Einde stille uren',
    },
    defaults: {
        title: 'Standaardwaarden',
        growSetup: 'Standaard kweekopstelling',
        export: 'Standaard exportformaat',
        journalNotesTitle: 'Standaard dagboeknotities',
        wateringNoteLabel: 'Notitie voor water geven',
        feedingNoteLabel: 'Notitie voor voeding',
    },
    data: {
        title: 'Gegevensbeheer',
        storageInsights: 'Opslaginzichten',
        dbStore: {
            title: 'IndexedDB-opslagdetails',
            loading: 'Opslaggegevens laden...',
            empty: 'Opslaginformatie niet beschikbaar.',
        },
        backupAndRestore: 'Back-up & Herstel',
        dangerZone: 'Gevarenzone',
        importData: 'Gegevens importeren',
        importDataDesc:
            'Herstel een app-back-up vanuit een JSON-bestand. Dit overschrijft alle huidige gegevens.',
        importConfirmTitle: 'Import bevestigen',
        importConfirmText:
            'Weet je het zeker? Al je huidige gegevens worden vervangen door de inhoud van het geselecteerde bestand. Deze actie kan niet ongedaan worden gemaakt.',
        importConfirmButton: 'Importeren & Overschrijven',
        importSuccess: 'Gegevens succesvol geimporteerd. De app wordt nu herladen.',
        importError: 'Import mislukt. Controleer of het een geldig back-upbestand is.',
        totalUsage: 'Totaal gebruik',
        lastBackup: 'Laatste back-up',
        noBackup: 'Nog geen back-up gemaakt',
        autoBackup: 'Automatische back-up',
        persistenceTitle: 'Persistentie & Snapshots',
        persistenceInterval: 'Opslagfrequentie',
        backupOptions: {
            off: 'Uit',
            daily: 'Dagelijks',
            weekly: 'Wekelijks',
        },
        persistenceOptions: {
            fast: 'Snel (0.5s)',
            balanced: 'Gebalanceerd (1.5s)',
            batterySaver: 'Batterijbesparing (5s)',
        },
        localOnlyBadge: 'Alleen lokaal',
        localOnlyDesc:
            'Al je gegevens staan op dit apparaat. Geen account nodig -- nooit. Schakel optioneel One-Tap Cloud Sync hieronder in om een back-up te maken via anonieme GitHub Gist.',
        sync: {
            title: 'One-Tap Cloud Sync',
            description:
                'Maak een back-up en herstel je volledige app-status via anonieme GitHub Gist. Geen account of registratie vereist.',
            pushButton: 'Naar cloud pushen',
            pullButton: 'Van cloud ophalen',
            pushSuccess: 'Alle gegevens succesvol gesynchroniseerd naar Gist.',
            pullSuccess: 'Gegevens hersteld vanuit Gist. De app wordt herladen.',
            pushFailed: 'Synchronisatie-push mislukt (HTTP {{status}}).',
            pullFailed: 'Synchronisatie-pull mislukt (HTTP {{status}}).',
            noSyncFile: 'Geen CannaGuide-synchronisatiegegevens gevonden in deze Gist.',
            invalidPayload: 'De Gist-gegevens zijn beschadigd of geen geldige CannaGuide-back-up.',
            invalidGistUrl: 'Ongeldige Gist-URL of ID.',
            lastSynced: 'Laatst gesynchroniseerd',
            never: 'Nooit',
            gistIdLabel: 'Gist-ID',
            gistIdPlaceholder: 'Plak Gist-URL of ID om te herstellen',
            enableSync: 'Cloud Sync inschakelen',
            disableSync: 'Cloud Sync uitschakelen',
            enabled: 'Ingeschakeld',
            disabled: 'Uitgeschakeld',
            confirmPull: 'Dit overschrijft ALLE huidige gegevens met de Gist-back-up. Doorgaan?',
            confirmPullTitle: 'Herstellen vanuit cloud?',
            syncing: 'Synchroniseren...',
            connected: 'Verbonden met Gist',
            blockedByLocalOnly:
                'Cloud Sync is uitgeschakeld zolang de Alleen-lokaal-modus actief is. Schakel de Alleen-lokaal-modus uit in Privacy & Beveiliging om Cloud Sync te gebruiken.',
            gistSecurityWarning:
                'Uw gegevens worden opgeslagen in een niet-vindbare GitHub Gist. Hoewel versleuteld, is de Gist-URL publiek toegankelijk als deze bekend is. Schakel E2EE in voor bescherming.', // machine-translated, review needed
            encryptionKeyRequired:
                'Deze back-up is versleuteld. Voer de versleutelingssleutel in om deze te herstellen.',
            e2ee: {
                title: 'End-to-end-versleuteling',
                description:
                    'Versleutel je back-up voor het uploaden. Zonder de sleutel zijn je Gist-gegevens onleesbaar -- zelfs voor GitHub.',
                active: 'E2EE actief -- back-ups zijn versleuteld',
                generateKey: 'Versleutelingssleutel genereren',
                keyGenerated:
                    'Versleutelingssleutel gegenereerd. Bewaar deze veilig -- je hebt deze nodig om back-ups op andere apparaten te herstellen.',
                showKey: 'Sleutel tonen',
                hideKey: 'Sleutel verbergen',
                copyKey: 'Sleutel kopieren',
                keyCopied: 'Versleutelingssleutel gekopieerd naar klembord.',
            },
        },
        replayOnboarding: 'Handleiding opnieuw tonen',
        replayOnboardingConfirm:
            'Dit toont de welkomsthandleiding bij de volgende app-start. Doorgaan?',
        replayOnboardingSuccess: 'Handleiding wordt getoond bij de volgende start.',
        resetPlants: 'Planten resetten',
        resetPlantsConfirm:
            'Weet je zeker dat je al je huidige planten wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.',
        resetPlantsSuccess: 'Alle planten zijn gereset.',
        resetAll: 'Alle app-gegevens resetten',
        resetAllConfirm:
            'WAARSCHUWING: Dit verwijdert permanent al je planten, instellingen, favorieten en aangepaste rassen. Weet je het absoluut zeker?',
        resetAllConfirmInput: "Typ '{{phrase}}' om te bevestigen.",
        resetAllConfirmPhrase: 'alle gegevens verwijderen',
        resetAllSuccess: 'Alle app-gegevens zijn gereset. De app wordt nu herladen.',
        exportAll: 'Alle gegevens exporteren',
        exportAsJson: 'Exporteren als JSON',
        exportAsXml: 'Exporteren als XML',
        exportConfirm: 'Weet je zeker dat je al je app-gegevens als back-up wilt exporteren?',
        exportSuccess: 'Alle gegevens succesvol geexporteerd!',
        exportError: 'Export mislukt.',
        clearArchives: 'AI-archieven wissen',
        clearArchivesDesc: 'Verwijdert alle opgeslagen antwoorden van de AI-mentor en -adviseur.',
        clearArchivesConfirm:
            'Weet je zeker dat je al je opgeslagen AI-antwoorden wilt verwijderen?',
        clearArchivesSuccess: 'Alle AI-archieven zijn gewist.',
        runCleanup: 'Opslagruimte nu opschonen',
        runCleanupDesc:
            "Archiveert automatisch oude kweeklogboeken en verwijdert oudere opgeslagen foto's om ruimte vrij te maken.",
        cleanupRunning: 'Opslagruimte opschonen...',
        cleanupSuccess:
            "Opschoning voltooid. {{count}} oude foto's verwijderd en oudere logboeken gearchiveerd.",
        cleanupError: 'Opschoning mislukt. Probeer het opnieuw.',
        storageWarningTitle: 'Opslagruimte raakt vol.',
        storageWarningBody:
            'Overweeg binnenkort opschoning uit te voeren om opslagfouten te voorkomen.',
        storageCriticalTitle: 'Opslagruimte kritiek vol.',
        storageCriticalBody:
            'Voer nu opschoning uit om het risico op IndexedDB-quotafouten te verminderen.',
        storageCalculating: 'Opslagruimte berekenen...',
        storageUnavailable: 'Opslaginformatie niet beschikbaar.',
        storageUsage: 'Opslaggebruik',
        storageBreakdown: {
            plants: 'Plantgegevens & Dagboeken',
            images: "Opgeslagen foto's",
            archives: 'AI-archieven',
            customStrains: 'Aangepaste rassen',
            savedItems: 'Opgeslagen items',
        },
        sliceReset: {
            title: 'Individuele secties resetten',
            desc: 'Reset een enkele gegevenssectie naar de fabrieksinstellingen zonder andere gegevens te beinvloeden.',
            confirmTitle: '"{{slice}}" resetten?',
            confirmText:
                'Dit verwijdert permanent alle gegevens in de sectie "{{slice}}" en herlaadt de app. Dit kan niet ongedaan worden gemaakt.',
            confirmButton: 'Resetten & Herladen',
            slices: {
                simulation: 'Planten & Simulatie',
                genealogy: 'Genealogiecache',
                sandbox: 'Sandbox-experimenten',
                favorites: 'Favorieten',
                notes: 'Rasnotities',
                archives: 'AI-archieven',
                savedItems: 'Opgeslagen items',
                knowledge: 'Kennisvoortgang',
                breeding: 'Kweekgegevens',
                userStrains: 'Aangepaste rassen',
            },
        },
        gdprTitle: 'Privacy (GDPR/DSGVO)',
        gdprExport: 'Alle persoonlijke gegevens exporteren',
        gdprExportDesc: 'Download een volledige kopie van alle gegevens (Art. 20 GDPR).',
        gdprErase: 'Alle gegevens wissen',
        gdprEraseDesc:
            'Verwijder permanent ALLE gegevens van dit apparaat (Art. 17 GDPR). Dit kan niet ongedaan worden gemaakt.',
        gdprEraseWarning:
            'Dit verwijdert permanent ALLE databases, lokale opslag, caches en service workers. Typ DELETE ALL om te bevestigen.',
        gdprSelectiveTitle: 'Selectieve Database-Verwijdering',
        gdprSelectiveDesc:
            'Verwijder individuele databases in plaats van alle gegevens tegelijk (Art. 17 GDPR gedeeltelijke verwijdering).',
        gdprSelectiveDelete: 'Verwijderen',
        gdprSelectiveConfirm:
            'Weet u zeker dat u de database "{{name}}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.',
        gdprSelectiveSuccess: 'Database "{{name}}" succesvol verwijderd.',
        gdprSelectiveError: 'Verwijderen van database "{{name}}" mislukt.',
    },
    privacy: {
        title: 'Privacy & Beveiliging',
        localOnlyMode: 'Alleen-lokaal-modus',
        localOnlyModeDesc:
            'Blokkeert ALLE uitgaand netwerkverkeer: Sentry-fouttracking, cloud AI-verzoeken en Gist-synchronisatie. Alleen lokale AI-inferentie en lokale opslag zijn toegestaan.',
        localOnlyModeActive:
            'Alleen-lokaal-modus is actief. Alle externe netwerkverzoeken zijn geblokkeerd. Schakel deze schakelaar uit om cloudfuncties te herstellen.',
        requirePin: 'PIN vereisen bij opstarten',
        requirePinDesc: 'Bescherm je app met een 4-cijferige PIN.',
        setPin: 'PIN instellen/wijzigen',
        setPinDesc: 'Sla een lokale 4-cijferige ontgrendelings-PIN op voor app-opstartbeveiliging.',
        pinPlaceholder: 'Voer 4 cijfers in',
        savePin: 'PIN opslaan',
        clearPin: 'PIN verwijderen',
        clearAiHistory: 'AI-geschiedenis wissen bij afsluiten',
        clearAiHistoryDesc:
            'Wist automatisch alle AI-chatgeschiedenissen wanneer de app wordt gesloten.',
        unlockTitle: 'CannaGuide ontgrendelen',
        unlockDesc: 'Voer je 4-cijferige PIN in om door te gaan.',
        unlockFailed: 'PIN onjuist. Probeer het opnieuw.',
        unlockButton: 'Ontgrendelen',
    },
    about: {
        title: 'Over de app',
        projectInfo: 'Projectinfo & README',
        version: 'Versie',
        whatsNew: {
            title: 'Nieuw in v1.1',
            items: {
                simulation:
                    'Mobielveilige simulatieshell: Snellere weergaveovergangen, sterkere offline veerkracht en schonere ondermarge in de hele app.',
                strains:
                    'Rassenbibliotheek versterkt: Ontbrekende verouderde rasvelden vallen nu veilig terug in plaats van de pagina te laten crashen.',
                help: 'Helpcentrumstructuur: FAQ en visuele gidsen zijn gescheiden in app- en kweekonderwerpen voor snellere navigatie.',
                settings:
                    'Over & README vernieuwd: Bijgewerkte release-informatie, huidige app-scope en duidelijkere projectdocumentatie.',
            },
        },
        techStack: {
            title: 'Technologiestack',
            gemini: 'Drijft alle AI-functies aan voor intelligente diagnoses en advies.',
            react: 'Voor een moderne, performante en responsieve gebruikersinterface.',
            indexedDb: 'Robuuste clientzijde database voor 100% offline functionaliteit.',
            webWorkers:
                'Voert complexe simulaties uit buiten de hoofdthread om de UI soepel te houden.',
        },
        credits: {
            title: 'Dankbetuigingen & Links',
            phosphor: 'Pictogrammen geleverd door Phosphor Icons.',
            strainProviders:
                'Rasenrijking via Otreeba, Cannlytics, StrainAPI, CannSeek, OpenTHC, Cansativa en Kushy.', // machine-translated, review needed
            corsProxies: 'CORS-proxy-relay door allorigins.win en corsproxy.io.',
            transformersJs:
                'On-device NLP en embeddings via Transformers.js (Xenova/Hugging Face).',
            webLlm: 'Lokale LLM-inferentie via WebLLM (MLC AI).',
            onnx: 'ML-runtime door ONNX Runtime Web en TensorFlow.js.',
            radixUi: 'Toegankelijke UI-primitieven door Radix UI.',
            recharts: 'Grafiekvisualisaties door Recharts en D3.js.',
            tailwind: 'Utility-first stijlen door Tailwind CSS.',
            sentry: 'Foutopsporing door Sentry.',
            vite: 'Build-tooling door Vite en TurboRepo.',
        },
        githubLinkText: 'Project bekijken op GitHub',
        aiStudioLinkText: 'Project forken in AI Studio',
        devJourney: {
            title: 'Ontwikkelingsreis',
            subtitle: 'Iteratief gebouwd met AI-ondersteunde ontwikkeling in 4 fasen:',
            phase1Title: 'Prototyping',
            phase1Desc:
                'App-opzet en eerste functieset gebouwd met Google Gemini 2.5 Pro & 3.1 Pro in Google AI Studio, vervolgens geexporteerd naar GitHub.',
            phase2Title: 'Evaluatie & Advies',
            phase2Desc:
                'Continue architectuurevaluatie, beveiligingsadvies en kwaliteitsadvies door xAI Grok 4.20 gedurende het hele ontwikkelingsproces.',
            phase3Title: 'Kernontwikkeling',
            phase3Desc:
                'Primaire iteratie en verfijning in GitHub Codespaces met VS Code Copilot aangedreven door Claude Opus 4.6 -- het merendeel van functieontwikkeling, beveiligingsverharding, testen en CI/CD-pipelinewerk.',
            phase4Title: 'Implementatie & Distributie',
            phase4Desc:
                'Productie-implementatie naar GitHub Pages, Netlify PR-previews, Docker-containers, Tauri desktop en Capacitor mobiele builds.',
            secondaryNote: 'Kleine bijdragen door GPT-4 Mini en GPT-5.3 Codex.',
        },
        disclaimer: {
            title: 'Disclaimer',
            content:
                'Alle informatie in deze app is uitsluitend bedoeld voor educatieve en entertainmentdoeleinden. De teelt van cannabis is onderworpen aan strenge wettelijke regelgeving. Informeer jezelf over de wetten in je regio en handel altijd verantwoordelijk en in overeenstemming met de wet.',
        },
        readmeContent: {
            header: `
          <h1>🌿 CannaGuide 2025 (Nederlands)</h1>
          <p><strong>De Ultieme AI-Aangedreven Cannabis Teeltbegeleider</strong></p>
          <p>CannaGuide 2025 is je ultieme AI-aangedreven digitale co-piloot voor de volledige levenscyclus van cannabisteelt. Ontworpen voor zowel beginnende enthousiastelingen als meesterkwekers, begeleidt deze geavanceerde <strong>Progressive Web App (PWA)</strong> je van rasselectie tot een perfect gedroogde oogst.</p>
        `,
            philosophyTitle: 'Projectfilosofie',
            philosophyContent: `
            <p>CannaGuide 2025 is gebouwd op een set kernprincipes ontworpen om een eersteklas ervaring te bieden:</p>
            <blockquote><strong>Offline First</strong>: Je tuin stopt niet wanneer je internet uitvalt. De app is ontworpen om <strong>100% offline functioneel</strong> te zijn.</blockquote>
            <blockquote><strong>Prestatie is Essentieel</strong>: Een vloeiende, responsieve UI is niet onderhandelbaar. Zwaar rekenwerk, zoals de complexe multiplantensimulatie, wordt uitbesteed aan een speciale <strong>Web Worker</strong>.</blockquote>
            <blockquote><strong>Gegevenssoevereiniteit</strong>: Je gegevens zijn van jou, punt. De mogelijkheid om je <strong>volledige applicatiestatus te exporteren en importeren</strong> geeft je volledige controle.</blockquote>
            <blockquote><strong>AI als Co-piloot</strong>: We gebruiken de Google Gemini API niet als gimmick, maar als krachtig hulpmiddel om <strong>bruikbare, contextbewuste inzichten</strong> te bieden.</blockquote>
        `,
            featuresTitle: 'Belangrijkste functies',
            featuresContent: `
            <h4>1. De Kweekruimte (<code>Plants</code> Weergave)</h4>
            <ul>
                <li><strong>Geavanceerde Simulatie-engine</strong>: Ervaar een geavanceerde simulatie gebaseerd op <strong>VPD (Vapor Pressure Deficit)</strong>.</li>
                <li><strong>AI-Aangedreven Diagnoses</strong>: Upload een foto van je plant voor een directe AI-gebaseerde diagnose.</li>
                <li><strong>Uitgebreide Logging</strong>: Volg elke actie in een gedetailleerd, filterbaar dagboek per plant.</li>
            </ul>
            <h4>2. De Rassenencyclopedie (<code>Strains</code> Weergave)</h4>
            <ul>
                <li><strong>Uitgebreide Bibliotheek</strong>: Toegang tot gedetailleerde informatie over <strong>800+ cannabisrassen</strong>.</li>
                <li><strong>Interactieve Genealogieboom</strong>: Visualiseer de volledige genetische afstamming van elk ras.</li>
                <li><strong>AI Kweektips</strong>: Genereer unieke, AI-aangedreven teeltadviezen voor elk ras.</li>
            </ul>
            <h4>3. De Werkplaats (<code>Equipment</code> Weergave)</h4>
            <ul>
                <li><strong>Geavanceerde AI Setup-configurator</strong>: Ontvang een complete, merkspecifieke apparatuurlijst gegenereerd door Gemini AI.</li>
                <li><strong>Suite van Calculators</strong>: Toegang tot een uitgebreide set precisietools.</li>
            </ul>
            <h4>4. De Bibliotheek (<code>Knowledge</code> Weergave)</h4>
            <ul>
                <li><strong>Contextbewuste AI-Mentor</strong>: Stel kwekvragen aan de AI-Mentor, die de gegevens van je actieve plant gebruikt voor advies op maat.</li>
                <li><strong>Kweeklab</strong>: Kruis je hoogwaardige verzamelde zaden om geheel nieuwe, <strong>permanente hybride rassen</strong> te creeren.</li>
                <li><strong>Interactieve Sandbox</strong>: Voer "wat-als"-scenario's uit zonder je echte planten te riskeren.</li>
            </ul>
            <h4>5. De Helpdesk (<code>Help</code> Weergave)</h4>
            <ul>
                <li>Uitgebreide gebruikershandleiding, doorzoekbare FAQ, Kwekerslexicon en Visuele Gidsen.</li>
            </ul>
            <h4>6. Het Commandocentrum (<code>Settings</code> Weergave)</h4>
            <ul>
                <li>Pas thema's, lettergroottes, toegankelijkheidsopties en nog veel meer aan.</li>
            </ul>
        `,
            techTitle: 'Technische Verdieping',
            techContent: `
            <h4>Kerntechnologieen</h4>
            <ul>
                <li><strong>Frontend</strong>: React 19 met TypeScript</li>
                <li><strong>Statusbeheer</strong>: Redux Toolkit</li>
                <li><strong>AI-integratie</strong>: Google Gemini API (<code>@google/genai</code>)</li>
                <li><strong>Asynchrone Bewerkingen</strong>: RTK Query</li>
                <li><strong>Gelijktijdigheid</strong>: Web Workers</li>
                <li><strong>Gegevenspersistentie</strong>: IndexedDB</li>
                <li><strong>PWA & Offline</strong>: Service Workers</li>
                <li><strong>Styling</strong>: Tailwind CSS</li>
            </ul>
            <h4>Gemini Service Abstractie (<code>geminiService.ts</code>)</h4>
            <p>Zoals vermeld in de <a href="https://deepwiki.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer">DeepWiki van het project</a>, is het <code>geminiService.ts</code>-bestand een cruciaal onderdeel dat fungeert als centrale abstractielaag voor alle communicatie met de Google Gemini API. Dit ontwerp ontkoppelt de API-logica van de UI-componenten en de Redux-statusbeheerlaag (RTK Query), waardoor de code schoner, beter onderhoudbaar en gemakkelijker te testen is.</p>
            <p><strong>Belangrijkste Verantwoordelijkheden & Methoden:</strong></p>
            <ul>
                <li><strong>Initialisatie & Context</strong>: De service initialiseert een enkele <code>GoogleGenAI</code>-instantie en formatteert automatisch realtime plantgegevens en taalinstructies voor elke prompt.</li>
                <li><strong>Gestructureerde JSON-uitvoer</strong>: Voor functies zoals <code>getEquipmentRecommendation</code> en <code>diagnosePlant</code> maakt de service gebruik van Gemini's JSON-modus met een <code>responseSchema</code> om geldige, typeveilige JSON-objecten af te dwingen.</li>
                <li><strong>Multimodale Invoer (Visie)</strong>: De <code>diagnosePlant</code>-methode combineert een Base64-gecodeerde afbeelding met tekst in een multipart-verzoek, waardoor het <code>gemini-2.5-flash</code>-model zowel visuele als tekstuele gegevens kan analyseren.</li>
                <li><strong>Beeldgeneratie</strong>: De <code>generateStrainImage</code>-methode gebruikt het gespecialiseerde <code>gemini-2.5-flash-image</code>-model om unieke, artistieke afbeeldingen te creeren voor de AI Kweektips-functie.</li>
                <li><strong>Modelselectie & Foutafhandeling</strong>: De service kiest intelligent tussen <code>gemini-2.5-flash</code> en het krachtigere <code>gemini-2.5-pro</code>. Elke methode bevat robuuste <code>try...catch</code>-blokken die gebruiksvriendelijke foutmeldingen aan de UI leveren.</li>
            </ul>
        `,
            devTitle: 'Lokale Ontwikkeling (Ontwikkelaarsgids)',
            devContent: `
            <h4>Vereisten</h4>
            <ul>
                <li>Node.js (v18.x of later)</li>
                <li>npm</li>
                <li>Een Google Gemini API-sleutel</li>
            </ul>
            <h4>Installatie & Setup</h4>
            <ol>
                <li>Kloon de repository: <code>git clone https://github.com/qnbs/CannaGuide-2025.git</code></li>
                <li>Installeer afhankelijkheden: <code>npm install</code></li>
            <li>Start de ontwikkelserver: <code>npm run dev</code></li>
            <li>Open Instellingen -> Algemeen & UI -> AI-beveiliging (Multi-Model BYOK) en sla je API-sleutel op in de app.</li>
            </ol>
        `,
            troubleshootingTitle: 'Probleemoplossing',
            troubleshootingContent: `
            <ul>
            <li><strong>AI-functies werken niet</strong>: Open Instellingen -> Algemeen & UI -> AI-beveiliging (Multi-Model BYOK), valideer je sleutel en controleer of er een sleutel is opgeslagen op dit apparaat.</li>
                <li><strong>App wordt niet bijgewerkt (PWA-caching)</strong>: Als je wijzigingen hebt aangebracht maar ze niet ziet, wis je browsergegevens of deregistreer de Service Worker in de ontwikkelaarstools.</li>
            </ul>
        `,
            aiStudioTitle: 'Ontwikkelingsreis & Open Source',
            aiStudioContent: `
            <p>CannaGuide 2025 is gebouwd via een transparant, iteratief AI-ondersteund ontwikkelingsproces:</p>
            <ol>
                <li><strong>Prototyping</strong>: Eerste app-opzet en functieset gebouwd met <strong>Google Gemini 2.5 Pro & 3.1 Pro</strong> in <strong>Google AI Studio</strong>, vervolgens geexporteerd naar GitHub.</li>
                <li><strong>Evaluatie & Advies</strong>: Continue architectuurbeoordeling, beveiligingsadvies en kwaliteitsbegeleiding door <strong>xAI Grok 4.20</strong> gedurende het hele proces.</li>
                <li><strong>Kernontwikkeling</strong>: Primaire iteratie in <strong>GitHub Codespaces</strong> met <strong>VS Code Copilot aangedreven door Claude Opus 4.6</strong> -- het merendeel van functieverfijning, beveiligingsverharding, 643+ tests, CI/CD en de lokale AI-stack.</li>
                <li><strong>Implementatie</strong>: Productie via GitHub Pages, Netlify, Docker, Tauri v2 en Capacitor.</li>
            </ol>
            <p><em>Kleine bijdragen door GPT-4 Mini en GPT-5.3 Codex.</em></p>
            <p>Dit project is volledig open source. Duik in de code, fork het project of draag bij op GitHub.</p>
            <ul>
                <li><a href="https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-" target="_blank" rel="noopener noreferrer">Project forken in AI Studio</a></li>
                <li><a href="https://github.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer">Broncode bekijken op GitHub</a></li>
                <li><a href="https://deepwiki.com/qnbs/CannaGuide-2025/" target="_blank" rel="noopener noreferrer">Projectdocumentatie bekijken op DeepWiki</a></li>
            </ul>
        `,
            contributingTitle: 'Bijdragen',
            contributingContent: `
            <p>We verwelkomen bijdragen van de community! Of je nu een bug wilt oplossen, een nieuwe functie wilt toevoegen of vertalingen wilt verbeteren, je hulp wordt gewaardeerd.</p>
            <ol>
                <li><strong>Problemen melden</strong>: Als je een bug vindt of een idee hebt, open dan eerst een issue op GitHub om het te bespreken.</li>
                <li><strong>Wijzigingen aanbrengen</strong>: Fork de repository, maak een nieuwe branch aan, commit je wijzigingen en maak een nieuw Pull Request aan.</li>
            </ol>
        `,
            disclaimerTitle: 'Disclaimer',
            disclaimerContent: `<p>Alle informatie in deze app is uitsluitend bedoeld voor educatieve en entertainmentdoeleinden. De teelt van cannabis is onderworpen aan strenge wettelijke regelgeving. Informeer jezelf over de wetten in je regio en handel altijd verantwoordelijk en in overeenstemming met de wet.</p>`,
        },
    },
    communityShare: {
        title: 'Community rassenuitwisseling',
        description: 'Anoniem delen via GitHub Gist (lichtgewicht alternatief voor IPFS).',
        exportButton: 'Gebruikersrassen exporteren naar anonieme Gist',
        gistPlaceholder: 'Plak Gist-URL of ID',
        importButton: 'Rassen importeren vanuit Gist',
        exportSuccess: 'Anonieme Gist aangemaakt.',
        exportError: 'Gist-export mislukt.',
        importSuccess_one: '1 ras geimporteerd.',
        importSuccess_other: '{{count}} rassen geimporteerd.',
        importError: 'Gist-import mislukt.',
    },
    plugins: {
        title: 'Plugins',
        description:
            "Breid CannaGuide uit met voedingsschema's, hardware-integraties en kweekprofielen.",
        installed: 'Geinstalleerde plugins',
        noPlugins: 'Nog geen plugins geinstalleerd.',
        install: 'Plugin installeren',
        uninstall: 'Verwijderen',
        enable: 'Inschakelen',
        disable: 'Uitschakelen',
        importJson: 'Importeren vanuit JSON',
        exportJson: 'Exporteren als JSON',
        invalidManifest: 'Ongeldig pluginmanifest.',
        installSuccess: 'Plugin "{{name}}" succesvol geinstalleerd.',
        uninstallSuccess: 'Plugin "{{name}}" verwijderd.',
        maxPluginsReached: 'Maximaal aantal plugins bereikt.',
        categories: {
            'nutrient-schedule': 'Voedingsschema',
            hardware: 'Hardware-integratie',
            'grow-profile': 'Kweekprofiel',
        },
    },
    timeSeries: {
        title: 'Sensorgegevensopslag',
        description:
            'Sensormetingen worden automatisch gecomprimeerd: ruwe gegevens worden 24 uur bewaard, uurgemiddelden 7 dagen en daggemiddelden onbeperkt.',
        entryCount: '{{count}} tijdreeksitems opgeslagen',
        compactionRun: 'Compactie voltooid: {{hourly}} uur-, {{daily}} dagaggregaties.',
        clearDevice: 'Gegevens voor apparaat wissen',
        clearConfirm: 'Dit verwijdert permanent alle sensorgegevens voor dit apparaat.',
    },
    predictiveAnalytics: {
        title: 'Voorspellende Analyse',
        description: 'AI-aangedreven voorspellingen op basis van historische sensorgegevens.',
        botrytisRisk: 'Botrytisrisico',
        environmentAlerts: 'Omgevingsmeldingen',
        yieldImpact: 'Opbrengsteffect',
        noData: 'Geen sensorgegevens beschikbaar voor analyse.',
        riskLevels: {
            low: 'Laag',
            moderate: 'Matig',
            high: 'Hoog',
            critical: 'Kritiek',
        },
    },
    pwa: {
        installBannerTitle: 'CannaGuide installeren',
        installBannerDesc:
            'Voeg CannaGuide toe aan je startscherm voor offline toegang en een native app-ervaring.',
        installNow: 'Nu installeren',
        later: 'Later',
        dontShowAgain: 'Niet meer tonen',
        offlineNotice: 'Je bent offline -- sommige functies zijn mogelijk beperkt.',
        updateAvailable: 'Er is een nieuwe versie beschikbaar!',
        updateNow: 'Nu bijwerken',
        installed: 'App geinstalleerd',
        notAvailable: 'Installatie niet beschikbaar in deze browser',
    },
}
