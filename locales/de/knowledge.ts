export const knowledgeView = {
  title: 'Wissens-Hub',
  subtitle: 'Vertiefe dein Wissen mit kontextbezogenen Artikeln und dem KI-Mentor.',
  aiMentor: {
    title: 'KI-Mentor',
    plantContextSubtitle: 'Wähle eine deiner aktiven Pflanzen aus, um eine Chat-Sitzung mit dem KI-Mentor zu starten. Der Mentor wird den Kontext deiner Pflanze (Alter, Phase, etc.) für präzisere Ratschläge nutzen.',
    startChat: 'Chat starten',
    startConversation: 'Starte eine Konversation, indem du unten eine Frage eingibst.',
    askAboutPlant: 'Frage etwas über {name}...',
    clearChat: 'Chatverlauf löschen',
    examplePrompts: {
      general: {
        q1: 'Was ist der Unterschied zwischen Topping und FIMing?',
        q2: 'Erkläre VPD und warum es wichtig ist.',
        q3: 'Wie spüle ich meine Pflanzen vor der Ernte richtig?',
      },
      plantSpecific: {
        q1: 'Was sind die idealen Umweltbedingungen für meine Pflanze in ihrer aktuellen Phase?',
        q2: 'Basierend auf dem Alter meiner Pflanze, welche Trainingstechniken sollte ich jetzt in Betracht ziehen?',
        q3: 'Gibt es Anzeichen für Nährstoffmängel, auf die ich bei dieser Sorte achten sollte?',
      }
    }
  },
  hub: {
    selectPlant: 'Pflanze auswählen',
    noPlants: 'Starte einen Anbau, um kontextbezogene Ratschläge zu erhalten.',
    todaysFocus: 'Heutiger Fokus für {plantName}',
    noRelevantArticles: 'Keine speziell relevanten Artikel für den aktuellen Zustand von {plantName} gefunden.',
    browseAll: 'Alle Artikel durchsuchen',
    searchPlaceholder: 'Artikel nach Titel oder Tags suchen...',
  },
  archive: {
    title: 'Mentor-Archiv',
    queryLabel: 'Deine Frage',
    saveSuccess: 'Antwort erfolgreich archiviert!',
    empty: 'Keine archivierten Antworten gefunden.',
    editTitle: 'Antwort bearbeiten'
  },
  knowledgebase: {
    'phase1-prep': {
      title: 'Phase 1: Vorbereitung & Keimung',
      content: '<h3>Vorbereitung ist alles</h3><p>Bevor dein Samen überhaupt die Erde berührt, stelle sicher, dass deine Umgebung bereit ist. Reinige dein Zelt gründlich. Überprüfe, ob dein Licht, deine Belüftung und deine Zeitschaltuhren korrekt funktionieren. Bereite dein Substrat vor (z.B. Erde oder Coco) und stelle sicher, dass es leicht feucht, aber nicht durchnässt ist.</p><h3>Die Keimung</h3><p>Die einfachste Methode ist die Papiertuchmethode. Lege deinen Samen zwischen zwei feuchte Papiertücher und diese wiederum zwischen zwei Teller. Lagere sie an einem warmen, dunklen Ort (ca. 22-25°C). Überprüfe täglich. Sobald eine kleine weiße Pfahlwurzel erscheint (normalerweise nach 24-72 Stunden), ist es Zeit zu pflanzen.</p><h3>Das Einpflanzen</h3><p>Pflanze den gekeimten Samen etwa 0,5-1 cm tief in dein Substrat, mit der Wurzel nach unten. Bedecke ihn sanft. Halte die Erde feucht, aber nicht nass. Eine hohe Luftfeuchtigkeit (70-80%) ist in diesem Stadium ideal. Dein Licht sollte noch gedimmt oder in größerem Abstand sein, um den zarten Sämling nicht zu verbrennen.</p>'
    },
    'phase2-seedling': {
      title: 'Phase 2: Die Sämlingsphase',
      content: '<h3>Die ersten Blätter</h3><p>Dein Sämling wird zunächst ein Paar runde Keimblätter entwickeln, gefolgt vom ersten Paar echter, gezackter Blätter. Dies ist der Beginn der Sämlingsphase. In dieser Zeit ist die Pflanze sehr empfindlich.</p><h3>Licht & Wasser</h3><p>Sämlinge benötigen nicht viel Licht. Eine schwächere LED oder eine CFL-Lampe reicht aus, oder deine dimmbare LED auf niedriger Stufe (ca. 25-40%) in einem Abstand von 40-60 cm. Gieße vorsichtig um den Stiel herum, wenn sich der oberste Zentimeter der Erde trocken anfühlt. Überwässerung ist der häufigste Fehler in diesem Stadium. Der Topf sollte sich leicht anfühlen, bevor du erneut gießt.</p><h3>Umgebung</h3><p>Halte die Luftfeuchtigkeit hoch (65-75%) und die Temperatur stabil (20-25°C). Ein kleiner Ventilator, der für eine sanfte Brise sorgt (nicht direkt auf die Pflanze gerichtet), stärkt den Stiel.</p><h3>Nährstoffe</h3><p>Die meisten Erden enthalten genug Nährstoffe für die ersten 1-2 Wochen. Beginne erst mit einer sehr verdünnten Nährlösung (1/4 der empfohlenen Dosis), wenn die Pflanze 2-3 Sätze echter Blätter entwickelt hat.</p>'
    },
    'phase3-vegetative': {
      title: 'Phase 3: Die vegetative Phase',
      content: '<h3>Explosives Wachstum</h3><p>Dies ist die Phase des schnellen Wachstums. Deine Pflanze wird viele neue Blätter und Zweige entwickeln. Der Lichtzyklus sollte auf 18 Stunden Licht und 6 Stunden Dunkelheit eingestellt sein.</p><h3>Düngung & Bewässerung</h3><p>Jetzt hat deine Pflanze Hunger. Beginne mit einem stickstoffreichen Wachstumsdünger. Steigere die Dosis allmählich von 1/4 auf die volle empfohlene Menge und beobachte die Reaktion der Pflanze. Gieße gründlich, wenn der Topf leicht ist, und sorge für einen guten Abfluss (ca. 10-20% des Wassers sollten unten herauslaufen).</p><h3>Trainingstechniken</h3><p>Dies ist die ideale Zeit für Training. <strong>Topping:</strong> Schneide den obersten Trieb ab, um die Pflanze zu zwingen, zwei Haupttriebe zu bilden. Dies fördert ein buschigeres Wachstum. <strong>LST (Low Stress Training):</strong> Biege die Triebe sanft nach unten und binde sie fest, um eine gleichmäßige, flache Krone zu schaffen. Dies verbessert die Lichtausnutzung erheblich.</p>'
    },
    'phase4-flowering': {
      title: 'Phase 4: Die Blütephase',
      content: '<h3>Umstellung des Lichts</h3><p>Um die Blüte einzuleiten, stelle deinen Lichtzyklus auf 12 Stunden Licht und 12 Stunden ununterbrochene Dunkelheit um. Dies signalisiert der Pflanze, dass es Zeit ist, Blüten zu produzieren.</p><h3>Der "Stretch"</h3><p>In den ersten 2-3 Wochen der Blüte wird deine Pflanze sich stark strecken und kann ihre Höhe verdoppeln oder sogar verdreifachen. Plane diesen Platzbedarf ein.</p><h3>Nährstoffanpassung</h3><p>Wechsle zu einem Blütedünger, der weniger Stickstoff (N) und mehr Phosphor (P) und Kalium (K) enthält. Dies fördert die Entwicklung dichter, harziger Blüten. Viele Züchter fügen in der Mitte bis späten Blütephase einen PK-Booster hinzu.</p><h3>Umweltkontrolle</h3><p>Senke die Luftfeuchtigkeit allmählich auf 40-50%, um Schimmelbildung zu vermeiden. Eine gute Luftzirkulation ist jetzt entscheidend.</p>'
    },
    'phase5-harvest': {
      title: 'Phase 5: Ernte, Trocknen & Curing',
      content: '<h3>Wann ernten?</h3><p>Der beste Indikator sind die Trichome (die kleinen Harzdrüsen). Verwende eine Lupe, um sie zu betrachten. Ernte, wenn die meisten Trichome milchig-weiß sind, mit einigen wenigen bernsteinfarbenen. Klare Trichome bedeuten, es ist zu früh; zu viele bernsteinfarbene führen zu einer eher sedierenden Wirkung.</p><h3>Trocknen</h3><p>Schneide die Zweige ab und hänge sie kopfüber in einem dunklen Raum mit einer Temperatur von ca. 18-20°C und einer Luftfeuchtigkeit von 50-60% auf. Eine langsame Trocknung über 7-14 Tage ist ideal für den Erhalt der Terpene. Die Zweige sind fertig, wenn sie brechen, anstatt sich zu biegen.</p><h3>Curing (Fermentieren)</h3><p>Dies ist der wichtigste Schritt für Qualität. Schneide die getrockneten Blüten von den Zweigen und lege sie in luftdichte Gläser (z.B. Einmachgläser), fülle sie zu ca. 75%. Öffne die Gläser in der ersten Woche mehrmals täglich für ein paar Minuten ("rülpsen"). Danach reicht einmal täglich. Ein Curing von mindestens 2-4 Wochen verbessert Geschmack und Aroma drastisch.</p>'
    },
    'fix-overwatering': {
      title: 'Problembehebung: Überwässerung',
      content: '<h3>Symptome</h3><p>Überwässerte Pflanzen sehen schlaff und welk aus, aber die Blätter fühlen sich fest und nach unten gekrümmt an. Die Erde ist dauerhaft nass und schwer. Dies ist einer der häufigsten Fehler bei Anfängern.</p><h3>Ursache</h3><p>Die Wurzeln ersticken, da Wasser den Sauerstoff im Substrat verdrängt. Dies kann zu Wurzelfäule und Nährstoff-Lockout führen.</p><h3>Sofortmaßnahmen</h3><ol><li><strong>Gießen stoppen:</strong> Gieße die Pflanze erst wieder, wenn der Topf deutlich leichter ist und die obersten 3-5 cm der Erde vollständig trocken sind.</li><li><strong>Luftzirkulation verbessern:</strong> Richte einen Ventilator auf den Topf (nicht die Pflanze), um die Verdunstung zu beschleunigen.</li><li><strong>Drainage sicherstellen:</strong> Stelle sicher, dass der Topf genügend Drainagelöcher hat und nicht in einer Untertasse mit stehendem Wasser steht.</li></ol><h3>Langfristige Lösung</h3><p>Lerne das Gewicht deines Topfes einzuschätzen. Hebe ihn an, wenn er frisch gegossen ist, und dann wieder, wenn er trocken ist. Dieser Unterschied ist der beste Indikator dafür, wann wieder gegossen werden muss. Es ist besser, die Pflanze gründlich, aber seltener zu gießen, als oft nur ein bisschen.</p>'
    },
    'fix-calcium-deficiency': {
      title: 'Problembehebung: Kalziummangel',
      content: '<h3>Symptome</h3><p>Ein Kalziummangel (Ca) zeigt sich typischerweise an neueren Blättern im oberen Bereich der Pflanze. Symptome sind rostfarbene Flecken, verkümmertes Wachstum, gekräuselte oder verdrehte neue Blätter und schwache Stängel.</p><h3>Ursachen</h3><ol><li><strong>Mangel im Wasser/Dünger:</strong> Besonders bei Verwendung von Umkehrosmosewasser oder sehr weichem Wasser kann ein Mangel an Kalzium und Magnesium (CalMag) auftreten.</li><li><strong>pH-Lockout:</strong> Kalzium wird am besten bei einem pH-Wert zwischen 6.2 und 7.0 in Erde aufgenommen. Ist der pH-Wert zu niedrig, kann die Pflanze das vorhandene Kalzium nicht aufnehmen.</li><li><strong>Coco-Substrat:</strong> Kokosfasern neigen dazu, Kalzium zu binden. Bei Coco-Anbau ist eine CalMag-Ergänzung fast immer notwendig.</li></ol><h3>Lösung</h3><ol><li><strong>pH-Wert überprüfen:</strong> Miss den pH-Wert deines Abflusswassers (Runoff). Liegt er unter 6.0, korrigiere den pH-Wert deiner Nährlösung auf etwa 6.5, bis der Runoff sich stabilisiert.</li><li><strong>CalMag hinzufügen:</strong> Füge deiner Nährlösung ein CalMag-Präparat gemäß den Anweisungen des Herstellers hinzu. Beginne mit einer halben Dosis, um eine Überdüngung zu vermeiden.</li><li><strong>Blattdüngung:</strong> Für eine schnelle Abhilfe kannst du eine stark verdünnte CalMag-Lösung direkt auf die Blätter sprühen (nicht bei voller Lichtintensität).</li></ol>'
    }
  }
};

