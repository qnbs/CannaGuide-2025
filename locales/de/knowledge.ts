

export const knowledgeView = {
    title: 'Wissens-Hub',
    subtitle: 'Dein interaktiver Leitfaden für den erfolgreichen Anbau.',
    tabs: {
        mentor: 'KI-Mentor',
        guide: 'Grow-Guide',
        archive: 'Mentor-Archiv',
        breeding: 'Zuchtlabor',
        sandbox: 'Sandbox',
    },
    hub: {
        selectPlant: 'Pflanze auswählen',
        noPlants: 'Keine aktiven Pflanzen für kontextbezogene Ratschläge vorhanden. Starte einen Anbau!',
        todaysFocus: 'Heutiger Fokus für {{plantName}}',
    },
    aiMentor: {
        title: 'KI-Mentor',
        plantContext: 'Chatte mit dem KI-Mentor im Kontext von {{name}}',
        plantContextSubtitle: 'Wähle eine Pflanze aus, um kontextbezogene Fragen zu stellen und Ratschläge zu erhalten.',
        startChat: 'Chat starten',
        inputPlaceholder: 'Frage den Mentor...',
        clearChat: 'Chat löschen',
        clearConfirm: 'Möchtest du den Chatverlauf für diese Pflanze wirklich löschen?',
    },
    archive: {
        title: 'Mentor-Archiv',
        empty: 'Du hast noch keine Mentor-Antworten archiviert.',
        saveButton: 'Im Archiv speichern',
        saveSuccess: 'Antwort im Archiv gespeichert!',
        queryLabel: 'Deine Anfrage',
        editTitle: 'Antwort bearbeiten',
    },
    breeding: {
        title: 'Zuchtlabor',
        description: 'Kreuze deine gesammelten Samen, um neue, einzigartige Sorten mit kombinierten Eigenschaften zu erschaffen.',
        collectedSeeds: 'Gesammelte Samen',
        noSeeds: 'Sammle Samen von erntereifen Pflanzen, um mit dem Züchten zu beginnen.',
        parentA: 'Elternteil A',
        parentB: 'Elternteil B',
        selectSeed: 'Samen auswählen',
        dropSeed: 'Samen hier ablegen',
        breedButton: 'Neue Sorte züchten',
        resultsTitle: 'Zuchtergebnis',
        newStrainName: 'Name der neuen Sorte',
        potentialTraits: 'Mögliche Merkmale',
        saveStrain: 'Sorte speichern',
        breedingSuccess: 'Neue Sorte "{{name}}" erfolgreich gezüchtet und zu "Meine Sorten" hinzugefügt!',
    },
    scenarios: {
        toppingVsLst: {
            title: "Experiment 'Topping vs. LST' starten",
            description: "Simuliert eine 14-tägige Wachstumsperiode und vergleicht eine Pflanze, die LST erhält, mit einer, die getoppt wurde."
        }
    },
    knowledgebase: {
        'phase1-prep': {
            title: 'Phase 1: Vorbereitung & Ausrüstung',
            content: `<h3>Willkommen beim Grow!</h3><p>Eine erfolgreiche Ernte beginnt mit einer soliden Vorbereitung. In dieser Phase geht es darum, die perfekte Umgebung zu schaffen, bevor dein Samen überhaupt das Substrat berührt.</p>
                      <strong>Sauberkeit ist entscheidend:</strong> Reinige und desinfiziere deinen gesamten Anbaubereich gründlich, einschließlich Zeltwände, Boden und aller Geräte, um Schädlinge und Krankheiten von Anfang an zu vermeiden.<br>
                      <strong>Ausrüstungs-Check:</strong>
                      <ul>
                        <li><strong>Licht:</strong> Teste deine Lampe und den Timer. Positioniere das Licht für Sämlinge viel höher als bei einer reifen Pflanze, um Stress zu vermeiden. Beachte die Herstellerempfehlungen.</li>
                        <li><strong>Belüftung:</strong> Stelle sicher, dass dein Abluftventilator, der Lufteinlass und alle Umluftventilatoren korrekt funktionieren. Guter Luftstrom ist entscheidend.</li>
                        <li><strong>Substrat & Töpfe:</strong> Wenn du Erde verwendest, befeuchte sie leicht vor dem Einpflanzen. Sorge für eine ausgezeichnete Drainage deiner Töpfe, um Wurzelfäule zu verhindern.</li>
                      </ul>
                      <strong>Umgebung kalibrieren:</strong> Kalibriere deine Thermo-Hygrometer. Strebe eine stabile Umgebung um <strong>22-25°C (72-77°F)</strong> und <strong>65-75% relative Luftfeuchtigkeit</strong> an.`
        },
        'phase2-seedling': {
            title: 'Phase 2: Keimung & Sämling',
            content: `<h3>Die ersten Lebenswochen</h3><p>Dies ist die empfindlichste Phase. Das Motto lautet: Weniger ist mehr. Vermeide es, deine Pflanze zu sehr zu bemuttern.</p>
                      <strong>Keimung:</strong> Halte das Medium konstant feucht, aber niemals durchnässt. Eine Feuchtigkeitshaube kann helfen, eine hohe Luftfeuchtigkeit (70-80%) aufrechtzuerhalten, was ideal zum Keimen ist.<br>
                      <strong>Licht:</strong> Sämlinge benötigen kein intensives Licht. Eine Leuchtstoffröhre mit geringer Wattzahl oder eine gedimmte LED ist perfekt. Ein 18/6-Lichtzyklus ist Standard. Halte die Lampen weit genug entfernt, um Verbrennungen zu vermeiden – wenn sich dein Handrücken auf Höhe der Pflanzenspitze unangenehm warm anfühlt, ist die Lampe zu nah.<br>
                      <strong>Wasser:</strong> Gieße sparsam in einem kleinen Kreis um den Stängel. Das Wurzelsystem ist winzig und kann leicht ertrinken.<br>
                      <strong>Nährstoffe:</strong> Dünge noch nicht! Die meisten Substrate enthalten genug Nährstoffe für die ersten 2-3 Wochen. Warte, bis die Pflanze mindestens 3-4 Sätze echter Blätter hat, bevor du eine sehr schwache (1/4 Stärke) Nährlösung einführst.`
        },
        'phase3-vegetative': {
            title: 'Phase 3: Vegetatives Wachstum',
            content: `<h3>Zeit zu wachsen!</h3><p>In dieser Phase konzentriert sich deine Pflanze darauf, eine starke Struktur aus Blättern, Ästen und Wurzeln zu entwickeln. Dies ist die Zeit für Trainingstechniken.</p>
                      <strong>Licht:</strong> Deine Pflanze verträgt jetzt viel mehr Licht. Erhöhe allmählich die Intensität oder senke die Lichtquelle. Ein 18/6-Lichtzyklus bleibt Standard für photoperiodische Pflanzen.<br>
                      <strong>Nährstoffe:</strong> Erhöhe langsam die Nährstoffstärke. Ein stickstoffreicher (N) Dünger ist jetzt entscheidend für das Blattwachstum.<br>
                      <strong>Training:</strong> Jetzt ist der perfekte Zeitpunkt, um mit dem Training zu beginnen, um ein gleichmäßiges Kronendach zu schaffen und deinen Endertrag zu steigern. Beginne mit <strong>LST (Low-Stress-Training)</strong>, um Äste sanft zu biegen, oder führe ein <strong>Topping</strong> durch, um mehrere Hauptblüten zu erzeugen.<br>
                      <strong>Umgebung:</strong> Die ideale Luftfeuchtigkeit sinkt auf etwa 50-70%. Eine gute Luftzirkulation wird wichtiger, da die Pflanze dichter wird.`
        },
        'phase4-flowering': {
            title: 'Phase 4: Blüte',
            content: `<h3>Die Blüte beginnt</h3><p>Dies ist die aufregendste Phase, in der deine Pflanze beginnt, Blüten zu produzieren. Die Umstellung des Lichtzyklus ist der Auslöser für photoperiodische Sorten.</p>
                      <strong>Lichtzyklus:</strong> Um die Blüte einzuleiten, musst du auf einen strikten Zyklus von <strong>12 Stunden Licht und 12 Stunden *ununterbrochener* Dunkelheit</strong> umschalten.<br>
                      <strong>Der Stretch:</strong> In den ersten 2-3 Wochen der Blüte kann deine Pflanze ihre Höhe verdoppeln oder sogar verdreifachen. Sei auf diesen Wachstumsschub vorbereitet!<br>
                      <strong>Nährstoffe:</strong> Wechsle zu einem Blütedünger, der weniger Stickstoff (N) und mehr Phosphor (P) und Kalium (K) enthält, um die Blütenentwicklung zu unterstützen.<br>
                      <strong>Luftfeuchtigkeit:</strong> Senke die Luftfeuchtigkeit schrittweise auf <strong>40-50%</strong>, um das Risiko von Knospenfäule (Botrytis) in den dichten Blüten zu verringern.`
        },
        'phase5-harvest': {
            title: 'Phase 5: Ernte, Trocknen & Curing',
            content: `<h3>Der letzte Schliff</h3><p>Geduld in dieser letzten Phase entscheidet über die Qualität des Endprodukts. Überstürze es nicht!</p>
                      <strong>Erntezeitpunkt:</strong> Beobachte die Trichome mit einer Juwelierlupe oder einem Mikroskop. Ernte, wenn die meisten Trichome milchig/trüb sind (für maximale THC-Potenz) und einige wenige bernsteinfarben sind (für eine entspannendere Wirkung). Klare Trichome sind zu früh.<br>
                      <strong>Trocknen:</strong> Hänge die Zweige kopfüber in einem dunklen, kühlen Raum mit sanfter Luftzirkulation auf. Strebe <strong>18-20°C (64-68°F)</strong> und <strong>55-60% Luftfeuchtigkeit</strong> an. Dieser langsame Trocknungsprozess dauert 7-14 Tage und ist entscheidend für den Erhalt der Terpene.<br>
                      <strong>Curing (Fermentierung):</strong> Sobald die kleineren Stängel beim Biegen knacken statt sich nur zu biegen, lege die trockenen Blüten in luftdichte Gläser. Öffne die Gläser in der ersten Woche täglich für 5-10 Minuten ("burping"), um Feuchtigkeit entweichen zu lassen. Dieser Prozess verbessert Geschmack, Aroma und Sanftheit dramatisch.`
        },
        'fix-overwatering': {
            title: 'Problembehebung: Überwässerung',
            content: `<h3>Hilfe, meine Pflanze ertrinkt!</h3><p>Überwässerung ist der häufigste Fehler bei Anfängern. Es erstickt die Wurzeln und hindert sie daran, Sauerstoff und Nährstoffe aufzunehmen.</p>
                      <strong>Symptome:</strong> Die ganze Pflanze sieht schlaff und traurig aus. Die Blätter fühlen sich fest und schwer an und krümmen sich nach unten (Krallenbildung). Die Erde bleibt tagelang dunkel und nass.<br>
                      <strong>Sofortmaßnahmen:</strong> 
                      <ul>
                        <li><strong>Gießen einstellen:</strong> Gieße nicht erneut, bis der Topf deutlich leichter ist.</li>
                        <li><strong>Luftzirkulation verbessern:</strong> Richte einen Ventilator auf die Erdoberfläche, um das Austrocknen zu beschleunigen.</li>
                        <li><strong>Drainage prüfen:</strong> Stelle sicher, dass dein Topf nicht in einer Pfütze aus abgelaufenem Wasser steht.</li>
                      </ul>
                      <strong>Prävention:</strong> Hebe deinen Topf immer an, um sein Gewicht vor und nach dem Gießen zu fühlen. Dies ist die zuverlässigste Methode, um zu wissen, wann es Zeit zum Gießen ist.`
        },
        'fix-calcium-deficiency': {
            title: 'Problembehebung: Kalziummangel',
            content: `<h3>Kalziummangel beheben</h3><p>Kalzium ist ein immobiler Nährstoff, was bedeutet, dass die Pflanze ihn nicht von alten zu neuen Blättern bewegen kann. Mangelerscheinungen zeigen sich daher meist an neuem Wachstum.</p>
                      <strong>Symptome:</strong> Kleine, rostbraune Flecken auf den Blättern, oft mit gelben Rändern. Verkümmertes oder verdrehtes neues Wachstum. Schwache Stängel.<br>
                      <strong>Häufige Ursachen:</strong>
                      <ul>
                        <li><strong>Falscher pH-Wert:</strong> Dies ist die häufigste Ursache. Wenn der pH-Wert im Wurzelbereich zu niedrig ist, kann die Pflanze verfügbares Kalzium nicht aufnehmen.</li>
                        <li><strong>Verwendung von RO-/destilliertem Wasser:</strong> Diesem Wasser fehlen Mineralien, also musst du sie wieder hinzufügen.</li>
                        <li><strong>Kokossubstrat:</strong> Kokos neigt dazu, Kalzium zu binden, wodurch es für die Pflanze nicht verfügbar ist, es sei denn, du verwendest ein gepuffertes Kokosprodukt oder ein Ergänzungsmittel.</li>
                      </ul>
                      <strong>Lösung:</strong>
                      <ol>
                        <li>Überprüfe und korrigiere immer zuerst den pH-Wert deiner Wasser-/Nährlösung.</li>
                        <li>Verwende ein Cal-Mag (Kalzium-Magnesium) Ergänzungsmittel, besonders bei RO-Wasser oder Kokos.</li>
                      </ol>`
        },
        'fix-nutrient-burn': {
            title: 'Problembehebung: Nährstoffbrand',
            content: `<h3>Nährstoffbrand (Überdüngung) beheben</h3><p>Nährstoffbrand tritt auf, wenn eine Pflanze mehr Nährstoffe erhält, als sie verwerten kann, was zu Toxizität führt.</p>
                      <strong>Symptome:</strong> Die äußersten Spitzen der Blätter werden gelb, dann braun und knusprig. Dies beginnt oft an den oberen Blättern. Der Rest des Blattes kann sehr dunkel und glänzend grün werden. In schweren Fällen krallen sich die Spitzen nach oben.<br>
                      <strong>Häufige Ursachen:</strong>
                      <ul>
                        <li><strong>Nährlösung ist zu stark (hoher EC/PPM-Wert).</strong></li>
                        <li><strong>Zu häufiges Düngen, ohne das Medium leicht antrocknen zu lassen.</strong></li>
                        <li><strong>Verwendung von "scharfer" Erde, die von Anfang an stark vorgedüngt ist.</strong></li>
                      </ul>
                      <strong>Lösung:</strong>
                      <ol>
                        <li><strong>Medium spülen:</strong> Gieße die Pflanze mit einer großzügigen Menge reinem, pH-angepasstem Wasser, bis viel Wasser unten herausläuft. Dies wäscht überschüssige Nährsalze aus.</li>
                        <li><strong>Düngerstärke reduzieren:</strong> Verwende bei der nächsten Düngung nur die Hälfte der empfohlenen Dosis und arbeite dich langsam wieder nach oben.</li>
                      </ol>`
        },
        'fix-pests': {
            title: 'Problembehebung: Häufige Schädlinge',
            content: `<h3>Umgang mit unerwünschten Gästen</h3><p>Früherkennung ist der Schlüssel zur Bekämpfung von Schädlingen, bevor sie zu einer großen Plage werden.</p>
                      <strong>Spinnmilben:</strong>
                      <ul>
                        <li><strong>Symptome:</strong> Winzige weiße oder gelbe Sprenkel auf der Blattoberseite. Im fortgeschrittenen Stadium sieht man feine Spinnweben zwischen Blättern und Blüten.</li>
                        <li><strong>Lösung:</strong> Sie gedeihen in heißen, trockenen Bedingungen. Erhöhe die Luftfeuchtigkeit. Besprühe die Pflanzen (besonders die Blattunterseiten) mit einer Neemöl-Lösung oder insektizider Seife.</li>
                      </ul>
                      <strong>Trauermücken:</strong>
                      <ul>
                        <li><strong>Symptome:</strong> Kleine, schwarze Fliegen, die um die Erdoberfläche schwirren. Ihre Larven im Boden können die Wurzeln schädigen, besonders bei Sämlingen.</li>
                        <li><strong>Lösung:</strong> Sie sind ein Zeichen für Überwässerung. Lasse die oberste Erdschicht zwischen den Gießvorgängen vollständig austrocknen. Verwende gelbe Klebefallen, um die erwachsenen Fliegen zu fangen.</li>
                      </ul>`
        },
        'concept-training': {
            title: 'Grundkonzept: Pflanzentraining',
            content: `<h3>Warum deine Pflanzen trainieren?</h3><p>Training manipuliert das Wachstum einer Pflanze, um eine effizientere Struktur zu schaffen, was zu deutlich höheren Erträgen und qualitativ hochwertigeren Blüten führt.</p>
                      <strong>Das Ziel:</strong> Die "apikale Dominanz" (die Tendenz, eine zentrale Hauptblüte zu bilden) zu brechen und ein flaches, gleichmäßiges Kronendach zu schaffen, in dem mehrere Blütenstandorte direktes, intensives Licht erhalten.<br>
                      <strong>Haupttypen:</strong>
                      <ul>
                        <li><strong>LST (Low-Stress-Training):</strong> Sanftes Biegen und Festbinden von Ästen, um ihr Wachstum horizontal zu lenken. Kann sehr früh begonnen werden und ist risikoarm.</li>
                        <li><strong>HST (High-Stress-Training):</strong> Techniken, bei denen die Pflanze absichtlich beschädigt wird, um buschigeres Wachstum zu fördern, wie <strong>Topping</strong> (Abschneiden des Haupttriebs) oder <strong>Super Cropping</strong> (Quetschen von Stängeln). Sollte nur bei gesunden Pflanzen in der vegetativen Phase durchgeführt werden.</li>
                      </ul>
                      <strong>Ergebnis:</strong> Statt einer großen Hauptblüte und vielen kleinen "Popcorn"-Buds erhältst du mehrere große, dichte Colas und eine viel größere Gesamternte.`
        },
        'concept-environment': {
            title: 'Grundkonzept: Die Umgebung',
            content: `<h3>Meistere deinen Grow-Raum</h3><p>Deine Umgebung ist genauso wichtig wie Licht und Nährstoffe. Die drei Säulen sind Temperatur, Luftfeuchtigkeit und Luftstrom.</p>
                      <strong>Temperatur & Luftfeuchtigkeit:</strong> Diese beiden sind miteinander verbunden und ihre Beziehung wird durch das <strong>VPD (Dampfdruckdefizit)</strong> gemessen. Das Halten des VPD im idealen Bereich für jede Wachstumsphase ist der Schlüssel zur Maximierung des Wachstums.
                      <ul>
                        <li><strong>Sämling/Wuchs:</strong> Wärmere Temperaturen (22-28°C) und höhere Luftfeuchtigkeit (50-70%).</li>
                        <li><strong>Blüte:</strong> Kühlere Temperaturen (20-26°C) und niedrigere Luftfeuchtigkeit (40-50%), um die Harzproduktion zu steigern und Schimmel zu vermeiden.</li>
                      </ul>
                      <strong>Luftstrom:</strong>
                      <ul>
                        <li><strong>Abluftventilator:</strong> Entfernt ständig heiße, verbrauchte, feuchte Luft und zieht frische, CO₂-reiche Luft an. Dies ist unverzichtbar.</li>
                        <li><strong>Umluftventilator(en):</strong> Erzeugt eine sanfte Brise im Zelt. Dies stärkt die Stängel, verhindert die Bildung von feuchten Luftpolstern um die Blätter und schreckt Schädlinge ab.</li>
                      </ul>`
        }
    },
    sandbox: {
        title: 'Experimentelle Sandbox',
        experimentOn: 'Experiment an {{name}}',
        scenarioDescription: 'Vergleich von {{actionA}} vs. {{actionB}} über {{duration}} Tage.',
        runningSimulation: 'Beschleunigte Simulation wird ausgeführt...',
        startExperiment: 'Neues Experiment',
        modal: {
            title: 'Neues Experiment starten',
            description: 'Wähle eine Pflanze aus, um eine 14-tägige Simulation "Topping vs. LST" durchzuführen.',
            runScenario: 'Szenario starten',
            noPlants: 'Du musst zuerst eine Pflanze anbauen, um ein Experiment zu starten.',
        },
        savedExperiments: 'Gespeicherte Experimente',
        noExperiments: 'Noch keine Experimente gespeichert.',
    },
    guide: {
        phases: 'Phasen',
        coreConcepts: 'Grundkonzepte',
        troubleshooting: 'Fehlerbehebung',
    },
};

export const tipOfTheDay = {
    title: 'Tipp des Tages',
    tips: [
        "Überprüfe immer den pH-Wert deines Wassers, nachdem du Nährstoffe hinzugefügt hast. Nährstoffe können den pH-Wert erheblich verändern.",
        "Eine sanfte Brise von einem Ventilator, der auf deine Pflanzen gerichtet ist, stärkt die Stängel und beugt Schimmel vor.",
        "Weniger ist mehr, besonders bei Nährstoffen. Es ist einfacher, einen Mangel zu beheben als einen Überschuss (Nährstoffbrand).",
        "Beobachte die Farbe deiner Blätter. Ein sattes, gesundes Grün ist gut. Zu dunkelgrün kann auf zu viel Stickstoff hindeuten, blassgrün oder gelb auf einen Mangel.",
        "Stofftöpfe sind eine großartige Wahl für Anfänger, da sie eine Überwässerung fast unmöglich machen und die Wurzeln mit Sauerstoff versorgen."
    ]
};