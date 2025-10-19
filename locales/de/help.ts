export const helpView = {
  title: 'Hilfe & Support',
  subtitle: 'Finden Sie Antworten auf Ihre Fragen und lernen Sie mehr über den Anbau.',
  tabs: {
    faq: 'FAQ',
    guides: 'Visuelle Anleitungen',
    lexicon: 'Lexikon',
    manual: 'Bedienungsanleitung',
  },
  faq: {
    title: 'Häufig gestellte Fragen',
    searchPlaceholder: 'Fragen durchsuchen...',
    noResults: 'Keine Ergebnisse für "{{term}}" gefunden.',
  },
  guides: {
    title: 'Visuelle Anleitungen',
  },
  lexicon: {
    title: 'Grower-Lexikon',
    searchPlaceholder: 'Begriffe durchsuchen...',
    noResults: 'Keine Begriffe für "{{term}}" gefunden.',
    categories: {
      all: 'Alle',
      cannabinoid: 'Cannabinoide',
      terpene: 'Terpene',
      flavonoid: 'Flavonoide',
      general: 'Allgemein',
    },
    cannabinoids: {
      thc: { term: 'THC (Tetrahydrocannabinol)', definition: 'Das bekannteste und primär psychoaktive Cannabinoid in Cannabis, verantwortlich für das "High"-Gefühl.' },
      cbd: { term: 'CBD (Cannabidiol)', definition: 'Ein nicht-psychoaktives Cannabinoid, das für seine therapeutischen Eigenschaften, einschließlich schmerzlindernder und entzündungshemmender Wirkungen, bekannt ist.' },
      cbg: { term: 'CBG (Cannabigerol)', definition: 'Ein nicht-psychoaktives Cannabinoid, das oft als "Mutter aller Cannabinoide" bezeichnet wird, da es ein Vorläufer von THC und CBD ist.' },
      cbn: { term: 'CBN (Cannabinol)', definition: 'Ein leicht psychoaktives Cannabinoid, das beim Abbau von THC entsteht. Es ist bekannt für seine sedierenden Eigenschaften.' },
      cbc: { term: 'CBC (Cannabichromen)', definition: 'Ein nicht-psychoaktives Cannabinoid, das potenzielle entzündungshemmende und schmerzlindernde Eigenschaften aufweist.' },
      thca: { term: 'THCA (Tetrahydrocannabinolsäure)', definition: 'Die nicht-psychoaktive, saure Vorstufe von THC, die in rohem Cannabis vorkommt. Es wird durch Erhitzen (Decarboxylierung) in THC umgewandelt.' },
      cbda: { term: 'CBDA (Cannabidiolsäure)', definition: 'Die saure Vorstufe von CBD, die in rohem Cannabis vorkommt. Sie hat eigene potenzielle therapeutische Wirkungen, insbesondere entzündungshemmende.' },
      thcv: { term: 'THCV (Tetrahydrocannabivarin)', definition: 'Ein Cannabinoid, das strukturell THC ähnelt, aber unterschiedliche Wirkungen hat. Es ist bekannt dafür, den Appetit zu unterdrücken und kann in hohen Dosen psychoaktiv sein.' },
      cbdv: { term: 'CBDV (Cannabidivarin)', definition: 'Ein nicht-psychoaktives Cannabinoid, das strukturell CBD ähnelt und auf sein Potenzial bei der Behandlung von neurologischen Erkrankungen untersucht wird.' },
    },
    terpenes: {
      myrcene: { term: 'Myrcen', definition: 'Ein häufiges Terpen mit einem erdigen, moschusartigen Aroma. Man findet es auch in Mangos. Bekannt für seine beruhigenden und entspannenden Eigenschaften.' },
      limonene: { term: 'Limonen', definition: 'Ein Terpen mit einem starken Zitrusaroma. Es ist bekannt für seine stimmungsaufhellenden und stressabbauenden Wirkungen.' },
      caryophyllene: { term: 'Caryophyllen', definition: 'Ein Terpen mit einem würzigen, pfeffrigen Aroma. Es ist das einzige Terpen, das auch an Cannabinoid-Rezeptoren binden kann und entzündungshemmende Eigenschaften hat.' },
      pinene: { term: 'Pinen', definition: 'Ein Terpen mit einem frischen Kiefernaroma. Es kann die Konzentration fördern und hat entzündungshemmende Eigenschaften.' },
      linalool: { term: 'Linalool', definition: 'Ein Terpen mit einem blumigen, lavendelartigen Aroma. Es ist bekannt für seine beruhigenden, angstlösenden und schlaffördernden Wirkungen.' },
      terpinolene: { term: 'Terpinolen', definition: 'Ein Terpen mit einem komplexen, fruchtig-blumigen Aroma. Es hat oft eine leicht erhebende Wirkung und antioxidative Eigenschaften.' },
      humulene: { term: 'Humulen', definition: 'Ein Terpen mit einem erdigen, holzigen Aroma, das auch in Hopfen vorkommt. Es ist bekannt für seine entzündungshemmenden und appetitzügelnden Eigenschaften.' },
      ocimene: { term: 'Ocimen', definition: 'Ein Terpen mit einem süßen, kräuterartigen und holzigen Aroma. Es kann erhebende Wirkungen haben und wird auf seine antiviralen Eigenschaften untersucht.' },
      bisabolol: { term: 'Bisabolol', definition: 'Ein Terpen mit einem leichten, süßen, blumigen Aroma, das auch in Kamille vorkommt. Es ist bekannt für seine entzündungshemmenden und hautberuhigenden Eigenschaften.' },
      nerolidol: { term: 'Nerolidol', definition: 'Ein Terpen mit einem holzigen, blumigen Aroma, das an Baumrinde erinnert. Es hat sedierende und angstlösende Eigenschaften.' },
    },
    flavonoids: {
      cannaflavin: { term: 'Cannaflavine (A, B, C)', definition: 'Eine Gruppe von Flavonoiden, die ausschließlich in Cannabis vorkommt. Sie haben starke entzündungshemmende Eigenschaften.' },
      quercetin: { term: 'Quercetin', definition: 'Ein Flavonoid, das in vielen Früchten und Gemüsen vorkommt. Es ist ein starkes Antioxidans mit antiviralen Eigenschaften.' },
      kaempferol: { term: 'Kaempferol', definition: 'Ein Flavonoid mit starken antioxidativen Eigenschaften, das helfen kann, oxidativem Stress vorzubeugen.' },
      apigenin: { term: 'Apigenin', definition: 'Ein Flavonoid mit angstlösenden und beruhigenden Eigenschaften, das auch in Kamille vorkommt.' },
      luteolin: { term: 'Luteolin', definition: 'Ein Flavonoid mit antioxidativen und entzündungshemmenden Eigenschaften.' },
      orientin: { term: 'Orientin', definition: 'Ein Flavonoid mit antioxidativen, entzündungshemmenden und potenziell antibiotischen Eigenschaften.' },
      vitexin: { term: 'Vitexin', definition: 'Ein Flavonoid, das schmerzlindernde und antioxidative Wirkungen zeigen kann.' },
    },
    general: {
      phValue: { term: 'pH-Wert', definition: 'Ein Maß für den Säuregehalt oder die Alkalität einer Lösung. Im Cannabisanbau ist ein korrekter pH-Wert entscheidend für die Nährstoffaufnahme.' },
      ecValue: { term: 'EC-Wert (Elektrische Leitfähigkeit)', definition: 'Ein Maß für die Gesamtmenge der gelösten Salze (Nährstoffe) in einer Lösung. Er hilft, die Nährstoffkonzentration zu überwachen.' },
      vpd: { term: 'VPD (Dampfdruckdefizit)', definition: 'Ein Maß für den kombinierten Druck von Temperatur und Luftfeuchtigkeit auf die Pflanze. Ein optimaler VPD-Wert ermöglicht eine effiziente Transpiration.' },
      trichomes: { term: 'Trichome', definition: 'Die kleinen, harzigen Drüsen auf den Blüten und Blättern von Cannabis, die Cannabinoide und Terpene produzieren. Ihre Farbe ist ein wichtiger Indikator für die Reife.' },
      topping: { term: 'Topping', definition: 'Eine Trainingstechnik, bei der die oberste Spitze der Pflanze abgeschnitten wird, um das Wachstum von zwei neuen Haupttrieben zu fördern und eine buschigere Form zu erzeugen.' },
      fimming: { term: 'FIM (F*ck I Missed)', definition: 'Eine ähnliche Technik wie Topping, bei der jedoch nur ein Teil der Spitze entfernt wird, was oft zu vier oder mehr neuen Haupttrieben führt.' },
      lst: { term: 'LST (Low-Stress-Training)', definition: 'Eine Trainingstechnik, bei der Äste sanft nach unten gebogen und festgebunden werden, um ein breiteres, flacheres Kronendach zu schaffen und die Lichtausbeute zu maximieren.' },
      lollipopping: { term: 'Lollipopping', definition: 'Das Entfernen der unteren Blätter und kleinen Triebe, die wenig Licht erhalten, um die Energie der Pflanze auf die oberen, größeren Blüten zu konzentrieren.' },
      scrog: { term: 'SCROG (Screen of Green)', definition: 'Eine fortgeschrittene Trainingstechnik, bei der ein Netz oder Gitter über die Pflanzen gespannt wird, um die Triebe horizontal zu führen und ein gleichmäßiges, produktives Kronendach zu schaffen.' },
      sog: { term: 'SOG (Sea of Green)', definition: 'Eine Anbaumethode, bei der viele kleine Pflanzen eng zusammen angebaut und schnell in die Blüte geschickt werden, um eine schnelle und ertragreiche Ernte zu erzielen.' },
      curing: { term: 'Curing (Fermentierung)', definition: 'Der Prozess, bei dem getrocknete Cannabisblüten in luftdichten Behältern gelagert werden, um Chlorophyll abzubauen und den Geschmack, das Aroma und die Sanftheit des Rauchs zu verbessern.' },
      nutrientLockout: { term: 'Nährstoffsperre', definition: 'Ein Zustand, bei dem die Pflanze aufgrund eines falschen pH-Werts im Wurzelbereich keine verfügbaren Nährstoffe aufnehmen kann, auch wenn sie vorhanden sind.' },
      flushing: { term: 'Spülen', definition: 'Das Gießen der Pflanze mit reinem, pH-angepasstem Wasser in den letzten ein bis zwei Wochen vor der Ernte, um überschüssige Nährstoffsalze aus dem Substrat und der Pflanze zu entfernen.' },
      phenotype: { term: 'Phänotyp', definition: 'Die beobachtbaren Merkmale einer Pflanze (Aussehen, Geruch, Wirkung), die aus dem Zusammenspiel ihres Genotyps und der Umwelt resultieren.' },
      genotype: { term: 'Genotyp', definition: 'Die genetische Ausstattung einer Pflanze, die ihr Potenzial für bestimmte Merkmale bestimmt.' },
      landrace: { term: 'Landrasse', definition: 'Eine reine, ursprüngliche Cannabis-Sorte, die sich über einen langen Zeitraum in einer bestimmten geografischen Region natürlich angepasst und stabilisiert hat.' },
    },
  },
  manual: {
    title: 'Benutzerhandbuch',
    introduction: {
        title: 'Einführung & Philosophie',
        content: 'Willkommen bei CannaGuide 2025, Ihrem ultimativen Co-Piloten für den Cannabisanbau. Dieses Handbuch führt Sie durch die hochentwickelten Funktionen der App.<h4>Unsere Kernprinzipien:</h4><ul><li><strong>Offline-First:</strong> 100%ige Funktionalität ohne Internetverbindung.</li><li><strong>Performance-Driven:</strong> Eine flüssige UI dank Auslagerung komplexer Simulationen in einen Web Worker.</li><li><strong>Datensouveränität:</strong> Vollständige Kontrolle durch Export- und Importfunktionen für alle Ihre Daten.</li><li><strong>KI als Werkzeug:</strong> Gezielter Einsatz von KI für handlungsorientierte, kontextsensitive Einblicke.</li></ul>'
    },
    general: {
      title: 'Plattformweite Funktionen',
      content: 'Funktionen, die Ihr Erlebnis in der gesamten App verbessern.',
      pwa: {
        title: 'PWA & 100% Offline-Funktionalität',
        content: 'Installieren Sie CannaGuide als <strong>Progressive Web App</strong> für ein natives App-Erlebnis. Dank eines robusten Service Workers sind alle Ihre Daten und die Kernfunktionen der App auch ohne Internetverbindung vollständig verfügbar.'
      },
      commandPalette: {
        title: 'Befehlspalette (Cmd/Ctrl + K)',
        content: 'Drücken Sie <code>Cmd/Ctrl + K</code>, um die Befehlspalette zu öffnen. Dies ist das Power-User-Werkzeug für sofortige Navigation und Aktionen, ohne die Tastatur verlassen zu müssen.'
      },
      voiceControl: {
        title: 'Sprachsteuerung & Sprachausgabe',
        content: 'Steuern Sie die App freihändig. Drücken Sie den <strong>Mikrofon-Button</strong>, um die Erkennung zu aktivieren, und sprechen Sie Ihre Befehle.<ul><li><strong>Navigation:</strong> Sagen Sie "Gehe zu Pflanzen" oder "Zeige Hilfe".</li><li><strong>Suche:</strong> Sagen Sie "Suche nach Northern Lights".</li><li><strong>Aktionen:</strong> Sagen Sie "Alle Pflanzen gießen".</li></ul>Sie können auch die <strong>Text-zu-Sprache</strong> in den Einstellungen aktivieren. Dies fügt ein kleines Lautsprecher-Symbol zu Inhaltsblöcken hinzu, sodass Sie sich Anleitungen, KI-Ratschläge und Beschreibungen vorlesen lassen können.'
      },
      dataManagement: {
        title: 'Datensouveränität: Backup & Wiederherstellung',
        content: 'Unter <code>Einstellungen > Datenverwaltung</code> haben Sie die volle Kontrolle. Exportieren Sie Ihren gesamten App-Zustand (Pflanzen, Einstellungen, etc.) als JSON-Datei zur <strong>Sicherung</strong>. Importieren Sie diese Datei später, um Ihren Zustand auf jedem Gerät vollständig <strong>wiederherzustellen</strong>.'
      },
      accessibility: {
        title: 'Erweiterte Barrierefreiheit',
        content: 'Die App bietet umfassende Zugänglichkeitsoptionen. Aktivieren Sie eine <strong>legasthenikerfreundliche Schriftart</strong>, einen <strong>Modus mit reduzierter Bewegung</strong> oder nutzen Sie die integrierte <strong>Text-zu-Sprache (TTS)</strong> Funktion, um sich Inhalte vorlesen zu lassen.'
      }
    },
    strains: {
      title: 'Sorten-Ansicht',
      content: 'Das Herzstück Ihrer Cannabis-Wissensdatenbank. Hier können Sie über 500 Sorten erkunden, Ihre eigenen hinzufügen und leistungsstarke Werkzeuge für Entdeckung und Analyse nutzen.',
      library: {
        title: 'Bibliothek (Alle/Meine/Favoriten)',
        content: 'Wechseln Sie zwischen der gesamten Bibliothek, Ihren persönlich hinzugefügten Sorten und Ihren Favoriten. Verwenden Sie die leistungsstarke Suche, alphabetische Filter, Typ-Filter und die erweiterte Filterleiste, um genau das zu finden, was Sie suchen. Schalten Sie zwischen Listen- und Rasteransicht um, wie es Ihnen am besten passt.'
      },
      genealogy: {
        title: 'Stammbaum-Explorer',
        content: 'Visualisieren Sie die genetische Abstammung jeder Sorte. Verwenden Sie die Analysewerkzeuge, um Landrassen hervorzuheben, den genetischen Einfluss der Top-Vorfahren zu berechnen oder bekannte Nachkommen zu entdecken.'
      },
      aiTips: {
        title: 'KI-Anbau-Tipps',
        content: 'Generieren Sie einzigartige, KI-gestützte Anbauratschläge für jede Sorte basierend auf Ihrem Erfahrungslevel und Ihren Zielen. Jedes Mal, wenn Sie Tipps generieren, wird auch ein einzigartiges, KI-generiertes Bild erstellt, das die Essenz der Sorte künstlerisch darstellt.'
      },
      exports: {
        title: 'Exporte & Datenverwaltung',
        content: 'Exportieren Sie ausgewählte oder alle gefilterten Sorten in verschiedenen Formaten (PDF, CSV, JSON etc.). Verwalten Sie Ihre gespeicherten Exporte im Tab "Exporte".'
      }
    },
    plants: {
      title: 'Pflanzen-Ansicht (Der Grow Room)',
      content: 'Ihre Kommandozentrale zur Verwaltung und Simulation von bis zu drei gleichzeitigen Anbauprojekten.',
      dashboard: {
        title: 'Dashboard & Garten-Vitalwerte',
        content: 'Erhalten Sie einen schnellen Überblick über die allgemeine Gesundheit Ihres Gartens, die Anzahl der aktiven Pflanzen und die durchschnittlichen Umgebungsbedingungen. Hier können Sie auch globale Aktionen wie "Alle Pflanzen gießen" ausführen.'
      },
      simulation: {
        title: 'Fortschrittliche Simulation',
        content: 'Die App simuliert das Pflanzenwachstum in Echtzeit basierend auf wissenschaftlichen Prinzipien wie dem Dampfdruckdefizit (VPD). Wechseln Sie im Header in den <strong>Expertenmodus</strong>, um detaillierte wissenschaftliche Daten wie VPD und DLI anzuzeigen.'
      },
      diagnostics: {
        title: 'KI-Diagnose & Berater',
        content: 'Nutzen Sie die KI-Werkzeuge, um Ihre Pflanzen gesund zu halten.<ul><li><strong>Foto-Diagnose:</strong> Laden Sie ein Foto hoch, um eine sofortige KI-basierte Diagnose von Problemen zu erhalten.</li><li><strong>Proaktiver Berater:</strong> Erhalten Sie datengesteuerte Ratschläge von der KI basierend auf den Echtzeit-Vitalwerten Ihrer Pflanze.</li></ul>'
      },
      journal: {
        title: 'Umfassendes Journaling',
        content: 'Protokollieren Sie jede Aktion – von der Bewässerung über das Training bis hin zur Schädlingsbekämpfung. Das Journal ist Ihre detaillierte Aufzeichnung des gesamten Lebenszyklus der Pflanze.'
      }
    },
    equipment: {
      title: 'Ausrüstungs-Ansicht (Die Werkstatt)',
      content: 'Ihr Werkzeugkasten zur Planung und Optimierung Ihres Anbau-Setups.',
      configurator: {
        title: 'KI-Setup-Konfigurator',
        content: 'Beantworten Sie ein paar einfache Fragen zu Ihrem Budget, Ihrer Erfahrung und Ihren Prioritäten, um eine vollständige, markenspezifische Ausrüstungsliste von der KI zu erhalten.'
      },
      calculators: {
        title: 'Präzisionsrechner',
        content: 'Nutzen Sie eine Reihe von Rechnern für Lüftung, Beleuchtung (PPFD/DLI), Stromkosten, Nährstoffmischungen und mehr, um Ihren Anbau zu optimieren.'
      },
      shops: {
        title: 'Grow Shops & Saatgutbanken',
        content: 'Durchsuchen Sie kuratierte Listen empfohlener Shops und Saatgutbanken für europäische und nordamerikanische Märkte.'
      }
    },
    knowledge: {
      title: 'Wissens-Ansicht (Die Bibliothek)',
      content: 'Ihre zentrale Ressource zum Lernen, Experimentieren und Meistern des Anbaus.',
      mentor: {
        title: 'Kontextsensitiver KI-Mentor',
        content: 'Stellen Sie dem KI-Mentor Anbaufragen. Wählen Sie eine Ihrer aktiven Pflanzen aus, damit der Mentor deren spezifische Daten in seine Ratschläge einbeziehen kann.'
      },
      breeding: {
        title: 'Zuchtlabor',
        content: 'Sammeln Sie Samen von Ihren hochwertigsten geernteten Pflanzen. Im Zuchtlabor können Sie zwei Samen kreuzen, um eine völlig neue, <strong>permanente Hybridsorte</strong> zu erschaffen, die Ihrer persönlichen Bibliothek hinzugefügt wird.'
      },
      sandbox: {
        title: 'Interaktive Sandbox',
        content: 'Führen Sie risikofreie "Was-wäre-wenn"-Szenarien durch. Klonen Sie eine Ihrer Pflanzen und simulieren Sie über einen beschleunigten Zeitraum, wie sich verschiedene Trainingstechniken (z.B. Topping vs. LST) auf ihr Wachstum auswirken, ohne Ihre echten Pflanzen zu gefährden.'
      },
      guide: {
        title: 'Integrierter Grow Guide',
        content: 'Greifen Sie auf ein umfassendes Nachschlagewerk zu, das ein Grower-Lexikon, visuelle Anleitungen für gängige Techniken, einen durchsuchbaren FAQ-Bereich und dieses Benutzerhandbuch enthält.'
      }
    }
  }
};

