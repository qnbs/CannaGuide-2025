export const common = {
    save: 'Speichern',
    cancel: 'Abbrechen',
    close: 'Schließen',
    back: 'Zurück',
    next: 'Weiter',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    export: 'Exportieren',
    downloadAgain: 'Erneut herunterladen',
    all: 'Alle',
    none: 'Keine',
    name: 'Name',
    type: 'Typ',
    typeDetails: 'Typ-Details',
    genetics: 'Genetik',
    description: 'Beschreibung',
    actions: 'Aktionen',
    page: 'Seite',
    generated: 'Generiert',
    loadMore: 'Weitere laden...',
    regenerate: 'Neu generieren',
    confirm: 'Bestätigen',
    exportConfirm: 'Möchten Sie diese Daten wirklich exportieren?',
    removeImage: 'Bild entfernen',
    unchanged: 'Unverändert',
    noDataToExport: 'Keine Daten zum Exportieren.',
    successfullyExported_one: '1 Element erfolgreich als {{format}} exportiert.',
    successfullyExported_other: '{{count}} Elemente erfolgreich als {{format}} exportiert.',
    installPwa: 'App installieren',
    installPwaSuccess: 'App erfolgreich installiert!',
    installPwaDismissed: 'Installation abgelehnt.',
    offlineWarning: 'Du bist derzeit offline. Einige Funktionen sind möglicherweise nicht verfügbar.',
    preparingGuide: 'Dein Guide wird vorbereitet...',
    error: 'Fehler',
    deepDive: 'Deep Dive',
    saveToJournal: 'Im Journal speichern',
    search: 'Suche',
    editor: {
        bold: 'Fett',
        italic: 'Kursiv',
        list: 'Liste',
    },
    notes: 'Notizen',
    units: {
        weeks: 'Wochen',
        days: 'Tage',
        hours: 'Stunden',
        minutes: 'Minuten',
        h_day: 'h/Tag',
        price_kwh: '€/kWh',
        currency_eur: '€',
        g_w: 'g/W',
        watt: 'Leistung',
    },
    aromas: {},
    terpenes: {},
    simulationErrors: {
        invalidSetup: 'Ungültige Anbau-Setup-Konfiguration. Bitte versuchen Sie es erneut.',
        invalidActionData: 'Ungültige Daten für Aktion übermittelt: {{action}}.',
    },
    metadataDescription: 'Ihr KI-gestützter digitaler Begleiter für den gesamten Cannabis-Anbauzyklus.<ul><li>Verfolgen Sie Pflanzen</li><li>Erkunden Sie über 500 Sorten</li><li>Erhalten Sie KI-Ausrüstungsberatung</li><li>Meistern Sie Ihren Anbau mit einem interaktiven Leitfaden.</li></ul>',
    voiceControl: {
        listening: 'Höre zu...',
        processing: 'Verarbeite: "{{transcript}}"',
        toggle: 'Sprachsteuerung umschalten',
        errors: {
            generic: 'Ein Fehler bei der Spracherkennung ist aufgetreten.',
            noSpeech: 'Keine Sprache erkannt.',
            notAllowed: 'Mikrofonzugriff verweigert.',
            startFailed: 'Zuhören konnte nicht gestartet werden.',
        },
    },
};

export const nav = {
    strains: 'Sorten',
    plants: 'Pflanzen',
    equipment: 'Ausrüstung',
    knowledge: 'Wissen',
    settings: 'Einstellungen',
    help: 'Hilfe',
};

export const plantStages = {
    SEED: 'Samen',
    GERMINATION: 'Keimung',
    SEEDLING: 'Sämling',
    VEGETATIVE: 'Wachstum',
    FLOWERING: 'Blüte',
    HARVEST: 'Ernte',
    DRYING: 'Trocknung',
    CURING: 'Fermentierung',
    FINISHED: 'Fertig',
};

export const problemMessages = {
    nutrientDeficiency: { message: 'Nährstoffmangel erkannt' },
    overwatering: { message: 'Überwässerung erkannt' },
    underwatering: { message: 'Unterwässerung erkannt' },
    pestInfestation: { message: 'Schädlingsbefall erkannt' },
};

