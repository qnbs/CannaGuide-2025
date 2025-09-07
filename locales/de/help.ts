export const helpView = {
  title: 'Hilfecenter',
  tabs: {
    cultivation: 'Anbau',
  },
  sections: {
    firstSteps: {
      title: 'Erste Schritte & Hauptfunktionen',
      description: 'Willkommen beim Grow Guide! Diese App ist dein interaktiver Begleiter für den Cannabis-Anbau. Hier ein kurzer Überblick:',
      list: {
        strains: '<strong>Sorten entdecken:</strong> Durchstöbere die <strong>{strainsView}</strong>-Datenbank, nutze Filter und Suche, um die perfekte Sorte zu finden. Speichere Favoriten und starte einen neuen Grow direkt aus der Detailansicht.',
        plants: '<strong>Pflanzen managen:</strong> Verwalte bis zu drei Pflanzen im Bereich <strong>{plantsView}</strong>. Beobachte ihre Entwicklung in Echtzeit, protokolliere alle Maßnahmen im Journal und nutze den KI-Berater, dessen Ratschläge du nun pro Pflanze speichern und verwalten kannst.',
        knowledge: '<strong>Wissen aneignen:</strong> Folge der Schritt-für-Schritt-Anleitung unter <strong>{knowledgeView}</strong>, um die Grundlagen zu lernen. Hake die Checklisten ab, um deinen Wissensfortschritt zu verfolgen, und stelle dem KI-Mentor deine Fragen, deren Antworten du nun speichern, bearbeiten und verwalten kannst.',
        equipment: '<strong>Setup planen:</strong> Plane dein Setup mit dem <strong>{equipmentView}</strong>-Konfigurator. Deine gespeicherten Setups kannst du jetzt vollständig bearbeiten, löschen und exportieren.',
        settings: '<strong>App anpassen:</strong> Im <strong>{settingsView}</strong>-Bereich kannst du die Schriftgröße und die Sprache anpassen sowie deine Daten sichern und importieren.',
        commandPalette: '<strong>Befehlspalette:</strong> Drücke überall <strong>Cmd/Strg + K</strong>, um schnell zu navigieren, Aktionen wie "Alle gießen" auszuführen oder eine bestimmte Pflanze zu inspizieren.'
      }
    },
    faq: {
      title: 'Häufig gestellte Fragen (FAQ)',
      items: {
        q1: {
          q: 'Wie starte ich meinen ersten Anbau?',
          a: 'Gehe zum Bereich <strong>Sorten</strong>, wähle eine anfängerfreundliche Sorte (markiert mit "Einfach") und klicke auf "Anbau starten". Fülle die Setup-Details aus, und deine Pflanze erscheint im <strong>Pflanzen</strong>-Bereich, wo die Simulation beginnt.'
        },
        q2: {
          q: 'Meine Pflanze hat Probleme. Was soll ich tun?',
          a: 'Gehe zur Detailansicht deiner Pflanze im Bereich <strong>Pflanzen</strong>. Überprüfe die Vitalwerte und Warnungen. Nutze den <strong>KI-Berater</strong>, um eine Analyse und Handlungsempfehlungen basierend auf den aktuellen Daten deiner Pflanze zu erhalten. Vergleiche die Symptome auch mit den Beschreibungen im "Pflanzenpflege-ABC" hier im Hilfecenter.'
        },
        q3: {
          q: 'Kann ich meine Daten sichern oder übertragen?',
          a: 'Ja! Gehe zum <strong>Einstellungen</strong>-Bereich unter "Datenverwaltung". Dort kannst du alle deine Daten (Pflanzen, Einstellungen, eigene Sorten, Favoriten) in eine einzige Backup-Datei exportieren. Diese Datei kannst du später auf demselben oder einem anderen Gerät wieder importieren.'
        },
        q4: {
          q: 'In welchen Sprachen ist die App verfügbar?',
          a: 'Die App ist vollständig in <strong>Deutsch</strong> und <strong>Englisch</strong> verfügbar. Du kannst die Sprache jederzeit im <strong>Einstellungen</strong>-Bereich unter "Anzeige" -> "Sprache" ändern. Deine Auswahl wird automatisch gespeichert.'
        },
        q5: {
          q: 'Ist die App barrierefrei?',
          a: 'Ja, die Barrierefreiheit wurde stark verbessert. Die App unterstützt die Navigation per <strong>Tastatur</strong> und ist für die Nutzung mit <strong>Screenreadern</strong> optimiert. Alle interaktiven Elemente haben entsprechende Labels für eine klare Bedienung.'
        },
        q6: {
          q: 'Wie genau ist die Simulation?',
          a: 'Die App simuliert das Pflanzenwachstum basierend auf allgemeinen Modellen und spezifischen Sortendaten. Faktoren wie Genetik, Alter und Stress beeinflussen die Entwicklung. Die Simulation ist ein lehrreiches Werkzeug und kann von einem echten Anbau abweichen. Regelmäßige Interaktionen (Gießen, Düngen) halten deine simulierte Pflanze gesund.'
        },
        q7: {
          q: 'Kann ich meine hinzugefügten Sorten bearbeiten oder löschen?',
          a: 'Ja, wenn du im Tab "Meine Sorten" bist, erscheinen bei den Listeneinträgen und in der Rasteransicht (beim Hover) Bearbeiten- und Löschen-Buttons.'
        },
        q8: {
          q: 'Wie funktionieren die KI-Funktionen?',
          a: 'Die App nutzt Googles Gemini API für ihre intelligenten Funktionen. Der <strong>Setup-Konfigurator</strong> generiert Empfehlungen basierend auf deinen Eingaben. Der <strong>KI-Pflanzendoktor</strong> analysiert Blattbilder, um Probleme zu diagnostizieren. Der <strong>KI-Mentor</strong> beantwortet allgemeine Anbaufragen, und der <strong>KI-Berater</strong> gibt spezifische, datengestützte Ratschläge für deine Pflanzen in der Detailansicht.'
        },
        q9: {
          q: 'Wie funktioniert die Befehlspalette?',
          a: 'Drücke <strong>Cmd/Strg + K</strong>, um die Befehlspalette zu öffnen. Es ist ein mächtiges Werkzeug, mit dem du sofort zu jedem Bereich der App springen, allgemeine Aktionen wie "Alle gießen" ausführen oder eine Pflanze direkt inspizieren kannst, ohne durch Menüs zu klicken. Beginne einfach zu tippen, um zu finden, was du brauchst!'
        },
        q10: {
          q: 'Wie funktioniert der Export und was sind die Formate?',
          a: 'In der Sorten-Ansicht kannst du deine Sortenlisten in verschiedenen Formaten exportieren. <strong>PDF</strong> ist ideal für einen druckbaren, gut formatierten Bericht. <strong>CSV</strong> ist perfekt für Tabellenkalkulationen. <strong>TXT</strong> liefert eine einfache Textdatei, und <strong>JSON</strong> ist ideal für Datensicherungen oder die Verwendung in anderen Anwendungen. Alle Exporte werden auch im "Exporte"-Tab für einen schnellen erneuten Download gespeichert.'
        },
        q11: {
          q: 'Wie kann ich die Ratschläge des KI-Beraters speichern?',
          a: 'Nachdem der KI-Berater eine Analyse für eine deiner Pflanzen erstellt hat, erscheint unter der Antwort ein <strong>"Im Archiv speichern"</strong>-Button. Klicke darauf, um den Rat im Archiv der jeweiligen Pflanze zu sichern. Du kannst alle gespeicherten Ratschläge im selben "KI-Berater"-Tab einsehen, bearbeiten und löschen.'
        },
        q12: {
          q: 'Kann ich meine gespeicherten Ausrüstungs-Setups bearbeiten?',
          a: 'Ja! Gehe in der "Ausrüstung"-Ansicht zum Tab <strong>"Meine Setups"</strong>. Klicke bei einem gespeicherten Setup auf "Inspizieren". Im Detail-Modal kannst du dann auf "Bearbeiten" klicken, um den Namen des Setups, die einzelnen Komponenten und sogar deren Preise zu ändern.'
        }
      }
    },
    cannabinoidLexicon: {
      title: 'Umfassendes Cannabinoid-Lexikon',
      items: {
        c1: { term: 'Was sind Cannabinoide?', def: 'Cannabinoide sind die primären chemischen Verbindungen in Cannabis, die mit dem körpereigenen Endocannabinoid-System (ECS) interagieren und die vielfältigen Wirkungen der Pflanze hervorrufen. Sie ahmen die körpereigenen Endocannabinoide nach und beeinflussen so verschiedene physiologische Prozesse wie Stimmung, Schmerzempfinden, Appetit und Gedächtnis. Man unterscheidet Phytocannabinoid (aus der Pflanze) und Endocannabinoide (vom Körper produziert).' },
        c2: { term: 'THC (Δ⁹-Tetrahydrocannabinol)', def: '<strong>Eigenschaft:</strong> Das bekannteste und primär psychoaktive Cannabinoid. THC ist für das "High"-Gefühl verantwortlich.<br><strong>Potenzielle Effekte:</strong> Euphorisch, analgetisch (schmerzlindernd), appetitanregend, antiemetisch (gegen Übelkeit). Kann in hohen Dosen Angst oder Paranoia auslösen.<br><strong>Siedepunkt:</strong> ~157°C' },
        c3: { term: 'CBD (Cannabidiol)', def: '<strong>Eigenschaft:</strong> Das zweithäufigste Cannabinoid; nicht-psychoaktiv. Es erzeugt kein "High" und kann die psychoaktiven Effekte von THC sogar abmildern.<br><strong>Potenzielle Effekte:</strong> Anxiolytisch (angstlösend), entzündungshemmend, antikonvulsiv, neuroprotektiv. Sehr beliebt für therapeutische Anwendungen.<br><strong>Siedepunkt:</strong> ~160-180°C' },
        c4: { term: 'CBG (Cannabigerol)', def: '<strong>Eigenschaft:</strong> Oft als "Mutter aller Cannabinoide" bezeichnet, da es die Vorstufe ist, aus der andere Cannabinoide (THC, CBD, CBC) in der Pflanze synthetisiert werden. Nicht-psychoaktiv.<br><strong>Potenzielle Effekte:</strong> Antibakteriell, entzündungshemmend, analgetisch, kann den Augeninnendruck senken. Vielversprechend in der Forschung.<br><strong>Siedepunkt:</strong> ~52°C (Decarboxylierung)' },
        c5: { term: 'CBN (Cannabinol)', def: '<strong>Eigenschaft:</strong> Entsteht hauptsächlich, wenn THC durch Oxidation (Alterung, Lichteinwirkung) abgebaut wird. Nur sehr mild psychoaktiv.<br><strong>Potenzielle Effekte:</strong> Bekannt für seine stark sedierenden und schlaffördernden Eigenschaften. Oft in gealtertem Cannabis zu finden.<br><strong>Siedepunkt:</strong> ~185°C' },
        c6: { term: 'CBC (Cannabichromen)', def: '<strong>Eigenschaft:</strong> Ein weiteres nicht-psychoaktives Cannabinoid, das aus CBG entsteht. Bindet nicht gut an CB1-Rezeptoren im Gehirn, aber an andere Rezeptoren im Körper.<br><strong>Potenzielle Effekte:</strong> Stark entzündungshemmend, potenziell antidepressiv, fördert die Gehirnfunktion (Neurogenese).<br><strong>Siedepunkt:</strong> ~220°C' },
        c7: { term: 'THCV (Tetrahydrocannabivarin)', def: '<strong>Eigenschaft:</strong> Ein Analogon von THC mit leicht anderer chemischer Struktur. Die psychoaktive Wirkung ist oft klarer, energetischer und kürzer als bei THC.<br><strong>Potenzielle Effekte:</strong> Appetitzügler (im Gegensatz zu THC), kann den Blutzuckerspiegel regulieren. In niedrigen Dosen nicht, in hohen Dosen aber psychoaktiv.<br><strong>Siedepunkt:</strong> ~220°C' },
        c8: { term: 'Säureformen (THCA, CBDA, etc.)', def: 'In der rohen Cannabispflanze liegen die meisten Cannabinoide in ihrer sauren Form vor (z.B. THCA, CBDA). Diese sind nicht psychoaktiv. Erst durch Erhitzung (z.B. Rauchen, Verdampfen, Kochen) wird eine Carboxylgruppe abgespalten – ein Prozess namens <strong>Decarboxylierung</strong> – wodurch sie in ihre aktive Form (THC, CBD) umgewandelt werden.' },
      }
    },
    terpeneLexicon: {
      title: 'Terpen-Lexikon',
      items: {
        t1: { term: 'Was sind Terpene?', def: 'Terpene sind aromatische Öle, die in vielen Pflanzen vorkommen und ihnen ihren charakteristischen Duft und Geschmack verleihen (z.B. der Geruch von Kiefern oder Lavendel). In Cannabis modulieren sie die Wirkung von Cannabinoiden wie THC und CBD – ein Phänomen, das als <strong>"Entourage-Effekt"</strong> bekannt ist. Jedes Terpen hat ein einzigartiges Aromaprofil und potenzielle therapeutische Eigenschaften.' },
        t2: { term: 'Myrcen', def: '<strong>Aroma:</strong> Erdig, moschusartig, kräuterig, mit Noten von Nelken und tropischen Früchten wie Mango.<br><strong>Potenzielle Effekte:</strong> Wirkt oft entspannend und sedierend. Man nimmt an, dass es die Wirkung von THC verstärkt und die Blut-Hirn-Schranke durchlässiger macht, was den Wirkungseintritt beschleunigt.<br><strong>Siedepunkt:</strong> ~167°C' },
        t3: { term: 'Limonen', def: '<strong>Aroma:</strong> Starkes, frisches Zitrusaroma, das an Zitronen, Orangen und Limetten erinnert.<br><strong>Potenzielle Effekte:</strong> Stimmungsaufhellend, stressabbauend und angstlösend. Kann ein Gefühl von Energie und Wohlbefinden vermitteln.<br><strong>Siedepunkt:</strong> ~176°C' },
        t4: { term: 'Caryophyllen', def: '<strong>Aroma:</strong> Pfeffrig, würzig, holzig, mit Noten von Nelken und Zimt.<br><strong>Potenzielle Effekte:</strong> Einzigartig, da es an die CB2-Rezeptoren im Endocannabinoid-System bindet (ähnlich einem Cannabinoid). Wirkt stark entzündungshemmend und schmerzlindernd.<br><strong>Siedepunkt:</strong> ~130°C' },
        t5: { term: 'Pinen', def: '<strong>Aroma:</strong> Frisches, scharfes Aroma von Kiefernnadeln und Tannenbäumen.<br><strong>Potenzielle Effekte:</strong> Fördert Wachsamkeit, Gedächtnis und Konzentration. Kann als Bronchodilatator (erweitert die Atemwege) wirken und hat entzündungshemmende Eigenschaften.<br><strong>Siedepunkt:</strong> ~155°C' },
        t6: { term: 'Terpinolen', def: '<strong>Aroma:</strong> Komplexes, vielschichtiges Aroma: blumig, kräuterig, kiefernartig mit einem Hauch von Zitrus und Apfel.<br><strong>Potenzielle Effekte:</strong> Wirkt oft leicht sedierend und beruhigend. Hat antioxidative und antibakterielle Eigenschaften.<br><strong>Siedepunkt:</strong> ~186°C' },
        t7: { term: 'Linalool', def: '<strong>Aroma:</strong> Blumig, süß, mit einem starken Lavendel-Charakter.<br><strong>Potenzielle Effekte:</strong> Bekannt für seine beruhigenden, angstlösenden und schlaffördernden Eigenschaften. Reduziert Stress.<br><strong>Siedepunkt:</strong> ~198°C' },
        t8: { term: 'Humulen', def: '<strong>Aroma:</strong> Erdig, holzig, hopfig (es ist das Hauptterpen in Hopfen).<br><strong>Potenzielle Effekte:</strong> Appetitzügler und entzündungshemmend. Trägt zum "erdigen" Geschmack vieler Sorten bei.<br><strong>Siedepunkt:</strong> ~106°C' },
        t9: { term: 'Ocimen', def: '<strong>Aroma:</strong> Süß, kräuterig und holzig. Erinnert an eine Mischung aus Minze und Petersilie.<br><strong>Potenzielle Effekte:</strong> Aufmunternd, antiviral und abschwellend. Oft in Sativa-Sorten zu finden, die eine energetische Wirkung haben.<br><strong>Siedepunkt:</strong> ~100°C' },
        t10: { term: 'Bisabolol', def: '<strong>Aroma:</strong> Leicht süßlich, blumig, mit Noten von Kamille und einem Hauch von Pfeffer.<br><strong>Potenzielle Effekte:</strong> Starke entzündungshemmende und hautberuhigende Eigenschaften. Wird häufig in Kosmetika verwendet.<br><strong>Siedepunkt:</strong> ~153°C' },
      }
    },
    flavonoidLexicon: {
      title: 'Flavonoid-Lexikon',
      items: {
        f1: { term: 'Was sind Flavonoide?', def: 'Flavonoide sind eine vielfältige Gruppe von Pflanzenstoffen, die für die leuchtenden Farben vieler Früchte, Gemüse und Blumen verantwortlich sind (z.B. das Blau von Heidelbeeren oder das Rot von Erdbeeren). In Cannabis tragen sie nicht nur zur Färbung (z.B. violette Töne) bei, sondern auch zu Aroma und Geschmack und wirken im Entourage-Effekt synergistisch mit Cannabinoiden und Terpenen. Sie besitzen starke antioxidative und entzündungshemmende Eigenschaften.' },
        f2: { term: 'Cannflavine (A, B, C)', def: '<strong>Eigenschaft:</strong> Eine Gruppe von Flavonoiden, die ausschließlich in der Cannabis-Pflanze vorkommen.<br><strong>Potenzielle Effekte:</strong> Besonders bekannt für ihre extrem potenten entzündungshemmenden Eigenschaften. Studien haben gezeigt, dass Cannflavin A und B bis zu 30-mal wirksamer als Aspirin sein können.' },
        f3: { term: 'Quercetin', def: '<strong>Eigenschaft:</strong> Eines der häufigsten Flavonoide in der Natur, auch in Grünkohl, Äpfeln und Zwiebeln zu finden.<br><strong>Potenzielle Effekte:</strong> Ein starkes Antioxidans mit antiviralen und potenziell krebshemmenden Eigenschaften.' },
        f4: { term: 'Kaempferol', def: '<strong>Eigenschaft:</strong> Weit verbreitet in Obst und Gemüse wie Brokkoli und Trauben.<br><strong>Potenzielle Effekte:</strong> Wirkt als starkes Antioxidans und wird auf seine Fähigkeit untersucht, das Risiko chronischer Krankheiten zu verringern.' },
        f5: { term: 'Apigenin', def: '<strong>Eigenschaft:</strong> In großen Mengen in Kamille, Petersilie und Sellerie zu finden.<br><strong>Potenzielle Effekte:</strong> Bekannt für seine angstlösenden, beruhigenden und sedierenden Eigenschaften, ähnlich den Effekten von Kamillentee.' },
      }
    },
    agronomyBasics: {
      title: 'Agronomische Grundlagen',
      items: {
        a1: { term: 'Sativa, Indica & Hybrid', def: 'Diese Begriffe beschreiben die Hauptkategorien von Cannabis, die sich traditionell in Wachstumsmustern und Wirkungen unterscheiden:<ul><li><strong>Sativa:</strong> Wächst hoch und schlank mit schmalen Blättern. Die Wirkung wird oft als zerebral, energetisierend und kreativ beschrieben ("Kopf-High").</li><li><strong>Indica:</strong> Wächst kurz, buschig und kompakt mit breiten Blättern. Die Wirkung ist meist körperlich, entspannend und sedierend ("Körper-High").</li><li><strong>Hybrid:</strong> Eine Kreuzung aus Sativa- und Indica-Genetik. Moderne Sorten sind fast alle Hybride, deren Eigenschaften und Wirkungen eine Mischung beider Elternteile sind. Das Terpenprofil ist oft ein besserer Indikator für die zu erwartende Wirkung als die einfache Sativa/Indica-Klassifizierung.</li></ul>' },
        a2: { term: 'Der Entourage-Effekt', def: 'Der Entourage-Effekt beschreibt die Theorie, dass all diese Verbindungen (Cannabinoide, Terpene, Flavonoide) synergistisch zusammenwirken, um eine umfassendere und nuanciertere Wirkung zu erzeugen als jede einzelne Verbindung allein. Zum Beispiel wirken THC und CBD zusammen anders als isoliert. Ein Vollspektrum-Produkt ist daher oft wirksamer als ein Isolat.'},
        a3: { term: 'Blütezeit: Photoperiodisch vs. Autoflower', def: '<ul><li><strong>Photoperiodisch:</strong> Diese Pflanzen benötigen eine Änderung des Lichtzyklus, um die Blütephase einzuleiten. Indoors wird dies durch den Wechsel zu 12 Stunden Licht und 12 Stunden Dunkelheit (12/12) erreicht. Sie können theoretisch unbegrenzt in der vegetativen Phase gehalten werden.</li><li><strong>Autoflower (Autoflowering):</strong> Diese Sorten enthalten Ruderalis-Genetik, eine Cannabis-Unterart aus kalten Regionen. Sie beginnen automatisch nach einer genetisch festgelegten Zeit (typischerweise 2-4 Wochen) zu blühen, unabhängig vom Lichtzyklus. Sie haben einen kürzeren Lebenszyklus und sind oft anfängerfreundlicher und kompakter.</li></ul>' },
        a4: { term: 'Ertrag & Höhe verstehen', def: 'Diese Zahlen sind Schätzungen, die stark von den Anbaubedingungen abhängen.<ul><li><strong>Ertrag (g/m²):</strong> Gibt an, wie viel Ernte (in Gramm trockener Blüten) pro Quadratmeter Anbaufläche unter optimalen Bedingungen erwartet werden kann. Relevant für den Indoor-Anbau.</li><li><strong>Ertrag (g/Pflanze):</strong> Gibt den erwarteten Ertrag für eine einzelne Pflanze an, typischerweise im Outdoor-Anbau.</li><li><strong>Faktoren:</strong> Genetik, Lichtintensität, Topfgröße, Nährstoffversorgung, Trainingstechniken und die Erfahrung des Züchters haben einen massiven Einfluss auf beide Werte.</li></ul>' },
      }
    },
    plantCareABCs: {
      title: 'Pflanzenpflege-ABC',
      items: {
        pc1: { term: 'Lebensphasen im Detail', def: '<ul><li><strong>Samen/Keimung:</strong> Der Samen benötigt Feuchtigkeit, Wärme und Dunkelheit. Die Pfahlwurzel tritt aus.</li><li><strong>Sämling:</strong> Die Pflanze entwickelt ihre ersten Keimblätter und dann die ersten echten, gezackten Blätter. Eine sehr verletzliche Phase.</li><li><strong>Wachstumsphase (vegetativ):</strong> Die Pflanze konzentriert sich auf das Wachstum von Blättern, Stängeln und Wurzeln. Benötigt viel Licht (18+ Stunden) und stickstoffreichen Dünger.</li><li><strong>Blütephase:</strong> Nach dem Wechsel zu einem 12/12-Lichtzyklus (bei photoperiodischen Sorten) stellt die Pflanze das vegetative Wachstum ein und entwickelt Blüten. Der Nährstoffbedarf verlagert sich zu Phosphor und Kalium.</li><li><strong>Ernte, Trocknung & Curing:</strong> Die entscheidenden letzten Schritte. Richtiges Trocknen und Aushärten sind für Qualität, Geschmack und Haltbarkeit unerlässlich.</li></ul>' },
        pc2: { term: 'Vitalwerte meistern', def: '<ul><li><strong>pH & Nährstoffsperre:</strong> Der pH-Wert beeinflusst die Fähigkeit der Wurzeln, Nährstoffe aufzunehmen. Ein falscher pH-Wert führt zur "Nährstoffsperre", bei der die Pflanze hungert, obwohl Nährstoffe im Substrat vorhanden sind. Ideal in Erde: 6.0-7.0, in Hydro/Coco: 5.5-6.5.</li><li><strong>EC (Elektrische Leitfähigkeit):</strong> Misst die Nährstoffkonzentration. Zu hoher EC führt zu "Nährstoffbrand" (verbrannte Blattspitzen), zu niedriger zu Mängeln.</li><li><strong>Substratfeuchtigkeit & Wurzelatmung:</strong> Die Wurzeln benötigen nicht nur Wasser, sondern auch Sauerstoff. Ein ständiger Zyklus zwischen feucht und leicht trocken ist ideal. Chronische Nässe führt zu Wurzelfäule.</li></ul>' },
        pc3: { term: 'Fortgeschrittene Trainingstechniken', def: 'Training formt die Pflanze für maximale Lichtausbeute und Ertrag.<ul><li><strong>LST (Low Stress Training):</strong> Sanftes Herunterbiegen von Ästen, um ein breites, flaches Blätterdach zu schaffen.</li><li><strong>Topping:</strong> Abschneiden des Haupttriebs, um die Pflanze zu zwingen, zwei neue Haupttriebe zu bilden (buschigeres Wachstum).</li><li><strong>FIMing (Fuck I Missed):</strong> Eine Variante des Toppings, bei der nur ein Teil des Haupttriebs entfernt wird, was zu 4+ neuen Trieben führen kann.</li><li><strong>SCROG (Screen of Green):</strong> Ein Netz wird über die Pflanzen gespannt. Alle Triebe werden durch das Netz geflochten, um ein perfekt ebenes und lichteffizientes Blütendach zu schaffen.</li><li><strong>Entlaubung (Defoliation):</strong> Gezieltes Entfernen großer Fächerblätter, um die Lichtdurchdringung und Luftzirkulation zu den unteren Blütenansätzen zu verbessern.</li></ul>' },
        pc4: { term: 'Häufige Probleme & Lösungen', def: '<ul><li><strong>Nährstoffmängel (Mobile Nährstoffe wie N, P, K, Mg):</strong> Symptome treten zuerst an den unteren, älteren Blättern auf, da die Pflanze Nährstoffe zu neuem Wachstum verschiebt. <strong>Lösung:</strong> Düngung anpassen.</li><li><strong>Nährstoffmängel (Immobile Nährstoffe wie Ca, S, B):</strong> Symptome treten zuerst an den oberen, neuen Blättern auf, da die Pflanze diese Nährstoffe nicht intern verschieben kann. <strong>Lösung:</strong> Düngung anpassen; oft wird ein Cal/Mag-Zusatz benötigt.</li><li><strong>Schädlinge:</strong><ul><li><strong>Spinnmilben:</strong> Winzige weiße Punkte auf den Blättern, feine Gespinste. <strong>Lösung:</strong> Neemöl, Raubmilben.</li><li><strong>Trauermücken:</strong> Kleine schwarze Fliegen um die Erde. <strong>Lösung:</strong> Gelbe Klebefallen, Erde mehr austrocknen lassen, Nematoden.</li></ul></li></ul>' },
      }
    },
    glossary: {
      title: 'Umfassendes Glossar',
      items: {
        g1: { term: 'Calyx (Blütenkelch)', def: 'Der eigentliche Teil der Blüte, der die Samenanlage umschließt. Die Blütenkelche sind die harzreichsten Teile der Pflanze.' },
        g2: { term: 'Klon (Steckling)', def: 'Ein genetisch identischer Schnittling von einer Mutterpflanze, der bewurzelt wird, um eine neue Pflanze zu züchten.' },
        g3: { term: 'Feminisiert', def: 'Samen, die so behandelt wurden, dass sie fast ausschließlich (99%+) weibliche Pflanzen hervorbringen, die die begehrten Blüten produzieren.' },
        g4: { term: 'Spülen (Flushing)', def: 'Die Pflanze in den letzten 1-2 Wochen vor der Ernte nur mit klarem, pH-angepasstem Wasser zu gießen, um überschüssige Nährstoffsalze aus dem Substrat und der Pflanze zu entfernen, was den Geschmack verbessert.' },
        g5: { term: 'Landrasse', def: 'Eine reine, ursprüngliche Cannabissorte, die sich über lange Zeit auf natürliche Weise in einer bestimmten geografischen Region entwickelt und angepasst hat (z.B. Afghan Kush, Durban Poison).' },
        g6: { term: 'N-P-K', def: 'Das Verhältnis der drei primären Makronährstoffe, die Pflanzen benötigen: Stickstoff (N), Phosphor (P) und Kalium (K). Düngerflaschen geben dieses Verhältnis oft als Zahlen an (z.B. 5-10-5).' },
        g7: { term: 'Phänotyp', def: 'Die beobachtbaren Merkmale einer Pflanze, die aus der Interaktion ihrer Genetik (Genotyp) und der Umwelt resultieren. Samen derselben Sorte können unterschiedliche Phänotypen hervorbringen.' },
        g8: { term: 'Pistill (Blütenstempel)', def: 'Die kleinen "Härchen" an den Blütenkelchen, die anfangs weiß sind und bei der Reifung orange/braun werden. Sie dienen dem Einfangen von Pollen.' },
        g9: { term: 'Trichome', def: 'Die winzigen, pilzförmigen Harzdrüsen auf den Blüten und Blättern, die Cannabinoide und Terpene produzieren. Ihre Farbe (klar, milchig, bernsteinfarben) ist der beste Indikator für den Erntezeitpunkt.' },
      }
    },
    furtherReading: {
      title: 'Weiterführende Ressourcen',
      description: 'Wenn du noch tiefer in die Materie eintauchen möchtest, sind hier einige empfohlene Bücher und Webseiten, die als Standardwerke in der Grower-Community gelten:',
      resources: [
        {
          title: 'Marijuana Grower\'s Handbook von Ed Rosenthal',
          description: 'Ein weiteres Standardwerk von einer Legende der Szene. Rosenthal erklärt komplexe Themen auf verständliche Weise und bietet praktische Ratschläge für alle Erfahrungsstufen.',
          url: 'https://www.amazon.de/Marijuana-Growers-Handbook-Internationally-Authority/dp/0932551467'
        },
        {
          title: 'Grow Weed Easy (Website)',
          description: 'Eine unglaublich umfangreiche und anfängerfreundliche Online-Ressource. Bietet detaillierte Anleitungen, Problemlösungs-Guides und Tutorials zu allen erdenklichen Themen des Cannabis-Anbaus. Perfekt, um spezifische Fragen schnell zu klären.',
          url: 'https://www.growweedeasy.com'
        },
        {
          title: 'Leafly (Website)',
          description: 'Obwohl hauptsächlich als Sorten-Datenbank bekannt, bietet Leafly auch einen großen Lernbereich mit Artikeln zu Anbautechniken, Wissenschaft und Kultur. Ideal, um sich über spezifische Terpenprofile oder Cannabinoide zu informieren.',
          url: 'https://www.leafly.com/learn'
        }
      ]
    },
    about: {
      title: 'Über die App',
      version: 'v2.4.0',
      appName: 'Cannabis Grow Guide',
      description: 'Diese App ist ein interaktiver Leitfaden, der dich auf deiner Reise des Cannabis-Anbaus unterstützt. Verfolge deine Pflanzen, lerne über Sorten und erhalte Expertentipps zu Ausrüstung und Techniken.',
      features: '<strong>Neue Funktionen:</strong> Diese Version enthält jetzt pflanzenspezifische KI-Berater-Archive und volle CRUD-Funktionalität für alle gespeicherten Daten (Setups & Mentor-Antworten).',
      devWithAIStudioTitle: 'Entwickelt mit AI Studio',
      devWithAIStudioText: 'Diese App wurde mit <strong>AI Studio</strong> von Google entwickelt, einer innovativen Plattform, die die Erstellung und Änderung komplexer Webanwendungen durch Befehle in natürlicher Sprache ermöglicht. Die Benutzeroberfläche wurde entworfen, Funktionalitäten implementiert und die Gemini-KI für intelligente Funktionen integriert – alles durch iterative Prompts. AI Studio beschleunigt den Entwicklungsprozess erheblich und eröffnet neue Möglichkeiten in der App-Erstellung.',
      getTheAppHere: 'Hol dir die App hier',
      githubTitle: 'Open Source auf GitHub',
      githubText: 'Diese Anwendung ist vollständig Open Source und der Code ist auf GitHub verfügbar. Du bist herzlich eingeladen, den Quellcode einzusehen, Probleme zu melden oder zur Entwicklung des Projekts beizutragen. Deine Zusammenarbeit hilft, den Grow Guide noch besser zu machen!',
      githubLinkText: 'Projekt auf GitHub ansehen',
      disclaimerTitle: 'Haftungsausschluss',
      disclaimerText: 'Alle Informationen in dieser App dienen ausschließlich zu Bildungs- und Unterhaltungszwecken. Der Anbau von Cannabis unterliegt strengen gesetzlichen Bestimmungen, die je nach Land und Region variieren. Bitte informiere dich über die Gesetze in deiner Gegend und handle stets verantwortungsbewusst und gesetzeskonform.',
      privacyTitle: 'Datenschutz',
      privacyText: 'Deine Privatsphäre ist uns wichtig. Alle deine Daten, einschließlich Pflanzen-Journale und Einstellungen, werden ausschließlich lokal in deinem Browser gespeichert und verlassen niemals dein Gerät.'
    }
  }
};