export const tipOfTheDay = {
  title: 'Tipp des Tages',
  tips: [
    "Überwässerung ist einer der häufigsten Fehler bei Anfängern. Hebe deine Töpfe an, um ihr Gewicht zu fühlen – gieße erst, wenn sie sich deutlich leichter anfühlen.",
    "Kalibriere dein pH-Messgerät regelmäßig, um eine genaue Nährstoffaufnahme sicherzustellen.",
    "Eine sanfte, konstante Luftzirkulation in deinem Zelt stärkt die Stängel deiner Pflanzen und hilft, Schimmel vorzubeugen.",
    "Low Stress Training (LST) während der vegetativen Phase kann deinen Ertrag erheblich steigern, indem mehr Blütenstände dem Licht ausgesetzt werden.",
    "Beobachte die Trichome mit einer Lupe, um den perfekten Erntezeitpunkt zu bestimmen. Milchig-weiße Trichome deuten auf die höchste Potenz hin.",
    "Ein langsames Trocknen und sorgfältiges Curing sind entscheidend für den Geschmack und die Qualität deines Endprodukts. Überspringe diese Schritte nicht!",
    "Weniger ist oft mehr, wenn es um Nährstoffe geht. Beginne mit einer halben Dosis und steigere sie langsam, um Nährstoffverbrennungen zu vermeiden.",
    "VPD (Dampfdruckdefizit) ist ein fortgeschrittener, aber wichtiger Messwert. Das Gleichgewicht von Temperatur und Luftfeuchtigkeit optimiert die Pflanzengesundheit.",
    "Führe ein detailliertes Grow-Journal. Es hilft dir, aus Erfolgen und Fehlern zu lernen und deine Methoden zu verfeinern."
  ]
};
