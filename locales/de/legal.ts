export const legal = {
    ageGate: {
        title: 'Altersverifikation erforderlich',
        subtitle: 'Diese Anwendung enthält Inhalte zum Thema Cannabis-Anbau.',
        body: 'Gemäß dem deutschen Cannabisgesetz (KCanG) ist der Zugang auf Personen ab 18 Jahren beschränkt. Mit dem Fortfahren bestätigst du, dass du mindestens 18 Jahre alt bist und der Cannabis-Anbau an deinem Standort legal ist.',
        confirm: 'Ich bin 18 oder älter',
        deny: 'Ich bin unter 18',
        denied: 'Der Zugang zu dieser Anwendung ist auf Personen ab 18 Jahren beschränkt.',
    },
    geoLegal: {
        title: 'Rechtlicher Hinweis',
        body: 'Die Gesetze zum Cannabis-Anbau variieren je nach Land und Region. Diese App ist für die Nutzung in Rechtsgebieten konzipiert, in denen der private Cannabis-Anbau legal ist (z.B. Deutschland gemäß KCanG). Überprüfe immer die geltenden Gesetze an deinem Standort, bevor du Cannabis anbaust.',
        dismiss: 'Verstanden',
    },
    privacyPolicy: {
        title: 'Datenschutzerklärung',
        lastUpdated: 'Zuletzt aktualisiert: {{date}}',
        sections: {
            overview: {
                title: 'Überblick',
                content: 'CannaGuide 2025 ist eine Privacy-First-Anwendung. Alle deine Daten werden lokal auf deinem Gerät gespeichert. Wir betreiben keine Server, die deine persönlichen Daten sammeln oder speichern.',
            },
            dataStorage: {
                title: 'Datenspeicherung',
                content: 'Alle Anbau-Protokolle, Pflanzendaten, Einstellungen und Präferenzen werden ausschließlich in der IndexedDB und im localStorage deines Browsers gespeichert. Es werden keine Daten an unsere Server übertragen.',
            },
            aiServices: {
                title: 'KI-Dienste (Optional)',
                content: 'Wenn du KI-Funktionen nutzt, werden deine Anfragen und optional hochgeladene Bilder direkt von deinem Browser an den von dir gewählten KI-Anbieter gesendet (z.B. Google Gemini, OpenAI, Anthropic, xAI). Dein API-Key wird lokal mit AES-256-GCM verschlüsselt und verlässt dein Gerät niemals unverschlüsselt. Wir haben keinen Zugang zu deinen API-Keys oder KI-Konversationen.',
            },
            imageProcessing: {
                title: 'Bildverarbeitung',
                content: 'Bilder, die für die KI-Pflanzendiagnose hochgeladen werden, werden über Canvas neu kodiert, um EXIF-/GPS-Metadaten vor der Übertragung zu entfernen. Der Bild-Upload erfordert deine ausdrückliche Zustimmung.',
            },
            cookies: {
                title: 'Cookies & Lokale Speicherung',
                content: 'Diese App verwendet keine Tracking-Cookies. Wir nutzen localStorage und IndexedDB ausschließlich für die App-Funktionalität (Einstellungen, Pflanzendaten, Zustimmungs-Flags). Es werden keine Analyse- oder Drittanbieter-Tracking-Tools eingesetzt.',
            },
            thirdParty: {
                title: 'Drittanbieter-Dienste',
                content: 'Die einzigen externen Verbindungen sind: (1) Google Fonts für Typografie, (2) KI-Anbieter-APIs, wenn du KI-Funktionen mit deinem eigenen API-Key aktivierst. Es werden keine Daten an Werbetreibende oder Analyse-Anbieter weitergegeben.',
            },
            rights: {
                title: 'Deine Rechte (DSGVO)',
                content: 'Da alle Daten lokal gespeichert werden, hast du die volle Kontrolle. Du kannst alle Daten über die Einstellungen exportieren oder alle Daten durch das Löschen deines Browser-Speichers entfernen. Eine Anfrage an uns ist nicht erforderlich.',
            },
            contact: {
                title: 'Kontakt',
                content: 'Bei datenschutzrelevanten Fragen erstelle bitte ein Issue im GitHub-Repository des Projekts.',
            },
        },
    },
    consent: {
        title: 'Datenschutz-Einwilligung',
        body: 'Diese App speichert Daten lokal auf deinem Gerät (IndexedDB & localStorage) um deine Pflanzen, Einstellungen und Anbau-Protokolle zu sichern. Es werden keine Daten an externe Server gesendet, es sei denn, du nutzt explizit KI-Funktionen mit deinem eigenen API-Key.',
        accept: 'Akzeptieren & Fortfahren',
        learnMore: 'Datenschutzerklärung',
        required: 'Die Einwilligung ist erforderlich, um diese App zu nutzen.',
    },
    impressum: {
        title: 'Impressum',
        content: 'CannaGuide 2025 ist ein Open-Source-Projekt auf GitHub. Dies ist eine nicht-kommerzielle, bildungsbezogene Anwendung. Für nicht-kommerzielle private Projekte ist kein Impressum gemäß § 5 TMG erforderlich.',
    },
    imageConsent: {
        banner: 'Das Bild wird an deinen ausgewählten KI-Anbieter zur Analyse gesendet. EXIF-/GPS-Metadaten werden vor der Übertragung automatisch entfernt.',
        accept: 'Ich verstehe und stimme zu',
        accepted: 'Zustimmung erteilt',
        revoke: 'Bild-Zustimmung widerrufen',
        revoked: 'Bild-Zustimmung widerrufen. Du wirst vor dem nächsten Upload erneut gefragt.',
    },
    medicalDisclaimer: 'Dies ist kein medizinischer Rat. Konsultiere immer einen qualifizierten Fachmann für gesundheitsbezogene Entscheidungen.',
}
