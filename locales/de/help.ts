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
        content: `Willkommen bei CannaGuide 2025, Ihrem ultimativen Co-Piloten für den Cannabisanbau. Dieses Handbuch führt Sie durch die hochentwickelten Funktionen der App.<br><br><strong>Unsere Kernprinzipien:</strong><ul><li><strong>Offline-First:</strong> 100%ige Funktionalität ohne Internetverbindung.</li><li><strong>Performance-Driven:</strong> Eine flüssige UI dank Auslagerung komplexer Simulationen in einen Web Worker.</li><li><strong>Datensouveränität:</strong> Vollständige Kontrolle durch Export- und Importfunktionen für alle Ihre Daten.</li><li><strong>KI als Werkzeug:</strong> Gezielter Einsatz von KI für handlungsorientierte, kontextsensitive Einblicke.</li></ul>`,
    },
    strains: {
        title: 'Die Sorten-Enzyklopädie',
        content: 'Ihr zentraler Wissens-Hub, konzipiert für tiefgehende Erkundungen mit Offline-First-Zugriff.',
        allStrains: {
            title: 'Tab "Alle Sorten"',
            content: 'Durchsuchen Sie die gesamte Datenbank mit über 500 Einträgen. Nutzen Sie die <strong>IndexedDB-gestützte Volltextsuche</strong> für sofortige Ergebnisse. Die erweiterten Filter ermöglichen eine präzise Selektion nach THC/CBD, Blütezeit, Aromen, Terpenen und agronomischen Eigenschaften.',
        },
        myStrains: {
            title: 'Tab "Meine Sorten"',
            content: 'Verwalten Sie Ihre persönliche Sammlung. Hier finden Sie alle von Ihnen manuell erstellten oder im Zuchtlabor gezüchteten Sorten. Volle <strong>CRUD-Funktionalität</strong> (Erstellen, Lesen, Aktualisieren, Löschen) ist gegeben.',
        },
        favorites: {
            title: 'Tab "Favoriten"',
            content: 'Eine kuratierte Auswahlliste für Ihren nächsten Anbau. Markieren Sie Sorten mit einem Herz, um sie hier schnell wiederzufinden.',
        },
        genealogy: {
            title: 'Tab "Stammbaum"',
            content: 'Visualisieren Sie die genetische Abstammung jeder Sorte. Die Analysewerkzeuge ermöglichen es, <strong>Landrassen</strong> hervorzuheben, Vererbungslinien zu verfolgen und den prozentualen <strong>genetischen Einfluss</strong> der Top-Vorfahren zu analysieren. Entdecken Sie auch bekannte Nachkommen.',
        },
        exports: {
            title: 'Tab "Exporte"',
            content: 'Verwalten Sie Ihre gespeicherten Datenexporte. Während PDFs direkt generiert werden, werden Exporte in Formaten wie <strong>CSV, JSON und XML</strong> hier als Datensätze gespeichert, um Datenintegrität zu gewährleisten. Sie können diese jederzeit erneut herunterladen.',
        },
        tips: {
            title: 'Tab "KI-Tipps"',
            content: 'Ihr persönliches Nachschlagewerk für KI-generierte, sortenspezifische Anbaustrategien. Alle gespeicherten Tipps sind hier durchsuchbar, bearbeitbar und exportierbar.',
        },
        toolbar: {
            title: 'Toolbar & Bulk-Aktionen',
            content: 'Die Toolbar ermöglicht den Wechsel zwischen Listen- und Rasteransicht, das Hinzufügen neuer Sorten und den Export von Daten. Bei Mehrfachauswahl erscheint eine <strong>Bulk-Aktionsleiste</strong>, mit der Sie mehrere Sorten gleichzeitig zu Favoriten hinzufügen, entfernen oder (falls zutreffend) löschen können.',
        },
        detailView: {
            title: 'Sorten-Detailansicht',
            content: 'Eine umfassende Aufschlüsselung aller agronomischen Daten und Profile. Im Reiter "KI-Tipps" können Sie maßgeschneiderte Anbauratschläge basierend auf Ihrem Erfahrungslevel und Fokus (z.B. Ertragsmaximierung) generieren lassen.',
        },
    },
    plants: {
        title: 'Der Digitale Grow Room',
        content: 'Die Kommandozentrale für Ihre aktiven Anbauprojekte. Verwalten Sie bis zu drei Pflanzen simultan in einer hochentwickelten Simulation.',
        dashboard: {
            title: 'Dashboard & Vitalwerte',
            content: 'Ihre Übersicht, wenn keine Pflanze ausgewählt ist. Zeigt aggregierte <strong>Garten-Vitalwerte</strong>, einen nützlichen Tipp des Tages und eine Zusammenfassung aller anlagenweiten Aufgaben und Warnungen. Die Aktion "Alle Pflanzen gießen" optimiert Ihre Routine.',
        },
        startingGrow: {
            title: 'Einen neuen Anbau starten',
            content: 'Wählen Sie einen leeren Slot, eine Sorte und konfigurieren Sie Ihr Setup (Topfgröße, Lichtzyklus etc.). Die Simulation startet sofort nach Bestätigung.',
        },
        detailView: {
            title: 'Detaillierte Pflanzenansicht',
            content: 'Hier protokollieren Sie alle Aktionen und überwachen Vitalwerte in Echtzeit. Der <strong>Expertenmodus</strong> (aktivierbar im Header) schaltet wissenschaftliche Metriken wie das <strong>Dampfdruckdefizit (VPD)</strong> frei und bietet tiefere Einblicke in die Pflanzengesundheit.',
        },
        aiDiagnostics: {
            title: 'KI-Pflanzendoktor (Foto-Analyse)',
            content: 'Laden Sie ein Foto einer Problemzone hoch. Die KI analysiert das Bild im Kontext der Echtzeit-Vitalwerte Ihrer Pflanze und liefert eine Diagnose, Sofortmaßnahmen, langfristige Lösungen und Präventionstipps. Die Diagnose kann direkt im Journal gespeichert werden.',
        },
    },
    equipment: {
        title: 'Die Werkstatt',
        content: 'Ihr Werkzeugkasten für die präzise Planung und Berechnung Ihres Anbaus.',
        configurator: {
            title: 'KI-Setup-Konfigurator',
            content: 'Basierend auf Ihren Angaben zu Pflanzenanzahl und Budget/Stil generiert die <strong>Gemini-KI</strong> eine vollständige, markenspezifische Ausrüstungsempfehlung. Diese umfasst alle Komponenten von Zelt bis Nährstoffe, inklusive technischer Begründungen und einem Profi-Tipp.',
        },
        savedSetups: {
            title: 'Meine Setups',
            content: 'Verwalten Sie Ihre gespeicherten Konfigurationen. Bearbeiten Sie Details, löschen Sie Setups oder exportieren Sie sie als detailliertes <strong>PDF</strong>, das als professionelle Einkaufsliste dient.',
        },
        calculators: {
            title: 'Präzisionsrechner',
            content: 'Eine Sammlung essentieller Werkzeuge:<ul><li><strong>Belüftung:</strong> Berechnet die benötigte CFM/m³h-Leistung.</li><li><strong>Beleuchtung:</strong> Schätzt die optimale PPFD und Wattzahl.</li><li><strong>Stromkosten:</strong> Kalkuliert die Betriebskosten.</li><li><strong>Nährstoffe:</strong> Für präzise Mischverhältnisse.</li><li><strong>EC/PPM:</strong> Schnelle Umrechnung zwischen Skalen.</li><li><strong>Ertrag:</strong> Eine datengestützte Schätzung.</li></ul>',
        },
        growShops: {
            title: 'Grow Shops',
            content: 'Eine kuratierte Liste empfohlener Online-Grow-Shops für Europa und die USA, inklusive einer Analyse ihrer Stärken und direkten Links.',
        },
    },
    knowledge: {
        title: 'Der Wissens-Hub',
        content: 'Der Ort zum Lernen, Experimentieren und zur Perfektionierung Ihrer Fähigkeiten.',
        mentor: {
            title: 'Kontextbewusster KI-Mentor',
            content: 'Stellen Sie spezifische Fragen zu einer Ihrer aktiven Pflanzen. Die KI nutzt die <strong>Echtzeitdaten</strong> dieser Pflanze, um hochgradig personalisierte und relevante Ratschläge zu geben. Alle Konversationen können archiviert werden.',
        },
        guide: {
            title: 'Interaktiver Grow-Guide',
            content: 'Ein dynamischer Leitfaden, der die angezeigten Artikel an die aktuelle Phase Ihrer ausgewählten Pflanze anpasst und so immer die relevantesten Informationen bereitstellt.',
        },
        archive: {
            title: 'Zentralarchive',
            content: 'Verwalten Sie alle gespeicherten Antworten vom KI-Mentor und die proaktiven Ratschläge vom KI-Pflanzenberater. Alles ist durchsuchbar, editierbar und exportierbar.',
        },
        breeding: {
            title: 'Zuchtlabor',
            content: 'Kreuzen Sie die Samen Ihrer besten Ernten, um völlig neue, <strong>permanente Hybridsorten</strong> zu erschaffen. Diese werden Ihrer persönlichen Bibliothek unter "Meine Sorten" hinzugefügt und können für zukünftige Anbauprojekte ausgewählt werden.',
        },
        sandbox: {
            title: 'Simulations-Sandbox',
            content: 'Führen Sie risikofreie "Was-wäre-wenn"-Szenarien durch. Klonen Sie eine Ihrer Pflanzen und simulieren Sie den Effekt verschiedener Trainingstechniken (z.B. <strong>Topping vs. LST</strong>) über einen beschleunigten Zeitraum. Visualisieren Sie die Ergebnisse und treffen Sie datengestützte Entscheidungen für Ihre echten Pflanzen.',
        },
    },
    general: {
        title: 'Plattformweite Funktionen',
        content: 'Funktionen, die Ihr Erlebnis in der gesamten App verbessern.',
        pwa: {
            title: 'PWA & 100% Offline-Funktionalität',
            content: 'Installieren Sie CannaGuide als <strong>Progressive Web App</strong> für ein natives App-Erlebnis. Dank eines robusten Service Workers sind alle Ihre Daten und die Kernfunktionen der App auch ohne Internetverbindung vollständig verfügbar.',
        },
        commandPalette: {
            title: 'Befehlspalette (Cmd/Ctrl + K)',
            content: 'Drücken Sie <code>Cmd/Ctrl + K</code>, um die Befehlspalette zu öffnen. Dies ist das Power-User-Werkzeug für sofortige Navigation und Aktionen, ohne die Tastatur verlassen zu müssen.',
        },
        dataManagement: {
            title: 'Datensouveränität: Backup & Wiederherstellung',
            content: 'Unter <code>Einstellungen > Datenverwaltung</code> haben Sie die volle Kontrolle. Exportieren Sie Ihren gesamten App-Zustand (Pflanzen, Einstellungen, etc.) als JSON-Datei zur <strong>Sicherung</strong>. Importieren Sie diese Datei später, um Ihren Zustand auf jedem Gerät vollständig <strong>wiederherzustellen</strong>.',
        },
        accessibility: {
            title: 'Erweiterte Barrierefreiheit',
            content: 'Die App bietet umfassende Zugänglichkeitsoptionen. Aktivieren Sie eine <strong>legasthenikerfreundliche Schriftart</strong>, einen <strong>Modus mit reduzierter Bewegung</strong> oder nutzen Sie die integrierte <strong>Text-zu-Sprache (TTS)</strong> Funktion, um sich Inhalte vorlesen zu lassen.',
        },
    },
},
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
    question: 'Was bedeuten die N-P-K-Werte auf Düngemitteln?',
    answer: 'N-P-K steht für die drei primären Makronährstoffe: Stickstoff (N), Phosphor (P) und Kalium (K). <strong>N (Stickstoff)</strong> ist hauptsächlich für das Blatt- und Stängelwachstum (vegetative Phase) verantwortlich. <strong>P (Phosphor)</strong> ist entscheidend für die Wurzelentwicklung und die Blütenproduktion. <strong>K (Kalium)</strong> stärkt die allgemeine Pflanzengesundheit und die Blütenqualität.'
  },
  calmagUsage: {
    question: 'Was ist Cal-Mag und wann brauche ich es?',
    answer: 'Cal-Mag ist ein Zusatzstoff, der Kalzium und Magnesium liefert. Diese sekundären Nährstoffe sind entscheidend, werden aber manchmal von Basisdüngern nicht ausreichend abgedeckt. Sie benötigen es oft, wenn Sie gefiltertes/RO-Wasser verwenden oder in Kokossubstrat anbauen, da dieses Medium dazu neigt, Kalzium zu binden. Symptome eines Mangels sind oft kleine, rostbraune Flecken auf den Blättern.'
  },
  flushingPlants: {
    question: 'Was bedeutet "Spülen" und muss ich das tun?',
    answer: 'Spülen bedeutet, die Pflanze in den letzten 1-2 Wochen vor der Ernte nur mit reinem, pH-angepasstem Wasser zu gießen. Ziel ist es, überschüssige Nährstoffsalze aus dem Substrat und der Pflanze zu entfernen, was zu einem reineren, sanfteren Endprodukt führen soll. Es ist eine gängige Praxis, besonders bei mineralischen Düngern.'
  },
  vpdImportance: {
    question: 'Was ist VPD und warum ist es wichtig?',
    answer: 'VPD steht für Dampfdruckdefizit und ist ein genaueres Maß für das optimale Verhältnis von Temperatur und Luftfeuchtigkeit als nur die relative Luftfeuchtigkeit. Ein korrekter VPD-Wert ermöglicht es der Pflanze, optimal zu transpirieren (zu "schwitzen"), was die Nährstoffaufnahme und das Wachstum fördert. Ein zu hoher VPD (zu trocken) stresst die Pflanze, ein zu niedriger VPD (zu feucht) erhöht das Schimmelrisiko.'
  },
  idealTempHumidity: {
    question: 'Was sind die idealen Temperatur- und Luftfeuchtigkeitswerte?',
    answer: 'Das variiert je nach Phase: <br><strong>Sämlinge:</strong> 22-25°C, 70-80% RH. <br><strong>Wachstum:</strong> 22-28°C, 50-60% RH. <br><strong>Blüte:</strong> 20-26°C, 40-50% RH. <br>Versuchen Sie, große Schwankungen zwischen Licht- und Dunkelphasen zu vermeiden.'
  },
  airCirculation: {
    question: 'Wie wichtig ist die Luftzirkulation?',
    answer: 'Extrem wichtig. Ein leichter, konstanter Luftstrom von einem Umluftventilator hat mehrere Vorteile: Er stärkt die Stängel, beugt Schimmel und Schädlingen vor, sorgt für einen gleichmäßigen Gasaustausch an den Blättern und hilft, Temperatur- und Feuchtigkeitszonen im Zelt zu vermeiden.'
  },
  nutrientBurn: {
    question: 'Was sind verbrannte Blattspitzen?',
    answer: 'Braune, trockene und "verbrannte" Blattspitzen sind ein klassisches Zeichen für Nährstoffbrand (Überdüngung). Die Pflanze nimmt mehr Nährstoffe auf, als sie verarbeiten kann, und die Salze sammeln sich in den Blattspitzen. Reduzieren Sie die Düngerkonzentration bei der nächsten Fütterung oder spülen Sie das Substrat mit pH-angepasstem Wasser.'
  },
  spiderMites: {
    question: 'Wie erkenne und bekämpfe ich Spinnmilben?',
    answer: 'Spinnmilben sind winzige Schädlinge, die auf der Unterseite der Blätter leben. Erste Anzeichen sind kleine weiße oder gelbe Punkte auf der Blattoberseite. Bei starkem Befall bilden sich feine Spinnweben. Sie vermehren sich schnell in warmer, trockener Umgebung. Zur Bekämpfung können Sie Neemöl oder insektizide Seifenlösungen verwenden. Raubmilben sind eine gute biologische Kontrollmethode.'
  },
  stretchingCauses: {
    question: 'Warum streckt sich meine Pflanze so sehr?',
    answer: 'Übermäßiges Strecken (lange Internodienabstände) wird meist durch Lichtmangel verursacht. Die Pflanze versucht, näher an die Lichtquelle zu wachsen. Stellen Sie sicher, dass Ihre Lampe stark genug für Ihre Fläche ist und im richtigen Abstand hängt. Auch hohe Temperaturen können zum Strecken beitragen.'
  },
  toppingVsFimming: {
    question: 'Was ist der Unterschied zwischen Topping und FIMing?',
    answer: 'Beides sind "High-Stress-Training"-Methoden, um die Pflanze buschiger zu machen. Beim <strong>Topping</strong> wird der Haupttrieb komplett abgeschnitten, was zu zwei neuen Haupttrieben führt. Beim <strong>FIMing</strong> werden ca. 80% des neuen Triebs abgeknipst, was zu vier oder mehr neuen Trieben führen kann. Topping ist präziser, während FIMing potenziell mehr, aber oft ungleichmäßigere Triebe erzeugt.'
  },
  whatIsScrog: {
    question: 'Was ist ein SCROG?',
    answer: 'SCROG (Screen of Green) ist eine Anbautechnik, bei der ein Netz oder Gitter über die Pflanzen gespannt wird. Während die Pflanze wächst, werden die Triebe unter das Netz gesteckt und horizontal geführt. Dies schafft ein sehr breites, flaches und gleichmäßiges Kronendach, bei dem alle Blüten optimal Licht erhalten, was zu maximalen Erträgen führen kann.'
  },
  whatIsLollipopping: {
    question: 'Was ist Lollipopping?',
    answer: 'Lollipopping ist das Entfernen der unteren Triebe und Blätter, die wenig bis gar kein Licht erhalten. Indem man diese "unnötigen" Pflanzenteile entfernt, lenkt die Pflanze ihre gesamte Energie in die oberen, lichtexponierten Blüten (Colas), was zu größeren und dichteren Hauptblüten führt. Dies wird typischerweise kurz vor oder zu Beginn der Blütephase durchgeführt.'
  },
  dryingDuration: {
    question: 'Wie lange sollte ich meine Buds trocknen?',
    answer: 'Das Ziel ist ein langsamer und gleichmäßiger Trocknungsprozess. Hängen Sie die Zweige in einem dunklen Raum bei etwa 18-20°C und 55-60% Luftfeuchtigkeit auf. Dies dauert in der Regel 7-14 Tage. Ein guter Test ist, einen kleinen Zweig zu biegen: Wenn er knackt, aber nicht bricht, sind die Buds bereit für das Curing.'
  },
  curingImportance: {
    question: 'Was ist Curing und warum ist es wichtig?',
    answer: 'Curing (oder Fermentierung) ist der Prozess, bei dem die getrockneten Blüten in luftdichten Gläsern reifen. Während dieser Zeit bauen Enzyme und Bakterien Chlorophyll und andere unerwünschte Stoffe ab. Dies verbessert den Geschmack und das Aroma erheblich, macht den Rauch sanfter und kann sogar die Potenz erhöhen. Es ist ein entscheidender Schritt für ein qualitativ hochwertiges Endprodukt.'
  },
  storageHarvest: {
    question: 'Wie lagere ich meine geernteten Buds am besten?',
    answer: 'Lagern Sie Ihre fertig gecurten Buds in luftdichten Glasbehältern an einem kühlen, dunklen und trockenen Ort. Licht, Luft, hohe Temperaturen und Feuchtigkeit sind die größten Feinde von Cannabinoiden und Terpenen. Eine Luftfeuchtigkeit von 58-62% im Glas gilt als ideal und kann mit speziellen Feuchtigkeitspäckchen aufrechterhalten werden.'
  },
  autoflowerVsPhotoperiod: {
    question: 'Autoflower vs. Photoperiodisch: Was ist der Unterschied?',
    answer: '<strong>Photoperiodische</strong> Pflanzen benötigen eine Änderung des Lichtzyklus (auf 12 Stunden Dunkelheit pro Tag), um mit der Blüte zu beginnen. Sie haben eine längere Wachstumsphase und können größer werden. <strong>Autoflower</strong>-Pflanzen blühen automatisch nach einer bestimmten Zeit (ca. 3-4 Wochen), unabhängig vom Lichtzyklus. Sie sind schneller fertig und bleiben kleiner, was sie für Anfänger oder kleine Räume ideal macht.'
  },
  howOftenToWater: {
    question: 'Wie oft soll ich gießen?',
    answer: 'Es gibt keine feste Regel, da es von Topfgröße, Pflanzengröße, Temperatur und Substrat abhängt. Die beste Methode ist, den Topf anzuheben und das Gewicht zu fühlen. Gießen Sie gründlich, bis etwas Wasser unten herausläuft, und warten Sie dann, bis der Topf wieder deutlich leichter ist. Stecken Sie einen Finger etwa 2-3 cm tief in die Erde; wenn er trocken herauskommt, ist es Zeit zu gießen.'
  },
  potSize: {
    question: 'Welche Topfgröße sollte ich verwenden?',
    answer: 'Die Topfgröße hängt von der gewünschten Endgröße Ihrer Pflanze ab. Eine allgemeine Richtlinie: Für jede 30 cm Pflanzenhöhe benötigen Sie etwa 4 Liter Topfvolumen. Gängige Größen sind 11-19 Liter für mittelgroße Indoor-Pflanzen. Größere Töpfe müssen seltener gegossen werden, trocknen aber auch langsamer aus.'
  }
};
