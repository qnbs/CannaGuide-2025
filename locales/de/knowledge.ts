export const knowledgeView = {
  title: 'Wissens-Hub',
  subtitle: 'Meistere die Kunst des Anbaus mit interaktiven Anleitungen und KI-gestützter Unterstützung.',
  tabs: {
    mentor: 'KI-Mentor',
    guide: 'Anleitung',
    archive: 'Archiv',
    breeding: 'Zuchtlabor',
  },
  aiMentor: {
    title: 'Sokratischer Gärtner',
    plantContext: 'Chatte mit dem KI-Mentor über {name}',
    plantContextSubtitle: 'Wähle eine deiner aktiven Pflanzen aus, um kontextbezogene Ratschläge zu erhalten.',
    inputPlaceholder: 'Stelle eine Frage zu deiner Pflanze...',
    startChat: 'Chat starten',
    clearChat: 'Chat löschen',
    clearConfirm: 'Möchtest du den gesamten Chatverlauf für diese Pflanze wirklich löschen?',
    showChart: '{chartName}-Diagramm anzeigen',
    examplePrompts: [
        'Was ist das größte Problem, das du siehst?',
        'Wie kann ich meinen Ertrag basierend auf diesen Daten verbessern?',
        'Erkläre mir meinen aktuellen VPD-Wert.',
        'Sollte ich mit dem Training beginnen?',
    ]
  },
  hub: {
    selectPlant: 'Pflanze auswählen',
    noPlants: 'Du hast keine aktiven Pflanzen. Starte einen Anbau, um den KI-Mentor zu nutzen.',
    todaysFocus: 'Heutiger Fokus für {plantName}',
    browseAll: 'Alle Anleitungen durchsuchen',
  },
  archive: {
    title: 'Mentor-Archiv',
    empty: 'Du hast noch keine Mentor-Antworten archiviert.',
    saveButton: 'Im Archiv speichern',
    saveSuccess: 'Antwort erfolgreich archiviert.',
    queryLabel: 'Deine Frage',
    editTitle: 'Antwort bearbeiten',
  },
  guide: {
    progress: 'Fortschritt',
  },
  breeding: {
    title: 'Zuchtlabor',
    description: 'Kreuzte zwei deiner gesammelten Samen, um eine neue, einzigartige Sorte zu erschaffen. Die Qualität der Eltern beeinflusst das Ergebnis.',
    noSeeds: 'Keine Samen gesammelt',
    noSeedsDesc: 'Samen können von Pflanzen gesammelt werden, die mit außergewöhnlich hoher Qualität geerntet wurden.',
    selectParentA: 'Elternteil A auswählen',
    selectParentB: 'Elternteil B auswählen',
    parentSelected: '{name} ausgewählt',
    newStrainPlaceholder: 'Name der neuen Sorte...',
    breedButton: 'Sorte züchten',
    breedSuccess: 'Neue Sorte "{name}" erfolgreich gezüchtet und zu "Meine Sorten" hinzugefügt!',
    quality: 'Qualität',
  },
  knowledgebase: {
    'phase1-prep': {
      title: 'Phase 1: Vorbereitung & Keimung',
      content: '<h3>Vorbereitung</h3><p>Der Schlüssel zu einem erfolgreichen Grow ist eine solide Vorbereitung. Stelle sicher, dass dein Zelt sauber ist, deine Lampen auf der richtigen Höhe hängen und deine Belüftung für einen konstanten, leichten Luftaustausch sorgt.</p><h3>Keimung</h3><p>Die Keimung ist der erste Schritt im Leben deiner Pflanze. Die Papiertuch-Methode ist beliebt: Lege den Samen zwischen zwei feuchte Papiertücher und halte sie warm und dunkel. Innerhalb weniger Tage sollte die Pfahlwurzel erscheinen.</p>'
    },
    'phase2-seedling': {
      title: 'Phase 2: Sämling',
      content: '<h3>Vorsicht ist geboten</h3><p>Sämlinge sind empfindlich. Sie benötigen hohe Luftfeuchtigkeit (60-70%) und moderates Licht (ca. 200-400 PPFD), um nicht zu verbrennen. Gieße sparsam um den Stängel herum, um die Wurzeln zu ermutigen, sich auszubreiten.</p>'
    },
    'phase3-vegetative': {
      title: 'Phase 3: Vegetatives Wachstum',
      content: '<h3>Zeit zu wachsen!</h3><p>In dieser Phase wächst die Pflanze rasant. Erhöhe die Lichtintensität (400-600 PPFD) und beginne mit einer stickstoffreichen Düngung. Dies ist auch die ideale Zeit für Trainingstechniken wie Topping oder LST, um die Struktur der Pflanze zu formen.</p>'
    },
    'phase4-flowering': {
      title: 'Phase 4: Blüte',
      content: '<h3>Die Blüte beginnt</h3><p>Stelle den Lichtzyklus auf 12/12 um, um die Blüte einzuleiten. Die Pflanze wird sich in den ersten Wochen strecken. Wechsle zu einem phosphor- und kaliumreichen Blütedünger (PK). Achte darauf, die Luftfeuchtigkeit zu senken (40-50%), um Schimmel zu vermeiden.</p>'
    },
    'phase5-harvest': {
      title: 'Phase 5: Ernte, Trocknen & Curen',
      content: '<h3>Der letzte Schliff</h3><p>Ernte, wenn die Trichome größtenteils milchig sind. Hänge die Zweige kopfüber in einem dunklen, kühlen Raum mit guter Luftzirkulation zum Trocknen auf (ca. 7-14 Tage). Anschließend lässt du die Blüten in luftdichten Gläsern aushärten (curen), die du täglich lüftest. Dies verbessert Geschmack und Potenz erheblich.</p>'
    },
    'fix-overwatering': {
      title: 'Problem: Überwässerung',
      content: '<h3>Symptome</h3><p>Herabhängende, schlaffe Blätter, die sich schwer und "voll" anfühlen. Die Erde bleibt lange feucht.</p><h3>Lösung</h3><p>Lass die Erde vollständig austrocknen, bevor du erneut gießt. Verbessere die Drainage im Topf und sorge für gute Belüftung, um die Verdunstung zu unterstützen.</p>'
    },
    'fix-calcium-deficiency': {
      title: 'Problem: Kalziummangel',
      content: '<h3>Symptome</h3><p>Rostbraune Flecken auf den Blättern, oft auf jüngeren Blättern beginnend. Verlangsamtes Wachstum.</p><h3>Lösung</h3><p>Verwende einen Cal-Mag-Zusatz. Stelle sicher, dass der pH-Wert deines Gießwassers im korrekten Bereich liegt (ca. 6.0-6.5 für Erde), da ein falscher pH-Wert die Kalziumaufnahme blockieren kann.</p>'
    }
  }
};

export const tipOfTheDay = {
    tips: [
        "Überprüfe täglich den pH-Wert deines Wassers. Er ist der Schlüssel zur Nährstoffaufnahme.",
        "Eine gute Luftzirkulation beugt Schimmel und Schädlingen vor.",
        "Weniger ist oft mehr, besonders bei der Düngung. Beginne mit einer geringeren Dosis als empfohlen.",
        "Low-Stress-Training (LST) kann deinen Ertrag erheblich steigern, ohne die Pflanze zu stressen.",
        "Beobachte die Farbe der Trichome, um den perfekten Erntezeitpunkt zu bestimmen: milchig für ein starkes High, bernsteinfarben für einen entspannenderen Effekt.",
        "Das Aushärten (Curing) ist entscheidend für den Geschmack und die Qualität deiner Ernte. Überspringe diesen Schritt nicht!",
        "Ein stabiles Klima ist wichtiger als hohe Temperaturen. Vermeide große Schwankungen."
    ],
    title: 'Tipp des Tages'
};