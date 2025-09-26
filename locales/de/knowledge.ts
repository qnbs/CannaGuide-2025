export const knowledgeView = {
  title: 'Wissen & Mentor',
  subtitle: 'Erweitere dein Wissen und erhalte KI-gestützte Ratschläge.',
  tabs: {
    guide: 'Anleitung',
    archive: 'Wissens-Datenbank'
  },
  progress: 'Dein Fortschritt',
  stepsCompleted: '{completed} von {total} Schritten erledigt',
  hub: {
      selectPlant: 'Wähle eine Pflanze',
      todaysFocus: 'Heutiger Fokus für {plantName}',
      noRelevantArticles: 'Keine spezifischen Artikel sind für {plantName} gerade relevant. Durchsuche die gesamte Bibliothek unten.',
      browseAll: 'Wissensdatenbank durchsuchen',
      searchPlaceholder: 'Artikel suchen...',
      noPlants: 'Starte einen neuen Anbau in der Pflanzen-Ansicht, um hier personalisierte Wissensartikel und den KI-Mentor zu nutzen.',
  },
  aiMentor: {
    title: 'KI-Pflanzen-Mentor',
    subtitle: 'Dein persönlicher Gartenbau-Wissenschaftler. Frag alles über eine bestimmte Pflanze.',
    plantContextSubtitle: 'Wähle eine Pflanze, um dem KI-Mentor Kontext zu geben und maßgeschneiderte Ratschläge zu erhalten.',
    placeholder: 'z.B. Vergleiche LST vs. Topping für den Ertrag...',
    askAboutPlant: 'Frage etwas über {name}...',
    startChat: 'Chat starten',
    clearChat: 'Chat löschen',
    startConversation: 'Beginne eine Konversation',
    button: 'Mentor fragen',
    loading: 'Durchsuche gartenbauliche Archive...',
    examplePromptsTitle: 'Beispielfragen',
    examplePrompts: {
        plantSpecific: {
            q1: 'Basierend auf den aktuellen Werten, was ist der wichtigste nächste Schritt für diese Pflanze?',
            q2: 'Sollte ich bei dieser Pflanze mit dem Training beginnen? Wenn ja, welche Methode?',
            q3: 'Gibt es Anzeichen für einen Mangel in den letzten Journaleinträgen?',
        }
    }
  },
  archive: {
    title: 'Wissens-Datenbank',
    empty: 'Deine gespeicherten Antworten vom KI-Mentor werden hier angezeigt.',
    saveButton: 'In Datenbank speichern',
    saveSuccess: 'Antwort in der Wissens-Datenbank gespeichert!',
    deleteConfirm: 'Möchtest du diese Antwort wirklich löschen?',
    deleteSuccess: 'Antwort gelöscht.',
    queryLabel: 'Deine Frage',
    editTitle: 'Antwort bearbeiten',
    updateSuccess: 'Antwort erfolgreich aktualisiert!',
  },
  knowledgebase: {
    'phase1-prep': {
        title: 'Phase 1: Vorbereitung & Setup',
        content: `<h3>Der richtige Ort</h3><p>Wähle einen diskreten, sauberen Ort mit Zugang zu Strom und frischer Luft. Ein Schrank, ein ungenutztes Zimmer oder ein Keller sind ideal. Stelle sicher, dass der Bereich für die Blütephase absolut lichtdicht gemacht werden kann und einen guten Luftaustausch hat.</p><h3>Ausrüstung zusammenstellen</h3><p>Nutze unseren Setup-Konfigurator im Bereich "Ausrüstung", um eine Einkaufsliste zu erstellen. Die wichtigsten Komponenten sind Zelt, Licht, Abluftsystem mit Aktivkohlefilter, Töpfe und eine Zeitschaltuhr.</p><h3>Profi-Tipp</h3><p>Meistere das Dampfdruckdefizit (VPD). Es ist die Beziehung zwischen Temperatur und Luftfeuchtigkeit, die bestimmt, wie gut deine Pflanze "atmet". Ein optimaler VPD-Wert für jede Wachstumsphase führt zu schnellerem Wachstum.</p>`
    },
    'phase2-seedling': {
        title: 'Phase 2: Keimung & Sämling',
        content: `<h3>Samen keimen lassen</h3><p>Die Papiertuch-Methode ist beliebt: Lege die Samen zwischen zwei feuchte Papiertücher. Halte sie warm (22-25°C) und dunkel. Nach 2-7 Tagen sollte eine Pfahlwurzel erscheinen.</p><h3>Der Sämling</h3><p>Sobald die Pfahlwurzel 1-2 cm lang ist, pflanze den Samen vorsichtig ca. 0,5-1 cm tief in Anzuchterde. Halte die Beleuchtung sanft, um Streckung zu vermeiden.</p><h3>Profi-Tipp</h3><p>Hüte dich vor der "Umfallkrankheit", einer Pilzinfektion. Verhindere sie durch gute Luftzirkulation und vermeide Überwässerung.</p>`
    },
    'phase3-vegetative': {
        title: 'Phase 3: Wachstumsphase (Vegetation)',
        content: `<h3>Wachstumsschub</h3><p>In dieser Phase konzentriert sich die Pflanze auf das Wachstum von Blättern, Stängeln und Wurzeln. Sie benötigt viel Licht (18+ Stunden/Tag) und stickstoffreichen (N) Dünger.</p><h3>Trainingstechniken</h3><p>Das Training formt die Pflanze, um ein gleichmäßiges Blätterdach zu schaffen, was den Ertrag drastisch erhöht. Techniken wie LST oder Topping sollten bei 5-6 Nodien begonnen werden.</p><h3>Profi-Tipp</h3><p>Topping (Abschneiden des Haupttriebs) erzeugt zwei Haupt-Colas und eine buschigere Pflanze. FIMing kann vier oder mehr Haupt-Colas hervorbringen.</p>`
    },
    'phase4-flowering': {
        title: 'Phase 4: Blütephase',
        content: `<h3>Blüte einleiten</h3><p>Bei photoperiodischen Pflanzen wird der Lichtzyklus auf 12/12 umgestellt. Dies signalisiert der Pflanze, die Blüte zu beginnen. In den ersten 2-3 Wochen wird sich die Pflanze erheblich strecken.</p><h3>Nährstoff- & Umweltwechsel</h3><p>Die Pflanze benötigt jetzt weniger Stickstoff (N) und mehr Phosphor (P) und Kalium (K). Wechsle zu einem Blütedünger. Senke die Luftfeuchtigkeit (40-50%), um Knospenfäule zu vermeiden.</p><h3>Profi-Tipp</h3><p>Die 12-stündige Dunkelphase muss *ununterbrochen* sein. Selbst ein kleiner Lichteinfall kann die Pflanze stressen.</p>`
    },
    'phase5-harvest': {
        title: 'Phase 5: Ernte, Trocknung & Curing',
        content: `<h3>Das perfekte Erntefenster</h3><p>Der beste Indikator sind die Trichome. Mit einer 60x-Lupe betrachtet: Klare Trichome sind unreif. Milchig/trübe Trichome deuten auf den Höhepunkt des THC-Gehalts hin. Bernsteinfarbene Trichome bedeuten, dass THC zu CBN abgebaut wird (sedierendere Wirkung).</p><h3>Trocknung und Curing</h3><p>Hänge die Äste kopfüber in einem dunklen, kühlen Raum (ca. 18-20°C, 50-60% LF) für 7-14 Tage auf. Lege die Blüten dann zum "Curing" in luftdichte Gläser.</p><h3>Profi-Tipp</h3><p>Das Curing ist entscheidend. Es ermöglicht den Abbau von Chlorophyll, was den Geschmack und das Aroma deines Endprodukts drastisch verbessert.</p>`
    },
    'fix-overwatering': {
        title: 'Wie man Überwässerung behebt',
        content: `<h3>Symptome</h3><p>Hängende, schwere Blätter, die sich nach unten krümmen, auch wenn die Erde nass ist. Der Topf fühlt sich schwer an. Das Wachstum ist verkümmert.</p><h3>Sofortmaßnahmen</h3><p>Stoppe sofort das Gießen. Verbessere die Luftzirkulation um die Basis der Pflanze. Wenn der Topf im Abflusswasser steht, entferne ihn.</p><h3>Langfristige Lösung</h3><p>Lass die obersten 5-7 cm der Erde vollständig austrocknen, bevor du wieder gießt. Hebe den Topf an, um sein Gewicht im trockenen und nassen Zustand zu fühlen. Verwende Töpfe mit guter Drainage (Stofftöpfe sind ausgezeichnet), um Staunässe zu vermeiden.</p>`
    },
    'fix-calcium-deficiency': {
        title: 'Wie man Kalziummangel behebt',
        content: `<h3>Symptome</h3><p>Zeigt sich zuerst an neuem Wachstum. Achte auf verkümmertes, langsames Wachstum mit kleinen, verkrüppelten oder verzerrten neuen Blättern. Die Ränder können braun werden oder absterben. Kann auch schwache Stängel verursachen.</p><h3>Sofortmaßnahmen</h3><p>Wende ein Cal-Mag-Ergänzungsmittel an. Stelle sicher, dass dein pH-Wert im richtigen Bereich liegt (6,0-6,5 für Erde), da eine pH-Sperre eine häufige Ursache ist.</p><h3>Langfristige Lösung</h3><p>Nimm regelmäßig ein Cal-Mag-Präparat in deinen Düngeplan auf, besonders wenn du Osmosewasser verwendest oder in Kokos anbaust. Überwache den pH-Wert genau.</p>`
    },
  },
};

