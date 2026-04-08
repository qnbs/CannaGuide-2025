export const settingsView = {
    title: 'Settings',
    searchPlaceholder: 'Search settings...',
    saveSuccess: 'Settings saved!',
    categories: {
        general: 'General & UI',
        strains: 'Strains View',
        plants: 'Plants & Simulation',
        notifications: 'Notifications',
        defaults: 'Defaults',
        data: 'Data Management',
        about: 'About',
        tts: 'Voice & Speech',
        privacy: 'Privacy & Security',
        accessibility: 'Accessibility',
        lookAndFeel: 'Look & Feel',
        interactivity: 'Interactivity',
        ai: 'AI Configuration',
        iot: 'Hardware & IoT',
        grows: 'Grow Management',
    },
    security: {
        title: 'AI Security (Multi-Model BYOK)',
        warning:
            'Your API key is stored only on this device in IndexedDB. Never share your key and remove it on shared devices.',
        geminiFreeNote:
            'Tip: The Gemini API key from Google AI Studio is free with a Google account at aistudio.google.com.',
        provider: 'AI Provider',
        providerDesc: 'Select the AI model provider. Each provider requires its own API key.',
        apiKey: 'API Key',
        apiKeyDesc: 'Required for all AI features in this static app deployment.',
        save: 'Save Key',
        test: 'Validate Key',
        clear: 'Remove Key',
        openAiStudio: 'Get API Key',
        stored: 'An API key is currently saved on this device.',
        notStored: 'No API key is saved yet.',
        maskedPrefix: 'Saved key:',
        invalid: 'Please enter a valid API key.',
        saved: 'API key saved successfully.',
        testSuccessStored: 'Stored API key is valid and ready for all AI features.',
        testSuccessUnsaved: 'Entered API key is valid. Save it to enable all AI features.',
        cleared: 'API key removed.',
        loadError: 'Could not load API key status.',
        saveError: 'Could not save API key.',
        testError: 'API key validation failed. Please check key validity and permissions.',
        clearError: 'Could not remove API key.',
        usageToday:
            'Today: {{requests}} requests, ~{{tokens}} tokens estimated, {{remaining}} requests remaining (per minute).',
        rotationLabel: 'Key rotation',
        rotationToday: 'updated today',
        rotationAge: 'updated {{days}} days ago',
        rotationUnknown: 'rotation date unknown',
        rotationAdvice:
            'Rotate stored keys regularly and remove them immediately after use on shared devices.',
        rotationDue:
            'This key is past the 90-day rotation window and must be replaced before AI requests will work again.',
        rotationBadge: 'Rotate Now',
        auditLog: 'Local AI audit log',
        auditLogEmpty: 'No AI requests have been recorded yet.',
        clearAuditLog: 'Clear audit log',
        panicButton: 'Emergency Key Wipe',
        panicButtonDesc:
            'Immediately delete ALL stored API keys and the encryption key from this device. This cannot be undone.',
        panicButtonConfirm: 'Wipe All Keys',
        panicButtonSuccess: 'All API keys and encryption key have been deleted.',
        encryptionNotice: 'Encryption Transparency',
        encryptionNoticeDesc:
            'API keys are encrypted with AES-256-GCM using a non-exportable key stored in IndexedDB. This protects against casual browsing and basic XSS attacks, but cannot protect against a determined attacker with full browser access. For maximum security, remove keys after each session on shared devices.',
        providerConsent: 'Data Transmission Consent',
        providerConsentPrompt:
            'You are about to send plant data (including photos) to {{provider}}. Do you consent?',
        providerConsentRemember: 'Remember my choice for this provider',
        providerDpaLink: 'View Data Processing Agreement',
    },
    costTracking: {
        title: 'AI Cost Tracking',
        disclaimer:
            'Cost estimates are approximate and based on published API pricing. Actual charges may differ.',
        tokensToday: 'Tokens today',
        costToday: 'Est. cost today',
        last7Days: 'Last 7 days',
        monthlyBudget: 'Monthly budget',
        unlimited: 'Unlimited',
        budgetPlaceholder: 'Token limit (0 = off)',
        setBudget: 'Set',
        resetHistory: 'Reset cost history',
        budgetWarning: 'You have reached your monthly token budget.',
    },
    aiMode: {
        title: 'AI Execution Mode',
        description:
            'Choose how the app processes AI requests. Cloud mode uses your API key for best quality, Local mode runs everything on your device for maximum privacy, and Hybrid mode automatically picks the best option.',
        label: 'AI Mode',
        cloud: 'Cloud',
        cloudDesc:
            'All AI requests are sent to the cloud provider (Gemini, OpenAI, etc.). Best quality, requires an API key and internet connection.',
        local: 'Local',
        localDesc:
            'All AI runs on your device using local models. No data leaves the device. Works completely offline once models are preloaded.',
        hybrid: 'Hybrid (Smart)',
        hybridDesc:
            'Automatically uses local models when preloaded, otherwise falls back to the cloud. Best of both worlds.',
        eco: 'Eco',
        ecoDesc:
            'Battery-saving mode for low-end or mobile devices. Uses only the small 0.5B text model and rule-based heuristics. No cloud, no heavy models.',
        ecoAutoDetected:
            'Eco mode was auto-activated because your device has low memory or battery.',
        activeIndicator: 'Active mode: {{mode}}',
        localNotReady:
            'Local AI models are not preloaded yet. Preload them below for the best local experience.',
        localReady: 'Local AI models are loaded and ready for inference.',
        switchingToLocal: 'Switching to local mode — models will be preloaded automatically.',
        imageGenCloudOnly: 'Note: Image generation is only available in Cloud or Hybrid mode.',
    },
    offlineAi: {
        title: 'Local AI Offline Cache',
        description:
            'Preload the local text and vision models while you are online so diagnoses still work when the network is unavailable.',
        preload: 'Preload Offline Models',
        preloading: 'Preloading...',
        ready: 'Offline models are ready.',
        partial: 'Some model assets are ready, but the cache warm-up is incomplete.',
        error: 'Model preload failed. Try again while on a stable connection.',
        idle: 'No offline model preload has run yet.',
        cacheState: 'Cache details: {{value}}',
        persistentStorage: 'Persistent storage: {{value}}',
        webGpuSupported: 'WebGPU is available on this device.',
        webGpuUnavailable:
            'WebGPU is not available, so the app will use the Transformer.js fallback.',
        onnxBackend: 'ONNX backend: {{value}}',
        webLlmReady: 'WebLLM is ready as a high-performance local runtime.',
        webLlmFallback: 'WebLLM is not active; local AI will fall back to Transformer.js.',
        readyAt: 'Last successful preload: {{value}}',
        yes: 'granted',
        no: 'not granted',
        unknown: 'unknown',
        offlineHint: 'Bring the app online to warm the model cache before relying on offline AI.',
        forceWasm: 'Force WASM Backend',
        forceWasmHint:
            'Override WebGPU auto-detection and always use the WASM backend. Useful for debugging.',
        enableWebGpu: 'Enable WebGPU Acceleration',
        enableWebGpuHint:
            'Use the GPU for local AI inference when available. Delivers 3-8x faster inference on supported devices. Disable to force CPU-only mode.',
        webGpuTier: 'GPU tier: {{value}}',
        webGpuVram: 'GPU VRAM: {{value}} MB',
        webGpuVendor: 'GPU: {{value}}',
        webGpuBatteryGated:
            'WebGPU paused -- battery below 15%. Plug in to re-enable GPU acceleration.',
        webGpuFeatureF16: 'shader-f16: {{value}}',
        webGpuDeviceCleanup:
            'GPU memory is automatically released when the tab is hidden for 30 seconds.',
        preferredModel: 'Preferred Text Model',
        modelAuto: 'Auto (Qwen2.5-1.5B)',
        modelQwen25: 'Qwen2.5-1.5B (Balanced)',
        modelQwen3: 'Qwen2.5-0.5B (Lightweight)',
        benchPreloadTime: 'Last preload: {{value}} s',
        benchInferenceSpeed: 'Inference speed: {{value}} tok/s',
        benchNotAvailable: 'Run a preload to see performance data.',
        // LLM Model Selector
        modelSelector: {
            title: 'LLM Model Selection',
            subtitle: 'Choose which local AI model to use for text generation.',
            autoLabel: 'Auto (Recommended)',
            autoDesc: 'Automatically selects the best model for your device.',
            currentAuto: 'Your device: {{model}}',
            recommended: 'Recommended',
            downloadSize: '{{size}} MB download',
            largeDownload: 'Large download',
            loading: 'Loading model...',
            'model_0.5B_desc': 'Ultra-light model for any device. Fast but limited quality.',
            'model_1.5B_desc': 'Balanced model for mid-range GPUs. Good multilingual support.',
            model_3B_desc: 'High quality reasoning. Best choice for capable GPUs.',
            model_4B_desc: 'Strong reasoning and instruction following. Largest option.',
        },
        // Embedding & Semantic RAG
        embeddingModelReady: 'Embedding model (MiniLM) is ready for semantic search.',
        embeddingModelMissing:
            'Embedding model not loaded. Semantic RAG will use keyword fallback.',
        enableSemanticRag: 'Semantic RAG Search',
        enableSemanticRagHint:
            'Use vector embeddings for more accurate grow-log context retrieval instead of keyword matching.',
        // NLP Models
        sentimentModelReady: 'Sentiment analysis model is ready.',
        sentimentModelMissing: 'Sentiment model not loaded.',
        summarizationModelReady: 'Summarization model is ready.',
        summarizationModelMissing: 'Summarization model not loaded.',
        zeroShotTextModelReady: 'Query classification model is ready.',
        zeroShotTextModelMissing: 'Query classification model not loaded.',
        enableSentiment: 'Journal Sentiment Analysis',
        enableSentimentHint:
            'Analyze the emotional tone of journal entries to track grower mood and detect patterns.',
        enableSummarization: 'Text Summarization',
        enableSummarizationHint:
            'Condense long grow logs and mentor chat histories into concise summaries.',
        enableQueryClassification: 'Smart Query Routing',
        enableQueryClassificationHint:
            'Automatically categorize questions to improve AI response relevance.',
        // Eco Mode
        ecoMode: 'Eco Mode',
        ecoModeHint:
            'Force WASM backend and smallest models to reduce CPU/GPU usage by up to 70%. Ideal for low-end devices or battery savings.',
        // Persistent Cache
        enablePersistentCache: 'Persistent Inference Cache',
        enablePersistentCacheHint:
            'Store AI responses in IndexedDB so repeat queries return instantly, even after reloading the app.',
        persistentCacheSize: 'Cached responses: {{value}}',
        clearPersistentCache: 'Clear Inference Cache',
        // Telemetry
        enableTelemetry: 'Local AI Telemetry',
        enableTelemetryHint:
            'Track inference speed, token throughput, and model usage locally. No data leaves the device.',
        telemetryInferences: 'Total inferences: {{value}}',
        telemetryAvgLatency: 'Avg latency: {{value}} ms',
        telemetryAvgSpeed: 'Avg speed: {{value}} tok/s',
        telemetryCacheHitRate: 'Cache hit rate: {{value}}%',
        telemetrySuccessRate: 'Success rate: {{value}}%',
        telemetryPeakSpeed: 'Peak speed: {{value}} tok/s',
        // Advanced
        inferenceTimeout: 'Inference Timeout',
        inferenceTimeoutHint: 'Maximum time in seconds to wait for a single local AI response.',
        maxCacheSize: 'Max Cache Entries',
        maxCacheSizeHint: 'Maximum number of cached inference results stored in IndexedDB.',
        // Progressive Quantization
        quantizationLevel: 'Model Quantization',
        quantizationLevelHint:
            'Controls model precision and size. Auto selects the best option based on your GPU and memory. q4f16 uses 4-bit float16 for high-end GPUs, q4 uses lightweight 0.5B model for broad compatibility.',
        quantAuto: 'Auto (VRAM-based)',
        quantQ4f16: 'q4f16 (Premium, 1.5B)',
        quantQ4: 'q4 (Standard, 0.5B)',
        quantNone: 'None (Full precision)',
        quantActiveProfile: 'Active profile: {{sizeTier}} {{quantLevel}} — ~{{savings}}% savings',
        // Model Status Section
        modelStatusTitle: 'Model Status Overview',
        modelsLoaded: '{{loaded}} of {{total}} models ready',
        // Health & Device
        healthStatus: 'AI Health: {{value}}',
        deviceClass: 'Device class: {{value}}',
        // Language Detection
        langDetectionReady: 'Language detection model is ready.',
        langDetectionMissing: 'Language detection model not loaded.',
        // Image Similarity
        imgSimilarityReady: 'Image similarity (CLIP features) is ready.',
        imgSimilarityMissing: 'Image similarity model not loaded.',
        // Performance Alerts
        perfDegradedWarning:
            'Local AI is running slowly ({{tokPerSec}} tok/s). Consider closing other tabs or switching to a lighter model.',
        perfDegradedDowngrade:
            'Inference speed has dropped. Switching to a lighter model is recommended.',
        perfDegradedCloseTabs:
            'Inference speed has dropped. Closing unused tabs may free GPU memory.',
    },
    localAiDiag: {
        reasons: {
            active: 'WebLLM is active and running on GPU.',
            'insecure-context': 'WebGPU requires a secure context (HTTPS or localhost).',
            'no-webgpu-api': 'This browser does not support WebGPU.',
            'no-gpu-adapter': 'No compatible GPU adapter was found.',
            'vram-insufficient': 'Not enough GPU memory (VRAM) for the selected model.',
            'no-model-profile': 'No model profile matches the current device capabilities.',
            'force-wasm-override': 'WebGPU disabled — Force WASM is enabled in settings.',
            'browser-unsupported': 'Your browser does not support the required WebGPU features.',
            'adapter-request-timeout': 'GPU adapter request timed out after 5 seconds.',
            'unknown-error': 'An unexpected error occurred during WebGPU initialization.',
        },
    },
    general: {
        title: 'General Settings',
        language: 'Language',
        theme: 'Theme',
        themes: {
            midnight: 'Midnight',
            forest: 'Forest',
            purpleHaze: 'Purple Haze',
            desertSky: 'Desert Sky',
            roseQuartz: 'Rose Quartz',
            rainbowKush: 'Rainbow Kush',
            ogKushGreen: 'OG Kush Green',
            runtzRainbow: 'Runtz Rainbow',
            lemonSkunk: 'Lemon Skunk',
        },
        fontSize: 'Font Size',
        fontSizes: {
            sm: 'Small',
            base: 'Normal',
            lg: 'Large',
        },
        defaultView: 'Default View on Startup',
        installApp: 'Install App',
        installAppDesc:
            'Install CannaGuide 2025 on your device for a native-app experience, including offline access.',
        uiDensity: 'UI Density',
        uiDensities: {
            comfortable: 'Comfortable',
            compact: 'Compact',
        },
        dyslexiaFont: 'Dyslexia-Friendly Font',
        dyslexiaFontDesc: 'Uses the Atkinson Hyperlegible font for improved readability.',
        reducedMotion: 'Reduced Motion',
        reducedMotionDesc: 'Disables or reduces animations and motion-based effects.',
        highContrastMode: 'High Contrast Mode',
        highContrastModeDesc: 'Boosts contrast and edge definition for critical UI surfaces.',
        colorblindMode: 'Colorblind Mode',
        colorblindModeDesc: 'Adjusts app colors for different types of color vision deficiency.',
        colorblindModes: {
            none: 'None',
            protanopia: 'Protanopia (Red-Blind)',
            deuteranopia: 'Deuteranopia (Green-Blind)',
            tritanopia: 'Tritanopia (Blue-Blind)',
        },
    },
    languages: {
        en: 'English',
        de: 'German',
        es: 'Spanish',
        fr: 'French',
        nl: 'Dutch',
    },
    tts: {
        title: 'Voice & Speech',
        ttsOutput: 'Speech Output (Text-to-Speech)',
        voiceControlInput: 'Voice Control (Input)',
        ttsEnabled: 'Enable Text-to-Speech',
        ttsEnabledDesc: 'Adds buttons to have app content read aloud.',
        voice: 'Voice',
        noVoices: 'No voices available for the current language.',
        rate: 'Speech Rate',
        pitch: 'Pitch',
        volume: 'Volume',
        highlightSpeakingText: 'Highlight Speaking Text',
        highlightSpeakingTextDesc: 'Visually highlights the block of text currently being read.',
        testVoice: 'Test Voice',
        testVoiceSentence: 'This is a test of the selected voice.',
        voiceControl: {
            enabled: 'Enable Voice Control',
            enabledDesc: 'Control the app using simple voice commands.',
            hotwordEnabled: 'Always-On Hotword',
            hotwordEnabledDesc:
                'Keeps the microphone ready for hands-free wake words when supported by the browser.',
            confirmationSound: 'Confirmation Sounds',
            confirmationSoundDesc:
                'Plays a short sound when a voice command is successfully recognized.',
        },
        commands: {
            title: 'Command Reference',
            description:
                'Here is a list of commands you can use when voice control is active. Simply start with "Go to..." or "Search for...".',
            searchPlaceholder: 'Search commands...',
            groups: {
                navigation: 'Navigation',
                strains: 'Strains',
                plants: 'Plants',
            },
            goTo: 'Go to {{view}}',
            searchFor: 'Search for [strain name]',
            resetFilters: 'Reset filters',
            showFavorites: 'Show favorites',
            waterAll: 'Water all plants',
        },
        readThis: 'Read this section aloud',
        play: 'Play',
        pause: 'Pause',
        next: 'Next',
        stop: 'Stop',
    },
    strains: {
        title: 'Strains View Settings',
        defaultSort: 'Default Sort Order',
        defaultViewMode: 'Default View Mode',
        strainsPerPage: 'Items Per Page',
        viewModes: {
            list: 'List',
            grid: 'Grid',
        },
        visibleColumns: 'Visible Columns (List View)',
        visibleColumnsDesc: 'Choose which data columns to display in the list view.',
        columns: {
            type: 'Type',
            thc: 'THC',
            cbd: 'CBD',
            floweringTime: 'Flowering Time',
        },
        sortKeys: {
            name: 'Name',
            thc: 'THC',
            cbd: 'CBD',
            floweringTime: 'Flowering Time',
            difficulty: 'Difficulty',
            type: 'Type',
            yield: 'Yield',
            height: 'Height',
        },
        sortDirections: {
            asc: 'Ascending',
            desc: 'Descending',
        },
        defaults: {
            title: 'Defaults & Behavior',
            prioritizeTitle: 'Prioritize My Strains & Favorites',
            prioritizeDesc: 'Always show your custom and favorite strains at the top of the list.',
            sortDirection: 'Sort Direction',
        },
        listView: {
            title: 'List View Customization',
            description: 'Customize the columns displayed in the list view.',
        },
        advanced: {
            title: 'Advanced Features',
            genealogyLayout: 'Default Genealogy Layout',
            genealogyDepth: 'Default Genealogy Initial Depth',
            aiTipsExperience: 'Default AI Tips Experience Level',
            aiTipsFocus: 'Default AI Tips Focus',
        },
    },
    plants: {
        title: 'Plants & Simulation',
        realtimeEngine: 'Real-Time Engine',
        behavior: 'Simulation Behavior',
        calibration: 'Environmental Calibration',
        physics: 'Advanced Simulation Physics (Expert)',
        showArchived: 'Show Completed Grows',
        showArchivedDesc: 'Displays finished/harvested plants on the dashboard.',
        archivedHiddenTitle: 'Archived grow hidden',
        archivedHiddenDesc:
            'This slot contains a finished grow that is currently hidden for a cleaner live dashboard.',
        inspectArchived: 'Inspect archived grow',
        autoGenerateTasks: 'Auto-Generate Tasks',
        autoGenerateTasksDesc: 'Automatically create tasks for actions like watering.',
        realtimeSimulation: 'Real-time Simulation',
        realtimeSimulationDesc: 'The plant simulation continues to run in the background.',
        autoJournaling: 'Auto-Journaling',
        logStageChanges: 'Log stage changes',
        logProblems: 'Log problems',
        logTasks: 'Log tasks',
        simulationProfile: 'Simulation Profile',
        simulationProfileDesc:
            'Applies a documented response curve set for environment stress, nutrient volatility, pest pressure, and post-harvest precision while keeping the timeline strictly real-time.',
        simulationProfiles: {
            beginner: 'Beginner',
            intermediate: 'Intermediate',
            expert: 'Expert',
        },
        pestPressure: 'Pest Pressure',
        pestPressureDesc:
            'Feeds a non-linear pest pressure curve. Low values stay forgiving; high values escalate outbreak probability much faster.',
        nutrientSensitivity: 'Nutrient Sensitivity',
        nutrientSensitivityDesc: 'How strongly the plant reacts to nutrient imbalances.',
        environmentalStability: 'Environmental Stability',
        environmentalStabilityDesc:
            'Drives a deterministic instability curve for daily temperature and humidity drift. Lower values amplify swings sharply instead of linearly.',
        leafTemperatureOffset: 'Leaf Temperature Offset (°C)',
        leafTemperatureOffsetDesc:
            'Simulates how much cooler (negative) or warmer (positive) the leaves are than the ambient air. Directly impacts VPD calculation.',
        lightExtinctionCoefficient: 'Light Penetration (k-value)',
        lightExtinctionCoefficientDesc:
            'Controls how well light penetrates the canopy. A lower value means better penetration. Affects lower leaf photosynthesis.',
        nutrientConversionEfficiency: 'Nutrient Conversion Efficiency',
        nutrientConversionEfficiencyDesc:
            'How efficiently the plant converts absorbed nutrients into biomass. A higher value means more growth for the same amount of nutrients.',
        stomataSensitivity: 'Stomata Sensitivity',
        stomataSensitivityDesc:
            'Controls how quickly the plant closes its stomata in high VPD conditions to conserve water. A higher value means higher drought tolerance.',
        altitudeM: 'Grow Altitude',
        altitudeMDesc:
            'Applies barometric VPD correction based on the elevation of your grow room above sea level.',
        growTech2026: '2026 Grow Technologies',
        dynamicLighting: 'Dynamic Lighting',
        dynamicLightingDesc:
            'Enable spectrum-adaptive lighting that automatically adjusts LED output (blue for veg, red for flower) based on the current growth phase and VPD.',
        enableAeroponics: 'Aeroponics Mode',
        enableAeroponicsDesc:
            'Activates aeroponic-specific simulation parameters: faster nutrient uptake, reduced water usage model, and mist-cycle timing.',
        co2Enrichment: 'CO2 Enrichment Simulation',
        co2EnrichmentDesc:
            'Enables CO2 enrichment effects in the simulation engine. Set target ppm for yield calculations.',
        co2TargetPpm: 'CO2 Target (ppm)',
        smartFertigationAlerts: 'Smart Fertigation Alerts',
        smartFertigationAlertsDesc:
            'Receive automated alerts when pH or EC drifts outside optimal ranges based on real-time sensor data.',
    },
    notifications: {
        title: 'Notifications',
        enableAll: 'Enable All Notifications',
        enableAllDesc: 'Master switch for browser and service worker grow alerts.',
        stageChange: 'Stage Change',
        problemDetected: 'Problem Detected',
        harvestReady: 'Harvest Ready',
        newTask: 'New Task',
        lowWaterWarning: 'Low Water Warning',
        phDriftWarning: 'pH Drift Warning',
        quietHours: 'Quiet Hours',
        enableQuietHours: 'Enable Quiet Hours',
        quietHoursDesc: 'Notifications will be silenced during this time.',
        quietHoursStart: 'Quiet Hours Start',
        quietHoursEnd: 'Quiet Hours End',
    },
    defaults: {
        title: 'Defaults',
        growSetup: 'Default Grow Setup',
        export: 'Default Export Format',
        journalNotesTitle: 'Default Journal Notes',
        wateringNoteLabel: 'Note for Watering',
        feedingNoteLabel: 'Note for Feeding',
    },
    data: {
        title: 'Data Management',
        storageInsights: 'Storage Insights',
        dbStore: {
            title: 'IndexedDB Store Details',
            loading: 'Loading store data...',
            empty: 'Store information unavailable.',
        },
        crdtDocSize: 'CRDT Document',
        crdtFallback: 'CRDT sync in fallback mode (LWW). Offline merge disabled.',
        crdtSizeWarning: 'CRDT document exceeds 1 MB. Consider running storage cleanup.',
        backupAndRestore: 'Backup & Restore',
        dangerZone: 'Danger Zone',
        importData: 'Import Data',
        importDataDesc:
            'Restore an app backup from a JSON file. This will overwrite all current data.',
        importConfirmTitle: 'Confirm Import',
        importConfirmText:
            'Are you sure? All of your current data will be replaced by the contents of the selected file. This action cannot be undone.',
        importConfirmButton: 'Import & Overwrite',
        importSuccess: 'Data imported successfully. The app will now reload.',
        importError: 'Import failed. Please ensure it is a valid backup file.',
        growExportTitle: 'Per-Grow Backup',
        growExportDesc: 'Export "{{name}}" with {{count}} plants as a portable JSON file.',
        exportGrow: 'Export This Grow',
        importGrow: 'Import Grow',
        growImportDesc: 'Import a previously exported grow file (v2.0 format).',
        growImportSuccess: 'Grow "{{name}}" imported successfully.',
        growImportError: 'Import failed. Please ensure it is a valid grow export file (v2.0).',
        totalUsage: 'Total Usage',
        lastBackup: 'Last Backup',
        noBackup: 'No backup created yet',
        autoBackup: 'Automatic Backup',
        persistenceTitle: 'Persistence & Snapshotting',
        persistenceInterval: 'Save cadence',
        backupOptions: {
            off: 'Off',
            daily: 'Daily',
            weekly: 'Weekly',
        },
        persistenceOptions: {
            fast: 'Fast (0.5s)',
            balanced: 'Balanced (1.5s)',
            batterySaver: 'Battery Saver (5s)',
        },
        localOnlyBadge: 'Local Only',
        localOnlyDesc:
            'All your data lives on this device. No account needed — ever. Optionally enable One-Tap Cloud Sync below to back up via anonymous GitHub Gist.',
        sync: {
            title: 'One-Tap Cloud Sync',
            description:
                'Back up & restore your entire app state via anonymous GitHub Gist. No account or sign-up required.',
            pushButton: 'Push to Cloud',
            pullButton: 'Pull from Cloud',
            pushSuccess: 'All data synced to Gist successfully.',
            pullSuccess: 'Data restored from Gist. The app will reload.',
            pushFailed: 'Sync push failed (HTTP {{status}}).',
            pullFailed: 'Sync pull failed (HTTP {{status}}).',
            noSyncFile: 'No CannaGuide sync data found in this Gist.',
            invalidPayload: 'The Gist data is corrupted or not a valid CannaGuide backup.',
            invalidGistUrl: 'Invalid Gist URL or ID.',
            lastSynced: 'Last synced',
            never: 'Never',
            gistIdLabel: 'Gist ID',
            gistIdPlaceholder: 'Paste Gist URL or ID to restore',
            enableSync: 'Enable Cloud Sync',
            disableSync: 'Disable Cloud Sync',
            enabled: 'Enabled',
            disabled: 'Disabled',
            confirmPull: 'This will overwrite ALL current data with the Gist backup. Continue?',
            confirmPullTitle: 'Restore from Cloud?',
            syncing: 'Syncing...',
            connected: 'Connected to Gist',
            blockedByLocalOnly:
                'Cloud sync is disabled while Local-Only Mode is active. Disable Local-Only Mode in Privacy & Security to use cloud sync.',
            gistSecurityWarning:
                'Your data is stored in an unlisted GitHub Gist. While encrypted, the Gist URL is publicly accessible if known. Enable E2EE below for protection.',
            encryptionKeyRequired:
                'This backup is encrypted. Please provide the encryption key to restore it.',
            e2ee: {
                title: 'End-to-End Encryption',
                description:
                    'Encrypt your backup before uploading. Without the key, your Gist data is unreadable — even to GitHub.',
                active: 'E2EE active — backups are encrypted',
                generateKey: 'Generate Encryption Key',
                keyGenerated:
                    'Encryption key generated. Save it securely — you need it to restore backups on other devices.',
                showKey: 'Show Key',
                hideKey: 'Hide Key',
                copyKey: 'Copy Key',
                keyCopied: 'Encryption key copied to clipboard.',
            },
            conflictTitle: 'Sync Conflict Detected',
            conflictDescription:
                'Your local data and the cloud version have divergent changes. Choose how to resolve:',
            localChanges: 'Local only',
            remoteChanges: 'Remote only',
            conflictingItems: 'Conflicting',
            merge: 'Smart Merge',
            keepLocal: 'Keep Local',
            useCloud: 'Use Cloud',
            viewDetails: 'View Details',
            pendingSync: 'Sync pending -- will retry when online...',
            synced: 'Synced at {{time}}',
            syncError: 'Sync failed',
            statusIdle: 'Not synced',
            keepLocalConfirm:
                'This will discard all remote changes and push your local state to the cloud. This cannot be undone.',
            useCloudConfirm:
                'This will discard all local-only changes and replace your data with the cloud version. This cannot be undone.',
            migrating: 'Migrating old sync format -- app will reload...',
        },
        replayOnboarding: 'Show Tutorial Again',
        replayOnboardingConfirm:
            'This will show the welcome tutorial on the next app start. Continue?',
        replayOnboardingSuccess: 'Tutorial will be shown on next start.',
        resetPlants: 'Reset Plants',
        resetPlantsConfirm:
            'Are you sure you want to delete all your current plants? This action cannot be undone.',
        resetPlantsSuccess: 'All plants have been reset.',
        resetAll: 'Reset All App Data',
        resetAllConfirm:
            'WARNING: This will permanently delete all your plants, settings, favorites, and custom strains. Are you absolutely sure?',
        resetAllConfirmInput: "To confirm, please type '{{phrase}}'.",
        resetAllConfirmPhrase: 'delete all data',
        resetAllSuccess: 'All app data has been reset. The app will now reload.',
        exportAll: 'Export All Data',
        exportAsJson: 'Export as JSON',
        exportAsXml: 'Export as XML',
        exportConfirm: 'Are you sure you want to export all your app data as a backup?',
        exportSuccess: 'All data exported successfully!',
        exportError: 'Export failed.',
        clearArchives: 'Clear AI Archives',
        clearArchivesDesc: 'Deletes all saved responses from the AI Mentor and Advisor.',
        clearArchivesConfirm: 'Are you sure you want to delete all your saved AI responses?',
        clearArchivesSuccess: 'All AI archives have been cleared.',
        runCleanup: 'Run Storage Cleanup Now',
        runCleanupDesc:
            'Automatically archives old grow logs and removes older saved photos to free up space.',
        cleanupRunning: 'Cleaning up storage...',
        cleanupSuccess:
            'Storage cleanup complete. Removed {{count}} old photos and archived older logs.',
        cleanupError: 'Storage cleanup failed. Please try again.',
        storageWarningTitle: 'Storage getting full.',
        storageWarningBody: 'Consider running cleanup soon to avoid save failures.',
        storageCriticalTitle: 'Storage critically full.',
        storageCriticalBody: 'Run cleanup now to reduce the risk of IndexedDB quota errors.',
        storageCalculating: 'Calculating storage...',
        storageUnavailable: 'Storage information unavailable.',
        storageUsage: 'Storage Usage',
        storageBreakdown: {
            plants: 'Plant Data & Journals',
            images: 'Saved Photos',
            archives: 'AI Archives',
            customStrains: 'Custom Strains',
            savedItems: 'Saved Items',
        },
        sliceReset: {
            title: 'Reset Individual Sections',
            desc: 'Reset a single data section to its factory defaults without affecting other data.',
            confirmTitle: 'Reset "{{slice}}"?',
            confirmText:
                'This will permanently delete all data in the "{{slice}}" section and reload the app. This cannot be undone.',
            confirmButton: 'Reset & Reload',
            slices: {
                simulation: 'Plants & Simulation',
                genealogy: 'Genealogy Cache',
                sandbox: 'Sandbox Experiments',
                favorites: 'Favorites',
                notes: 'Strain Notes',
                archives: 'AI Archives',
                savedItems: 'Saved Items',
                knowledge: 'Knowledge Progress',
                breeding: 'Breeding Data',
                userStrains: 'Custom Strains',
            },
        },
        gdprTitle: 'Privacy (GDPR/DSGVO)',
        gdprExport: 'Export All Personal Data',
        gdprExportDesc: 'Download a complete copy of all data (Art. 20 GDPR).',
        gdprErase: 'Erase All Data',
        gdprEraseDesc:
            'Permanently delete ALL data from this device (Art. 17 GDPR). This cannot be undone.',
        gdprEraseWarning:
            'This will permanently delete ALL databases, local storage, caches, and service workers. Type DELETE ALL to confirm.',
        gdprEraseConfirmPlaceholder: 'DELETE ALL',
        gdprSelectiveTitle: 'Selective Database Deletion',
        gdprSelectiveDesc:
            'Delete individual databases instead of all data at once (Art. 17 GDPR partial erasure).',
        gdprSelectiveDelete: 'Delete',
        gdprSelectiveConfirm:
            'Are you sure you want to delete the database "{{name}}"? This cannot be undone.',
        gdprSelectiveSuccess: 'Database "{{name}}" deleted successfully.',
        gdprSelectiveError: 'Failed to delete database "{{name}}".',
    },
    privacy: {
        title: 'Privacy & Security',
        localOnlyMode: 'Local-Only Mode',
        localOnlyModeDesc:
            'Blocks ALL outbound network traffic: Sentry error tracking, cloud AI requests, and Gist sync. Only local AI inference and local storage are allowed.',
        localOnlyModeActive:
            'Local-Only Mode is active. All external network requests are blocked. Disable this toggle to restore cloud features.',
        requirePin: 'Require PIN on Launch',
        requirePinDesc: 'Protect your app with a 4-digit PIN.',
        setPin: 'Set/Change PIN',
        setPinDesc: 'Store a local 4-digit unlock PIN for app startup protection.',
        pinPlaceholder: 'Enter 4 digits',
        savePin: 'Save PIN',
        clearPin: 'Remove PIN',
        clearAiHistory: 'Clear AI History on Exit',
        clearAiHistoryDesc: 'Automatically clears all AI chat histories when the app is closed.',
        unlockTitle: 'Unlock CannaGuide',
        unlockDesc: 'Enter your 4-digit PIN to continue.',
        unlockFailed: 'PIN incorrect. Try again.',
        unlockButton: 'Unlock',
    },
    about: {
        title: 'About the App',
        projectInfo: 'Project Info & README',
        version: 'Version',
        whatsNew: {
            title: "What's New in v1.2",
            items: {
                simulation:
                    'IoT real-time dashboard with sparkline charts, gauge cards, and telemetry panel for live sensor monitoring.',
                strains:
                    'Daily Strains now feature personalized recommendation scoring with match percentage badges based on your library preferences.',
                help: '3D GrowRoom visualization with interactive OrbitControls, auto-orbit camera, and live IoT sensor badge overlay.',
                settings:
                    'E2E test optimization: replaced hard waits with proper visibility assertions for faster, more reliable test execution.',
            },
        },
        techStack: {
            title: 'Technology Stack',
            geminiLabel: 'Google Gemini:',
            gemini: 'Powers all AI features for intelligent diagnostics and advice.',
            react: 'For a modern, performant, and responsive user interface.',
            indexedDb: 'Robust client-side database for 100% offline functionality.',
            webWorkersLabel: 'Web Workers:',
            webWorkers: 'Runs complex simulations off the main thread to keep the UI smooth.',
        },
        credits: {
            title: 'Acknowledgements & Links',
            phosphorLabel: 'Phosphor Icons:',
            phosphor: 'Icons provided by Phosphor Icons.',
            dataProvidersLabel: 'Data Providers:',
            strainProviders:
                'Strain enrichment via Otreeba, Cannlytics, StrainAPI, CannSeek, OpenTHC, Cansativa, and Kushy.',
            webLlmOnnxLabel: 'WebLLM / ONNX:',
            corsProxiesLabel: 'CORS Proxies:',
            corsProxies: 'CORS proxy relay by allorigins.win and corsproxy.io.',
            transformersJs:
                'On-device NLP and embeddings via Transformers.js (Xenova/Hugging Face).',
            webLlm: 'Local LLM inference via WebLLM (MLC AI).',
            onnx: 'ML runtime by ONNX Runtime Web and TensorFlow.js.',
            radixUi: 'Accessible UI primitives by Radix UI.',
            recharts: 'Chart visualizations by Recharts and D3.js.',
            tailwind: 'Utility-first styling by Tailwind CSS.',
            sentry: 'Error tracking by Sentry.',
            vite: 'Build tooling by Vite and TurboRepo.',
        },
        githubLinkText: 'View Project on GitHub',
        aiStudioLinkText: 'Fork Project in AI Studio',
        devJourney: {
            title: 'Development Journey',
            subtitle: 'Built iteratively with AI-assisted development across 4 phases:',
            phase1Title: 'Prototyping',
            phase1Desc:
                'App scaffolding and initial feature set built with Google Gemini 2.5 Pro & 3.1 Pro in Google AI Studio, then exported to GitHub.',
            phase2Title: 'Evaluation & Advisory',
            phase2Desc:
                'Continuous architecture evaluation, security consulting, and quality advisory by xAI Grok 4.20 throughout the entire development process.',
            phase3Title: 'Core Development',
            phase3Desc:
                'Primary iteration and refinement in GitHub Codespaces with VS Code Copilot powered by Claude Opus 4.6 — the majority of feature development, security hardening, testing, and CI/CD pipeline work.',
            phase4Title: 'Deployment & Distribution',
            phase4Desc: 'Production deployment to GitHub Pages and Netlify PR previews.',
            secondaryNote: 'Minor contributions by GPT-4 Mini and GPT-5.3 Codex.',
        },
        disclaimer: {
            title: 'Disclaimer',
            content:
                'All information in this app is for educational and entertainment purposes only. The cultivation of cannabis is subject to strict legal regulations. Please inform yourself about the laws in your region and always act responsibly and in accordance with the law.',
        },
        readmeContent: {
            header: `
          <h1>🌿 CannaGuide 2025 (English)</h1>
          <p><strong>The Definitive AI-Powered Cannabis Cultivation Companion</strong></p>
          <p>CannaGuide 2025 is your definitive AI-powered digital co-pilot for the entire cannabis cultivation lifecycle. Engineered for both novice enthusiasts and master growers, this state-of-the-art <strong>Progressive Web App (PWA)</strong> guides you from seed selection to a perfectly cured harvest.</p>
        `,
            philosophyTitle: 'Project Philosophy',
            philosophyContent: `
            <p>CannaGuide 2025 is built upon a set of core principles designed to deliver a best-in-class experience:</p>
            <blockquote><strong>Offline First</strong>: Your garden doesn't stop when your internet does. The app is engineered to be <strong>100% functional offline</strong>.</blockquote>
            <blockquote><strong>Performance is Key</strong>: A fluid, responsive UI is non-negotiable. Heavy lifting, like the complex, multi-plant simulation, is offloaded to a dedicated <strong>Web Worker</strong>.</blockquote>
            <blockquote><strong>Data Sovereignty</strong>: Your data is yours, period. The ability to <strong>export and import your entire application state</strong> gives you complete control.</blockquote>
            <blockquote><strong>AI as a Co-pilot</strong>: We leverage the Google Gemini API not as a gimmick, but as a powerful tool to provide <strong>actionable, context-aware insights</strong>.</blockquote>
        `,
            featuresTitle: 'Key Features',
            featuresContent: `
            <h4>1. The Grow Room (<code>Plants</code> View)</h4>
            <ul>
                <li><strong>Advanced Simulation Engine</strong>: Experience a state-of-the-art simulation based on <strong>VPD (Vapor Pressure Deficit)</strong>.</li>
                <li><strong>AI-Powered Diagnostics</strong>: Upload a photo of your plant to get an instant AI-based diagnosis.</li>
                <li><strong>Comprehensive Logging</strong>: Track every action in a detailed, filterable journal for each plant.</li>
            </ul>
            <h4>2. The Strain Encyclopedia (<code>Strains</code> View)</h4>
            <ul>
                <li><strong>Vast Library</strong>: Access detailed information on <strong>800+ cannabis strains</strong>.</li>
                <li><strong>Interactive Genealogy Tree</strong>: Visualize the complete genetic lineage of any strain.</li>
                <li><strong>AI Grow Tips</strong>: Generate unique, AI-powered cultivation advice for any strain.</li>
            </ul>
            <h4>3. The Workshop (<code>Equipment</code> View)</h4>
            <ul>
                <li><strong>Advanced AI Setup Configurator</strong>: Receive a complete, brand-specific equipment list generated by Gemini AI.</li>
                <li><strong>Suite of Calculators</strong>: Access a comprehensive set of precision tools.</li>
            </ul>
            <h4>4. The Library (<code>Knowledge</code> View)</h4>
            <ul>
                <li><strong>Context-Aware AI Mentor</strong>: Ask growing questions to the AI Mentor, which leverages your active plant's data for tailored advice.</li>
                <li><strong>Breeding Lab</strong>: Cross your high-quality collected seeds to create entirely new, <strong>permanent hybrid strains</strong>.</li>
                <li><strong>Interactive Sandbox</strong>: Run "what-if" scenarios without risking your real plants.</li>
            </ul>
            <h4>5. The Help Desk (<code>Help</code> View)</h4>
            <ul>
                <li>Comprehensive User Manual, searchable FAQ, Grower's Lexicon, and Visual Guides.</li>
            </ul>
            <h4>6. The Command Center (<code>Settings</code> View)</h4>
            <ul>
                <li>Customize themes, font sizes, accessibility options, and much more.</li>
            </ul>
        `,
            techTitle: 'Technical Deep Dive',
            techContent: `
            <h4>Key Technologies</h4>
            <ul>
                <li><strong>Frontend</strong>: React 19 with TypeScript</li>
                <li><strong>State Management</strong>: Redux Toolkit</li>
                <li><strong>AI Integration</strong>: Google Gemini API (<code>@google/genai</code>)</li>
                <li><strong>Async Operations</strong>: RTK Query</li>
                <li><strong>Concurrency</strong>: Web Workers</li>
                <li><strong>Data Persistence</strong>: IndexedDB</li>
                <li><strong>PWA & Offline</strong>: Service Workers</li>
                <li><strong>Styling</strong>: Tailwind CSS</li>
            </ul>
            <h4>Gemini Service Abstraction (<code>geminiService.ts</code>)</h4>
            <p>As noted in the <a href="https://deepwiki.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer">project's DeepWiki</a>, the <code>geminiService.ts</code> file is a critical component that acts as a central abstraction layer for all communication with the Google Gemini API. This design decouples the API logic from the UI components and the Redux state management layer (RTK Query), making the code cleaner, more maintainable, and easier to test.</p>
            <p><strong>Key Responsibilities & Methods:</strong></p>
            <ul>
                <li><strong>Initialization & Context</strong>: The service initializes a single <code>GoogleGenAI</code> instance and automatically formats real-time plant data and language instructions for every prompt.</li>
                <li><strong>Structured JSON Output</strong>: For features like <code>getEquipmentRecommendation</code> and <code>diagnosePlant</code>, the service leverages Gemini's JSON mode with a <code>responseSchema</code> to enforce valid, type-safe JSON objects.</li>
                <li><strong>Multimodal Input (Vision)</strong>: The <code>diagnosePlant</code> method combines a Base64-encoded image with text in a multipart request, allowing the <code>gemini-2.5-flash</code> model to analyze both visual and textual data.</li>
                <li><strong>Image Generation</strong>: The <code>generateStrainImage</code> method uses the specialized <code>gemini-2.5-flash-image</code> model to create unique, artistic images for the AI Grow Tips feature.</li>
                <li><strong>Model Selection & Error Handling</strong>: The service intelligently selects between <code>gemini-2.5-flash</code> and the more powerful <code>gemini-2.5-pro</code>. Each method includes robust <code>try...catch</code> blocks that provide user-friendly error messages to the UI.</li>
            </ul>
        `,
            devTitle: 'Local Development (Developer Guide)',
            devContent: `
            <h4>Prerequisites</h4>
            <ul>
                <li>Node.js (v18.x or later)</li>
                <li>npm</li>
                <li>A Google Gemini API Key</li>
            </ul>
            <h4>Installation & Setup</h4>
            <ol>
                <li>Clone the repository: <code>git clone https://github.com/qnbs/CannaGuide-2025.git</code></li>
                <li>Install dependencies: <code>pnpm install</code></li>
            <li>Run the development server: <code>pnpm dev</code></li>
            <li>Open Settings → General & UI → AI Security (Multi-Model BYOK) and save your API key in-app.</li>
            </ol>
        `,
            troubleshootingTitle: 'Troubleshooting',
            troubleshootingContent: `
            <ul>
            <li><strong>AI Features Not Working</strong>: Open Settings → General & UI → AI Security (Multi-Model BYOK), validate your key, and ensure a key is stored on this device.</li>
                <li><strong>App Not Updating (PWA Caching)</strong>: If you've made changes but don't see them, clear your browser data or unregister the Service Worker in the developer tools.</li>
            </ul>
        `,
            aiStudioTitle: 'Development Journey & Open Source',
            aiStudioContent: `
            <p>CannaGuide 2025 was built through a transparent, iterative AI-assisted development process:</p>
            <ol>
                <li><strong>Prototyping</strong>: Initial app scaffolding and feature set built with <strong>Google Gemini 2.5 Pro & 3.1 Pro</strong> in <strong>Google AI Studio</strong>, then exported to GitHub.</li>
                <li><strong>Evaluation & Advisory</strong>: Continuous architecture review, security consulting, and quality guidance by <strong>xAI Grok 4.20</strong> throughout the entire process.</li>
                <li><strong>Core Development</strong>: Primary iteration in <strong>GitHub Codespaces</strong> with <strong>VS Code Copilot powered by Claude Opus 4.6</strong> — the majority of feature refinement, security hardening, 1000 tests, CI/CD, and the local AI stack.</li>
                <li><strong>Deployment</strong>: Production via GitHub Pages and Netlify.</li>
            </ol>
            <p><em>Minor contributions by GPT-4 Mini and GPT-5.3 Codex.</em></p>
            <p>This project is fully open source. Dive into the code, fork the project, or contribute on GitHub.</p>
            <ul>
                <li><a href="https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-" target="_blank" rel="noopener noreferrer">Fork project in AI Studio</a></li>
                <li><a href="https://github.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer">View source code on GitHub</a></li>
                <li><a href="https://deepwiki.com/qnbs/CannaGuide-2025/" target="_blank" rel="noopener noreferrer">View project documentation on DeepWiki</a></li>
            </ul>
        `,
            contributingTitle: 'Contributing',
            contributingContent: `
            <p>We welcome contributions from the community! Whether you want to fix a bug, add a new feature, or improve translations, your help is appreciated.</p>
            <ol>
                <li><strong>Reporting Issues</strong>: If you find a bug or have an idea, please open an issue on GitHub first to discuss it.</li>
                <li><strong>Making Changes</strong>: Fork the repository, create a new branch, commit your changes, and create a new Pull Request.</li>
            </ol>
        `,
            disclaimerTitle: 'Disclaimer',
            disclaimerContent: `<p>All information in this app is for educational and entertainment purposes only. The cultivation of cannabis is subject to strict legal regulations. Please inform yourself about the laws in your region and always act responsibly and in accordance with the law.</p>`,
        },
    },
    communityShare: {
        title: 'Community Strain Shares',
        description: 'Anonymous sharing via GitHub Gist (lightweight alternative to IPFS).',
        exportButton: 'Export User Strains to Anonymous Gist',
        gistPlaceholder: 'Paste Gist URL or ID',
        importButton: 'Import Strains from Gist',
        exportSuccess: 'Anonymous Gist created.',
        exportError: 'Gist export failed.',
        importSuccess_one: '1 strain imported.',
        importSuccess_other: '{{count}} strains imported.',
        importError: 'Gist import failed.',
    },
    plugins: {
        title: 'Plugins',
        description:
            'Extend CannaGuide with nutrient schedules, hardware integrations, and grow profiles.',
        installed: 'Installed Plugins',
        noPlugins: 'No plugins installed yet.',
        install: 'Install Plugin',
        uninstall: 'Uninstall',
        enable: 'Enable',
        disable: 'Disable',
        importJson: 'Import from JSON',
        exportJson: 'Export as JSON',
        invalidManifest: 'Invalid plugin manifest.',
        installSuccess: 'Plugin "{{name}}" installed successfully.',
        uninstallSuccess: 'Plugin "{{name}}" uninstalled.',
        maxPluginsReached: 'Maximum number of plugins reached.',
        categories: {
            'nutrient-schedule': 'Nutrient Schedule',
            hardware: 'Hardware Integration',
            'grow-profile': 'Grow Profile',
        },
    },
    timeSeries: {
        title: 'Sensor Data Storage',
        description:
            'Sensor readings are automatically compacted: raw data is kept for 24 hours, hourly averages for 7 days, and daily averages indefinitely.',
        entryCount: '{{count}} time-series entries stored',
        compactionRun: 'Compaction completed: {{hourly}} hourly, {{daily}} daily aggregations.',
        clearDevice: 'Clear data for device',
        clearConfirm: 'This will permanently delete all sensor data for this device.',
    },
    predictiveAnalytics: {
        title: 'Predictive Analytics',
        description: 'AI-powered predictions based on historical sensor data.',
        botrytisRisk: 'Botrytis Risk',
        environmentAlerts: 'Environment Alerts',
        yieldImpact: 'Yield Impact',
        noData: 'No sensor data available for analysis.',
        riskLevels: {
            low: 'Low',
            moderate: 'Moderate',
            high: 'High',
            critical: 'Critical',
        },
    },
    pwa: {
        installBannerTitle: 'Install CannaGuide',
        installBannerDesc:
            'Add CannaGuide to your home screen for offline access and a native app experience.',
        installNow: 'Install Now',
        later: 'Later',
        dontShowAgain: 'Do not show again',
        offlineNotice: 'You are offline -- some features may be limited.',
        updateAvailable: 'A new version is available!',
        updateNow: 'Update Now',
        installed: 'App installed',
        notAvailable: 'Installation not available in this browser',
    },
    grows: {
        title: 'Grow Management',
        subtitle: '{{count}} of {{max}} grows',
        createGrow: 'New Grow',
        editGrow: 'Edit Grow',
        name: 'Name',
        namePlaceholder: 'e.g. Indoor Winter 2025',
        description: 'Description',
        descriptionPlaceholder: 'Optional notes about this grow',
        color: 'Color',
        activate: 'Activate',
        active: 'Active',
        archive: 'Archive',
        delete: 'Delete',
        confirmDelete: 'Confirm Delete',
        archived: 'Archived Grows',
        limitReached: 'Maximum of {{max}} grows reached (German CanG limit).',
        activeGrow: 'Active grow: {{name}}',
        plantCount_one: '{{count}} plant',
        plantCount_other: '{{count}} plants',
        statsPlants_one: '{{count}} plant',
        statsPlants_other: '{{count}} plants',
        statsJournal_one: '{{count}} entry',
        statsJournal_other: '{{count}} entries',
        statsHealth: 'Health: {{value}}%',
        statsAge: 'Oldest: {{days}}d',
    },
}
