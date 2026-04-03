export const knowledgeView = {
    title: 'Wissens-Hub',
    subtitle: 'Dein interaktiver Leitfaden für den erfolgreichen Anbau.',
    tabs: {
        mentor: 'KI-Mentor',
        guide: 'Grow-Guide',
        archive: 'Mentor-Archiv',
        breeding: 'Zuchtlabor',
        sandbox: 'Sandbox',
        growTech: 'Grow Tech 2026',
        lexikon: 'Lexikon',
        atlas: 'Krankheitsatlas',
        rechner: 'Rechner',
        lernpfad: 'Lernpfade',
        analytik: 'Analytik',
        navLabel: 'Wissensbereiche',
    },
    hub: {
        selectPlant: 'Pflanze auswählen',
        noPlants:
            'Keine aktiven Pflanzen für kontextbezogene Ratschläge vorhanden. Starte einen Anbau!',
        todaysFocus: 'Heutiger Fokus für {{plantName}}',
    },
    aiMentor: {
        title: 'KI-Mentor',
        plantContext: 'Chatte mit dem KI-Mentor im Kontext von {{name}}',
        plantContextSubtitle:
            'Wähle eine Pflanze aus, um kontextbezogene Fragen zu stellen und Ratschläge zu erhalten.',
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
        description:
            'Kreuze deine gesammelten Samen, um neue, einzigartige Sorten mit kombinierten Eigenschaften zu erschaffen.',
        collectedSeeds: 'Gesammelte Samen',
        noSeeds: 'Sammle Samen von erntereifen Pflanzen, um mit dem Züchten zu beginnen.',
        parentA: 'Elternteil A',
        parentB: 'Elternteil B',
        clearParent: '{{title}} entfernen',
        selectSeed: 'Samen auswählen',
        dropSeed: 'Samen hier ablegen',
        breedButton: 'Neue Sorte züchten',
        resultsTitle: 'Zuchtergebnis',
        newStrainName: 'Name der neuen Sorte',
        potentialTraits: 'Mögliche Merkmale',
        saveStrain: 'Sorte speichern',
        breedingSuccess:
            'Neue Sorte "{{name}}" erfolgreich gezüchtet und zu "Meine Sorten" hinzugefügt!',
        splicingGenes: 'Gene werden gespleißt...',
        flowering: 'Blütezeit',
        phenoTracking: 'Phäno-Tracking',
        vigor: 'Vitalität',
        resin: 'Harz',
        aroma: 'Aroma',
        diseaseResistance: 'Krankheitsresistenz',
        automatedGenetics: 'Automatische Genetik-Schätzung',
        stabilityScore: 'Stabilitätswert',
        arTitle: 'AR-Zuchtvorschau',
        arSupported: 'WebXR bereit',
        arFallback: '3D-Fallback',
        arPreviewLabel: 'Dreidimensionale Zuchtvorschau',
        arLoading: 'AR-Vorschau wird geladen...',
        webglUnavailableTitle: '3D-Vorschau nicht verfügbar',
        webglUnavailableDescription:
            'Dein Browser konnte keinen WebGL-Kontext erstellen, deshalb wird diese Vorschau als statische Ersatzansicht angezeigt.',
        webglUnavailableHint:
            'Aktiviere Hardwarebeschleunigung oder wechsle zu einem Browserprofil mit GPU-Zugriff, um die Live-Vorschau wiederherzustellen.',
    },
    scenarios: {
        toppingVsLst: {
            title: "Experiment 'Topping vs. LST' starten",
            description:
                'Simuliert eine 14-tägige Wachstumsperiode und vergleicht eine Pflanze, die LST erhält, mit einer, die getoppt wurde.',
        },
        tempPlus2c: {
            title: 'Experiment Temperatur +2\u00b0C starten',
            description:
                'Simuliert eine 14-tägige Wachstumsperiode und vergleicht Ausgangsbedingungen mit einem Anstieg der Dachtemperatur um +2\u00b0C.',
        },
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
                      <strong>Umgebung kalibrieren:</strong> Kalibriere deine Thermo-Hygrometer. Strebe eine stabile Umgebung um <strong>22-25°C (72-77°F)</strong> und <strong>65-75% relative Luftfeuchtigkeit</strong> an.`,
        },
        'phase2-seedling': {
            title: 'Phase 2: Keimung & Sämling',
            content: `<h3>Die ersten Lebenswochen</h3><p>Dies ist die empfindlichste Phase. Das Motto lautet: Weniger ist mehr. Vermeide es, deine Pflanze zu sehr zu bemuttern.</p>
                      <strong>Keimung:</strong> Halte das Medium konstant feucht, aber niemals durchnässt. Eine Feuchtigkeitshaube kann helfen, eine hohe Luftfeuchtigkeit (70-80%) aufrechtzuerhalten, was ideal zum Keimen ist.<br>
                      <strong>Licht:</strong> Sämlinge benötigen kein intensives Licht. Eine Leuchtstoffröhre mit geringer Wattzahl oder eine gedimmte LED ist perfekt. Ein 18/6-Lichtzyklus ist Standard. Halte die Lampen weit genug entfernt, um Verbrennungen zu vermeiden – wenn sich dein Handrücken auf Höhe der Pflanzenspitze unangenehm warm anfühlt, ist die Lampe zu nah.<br>
                      <strong>Wasser:</strong> Gieße sparsam in einem kleinen Kreis um den Stängel. Das Wurzelsystem ist winzig und kann leicht ertrinken.<br>
                      <strong>Nährstoffe:</strong> Dünge noch nicht! Die meisten Substrate enthalten genug Nährstoffe für die ersten 2-3 Wochen. Warte, bis die Pflanze mindestens 3-4 Sätze echter Blätter hat, bevor du eine sehr schwache (1/4 Stärke) Nährlösung einführst.`,
        },
        'phase3-vegetative': {
            title: 'Phase 3: Vegetatives Wachstum',
            content: `<h3>Zeit zu wachsen!</h3><p>In dieser Phase konzentriert sich deine Pflanze darauf, eine starke Struktur aus Blättern, Ästen und Wurzeln zu entwickeln. Dies ist die Zeit für Trainingstechniken.</p>
                      <strong>Licht:</strong> Deine Pflanze verträgt jetzt viel mehr Licht. Erhöhe allmählich die Intensität oder senke die Lichtquelle. Ein 18/6-Lichtzyklus bleibt Standard für photoperiodische Pflanzen.<br>
                      <strong>Nährstoffe:</strong> Erhöhe langsam die Nährstoffstärke. Ein stickstoffreicher (N) Dünger ist jetzt entscheidend für das Blattwachstum.<br>
                      <strong>Training:</strong> Jetzt ist der perfekte Zeitpunkt, um mit dem Training zu beginnen, um ein gleichmäßiges Kronendach zu schaffen und deinen Endertrag zu steigern. Beginne mit <strong>LST (Low-Stress-Training)</strong>, um Äste sanft zu biegen, oder führe ein <strong>Topping</strong> durch, um mehrere Hauptblüten zu erzeugen.<br>
                      <strong>Umgebung:</strong> Die ideale Luftfeuchtigkeit sinkt auf etwa 50-70%. Eine gute Luftzirkulation wird wichtiger, da die Pflanze dichter wird.`,
        },
        'phase4-flowering': {
            title: 'Phase 4: Blüte',
            content: `<h3>Die Blüte beginnt</h3><p>Dies ist die aufregendste Phase, in der deine Pflanze beginnt, Blüten zu produzieren. Die Umstellung des Lichtzyklus ist der Auslöser für photoperiodische Sorten.</p>
                      <strong>Lichtzyklus:</strong> Um die Blüte einzuleiten, musst du auf einen strikten Zyklus von <strong>12 Stunden Licht und 12 Stunden *ununterbrochener* Dunkelheit</strong> umschalten.<br>
                      <strong>Der Stretch:</strong> In den ersten 2-3 Wochen der Blüte kann deine Pflanze ihre Höhe verdoppeln oder sogar verdreifachen. Sei auf diesen Wachstumsschub vorbereitet!<br>
                      <strong>Nährstoffe:</strong> Wechsle zu einem Blütedünger, der weniger Stickstoff (N) und mehr Phosphor (P) und Kalium (K) enthält, um die Blütenentwicklung zu unterstützen.<br>
                      <strong>Luftfeuchtigkeit:</strong> Senke die Luftfeuchtigkeit schrittweise auf <strong>40-50%</strong>, um das Risiko von Knospenfäule (Botrytis) in den dichten Blüten zu verringern.`,
        },
        'phase5-harvest': {
            title: 'Phase 5: Ernte, Trocknen & Curing',
            content: `<h3>Der letzte Schliff</h3><p>Geduld in dieser letzten Phase entscheidet über die Qualität des Endprodukts. Überstürze es nicht!</p>
                      <strong>Erntezeitpunkt:</strong> Beobachte die Trichome mit einer Juwelierlupe oder einem Mikroskop. Ernte, wenn die meisten Trichome milchig/trüb sind (für maximale THC-Potenz) und einige wenige bernsteinfarben sind (für eine entspannendere Wirkung). Klare Trichome sind zu früh.<br>
                      <strong>Trocknen:</strong> Hänge die Zweige kopfüber in einem dunklen, kühlen Raum mit sanfter Luftzirkulation auf. Strebe <strong>18-20°C (64-68°F)</strong> und <strong>55-60% Luftfeuchtigkeit</strong> an. Dieser langsame Trocknungsprozess dauert 7-14 Tage und ist entscheidend für den Erhalt der Terpene.<br>
                      <strong>Curing (Fermentierung):</strong> Sobald die kleineren Stängel beim Biegen knacken statt sich nur zu biegen, lege die trockenen Blüten in luftdichte Gläser. Öffne die Gläser in der ersten Woche täglich für 5-10 Minuten ("burping"), um Feuchtigkeit entweichen zu lassen. Dieser Prozess verbessert Geschmack, Aroma und Sanftheit dramatisch.`,
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
                      <strong>Prävention:</strong> Hebe deinen Topf immer an, um sein Gewicht vor und nach dem Gießen zu fühlen. Dies ist die zuverlässigste Methode, um zu wissen, wann es Zeit zum Gießen ist.`,
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
                      </ol>`,
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
                      </ol>`,
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
                      </ul>`,
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
                      <strong>Ergebnis:</strong> Statt einer großen Hauptblüte und vielen kleinen "Popcorn"-Buds erhältst du mehrere große, dichte Colas und eine viel größere Gesamternte.`,
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
                      </ul>`,
        },
    },
    sandbox: {
        title: 'Experimentelle Sandbox',
        experimentOn: 'Experiment an {{name}}',
        scenarioDescription: 'Vergleich von {{actionA}} vs. {{actionB}} über {{duration}} Tage.',
        runningSimulation: 'Beschleunigte Simulation wird ausgeführt...',
        startExperiment: 'Neues Experiment',
        modal: {
            title: 'Neues Experiment starten',
            description:
                'Wähle eine Pflanze aus, um eine 14-tägige Simulation "Topping vs. LST" durchzuführen.',
            runScenario: 'Szenario starten',
            noPlants: 'Du musst zuerst eine Pflanze anbauen, um ein Experiment zu starten.',
        },
        savedExperiments: 'Gespeicherte Experimente',
        noExperiments: 'Noch keine Experimente gespeichert.',
        basedOn: 'Basierend auf: {{name}}',
        run: 'Durchlauf: {{date}}',
    },
    guide: {
        phases: 'Phasen',
        coreConcepts: 'Grundkonzepte',
        troubleshooting: 'Fehlerbehebung',
        growTech: 'Grow Tech 2026',
        genetics: 'Genetik',
        searchPlaceholder: 'Anleitungen durchsuchen...',
        noResults: 'Keine Artikel gefunden für "{{term}}"',
        readProgress: '{{read}} von {{total}} Artikeln gelesen',
    },
    growLog: {
        title: 'Grow-Log RAG',
        description:
            'Frage dein eigenes Journal direkt ab. Relevante Log-Einträge werden zuerst geladen und dann von der KI analysiert.',
        placeholder: 'z. B. Warum schwankt mein VPD in Woche 4?',
        analyzing: 'Analysiere...',
        startAnalysis: 'RAG Analyse starten',
        activeCorpus: 'Aktive Pflanzen im RAG-Korpus: {{count}}',
    },
    lexikon: {
        searchPlaceholder: 'Begriffe suchen...',
        filterLabel: 'Nach Kategorie filtern',
        all: 'Alle',
        categories: {
            cannabinoid: 'Cannabinoide',
            terpene: 'Terpene',
            flavonoid: 'Flavonoide',
            nutrient: 'Nährstoffe',
            disease: 'Krankheiten',
            general: 'Allgemein',
        },
        noResults: 'Keine Ergebnisse für "{{term}}"',
        resultCount: '{{count}} von {{total}} Begriffen',
        totalCount: '{{count}} Begriffe',
        noDefinition: 'Keine Definition verfügbar.',
    },
    atlas: {
        searchPlaceholder: 'Diagnosen suchen...',
        allCategories: 'Alle Kategorien',
        allUrgencies: 'Alle Dringlichkeiten',
        noResults: 'Keine Einträge gefunden.',
        filterByCategory: 'Nach Kategorie filtern',
        filterByUrgency: 'Nach Dringlichkeit filtern',
        entryCount: '{{count}} Einträge',
        close: 'Schließen',
        category: {
            deficiency: 'Mangel',
            toxicity: 'Toxizität',
            environmental: 'Umwelt',
            pest: 'Schädlinge',
            disease: 'Krankheit',
        },
        severity: {
            low: 'Niedrig',
            medium: 'Mittel',
            high: 'Hoch',
            critical: 'Kritisch',
        },
        urgency: {
            monitor: 'Beobachten',
            act_soon: 'Bald handeln',
            act_immediately: 'Sofort handeln',
        },
        detail: {
            symptoms: 'Symptome',
            causes: 'Ursachen',
            treatment: 'Behandlung',
            prevention: 'Vorbeugung',
            relatedTerms: 'Verwandte Begriffe',
        },
        diseases: {
            'nitrogen-deficiency': {
                name: 'Stickstoffmangel',
                symptoms:
                    'Vergilbung beginnt an älteren unteren Blättern und schreitet aufwärts fort. Blätter werden blassgelb-grün, dann vollständig gelb. Gehemmtes Wachstum.',
                causes: 'Überwässerung, niedrige pH-Wert (sperrt N aus), ungenügend Stickstoff in der Nährlösung, Wurzelschäden.',
                treatment:
                    'Medium mit pH-korrigiertem Wasser spülen, dann mit einer stickstoffreichen Nährlösung düngen. pH auf 6,0-7,0 (Erde) bzw. 5,5-6,5 (Hydro) korrigieren.',
                prevention:
                    'pH konsequent überwachen, ausgewogene Nährstoffe verwenden, Überwässerung vermeiden.',
            },
            'phosphorus-deficiency': {
                name: 'Phosphormangel',
                symptoms:
                    'Lila oder rötliche Verfärbungen an den Unterseiten der Blätter und Stängel. Dunkelgrüne Blätter, die sich nach unten kräuseln können. Langsames Wachstum.',
                causes: 'Niedriger pH-Wert (unter 6,0 in Erde), kalte Wurzelzone (unter 15 °C), wenig Phosphor in der Lösung.',
                treatment:
                    'pH erhöhen, Raumtemperatur steigern, phosphorreiche Blütedünger ergänzen.',
                prevention:
                    'Wurzelzone über 18 °C halten, korrekten pH einhalten, Blütedünger bei Blütebeginn verwenden.',
            },
            'potassium-deficiency': {
                name: 'Kaliummangel',
                symptoms:
                    'Knusprige braune Ränder und Spitzen an Blättern, beginnend an älteren Blättern. Vergilbung zwischen den Blattadern. Schwache Stängel.',
                causes: 'Hoher pH-Wert (sperrt K aus), überschüssiges Kalzium oder Magnesium konkurrieren um Aufnahme, wenig Kalium in der Lösung.',
                treatment:
                    'pH prüfen und korrigieren, konkurrierende Nährstoffe reduzieren, Kalium erganzen.',
                prevention:
                    'Vollständige Nährformel mit ausreichend Kalium verwenden, besonders in der Spätblüte.',
            },
            'calcium-deficiency': {
                name: 'Kalziummangel',
                symptoms:
                    'Kleine braune oder rostfarbene Flecken auf neuen Blättern. Verdrehtes oder geknittertes Neuwachstum. Schwache Stängel.',
                causes: 'Niedriger pH reduziert Kalziumverfügbarkeit, Einsatz von Umkehrosmose-/destilliertem Wasser ohne Remineralisierung, Coco Coir ohne Pufferung.',
                treatment:
                    'pH auf 6,2-7,0 korrigieren, Cal-Mag-Ergänzung hinzufügen, Coco vor Gebrauch puffern.',
                prevention:
                    'Coco Coir puffern, Cal-Mag mit Umkehrosmose-Wasser verwenden, korrekten pH einhalten.',
            },
            'magnesium-deficiency': {
                name: 'Magnesiummangel',
                symptoms:
                    'Vergilbung zwischen den Blattadern (intervenöse Chlorose) auf mittleren bis älteren Blättern während die Adern grün bleiben. Blätter können sich nach oben rollen.',
                causes: 'Niedriger pH-Wert, hohes Kalium konkurriert mit Magnesiumaufnahme, ungenügend Magnesium in der Lösung.',
                treatment:
                    'pH korrigieren, Kalium bei Überschuss reduzieren, Cal-Mag oder Bittersalz (MgSO4) hinzufügen -- 1 TL/Liter als Blattspray für schnelle Ergebnisse.',
                prevention:
                    'Ausgeglichene Nährformel verwenden, Cal-Mag-Ergänzung einschließen, korrekten pH einhalten.',
            },
            'iron-deficiency': {
                name: 'Eisenmangel',
                symptoms:
                    'Hellgelbe (chlorotische) Blätter bei sehr neuem Wachstum, während die Adern grün bleiben. Klassisches intervenöses Chlorosemuster.',
                causes: 'Hoher pH-Wert (häufigste Ursache, besonders über 7,0), staunasse Wurzeln, überschüssiger Phosphor oder Mangan als Konkurrenz.',
                treatment:
                    'pH auf 6,0-6,5 senken, Drainage verbessern, chelatierten Eisendünger verwenden.',
                prevention:
                    'Korrekten pH einhalten, Überwässerung vermeiden, Chelat-Mikronährstoffpaket verwenden.',
            },
            'zinc-deficiency': {
                name: 'Zinkmangel',
                symptoms:
                    'Vergilbung des neuen Blattgewebes zwischen den Adern. Blätter können gefleckt oder verzerrt erscheinen. Kurze Internodienabstände.',
                causes: 'Hoher pH-Wert, überschüssiger Phosphor hemmt Zinkaufnahme, wenig Zink im Medium oder der Lösung.',
                treatment:
                    'pH auf optimalen Bereich korrigieren, bei Überschuss Phosphor reduzieren, Zink ergänzen.',
                prevention: 'Vollständige Mikronährstoffformel verwenden, korrekten pH einhalten.',
            },
            'sulfur-deficiency': {
                name: 'Schwefelmangel',
                symptoms:
                    'Neue Blätter werden gleichmäßig blassgelb bis weiss. Im Gegensatz zu Stickstoffmangel beginnt es beim jungen/neuen Wachstum.',
                causes: 'Wenig Schwefel in der Nährlösung, sehr hoher pH-Wert, kürzlich umpflanzte oder gespälte Pflanzen.',
                treatment:
                    'Schwefelhaltigen Dünger hinzufügen (viele Basis-Nährstoffe enthalten ihn), pH prüfen.',
                prevention: 'Vollständige Nährformel verwenden, extremen pH vermeiden.',
            },
            'nutrient-burn': {
                name: 'Nährstoffverbrennung (Toxizität)',
                symptoms:
                    'Blattspitzen werden braun und krisprig, dann schreitet die Vergilbung einwärts fort. Spitzen können sich nach oben kräuseln. Dunkelglänzend grüne Blattfärbung.',
                causes: 'Nährlösung EC/PPM zu hoch, zu häufige Düngung, stark angereicherte harte Erde.',
                treatment:
                    'Medium mit dem 3-fachen Topfvolumen an pH-korrigiertem Wasser spülen. Nächste Düngung auf 50 % Stärke reduzieren.',
                prevention:
                    'Mit Nährstoffen niedrig beginnen, langsam erhöhen, EC/PPM regelmäßig messen.',
            },
            'nitrogen-toxicity': {
                name: 'Stickstofftoxizität',
                symptoms:
                    'Sehr dunkelglänzend grüne Blätter. Spitzen können sich nach unten krallen (die "Klaue"). Übertriebenes Blattwachstum, reduzierte Blütendichte.',
                causes: 'Zu viel Stickstoff, besonders während der Blüte, wenn der N-Bedarf sinkt.',
                treatment:
                    'Stickstoffdüngung stoppen, mit pH-korrigiertem Wasser spülen, zu Blüteverhältnis-Nährstoffen wechseln.',
                prevention:
                    'Stickstoff beim Wechsel zur Blüte reduzieren, blütespezifische Nährstoffe verwenden.',
            },
            overwatering: {
                name: 'Überwässerung',
                symptoms:
                    'Gesamte Pflanze hängt durch. Blätter fühlensich fest an, hängen aber mit runder Wellung nach unten. Erde bleibt viele Tage nass. Vergilbung.',
                causes: 'Zu häufiges Gießen, schlechte Drainagen, Töpfe ohne Locher, zu dichtes Anzuchtmedium.',
                treatment:
                    'Gießen völlig einstellen bis Topf sehr leicht ist. Belüftung rund um den Topf verbessern. Ggf. in besser drainierendes Medium umpflanzen.',
                prevention:
                    'Topfgewicht prüfen -- erst gießen wenn deutlich leichter. Behälter mit guten Drainagelöchern verwenden. Medium teilweise trocknen lassen.',
            },
            underwatering: {
                name: 'Unterwässerung',
                symptoms:
                    'Gesamte Pflanze welkt und hängt durch. Blätter fühlen sich dünn und papierartig mit leichter Einwärtskrüsellung an. Topf ist sehr leicht.',
                causes: 'Zu seltenes Gießen, trockenes Klima, schnell drainierendes Medium, grosse Pflanze in kleinem Topf.',
                treatment:
                    'Gründlich gießen bis Abfluss aus dem Boden läuft. Pflanze sollte sich innerhalb von Stunden erholen.',
                prevention:
                    'Topfgewicht regelmäßig prüfen. Gießen wenn die oberste Schicht des Mediums trocken ist.',
            },
            'heat-stress': {
                name: 'Hitzestress',
                symptoms:
                    'Bländerränder und -spitzen rollen sich nach oben wie Taco-Schalen. Ausgebleichte oder verbrannte Flecken wo Blätter am nächsten an der Lichtquelle sind. Welken trotz ausreichend Wasser.',
                causes: 'Growroom-Temperatur über 30 °C, Lichter zu nah am Blattdach, schlechte Belüftung, Hitzepunkte.',
                treatment:
                    'Belüftung verbessern, Lichter hochhängen, Klimaanlage hinzufügen. Kurzzeitig Blätter mit Wasser besprühen.',
                prevention:
                    'Blattdach-Temperatur unter 28 °C halten. Ausreichenden Luftstrom über dem Blattdach sicherstellen.',
            },
            'light-burn': {
                name: 'Lichtverbrennung',
                symptoms:
                    'Ausgebleichte weiße oder gelbe Flecken auf obersten Blättern am nächsten zur Lichtquelle. Blätter direkt unter dem Licht erscheinen trotz ausreichender Nährstoffe gebleicht.',
                causes: 'Grow-Licht zu nah am Blattdach, übermassige Lichtintensität (PPFD zu hoch).',
                treatment:
                    'Licht sofort hochhängen. Die ausgebleichten Bereiche erholen sich nicht, aber neues Wachstum wird gesund sein.',
                prevention:
                    'Mindest-Hägeabstandsempfehlungen des Herstellers befolgen, PPFD überwachen.',
            },
            'ph-lockout': {
                name: 'pH-Blockade',
                symptoms:
                    'Mehrere Mangelsymptome erscheinen gleichzeitig trotz ausreichender Nährstoffe. Pflanze erscheint allgemein krank.',
                causes: 'Nährlösung oder Anzuchtmedium pH liegt außerhalb des optimalen Aufnahmebereichs für Schlüsselnährstoffe.',
                treatment:
                    'Wurzelzonen-pH testen (Abflusstest). Medium mit korrekt pH-eingestelltem Wasser spülen. Düngung bei korrektem pH wieder aufnehmen.',
                prevention: 'Wasser und Nährlösung immer pH-en. Abfluss-pH wöchentlich testen.',
            },
            'spider-mites': {
                name: 'Spinnmilben',
                symptoms:
                    'Winzige weiße/gelbe Tupfen auf Blattoberflächen. Feines seidiges Gespinst zwischen Blättern und Stängeln. Winzige sich bewegende Punkte mit Lupe sichtbar.',
                causes: 'Trockene, heisse Bedingungen. Infizierte Stecklinge oder Anzuchtmedium. Schlechter Luftstrom.',
                treatment:
                    'Alle Blattoberflächen (besonders Unterseiten) mit Neemöl-Lösung, Insektizidseife oder Spinosad besprühen. Luftfeuchtigkeit erhöhen. Alle 3 Tage 2 Wochen lang wiederholen.',
                prevention:
                    '50-60 % Luftfeuchtigkeit einhalten, Luftstrom sicherstellen, neue Pflanzen vor Einführen in den Growroom prüfen.',
            },
            'fungus-gnats': {
                name: 'Trauermücken',
                symptoms:
                    'Kleine schwarze Fliegen um die Erdoberfläche. Welkende Keimpflanzen durch Larvenwurzelsschäden. Winzige weiße Larven in der Erde sichtbar.',
                causes: 'Überwässerung hält Erdoberfläche feucht und ermöglicht Eiablage. Torfbasierte Mischungen.',
                treatment:
                    'Obere 5 cm der Erde völlig austrocknen lassen. Gelbe Klebefallen für Erwachsene verwenden. Nutzinsekten (Nematoden) oder Bacillus thuringiensis israelensis (Bti) auftragen.',
                prevention:
                    'Überwässerung vermeiden, Erdoberfläche trocknen lassen, Perliteschicht auf Erde verwenden.',
            },
            aphids: {
                name: 'Blattläuse',
                symptoms:
                    'Gruppen kleiner weichkörpiger Insekten auf Neuwachstum und Blattunterseiten. Klebriger Honigtau auf Blättern. Gekräuseltes oder verzerrtes Neuwachstum.',
                causes: 'Offener Growraum, kontaminierte Stecklinge oder Freilandkontakt.',
                treatment:
                    'Mit Wasser abspritzen, Insektizidseife oder Neemöl anwenden, Nützlinge einführen (Marienkäfer, Florfliegen).',
                prevention: 'Geschlossene Growumgebung einhalten, alle neuen Pflanzen prüfen.',
            },
            thrips: {
                name: 'Thripse',
                symptoms:
                    'Silber-weiße Streifen oder Flecken auf Blättern (Fressspuren). Schwarze Kotpunkte auf Blattoberflächen. Blätter können bronzefartig werden.',
                causes: 'Kontaminierte Pflanzen oder Erde, offene Growumgebung.',
                treatment:
                    'Spinosad, Neemöl oder Raubinsekten (Amblyseius cucumeris) einsetzen. Regelmäßig wiederholen.',
                prevention:
                    'Strenge Quarantäne für neue Stecklinge, frühzeitig gelbe Klebefallen einsetzen.',
            },
            'powdery-mildew': {
                name: 'Echter Mehltau',
                symptoms:
                    'Weiße, pudrige Flecken auf Blattoberflächen, Stängeln und Blüten. Flecken breiten sich schnell aus. Betroffenes Gewebe kann sich gelb verfärben und absterben.',
                causes: 'Hohe Luftfeuchtigkeit (über 60 %) kombiniert mit schlechtem Luftstrom und gemäßigten Temperaturen (15-27 °C). Überfuellte Pflanzen.',
                treatment:
                    'Stark befallene Blätter entfernen. Kaliumbicarbonat, Neemöl oder verdünntes Wasserstoffperoxid auftragen. Luftstrom erhöhen und Luftfeuchtigkeit dringend reduzieren.',
                prevention:
                    'Luftfeuchtigkeit in der Blüte unter 50 % halten. Starken Luftstrom durch das Blattdach sicherstellen. Überfüllung vermeiden.',
            },
            botrytis: {
                name: 'Botrytis (Blütengraufäule / Grauschimmel)',
                symptoms:
                    'Grauer flaumiger Schimmel in dichten Blüten. Braune matschige Stellen in der Mitte der Kolas. Graue Sporen sichtbar.',
                causes: 'Hohe Luftfeuchtigkeit (über 50 % in der Blüte), schlechter Luftstrom, dichte Blüten, Temperaturen unter 20 °C bei hoher Luftfeuchtigkeit.',
                treatment:
                    'Sofort alle befallenen Teile entfernen und eintüten. Blüten nicht schütteln -- Sporen verbreiten sich. Luftstrom drastisch erhöhen und Luftfeuchtigkeit senken.',
                prevention:
                    'Blüte-Luftfeuchtigkeit bei 40-50 % halten. Dichtes Blattdach entblättern für Luftstrom. Rechtzeitig ernten.',
            },
            'root-rot': {
                name: 'Wurzelfaule (Pythium/Phytophthora)',
                symptoms:
                    'Wurzeln werden braun/grau und schleimig statt weiss und fest. Fauler Geruch aus der Wurzelzone. Pflanze welkt trotz ausreichend Wasser. In Hydro: verfärbte Nährlösung.',
                causes: 'Überwässerung oder schlechte Drainagen. Anaerobe Bedingungen in der Wurzelzone. Wassertemperaturen über 22 °C in Hydro. Fehlende Nutzorganismen.',
                treatment:
                    'In Erde: Gießen reduzieren, Drainage verbessern, Nutzorganismen/Mykorrhiza anwenden. In Hydro: Reservoir wechseln, Wassertemperatur senken, mit Wasserstoffperoxid oder Nutzorganismen behandeln.',
                prevention:
                    'Überwässerung vermeiden. Hydro-Reservoir unter 20 °C halten. Druckluftstein verwenden. Mit Nutzorganismen inokulieren.',
            },
        },
    },
    rechner: {
        title: 'Rechner-Hub',
        vpdTab: 'VPD',
        nutrientTab: 'Nährstoffe',
        phTab: 'pH / EC',
        terpeneEntourageTab: 'Entourage',
        transpirationTab: 'Transpiration',
        ecTdsTab: 'EC/TDS',
        lightSpectrumTab: 'Licht',
        cannabinoidRatioTab: 'Cannabinoide',
        equipmentLink: 'Für erweiterte Rechner, sieh den Ausrüstungsbereich.',
        vpd: {
            temperature: 'Lufttemperatur',
            humidity: 'Relative Luftfeuchtigkeit',
            leafOffset: 'Blatttemp.-Versatz',
            celsius: '°C',
            result: 'VPD-Ergebnis',
            statusLow: 'VPD zu niedrig -- Schimmelrisiko und langsames Wachstum.',
            statusOk: 'VPD optimal -- ideale Transpiration.',
            statusHigh: 'VPD zu hoch -- Hitzestress- und Welkungsrisiko.',
            refTitle: 'VPD-Referenzbereiche',
            rangeSeedling: 'Keimling',
            rangeVeg: 'Vegetativ',
            rangeFlower: 'Blüte',
            rangeLateFlower: 'Spätblüte',
            simulate: '7 Tage simulieren',
            simulationTitle: '7-Tage-VPD-Kurve',
            explainAi: 'Mit KI erklären',
            aiExplanationTitle: 'KI-Erklärung',
            aiLoading: 'Erklärung wird generiert...',
            deepDive: 'Vertiefung: Lernpfad ->',
        },
        nutrient: {
            growStage: 'Wachstumsphase',
            volume: 'Wasservolumen (L)',
            seedling: 'Keimling',
            veg: 'Vegetativ',
            earlyFlower: 'Frühblüte',
            lateFlower: 'Spätblüte',
            seedlingDesc: 'Leichte Ernährung, hoher N-Anteil für Wurzel- und Blattentwicklung.',
            vegDesc: 'Starker N-Anteil, moderates P/K für kräftiges vegetatives Wachstum.',
            earlyFlowerDesc: 'N reduzieren, P/K erhöhen während sich Knospen bilden.',
            lateFlowerDesc: 'Minimales N -- Reifungsphase, Fokus auf P/K und spülbare Mineralien.',
            targetEc: 'Ziel-EC (mS/cm)',
            dosage: 'Ungefähre Dosierung',
            disclaimer: 'Werte sind nur Richtwerte. Immer EC und pH nach dem Mischen messen.',
        },
        ph: {
            intro: 'Ideale pH- und EC-Bereiche variieren je nach Anzuchtmedium. Die Einhaltung dieser Bereiche gewährleistet optimale Nährstoffverfügbarkeit.',
            medium: 'Medium',
            phRange: 'pH-Bereich',
            ecRange: 'EC-Bereich (mS/cm)',
            note: 'Wasser und Nährlösung nach jedem Mischen immer pH-en. Kalibrierten pH-Meter verwenden.',
        },
        terpeneEntourage: {
            description:
                'Terpenprofil eingeben um den Entourage-Effekt-Score und die Synergien zu berechnen. Basiert auf Russo (2011) und Booth & Bohlmann (2019).',
            terpeneName: 'Terpen',
            terpenePercent: 'Prozent',
            addTerpene: 'Terpen hinzufügen',
            remove: 'Entfernen',
            score: 'Entourage-Score',
            dominant: 'Dominant',
            profile: 'Profil',
            synergyMatrix: 'Synergie-Paare',
            learnMore: 'Mehr über Terpen-Wissenschaft erfahren ->',
            explainAi: 'Mit KI erklären',
            aiExplanationTitle: 'KI-Erklärung',
            aiLoading: 'Erklärung wird generiert...',
            deepDive: 'Vertiefung: Lernpfad ->',
        },
        transpiration: {
            description:
                'Transpirationsrate des Blätterdachs aus VPD, stomatärer Leitfähigkeit und Blattflächenindex berechnen (Penman-Monteith-Näherung).',
            vpd: 'VPD',
            gsmmol: 'Stomatäre Leitfähigkeit',
            lai: 'Blattflächenindex (LAI)',
            hours: 'Photoperiode (h/Tag)',
            leafRate: 'Blatt-Transpiration',
            canopyRate: 'Blätterdach-Transpiration',
            dailyWater: 'Täglicher Wasserverbrauch',
            learnMore: 'Mehr über Pflanzenwassermanagement erfahren ->',
            simulate: '7 Tage simulieren',
            simulationTitle: '7-Tage-Prognose',
            explainAi: 'Mit KI erklären',
            aiExplanationTitle: 'KI-Erklärung',
            aiLoading: 'Erklärung wird generiert...',
            deepDive: 'Vertiefung: Lernpfad ->',
        },
        ecTds: {
            description:
                'EC (mS/cm) und TDS in allen drei gängigen Skalen umrechnen. pH-Messwerte über Zeit eingeben für eine Drift-Prognose.',
            ecInput: 'EC (mS/cm)',
            tds500: 'TDS-500',
            tds640: 'TDS-640',
            tds700: 'TDS-700',
            phReadings: 'pH-Messwerte (kommagetrennt)',
            drift: 'pH-Drift',
            prediction: 'Prognose Tag 7',
            learnMore: 'Mehr über EC, TDS und pH-Management erfahren ->',
            simulate: '7 Tage simulieren',
            simulationTitle: '7-Tage-EC-Drift',
            explainAi: 'Mit KI erklären',
            aiExplanationTitle: 'KI-Erklärung',
            aiLoading: 'Erklärung wird generiert...',
            deepDive: 'Vertiefung: Lernpfad ->',
        },
        lightSpectrum: {
            description:
                'DLI, photosynthetische Effizienz und geschätzten Terpen-Boost aus den Lichtspektrum-Einstellungen berechnen.',
            ppfd: 'PPFD',
            redPercent: 'Rotanteil %',
            bluePercent: 'Blauanteil %',
            hours: 'Photoperiode (h/Tag)',
            stage: 'Wachstumsphase',
            dli: 'Tageslichtintegral (DLI)',
            efficiency: 'Photosynthetische Effizienz',
            terpeneBoost: 'Terpen-Boost',
            recommended: 'Empfohlenes Verhältnis',
            learnMore: 'Mehr über Lichtspektrum und Terpenproduktion erfahren ->',
            simulate: '7 Tage simulieren',
            simulationTitle: '7-Tage-DLI-Kurve',
            explainAi: 'Mit KI erklären',
            aiExplanationTitle: 'KI-Erklärung',
            aiLoading: 'Erklärung wird generiert...',
            deepDive: 'Vertiefung: Lernpfad ->',
        },
        cannabinoidRatio: {
            description:
                'THC:CBD:CBG-Verhältnisse, Profiltyp und Entourage-Harmonie-Score analysieren.',
            ratio: 'Verhältnis',
            profile: 'Profiltyp',
            harmony: 'Harmonie-Score',
            learnMore: 'Mehr über Cannabinoid-Profile erfahren ->',
            explainAi: 'Mit KI erklären',
            aiExplanationTitle: 'KI-Erklärung',
            aiLoading: 'Erklärung wird generiert...',
            deepDive: 'Vertiefung: Lernpfad ->',
        },
    },
    lernpfad: {
        title: 'Lernpfade',
        progress: '{{done}} von {{total}} Schritten abgeschlossen',
        filterByLevel: 'Nach Level filtern',
        allLevels: 'Alle Level',
        completed: 'Abgeschlossen',
        markDone: 'Als erledigt markieren',
        resetPath: 'Fortschritt zurücksetzen',
        noPaths: 'Keine Lernpfade verfügbar.',
        level: {
            beginner: 'Einsteiger',
            intermediate: 'Fortgeschritten',
            expert: 'Experte',
        },
        paths: {
            'beginner-first-grow': {
                title: 'Dein erster Grow',
                description:
                    'Alles was du für eine erfolgreiche erste Ernte brauchst, Schritt für Schritt.',
                steps: {
                    'step-setup': {
                        title: 'Setup & Ausrüstung',
                        description:
                            'Lerne was du zum Starten brauchst: Zelt, Licht, Lüfter, Töpfe und Medium.',
                    },
                    'step-germination': {
                        title: 'Keimung',
                        description:
                            'Wie man Samen zuverlässig keimen lässt - Küchenpapier-Methode oder Direktaussaat im Medium.',
                    },
                    'step-veg': {
                        title: 'Vegetatives Wachstum',
                        description:
                            'Den Keimling zu einer kräftigen vegetativen Pflanze aufziehen. Gießen, Nährstoffe und Licht-Grundlagen.',
                    },
                    'step-flower': {
                        title: 'Blüte',
                        description:
                            'Die Blütephase einleiten und managen. Lichtplan, Nährstoffwechsel und Knospenentwicklung.',
                    },
                    'step-harvest': {
                        title: 'Ernte & Reifung',
                        description:
                            'Trichome ablesen, den richtigen Erntezeitpunkt bestimmen und der wichtige Trocknungs- und Reifeprozess.',
                    },
                    'step-vpd-practice': {
                        title: 'VPD Praxis',
                        description:
                            'Den VPD-Rechner nutzen um zu verstehen wie Temperatur und Luftfeuchtigkeit deine Pflanze beeinflussen.',
                    },
                },
            },
            'environment-mastery': {
                title: 'Umgebungsmeisterschaft',
                description:
                    'Tieftauchgang in Temperatur, Luftfeuchtigkeit, VPD, CO2 und Luftstrom.',
                steps: {
                    'step-env-basics': {
                        title: 'Temp. & Luftfeuchtigkeits-Grundlagen',
                        description:
                            'Optimale Bereiche für jede Wachstumsphase und wie man sie kontrolliert.',
                    },
                    'step-vpd-deep': {
                        title: 'VPD Tieftauchgang',
                        description:
                            'Das Dampfdruckdefizit verstehen und nutzen um Pflanzengesundheit und Ertrag zu maximieren.',
                    },
                    'step-airflow': {
                        title: 'Luftstrom & CO2',
                        description:
                            'Warum Luftstrom wichtig ist, wie man Zirkulations- und Abluftlüfter einrichtet und CO2-Grundlagen.',
                    },
                    'step-env-calc': {
                        title: 'Rechner-Praxis',
                        description:
                            'Den VPD-Rechner in verschiedenen Phasen nutzen um ein Gefühl für ideale Bedingungen zu entwickeln.',
                    },
                },
            },
            'nutrient-mastery': {
                title: 'Nährstoff-Meisterschaft',
                description: 'Makro- und Mikronährstoffe, EC, pH und Mangeldiagnose meistern.',
                steps: {
                    'step-macros': {
                        title: 'Makronährstoffe (N-P-K)',
                        description:
                            'Die Rolle von Stickstoff, Phosphor und Kalium in allen Wachstumsphasen.',
                    },
                    'step-micros': {
                        title: 'Sekundär- und Mikronährstoffe',
                        description:
                            'Kalzium, Magnesium, Schwefel, Eisen, Zink und ihre Mangelsymptome.',
                    },
                    'step-ec-ph': {
                        title: 'EC, PPM & pH',
                        description:
                            'Wie man die Stärke und den pH-Wert der Nährlösung misst und kontrolliert.',
                    },
                    'step-deficiency-atlas': {
                        title: 'Mangelatlas',
                        description:
                            'Den Krankheitsatlas durchsuchen um Nährstoffmängel zu erkennen und zu behandeln.',
                    },
                    'step-nutrient-calc': {
                        title: 'Nährstoffrechner',
                        description:
                            'Den Nährstoffverhältnis-Rechner nutzen um Düngungen nach Wachstumsphase zu planen.',
                    },
                },
            },
            'pest-disease-control': {
                title: 'Schädlings- & Krankheitsbekämpfung',
                description:
                    'Die häufigsten Schädlinge und Krankheiten erkennen, behandeln und vorbeugen.',
                steps: {
                    'step-plant-hygiene': {
                        title: 'Pflanzenhygiene & Vorbeugung',
                        description:
                            'Reinigungsprotokolle, Quarantäne für neue Pflanzen und Umweltprävention.',
                    },
                    'step-pest-id': {
                        title: 'Schädlingserkennung',
                        description:
                            'Spinnmilben, Trauermücken, Blattläuse und Thripse frühzeitig erkennen.',
                    },
                    'step-disease-id': {
                        title: 'Krankheitserkennung',
                        description:
                            'Echten Mehltau, Botrytis und Wurzelfaule erkennen bevor sie eine Ernte zerstören.',
                    },
                },
            },
            'advanced-training': {
                title: 'Fortgeschrittenes Pflanzentraining',
                description:
                    'LST, Topping, Super Cropping, SCROG und Manifolding für maximalen Ertrag.',
                steps: {
                    'step-why-train': {
                        title: 'Warum Pflanzen trainieren?',
                        description:
                            'Apikale Dominanz verstehen und wie Training sie für bessere Erträge bricht.',
                    },
                    'step-lst-topping': {
                        title: 'LST & Topping',
                        description:
                            'Low-Stress-Training und Topping-Grundlagen mit Timing- und Technikdetails.',
                    },
                    'step-scrog-manifold': {
                        title: 'SCROG & Manifolding',
                        description:
                            'Fortgeschrittene Techniken für ein perfekt gleichmäßiges Blattdach mit maximalen Knospenplätzen.',
                    },
                },
            },
            firstGrow: {
                title: 'Dein erster Grow',
                description:
                    'Alles was du für eine erfolgreiche erste Ernte brauchst, Schritt für Schritt.',
                step1Title: 'Setup & Ausrüstung',
                step1Desc:
                    'Lerne was du zum Starten brauchst: Zelt, Licht, Lüfter, Töpfe und Medium.',
                step2Title: 'Keimung',
                step2Desc:
                    'Wie man Samen zuverlässig keimen lässt -- Küchenpapier-Methode oder Direktaussaat im Medium.',
                step3Title: 'Vegetatives Wachstum',
                step3Desc:
                    'Den Keimling zu einer kräftigen vegetativen Pflanze aufziehen. Gießen, Nährstoffe und Licht-Grundlagen.',
                step4Title: 'Blüte',
                step4Desc:
                    'Die Blütephase einleiten und managen. Lichtplan, Nährstoffwechsel und Knospenentwicklung.',
                step5Title: 'Ernte & Reifung',
                step5Desc:
                    'Trichome ablesen, den richtigen Erntezeitpunkt bestimmen und der wichtige Trocknungs- und Reifeprozess.',
                step6Title: 'VPD Praxis',
                step6Desc:
                    'Den VPD-Rechner nutzen um zu verstehen wie Temperatur und Luftfeuchtigkeit deine Pflanze beeinflussen.',
            },
            environment: {
                title: 'Umgebungsmeisterschaft',
                description:
                    'Tieftauchgang in Temperatur, Luftfeuchtigkeit, VPD, CO2 und Luftstrom.',
                step1Title: 'Temp. & Luftfeuchtigkeits-Grundlagen',
                step1Desc:
                    'Optimale Bereiche für jede Wachstumsphase und wie man sie kontrolliert.',
                step2Title: 'VPD Tieftauchgang',
                step2Desc:
                    'Das Dampfdruckdefizit verstehen und nutzen um Pflanzengesundheit und Ertrag zu maximieren.',
                step3Title: 'Luftstrom & CO2',
                step3Desc:
                    'Warum Luftstrom wichtig ist, wie man Zirkulations- und Abluftlüfter einrichtet und CO2-Grundlagen.',
                step4Title: 'Rechner-Praxis',
                step4Desc:
                    'Den VPD-Rechner in verschiedenen Phasen nutzen um ein Gefühl für ideale Bedingungen zu entwickeln.',
            },
            nutrients: {
                title: 'Nährstoff-Meisterschaft',
                description: 'Makro- und Mikronährstoffe, EC, pH und Mangeldiagnose meistern.',
                step1Title: 'pH-Leitfaden',
                step1Desc: 'pH verstehen und kontrollieren für optimale Nährstoffaufnahme.',
                step2Title: 'Nährstoffrechner',
                step2Desc:
                    'Den Nährstoffverhältnis-Rechner nutzen um Düngungen nach Wachstumsphase zu planen.',
                step3Title: 'Kalziummangel',
                step3Desc:
                    'Kalziummangel erkennen und behandeln -- eines der häufigsten Grow-Probleme.',
                step4Title: 'Nährstoffverbrennung',
                step4Desc: 'Überdüngung erkennen und die Pflanze davon erholen lassen.',
                step5Title: 'Krankheitsatlas-Praxis',
                step5Desc:
                    'Den Krankheitsatlas durchsuchen um nährstoffbedingte Probleme zu identifizieren und zu behandeln.',
            },
            pests: {
                title: 'Schädlings- & Krankheitsbekämpfung',
                description:
                    'Die häufigsten Schädlinge und Krankheiten erkennen, behandeln und vorbeugen.',
                step1Title: 'Schädlingsbekämpfungs-Leitfaden',
                step1Desc:
                    'Integrierte Schädlingsbekämpfungsstrategien um den Grow schädlingsfrei zu halten.',
                step2Title: 'Spinnmilben',
                step2Desc:
                    'Spinnmilben erkennen und behandeln -- der destruktivste Grow-Schädling.',
                step3Title: 'Echter Mehltau',
                step3Desc: 'Echten Mehltau erkennen und behandeln bevor er den Anbau zerstört.',
            },
            training: {
                title: 'Fortgeschrittenes Pflanzentraining',
                description:
                    'LST, Topping, Super Cropping, SCROG und Manifolding für maximalen Ertrag.',
                step1Title: 'Training-Grundlagen',
                step1Desc:
                    'Die Prinzipien des Pflanzentrainings verstehen und LST und Topping anwenden.',
                step2Title: 'Topping vs. LST',
                step2Desc:
                    'Topping und Low-Stress-Training vergleichen und den besten Ansatz für deinen Grow finden.',
                step3Title: 'Überwässerung beheben',
                step3Desc:
                    'Überwässerung erkennen und beheben -- ein häufiges Problem beim Training dichter Kronen.',
            },
        },
    },
    growTech: {
        title: 'Cannabis Grow-Technologien 2026',
        subtitle: 'Präzision, Automatisierung, KI und Nachhaltigkeit -- die Zukunft des Anbaus.',
        badge2026: '2026 Tech-Überblick',
        intro: 'Die Cannabis-Anbau-Technologie 2026 steht ganz im Zeichen von datengetriebenen, skalierbaren Systemen, die Ertrag, Qualität (THC, Terpene, Cannabinoide) und Effizienz maximieren. Von dynamischen LED-Spektren und KI-gesteuerten Controllern bis hin zu Digital Twins und Aeroponik -- diese Technologien profitieren sowohl professionelle als auch Home-Grower.',
        keyBenefits: 'Vorteile',
        categories: {
            dynamicLighting: {
                title: 'Dynamische LED-Beleuchtung',
                tagline: 'Vollspektrum-LEDs mit adaptiven Spektren für jede Wachstumsphase',
                content:
                    'Hoch-effiziente Vollspektrum-LEDs mit starkem Rot-Anteil erreichen >2,8 umol/J Effizienz und senken den Stromverbrauch um bis zu 40% gegenüber alten HPS-Lampen. Modelle wie HLG 350R oder AC Infinity-Systeme liefern überlegene Lichtgleichmäßigkeit und weniger Hitze.<br><br><strong>Dynamische Beleuchtung:</strong> Fortschrittliche Controller passen das Lichtspektrum automatisch an die Wachstumsphase und VPD-Bedingungen an -- blau-lastig für vegetatives Wachstum, rot-dominant für dichte Blüte.',
                benefits:
                    '<ul><li>20-40% höherer Ertrag mit optimierten Spektren</li><li>Bis zu 40% niedrigere Stromkosten</li><li>Bessere THC-Produktion durch gezielte Rot-/Dunkelrot-Wellenlängen</li><li>Reduzierte Hitzestress am Kronendach</li></ul>',
                tip: 'Ein 350-600W LED-Panel in einem 1,2 x 1,2m Zelt reicht für 4-6 Pflanzen. Achte auf Modelle mit >2,5 umol/J Effizienz für den besten ROI in 1-2 Erntezyklen.',
            },
            sensorsIoT: {
                title: 'Sensoren, IoT & VPD-Optimierung',
                tagline: 'Drahtlose Umgebungsüberwachung mit KI-gesteuerten Regelkreisen',
                content:
                    'Drahtlose Sensoren für Temperatur, Luftfeuchtigkeit, VPD, EC, pH, PAR/PPFD, CO2 und Bodenfeuchte bilden das Rückgrat der Präzisionslandwirtschaft. KI-gesteuerte Controller wie der AC Infinity Controller AI+ sagen Temperaturschwankungen vorher und regeln automatisch Heizung, Lüftung und Feuchtigkeit für perfekten VPD (0,8-1,2 kPa in der Blüte).',
                benefits:
                    '<ul><li>Echtzeit-VPD-Optimierung verhindert Stress, Schimmel und geringe Harzproduktion</li><li>Vorausschauende Umgebungsanpassungen reduzieren manuellen Aufwand</li><li>Kontinuierliche Datenprotokollierung ermeoglicht Trendanalyse und Frühwarnung</li><li>Integration mit CannaGuide über MQTT und BLE-Sensoren</li></ul>',
                tip: 'VPD ist der "unsichtbare Killer" -- falsche Werte verursachen Stress, Schimmel oder geringe Trichom-Produktion. CannaGuide berechnet bereits Echtzeit-VPD mit Höhenkorrektur.',
            },
            aiAutomation: {
                title: 'KI & Automatisierung',
                tagline: 'KI-Plattformen erkennen Probleme vor sichtbaren Symptomen',
                content:
                    'KI-Plattformen analysieren Echtzeit-Sensordaten, erkennen Schädlinge und Mängel vor sichtbaren Symptomen und optimieren automatisch Nährstoff-, Licht- und Bewässerungspläne. Systeme wie Spectron AI-Kameras (4K + Timelapse) oder Hey Abby GrowMate bieten Smartphone-gesteuerten Präzisionsanbau.',
                benefits:
                    '<ul><li>Proaktive Schädlings- und Mangelfrüherkennung rettet ganze Ernten</li><li>Automatisierte Nährstoff- und Bewässerungsplanung reduziert den täglichen Aufwand</li><li>Datengetriebene Compliance-Protokollierung für kommerzielle Betriebe</li><li>Skalierbar vom Einzelzelt bis zur Multi-Raum-Anlage</li></ul>',
                tip: 'CannaGuide bietet bereits KI-gestützte Pflanzendiagnostik (Foto + Daten-basiert), proaktiven Berater und lokalen KI-Fallback -- alles offline nutzbar.',
            },
            digitalTwin: {
                title: 'Digital-Twin-Simulation',
                tagline: 'Virtuelle Grow-Room-Repliken für risikofreies Experimentieren',
                content:
                    'Ein Digital Twin erstellt ein virtuelles Abbild deiner Grow-Umgebung mittels Sensordaten und CFD-Modellen (Computational Fluid Dynamics). Du simulierst "Was-wäre-wenn"-Szenarien -- wie z. B. +200 ppm CO2 oder geänderte Lichtpläne -- und siehst den Ertragseffekt, bevor du reale Änderungen vornimmst.',
                benefits:
                    '<ul><li>Risikofreies Experimentieren mit Umgebungseinstellungen</li><li>Vorausschauende Ertrags- und Qualitätsmodellierung</li><li>Virtuelle Optimierung von HVAC und Beleuchtungsplatzierung</li><li>Drastische Reduzierung von Trial-and-Error-Zyklen</li></ul>',
                tip: 'CannaGuides Sandbox bietet bereits Was-wäre-wenn-Experimente (Topping vs. LST, Temperatur +2C) an geklonten Pflanzen -- der erste Schritt zum vollständigen Digital Twin.',
            },
            hydroAero: {
                title: 'Hydroponik & Aeroponik',
                tagline:
                    'Erdlose Systeme mit bis zu 30% schnellerem Wachstum und 90% weniger Wasser',
                content:
                    'Aeroponik hängt Wurzeln in die Luft und liefert Nährstoffe über feinen Nebel -- bis zu 30% schnelleres Wachstum bei 90% weniger Wasserverbrauch. Rezirkulierende Hydroponiksysteme mit Smart Fertigation nutzen geschlossene Kreisläufe, automatische pH/EC-Anpassung und Präzisionsdosierung über Substratsensoren.',
                benefits:
                    '<ul><li>Deutlich schnellere Wachstumszyklen</li><li>90% Wasserreduktion gegenüber Erdanbau</li><li>Präzise Nährstoffkontrolle eliminiert Verschwendung</li><li>Ideal für Vertical Farming und platzbeschränkte Setups</li></ul>',
                tip: 'CannaGuide unterstützt Erde, Kokos, Hydro und Aeroponik als Anbaumedien. Der Nährstoffplaner passt EC/pH-Zielwerte automatisch je Medium an.',
            },
            tissueCulture: {
                title: 'Gewebekultur & Mikrovermehrung',
                tagline: 'Virusfreies Klonen von Elite-Genetik in grossem Massstab',
                content:
                    'Home-Lab-Kits und professionelle Gewebenkultursysteme ermeoglichen die virusfreie Vermehrung von Elite-Genetik. Dies produziert genetisch identische Klone ohne Mutterpflanzenerhaltung -- und ermöglicht massive Skalierung mit stabiler Genetik und höherer Krankheitsresistenz.',
                benefits:
                    '<ul><li>100% genetische Konsistenz über alle Klone</li><li>Viren- und Pathogeneliminierung</li><li>Keine Mutterpflanzenpflege nötig</li><li>Schnellere Skalierung preisgekrönter Phänotypen</li></ul>',
                tip: 'Verfolge deine Phänotypen und genetische Abstammung in CannaGuides Zuchtlabor und Genealogie-Explorer, um Elite-Kandidaten für die Gewebekultur zu identifizieren.',
            },
            smartGrowBoxes: {
                title: 'All-in-One Smart Grow-Boxen',
                tagline: 'Integrierte Systeme mit LEDs, Lüftern, Sensoren und App-Steuerung',
                content:
                    'Komplettsysteme wie Hey Abby GrowMate oder Mars Hydro Smart Tents integrieren LEDs, Belüftung, Sensoren und App-Steuerung in einer einzigen Einheit. "Einrichten und vergessen" -- perfekt für Einsteiger und Stadt-Grower mit wenig Platz.',
                benefits:
                    '<ul><li>Null Einrichtungskomplexität für Anfänger</li><li>Integrierte Umgebungskontrolle</li><li>Kompakter Platzbedarf für Wohnungsanbau</li><li>App-basiertes Monitoring und Alarme</li></ul>',
                tip: 'Selbst mit einer All-in-One-Box: Nutze CannaGuide für dein Grow-Tagebuch, KI-Beratung und die VPD-Simulation für optimale Ergebnisse.',
            },
            sustainability: {
                title: 'Nachhaltigkeit & Post-Harvest-Tech',
                tagline: 'Energieeinsparung, regenerative Böden und Präzisions-Curing',
                content:
                    'LED- und HVAC-Optimierung reduzieren den Energie- und Wasserverbrauch drastisch. Regenerative Bodenpraktiken, CO2-Anreicherung und Präzisions-Trocknungs-/Curing-Systeme (wie Cannatrol) maximieren die Terpenerhaltung und die Endproduktqualität. Post-Harvest-Technologie wird zunehmend als ebenso wichtig wie der Anbau selbst anerkannt.',
                benefits:
                    '<ul><li>30-50% Reduzierung der Energiekosten mit modernen LEDs + HVAC</li><li>Überlegene Terpen- und Cannabinoid-Konservierung</li><li>Regenerative Böden verbessern die Qualität über mehrere Zyklen</li><li>Nachhaltige Praktiken erfüllen wachsende regulatorische Anforderungen</li></ul>',
                tip: 'CannaGuides Post-Harvest-Simulation (Trocknungs- + Curing-Phasen) verfolgt Glasfeuchtigkeit, Chlorophyllabbau, Terpenerhaltung und Schimmelrisiko.',
            },
        },
        impact: {
            title: 'Technologie-Auswirkungsmatrix',
            headers: {
                area: 'Technologie',
                homeGrower: 'Home-Grower-Vorteil',
                commercial: 'Kommerzieller Vorteil',
                effort: 'Aufwand',
            },
            areas: {
                ledSensors: 'LED + Sensoren',
                aiAutomation: 'KI / Automatisierung',
                aeroponics: 'Aeroponik',
                digitalTwin: 'Digital Twin',
            },
            home: {
                ledSensors: '20-40% mehr Ertrag, weniger Strom',
                aiAutomation: 'Weniger tägliche Arbeit, proaktive Warnungen',
                aeroponics: 'Schnelleres Wachstum, platzsparend',
                digitalTwin: 'Risikofreies Experimentieren',
            },
            commercial: {
                ledSensors: 'Kosteneinsparung, gleichbleibende Qualität',
                aiAutomation: 'Skalierbarkeit, Daten-Compliance',
                aeroponics: 'Maximale Effizienz im grossen Massstab',
                digitalTwin: 'Vorausschauende Planung, Optimierung',
            },
            effort: {
                medium: 'Mittel',
                high: 'Hoch',
                highInitial: 'Hoch (anfangs)',
                mediumHigh: 'Mittel-Hoch',
            },
        },
        cannaGuideIntegration: {
            title: 'Bereits in CannaGuide',
            content:
                'CannaGuide integriert bereits viele dieser 2026-Technologien: Echtzeit-VPD-Simulation mit Höhenkorrektur, KI-gestützte Diagnostik (Cloud + Lokal), Was-wäre-wenn-Sandbox-Experimente, IoT-Sensorintegration (MQTT + BLE), dynamische Spektrumserkennung im Lichtrechner, Aeroponik als Anbaumedium, Post-Harvest-Simulation mit Terpen-Tracking und einen 3-Schicht-lokalen KI-Fallback für vollständig offline Betrieb.',
        },
        searchPlaceholder: 'Technologien filtern...',
        matchToGrow: 'Passt zu meinem Setup',
        matchScore: 'Match-Score',
        noMatchResults: 'Keine Technologie entspricht deiner Suche.',
        aiAnalyze: 'KI-Empfehlung',
        aiAnalyzing: 'Analysiere...',
        aiInsightLabel: 'KI-Einblick',
        noSetupAvailable:
            'Konfiguriere dein Grow-Setup in den Einstellungen, um deinen persönlichen Match-Score zu sehen.',
    },
}

export const tipOfTheDay = {
    title: 'Tipp des Tages',
    tips: [
        'Überprüfe immer den pH-Wert deines Wassers, nachdem du Nährstoffe hinzugefügt hast. Nährstoffe können den pH-Wert erheblich verändern.',
        'Eine sanfte Brise von einem Ventilator, der auf deine Pflanzen gerichtet ist, stärkt die Stängel und beugt Schimmel vor.',
        'Weniger ist mehr, besonders bei Nährstoffen. Es ist einfacher, einen Mangel zu beheben als einen Überschuss (Nährstoffbrand).',
        'Beobachte die Farbe deiner Blätter. Ein sattes, gesundes Grün ist gut. Zu dunkelgrün kann auf zu viel Stickstoff hindeuten, blassgrün oder gelb auf einen Mangel.',
        'Stofftöpfe sind eine großartige Wahl für Anfänger, da sie eine Überwässerung fast unmöglich machen und die Wurzeln mit Sauerstoff versorgen.',
    ],
}

export const analytics = {
    gardenScore: 'Garten-Score',
    avgHealth: 'Durchschn. Gesundheit',
    envStability: 'Umweltstabilität',
    activePlants: 'Aktive Pflanzen',
    stageDistribution: 'Phasenverteilung',
    riskFactors: 'Risikofaktoren',
    strainPerformance: 'Sorten-Performance',
    nextMilestone: 'Nächster Meilenstein',
    daysAway: 'Tage entfernt',
    analyticsEmpty: 'Füge Pflanzen hinzu, um Analysen zu sehen',
    strain: 'Sorte',
    health: 'Gesundheit',
    plants: 'Pflanzen',
    avgAge: 'Durchschn. Alter',
    relatedKnowledge: 'Verwandtes Wissen',
    milestoneType: {
        flip: 'Umstellung auf Blüte',
        harvest: 'Erntereif',
        curing_done: 'Fermentierung abgeschlossen',
        transplant: 'Umtopfen',
    },
    recommendations: {
        title: 'Empfehlungen',
        adjustVpd: 'VPD anpassen',
        adjustVpdDesc:
            'VPD liegt außerhalb des optimalen Bereichs. Temperatur oder Luftfeuchtigkeit anpassen.',
        considerTraining: 'Training in Betracht ziehen',
        considerTrainingDesc:
            'Pflanze ist in später vegetativer Phase. LST oder Topping könnte den Ertrag verbessern.',
        checkTrichomes: 'Trichome prüfen',
        checkTrichomesDesc:
            'Pflanze ist in später Blütephase. Trichome für den Erntezeitpunkt beobachten.',
        improveHealth: 'Pflanzengesundheit verbessern',
        improveHealthDesc:
            'Pflanzengesundheit liegt unter dem Optimum. Nährstoffe, pH und Umgebung prüfen.',
    },
    riskType: {
        health: 'Gesundheit',
        environment: 'Umgebung',
        nutrient: 'Nährstoff',
        pest: 'Schädling/Krankheit',
        overdue_task: 'Überfällige Aufgabe',
    },
    risks: {
        healthCritical: '{{name}} Gesundheit ist kritisch niedrig bei {{health}}%',
        vpdOutOfRange: '{{name}} VPD außerhalb des Bereichs: {{vpd}} kPa',
        severeProblem: '{{name}}: {{problem}} (Schweregrad {{severity}}/10)',
        overdueTask: '{{name}}: Überfällige Aufgabe -- {{task}}',
    },
}

export const growBible = {
    title: 'CannaGuide Grow-Bibel',
    generated: 'Erstellt',
    plants: 'Pflanzen',
    appVersion: 'App-Version',
    toc: 'Inhaltsverzeichnis',
    analyticsSummary: 'Analyse-Zusammenfassung',
    relatedKnowledge: 'Verwandtes Wissen',
    relatedKnowledgeDesc:
        'Basierend auf deinem aktuellen Grow sind diese Wissensthemen am relevantesten:',
    footer: 'Erstellt mit CannaGuide 2025',
    property: 'Eigenschaft',
    value: 'Wert',
    strain: 'Sorte',
    stage: 'Phase',
    age: 'Alter',
    days: 'Tage',
    health: 'Gesundheit',
    temperature: 'Temperatur',
    humidity: 'Luftfeuchtigkeit',
    environment: 'Umgebung',
    moisture: 'Feuchtigkeit',
    activeProblems: 'Aktive Probleme',
    severity: 'Schweregrad',
    journal: 'Tagebuch',
    noNotes: 'Keine Notizen',
    harvestData: 'Erntedaten',
    wetWeight: 'Nassgewicht',
    dryWeight: 'Trockengewicht',
    quality: 'Qualität',
    count: 'Anzahl',
}
