export const knowledgeView = {
  title: 'Grow-Anleitung',
  subtitle: 'Dein Wegweiser von der Vorbereitung bis zur Ernte.',
  tabs: {
    guide: 'Anleitung',
    archive: 'Wissens-Datenbank'
  },
  progress: 'Dein Fortschritt',
  stepsCompleted: '{completed} von {total} Schritten erledigt',
  aiMentor: {
    title: 'Frag den KI-Mentor',
    subtitle: 'Dein persönlicher Gartenbau-Wissenschaftler. Frag alles, von einfachen Grundlagen bis zu komplexen Anbau-Szenarien.',
    placeholder: 'z.B. Vergleiche LST vs. Topping für den Ertrag...',
    button: 'Mentor fragen',
    loading: 'Durchsuche gartenbauliche Archive...',
    examplePromptsTitle: 'Beispielfragen',
    examples: [
        'Erkläre Nährstoffsperre',
        'Wie erhöhe ich die Terpenproduktion?',
        'Vergleiche Erde vs. Hydroponik'
    ]
  },
  sections: {
    phase1: {
      title: 'Phase 1: Vorbereitung & Setup',
      subtitle: 'Der Grundstein für deinen Erfolg',
      p1_title: 'Der richtige Ort',
      p1_text: 'Wähle einen diskreten, sauberen Ort mit Zugang zu Strom und frischer Luft. Ein Schrank, ein ungenutztes Zimmer oder ein Keller sind ideal. Stelle sicher, dass der Bereich für die Blütephase absolut lichtdicht gemacht werden kann und einen guten Luftaustausch hat (Zuluft für frische Luft und Abluft).',
      p2_title: 'Ausrüstung zusammenstellen',
      p2_text: 'Nutze unseren Setup-Konfigurator im Bereich "Ausrüstung", um eine Einkaufsliste zu erstellen. Die wichtigsten Komponenten sind Zelt, Licht, Abluftsystem mit Aktivkohlefilter, Töpfe und eine Zeitschaltuhr. Vergiss nicht die Überwachungsinstrumente wie ein Thermometer/Hygrometer und ein pH/EC-Messgerät.',
      checklist: {
        c1: 'Diskreten Ort mit Stromanschluss finden.',
        c2: 'Growbox aufbauen und auf Lichteinfall prüfen.',
        c3: 'Lampe und Lüftungssystem installieren und testen.',
        c4: 'pH- und EC-Messgeräte kalibrieren, falls vorhanden.',
        c5: 'Zeitschaltuhr für die Lampe einstellen (18/6 Lichtzyklus).',
      },
      proTip: 'Meistere das Dampfdruckdefizit (VPD). Es ist die Beziehung zwischen Temperatur und Luftfeuchtigkeit, die bestimmt, wie gut deine Pflanze "atmet" (transpiriert). Ein optimaler VPD-Wert für jede Wachstumsphase führt zu schnellerem Wachstum und gesünderen Pflanzen. VPD-Tabellen sind online verfügbar!'
    },
    phase2: {
      title: 'Phase 2: Keimung & Sämling',
      subtitle: 'Der Start ins Leben (Woche 1-2)',
      p1_title: 'Samen keimen lassen',
      p1_text: 'Die Papiertuch-Methode ist beliebt: Lege die Samen zwischen zwei feuchte Papiertücher auf einen Teller und decke ihn ab. Halte sie warm (22-25°C) und dunkel. Nach 2-7 Tagen sollte eine Pfahlwurzel erscheinen. Alternativ kannst du direkt in einen Anzuchtstopfen oder dein Endmedium säen.',
      p2_title: 'Der Sämling',
      p2_text: 'Sobald die Pfahlwurzel 1-2 cm lang ist, pflanze den Samen vorsichtig ca. 0,5-1 cm tief in einen kleinen Topf mit Anzuchterde. Die ersten beiden runden Blätter sind die Keimblätter; die ersten "echten" Blätter werden gezackt sein. Halte die Beleuchtung sanft, um Streckung oder Verbrennung zu vermeiden.',
      checklist: {
        c1: 'Samen erfolgreich keimen lassen.',
        c2: 'Gekeimten Samen in einen kleinen Topf oder Anzuchtstopfen pflanzen.',
        c3: 'Für hohe Luftfeuchtigkeit (60-70%) mit einer Abdeckhaube sorgen.',
        c4: 'Überwässerung vermeiden und für gute Luftzirkulation sorgen.',
        c5: 'Den Sämling langsam an stärkeres Licht gewöhnen.',
      },
      proTip: 'Hüte dich vor der "Umfallkrankheit", einer Pilzinfektion, die Sämlinge am Stielgrund kollabieren lässt. Verhindere sie durch gute Luftzirkulation, Vermeidung von Überwässerung und die Verwendung eines sterilen Anzuchtmediums.'
    },
    phase3: {
      title: 'Phase 3: Wachstumsphase (Vegetation)',
      subtitle: 'Größe und Kraft aufbauen (Woche 3-7)',
      p1_title: 'Wachstumsschub',
      p1_text: 'In dieser Phase konzentriert sich die Pflanze auf das Wachstum von Blättern, Stängeln und Wurzeln und baut ihre "Solarpanel"-Fabrik auf. Sie benötigt viel Licht (18+ Stunden/Tag) und stickstoffreichen (N) Dünger. Topfe sie in einen größeren Topf um, wenn die Blätter die Ränder des aktuellen Topfes erreichen.',
      p2_title: 'Trainingstechniken',
      p2_text: 'Das Training formt die Pflanze, um ein gleichmäßiges Blätterdach zu schaffen, sodass alle Blütenstandorte optimales Licht erhalten, was den Ertrag drastisch erhöht. Techniken wie LST (Low Stress Training) oder Topping sollten begonnen werden, wenn die Pflanze 5-6 Nodien (Blattpaare) hat.',
      checklist: {
        c1: 'Bei Bedarf in den Endtopf umtopfen.',
        c2: 'Mit einem stickstoffreichen Wachstumsdünger beginnen.',
        c3: 'Regelmäßig gießen und das Medium dazwischen leicht antrocknen lassen.',
        c4: 'Trainingstechniken wie LST oder Topping anwenden.',
        c5: 'Auf Schädlinge und frühe Mangelerscheinungen achten.',
      },
      proTip: 'Topping (Abschneiden des Haupttriebs) erzeugt zwei Haupt-Colas und eine buschigere Pflanze. FIMing ("Fuck, I Missed"), eine Variante des Toppings, kann vier oder mehr Haupt-Colas hervorbringen und ist etwas weniger stressig für die Pflanze.'
    },
    phase4: {
      title: 'Phase 4: Blütephase',
      subtitle: 'Die Magie geschieht (Woche 8+)',
      p1_title: 'Blüte einleiten',
      p1_text: 'Bei photoperiodischen Pflanzen wird der Lichtzyklus auf 12 Stunden Licht / 12 Stunden Dunkelheit umgestellt. Dies signalisiert der Pflanze, die Blüte zu beginnen. In den ersten 2-3 Wochen wird sich die Pflanze erheblich strecken, manchmal verdoppelt sie ihre Höhe, bevor sie ihre Energie auf die Blütenproduktion konzentriert.',
      p2_title: 'Nährstoff- & Umweltwechsel',
      p2_text: 'Der Bedarf der Pflanze ändert sich. Sie benötigt jetzt weniger Stickstoff (N) und mehr Phosphor (P) und Kalium (K). Wechsle zu einem speziellen Blütedünger. Es ist entscheidend, die Luftfeuchtigkeit zu senken (40-50%), um Knospenfäule (Botrytis) zu vermeiden.',
      checklist: {
        c1: 'Lichtzyklus auf 12/12 umstellen.',
        c2: 'Auf einen Blütedünger umstellen.',
        c3: 'Luftfeuchtigkeit senken und für hervorragende Luftzirkulation um die Blüten sorgen.',
        c4: 'Schwere Äste stützen (Stäbe, Yo-Yos oder Netze).',
        c5: 'In den letzten 1-2 Wochen mit klarem Wasser spülen.',
      },
      proTip: 'Die 12-stündige Dunkelphase muss *ununterbrochen* sein. Selbst ein kleiner Lichteinfall von Geräten oder von außen kann die Pflanze stressen und dazu führen, dass sie männliche Blüten bildet (Hermaphroditismus) oder in die vegetative Phase zurückkehrt.'
    },
    phase5: {
      title: 'Phase 5: Ernte, Trocknung & Curing',
      subtitle: 'Die Belohnung für deine Mühe',
      p1_title: 'Das perfekte Erntefenster',
      p1_text: 'Der beste Indikator sind die Trichome (Harzdrüsen). Mit einer 60x-Lupe betrachtet: Klare Trichome sind unreif. Milchig/trübe Trichome deuten auf den Höhepunkt des THC-Gehalts und ein energetischeres High hin. Bernsteinfarbene Trichome bedeuten, dass THC zu CBN abgebaut wird, was zu einer sedierenderen, körperbetonten Wirkung führt. Die meisten ernten bei überwiegend trüben und etwa 10-20% bernsteinfarbenen Trichomen.',
      p2_title: 'Trocknung und Curing',
      p2_text: 'Hänge die Äste kopfüber in einem dunklen, kühlen Raum (ca. 18-20°C, 50-60% Luftfeuchtigkeit) für 7-14 Tage auf, bis kleinere Stängel knacken anstatt sich zu biegen. Schneide dann die Blüten ab und lege sie zum "Curing" (Aushärten) in luftdichte Gläser. "Lüfte" die Gläser in der ersten Woche täglich.',
      checklist: {
        c1: 'Trichome prüfen und den perfekten Erntezeitpunkt bestimmen.',
        c2: 'Pflanze ernten und einen ersten groben Schnitt durchführen (Wet Trim).',
        c3: 'Die Blüten langsam in einer kontrollierten Umgebung trocknen.',
        c4: 'Den finalen Schnitt durchführen (Dry Trim) und die Blüten zum Curen in Gläser füllen.',
        c5: 'Mindestens 2-4 Wochen curen und die Gläser regelmäßig lüften.',
      },
      proTip: 'Das Curing ist ein entscheidender wissenschaftlicher Prozess. Es ermöglicht den Abbau von Chlorophyll und Zuckern, was die Sanftheit, den Geschmack und das Aroma deines Endprodukts drastisch verbessert. Verwende kleine Hygrometer in deinen Curing-Gläsern, um die ideale Luftfeuchtigkeit von etwa 62% zu halten.'
    }
  },
  proTip: {
    title: 'Profi-Tipp',
    button: 'Tipp anzeigen',
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
  }
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