export const knowledgeView = {
  title: 'Grow-Anleitung',
  subtitle: 'Dein Wegweiser von der Vorbereitung bis zur Ernte.',
  tabs: {
    guide: 'Anleitung',
    database: 'Wissens-Datenbank'
  },
  progress: 'Dein Fortschritt',
  stepsCompleted: '{completed} von {total} Schritten erledigt',
  aiMentor: {
    title: 'Frag den KI-Mentor',
    subtitle: 'Hast du eine spezifische Frage zum Anbau? Stelle sie hier und erhalte eine detaillierte Antwort.',
    placeholder: 'z.B. Was ist der beste pH-Wert in der Blütephase?',
    button: 'Frage stellen',
    loading: 'Frage wird analysiert...',
  },
  sections: {
    phase1: {
      title: 'Phase 1: Vorbereitung & Setup',
      subtitle: 'Der Grundstein für deinen Erfolg',
      p1_title: 'Der richtige Ort',
      p1_text: 'Wähle einen diskreten Ort mit Zugang zu Strom und frischer Luft. Ein Kellerraum, eine Abstellkammer oder ein ungenutztes Zimmer sind ideal. Die Temperatur sollte stabil sein.',
      p2_title: 'Ausrüstung zusammenstellen',
      p2_text: 'Nutze unseren Setup-Konfigurator im Bereich "Ausrüstung", um eine Einkaufsliste zu erstellen. Die wichtigsten Komponenten sind Zelt, Licht, Abluft und Töpfe.',
      checklist: {
          'c1': 'Diskreten Ort mit Stromanschluss finden.',
          'c2': 'Growbox aufbauen.',
          'c3': 'Lampe und Abluftsystem installieren und testen.',
          'c4': 'Zeitschaltuhr für die Lampe einstellen.',
      },
      proTip: 'Investiere in ein gutes Abluftsystem mit Aktivkohlefilter. Es ist nicht nur für die Geruchskontrolle entscheidend, sondern auch für einen konstanten Luftaustausch, der Schimmel und Schädlinge vorbeugt.'
    },
    phase2: {
      title: 'Phase 2: Keimung & Sämling',
      subtitle: 'Der Start ins Leben (Woche 1-2)',
      p1_title: 'Samen keimen lassen',
      p1_text: 'Die Papiertuch-Methode ist beliebt: Lege die Samen zwischen zwei feuchte Papiertücher auf einen Teller und decke ihn ab. Halte sie warm (22-25°C) und dunkel. Nach 2-7 Tagen sollte eine kleine Wurzel sichtbar sein.',
      p2_title: 'Der Sämling',
      p2_text: 'Sobald die Wurzel ca. 1-2 cm lang ist, pflanze den Samen vorsichtig ca. 0.5-1 cm tief in einen kleinen Topf mit Anzuchterde. Halte die Erde feucht, aber nicht nass. Die Beleuchtung sollte jetzt auf 18 Stunden an / 6 Stunden aus eingestellt sein.',
      checklist: {
          'c1': 'Samen keimen lassen.',
          'c2': 'Gekeimten Samen in kleinen Topf pflanzen.',
          'c3': 'Für hohe Luftfeuchtigkeit (60-70%) sorgen, z.B. mit einem Mini-Gewächshaus.',
          'c4': 'Sämlinge nicht überwässern.'
      },
      proTip: 'Überwässere deine Sämlinge nicht! Dies ist der häufigste Fehler. Die kleinen Wurzeln können schnell faulen. Lass die Erde zwischen dem Gießen leicht antrocknen.'
    },
    phase3: {
      title: 'Phase 3: Wachstumsphase (Vegetation)',
      subtitle: 'Größe und Kraft aufbauen (Woche 3-7)',
      p1_title: 'Wachstumsschub',
      p1_text: 'In dieser Phase konzentriert sich die Pflanze auf das Wachstum von Blättern und Stängeln. Sie benötigt jetzt mehr Licht und Nährstoffe. Sobald die Pflanze größer als ihr Topf ist, sollte sie in den endgültigen Topf umgetopft werden.',
      p2_title: 'Trainingstechniken',
      p2_text: 'Techniken wie LST (Low Stress Training) oder Topping können jetzt angewendet werden, um einen buschigeren Wuchs und einen höheren Ertrag zu fördern. Beginne damit, wenn die Pflanze 5-6 Blattpaare hat.',
      checklist: {
          'c1': 'Pflanze bei Bedarf in den Endtopf umtopfen.',
          'c2': 'Mit der Düngung nach Herstellerangabe beginnen (halbe Dosis am Anfang).',
          'c3': 'Regelmäßig gießen, wenn die Erde trocken ist und auf den pH-Wert achten.',
          'c4': 'Trainingstechniken (z.B. LST) anwenden.'
      },
      proTip: 'Low Stress Training (LST) ist anfängerfreundlich und sehr effektiv. Biege den Haupttrieb sanft zur Seite und binde ihn fest. Dadurch werden die unteren Triebe angeregt, nach oben zu wachsen, was zu einem gleichmäßigeren Blätterdach und mehr Ertrag führt.'
    },
    phase4: {
      title: 'Phase 4: Blütephase',
      subtitle: 'Die Magie geschieht (Woche 8+)',
      p1_title: 'Blüte einleiten',
      p1_text: 'Um die Blüte einzuleiten, wird der Lichtzyklus auf 12 Stunden an / 12 Stunden aus umgestellt. Die Pflanze wird ihr Wachstum in den ersten Wochen noch fortsetzen ("Stretch") und dann beginnen, Blüten zu bilden.',
      p2_title: 'Nährstoffbedarf',
      p2_text: 'Der Nährstoffbedarf ändert sich. Die Pflanze benötigt jetzt mehr Phosphor (P) und Kalium (K). Verwende einen speziellen Blütedünger. Achte auf eine niedrigere Luftfeuchtigkeit (40-50%), um Schimmel zu vermeiden.',
      checklist: {
          'c1': 'Lichtzyklus auf 12/12 umstellen.',
          'c2': 'Auf Blütedünger umstellen und Cal/Mag ergänzen.',
          'c3': 'Luftfeuchtigkeit senken und für gute Luftzirkulation sorgen.',
          'c4': 'Die letzten 1-2 Wochen nur mit Wasser spülen.'
      },
      proTip: 'In den letzten 1-2 Wochen vor der Ernte solltest du aufhören zu düngen und nur noch mit klarem Wasser spülen. Dies verbessert den Geschmack und die Qualität des Endprodukts erheblich.'
    },
    phase5: {
      title: 'Phase 5: Ernte, Trocknung & Curing',
      subtitle: 'Die Belohnung für deine Mühe',
      p1_title: 'Der richtige Erntezeitpunkt',
      p1_text: 'Der beste Indikator sind die Trichome (die kleinen Harzdrüsen). Mit einer Lupe betrachtet, sollten die meisten milchig-trüb und einige bernsteinfarben sein. Sind sie noch klar, ist es zu früh. Sind sie alle bernsteinfarben, wird die Wirkung sehr sedierend.',
      p2_title: 'Trocknung und Curing',
      p2_text: 'Schneide die Äste ab und hänge sie kopfüber in einem dunklen, kühlen Raum (ca. 18-20°C, 50-60% Luftfeuchtigkeit) für 7-14 Tage auf. Danach kommen die trockenen Blüten zur "Fermentation" (Curing) in luftdichte Gläser. Lüfte die Gläser in der ersten Woche täglich. Dieser Schritt ist entscheidend für Qualität, Geschmack und Wirkung.',
      checklist: {
          'c1': 'Trichome prüfen und ernten.',
          'c2': 'Pflanze kopfüber an einem dunklen, kühlen Ort aufhängen.',
          'c3': 'Blüten in Gläsern curen und regelmäßig lüften.',
          'c4': 'Geduld haben - gutes Curing dauert mindestens 2-4 Wochen.'
      },
      proTip: 'Die ideale Luftfeuchtigkeit für das Curing liegt bei 62%. Verwende kleine Hygrometer in deinen Gläsern oder spezielle Feuchtigkeitspacks (z.B. Boveda), um perfekte Ergebnisse zu erzielen.'
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