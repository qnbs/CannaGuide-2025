export const knowledgeView = {
    title: 'Kenniscentrum',
    subtitle: 'Je interactieve gids voor succesvolle teelt.',
    tabs: {
        mentor: 'AI Mentor',
        guide: 'Kweekgids',
        archive: 'Mentor Archief',
        breeding: 'Kruisingslaboratorium',
        sandbox: 'Sandbox',
    },
    hub: {
        selectPlant: 'Plant Selecteren',
        noPlants: 'Geen actieve planten voor contextueel advies. Start een kweek om te beginnen!',
        todaysFocus: 'Focus van Vandaag voor {{plantName}}',
    },
    aiMentor: {
        title: 'AI Mentor',
        plantContext: 'Chat met AI Mentor in de context van {{name}}',
        plantContextSubtitle:
            'Selecteer een plant om contextuele vragen te stellen en advies te krijgen.',
        startChat: 'Chat Starten',
        inputPlaceholder: 'Vraag de mentor...',
        clearChat: 'Chat Wissen',
        clearConfirm: 'Weet je zeker dat je de chatgeschiedenis voor deze plant wilt wissen?',
    },
    archive: {
        title: 'Mentor Archief',
        empty: 'Je hebt nog geen mentorreacties gearchiveerd.',
        saveButton: 'Opslaan in Archief',
        saveSuccess: 'Reactie opgeslagen in archief!',
        queryLabel: 'Jouw Vraag',
        editTitle: 'Reactie Bewerken',
    },
    breeding: {
        title: 'Kruisingslaboratorium',
        description:
            'Kruis je verzamelde zaden om nieuwe, unieke varieteiten te creeren met gecombineerde eigenschappen.',
        collectedSeeds: 'Verzamelde Zaden',
        noSeeds: 'Verzamel zaden van oogstrijpe planten om te beginnen met kruisen.',
        parentA: 'Ouder A',
        parentB: 'Ouder B',
        clearParent: '{{title}} Wissen',
        selectSeed: 'Selecteer een zaad',
        dropSeed: 'Laat het zaad hier vallen',
        breedButton: 'Nieuwe Varieteit Kruisen',
        resultsTitle: 'Kruisingsresultaat',
        newStrainName: 'Naam Nieuwe Varieteit',
        potentialTraits: 'Potentiele Eigenschappen',
        saveStrain: 'Varieteit Opslaan',
        breedingSuccess: '"{{name}}" succesvol gekruist! Toegevoegd aan "Mijn Varieteiten".',
        splicingGenes: 'Genen splitsen...',
        flowering: 'Bloei',
        phenoTracking: 'Fenotype Tracking',
        vigor: 'Groeikracht',
        resin: 'Hars',
        aroma: 'Aroma',
        diseaseResistance: 'Ziekteresistentie',
        automatedGenetics: 'Automatische Genetische Schatting',
        stabilityScore: 'Stabiliteitsscore',
        arTitle: 'AR Kruisingsvoorbeeld',
        arSupported: 'WebXR gereed',
        arFallback: '3D terugval',
        arPreviewLabel: 'Driedimensionaal kruisingsvoorbeeld',
        arLoading: 'AR-voorbeeld laden...',
        webglUnavailableTitle: '3D-voorbeeld niet beschikbaar',
        webglUnavailableDescription:
            'Je browser kon geen WebGL-context aanmaken, dit voorbeeld wordt getoond als statische terugval.',
        webglUnavailableHint:
            'Schakel hardwareversnelling in of gebruik een browserprofiel met GPU-toegang om het live voorbeeld te herstellen.',
    },
    scenarios: {
        toppingVsLst: {
            title: 'Topping vs. LST Experiment Uitvoeren',
            description:
                'Simuleert een groeiperiode van 14 dagen waarbij een plant met LST wordt vergeleken met een die is getopt.',
        },
        tempPlus2c: {
            title: 'Temperatuur +2\u00b0C Experiment Uitvoeren',
            description:
                'Simuleert een groeiperiode van 14 dagen waarbij basiscondities worden vergeleken met een +2\u00b0C verhoging van de bladerdaktemperatuur.',
        },
    },
    knowledgebase: {
        'phase1-prep': {
            title: 'Fase 1: Voorbereiding en Apparatuur',
            content: `<h3>Welkom bij de Kweek!</h3><p>Een succesvolle oogst begint met goede voorbereiding.</p>
                      <strong>Hygiene is Essentieel:</strong> Reinig en desinfecteer je hele kweekruimte grondig.<br>
                      <strong>Apparatuur Controle:</strong>
                      <ul>
                        <li><strong>Licht:</strong> Test je lamp en timer.</li>
                        <li><strong>Ventilatie:</strong> Controleer of je afzuiger en ventilatoren correct werken.</li>
                        <li><strong>Medium en Potten:</strong> Bevochtig het medium licht voor het planten.</li>
                      </ul>
                      <strong>Kalibratie:</strong> Richt op <strong>22-25\u00b0C</strong> en <strong>65-75% relatieve luchtvochtigheid</strong>.`,
        },
        'phase2-seedling': {
            title: 'Fase 2: Ontkieming en Zaailing',
            content: `<h3>De Eerste Weken</h3><p>Dit is de meest delicate fase. Minder is meer.</p>
                      <strong>Ontkieming:</strong> Houd het medium consequent vochtig maar nooit doorweekt.<br>
                      <strong>Licht:</strong> Zaailingen hebben geen intens licht nodig. 18/6 lichtcyclus.<br>
                      <strong>Water:</strong> Geef spaarzaam water in een klein cirkeltje rond de stengel.<br>
                      <strong>Voedingsstoffen:</strong> Nog geen voeding! De meeste grond bevat genoeg voor 2-3 weken.`,
        },
        'phase3-vegetative': {
            title: 'Fase 3: Vegetatieve Groei',
            content: `<h3>Tijd om te Groeien!</h3><p>De plant ontwikkelt een sterke structuur van bladeren, takken en wortels.</p>
                      <strong>Licht:</strong> Verhoog geleidelijk de intensiteit. 18/6 cyclus.<br>
                      <strong>Voedingsstoffen:</strong> Verhoog langzaam. Stikstof (N) is cruciaal.<br>
                      <strong>Training:</strong> Begin met <strong>LST</strong> of <strong>Topping</strong>.<br>
                      <strong>Omgeving:</strong> Ideale luchtvochtigheid daalt naar 50-70%.`,
        },
        'phase4-flowering': {
            title: 'Fase 4: Bloei',
            content: `<h3>De Bloei Begint</h3><p>De meest spannende fase waarin je plant toppen produceert.</p>
                      <strong>Lichtcyclus:</strong> Schakel over naar <strong>12 uur licht en 12 uur ononderbroken duisternis</strong>.<br>
                      <strong>De Stretch:</strong> De plant kan verdubbelen of verdrievoudigen in de eerste 2-3 weken.<br>
                      <strong>Voedingsstoffen:</strong> Schakel over naar bloeimeststof (minder N, meer P en K).<br>
                      <strong>Luchtvochtigheid:</strong> Verlaag geleidelijk naar <strong>40-50%</strong>.`,
        },
        'phase5-harvest': {
            title: 'Fase 5: Oogst, Drogen en Curen',
            content: `<h3>De Laatste Stappen</h3><p>Geduld in deze laatste fase maakt het verschil.</p>
                      <strong>Oogsttijdstip:</strong> De beste indicator is de kleur van de trichomen. Oogst wanneer de meeste melkachtig/troebel zijn.<br>
                      <strong>Drogen:</strong> Hang takken ondersteboven. <strong>18-20\u00b0C</strong> en <strong>55-60% luchtvochtigheid</strong>. 7-14 dagen.<br>
                      <strong>Curen:</strong> Plaats toppen in luchtdichte glazen potten. Open dagelijks 5-10 minuten de eerste week.`,
        },
        'fix-overwatering': {
            title: 'Probleemoplossing: Te Veel Water',
            content: `<h3>Mijn Plant Verdrinkt!</h3><p>Te veel water geven is fout nummer 1 bij beginners.</p>
                      <strong>Symptomen:</strong> De hele plant ziet er slap en triest uit. Bladeren krullen naar beneden.<br>
                      <strong>Acties:</strong>
                      <ul>
                        <li><strong>Stop met water geven</strong> tot de pot aanzienlijk lichter is.</li>
                        <li><strong>Verbeter de luchtstroom</strong> bij het substraatoppervlak.</li>
                        <li><strong>Controleer de drainage</strong> van de pot.</li>
                      </ul>`,
        },
        'fix-calcium-deficiency': {
            title: 'Probleemoplossing: Calciumtekort',
            content: `<h3>Calciumtekort Verhelpen</h3><p>Calcium is een immobiel voedingsstof.</p>
                      <strong>Symptomen:</strong> Kleine roestbruine vlekken op bladeren. Vervormd nieuw groei.<br>
                      <strong>Oorzaken:</strong> Verkeerde pH, RO/gedestilleerd water, kokossubstraat.<br>
                      <strong>Oplossing:</strong> Corrigeer de pH. Gebruik een Cal-Mag supplement.`,
        },
        'fix-nutrient-burn': {
            title: 'Probleemoplossing: Voedingsverbranding',
            content: `<h3>Voedingsverbranding Verhelpen</h3><p>Gebeurt wanneer de plant meer voedingsstoffen krijgt dan ze kan verwerken.</p>
                      <strong>Symptomen:</strong> Bladpunten worden geel, dan bruin en knapperig.<br>
                      <strong>Oplossing:</strong>
                      <ol>
                        <li><strong>Spoel het medium</strong> met zuiver, pH-gecorrigeerd water.</li>
                        <li><strong>Verlaag de voedingsconcentratie</strong> bij de volgende voeding.</li>
                      </ol>`,
        },
        'fix-pests': {
            title: 'Probleemoplossing: Veelvoorkomende Plagen',
            content: `<h3>Omgaan met Ongewenste Gasten</h3><p>Vroege detectie is de sleutel.</p>
                      <strong>Spintmijten:</strong> Kleine witte of gele stipjes op bladeren. Oplossing: neemolie of insecticide zeep.<br>
                      <strong>Varenrouwmuggen:</strong> Kleine zwarte vliegjes bij het substraat. Oplossing: laat de bovenlaag opdrogen. Gebruik gele lijmvallen.`,
        },
        'concept-training': {
            title: 'Kernconcept: Planttraining',
            content: `<h3>Waarom Je Planten Trainen?</h3><p>Training manipuleert de groei voor een efficientere structuur.</p>
                      <strong>Hoofdtypen:</strong>
                      <ul>
                        <li><strong>LST:</strong> Takken voorzichtig buigen en vastbinden.</li>
                        <li><strong>HST:</strong> Technieken zoals <strong>Topping</strong> of <strong>Super Cropping</strong>.</li>
                      </ul>
                      <strong>Resultaat:</strong> Meerdere grote, dichte toppen in plaats van een enkele hoofdtop.`,
        },
        'concept-environment': {
            title: 'Kernconcept: De Omgeving',
            content: `<h3>Je Kweekruimte Beheersen</h3><p>De drie pijlers: Temperatuur, Luchtvochtigheid en Luchtcirculatie.</p>
                      <strong>Temperatuur en Luchtvochtigheid:</strong> Gerelateerd en gemeten via <strong>VPD</strong>.
                      <ul>
                        <li><strong>Zaailing/Veg:</strong> 22-28\u00b0C en 50-70% luchtvochtigheid.</li>
                        <li><strong>Bloei:</strong> 20-26\u00b0C en 40-50% luchtvochtigheid.</li>
                      </ul>
                      <strong>Luchtcirculatie:</strong>
                      <ul>
                        <li><strong>Afzuiger:</strong> Verwijdert continu warme, vochtige lucht.</li>
                        <li><strong>Ventilatoren:</strong> Creeren een zacht briesje in de tent.</li>
                      </ul>`,
        },
    },
    sandbox: {
        title: 'Experimentele Sandbox',
        experimentOn: 'Experimenteren op {{name}}',
        scenarioDescription: '{{actionA}} vs. {{actionB}} vergeleken over {{duration}} dagen.',
        runningSimulation: 'Versnelde simulatie wordt uitgevoerd...',
        startExperiment: 'Nieuw Experiment',
        modal: {
            title: 'Nieuw Experiment Starten',
            description:
                'Selecteer een plant om een 14-daagse "Topping vs. LST" simulatie uit te voeren.',
            runScenario: 'Scenario Starten',
            noPlants: 'Je moet eerst een plant kweken om een experiment te starten.',
        },
        savedExperiments: 'Opgeslagen Experimenten',
        noExperiments: 'Nog geen opgeslagen experimenten.',
        basedOn: 'Gebaseerd op: {{name}}',
        run: 'Uitvoering: {{date}}',
    },
    guide: {
        phases: 'Fases',
        coreConcepts: 'Kernconcepten',
        troubleshooting: 'Probleemoplossing',
    },
    growLog: {
        title: 'Grow-Log RAG',
        description:
            'Bevraag je eigen dagboek direct. Relevante logboekvermeldingen worden eerst geladen en vervolgens geanalyseerd door de AI.',
        placeholder: 'Bijv., Waarom schommelt mijn VPD in week 4?',
        analyzing: 'Analyseren...',
        startAnalysis: 'RAG-analyse Starten',
        activeCorpus: 'Actieve planten in RAG-corpus: {{count}}',
    },
}

export const tipOfTheDay = {
    title: 'Tip van de Dag',
    tips: [
        'Controleer altijd de pH van je water na het toevoegen van voedingsstoffen.',
        'Een zachte bries van een ventilator gericht op je planten versterkt de stengels en voorkomt schimmel.',
        'Minder is meer, vooral met voedingsstoffen. Een tekort is makkelijker te verhelpen dan een overmaat.',
        'Let op de kleur van je bladeren. Gezond groen is goed. Te donker groen kan te veel stikstof betekenen.',
        'Stoffen potten zijn ideaal voor beginners omdat ze overbewatering bijna onmogelijk maken.',
    ],
}
