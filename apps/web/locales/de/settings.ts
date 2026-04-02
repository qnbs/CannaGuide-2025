export const settingsView = {
    title: 'Einstellungen',
    searchPlaceholder: 'Einstellungen durchsuchen...',
    saveSuccess: 'Einstellungen gespeichert!',
    categories: {
        general: 'Allgemein & UI',
        strains: 'Sorten-Ansicht',
        plants: 'Pflanzen & Simulation',
        notifications: 'Benachrichtigungen',
        defaults: 'Standardwerte',
        data: 'Datenverwaltung',
        about: 'Über die App',
        tts: 'Sprache & Stimme',
        privacy: 'Privatsphäre & Sicherheit',
        accessibility: 'Barrierefreiheit',
        lookAndFeel: 'Erscheinungsbild',
        interactivity: 'Interaktivität',
        ai: 'KI-Konfiguration',
        iot: 'Hardware & IoT',
    },
    security: {
        title: 'KI-Sicherheit (Multi-Model BYOK)',
        warning:
            'Dein API-Key wird nur auf diesem Gerät in IndexedDB gespeichert. Teile den Key niemals und entferne ihn auf gemeinsam genutzten Geräten.',
        geminiFreeNote:
            'Tipp: Der Gemini API-Key von Google AI Studio ist kostenlos mit einem Google-Konto erh\u00e4ltlich unter aistudio.google.com.',
        provider: 'KI-Anbieter',
        providerDesc: 'Wähle den KI-Modellanbieter. Jeder Anbieter benötigt einen eigenen API-Key.',
        apiKey: 'API-Key',
        apiKeyDesc: 'Für alle KI-Funktionen in dieser statisch gehosteten App erforderlich.',
        save: 'Key speichern',
        test: 'Key prüfen',
        clear: 'Key entfernen',
        openAiStudio: 'API-Key holen',
        stored: 'Ein API-Key ist aktuell auf diesem Gerät gespeichert.',
        notStored: 'Noch kein API-Key gespeichert.',
        maskedPrefix: 'Gespeicherter Key:',
        invalid: 'Bitte gib einen gültigen API-Key ein.',
        saved: 'API-Key erfolgreich gespeichert.',
        testSuccessStored:
            'Gespeicherter API-Key ist gültig und für alle KI-Funktionen einsatzbereit.',
        testSuccessUnsaved:
            'Eingegebener API-Key ist gültig. Speichere ihn, um alle KI-Funktionen zu nutzen.',
        cleared: 'API-Key entfernt.',
        loadError: 'API-Key-Status konnte nicht geladen werden.',
        saveError: 'API-Key konnte nicht gespeichert werden.',
        testError:
            'API-Key-Prüfung fehlgeschlagen. Bitte prüfe Gültigkeit und Berechtigungen des Keys.',
        clearError: 'API-Key konnte nicht entfernt werden.',
        usageToday:
            'Heute: {{requests}} Anfragen, ~{{tokens}} Token geschätzt, {{remaining}} Anfragen verbleibend (pro Minute).',
        rotationLabel: 'Key-Rotation',
        rotationToday: 'heute aktualisiert',
        rotationAge: 'vor {{days}} Tagen aktualisiert',
        rotationUnknown: 'Rotationsdatum unbekannt',
        rotationAdvice:
            'Wechsle gespeicherte Keys regelmäßig und entferne sie auf gemeinsam genutzten Geräten sofort nach Gebrauch.',
        rotationDue:
            'Dieser Key hat das 90-Tage-Rotationsfenster überschritten und muss ersetzt werden, bevor KI-Anfragen wieder funktionieren.',
        rotationBadge: 'Jetzt rotieren',
        auditLog: 'Lokales KI-Auditprotokoll',
        auditLogEmpty: 'Bisher wurden keine KI-Anfragen protokolliert.',
        clearAuditLog: 'Auditprotokoll löschen',
        panicButton: 'Notfall-Key-Löschung',
        panicButtonDesc:
            'Sofortiges Löschen ALLER gespeicherten API-Keys und des Verschlüsselungs-Keys von diesem Gerät. Dies kann nicht rückgängig gemacht werden.',
        panicButtonConfirm: 'Alle Keys löschen',
        panicButtonSuccess: 'Alle API-Keys und der Verschlüsselungs-Key wurden gelöscht.',
        encryptionNotice: 'Verschlüsselungs-Transparenz',
        encryptionNoticeDesc:
            'API-Keys werden mit AES-256-GCM unter Verwendung eines nicht-exportierbaren Schlüssels in IndexedDB verschlüsselt. Dies schützt vor Gelegenheits-Browsing und einfachen XSS-Angriffen, kann aber nicht vor einem entschlossenen Angreifer mit vollem Browser-Zugriff schützen. Entferne Keys nach jeder Sitzung auf geteilten Geräten.',
        providerConsent: 'Datenübermittlungs-Einwilligung',
        providerConsentPrompt:
            'Sie sind dabei, Pflanzendaten (einschließlich Fotos) an {{provider}} zu senden. Stimmen Sie zu?',
        providerConsentRemember: 'Meine Wahl für diesen Anbieter merken',
        providerDpaLink: 'Auftragsverarbeitungsvertrag anzeigen',
    },
    aiMode: {
        title: 'KI-Ausführungsmodus',
        description:
            'Wähle, wie die App KI-Anfragen verarbeitet. Cloud-Modus nutzt deinen API-Key für beste Qualität, Lokal-Modus führt alles auf deinem Gerät aus für maximalen Datenschutz, und Hybrid-Modus wählt automatisch die beste Option.',
        label: 'KI-Modus',
        cloud: 'Cloud',
        cloudDesc:
            'Alle KI-Anfragen werden an den Cloud-Anbieter gesendet (Gemini, OpenAI usw.). Beste Qualität, erfordert einen API-Key und Internetverbindung.',
        local: 'Lokal',
        localDesc:
            'Alle KI-Berechnungen laufen auf deinem Gerät mit lokalen Modellen. Keine Daten verlassen das Gerät. Funktioniert komplett offline, sobald Modelle vorgeladen sind.',
        hybrid: 'Hybrid (Smart)',
        hybridDesc:
            'Nutzt automatisch lokale Modelle, wenn sie vorgeladen sind, ansonsten wird die Cloud verwendet. Das Beste aus beiden Welten.',
        eco: 'Eco',
        ecoDesc:
            'Batterieschonender Modus für schwache oder mobile Geräte. Nutzt nur das kleine 0,5B-Textmodell und regelbasierte Heuristiken. Kein Cloud, keine schweren Modelle.',
        ecoAutoDetected:
            'Eco-Modus wurde automatisch aktiviert, weil dein Gerät wenig Speicher oder Akku hat.',
        activeIndicator: 'Aktiver Modus: {{mode}}',
        localNotReady:
            'Lokale KI-Modelle sind noch nicht vorgeladen. Lade sie unten vor für das beste lokale Erlebnis.',
        localReady: 'Lokale KI-Modelle sind geladen und bereit für Inferenz.',
        switchingToLocal: 'Wechsel zum Lokal-Modus — Modelle werden automatisch vorgeladen.',
        imageGenCloudOnly:
            'Hinweis: Bildgenerierung ist nur im Cloud- oder Hybrid-Modus verfügbar.',
    },
    offlineAi: {
        title: 'Lokaler KI-Offline-Cache',
        description:
            'Lade die lokalen Text- und Bildmodelle vor, solange du online bist, damit Diagnosen auch ohne Netzwerk funktionieren.',
        preload: 'Offline-Modelle vorladen',
        preloading: 'Wird vorgeladen...',
        ready: 'Die Offline-Modelle sind bereit.',
        partial:
            'Einige Modellbestandteile sind bereit, der Cache-Warm-up ist aber noch nicht komplett.',
        error: 'Das Vorladen der Modelle ist fehlgeschlagen. Bitte erneut mit stabiler Verbindung versuchen.',
        idle: 'Es wurde noch kein Offline-Preload ausgeführt.',
        cacheState: 'Cache-Details: {{value}}',
        persistentStorage: 'Persistenter Speicher: {{value}}',
        webGpuSupported: 'WebGPU ist auf diesem Gerät verfügbar.',
        webGpuUnavailable:
            'WebGPU ist nicht verfügbar, daher wird der Transformer.js-Fallback verwendet.',
        onnxBackend: 'ONNX-Backend: {{value}}',
        webLlmReady: 'WebLLM ist als performante lokale Laufzeit bereit.',
        webLlmFallback: 'WebLLM ist nicht aktiv; lokale KI fällt auf Transformer.js zurück.',
        readyAt: 'Letzter erfolgreicher Preload: {{value}}',
        yes: 'erteilt',
        no: 'nicht erteilt',
        unknown: 'unbekannt',
        offlineHint: 'Bringe die App online, damit der Modell-Cache vorab gefüllt werden kann.',
        forceWasm: 'WASM-Backend erzwingen',
        forceWasmHint:
            'WebGPU-Erkennung uebersteuern und immer das WASM-Backend verwenden. Nuetzlich zur Fehlersuche.',
        enableWebGpu: 'WebGPU-Beschleunigung aktivieren',
        enableWebGpuHint:
            'GPU fuer lokale KI-Inferenz nutzen, wenn verfuegbar. Liefert 3-8x schnellere Inferenz auf unterstuetzten Geraeten. Deaktivieren fuer reinen CPU-Modus.',
        webGpuTier: 'GPU-Stufe: {{value}}',
        webGpuVram: 'GPU-VRAM: {{value}} MB',
        webGpuVendor: 'GPU: {{value}}',
        webGpuBatteryGated:
            'WebGPU pausiert -- Akku unter 15%. Ladegeraet anschliessen, um GPU-Beschleunigung zu reaktivieren.',
        webGpuFeatureF16: 'shader-f16: {{value}}',
        webGpuDeviceCleanup:
            'GPU-Speicher wird automatisch freigegeben, wenn der Tab 30 Sekunden verborgen ist.',
        preferredModel: 'Bevorzugtes Textmodell',
        modelAuto: 'Automatisch (Qwen2.5-1.5B)',
        modelQwen25: 'Qwen2.5-1.5B (Ausgewogen)',
        modelQwen3: 'Qwen2.5-0.5B (Leichtgewicht)',
        benchPreloadTime: 'Letzter Preload: {{value}} s',
        benchInferenceSpeed: 'Inferenzgeschwindigkeit: {{value}} tok/s',
        benchNotAvailable: 'Starte einen Preload, um Leistungsdaten zu sehen.',
        // Embedding & Semantic RAG
        embeddingModelReady: 'Embedding-Modell (MiniLM) ist bereit für semantische Suche.',
        embeddingModelMissing:
            'Embedding-Modell nicht geladen. Semantisches RAG nutzt Keyword-Fallback.',
        enableSemanticRag: 'Semantische RAG-Suche',
        enableSemanticRagHint:
            'Verwende Vektor-Embeddings für genauere Grow-Log-Kontextabfrage statt Schlüsselwortsuche.',
        // NLP Models
        sentimentModelReady: 'Stimmungsanalyse-Modell ist bereit.',
        sentimentModelMissing: 'Stimmungsanalyse-Modell nicht geladen.',
        summarizationModelReady: 'Zusammenfassungs-Modell ist bereit.',
        summarizationModelMissing: 'Zusammenfassungs-Modell nicht geladen.',
        zeroShotTextModelReady: 'Frageklassifikations-Modell ist bereit.',
        zeroShotTextModelMissing: 'Frageklassifikations-Modell nicht geladen.',
        enableSentiment: 'Journal-Stimmungsanalyse',
        enableSentimentHint:
            'Analysiere den emotionalen Ton der Tagebucheinträge, um Stimmung und Muster zu erkennen.',
        enableSummarization: 'Text-Zusammenfassung',
        enableSummarizationHint:
            'Lange Grow-Logs und Mentor-Chatverläufe in prägnante Zusammenfassungen verdichten.',
        enableQueryClassification: 'Intelligentes Frage-Routing',
        enableQueryClassificationHint:
            'Fragen automatisch kategorisieren, um die KI-Antwortrelevanz zu verbessern.',
        // Eco Mode
        ecoMode: 'Eco-Modus',
        ecoModeHint:
            'WASM-Backend und kleinste Modelle erzwingen, um CPU-/GPU-Auslastung um bis zu 70% zu reduzieren. Ideal fuer schwache Geraete oder Akkusparen.',
        // Persistent Cache
        enablePersistentCache: 'Persistenter Inferenz-Cache',
        enablePersistentCacheHint:
            'KI-Antworten in IndexedDB speichern, damit wiederholte Abfragen sofort beantwortet werden – auch nach Neuladen der App.',
        persistentCacheSize: 'Gespeicherte Antworten: {{value}}',
        clearPersistentCache: 'Inferenz-Cache leeren',
        // Telemetry
        enableTelemetry: 'Lokale KI-Telemetrie',
        enableTelemetryHint:
            'Inferenzgeschwindigkeit, Token-Durchsatz und Modellnutzung lokal verfolgen. Keine Daten verlassen das Gerät.',
        telemetryInferences: 'Gesamte Inferenzen: {{value}}',
        telemetryAvgLatency: 'Durchschn. Latenz: {{value}} ms',
        telemetryAvgSpeed: 'Durchschn. Geschwindigkeit: {{value}} tok/s',
        telemetryCacheHitRate: 'Cache-Trefferquote: {{value}}%',
        telemetrySuccessRate: 'Erfolgsrate: {{value}}%',
        telemetryPeakSpeed: 'Spitzengeschwindigkeit: {{value}} tok/s',
        // Advanced
        inferenceTimeout: 'Inferenz-Timeout',
        inferenceTimeoutHint: 'Maximale Wartezeit in Sekunden für eine einzelne lokale KI-Antwort.',
        maxCacheSize: 'Max. Cache-Einträge',
        maxCacheSizeHint: 'Maximale Anzahl gespeicherter Inferenzergebnisse in IndexedDB.',
        // Progressive Quantisierung
        quantizationLevel: 'Modell-Quantisierung',
        quantizationLevelHint:
            'Steuert Modellpräzision und -größe. Auto wählt die beste Option anhand von GPU und Arbeitsspeicher. q4f16 nutzt 4-Bit Float16 für High-End-GPUs, q4 nutzt das leichte 0,5B-Modell für breite Kompatibilität.',
        quantAuto: 'Automatisch (VRAM-basiert)',
        quantQ4f16: 'q4f16 (Premium, 1.5B)',
        quantQ4: 'q4 (Standard, 0.5B)',
        quantNone: 'Keine (Volle Präzision)',
        quantActiveProfile:
            'Aktives Profil: {{sizeTier}} {{quantLevel}} — ~{{savings}}% Einsparung',
        // Model Status Section
        modelStatusTitle: 'Modellstatus-Übersicht',
        modelsLoaded: '{{loaded}} von {{total}} Modellen bereit',
        // Health & Device
        healthStatus: 'KI-Gesundheit: {{value}}',
        deviceClass: 'Geräteklasse: {{value}}',
        // Language Detection
        langDetectionReady: 'Spracherkennungs-Modell ist bereit.',
        langDetectionMissing: 'Spracherkennungs-Modell nicht geladen.',
        // Image Similarity
        imgSimilarityReady: 'Bildähnlichkeit (CLIP-Features) ist bereit.',
        imgSimilarityMissing: 'Bildähnlichkeits-Modell nicht geladen.',
        // Performance Alerts
        perfDegradedWarning:
            'Lokale KI läuft langsam ({{tokPerSec}} tok/s). Schließe andere Tabs oder wechsle zu einem leichteren Modell.',
        perfDegradedDowngrade:
            'Die Inferenzgeschwindigkeit ist gesunken. Ein Wechsel zu einem leichteren Modell wird empfohlen.',
        perfDegradedCloseTabs:
            'Die Inferenzgeschwindigkeit ist gesunken. Das Schließen ungenutzter Tabs kann GPU-Speicher freigeben.',
    },
    localAiDiag: {
        reasons: {
            active: 'WebLLM ist aktiv und läuft auf der GPU.',
            'insecure-context': 'WebGPU benötigt einen sicheren Kontext (HTTPS oder localhost).',
            'no-webgpu-api': 'Dieser Browser unterstützt kein WebGPU.',
            'no-gpu-adapter': 'Kein kompatibler GPU-Adapter gefunden.',
            'vram-insufficient': 'Nicht genügend GPU-Speicher (VRAM) für das gewählte Modell.',
            'no-model-profile': 'Kein Modellprofil passt zu den aktuellen Geräteeigenschaften.',
            'force-wasm-override':
                'WebGPU deaktiviert — WASM-Erzwingung ist in den Einstellungen aktiviert.',
            'browser-unsupported':
                'Dein Browser unterstützt die erforderlichen WebGPU-Funktionen nicht.',
            'adapter-request-timeout': 'GPU-Adapter-Anfrage nach 5 Sekunden abgelaufen.',
            'unknown-error':
                'Ein unerwarteter Fehler bei der WebGPU-Initialisierung ist aufgetreten.',
        },
    },
    general: {
        title: 'Allgemeine Einstellungen',
        language: 'Sprache',
        theme: 'Thema',
        themes: {
            midnight: 'Mitternacht',
            forest: 'Wald',
            purpleHaze: 'Purpurnebel',
            desertSky: 'Wüstenhimmel',
            roseQuartz: 'Rosenquarz',
            rainbowKush: 'Regenbogen Kush',
            ogKushGreen: 'OG Kush Grün',
            runtzRainbow: 'Runtz Regenbogen',
            lemonSkunk: 'Lemon Skunk',
        },
        fontSize: 'Schriftgröße',
        fontSizes: {
            sm: 'Klein',
            base: 'Standard',
            lg: 'Groß',
        },
        defaultView: 'Standard-Startansicht',
        installApp: 'App installieren',
        installAppDesc:
            'Installiere den CannaGuide 2025 auf deinem Gerät für ein natives App-Erlebnis, inklusive Offline-Zugriff.',
        uiDensity: 'UI-Dichte',
        uiDensities: {
            comfortable: 'Komfortabel',
            compact: 'Kompakt',
        },
        dyslexiaFont: 'Legastheniker-freundliche Schrift',
        dyslexiaFontDesc:
            'Verwendet die Schriftart Atkinson Hyperlegible für verbesserte Lesbarkeit.',
        reducedMotion: 'Bewegung reduzieren',
        reducedMotionDesc: 'Deaktiviert oder reduziert Animationen und bewegungsbasierte Effekte.',
        highContrastMode: 'Hoher Kontrast',
        highContrastModeDesc:
            'Erhöht Kontrast und Kantenschärfe für besonders wichtige Oberflächenelemente.',
        colorblindMode: 'Farbfehlsichtigkeits-Modus',
        colorblindModeDesc: 'Passt die App-Farben für verschiedene Arten von Farbsehschwächen an.',
        colorblindModes: {
            none: 'Kein',
            protanopia: 'Protanopie (Rotblindheit)',
            deuteranopia: 'Deuteranopie (Grünblindheit)',
            tritanopia: 'Tritanopie (Blaulinlindheit)',
        },
    },
    languages: {
        en: 'Englisch',
        de: 'Deutsch',
        es: 'Spanisch',
        fr: 'Franzoesisch',
        nl: 'Niederlaendisch',
    },
    tts: {
        title: 'Sprache & Stimme',
        ttsOutput: 'Sprachausgabe (Text-zu-Sprache)',
        voiceControlInput: 'Spracheingabe (Sprachsteuerung)',
        ttsEnabled: 'Sprachausgabe aktivieren',
        ttsEnabledDesc: 'Fügt Schaltflächen hinzu, um sich App-Inhalte vorlesen zu lassen.',
        voice: 'Stimme',
        noVoices: 'Keine Stimmen für die aktuelle Sprache verfügbar.',
        rate: 'Sprechgeschwindigkeit',
        pitch: 'Tonhöhe',
        volume: 'Lautstärke',
        highlightSpeakingText: 'Gesprochenen Text hervorheben',
        highlightSpeakingTextDesc: 'Hebt den Textblock visuell hervor, der gerade vorgelesen wird.',
        testVoice: 'Stimme testen',
        testVoiceSentence: 'Dies ist ein Test der ausgewählten Stimme.',
        voiceControl: {
            enabled: 'Sprachsteuerung aktivieren',
            enabledDesc: 'Steuere die App mit einfachen Sprachbefehlen.',
            hotwordEnabled: 'Permanentes Hotword',
            hotwordEnabledDesc:
                'Hält das Mikrofon für freihändige Aktivierungswörter bereit, sofern der Browser dies unterstützt.',
            confirmationSound: 'Bestätigungstöne',
            confirmationSoundDesc:
                'Spielt einen kurzen Ton ab, wenn ein Sprachbefehl erfolgreich erkannt wurde.',
        },
        commands: {
            title: 'Befehlsreferenz',
            description:
                'Hier ist eine Liste von Befehlen, die du verwenden kannst. Beginne einfach mit "Gehe zu..." oder "Suche nach...".',
            searchPlaceholder: 'Befehle durchsuchen...',
            groups: {
                navigation: 'Navigation',
                strains: 'Sorten',
                plants: 'Pflanzen',
            },
            goTo: 'Gehe zu {{view}}',
            searchFor: 'Suche nach [Sortenname]',
            resetFilters: 'Filter zurücksetzen',
            showFavorites: 'Favoriten anzeigen',
            waterAll: 'Alle Pflanzen gießen',
        },
        readThis: 'Diesen Abschnitt vorlesen',
        play: 'Abspielen',
        pause: 'Pause',
        next: 'Nächster',
        stop: 'Stopp',
    },
    strains: {
        title: 'Sorten-Ansicht',
        defaultSort: 'Standard-Sortierung',
        defaultViewMode: 'Standard-Ansichtsmodus',
        strainsPerPage: 'Einträge pro Seite',
        viewModes: {
            list: 'Liste',
            grid: 'Raster',
        },
        visibleColumns: 'Sichtbare Spalten (Listenansicht)',
        visibleColumnsDesc: 'Wähle aus, welche Daten in der Listenansicht angezeigt werden sollen.',
        columns: {
            type: 'Typ',
            thc: 'THC',
            cbd: 'CBD',
            floweringTime: 'Blütezeit',
        },
        sortKeys: {
            name: 'Name',
            thc: 'THC',
            cbd: 'CBD',
            floweringTime: 'Blütezeit',
            difficulty: 'Schwierigkeit',
            type: 'Typ',
            yield: 'Ertrag',
            height: 'Höhe',
        },
        sortDirections: {
            asc: 'Aufsteigend',
            desc: 'Absteigend',
        },
        defaults: {
            title: 'Standards & Verhalten',
            prioritizeTitle: 'Meine Sorten & Favoriten priorisieren',
            prioritizeDesc: 'Zeigt eigene und favorisierte Sorten immer am Anfang der Liste an.',
            sortDirection: 'Sortierrichtung',
        },
        listView: {
            title: 'Listenansicht-Anpassung',
            description: 'Passe die Spalten an, die in der Listenansicht angezeigt werden.',
        },
        advanced: {
            title: 'Erweiterte Funktionen',
            genealogyLayout: 'Standard-Stammbaum-Layout',
            genealogyDepth: 'Standard-Stammbaum-Tiefe',
            aiTipsExperience: 'Standard-Erfahrung für KI-Tipps',
            aiTipsFocus: 'Standard-Fokus für KI-Tipps',
        },
    },
    plants: {
        title: 'Pflanzen & Simulation',
        realtimeEngine: 'Echtzeit-Engine',
        behavior: 'Simulationsverhalten',
        calibration: 'Umgebungs-Kalibrierung',
        physics: 'Fortgeschrittene Simulationsphysik (Experte)',
        showArchived: 'Abgeschlossene Grows anzeigen',
        showArchivedDesc: 'Zeigt fertige/geerntete Pflanzen im Dashboard an.',
        archivedHiddenTitle: 'Archivierter Grow ausgeblendet',
        archivedHiddenDesc:
            'Dieser Slot enthält einen abgeschlossenen Grow, der für ein saubereres Live-Dashboard aktuell verborgen ist.',
        inspectArchived: 'Archivierten Grow ansehen',
        autoGenerateTasks: 'Aufgaben automatisch erstellen',
        autoGenerateTasksDesc: 'Erstellt automatisch Aufgaben für Aktionen wie Gießen.',
        realtimeSimulation: 'Echtzeit-Simulation',
        realtimeSimulationDesc: 'Die Pflanzensimulation läuft im Hintergrund weiter.',
        autoJournaling: 'Automatisches Journaling',
        logStageChanges: 'Phasenwechsel protokollieren',
        logProblems: 'Probleme protokollieren',
        logTasks: 'Aufgaben protokollieren',
        simulationProfile: 'Simulationsprofil',
        simulationProfileDesc:
            'Aktiviert ein dokumentiertes Kurvenset für Umweltstress, Nährstoffvolatilität, Schädlingsdruck und Nachernte-Präzision bei strikt echtem Zeitverlauf.',
        simulationProfiles: {
            beginner: 'Anfänger',
            intermediate: 'Fortgeschritten',
            expert: 'Experte',
        },
        pestPressure: 'Schädlingsdruck',
        pestPressureDesc:
            'Speist eine nichtlineare Schädlingsdruckkurve. Niedrige Werte bleiben nachsichtig, hohe Werte steigern Ausbrüche deutlich schneller.',
        nutrientSensitivity: 'Nährstoffempfindlichkeit',
        nutrientSensitivityDesc: 'Wie stark die Pflanze auf Nährstoffungleichgewichte reagiert.',
        environmentalStability: 'Umweltstabilität',
        environmentalStabilityDesc:
            'Steuert eine deterministische Instabilitätskurve für tägliche Temperatur- und Feuchtedrift. Niedrige Werte verstärken Schwankungen stark statt linear.',
        leafTemperatureOffset: 'Blatt-Temperatur-Offset (°C)',
        leafTemperatureOffsetDesc:
            'Simuliert, wie viel kühler (negativ) oder wärmer (positiv) die Blätter im Vergleich zur Umgebungsluft sind. Beeinflusst direkt die VPD-Berechnung.',
        lightExtinctionCoefficient: 'Lichtdurchdringung (k-Wert)',
        lightExtinctionCoefficientDesc:
            'Steuert, wie gut Licht durch das Blätterdach dringt. Ein niedrigerer Wert bedeutet eine bessere Durchdringung. Beeinflusst die Photosynthese der unteren Blätter.',
        nutrientConversionEfficiency: 'Nährstoff-Umwandlungseffizienz',
        nutrientConversionEfficiencyDesc:
            'Wie effizient die Pflanze aufgenommene Nährstoffe in Biomasse umwandelt. Ein höherer Wert bedeutet mehr Wachstum bei gleicher Nährstoffmenge.',
        stomataSensitivity: 'Stomata-Empfindlichkeit',
        stomataSensitivityDesc:
            'Steuert, wie schnell die Pflanze ihre Spaltöffnungen (Stomata) bei hohem VPD schließt, um Wasser zu sparen. Ein höherer Wert bedeutet eine höhere Trockenheitstoleranz.',
        altitudeM: 'Grow-Höhe',
        altitudeMDesc:
            'Wendet die barometrische VPD-Korrektur anhand der Höhe deines Grow-Raums über dem Meeresspiegel an.',
        growTech2026: '2026 Grow-Technologien',
        dynamicLighting: 'Dynamische Beleuchtung',
        dynamicLightingDesc:
            'Aktiviert spektrumadaptive Beleuchtung, die die LED-Ausgabe automatisch an die aktuelle Wachstumsphase und VPD anpasst (blau fuer Wuchs, rot fuer Bluete).',
        enableAeroponics: 'Aeroponik-Modus',
        enableAeroponicsDesc:
            'Aktiviert aeroponik-spezifische Simulationsparameter: schnellere Naehrstoffaufnahme, reduziertes Wasserverbrauchsmodell und Nebel-Zyklus-Timing.',
        co2Enrichment: 'CO2-Anreicherungs-Simulation',
        co2EnrichmentDesc:
            'Aktiviert CO2-Anreicherungseffekte in der Simulations-Engine. Lege den Ziel-ppm-Wert fuer Ertragsberechnungen fest.',
        co2TargetPpm: 'CO2-Ziel (ppm)',
        smartFertigationAlerts: 'Smart-Fertigation-Alarme',
        smartFertigationAlertsDesc:
            'Erhalte automatisierte Warnungen, wenn pH oder EC basierend auf Echtzeit-Sensordaten den optimalen Bereich verlassen.',
    },
    notifications: {
        title: 'Benachrichtigungen',
        enableAll: 'Alle Benachrichtigungen aktivieren',
        enableAllDesc:
            'Globaler Schalter für Browser- und Service-Worker-Warnungen rund um den Grow.',
        stageChange: 'Phasenwechsel',
        problemDetected: 'Problem erkannt',
        harvestReady: 'Ernte bereit',
        newTask: 'Neue Aufgabe',
        lowWaterWarning: 'Warnung bei niedrigem Wasserstand',
        phDriftWarning: 'pH-Drift-Warnung',
        quietHours: 'Ruhezeiten',
        enableQuietHours: 'Ruhezeiten aktivieren',
        quietHoursDesc: 'Benachrichtigungen werden während dieser Zeit stummgeschaltet.',
        quietHoursStart: 'Beginn der Ruhezeit',
        quietHoursEnd: 'Ende der Ruhezeit',
    },
    defaults: {
        title: 'Standardwerte',
        growSetup: 'Standard-Grow-Setup',
        export: 'Standard-Exportformat',
        journalNotesTitle: 'Standard-Journalnotizen',
        wateringNoteLabel: 'Notiz für Gießen',
        feedingNoteLabel: 'Notiz für Düngen',
    },
    data: {
        title: 'Datenverwaltung',
        storageInsights: 'Speicher-Einblicke',
        backupAndRestore: 'Sicherung & Wiederherstellung',
        dangerZone: 'Gefahrenzone',
        importData: 'Daten importieren',
        importDataDesc:
            'Stelle eine App-Sicherung aus einer JSON-Datei wieder her. Dies überschreibt alle aktuellen Daten.',
        importConfirmTitle: 'Import bestätigen',
        importConfirmText:
            'Sind Sie sicher? Alle Ihre aktuellen Daten werden durch den Inhalt der ausgewählten Datei ersetzt. Diese Aktion kann nicht rückgängig gemacht werden.',
        importConfirmButton: 'Importieren & Überschreiben',
        importSuccess: 'Daten erfolgreich importiert. Die App wird neu geladen.',
        importError:
            'Import fehlgeschlagen. Bitte stellen Sie sicher, dass es sich um eine gültige Backup-Datei handelt.',
        totalUsage: 'Gesamtnutzung',
        lastBackup: 'Letztes Backup',
        noBackup: 'Noch kein Backup erstellt',
        autoBackup: 'Automatische Sicherung',
        persistenceTitle: 'Persistenz & Snapshots',
        persistenceInterval: 'Speicherintervall',
        backupOptions: {
            off: 'Aus',
            daily: 'Täglich',
            weekly: 'Wöchentlich',
        },
        persistenceOptions: {
            fast: 'Schnell (0,5s)',
            balanced: 'Ausgewogen (1,5s)',
            batterySaver: 'Akkuschonend (5s)',
        },
        localOnlyBadge: 'Nur lokal',
        localOnlyDesc:
            'Alle deine Daten bleiben auf diesem Gerät. Kein Konto nötig — niemals. Optional kannst du unten die Ein-Tipp-Cloud-Synchronisierung aktivieren, um über anonyme GitHub Gists zu sichern.',
        sync: {
            title: 'Ein-Tipp Cloud-Sync',
            description:
                'Sichere & stelle deinen gesamten App-Zustand über anonyme GitHub Gists wieder her. Kein Konto oder Anmeldung erforderlich.',
            pushButton: 'In die Cloud sichern',
            pullButton: 'Aus der Cloud wiederherstellen',
            pushSuccess: 'Alle Daten erfolgreich zum Gist synchronisiert.',
            pullSuccess: 'Daten aus Gist wiederhergestellt. Die App wird neu geladen.',
            pushFailed: 'Sync-Push fehlgeschlagen (HTTP {{status}}).',
            pullFailed: 'Sync-Pull fehlgeschlagen (HTTP {{status}}).',
            noSyncFile: 'Keine CannaGuide-Sync-Daten in diesem Gist gefunden.',
            invalidPayload: 'Die Gist-Daten sind beschädigt oder kein gültiges CannaGuide-Backup.',
            invalidGistUrl: 'Ungültige Gist-URL oder -ID.',
            lastSynced: 'Zuletzt synchronisiert',
            never: 'Nie',
            gistIdLabel: 'Gist-ID',
            gistIdPlaceholder: 'Gist-URL oder -ID einfügen zum Wiederherstellen',
            enableSync: 'Cloud-Sync aktivieren',
            disableSync: 'Cloud-Sync deaktivieren',
            enabled: 'Aktiviert',
            disabled: 'Deaktiviert',
            confirmPull: 'Dies überschreibt ALLE aktuellen Daten mit dem Gist-Backup. Fortfahren?',
            confirmPullTitle: 'Aus der Cloud wiederherstellen?',
            syncing: 'Synchronisiere...',
            connected: 'Mit Gist verbunden',
            blockedByLocalOnly:
                'Cloud-Sync ist deaktiviert, solange der Nur-Lokal-Modus aktiv ist. Deaktiviere den Nur-Lokal-Modus unter Privatsphäre & Sicherheit, um Cloud-Sync zu nutzen.',
            gistSecurityWarning:
                'Deine Daten werden in einem nicht gelisteten GitHub Gist gespeichert. Auch wenn verschlüsselt, ist die Gist-URL öffentlich zugänglich, wenn sie bekannt ist. Aktiviere E2EE unten für Schutz.',
            encryptionKeyRequired:
                'Dieses Backup ist verschlüsselt. Bitte gib den Verschlüsselungsschlüssel an, um es wiederherzustellen.',
            e2ee: {
                title: 'Ende-zu-Ende-Verschlüsselung',
                description:
                    'Verschlüssele dein Backup vor dem Hochladen. Ohne den Schlüssel sind deine Gist-Daten unlesbar — selbst für GitHub.',
                active: 'E2EE aktiv — Backups sind verschlüsselt',
                generateKey: 'Verschlüsselungsschlüssel generieren',
                keyGenerated:
                    'Verschlüsselungsschlüssel generiert. Bewahre ihn sicher auf — du brauchst ihn, um Backups auf anderen Geräten wiederherzustellen.',
                showKey: 'Schlüssel anzeigen',
                hideKey: 'Schlüssel verbergen',
                copyKey: 'Schlüssel kopieren',
                keyCopied: 'Verschlüsselungsschlüssel in die Zwischenablage kopiert.',
            },
        },
        replayOnboarding: 'Einführung erneut anzeigen',
        replayOnboardingConfirm:
            'Dadurch wird die Willkommens-Einführung beim nächsten App-Start angezeigt. Fortfahren?',
        replayOnboardingSuccess: 'Die Einführung wird beim nächsten Start angezeigt.',
        resetPlants: 'Pflanzen zurücksetzen',
        resetPlantsConfirm:
            'Möchtest du wirklich alle deine aktuellen Pflanzen löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
        resetPlantsSuccess: 'Alle Pflanzen wurden zurückgesetzt.',
        resetAll: 'Alle App-Daten zurücksetzen',
        resetAllConfirm:
            'WARNUNG: Dadurch werden alle deine Pflanzen, Einstellungen, Favoriten und eigenen Sorten endgültig gelöscht. Bist du absolut sicher?',
        resetAllConfirmInput: "Um zu bestätigen, geben Sie bitte '{{phrase}}' ein.",
        resetAllConfirmPhrase: 'alle daten löschen',
        resetAllSuccess: 'Alle App-Daten wurden zurückgesetzt. Die App wird neu geladen.',
        exportAll: 'Alle Daten exportieren',
        exportAsJson: 'Als JSON exportieren',
        exportAsXml: 'Als XML exportieren',
        exportConfirm: 'Möchtest du wirklich alle deine App-Daten als Backup exportieren?',
        exportSuccess: 'Alle Daten erfolgreich exportiert!',
        exportError: 'Export fehlgeschlagen.',
        clearArchives: 'KI-Archive leeren',
        clearArchivesDesc: 'Löscht alle gespeicherten Antworten vom KI-Mentor und -Berater.',
        clearArchivesConfirm: 'Möchtest du wirklich alle deine gespeicherten KI-Antworten löschen?',
        clearArchivesSuccess: 'Alle KI-Archive wurden geleert.',
        runCleanup: 'Speicherbereinigung jetzt starten',
        runCleanupDesc:
            'Archiviert automatisch alte Grow-Logs und entfernt aeltere gespeicherte Fotos, um Speicherplatz freizugeben.',
        cleanupRunning: 'Speicher wird bereinigt...',
        cleanupSuccess:
            'Speicherbereinigung abgeschlossen. {{count}} alte Fotos entfernt und aeltere Logs archiviert.',
        cleanupError: 'Speicherbereinigung fehlgeschlagen. Bitte erneut versuchen.',
        storageWarningTitle: 'Speicher wird knapp.',
        storageWarningBody: 'Starte bald eine Bereinigung, um Speicherfehler zu vermeiden.',
        storageCriticalTitle: 'Speicher kritisch voll.',
        storageCriticalBody:
            'Bereinigung jetzt starten, um das Risiko von IndexedDB-Quota-Fehlern zu reduzieren.',
        storageCalculating: 'Speicher wird berechnet...',
        storageUnavailable: 'Speicherinformationen nicht verfügbar.',
        storageUsage: 'Speichernutzung',
        storageBreakdown: {
            plants: 'Pflanzendaten & Journale',
            images: 'Gespeicherte Fotos',
            archives: 'KI-Archive',
            customStrains: 'Eigene Sorten',
            savedItems: 'Gespeicherte Items',
        },
        sliceReset: {
            title: 'Einzelne Bereiche zurücksetzen',
            desc: 'Setze einen einzelnen Datenbereich auf Werkseinstellungen zurück, ohne andere Daten zu beeinflussen.',
            confirmTitle: '"{{slice}}" zurücksetzen?',
            confirmText:
                'Dies löscht alle Daten im Bereich "{{slice}}" unwiderruflich und lädt die App neu.',
            confirmButton: 'Zurücksetzen & Neuladen',
            slices: {
                simulation: 'Pflanzen & Simulation',
                genealogy: 'Genealogie-Cache',
                sandbox: 'Sandbox-Experimente',
                favorites: 'Favoriten',
                notes: 'Sorten-Notizen',
                archives: 'KI-Archive',
                savedItems: 'Gespeicherte Elemente',
                knowledge: 'Wissensfortschritt',
                breeding: 'Zuchtdaten',
                userStrains: 'Eigene Sorten',
            },
        },
        gdprTitle: 'Datenschutz (DSGVO)',
        gdprExport: 'Alle personenbezogenen Daten exportieren',
        gdprExportDesc: 'Eine vollstaendige Kopie aller Daten herunterladen (Art. 20 DSGVO).',
        gdprErase: 'Alle Daten loeschen',
        gdprEraseDesc:
            'Alle Daten auf diesem Geraet unwiderruflich loeschen (Art. 17 DSGVO). Dies kann nicht rueckgaengig gemacht werden.',
        gdprSelectiveTitle: 'Selektive Datenbank-Loeschung',
        gdprSelectiveDesc:
            'Einzelne Datenbanken loeschen statt alle Daten auf einmal (Art. 17 DSGVO Teilloeschung).',
        gdprSelectiveDelete: 'Loeschen',
        gdprSelectiveConfirm:
            'Sind Sie sicher, dass Sie die Datenbank "{{name}}" loeschen moechten? Dies kann nicht rueckgaengig gemacht werden.',
        gdprSelectiveSuccess: 'Datenbank "{{name}}" erfolgreich geloescht.',
        gdprSelectiveError: 'Loeschen der Datenbank "{{name}}" fehlgeschlagen.',
        gdprEraseWarning:
            'Dies loescht unwiderruflich ALLE Datenbanken, lokalen Speicher, Caches und Service Worker. Tippe DELETE ALL zur Bestaetigung.',
    },
    privacy: {
        title: 'Privatsphäre & Sicherheit',
        localOnlyMode: 'Nur-Lokal-Modus',
        localOnlyModeDesc:
            'Blockiert ALLEN ausgehenden Netzwerkverkehr: Sentry-Fehlertracking, Cloud-KI-Anfragen und Gist-Sync. Nur lokale KI-Inferenz und lokale Speicherung sind erlaubt.',
        localOnlyModeActive:
            'Nur-Lokal-Modus ist aktiv. Alle externen Netzwerk-Anfragen sind blockiert. Deaktiviere diesen Schalter, um Cloud-Funktionen wiederherzustellen.',
        requirePin: 'PIN beim Start anfordern',
        requirePinDesc: 'Schütze deine App mit einer 4-stelligen PIN.',
        setPin: 'PIN festlegen/ändern',
        setPinDesc: 'Speichert eine lokale 4-stellige Entsperr-PIN für den App-Start.',
        pinPlaceholder: '4 Ziffern eingeben',
        savePin: 'PIN speichern',
        clearPin: 'PIN entfernen',
        clearAiHistory: 'KI-Verlauf beim Beenden löschen',
        clearAiHistoryDesc:
            'Löscht automatisch alle KI-Chatverläufe, wenn die App geschlossen wird.',
        unlockTitle: 'CannaGuide entsperren',
        unlockDesc: 'Gib deine 4-stellige PIN ein, um fortzufahren.',
        unlockFailed: 'PIN falsch. Bitte erneut versuchen.',
        unlockButton: 'Entsperren',
    },
    about: {
        title: 'Über die App',
        projectInfo: 'Projekt-Infos & README',
        version: 'Version',
        whatsNew: {
            title: 'Was ist neu in v1.2',
            items: {
                simulation:
                    'IoT-Echtzeit-Dashboard mit Sparkline-Diagrammen, Gauge-Karten und Telemetrie-Panel fuer Live-Sensor-Monitoring.',
                strains:
                    'Taegliche Sorten jetzt mit personalisiertem Empfehlungs-Scoring und Match-Prozent-Badges basierend auf deiner Bibliothek.',
                help: '3D-GrowRoom-Visualisierung mit interaktiven OrbitControls, Auto-Orbit-Kamera und Live-IoT-Sensor-Badge-Overlay.',
                settings:
                    'E2E-Test-Optimierung: Hard-Waits durch Sichtbarkeits-Assertions ersetzt fuer schnellere, zuverlaessigere Testausfuehrung.',
            },
        },
        techStack: {
            title: 'Technologie-Stack',
            gemini: 'Treiber aller KI-Funktionen für intelligente Diagnosen und Ratschläge.',
            react: 'Für eine moderne, performante und reaktionsschnelle Benutzeroberfläche.',
            indexedDb: 'Robuste clientseitige Datenbank für 100% Offline-Funktionalität.',
            webWorkers: 'Lagert komplexe Simulationen aus, um die UI flüssig zu halten.',
        },
        credits: {
            title: 'Danksagungen & Links',
            phosphor: 'Icons bereitgestellt von Phosphor Icons.',
            seedfinder: 'Sorten- und Seedbank-Daten von SeedFinder.eu.',
            strainProviders:
                'Sorten-Anreicherung via Otreeba, Cannlytics, StrainAPI, CannSeek, OpenTHC, Cansativa und Kushy.',
            corsProxies: 'CORS-Proxy-Relay durch allorigins.win und corsproxy.io.',
            transformersJs:
                'On-Device NLP und Embeddings via Transformers.js (Xenova/Hugging Face).',
            webLlm: 'Lokale LLM-Inferenz via WebLLM (MLC AI).',
            onnx: 'ML-Runtime durch ONNX Runtime Web und TensorFlow.js.',
            radixUi: 'Barrierefreie UI-Primitiven von Radix UI.',
            recharts: 'Diagramm-Visualisierungen durch Recharts und D3.js.',
            tailwind: 'Utility-First-Styling durch Tailwind CSS.',
            sentry: 'Fehler-Tracking durch Sentry.',
            vite: 'Build-Tooling durch Vite und TurboRepo.',
        },
        githubLinkText: 'Projekt auf GitHub ansehen',
        aiStudioLinkText: 'Projekt im AI Studio forken',
        devJourney: {
            title: 'Entwicklungsweg',
            subtitle: 'Iterativ entwickelt mit KI-gestützter Entwicklung in 4 Phasen:',
            phase1Title: 'Prototyping',
            phase1Desc:
                'App-Grundgerüst und initiales Feature-Set mit Google Gemini 2.5 Pro & 3.1 Pro in Google AI Studio erstellt, dann nach GitHub exportiert.',
            phase2Title: 'Evaluation & Beratung',
            phase2Desc:
                'Kontinuierliche Architektur-Evaluation, Sicherheitsberatung und Qualitäts-Advisory durch xAI Grok 4.20 über den gesamten Entwicklungsprozess.',
            phase3Title: 'Kernentwicklung',
            phase3Desc:
                'Primäre Iteration und Verfeinerung in GitHub Codespaces mit VS Code Copilot powered by Claude Opus 4.6 — der Großteil der Feature-Entwicklung, Security-Hardening, Tests und CI/CD-Pipeline.',
            phase4Title: 'Deployment & Distribution',
            phase4Desc:
                'Produktions-Deployment auf GitHub Pages, Netlify PR-Previews, Docker-Container, Tauri Desktop und Capacitor Mobile Builds.',
            secondaryNote: 'Minimale Beiträge von GPT-4 Mini und GPT-5.3 Codex.',
        },
        disclaimer: {
            title: 'Haftungsausschluss',
            content:
                'Alle Informationen in dieser App dienen ausschließlich zu Bildungs- und Unterhaltungszwecken. Der Anbau von Cannabis unterliegt strengen gesetzlichen Bestimmungen. Bitte informieren Sie sich über die Gesetze in Ihrer Region und handeln Sie stets verantwortungsbewusst und im Einklang mit dem Gesetz.',
        },
        readmeContent: {
            header: `
          <h1>🌿 CannaGuide 2025 (Deutsch)</h1>
          <p><strong>Der definitive KI-gestützte Cannabis-Anbau-Begleiter</strong></p>
          <p>CannaGuide 2025 ist Ihr digitaler Co-Pilot für den gesamten Lebenszyklus des Cannabisanbaus. Entwickelt für sowohl neugierige Einsteiger als auch für erfahrene Meisterzüchter, führt Sie diese hochmoderne <strong>Progressive Web App (PWA)</strong> von der Samenauswahl bis zur perfekt ausgehärteten Ernte.</p>
        `,
            philosophyTitle: 'Projektphilosophie',
            philosophyContent: `
            <p>CannaGuide 2025 basiert auf einer Reihe von Kernprinzipien, die darauf ausgelegt sind, ein erstklassiges Erlebnis zu bieten:</p>
            <blockquote><strong>Offline First</strong>: Ihr Garten macht keine Pause, wenn Ihre Internetverbindung ausfällt. Die App ist so konzipiert, dass sie <strong>100% offline funktionsfähig</strong> ist.</blockquote>
            <blockquote><strong>Leistung ist entscheidend</strong>: Eine flüssige, reaktionsschnelle Benutzeroberfläche ist unerlässlich. Rechenintensive Aufgaben, wie die komplexe Pflanzensimulation, werden in einen <strong>Web Worker</strong> ausgelagert.</blockquote>
            <blockquote><strong>Datensouveränität</strong>: Ihre Daten gehören Ihnen. Die Möglichkeit, Ihren <strong>gesamten Anwendungszustand zu exportieren und zu importieren</strong>, gibt Ihnen vollständige Kontrolle.</blockquote>
            <blockquote><strong>KI als Co-Pilot</strong>: Wir nutzen KI nicht als Gimmick, sondern als leistungsstarkes Werkzeug, um <strong>umsetzbare, kontextbezogene Einblicke</strong> zu liefern.</blockquote>
        `,
            featuresTitle: 'Hauptfunktionen',
            featuresContent: `
            <h4>1. Der Grow Room (<code>Pflanzen</code>-Ansicht)</h4>
            <ul>
                <li><strong>Hochentwickelte Simulations-Engine</strong>: Erleben Sie eine Simulation, die auf <strong>VPD (Dampfdruckdefizit)</strong> basiert.</li>
                <li><strong>KI-gestützte Diagnose</strong>: Laden Sie ein Foto Ihrer Pflanze hoch, um eine sofortige KI-basierte Diagnose zu erhalten.</li>
                <li><strong>Umfassendes Protokoll</strong>: Verfolgen Sie jede Aktion in einem detaillierten, filterbaren Journal.</li>
            </ul>
            <h4>2. Die Sorten-Enzyklopädie (<code>Sorten</code>-Ansicht)</h4>
            <ul>
                <li><strong>Riesige Bibliothek</strong>: Greifen Sie auf detaillierte Informationen zu <strong>800+ Cannabissorten</strong> zu.</li>
                <li><strong>Interaktiver Stammbaum</strong>: Visualisieren Sie die vollständige genetische Abstammung jeder Sorte.</li>
                <li><strong>KI-Anbau-Tipps</strong>: Generieren Sie einzigartige, KI-gestützte Anbauratschläge für jede Sorte.</li>
            </ul>
            <h4>3. Die Werkstatt (<code>Ausrüstung</code>-Ansicht)</h4>
            <ul>
                <li><strong>Fortschrittlicher KI-Setup-Konfigurator</strong>: Erhalten Sie eine vollständige, markenspezifische Ausrüstungsliste von der Gemini-KI.</li>
                <li><strong>Suite von Rechnern</strong>: Greifen Sie auf eine umfassende Sammlung von Präzisionswerkzeugen zu.</li>
            </ul>
            <h4>4. Die Bibliothek (<code>Wissen</code>-Ansicht)</h4>
            <ul>
                <li><strong>Kontextsensitiver KI-Mentor</strong>: Stellen Sie dem KI-Mentor Anbaufragen, der die Daten Ihrer aktiven Pflanze für maßgeschneiderte Ratschläge nutzt.</li>
                <li><strong>Zuchtlabor</strong>: Kreuzen Sie Ihre hochwertigsten Samen, um völlig neue, <strong>permanente Hybridsorten</strong> zu erschaffen.</li>
                <li><strong>Interaktive Sandbox</strong>: Führen Sie risikofreie "Was-wäre-wenn"-Szenarien durch.</li>
            </ul>
            <h4>5. Das Hilfe-Center (<code>Hilfe</code>-Ansicht)</h4>
            <ul>
                <li>Umfassendes Benutzerhandbuch, durchsuchbare FAQ, Grower-Lexikon und visuelle Anleitungen.</li>
            </ul>
            <h4>6. Die Kommandozentrale (<code>Einstellungen</code>-Ansicht)</h4>
            <ul>
                <li>Passen Sie Themes, Schriftgrößen, Barrierefreiheitsoptionen und vieles mehr an.</li>
            </ul>
        `,
            techTitle: 'Technischer Deep Dive',
            techContent: `
            <h4>Schlüsseltechnologien</h4>
            <ul>
                <li><strong>Frontend</strong>: React 19 mit TypeScript</li>
                <li><strong>Zustandsverwaltung</strong>: Redux Toolkit</li>
                <li><strong>KI-Integration</strong>: Google Gemini API (<code>@google/genai</code>)</li>
                <li><strong>Asynchrone Operationen</strong>: RTK Query</li>
                <li><strong>Nebenläufigkeit</strong>: Web Workers</li>
                <li><strong>Datenpersistenz</strong>: IndexedDB</li>
                <li><strong>PWA & Offline</strong>: Service Workers</li>
                <li><strong>Styling</strong>: Tailwind CSS</li>
            </ul>
            <h4>Gemini-Service-Abstraktion (<code>geminiService.ts</code>)</h4>
            <p>Wie im <a href="https://deepwiki.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer">DeepWiki des Projekts</a> erwähnt, ist die Datei <code>geminiService.ts</code> eine entscheidende Komponente, die als zentrale Abstraktionsschicht für die gesamte Kommunikation mit der Google Gemini API fungiert. Dieses Design entkoppelt die API-Logik von den UI-Komponenten und der Redux-Zustandsverwaltung (RTK Query), was den Code sauberer, wartbarer und einfacher testbar macht.</p>
            <p><strong>Hauptverantwortlichkeiten & Methoden:</strong></p>
            <ul>
                <li><strong>Initialisierung & Kontext</strong>: Der Dienst initialisiert eine einzige <code>GoogleGenAI</code>-Instanz und formatiert automatisch Echtzeit-Pflanzendaten und Sprachanweisungen für jede Anfrage.</li>
                <li><strong>Strukturierte JSON-Ausgabe</strong>: Für Funktionen wie <code>getEquipmentRecommendation</code> und <code>diagnosePlant</code> nutzt der Dienst den JSON-Modus von Gemini mit einem <code>responseSchema</code>, um gültige, typsichere JSON-Objekte zu erzwingen.</li>
                <li><strong>Multimodale Eingabe (Vision)</strong>: Die <code>diagnosePlant</code>-Methode kombiniert ein Base64-Bild mit Text in einer mehrteiligen Anfrage, damit das <code>gemini-2.5-flash</code>-Modell sowohl visuelle als auch textuelle Daten analysieren kann.</li>
                <li><strong>Bilderzeugung</strong>: Die <code>generateStrainImage</code>-Methode verwendet das spezialisierte <code>gemini-2.5-flash-image</code>-Modell, um einzigartige Bilder für die KI-Anbau-Tipps zu erstellen.</li>
                <li><strong>Modellauswahl & Fehlerbehandlung</strong>: Der Dienst wählt intelligent zwischen <code>gemini-2.5-flash</code> und dem leistungsfähigeren <code>gemini-2.5-pro</code>. Jede Methode enthält robuste <code>try...catch</code>-Blöcke, die benutzerfreundliche Fehlermeldungen für die Benutzeroberfläche bereitstellen.</li>
            </ul>
        `,
            devTitle: 'Lokale Entwicklung (Entwicklerhandbuch)',
            devContent: `
            <h4>Voraussetzungen</h4>
            <ul>
                <li>Node.js (v18.x oder neuer)</li>
                <li>npm</li>
                <li>Ein Google Gemini API-Schlüssel</li>
            </ul>
            <h4>Installation & Einrichtung</h4>
            <ol>
                <li>Repository klonen: <code>git clone https://github.com/qnbs/CannaGuide-2025.git</code></li>
                <li>Abhängigkeiten installieren: <code>npm install</code></li>
            <li>Entwicklungsserver starten: <code>npm run dev</code></li>
            <li>Öffnen Sie Einstellungen → Allgemein & UI → KI-Sicherheit (Multi-Model BYOK) und speichern Sie den API-Key direkt in der App.</li>
            </ol>
        `,
            troubleshootingTitle: 'Fehlerbehebung',
            troubleshootingContent: `
            <ul>
            <li><strong>KI-Funktionen funktionieren nicht</strong>: Öffnen Sie Einstellungen → Allgemein & UI → KI-Sicherheit (Multi-Model BYOK), prüfen Sie den Key und stellen Sie sicher, dass ein Key auf diesem Gerät gespeichert ist.</li>
                <li><strong>App aktualisiert sich nicht</strong>: Dies kann am PWA-Caching liegen. Leeren Sie Ihre Browserdaten oder deregistrieren Sie den Service Worker in den Entwicklertools.</li>
            </ul>
        `,
            aiStudioTitle: 'Entwicklungsweg & Open Source',
            aiStudioContent: `
            <p>CannaGuide 2025 wurde in einem transparenten, iterativen KI-gestützten Entwicklungsprozess erstellt:</p>
            <ol>
                <li><strong>Prototyping</strong>: App-Grundgerüst und initiales Feature-Set mit <strong>Google Gemini 2.5 Pro & 3.1 Pro</strong> in <strong>Google AI Studio</strong> erstellt, dann nach GitHub exportiert.</li>
                <li><strong>Evaluation & Beratung</strong>: Kontinuierliche Architektur-Review, Sicherheitsberatung und Qualitätsführung durch <strong>xAI Grok 4.20</strong> über den gesamten Prozess.</li>
                <li><strong>Kernentwicklung</strong>: Primäre Iteration in <strong>GitHub Codespaces</strong> mit <strong>VS Code Copilot powered by Claude Opus 4.6</strong> — der Großteil der Feature-Verfeinerung, Security-Hardening, 1000 Tests, CI/CD und lokaler KI-Stack.</li>
                <li><strong>Deployment</strong>: Produktion via GitHub Pages, Netlify, Docker, Tauri v2 und Capacitor.</li>
            </ol>
            <p><em>Minimale Beiträge von GPT-4 Mini und GPT-5.3 Codex.</em></p>
            <p>Dieses Projekt ist vollständig Open Source. Tauchen Sie in den Code ein, forken Sie das Projekt oder tragen Sie auf GitHub bei.</p>
            <ul>
                <li><a href="https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-" target="_blank" rel="noopener noreferrer">Projekt in AI Studio forken</a></li>
                <li><a href="https://github.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer">Quellcode auf GitHub ansehen</a></li>
                <li><a href="https://deepwiki.com/qnbs/CannaGuide-2025/" target="_blank" rel="noopener noreferrer">Projekt-Dokumentation auf DeepWiki ansehen</a></li>
            </ul>
        `,
            contributingTitle: 'Mitwirken',
            contributingContent: `
            <p>Wir freuen uns über Beiträge aus der Community! Ob Sie einen Fehler beheben, eine neue Funktion hinzufügen oder Übersetzungen verbessern möchten, Ihre Hilfe ist willkommen.</p>
            <ol>
                <li><strong>Probleme melden</strong>: Wenn Sie einen Fehler finden oder eine Idee haben, eröffnen Sie bitte zuerst ein Issue auf GitHub, um es zu besprechen.</li>
                <li><strong>Änderungen vornehmen</strong>: Forken Sie das Repository, erstellen Sie einen neuen Branch, committen Sie Ihre Änderungen und erstellen Sie einen neuen Pull Request.</li>
            </ol>
        `,
            disclaimerTitle: 'Haftungsausschluss',
            disclaimerContent: `<p>Alle Informationen in dieser App dienen ausschließlich zu Bildungs- und Unterhaltungszwecken. Der Anbau von Cannabis unterliegt strengen gesetzlichen Bestimmungen. Bitte informieren Sie sich über die Gesetze in Ihrer Region und handeln Sie stets verantwortungsbewusst und im Einklang mit dem Gesetz.</p>`,
        },
    },
    communityShare: {
        title: 'Community Sorten-Teilen',
        description: 'Anonymes Teilen über GitHub Gist (leichtgewichtige Alternative zu IPFS).',
        exportButton: 'Eigene Sorten als anonymes Gist exportieren',
        gistPlaceholder: 'Gist-URL oder ID einfügen',
        importButton: 'Sorten aus Gist importieren',
        exportSuccess: 'Anonymes Gist erstellt.',
        exportError: 'Gist-Export fehlgeschlagen.',
        importSuccess_one: '1 Sorte importiert.',
        importSuccess_other: '{{count}} Sorten importiert.',
        importError: 'Gist-Import fehlgeschlagen.',
    },
    plugins: {
        title: 'Plugins',
        description:
            'Erweitere CannaGuide mit Düngeplänen, Hardware-Integrationen und Grow-Profilen.',
        installed: 'Installierte Plugins',
        noPlugins: 'Noch keine Plugins installiert.',
        install: 'Plugin installieren',
        uninstall: 'Deinstallieren',
        enable: 'Aktivieren',
        disable: 'Deaktivieren',
        importJson: 'Aus JSON importieren',
        exportJson: 'Als JSON exportieren',
        invalidManifest: 'Ungültiges Plugin-Manifest.',
        installSuccess: 'Plugin "{{name}}" erfolgreich installiert.',
        uninstallSuccess: 'Plugin "{{name}}" deinstalliert.',
        maxPluginsReached: 'Maximale Anzahl an Plugins erreicht.',
        categories: {
            'nutrient-schedule': 'Düngeplan',
            hardware: 'Hardware-Integration',
            'grow-profile': 'Grow-Profil',
        },
    },
    timeSeries: {
        title: 'Sensordaten-Speicher',
        description:
            'Sensormesswerte werden automatisch komprimiert: Rohdaten für 24 Stunden, Stundenmittel für 7 Tage und Tagesmittel unbegrenzt.',
        entryCount: '{{count}} Zeitreihen-Einträge gespeichert',
        compactionRun:
            'Komprimierung abgeschlossen: {{hourly}} stündliche, {{daily}} tägliche Aggregationen.',
        clearDevice: 'Daten für Gerät löschen',
        clearConfirm: 'Alle Sensordaten für dieses Gerät werden unwiderruflich gelöscht.',
    },
    predictiveAnalytics: {
        title: 'Prädiktive Analytik',
        description: 'KI-gestützte Vorhersagen basierend auf historischen Sensordaten.',
        botrytisRisk: 'Botrytis-Risiko',
        environmentAlerts: 'Umgebungs-Warnungen',
        yieldImpact: 'Ertragsauswirkung',
        noData: 'Keine Sensordaten für die Analyse verfügbar.',
        riskLevels: {
            low: 'Niedrig',
            moderate: 'Mittel',
            high: 'Hoch',
            critical: 'Kritisch',
        },
    },
    pwa: {
        installBannerTitle: 'CannaGuide installieren',
        installBannerDesc:
            'Fuege CannaGuide zu deinem Startbildschirm hinzu fuer Offline-Zugriff und ein natives App-Erlebnis.',
        installNow: 'Jetzt installieren',
        later: 'Spaeter',
        dontShowAgain: 'Nicht mehr anzeigen',
        offlineNotice: 'Du bist offline -- einige Funktionen sind moeglicherweise eingeschraenkt.',
        updateAvailable: 'Eine neue Version ist verfuegbar!',
        updateNow: 'Jetzt aktualisieren',
        installed: 'App installiert',
        notAvailable: 'Installation in diesem Browser nicht verfuegbar',
    },
}
