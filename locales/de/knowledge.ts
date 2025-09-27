export const knowledgeView = {
  title: 'Wissens-Hub',
  subtitle: 'Meistere die Kunst des Anbaus, von den Grundlagen bis zu fortgeschrittenen Techniken.',
  tabs: {
    mentor: 'KI-Mentor',
    guide: 'Grow-Guide',
    archive: 'Mentor-Archiv',
    breeding: 'Zuchtlabor',
  },
  aiMentor: {
    title: 'KI-Mentor',
    plantContextSubtitle: 'Wähle eine deiner aktiven Pflanzen aus, um kontextbezogene Fragen zu stellen.',
    startChat: 'Chat starten',
    askAboutPlant: 'Frage etwas über {name}...',
    startConversation: 'Starte eine Konversation mit deinem KI-Mentor.',
    examplePrompts: {
      general: {
        q1: 'Erkläre mir das Dampfdruckdefizit (VPD).',
        q2: 'Was sind die Vor- und Nachteile von LED- gegenüber HPS-Lampen?',
        q3: 'Wie erstelle ich einen lebendigen Boden (Living Soil)?'
      },
      plantSpecific: {
        q1: 'Welche Nährstoffe benötigt diese Pflanze in ihrer aktuellen Phase?',
        q2: 'Ist jetzt ein guter Zeitpunkt für das Topping?',
        q3: 'Basierend auf ihrer Genetik, welche Terpene sind wahrscheinlich dominant?'
      }
    },
    clearChat: 'Chatverlauf löschen',
  },
  hub: {
    selectPlant: 'Pflanze für Kontext auswählen',
    noPlants: 'Du hast keine aktiven Pflanzen. Starte einen Anbau, um den kontextbezogenen KI-Mentor und den Wissens-Hub zu nutzen.',
    todaysFocus: 'Heutiger Fokus für {plantName}',
    noRelevantArticles: 'Keine speziell relevanten Artikel für den aktuellen Zustand von {plantName}.',
    browseAll: 'Alle Artikel durchsuchen',
    searchPlaceholder: 'Artikel durchsuchen...',
  },
  archive: {
    title: 'Mentor-Archiv',
    empty: 'Du hast noch keine Antworten archiviert. Speichere wichtige Ratschläge deines Mentors, um sie hier zu finden.',
    queryLabel: 'Deine Frage',
    saveButton: 'Antwort archivieren',
    saveSuccess: 'Antwort erfolgreich archiviert.',
    editTitle: 'Antwort bearbeiten',
  },
  breeding: {
    title: 'Zuchtlabor',
    description: 'Kreuzt zwei deiner gesammelten Samen, um eine neue, einzigartige Sorte zu erschaffen. Samen werden von Ernten mit einer Qualität von über 90% gesammelt.',
    noSeeds: 'Keine Samen gesammelt',
    noSeedsDesc: 'Du hast noch keine hochwertigen Samen von deinen Ernten gesammelt. Erziele eine Endqualität von über 90%, um einen Samen zu erhalten.',
    selectParentA: 'Elternteil A auswählen',
    selectParentB: 'Elternteil B auswählen',
    newStrainName: 'Name der neuen Sorte',
    newStrainPlaceholder: 'z.B. Sonnenschein Traum',
    breedButton: 'Züchten',
    quality: 'Qualität',
    parentSelected: '{name} ausgewählt',
    breedSuccess: 'Neue Sorte "{name}" erfolgreich gezüchtet und zu "Meine Sorten" hinzugefügt!',
  },
  knowledgebase: {
    'phase1-prep': {
        title: 'Phase 1: Vorbereitung & Ausrüstung',
        content: `<h3>Willkommen im Grow Guide!</h3><p>Der Erfolg deines Anbaus beginnt lange bevor der Samen die Erde berührt. Eine sorgfältige Planung und die richtige Ausrüstung sind entscheidend.</p><h3>Schlüsselfaktoren:</h3><ul><li><strong>Zelt:</strong> Wähle eine Größe, die zu deinem Platz und der Anzahl der Pflanzen passt. Ein 80x80 cm Zelt ist ein guter Startpunkt für 1-2 Pflanzen.</li><li><strong>Licht:</strong> Moderne LED-Lampen sind energieeffizient und produzieren weniger Wärme. Für den Anfang sind 150-250W eine gute Wahl.</li><li><strong>Abluft & Umluft:</strong> Ein Abluftventilator mit Aktivkohlefilter ist entscheidend, um Gerüche zu neutralisieren und für Frischluft zu sorgen. Ein kleiner Clip-Ventilator sorgt für eine sanfte Brise und stärkt die Stängel.</li><li><strong>Substrat & Töpfe:</strong> Hochwertige Cannabis-Erde in Stofftöpfen (ca. 11-19 Liter) bietet eine gute Belüftung für die Wurzeln.</li></ul>`
    },
    'phase2-seedling': {
        title: 'Phase 2: Keimung & Sämling',
        content: `<h3>Der Start ins Leben</h3><p>Diese Phase ist die empfindlichste. Dein Ziel ist es, eine stabile und sanfte Umgebung zu schaffen.</p><h3>Schlüsselfaktoren:</h3><ul><li><strong>Keimung:</strong> Die Papiertuch-Methode ist zuverlässig. Lege den Samen zwischen zwei feuchte Papiertücher und halte sie dunkel und warm (ca. 22-25°C).</li><li><strong>Einpflanzen:</strong> Sobald die Pfahlwurzel ca. 1-2 cm lang ist, pflanze sie vorsichtig etwa 0,5-1 cm tief in die Erde, mit der Wurzel nach unten.</li><li><strong>Umgebung:</strong> Sämlinge lieben hohe Luftfeuchtigkeit (65-80%). Eine Plastikkuppel kann dabei helfen. Die Temperatur sollte stabil bei 22-26°C liegen.</li><li><strong>Bewässerung:</strong> Halte die Erde feucht, aber nicht nass. Eine Sprühflasche ist ideal, um Überwässerung zu vermeiden.</li></ul>`
    },
    'phase3-vegetative': {
        title: 'Phase 3: Das vegetative Wachstum',
        content: `<h3>Jetzt geht es richtig los!</h3><p>In dieser Phase konzentriert sich die Pflanze auf das Wachstum von Blättern, Stängeln und Wurzeln. Jetzt ist die Zeit für Training und eine stickstoffreiche Ernährung.</p><h3>Schlüsselfaktoren:</h3><ul><li><strong>Licht:</strong> 18 Stunden Licht und 6 Stunden Dunkelheit sind der Standard (18/6).</li><li><strong>Nährstoffe:</strong> Beginne mit einer halben Dosis eines stickstoffreichen (N) Wachstumsdüngers. Beobachte die Pflanze und passe die Dosis langsam an.</li><li><strong>Training:</strong> Techniken wie Topping (das Kappen der Hauptspitze) oder LST (Low Stress Training, das Herunterbinden von Ästen) fördern ein buschigeres Wachstum und mehr Blütenansätze.</li><li><strong>Umgebung:</strong> Die Luftfeuchtigkeit kann jetzt langsam auf 50-60% gesenkt werden.</li></ul>`
    },
    'phase4-flowering': {
        title: 'Phase 4: Die Blütephase',
        content: `<h3>Die Magie beginnt</h3><p>Durch die Umstellung des Lichtzyklus auf 12 Stunden Licht und 12 Stunden Dunkelheit (12/12) signalisierst du der Pflanze, dass es Zeit ist, Blüten zu produzieren.</p><h3>Schlüsselfaktoren:</h3><ul><li><strong>Lichtumstellung:</strong> Der Wechsel zu 12/12 ist der Auslöser für die Blüte. Absolute Dunkelheit während der Nachtphase ist entscheidend!</li><li><strong>Der "Stretch":</strong> In den ersten 2-3 Wochen der Blüte wird die Pflanze sich stark strecken und kann ihre Höhe verdoppeln.</li><li><strong>Nährstoffe:</strong> Wechsle zu einem Blütedünger, der reich an Phosphor (P) und Kalium (K) ist. Reduziere langsam den Stickstoff.</li><li><strong>Umgebung:</strong> Senke die Luftfeuchtigkeit auf 40-50%, um Schimmelbildung in den dichten Blüten zu vermeiden.</li></ul>`
    },
    'phase5-harvest': {
        title: 'Phase 5: Ernte, Trocknung & Curing',
        content: `<h3>Die Belohnung deiner Arbeit</h3><p>Geduld in dieser letzten Phase ist der Schlüssel zur Maximierung von Geschmack und Potenz.</p><h3>Schlüsselfaktoren:</h3><ul><li><strong>Erntezeitpunkt:</strong> Der beste Indikator sind die Trichome (die Harzdrüsen). Ernte, wenn die meisten milchig-weiß sind, mit einigen bernsteinfarbenen Trichomen für eine entspannendere Wirkung.</li><li><strong>Trocknung:</strong> Hänge die manikürten Zweige kopfüber in einem dunklen, kühlen Raum (ca. 18-20°C) mit einer Luftfeuchtigkeit von 50-60% auf. Dies sollte 7-14 Tage dauern. Die Zweige sollten knicken, aber nicht brechen.</li><li><strong>Curing (Aushärtung):</strong> Lege die trockenen Blüten in luftdichte Gläser. Öffne die Gläser in der ersten Woche täglich für einige Minuten ("Burping"), um Feuchtigkeit entweichen zu lassen. Dieser Prozess (mindestens 2-4 Wochen) baut Chlorophyll ab und verbessert Geschmack und Aroma drastisch.</li></ul>`
    },
    'fix-overwatering': {
      title: 'Problembehebung: Überwässerung',
      content: `<h3>Symptome</h3><p>Überwässerte Pflanzen sehen schlaff und welk aus, aber die Blätter fühlen sich fest an und krümmen sich nach unten (Krallenform). Die Erde ist dauerhaft nass und schwer.</p><h3>Lösung</h3><ol><li><strong>Gießen stoppen:</strong> Gib der Pflanze Zeit zum Austrocknen. Hebe den Topf an, um das Gewicht zu fühlen. Gieße erst wieder, wenn er sich deutlich leichter anfühlt.</li><li><strong>Belüftung verbessern:</strong> Sorge für eine gute Luftzirkulation um den Topf, um die Verdunstung zu fördern. Ein kleiner Ventilator, der auf den Topf gerichtet ist, kann helfen.</li><li><strong>Drainage prüfen:</strong> Stelle sicher, dass dein Topf genügend Drainagelöcher hat und nicht im Wasser steht.</li></ol><h3>Pro-Tipp</h3><p>Verwende Stofftöpfe (Fabric Pots). Sie fördern die Belüftung der Wurzelzone und machen Überwässerung fast unmöglich, da überschüssiges Wasser durch das Gewebe entweichen kann.</p>`
    },
    'fix-calcium-deficiency': {
      title: 'Problembehebung: Kalziummangel',
      content: `<h3>Symptome</h3><p>Kalziummangel zeigt sich oft an jungen, oberen Blättern. Symptome sind kleine, rostige oder braune nekrotische Flecken, oft mit einem gelben Rand. Das neue Wachstum kann verkümmert oder verdreht sein.</p><h3>Ursachen & Lösung</h3><ol><li><strong>pH-Wert prüfen:</strong> Kalzium wird am besten bei einem pH-Wert von 6.2-6.8 in Erde aufgenommen. Ein zu niedriger pH-Wert ist die häufigste Ursache. Messe den pH-Wert deines Gießwassers und des Abflusswassers.</li><li><strong>Cal-Mag verwenden:</strong> Füge deinem Gießwasser ein Kalzium-Magnesium-Präparat (Cal-Mag) hinzu. Beginne mit der halben empfohlenen Dosis.</li><li><strong>Substratwahl:</strong> Bei Verwendung von Kokossubstrat oder Umkehrosmosewasser ist eine regelmäßige Cal-Mag-Gabe fast immer notwendig.</li></ol><h3>Pro-Tipp</h3><p>Einige Züchter geben eine Prise Dolomitkalk in ihre Erdmischung, um eine langsame und stetige Versorgung mit Kalzium und Magnesium über den gesamten Zyklus sicherzustellen.</p>`
    },
  }
};