export const tipOfTheDay = {
  title: "Tipp des Tages",
  tips: [
    "Überprüfe regelmäßig den pH-Wert deiner Nährlösung. Ein stabiler pH-Wert (normalerweise 6,0-6,5 in Erde) ist entscheidend für die Nährstoffaufnahme.",
    "Überwässere deine Pflanzen nicht! Hebe den Topf an, um sein Gewicht zu prüfen. Gieße nur, wenn er sich deutlich leichter anfühlt.",
    "Sorge mit einem kleinen Ventilator für eine gute Luftzirkulation. Das stärkt die Stängel und hilft, Schimmel vorzubeugen.",
    "Achte auf den Abstand zwischen deiner Lampe und dem Pflanzendach. Zu nah kann zu Lichtbrand führen; zu weit entfernt reduziert das Wachstum.",
    "Während der Blütephase ist die Luftfeuchtigkeit entscheidend. Versuche, sie unter 50% zu halten, um das Risiko von Knospenfäule zu minimieren.",
    "Weniger ist oft mehr bei Nährstoffen. Beginne mit der halben empfohlenen Dosis und beobachte die Reaktion deiner Pflanze, bevor du sie erhöhst.",
    "Cal/Mag-Zusätze sind oft notwendig, besonders bei LED-Beleuchtung und in Kokosfasern, um Mängel zu vermeiden.",
    "LST (Low Stress Training) ist eine anfängerfreundliche Methode, um den Ertrag zu steigern, indem Äste sanft nach unten gebogen werden.",
    "Die Farbe der Trichome ist der beste Indikator für den Erntezeitpunkt. Eine 60-fache Juwelierlupe ist eine lohnende Investition.",
    "Dokumentiere alles in deinem Journal! Notizen zu Bewässerung, Düngung und Beobachtungen sind für zukünftige Grows von unschätzbarem Wert.",
    "Sauberkeit ist der Schlüssel. Halte deinen Anbaubereich aufgeräumt, um das Risiko von Schädlingen und Krankheiten zu minimieren.",
    "Die Nachttemperaturen sollten nicht mehr als 10°C unter die Tagestemperaturen fallen, um die Pflanze nicht zu stressen.",
    "In der späten Blütephase kann das selektive Entfernen einiger großer Fächerblätter (Entlaubung) die Lichtdurchdringung zu den unteren Knospen verbessern.",
    "Spüle deine Pflanzen in den letzten 1-2 Wochen vor der Ernte nur mit klarem Wasser, um den endgültigen Geschmack zu verbessern.",
    "Das richtige Trocknen und Aushärten ist genauso wichtig wie der Anbau selbst. Nimm dir Zeit für diesen Prozess; es lohnt sich!",
    "Gelbe Klebefallen sind eine einfache und effektive Methode, um einen Befall von Trauermücken oder anderen fliegenden Schädlingen frühzeitig zu erkennen.",
    "Verwende Stofftöpfe, um gesündere Wurzeln durch besseren Sauerstoffaustausch (Luftschnitt) zu fördern.",
    "Lerne, die Blätter auf Anzeichen von Nährstoffmangel zu lesen. Eine Vergilbung von unten nach oben deutet oft auf einen Stickstoffmangel hin.",
    "Ein EC-Messgerät ist ein wertvolles Werkzeug zur genauen Kontrolle der Nährstoffkonzentration deiner Lösung.",
    "Sei geduldig! Der Anbau von Cannabis ist ein Prozess, der Zeit und Aufmerksamkeit erfordert. Jeder Fehler ist eine Lernmöglichkeit."
  ]
};