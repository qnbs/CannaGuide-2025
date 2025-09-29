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
    knowledgebase: {
        'phase1-prep': {
            title: 'Phase 1: Vorbereitung & Ausrüstung',
            content: `<h3>Willkommen beim Grow!</h3><p>Der Schlüssel zu einer erfolgreichen Ernte liegt in einer soliden Vorbereitung. Stelle sicher, dass deine Ausrüstung sauber und funktionsfähig ist.</p>
                      <strong>Zelt:</strong> Überprüfe auf Lichtlecks und reinige die Innenflächen.<br>
                      <strong>Licht:</strong> Teste deine Lampe und den Timer. Für Sämlinge, positioniere das Licht weiter entfernt als üblich.<br>
                      <strong>Substrat & Töpfe:</strong> Wenn du Erde verwendest, feuchte sie leicht an, bevor du den Samen pflanzt. Stelle eine gute Drainage sicher.<br>
                      <strong>Umgebung:</strong> Kalibriere deine Thermo-Hygrometer. Eine stabile Umgebung ist entscheidend.`
        },
        'phase2-seedling': {
            title: 'Phase 2: Keimung & Sämling',
            content: `<h3>Die ersten Lebenswochen</h3><p>Dies ist die empfindlichste Phase. Weniger ist oft mehr.</p>
                      <strong>Keimung:</strong> Halte das Medium feucht, aber nicht nass. Eine hohe Luftfeuchtigkeit (70-80%) ist ideal.<br>
                      <strong>Licht:</strong> Sämlinge benötigen nicht viel Licht. 18 Stunden Licht pro Tag sind üblich. Halte einen ausreichenden Abstand, um Verbrennungen zu vermeiden.<br>
                      <strong>Wasser:</strong> Gieße sparsam um den Stängel herum. Der Wurzelballen ist noch sehr klein.<br>
                      <strong>Nährstoffe:</strong> In den meisten Substraten sind für die ersten 1-2 Wochen genügend Nährstoffe vorhanden. Beginne erst mit einer sehr leichten Düngung, wenn die ersten echten Blattpaare gut entwickelt sind.`
        },
        'phase3-vegetative': {
            title: 'Phase 3: Vegetatives Wachstum',
            content: `<h3>Zeit zu wachsen!</h3><p>In dieser Phase legt deine Pflanze an Größe und Blattmasse zu. Jetzt ist die Zeit für Trainingstechniken.</p>
                      <strong>Licht:</strong> Deine Pflanze kann jetzt mehr Licht vertragen. Passe den Abstand entsprechend an. 18 Stunden Licht sind weiterhin Standard.<br>
                      <strong>Nährstoffe:</strong> Erhöhe langsam die Nährstoffgabe. Ein stickstoffreicher Dünger (N) ist jetzt wichtig.<br>
                      <strong>Training:</strong> Beginne mit LST (Low Stress Training), um die Pflanze buschiger wachsen zu lassen. Topping (das Kappen der Hauptspitze) ist ebenfalls eine beliebte Methode, um mehrere Hauptblüten zu erzeugen.<br>
                      <strong>Umgebung:</strong> Die ideale Luftfeuchtigkeit liegt jetzt bei 50-60%.`
        },
        'phase4-flowering': {
            title: 'Phase 4: Blüte',
            content: `<h3>Die Blüte beginnt</h3><p>Die spannendste Phase! Die Umstellung des Lichtzyklus leitet die Blütenproduktion ein.</p>
                      <strong>Lichtzyklus:</strong> Schalte auf 12 Stunden Licht und 12 Stunden ununterbrochene Dunkelheit um.<br>
                      <strong>Nährstoffe:</strong> Wechsle zu einem Blütedünger mit mehr Phosphor (P) und Kalium (K). Reduziere den Stickstoff.<br>
                      <strong>Stretch:</strong> In den ersten 2-3 Wochen der Blüte wird die Pflanze sich stark strecken. Plane den Platz ein.<br>
                      <strong>Luftfeuchtigkeit:</strong> Senke die Luftfeuchtigkeit auf 40-50%, um Schimmel in den dichten Blüten zu vermeiden.`
        },
        'phase5-harvest': {
            title: 'Phase 5: Ernte, Trocknen & Curing',
            content: `<h3>Der letzte Schliff</h3><p>Geduld in dieser Phase entscheidet über die Qualität des Endprodukts.</p>
                      <strong>Erntezeitpunkt:</strong> Beobachte die Trichome mit einer Lupe. Milchig-trübe Trichome deuten auf den Höhepunkt der Potenz hin. Bernsteinfarbene Trichome geben eine eher körperlich-entspannende Wirkung.<br>
                      <strong>Trocknen:</strong> Hänge die Zweige kopfüber in einem dunklen, kühlen Raum mit guter Luftzirkulation bei ca. 18-20°C und 55-60% Luftfeuchtigkeit auf. Dies sollte 7-14 Tage dauern.<br>
                      <strong>Curing (Fermentierung):</strong> Lagere die trockenen Blüten in luftdichten Gläsern. Öffne die Gläser in der ersten Woche täglich für einige Minuten ("burping"), um Feuchtigkeit entweichen zu lassen. Dieser Prozess baut Chlorophyll ab und verbessert Geschmack und Aroma erheblich.`
        },
        'fix-overwatering': {
            title: 'Problembehebung: Überwässerung',
            content: `<h3>Hilfe, meine Pflanze ertrinkt!</h3><p>Überwässerung ist einer der häufigsten Anfängerfehler. Die Wurzeln ersticken und können keine Nährstoffe aufnehmen.</p>
                      <strong>Symptome:</strong> Hängende, schlaffe Blätter, die sich aber fest und geschwollen anfühlen (im Gegensatz zu den trockenen, schlaffen Blättern bei Unterwässerung). Das Medium bleibt lange nass.<br>
                      <strong>Sofortmaßnahmen:</strong> 1. Gießen sofort einstellen. 2. Gewicht des Topfes prüfen – erst wieder gießen, wenn er deutlich leichter ist. 3. Für gute Luftzirkulation sorgen, auch auf das Substrat gerichtet.<br>
                      <strong>Langfristig:</strong> Verwende Töpfe mit guter Drainage (z.B. Stofftöpfe). Mische Perlit in dein Substrat, um es luftiger zu machen. Lerne, das Gewicht des Topfes als Indikator zu nutzen.`
        },
        'fix-calcium-deficiency': {
            title: 'Problembehebung: Kalziummangel',
            content: `<h3>Kalziummangel beheben</h3><p>Kalzium ist ein wichtiger Nährstoff für die Zellstruktur der Pflanze. Ein Mangel zeigt sich oft an jungen, oberen Blättern.</p>
                      <strong>Symptome:</strong> Kleine, rostbraune Flecken auf den Blättern. Verdrehtes oder verkümmertes neues Wachstum. Schwache Stängel.<br>
                      <strong>Ursachen:</strong> Oft nicht ein Mangel im Dünger, sondern ein falscher pH-Wert im Wurzelbereich, der die Aufnahme blockiert. Kann auch bei der Verwendung von RO-Wasser (Umkehrosmose) auftreten.<br>
                      <strong>Lösung:</strong> 1. Überprüfe und korrigiere den pH-Wert deiner Nährlösung (Erde: 6.0-6.8, Hydro/Coco: 5.5-6.5). 2. Verwende einen Cal-Mag-Zusatz. 3. Stelle sicher, dass die Luftfeuchtigkeit nicht zu hoch ist, da dies die Transpiration und damit die Kalziumaufnahme verlangsamen kann.`
        }
    }
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