export const visualGuides = {
  topping: {
    title: 'Topping',
    description: 'Lernen Sie, wie Sie die Spitze Ihrer Pflanze beschneiden, um buschigeres Wachstum und mehr Hauptblüten zu fördern.',
  },
  lst: {
    title: 'Low-Stress-Training (LST)',
    description: 'Biegen und binden Sie die Zweige Ihrer Pflanze, um das Kronendach zu öffnen und die Lichtausbeute zu maximieren.',
  },
  defoliation: {
    title: 'Entlaubung',
    description: 'Entfernen Sie gezielt Blätter, um die Luftzirkulation zu verbessern und mehr Licht an die unteren Blüten zu lassen.',
  },
  harvesting: {
    title: 'Ernten',
    description: 'Erkennen Sie den perfekten Zeitpunkt für die Ernte, um die Potenz und das Aroma Ihrer Blüten zu maximieren.',
  },
};

export const faq = {
  phValue: {
    question: 'Warum ist der pH-Wert so wichtig?',
    answer: 'Der pH-Wert des Gießwassers und des Substrats bestimmt, wie gut Ihre Pflanze Nährstoffe aufnehmen kann. Ein falscher pH-Wert führt zu Nährstoffsperren, auch wenn genügend Nährstoffe vorhanden sind. Für Erde liegt der ideale Bereich bei 6.0-6.8, für Hydro/Coco bei 5.5-6.5.',
  },
  yellowLeaves: {
    question: 'Was bedeuten gelbe Blätter?',
    answer: 'Gelbe Blätter (Chlorose) können viele Ursachen haben. Beginnen sie unten und wandern nach oben, ist es oft ein Stickstoffmangel. Flecken können auf Kalzium- oder Magnesiummangel hindeuten. Über- oder Unterwässerung kann ebenfalls zu gelben Blättern führen. Überprüfen Sie immer zuerst den pH-Wert und die Bewässerungsgewohnheiten.',
  },
  whenToHarvest: {
    question: 'Wann weiß ich, dass es Zeit für die Ernte ist?',
    answer: 'Der beste Indikator sind die Trichome (die kleinen Harzkristalle auf den Blüten). Verwenden Sie eine Lupe. Die Ernte ist optimal, wenn die meisten Trichome milchig-weiß sind und einige wenige bernsteinfarben. Klare Trichome sind zu früh, zu viele bernsteinfarbene Trichome führen zu einer eher sedierenden Wirkung.',
  },
  lightDistanceSeedling: {
    question: 'Wie weit sollte meine Lampe von den Sämlingen entfernt sein?',
    answer: 'Dies hängt stark vom Lampentyp und der Leistung ab. Eine gute Faustregel für die meisten LED-Lampen ist ein Abstand von 45-60 cm. Beobachten Sie Ihre Sämlinge genau. Wenn sie sich zu sehr strecken (lang und dünn werden), ist die Lampe zu weit weg. Wenn die Blätter Anzeichen von Verbrennungen oder Ausbleichen zeigen, ist sie zu nah.',
  },
  whenToFeed: {
    question: 'Wann sollte ich anfangen zu düngen?',
    answer: 'Die meisten vorgedüngten Erden enthalten genug Nährstoffe für die ersten 2-3 Wochen. Bei Sämlingen sollten Sie warten, bis sie 3-4 Sätze echter Blätter haben, bevor Sie mit einer sehr schwachen Nährlösung (1/4 der empfohlenen Dosis) beginnen. Beobachten Sie die Reaktion der Pflanze, bevor Sie die Dosis erhöhen.'
  },
  npkMeaning: {
      question: 'Was bedeuten die N-P-K-Zahlen auf Düngemitteln?',
      answer: 'N-P-K steht für Stickstoff (N), Phosphor (P) und Kalium (K). Dies sind die drei primären Makronährstoffe, die Ihre Pflanze benötigt. Die Zahlen geben den prozentualen Anteil jedes Nährstoffs im Dünger an. <ul><li><strong>N (Stickstoff):</strong> Entscheidend für das vegetative Wachstum (Blätter, Stängel).</li><li><strong>P (Phosphor):</strong> Unverzichtbar für die Wurzelentwicklung und die Blütenproduktion.</li><li><strong>K (Kalium):</strong> Wichtig für die allgemeine Pflanzengesundheit, die Krankheitsresistenz und die Blütendichte.</li></ul>'
  },
  calmagUsage: {
      question: 'Wann und warum sollte ich Cal-Mag verwenden?',
      answer: 'Cal-Mag (Kalzium-Magnesium-Ergänzung) ist wichtig, wenn Sie mit gefiltertem Wasser (z.B. Umkehrosmose) gießen, das diese sekundären Nährstoffe nicht enthält, oder wenn Sie Kokossubstrat verwenden, das dazu neigt, Kalzium zu binden. Mangelerscheinungen zeigen sich oft als kleine, rostbraune Flecken auf den Blättern.'
  },
  flushingPlants: {
      question: 'Was ist "Spülen" und muss ich das tun?',
      answer: 'Spülen ist das Gießen der Pflanze mit reinem, pH-angepasstem Wasser in den letzten 1-2 Wochen vor der Ernte. Die Idee ist, überschüssige Nährstoffsalze aus dem Substrat und der Pflanze zu entfernen, was zu einem reineren, sanfteren Geschmack führen soll. In organischen Erdanbauten ist es oft nicht notwendig, aber in hydroponischen oder Coco-Systemen ist es gängige Praxis.'
  },
  vpdImportance: {
      question: 'Was ist VPD und warum sollte ich darauf achten?',
      answer: 'VPD (Dampfdruckdefizit) ist ein fortschrittliches Maß, das Temperatur und Luftfeuchtigkeit kombiniert, um den "Durst" der Luft zu beschreiben. Ein optimaler VPD-Wert ermöglicht es der Pflanze, effizient zu transpirieren (Wasser zu verdunsten), was die Nährstoffaufnahme und das Wachstum antreibt. Ein zu hoher VPD bedeutet, dass die Luft zu trocken ist, was Stress verursacht. Ein zu niedriger VPD bedeutet, dass die Luft zu feucht ist, was das Schimmelrisiko erhöht und die Nährstoffaufnahme verlangsamt.'
  },
  idealTempHumidity: {
      question: 'Was sind die idealen Temperatur- und Luftfeuchtigkeitswerte?',
      answer: 'Das hängt von der Phase ab:<ul><li><strong>Sämlinge:</strong> 22-26°C, 70-80% RLF</li><li><strong>Wachstum:</strong> 22-28°C, 50-70% RLF</li><li><strong>Blüte:</strong> 20-26°C, 40-50% RLF</li><li><strong>Späte Blüte:</strong> 18-24°C, 30-40% RLF</li></ul>Das Ziel ist es, den idealen VPD-Bereich für jede Phase zu treffen.'
  },
  airCirculation: {
      question: 'Wie wichtig ist die Luftzirkulation?',
      answer: 'Extrem wichtig. Ein oder mehrere Umluftventilatoren im Zelt sorgen dafür, dass die Luft um die Pflanzen herum zirkuliert. Dies stärkt die Stängel, verhindert die Bildung von feuchten "Taschen" und reduziert das Risiko von Schimmel und Schädlingen erheblich.'
  },
  nutrientBurn: {
      question: 'Was ist Nährstoffbrand?',
      answer: 'Nährstoffbrand (oder Überdüngung) zeigt sich durch dunkelgrüne Blätter mit verbrannten, gelben oder braunen Spitzen, die sich oft nach oben krallen. Es bedeutet, dass die Pflanze mehr Nährstoffe erhält, als sie verarbeiten kann. Die Lösung ist, die Nährstoffkonzentration (EC) zu reduzieren und/oder das Substrat mit pH-angepasstem Wasser zu spülen.'
  },
  spiderMites: {
      question: 'Wie erkenne und bekämpfe ich Spinnmilben?',
      answer: 'Spinnmilben sind winzige Schädlinge, die auf der Unterseite der Blätter leben. Erste Anzeichen sind kleine weiße oder gelbe Punkte auf den Blättern. Bei einem starken Befall sieht man feine Spinnweben. Sie vermehren sich extrem schnell in warmer, trockener Umgebung. Zur Bekämpfung können Neemöl-Sprays oder insektizide Seifen verwendet werden. Eine gute Vorbeugung ist eine saubere Umgebung und eine nicht zu niedrige Luftfeuchtigkeit.'
  },
  stretchingCauses: {
      question: 'Warum streckt sich meine Pflanze so sehr?',
      answer: 'Übermäßiges Strecken, bei dem die Pflanze lange, dünne Stängel mit großen Abständen zwischen den Blattknoten entwickelt, wird fast immer durch unzureichendes Licht verursacht. Die Pflanze "sucht" nach der Lichtquelle. Bringen Sie Ihre Lampe näher an die Pflanze oder verwenden Sie eine stärkere Lampe. Einige Sativa-Sorten neigen auch genetisch bedingt zum Strecken, besonders zu Beginn der Blütephase.'
  },
  toppingVsFimming: {
      question: 'Was ist der Unterschied zwischen Topping und FIMing?',
      answer: 'Beides sind "High-Stress-Training"-Techniken, um die apikale Dominanz zu brechen und mehr Hauptblüten zu erzeugen. Beim <strong>Topping</strong> wird die Spitze des Haupttriebs sauber abgeschnitten, was zu zwei neuen Haupttrieben führt. Beim <strong>FIMing</strong> (F*ck I Missed) wird die Spitze nur abgeknipst, wobei ein kleiner Teil übrig bleibt. Wenn es richtig gemacht wird, kann dies zu vier oder mehr neuen Trieben führen. Topping ist präziser, FIMing kann zu buschigerem Wachstum führen.'
  },
  whatIsScrog: {
      question: 'Was ist ein SCROG?',
      answer: 'SCROG steht für "Screen of Green". Es ist eine fortgeschrittene Trainingstechnik, bei der ein Netz oder Gitter horizontal über die Pflanzen gespannt wird. Während die Pflanze wächst, werden die Triebe unter das Netz gesteckt und horizontal geführt. Dies erzeugt ein breites, flaches und gleichmäßiges Kronendach, bei dem alle Blütenstandorte die gleiche, optimale Lichtmenge erhalten, was den Ertrag maximiert.'
  },
  whatIsLollipopping: {
      question: 'Was bedeutet "Lollipopping"?',
      answer: '"Lollipopping" ist eine Entlaubungstechnik, die normalerweise kurz vor oder am Anfang der Blütephase durchgeführt wird. Dabei werden alle unteren Blätter und kleinen Triebe entfernt, die im Schatten liegen und sich nie zu dichten Blüten entwickeln würden. Dadurch konzentriert die Pflanze ihre gesamte Energie auf die oberen Blüten im Kronendach, was zu größeren und dichteren Hauptblüten führt.'
  },
  dryingDuration: {
      question: 'Wie lange sollte ich meine Ernte trocknen?',
      answer: 'Das Trocknen dauert in der Regel 7-14 Tage. Das Ziel ist eine langsame und kontrollierte Trocknung bei etwa 18-20°C und 55-60% Luftfeuchtigkeit. Ein guter Test ist der "Stiel-Knack-Test": Wenn die kleineren Stängel beim Biegen knacken anstatt sich nur zu biegen, sind die Blüten bereit für das Curing (Fermentierung) in Gläsern.'
  },
  curingImportance: {
      question: 'Warum ist das Curing (Fermentierung) so wichtig?',
      answer: 'Das Curing ist ein entscheidender Schritt für die Endqualität. Während dieses Prozesses, der in luftdichten Gläsern stattfindet, bauen Bakterien Chlorophyll und andere unerwünschte Stoffe ab. Dies führt zu einem viel sanfteren Rauch und ermöglicht die volle Entwicklung des komplexen Terpenprofils (Aroma und Geschmack) der Sorte. Ein gutes Curing kann den Unterschied zwischen mittelmäßigem und erstklassigem Cannabis ausmachen.'
  },
  storageHarvest: {
      question: 'Wie lagere ich meine fertige Ernte am besten?',
      answer: 'Nach dem Curing sollten die Blüten langfristig in luftdichten Glasbehältern an einem kühlen, dunklen Ort gelagert werden. Licht, Hitze und Sauerstoff sind die Hauptfeinde, die Cannabinoide und Terpene abbauen. Die ideale Lagertemperatur liegt unter 21°C. Feuchtigkeitspäckchen (z.B. 62% RLF) in den Gläsern können helfen, die perfekte Feuchtigkeit zu halten.'
  },
  autoflowerVsPhotoperiod: {
      question: 'Autoflower vs. Photoperiodisch: Was ist der Unterschied?',
      answer: '<strong>Photoperiodische</strong> Pflanzen benötigen eine Änderung des Lichtzyklus (Wechsel zu 12 Stunden Licht / 12 Stunden Dunkelheit), um die Blüte einzuleiten. Sie haben eine längere vegetative Phase und werden in der Regel größer und ertragreicher. <strong>Autoflowers</strong> blühen automatisch nach einer bestimmten Zeit (normalerweise 3-4 Wochen), unabhängig vom Lichtzyklus. Sie sind schneller fertig, bleiben kleiner und sind oft einfacher für Anfänger, aber der Ertrag ist meist geringer.'
  },
  howOftenToWater: {
      question: 'Wie oft muss ich gießen?',
      answer: 'Es gibt keine feste Regel. Die beste Methode ist, den Topf anzuheben und sein Gewicht zu fühlen. Gießen Sie gründlich, bis etwas Wasser unten herausläuft (Drainage), und warten Sie dann, bis der Topf wieder deutlich leichter ist. Dies stellt sicher, dass die Wurzeln zwischen den Gießvorgängen genügend Sauerstoff bekommen. Stecken Sie auch Ihren Finger etwa 2-3 cm tief in die Erde; wenn er trocken herauskommt, ist es wahrscheinlich Zeit zu gießen.'
  },
  potSize: {
      question: 'Welche Topfgröße sollte ich verwenden?',
      answer: 'Die Topfgröße hängt von der Art der Pflanze und der gewünschten Endgröße ab. Eine gute Faustregel:<ul><li><strong>Autoflowers:</strong> 10-15 Liter Töpfe sind ideal, da sie nicht gerne umgetopft werden.</li><li><strong>Photoperiodische Pflanzen:</strong> Beginnen Sie in kleineren Töpfen (1-3 Liter) und topfen Sie 1-2 Mal in größere um, z.B. 15-25 Liter für die Endphase. Dies fördert ein gesundes Wurzelsystem.</li></ul>Größere Töpfe bedeuten mehr Platz für Wurzeln und potenziell größere Pflanzen, müssen aber seltener gegossen werden.'
  }
};