export const ai = {
    error: {
        generic: 'Ein KI-Fehler ist aufgetreten. Bitte versuche es erneut.',
        equipment: 'Ausrüstungsempfehlung konnte nicht generiert werden.',
        diagnostics: 'Pflanzendiagnose konnte nicht generiert werden.',
        tips: 'Sorten-Tipps konnten nicht generiert werden.',
        deepDive: 'Deep Dive konnte nicht generiert werden.',
        unknown: 'Ein unbekannter KI-Fehler ist aufgetreten.'
    },
    advisor: 'KI-Berater',
    getAdvice: 'Rat einholen',
    diagnostics: 'Diagnose starten',
    generating: 'KI denkt nach...',
    disclaimer: 'KI-generierter Inhalt. Überprüfe kritische Informationen immer.',
    prompts: {
        equipmentSystemInstruction: 'Du bist ein Experte für Cannabis-Anbauberatung. Der Benutzer gibt seine Einschränkungen an und du lieferst eine vollständige Ausrüstungsliste im JSON-Format. Gib spezifische, reale Produktnamen und einen geschätzten Preis in Euro an. Deine Begründung sollte prägnant und hilfreich sein.',
        equipmentRequest: 'Ich möchte einen Anbau für {{plantCount}} Pflanzen in einem {{tentSize}} Zelt mit einem {{budget}} Budget einrichten.',
        equipmentRequestAdvanced: 'Generiere eine vollständige Cannabis-Anbau-Ausrüstungsliste für ein Setup in Europa (Preise in EUR). Das Setup sollte für {{plantCount}} Pflanzen in einer Anbaufläche von {{growSpaceWidth}}cm x {{growSpaceDepth}}cm ausgelegt sein. Der Erfahrungsgrad des Benutzers ist "{{experienceLevel}}", also empfiehl bitte entsprechende Ausrüstung. Sie bevorzugen den Anbau von "{{floweringTypePreference}}"-Pflanzen. Das Gesamtbudget beträgt ungefähr {{budget}}€. Die Hauptprioritäten für diesen Anbau sind: {{priorities}}. Passe deine Empfehlungen an, um diese Ziele zu optimieren. Berücksichtige außerdem die spezifische Anfrage des Benutzers: "{{customNotes}}".',
        advisor: 'Du bist ein Experte für Cannabis-Anbauberatung. Basierend auf den folgenden Pflanzendaten, gib prägnante, umsetzbare Ratschläge für die nächsten 24-48 Stunden. Formatiere deine Antwort als einfaches Markdown.\n\n{{plant}}',
        proactiveDiagnosis: 'Du bist ein Experte für Pflanzenpathologie mit Spezialisierung auf Cannabis. Analysiere den folgenden vollständigen Pflanzendatenbericht. Identifiziere mögliche zugrunde liegende Probleme oder Risiken, die nicht sofort offensichtlich sind. Liefere einen prägnanten Bericht mit Titel und Inhalt im Markdown-Format, der deine Ergebnisse und präventiven Empfehlungen darlegt.\n\n{{plant}}',
        mentor: {
            main: 'Kontext: \n{{context}}\n\nBenutzeranfrage: "{{query}}"',
            systemInstruction: 'Du bist ein freundlicher und sachkundiger Mentor für den Cannabisanbau. Dein Name ist Kai. Du gibst hilfreiche, prägnante und ermutigende Ratschläge. Antworte nur im JSON-Format. Die Antwort muss ein "title"-, ein "content"-Feld (markdown-formatiert) und ein optionales "uiHighlights"-Array von Objekten mit "elementId" (string) und optionaler "plantId" (string) enthalten. Hebe für deine Antwort relevante UI-Elemente hervor (z.B. vpd-gauge, ph-vital).',
        },
        strainTips: 'Gib strukturierte, prägnante Anbautipps für die Sorte: {{strain}}. Der Fokus des Benutzers liegt auf "{{focus}}", sein Erfahrungslevel ist "{{experienceLevel}}", und er fragt nach der "{{stage}}"-Phase. Antworte nur im JSON-Format mit den Schlüsseln: "nutrientTip", "trainingTip", "environmentalTip", "proTip".',
        strainImage: 'Erstelle eine fantastische, künstlerische Darstellung der Cannabis-Sorte "{{strainName}}". Dies ist eine {{type}}-Sorte, die für ihre {{aromas}}-Aromen bekannt ist. Ihre Wirkung wird oft als {{description_snippet}} beschrieben. Die Pflanze ist für ihren {{agronomic_yield}}-Ertrag bekannt und wird {{agronomic_height}} hoch. Schaffe ein visuell beeindruckendes und fantasievolles Kunstwerk, das die *Essenz* dieser Merkmale auf eine subtile, künstlerische Weise einfängt. Zum Beispiel könnte ein \'Hoher\' Ertrag durch ein Gefühl von Fülle dargestellt werden und eine \'Hohe\' Wuchshöhe durch vertikale Elemente in der Komposition. Stelle diese Merkmale nicht wörtlich dar. Erstelle kein fotorealistisches Bild einer Cannabisblüte. Stelle dir stattdessen ein abstraktes Konzept oder eine Fantasielandschaft vor, die von ihren Eigenschaften inspiriert ist. Der Stil sollte lebendig, unvergesslich und für einen Premium-Guide geeignet sein.',
        deepDive: 'Generiere einen Deep Dive Guide zum Thema "{{topic}}" im Kontext der folgenden Pflanze: {{plant}}. Antworte im JSON-Format mit den Schlüsseln: "introduction" (string), "stepByStep" (Array von Strings), "prosAndCons" ({pros: string[], cons: string[]}), und "proTip" (string).',
    },
    loading: {
        equipment: {
            '1': 'Analysiere deine Prioritäten und dein Budget...',
            '2': 'Wähle die optimale Beleuchtung für {{priorities}} aus...',
            '3': 'Berechne die Belüftungsanforderungen für {{plantCount}} Pflanzen...',
            '4': 'Stimme Nährstoffe und Medium auf einen {{experienceLevel}}-Grower ab...',
            '5': 'Stelle deine individuelle Ausrüstungsliste zusammen...'
        },
        diagnostics: {
            '1': 'Analysiere das Bild auf Verfärbungen und Textur...',
            '2': 'Vergleiche mit den Vitalwerten der Pflanze...',
            '3': 'Konsultiere die Datenbank für mögliche Probleme...',
            '4': 'Formuliere Sofortmaßnahmen und langfristige Lösungen...'
        },
        advisor: {
            '1': 'Überprüfe die neuesten Vitalwerte von {{plantName}}...',
            '2': 'Prüfe das aktuelle Wachstumsstadium und Alter...',
            '3': 'Formuliere maßgeschneiderte Ratschläge für die nächsten 48 Stunden...'
        },
        proactiveDiagnosis: {
            '1': 'Analysiere historische Daten für {{plantName}}...',
            '2': 'Identifiziere Trends bei pH und EC...',
            '3': 'Suche nach frühen Anzeichen von Umweltstress...',
            '4': 'Stelle präventive Pflegeempfehlungen zusammen...'
        },
        growTips: {
            '1': 'Analysiere die genetischen Merkmale von {{strainName}}...',
            '2': 'Passe die Tipps für einen Züchter mit {{experienceLevel}}-Erfahrung an...',
            '3': 'Fokussiere die Empfehlungen auf {{focus}} für die {{stage}}-Phase...',
            '4': 'Erstelle umsetzbare, strukturierte Ratschläge...'
        },
        deepDive: {
            '1': 'Recherchiere zu "{{topic}}"...',
            '2': 'Wende Konzepte auf den aktuellen Zustand von {{plantName}} an...',
            '3': 'Strukturiere eine Schritt-für-Schritt-Anleitung...',
            '4': 'Stelle Vor- und Nachteile sowie einen speziellen Profi-Tipp zusammen...'
        }
    }
};