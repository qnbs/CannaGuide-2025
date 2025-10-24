export const settingsView = {
  title: 'Einstellungen',
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
    },
    fontSize: 'Schriftgröße',
    fontSizes: {
      sm: 'Klein',
      base: 'Standard',
      lg: 'Groß',
    },
    defaultView: 'Standard-Startansicht',
    installApp: 'App installieren',
    installAppDesc: 'Installiere den CannaGuide 2025 auf deinem Gerät für ein natives App-Erlebnis, inklusive Offline-Zugriff.',
    uiDensity: 'UI-Dichte',
    uiDensities: {
        comfortable: 'Komfortabel',
        compact: 'Kompakt'
    },
    dyslexiaFont: 'Legastheniker-freundliche Schrift',
    dyslexiaFontDesc: 'Verwendet die Schriftart Atkinson Hyperlegible für verbesserte Lesbarkeit.',
    reducedMotion: 'Bewegung reduzieren',
    reducedMotionDesc: 'Deaktiviert oder reduziert Animationen und bewegungsbasierte Effekte.',
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
      confirmationSound: 'Bestätigungstöne',
      confirmationSoundDesc: 'Spielt einen kurzen Ton ab, wenn ein Sprachbefehl erfolgreich erkannt wurde.',
    },
    commands: {
        title: 'Befehlsreferenz',
        description: 'Hier ist eine Liste von Befehlen, die du verwenden kannst. Beginne einfach mit "Gehe zu..." oder "Suche nach...".',
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
        sortDirection: 'Sortierrichtung'
    },
    listView: {
        title: 'Listenansicht-Anpassung',
        description: 'Passe die Spalten an, die in der Listenansicht angezeigt werden.'
    },
    advanced: {
        title: 'Erweiterte Funktionen',
        genealogyLayout: 'Standard-Stammbaum-Layout',
        genealogyDepth: 'Standard-Stammbaum-Tiefe',
        aiTipsExperience: 'Standard-Erfahrung für KI-Tipps',
        aiTipsFocus: 'Standard-Fokus für KI-Tipps'
    }
  },
  plants: {
    title: 'Pflanzen & Simulation',
    behavior: 'Simulationsverhalten',
    physics: 'Fortgeschrittene Simulationsphysik (Experte)',
    showArchived: 'Abgeschlossene Grows anzeigen',
    showArchivedDesc: 'Zeigt fertige/geerntete Pflanzen im Dashboard an.',
    autoGenerateTasks: 'Aufgaben automatisch erstellen',
    autoGenerateTasksDesc: 'Erstellt automatisch Aufgaben für Aktionen wie Gießen.',
    realtimeSimulation: 'Echtzeit-Simulation',
    realtimeSimulationDesc: 'Die Pflanzensimulation läuft im Hintergrund weiter.',
    speedMultiplier: 'Simulations-Geschwindigkeit',
    autoJournaling: 'Automatisches Journaling',
    logStageChanges: 'Phasenwechsel protokollieren',
    logProblems: 'Probleme protokollieren',
    logTasks: 'Aufgaben protokollieren',
    simulationProfile: 'Simulationsprofil',
    simulationProfiles: {
      beginner: 'Anfänger',
      intermediate: 'Fortgeschritten',
      expert: 'Experte',
    },
    pestPressure: 'Schädlingsdruck',
    pestPressureDesc: 'Die Basiswahrscheinlichkeit für das Auftreten von Schädlingsereignissen.',
    nutrientSensitivity: 'Nährstoffempfindlichkeit',
    nutrientSensitivityDesc: 'Wie stark die Pflanze auf Nährstoffungleichgewichte reagiert.',
    environmentalStability: 'Umweltstabilität',
    environmentalStabilityDesc: 'Wie stark Temperatur und Luftfeuchtigkeit schwanken.',
    leafTemperatureOffset: 'Blatt-Temperatur-Offset (°C)',
    leafTemperatureOffsetDesc: 'Simuliert, wie viel kühler (negativ) oder wärmer (positiv) die Blätter im Vergleich zur Umgebungsluft sind. Beeinflusst direkt die VPD-Berechnung.',
    lightExtinctionCoefficient: 'Lichtdurchdringung (k-Wert)',
    lightExtinctionCoefficientDesc: 'Steuert, wie gut Licht durch das Blätterdach dringt. Ein niedrigerer Wert bedeutet eine bessere Durchdringung. Beeinflusst die Photosynthese der unteren Blätter.',
    nutrientConversionEfficiency: 'Nährstoff-Umwandlungseffizienz',
    nutrientConversionEfficiencyDesc: 'Wie effizient die Pflanze aufgenommene Nährstoffe in Biomasse umwandelt. Ein höherer Wert bedeutet mehr Wachstum bei gleicher Nährstoffmenge.',
    stomataSensitivity: 'Stomata-Empfindlichkeit',
    stomataSensitivityDesc: 'Steuert, wie schnell die Pflanze ihre Spaltöffnungen (Stomata) bei hohem VPD schließt, um Wasser zu sparen. Ein höherer Wert bedeutet eine höhere Trockenheitstoleranz.',
  },
  notifications: {
    title: 'Benachrichtigungen',
    enableAll: 'Alle Benachrichtigungen aktivieren',
    stageChange: 'Phasenwechsel',
    problemDetected: 'Problem erkannt',
    harvestReady: 'Ernte bereit',
    newTask: 'Neue Aufgabe',
    lowWaterWarning: 'Warnung bei niedrigem Wasserstand',
    phDriftWarning: 'pH-Drift-Warnung',
    quietHours: 'Ruhezeiten',
    enableQuietHours: 'Ruhezeiten aktivieren',
    quietHoursDesc: 'Benachrichtigungen werden während dieser Zeit stummgeschaltet.',
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
    importDataDesc: 'Stelle eine App-Sicherung aus einer JSON-Datei wieder her. Dies überschreibt alle aktuellen Daten.',
    importConfirmTitle: 'Import bestätigen',
    importConfirmText: 'Sind Sie sicher? Alle Ihre aktuellen Daten werden durch den Inhalt der ausgewählten Datei ersetzt. Diese Aktion kann nicht rückgängig gemacht werden.',
    importConfirmButton: 'Importieren & Überschreiben',
    importSuccess: 'Daten erfolgreich importiert. Die App wird neu geladen.',
    importError: 'Import fehlgeschlagen. Bitte stellen Sie sicher, dass es sich um eine gültige Backup-Datei handelt.',
    totalUsage: 'Gesamtnutzung',
    lastBackup: 'Letztes Backup',
    noBackup: 'Noch kein Backup erstellt',
    autoBackup: 'Automatische Sicherung',
    backupOptions: {
        off: 'Aus',
        daily: 'Täglich',
        weekly: 'Wöchentlich',
    },
    cloudSync: 'Cloud-Synchronisation',
    cloudSyncDesc: 'Synchronisiere deine Daten mit Google Drive (zukünftige Funktion).',
    replayOnboarding: 'Einführung erneut anzeigen',
    replayOnboardingConfirm: 'Dadurch wird die Willkommens-Einführung beim nächsten App-Start angezeigt. Fortfahren?',
    replayOnboardingSuccess: 'Die Einführung wird beim nächsten Start angezeigt.',
    resetPlants: 'Pflanzen zurücksetzen',
    resetPlantsConfirm: 'Möchtest du wirklich alle deine aktuellen Pflanzen löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
    resetPlantsSuccess: 'Alle Pflanzen wurden zurückgesetzt.',
    resetAll: 'Alle App-Daten zurücksetzen',
    resetAllConfirm: 'WARNUNG: Dadurch werden alle deine Pflanzen, Einstellungen, Favoriten und eigenen Sorten endgültig gelöscht. Bist du absolut sicher?',
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
    storageUsage: 'Speichernutzung',
    storageBreakdown: {
        plants: 'Pflanzendaten & Journale',
        images: 'Gespeicherte Fotos',
        archives: 'KI-Archive',
        customStrains: 'Eigene Sorten',
        savedItems: 'Gespeicherte Items',
    }
  },
  privacy: {
    title: 'Privatsphäre & Sicherheit',
    requirePin: 'PIN beim Start anfordern',
    requirePinDesc: 'Schütze deine App mit einer 4-stelligen PIN.',
    setPin: 'PIN festlegen/ändern',
    clearAiHistory: 'KI-Verlauf beim Beenden löschen',
    clearAiHistoryDesc: 'Löscht automatisch alle KI-Chatverläufe, wenn die App geschlossen wird.',
  },
   about: {
      title: 'Über die App',
      projectInfo: 'Projekt-Infos & README',
      version: 'Version',
      whatsNew: {
        title: "Was ist neu in v2.0",
        items: {
            simulation: "Fortschrittliche Simulations-Engine: Basiert auf VPD, Biomasse und einem strukturellen Wachstumsmodell.",
            genealogy: "Interaktiver Stammbaum: Visualisiere die genetische Abstammung und den Einfluss von Vorfahren.",
            ai: "KI-Anbau-Tipps & Bildgenerierung: Erhalte einzigartige, KI-gestützte Ratschläge und Bilder für jede Sorte.",
            breeding: "Zuchtlabor & Sandbox: Kreuze neue Sorten und führe risikofreie 'Was-wäre-wenn'-Experimente durch."
        }
      },
      techStack: {
        title: "Technologie-Stack",
        gemini: "Treiber aller KI-Funktionen für intelligente Diagnosen und Ratschläge.",
        react: "Für eine moderne, performante und reaktionsschnelle Benutzeroberfläche.",
        indexedDb: "Robuste clientseitige Datenbank für 100% Offline-Funktionalität.",
        webWorkers: "Lagert komplexe Simulationen aus, um die UI flüssig zu halten."
      },
      credits: {
          title: "Danksagungen & Links",
          phosphor: "Icons bereitgestellt von Phosphor Icons.",
      },
      githubLinkText: 'Projekt auf GitHub ansehen',
      aiStudioLinkText: 'Projekt im AI Studio forken',
      disclaimer: {
        title: 'Haftungsausschluss',
        content: 'Alle Informationen in dieser App dienen ausschließlich zu Bildungs- und Unterhaltungszwecken. Der Anbau von Cannabis unterliegt strengen gesetzlichen Bestimmungen. Bitte informieren Sie sich über die Gesetze in Ihrer Region und handeln Sie stets verantwortungsbewusst und im Einklang mit dem Gesetz.'
      },
      readmeContent: {
        header: `
          <h1>🌿 CannaGuide 2025 (Deutsch)</h1>
          <p><strong>Der definitive KI-gestützte Cannabis-Anbau-Begleiter</strong></p>
          <p>CannaGuide 2025 ist Ihr digitaler Co-Pilot für den gesamten Lebenszyklus des Cannabisanbaus. Entwickelt für sowohl neugierige Einsteiger als auch für erfahrene Meisterzüchter, führt Sie diese hochmoderne <strong>Progressive Web App (PWA)</strong> von der Samenauswahl bis zur perfekt ausgehärteten Ernte.</p>
        `,
        philosophyTitle: "Projektphilosophie",
        philosophyContent: `
            <p>CannaGuide 2025 basiert auf einer Reihe von Kernprinzipien, die darauf ausgelegt sind, ein erstklassiges Erlebnis zu bieten:</p>
            <blockquote><strong>Offline First</strong>: Ihr Garten macht keine Pause, wenn Ihre Internetverbindung ausfällt. Die App ist so konzipiert, dass sie <strong>100% offline funktionsfähig</strong> ist.</blockquote>
            <blockquote><strong>Leistung ist entscheidend</strong>: Eine flüssige, reaktionsschnelle Benutzeroberfläche ist unerlässlich. Rechenintensive Aufgaben, wie die komplexe Pflanzensimulation, werden in einen <strong>Web Worker</strong> ausgelagert.</blockquote>
            <blockquote><strong>Datensouveränität</strong>: Ihre Daten gehören Ihnen. Die Möglichkeit, Ihren <strong>gesamten Anwendungszustand zu exportieren und zu importieren</strong>, gibt Ihnen vollständige Kontrolle.</blockquote>
            <blockquote><strong>KI als Co-Pilot</strong>: Wir nutzen KI nicht als Gimmick, sondern als leistungsstarkes Werkzeug, um <strong>umsetzbare, kontextbezogene Einblicke</strong> zu liefern.</blockquote>
        `,
        featuresTitle: "Hauptfunktionen",
        featuresContent: `
            <h4>1. Der Grow Room (<code>Pflanzen</code>-Ansicht)</h4>
            <ul>
                <li><strong>Hochentwickelte Simulations-Engine</strong>: Erleben Sie eine Simulation, die auf <strong>VPD (Dampfdruckdefizit)</strong> basiert.</li>
                <li><strong>KI-gestützte Diagnose</strong>: Laden Sie ein Foto Ihrer Pflanze hoch, um eine sofortige KI-basierte Diagnose zu erhalten.</li>
                <li><strong>Umfassendes Protokoll</strong>: Verfolgen Sie jede Aktion in einem detaillierten, filterbaren Journal.</li>
            </ul>
            <h4>2. Die Sorten-Enzyklopädie (<code>Sorten</code>-Ansicht)</h4>
            <ul>
                <li><strong>Riesige Bibliothek</strong>: Greifen Sie auf detaillierte Informationen zu <strong>700+ Cannabissorten</strong> zu.</li>
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
        techTitle: "Technischer Deep Dive",
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
        devTitle: "Lokale Entwicklung (Entwicklerhandbuch)",
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
                <li>Erstellen Sie eine <code>.env</code>-Datei und fügen Sie Ihren API-Schlüssel hinzu: <code>VITE_API_KEY=DEIN_GEMINI_API_SCHLÜSSEL</code></li>
                <li>Entwicklungsserver starten: <code>npm run dev</code></li>
            </ol>
        `,
        troubleshootingTitle: "Fehlerbehebung",
        troubleshootingContent: `
            <ul>
                <li><strong>KI-Funktionen funktionieren nicht</strong>: Stellen Sie sicher, dass Ihr Gemini API-Schlüssel in der <code>.env</code>-Datei korrekt eingerichtet ist.</li>
                <li><strong>App aktualisiert sich nicht</strong>: Dies kann am PWA-Caching liegen. Leeren Sie Ihre Browserdaten oder deregistrieren Sie den Service Worker in den Entwicklertools.</li>
            </ul>
        `,
        aiStudioTitle: "Entwicklung mit AI Studio & Open Source",
        aiStudioContent: `
            <p>Diese Anwendung wurde vollständig mit <strong>Googles AI Studio</strong> entwickelt. Der gesamte Prozess, vom anfänglichen Projekt-Setup bis zur Implementierung komplexer Funktionen, wurde durch iterative Anweisungen in natürlicher Sprache gesteuert.</p>
            <p>Dieses Projekt ist zudem vollständig Open Source. Tauchen Sie in den Code ein, forken Sie das Projekt oder tragen Sie auf GitHub bei. Erleben Sie aus erster Hand, wie natürliche Sprache anspruchsvolle Anwendungen erstellen kann.</p>
            <ul>
                <li><a href="https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-" target="_blank" rel="noopener noreferrer">Projekt in AI Studio forken</a></li>
                <li><a href="https://github.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer">Quellcode auf GitHub ansehen</a></li>
                <li><a href="https://deepwiki.com/qnbs/CannaGuide-2025/" target="_blank" rel="noopener noreferrer">Projekt-Dokumentation auf DeepWiki ansehen</a></li>
            </ul>
        `,
        contributingTitle: "Mitwirken",
        contributingContent: `
            <p>Wir freuen uns über Beiträge aus der Community! Ob Sie einen Fehler beheben, eine neue Funktion hinzufügen oder Übersetzungen verbessern möchten, Ihre Hilfe ist willkommen.</p>
            <ol>
                <li><strong>Probleme melden</strong>: Wenn Sie einen Fehler finden oder eine Idee haben, eröffnen Sie bitte zuerst ein Issue auf GitHub, um es zu besprechen.</li>
                <li><strong>Änderungen vornehmen</strong>: Forken Sie das Repository, erstellen Sie einen neuen Branch, committen Sie Ihre Änderungen und erstellen Sie einen neuen Pull Request.</li>
            </ol>
        `,
        disclaimerTitle: "Haftungsausschluss",
        disclaimerContent: `<p>Alle Informationen in dieser App dienen ausschließlich zu Bildungs- und Unterhaltungszwecken. Der Anbau von Cannabis unterliegt strengen gesetzlichen Bestimmungen. Bitte informieren Sie sich über die Gesetze in Ihrer Region und handeln Sie stets verantwortungsbewusst und im Einklang mit dem Gesetz.</p>`
      }
    }
};