export const tipOfTheDay = {
  title: 'Tipp des Tages',
  tips: [
    "Das Dampfdruckdefizit (VPD) ist wichtiger als nur Temperatur und Luftfeuchtigkeit allein. Optimiere es für maximale Wachstumsraten.",
    "Verwende Stofftöpfe statt Plastiktöpfe. Sie fördern die Belüftung der Wurzeln und verhindern Ringwurzelbildung.",
    "Weniger ist oft mehr, besonders bei Nährstoffen. Beginne mit einer halben Dosis und beobachte deine Pflanze.",
    "Eine gute Luftzirkulation unter dem Blätterdach hilft, Schimmel und Schädlinge zu vermeiden.",
    "Lerne, das Gewicht deiner Töpfe zu fühlen. Das ist der beste Weg, um zu wissen, wann du gießen musst.",
    "Investiere in ein gutes pH-Messgerät. Der richtige pH-Wert ist entscheidend für die Nährstoffaufnahme.",
    "Spüle deine Pflanzen in den letzten 1-2 Wochen vor der Ernte nur mit Wasser, um den Geschmack zu verbessern.",
    "Geduld beim Trocknen und Curen ist der Schlüssel zu einem erstklassigen Endprodukt. Dieser Schritt wird oft überstürzt.",
    "Dokumentiere alles in deinem Journal. Es wird dir helfen, aus Fehlern zu lernen und Erfolge zu wiederholen.",
    "Mykorrhiza-Pilze können die Nährstoffaufnahme deiner Wurzeln drastisch verbessern. Füge sie deinem Substrat hinzu."
  ]
};