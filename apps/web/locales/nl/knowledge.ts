export const knowledgeView = {
    title: 'Kenniscentrum',
    subtitle: 'Je interactieve gids voor succesvolle teelt.',
    tabs: {
        mentor: 'AI Mentor',
        guide: 'Kweekgids',
        archive: 'Mentor Archief',
        breeding: 'Kruisingslaboratorium',
        sandbox: 'Sandbox',
        growTech: 'Grow Tech 2026',
        lexikon: 'Lexicon',
        atlas: 'Ziektenatlas',
        rechner: 'Rekenmachine',
        lernpfad: 'Leerpaden',
        analytik: 'Analyse',
        navLabel: 'Kennissecties',
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
        humidityPlus10: {
            title: 'Luchtvochtigheid +10% Experiment',
            description:
                'Simuleert 14 dagen met +10% relatieve luchtvochtigheid voor schimmelrisicoanalyse.',
        },
        humidityMinus10: {
            title: 'Luchtvochtigheid -10% Experiment',
            description:
                'Simuleert 14 dagen met -10% relatieve luchtvochtigheid voor VPD-optimalisatie.',
        },
        lightBoost: {
            title: 'Lichtintensiteit +200 PPFD',
            description: 'Simuleert 14 dagen met verhoogde lichtintensiteit (+200 PPFD).',
        },
        phDriftAcidic: {
            title: 'pH-drift naar 5.5',
            description: 'Simuleert een geleidelijke pH-drift naar 5.5 over 14 dagen.',
        },
        ecRampUp: {
            title: 'EC-stijging +0.5',
            description: 'Simuleert een geleidelijke EC-stijging van 0.5 over 14 dagen.',
        },
        defoliationDay7: {
            title: 'Ontbladering op Dag 7',
            description:
                'Simuleert een ontbladeringsgebeurtenis op dag 7 en de effecten over 14 dagen.',
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
        viewResults: 'Resultaten Bekijken',
        customExperiment: 'Aangepast Experiment',
        customDuration: 'Duur (dagen)',
        customActionA: 'Actie A',
        customActionB: 'Actie B',
        customDayA: 'Dag A',
        customDayB: 'Dag B',
        actionLabels: {
            TOP: 'Topping',
            LST: 'LST',
            NONE: 'Geen (Controle)',
            TEMP_PLUS_2: 'Temp +2C',
            TEMP_MINUS_2: 'Temp -2C',
            HUMIDITY_PLUS_10: 'Vochtigheid +10%',
            HUMIDITY_MINUS_10: 'Vochtigheid -10%',
            LIGHT_BOOST: 'Licht +200 PPFD',
            PH_DRIFT_ACIDIC: 'pH-drift (zuur)',
            EC_RAMP: 'EC-stijging',
            DEFOLIATE: 'Ontbladering',
        },
        chartTabs: {
            height: 'Hoogte',
            health: 'Gezondheid',
            stress: 'Stress',
            nutrients: 'pH / EC',
        },
    },
    guide: {
        phases: 'Fases',
        coreConcepts: 'Kernconcepten',
        troubleshooting: 'Probleemoplossing',
        growTech: 'Grow Tech 2026',
        genetics: 'Genetica',
        searchPlaceholder: 'Zoek gidsen...',
        noResults: 'Geen artikelen gevonden voor "{{term}}"',
        readProgress: '{{read}} van {{total}} artikelen gelezen',
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
    lexikon: {
        searchPlaceholder: 'Termen zoeken...',
        filterLabel: 'Filteren op categorie',
        all: 'Alle',
        categories: {
            cannabinoid: 'Cannabinoiden',
            terpene: 'Terpenen',
            flavonoid: 'Flavonoiden',
            nutrient: 'Voedingsstoffen',
            disease: 'Ziekten',
            general: 'Algemeen',
        },
        noResults: 'Geen resultaten voor "{{term}}"',
        resultCount: '{{count}} van {{total}} termen',
        totalCount: '{{count}} termen',
        noDefinition: 'Geen definitie beschikbaar.',
    },
    atlas: {
        searchPlaceholder: 'Diagnoses zoeken...',
        allCategories: 'Alle categorieen',
        allUrgencies: 'Alle urgentieniveaus',
        noResults: 'Geen vermeldingen gevonden.',
        filterByCategory: 'Filteren op categorie',
        filterByUrgency: 'Filteren op urgentie',
        entryCount: '{{count}} vermeldingen',
        close: 'Sluiten',
        category: {
            deficiency: 'Tekort',
            toxicity: 'Toxiciteit',
            environmental: 'Omgeving',
            pest: 'Plagen',
            disease: 'Ziekte',
        },
        severity: {
            low: 'Laag',
            medium: 'Gemiddeld',
            high: 'Hoog',
            critical: 'Kritiek',
        },
        urgency: {
            monitor: 'Monitoren',
            act_soon: 'Snel handelen',
            act_immediately: 'Direct handelen',
        },
        detail: {
            symptoms: 'Symptomen',
            causes: 'Oorzaken',
            treatment: 'Behandeling',
            prevention: 'Preventie',
            relatedTerms: 'Gerelateerde termen',
        },
        diseases: {
            'nitrogen-deficiency': {
                name: 'Stikstoftekort',
                symptoms:
                    'Vergeling begint op de onderste, oudere bladeren en werkt zich omhoog. Bladeren kleuren van geelgroen naar volledig geel. Groei vertraagt.',
                causes: 'Overbewatering, lage pH (blokkeert N-opname), onvoldoende stikstof in de voedingsoplossing, wortelschade.',
                treatment:
                    'Spoel het substraat met pH-gecorrigeerd water, voer daarna met een stikstofrijke oplossing. Corrigeer pH naar 6,0-7,0 (aarde) of 5,5-6,5 (hydro).',
                prevention:
                    'Houd de pH continu in de gaten, gebruik uitgebalanceerde voedingsstoffen, vermijd overbewatering.',
            },
            'phosphorus-deficiency': {
                name: 'Fosfortekort',
                symptoms:
                    'Paarse of roodachtige verkleuring aan de onderkant van bladeren en stengels. Donkergroene bladeren kunnen naar beneden krullen. Trage groei.',
                causes: 'Lage pH (onder 6,0 in aarde), lage temperatuur in de wortelzone (onder 15 C), onvoldoende fosfor in de oplossing.',
                treatment:
                    'Verhoog indien nodig de pH, zet de kamertemperatuur hoger, supplement met een fosforkrijke bloeimestkorrel.',
                prevention:
                    'Houd de wortelzone boven 18 C, bewaar de juiste pH, gebruik bloeivoeding bij de start van de bloeifase.',
            },
            'potassium-deficiency': {
                name: 'Kaliumtekort',
                symptoms:
                    'Bruine, knapperige bladranden en -punten, beginnend op de oudste bladeren. Vergeling tussen de nerven. Zwakke stengels.',
                causes: 'Hoge pH (blokkeert K), overschot aan calcium of magnesium dat concurreert met opname, onvoldoende kalium in de oplossing.',
                treatment:
                    'Controleer en corrigeer de pH, verminder concurrerende voedingsstoffen indien nodig, supplement met kalium.',
                prevention:
                    'Gebruik een complete voedingsformule met voldoende kalium, met name aan het einde van de bloei.',
            },
            'calcium-deficiency': {
                name: 'Calciumtekort',
                symptoms:
                    'Kleine bruine of roestvlekken op jonge bladeren. Nieuwe scheuten zijn gekruld of gerimpeld. Zwakke stengels.',
                causes: 'Lage pH die calciumbeschikbaarheid beperkt, gebruik van omgekeerd osmose-/gedestilleerd water zonder remineralisatie, coco zonder pre-buffering.',
                treatment:
                    'Corrigeer pH naar 6,2-7,0, voeg Cal-Mag supplement toe, pre-buffer coco voor gebruik.',
                prevention: 'Pre-buffer coco, gebruik Cal-Mag bij RO-water, houd de pH correct.',
            },
            'magnesium-deficiency': {
                name: 'Magnesiumtekort',
                symptoms:
                    'Vergeling tussen de nerven (internerval chlorose) op middelste tot oudere bladeren terwijl de nerven groen blijven. Bladeren kunnen omhoog krullen.',
                causes: 'Lage pH, hoog kalium dat concurreert met magnesiumopname, onvoldoende magnesium in de oplossing.',
                treatment:
                    'Corrigeer pH, verlaag kalium indien te hoog, voeg Cal-Mag of Epsomzout (MgSO4) toe -- 1 theelepel/liter als bladbespuiting voor snel resultaat.',
                prevention:
                    'Gebruik een uitgebalanceerde voedingsformule, inclusief Cal-Mag supplement, behoud de juiste pH.',
            },
            'iron-deficiency': {
                name: 'IJzertekort',
                symptoms:
                    'Felgele (chlorotische) bladeren op de allernieuwste groei, terwijl de nerven groen blijven. Klassiek internerval chlorosepatroon.',
                causes: 'Hoge pH (meest voorkomende oorzaak, met name boven 7,0), verzadigde wortels, overschot fosfor of mangaan dat concurreert.',
                treatment:
                    'Verlaag pH naar 6,0-6,5, verbeter drainage, gebruik gecheleerd ijzersupplement.',
                prevention:
                    'Behoud de juiste pH, vermijd overbewatering, gebruik gecheleerd micronutrientenpakket.',
            },
            'zinc-deficiency': {
                name: 'Zinktekort',
                symptoms:
                    'Vergeling van bladweefsel tussen nerven op jonge bladeren. Bladeren kunnen gevlekt of vervormd lijken. Korte internodale afstand.',
                causes: 'Hoge pH, overschot fosfor dat zinkopname remt, weinig zink in het substraat of de oplossing.',
                treatment:
                    'Corrigeer pH naar het optimale bereik, verlaag fosfor indien te hoog, supplement met zink.',
                prevention: 'Gebruik een compleet micronutrientenformule, behoud de juiste pH.',
            },
            'sulfur-deficiency': {
                name: 'Zwaveltekort',
                symptoms:
                    'Jonge bladeren kleuren gelijkmatig lichtgeel tot wit. In tegenstelling tot stikstofsgebrek begint dit op jong/nieuw blad.',
                causes: 'Weinig zwavel in de voedingsoplossing, zeer hoge pH, recent verspoten of gespoelde planten.',
                treatment:
                    'Voeg een zwavelhoudend voedsel toe (veel basisvoedingsstoffen bevatten dit), controleer de pH.',
                prevention: 'Gebruik een complete voedingsformule, vermijd extreme pH-waarden.',
            },
            'nutrient-burn': {
                name: 'Nutrientverbranding (Toxiciteit)',
                symptoms:
                    'Bladpunten worden bruin en knapperig en werken zich naar binnen toe. Punten kunnen omhoog krullen. Glanzend donkergroen kleur.',
                causes: 'Te hoge EC/PPM in de voedingsoplossing, te frequente bemesting, sterk verrijkte aarde.',
                treatment:
                    'Spoel het substraat met 3x het potvolume aan pH-gecorrigeerd water. Verlaag de volgende bemesting naar 50% concentratie.',
                prevention:
                    'Begin met lage voedstofconcentraties, verhoog geleidelijk, meet EC/PPM regelmatig.',
            },
            'nitrogen-toxicity': {
                name: 'Stikstofoverbemesting',
                symptoms:
                    'Glanzend donkergroene bladeren. Punten kunnen naar beneden krullen (de "klauw"). Overmatige bladgroei, verminderde bloemdichtheid.',
                causes: 'Te veel stikstof, met name tijdens de bloei als de N-behoefte afneemt.',
                treatment:
                    'Stop stikstofbemesting, spoel met pH-gecorrigeerd water, schakel over op bloeivoeding.',
                prevention:
                    'Verminder stikstof bij de overgang naar bloei, gebruik bloeispecifieke voedingsstoffen.',
            },
            overwatering: {
                name: 'Overbewatering',
                symptoms:
                    'De gehele plant hangt slap. Bladeren voelen stevig maar hangen gebogen neer. Aarde blijft dagenlang vochtig. Vergeling.',
                causes: 'Te frequent gieten, slechte drainage, potten zonder gaten, te dicht substraat.',
                treatment:
                    'Stop volledig met gieten totdat de pot erg licht aanvoelt. Verbeter ventilatie rondom de pot. Overweeg verpotten in een beter afwaterende mix.',
                prevention:
                    'Til potten op voelt het gewicht -- water geven pas als merkbaar lichter. Gebruik potten met goede drainagegaten. Laat substraat gedeeltelijk uitdrogen.',
            },
            underwatering: {
                name: 'Onderbewatering',
                symptoms:
                    'De gehele plant hangt slap. Bladeren voelen dun en papierachtig aan met een lichte naar-binnen-krul. De pot voelt erg licht aan.',
                causes: 'Te zelden gieten, droog klimaat, snel drainend substraat, grote plant in kleine pot.',
                treatment:
                    'Geef royaal water totdat drainage uit de onderkant sijpelt. De plant zou binnen enkele uren moeten herstellen.',
                prevention:
                    'Controleer regelmatig het gewicht van de pot. Geef water als de eerste laag substraat droog is.',
            },
            'heat-stress': {
                name: 'Hittestress',
                symptoms:
                    "Bladranden en -punten krullen omhoog als taco's. Gebleekte of verbrande plekken waar bladeren het dichtst bij het licht zijn. Verwelking ondanks voldoende water.",
                causes: 'Kamertemperatuur boven 30 C, verlichting te dicht bij het bladerdak, slechte ventilatie, hotspots.',
                treatment:
                    'Verbeter ventilatie, hang lampen hoger, voeg airconditioning toe. Bespuit bladeren als tijdelijke noodoplossing.',
                prevention:
                    'Houd bladerdaktemperatuur onder 28 C. Zorg voor voldoende luchtcirculatie boven het bladerdak.',
            },
            'light-burn': {
                name: 'Lichtverbranding',
                symptoms:
                    'Witte of geel-gebleekte vlekken op bovenste bladeren die het dichtst bij het licht zijn. Bladeren recht onder het licht lijken gebleekt ondanks voldoende voedingsstoffen.',
                causes: 'Kweeklamp te dicht bij het bladerdak, te hoge lichtintensiteit (te hoge PPFD).',
                treatment:
                    'Hang de lamp onmiddellijk hoger. Gebleekte zones herstellen niet, maar nieuwe groei zal gezond zijn.',
                prevention:
                    'Houd aanbevolen minimale ophangafstand van fabrikant aan, monitor PPFD.',
            },
            'ph-lockout': {
                name: 'pH-blokkade',
                symptoms:
                    'Meerdere tekort symptomen die gelijktijdig optreden ondanks voldoende voedingsstoffen. Plant ziet er algeheel ziek uit.',
                causes: 'pH van de voedingsoplossing of het substraat valt buiten het optimale opnamebereik voor sleutelvoedingsstoffen.',
                treatment:
                    'Test de pH van de wortelzone (drainagetest). Spoel substraat met correct pH-gecorrigeerd water. Hervat bemesting op de juiste pH.',
                prevention:
                    'Pas altijd de pH aan van water en voedingsoplossing. Test de drainagepH wekelijks.',
            },
            'spider-mites': {
                name: 'Spintmijten',
                symptoms:
                    'Kleine witte/gele stipjes op het bladadoppervlak. Fijne spinsels tussen bladeren en stengels. Kleine bewegende stipjes zichtbaar met vergrootglas.',
                causes: 'Droge, warme omstandigheden. Besmette stekken of substraat. Slechte luchtcirculatie.',
                treatment:
                    'Bespuit alle bladoppervlakken (met name onderzijde) met neemolie, insectenzeep of spinosad. Verhoog luchtvochtigheid. Herhaal elke 3 dagen gedurende 2 weken.',
                prevention:
                    'Handhaaf 50-60% RV, zorg voor luchtcirculatie, inspecteer nieuwe planten voordat ze de kweekruimte ingaan.',
            },
            'fungus-gnats': {
                name: 'Rouwmuggen',
                symptoms:
                    'Kleine zwarte mugjes rond het substraatoppervlak. Jonge zaailingen verwelken door larvenschade aan wortels. Kleine witte larven zichtbaar in substraat.',
                causes: 'Overbewatering die het oppervlak vochtig houdt, waardoor volwassen vrouwtjes kunnen leggen. Turfrijke mengsels.',
                treatment:
                    'Laat de bovenste 5 cm van het substraat volledig uitdrogen. Gebruik gele plakstrips voor volwassen exemplaren. Breng nuttige nematoden of Bacillus thuringiensis israelensis (Bti) aan.',
                prevention:
                    'Vermijd overbewatering, laat het substraatoppervlak uitdrogen, gebruik een perlitelaag op het substraat.',
            },
            aphids: {
                name: 'Bladluizen',
                symptoms:
                    'Clusters van zachte insecten op nieuwe scheuten en de onderkant van bladeren. Kleverige honingdauwresten op bladeren. Nieuwe bladeren gekruld of vervormd.',
                causes: 'Open kweekruimte, besmette stekken of blootstelling aan buiten.',
                treatment:
                    'Verwijder met water, breng insectenzeep of neemolie aan, introduceer nuttige insecten (lieveheersbeestjes, gaasvliegen).',
                prevention: 'Houd kweekruimte gesloten, inspecteer alle nieuwe planten.',
            },
            thrips: {
                name: 'Tripsen',
                symptoms:
                    'Zilveren/witte strepen of vlekken op bladeren (vraatwonden). Zwarte uitwerpselen op het bladadoppervlak. Bladeren kunnen bronze tinten krijgen.',
                causes: 'Besmette planten of substraat, open kweekruimte.',
                treatment:
                    'Breng spinosad, neemolie of roofmijten aan (Amblyseius cucumeris). Herhaal regelmatig.',
                prevention:
                    'Strikte quarantaine voor nieuwe stekken, gebruik vroeg gele plakstrips.',
            },
            'powdery-mildew': {
                name: 'Echte Meeldauw',
                symptoms:
                    'Witte, poederachtige vlekken op bladadoppervlakken, stengels en bloemen. Vlekken verspreiden zich snel. Aangetast weefsel kan vergelen en afsterven.',
                causes: 'Hoge luchtvochtigheid (boven 60%) gecombineerd met slechte luchtcirculatie en gematigde temperaturen (15-27 C). Overbevolkte planten.',
                treatment:
                    'Verwijder zwaar aangetaste bladeren. Breng kaliumbicarbonaat, neemolie of verdund waterstofperoxide aan. Verhoog luchtcirculatie en verlaag RV direct.',
                prevention:
                    'Houd RV onder 50% tijdens bloei. Zorg voor sterke luchtcirculatie door het bladerdak. Vermijd overbevolking.',
            },
            botrytis: {
                name: 'Botrytis (Knoprot / Grijze Schimmel)',
                symptoms:
                    "Grijze, donzige schimmel die verschijnt in dichte bloemtoppen. Bruine, zachte vlekken in het midden van cola's. Zichtbare grijze sporen.",
                causes: 'Hoge luchtvochtigheid (boven 50% tijdens bloei), slechte luchtcirculatie, dichte bloemtoppen, temperaturen onder 20 C bij hoge RV.',
                treatment:
                    'Verwijder onmiddellijk alle aangetast materiaal en doe het in een zak. Schud bloemen niet -- sporen verspreiden. Verhoog luchtcirculatie en verlaag RV drastisch.',
                prevention:
                    'Houd bloei-RV op 40-50%. Defolieer dicht bladerdak voor luchtcirculatie. Oogst op tijd.',
            },
            'root-rot': {
                name: 'Wortelrot (Pythium/Phytophthora)',
                symptoms:
                    'Wortels worden bruin/grijs en slijmerig in plaats van wit en stevig. Nare geur vanuit de wortelzone. Plant verwelkt ondanks voldoende water. In hydro: verkleurde voedingsoplossing.',
                causes: 'Overbewatering of slechte drainage. Anaerobe omstandigheden in de wortelzone. Watertemperatuur boven 22 C in hydro. Onvoldoende nuttige micro-organismen.',
                treatment:
                    'In aarde: verminder gieten, verbeter drainage, breng nuttige bacterien/mycorrhiza aan. In hydro: vervang reservoir, verlaag watertemperatuur, behandel met waterstofperoxide of nuttige bacterien.',
                prevention:
                    'Vermijd overbewatering. Houd hydroreservoir onder 20 C. Gebruik luchtpompen. Entent met nuttige micro-organismen.',
            },
        },
    },
    lernpfad: {
        title: 'Leerpaden',
        progress: '{{done}} van {{total}} stappen voltooid',
        progressLabel: '{{done}} van {{total}} stappen',
        filterByLevel: 'Filteren op niveau',
        allLevels: 'Alle niveaus',
        completed: 'Voltooid',
        markDone: 'Markeer als gedaan',
        resetPath: 'Voortgang resetten',
        noPaths: 'Geen leerpaden beschikbaar.',
        level: {
            beginner: 'Beginner',
            intermediate: 'Gemiddeld',
            expert: 'Expert',
        },
        paths: {
            'beginner-first-grow': {
                title: 'Jouw Eerste Kweek',
                description:
                    'Alles wat je nodig hebt voor een succesvolle eerste oogst, stap voor stap.',
                steps: {
                    'step-setup': {
                        title: 'Opzet en Uitrusting',
                        description:
                            'Leer wat je nodig hebt om te beginnen: tent, verlichting, ventilator, potten en substraat.',
                    },
                    'step-germination': {
                        title: 'Ontkieming',
                        description:
                            'Hoe je zaden betrouwbaar laat kiemen met de papieren handdoek methode of direct in substraat.',
                    },
                    'step-veg': {
                        title: 'Vegetatieve Groei',
                        description:
                            'Jouw zaailing opkweken tot een robuuste vegetatieve plant. Basis van bewaren, voedingsstoffen en licht.',
                    },
                    'step-flower': {
                        title: 'Bloei',
                        description:
                            'De bloeifase activeren en beheren. Lichtschema, voedingswissel en bloemtopontwikkeling.',
                    },
                    'step-harvest': {
                        title: 'Oogsten en Drogen',
                        description:
                            'Trichomen lezen, het juiste oogsttijdstip kiezen en het cruciale droog- en uithardingsproces.',
                    },
                    'step-vpd-practice': {
                        title: 'VPD Oefening',
                        description:
                            'Gebruik de VPD-calculator om te begrijpen hoe temperatuur en luchtvochtigheid je plant beinvloeden.',
                    },
                },
            },
            'environment-mastery': {
                title: 'Omgevingsmeesterschap',
                description:
                    'Diepgaand over temperatuur, luchtvochtigheid, VPD, CO2 en luchtcirculatie.',
                steps: {
                    'step-env-basics': {
                        title: 'Basis Temp. en Luchtvochtigheid',
                        description:
                            'Optimale bereiken voor elke groeifase en hoe die te beheersen.',
                    },
                    'step-vpd-deep': {
                        title: 'VPD Verdieping',
                        description:
                            'Dampdrukdeficit begrijpen en gebruiken om plantgezondheid en opbrengst te maximaliseren.',
                    },
                    'step-airflow': {
                        title: 'Luchtcirculatie en CO2',
                        description:
                            'Waarom luchtcirculatie belangrijk is, hoe circulatie- en extractieventilatoren in te stellen en CO2-basisprincipes.',
                    },
                    'step-env-calc': {
                        title: 'Oefenen met Calculators',
                        description:
                            'Gebruik de VPD-calculator in verschillende fases om intuïtie te ontwikkelen voor ideale omstandigheden.',
                    },
                },
            },
            'nutrient-mastery': {
                title: 'Nutrientenmeesterschap',
                description:
                    'Beheers macro- en micronutrienten, EC, pH en het diagnosticeren van tekorten.',
                steps: {
                    'step-macros': {
                        title: 'Macronutrienten (N-P-K)',
                        description: 'De rol van stikstof, fosfor en kalium in alle groeifasen.',
                    },
                    'step-micros': {
                        title: 'Micro- en Secundaire',
                        description:
                            'Calcium, magnesium, zwavel, ijzer, zink en hun tekort-symptomen.',
                    },
                    'step-ec-ph': {
                        title: 'EC, PPM en pH',
                        description:
                            'Hoe de sterkte en pH van de voedingsoplossing te meten en te beheersen.',
                    },
                    'step-deficiency-atlas': {
                        title: 'Tekort Atlas',
                        description:
                            'Gebruik de Ziekte-atlas om nutriententekorten te identificeren en te behandelen.',
                    },
                    'step-nutrient-calc': {
                        title: 'Nutrientencalculator',
                        description:
                            'Gebruik de ratioberekening om bemesting per groeifase te plannen.',
                    },
                },
            },
            'pest-disease-control': {
                title: 'Plaag- en Ziektebestrijding',
                description:
                    'Identificeer, behandel en voorkom de meest voorkomende plagen en ziekten.',
                steps: {
                    'step-plant-hygiene': {
                        title: 'Hygiene en Preventie',
                        description:
                            'Reinigingsprotocollen, quarantaine voor nieuwe planten en preventieve omgevingsmaatregelen.',
                    },
                    'step-pest-id': {
                        title: 'Plaagidentificatie',
                        description:
                            'Spintmijten, rouwmuggen, bladluizen en tripsen tijdig detecteren.',
                    },
                    'step-disease-id': {
                        title: 'Ziekteidentificatie',
                        description:
                            'Echte meeldauw, botrytis en wortelrot herkennen voordat ze een oogst vernietigen.',
                    },
                },
            },
            'advanced-training': {
                title: 'Geavanceerde Plantentraining',
                description:
                    'LST, topping, super cropping, SCROG en manifolding voor maximale opbrengst.',
                steps: {
                    'step-why-train': {
                        title: 'Waarom Planten Trainen?',
                        description:
                            'Api dominantie begrijpen en hoe training dit doorbreekt voor betere opbrengsten.',
                    },
                    'step-lst-topping': {
                        title: 'LST en Topping',
                        description:
                            'Basisprincipes van low-stress training en topping met timing- en techniekdetails.',
                    },
                    'step-scrog-manifold': {
                        title: 'SCROG en Manifolding',
                        description:
                            'Geavanceerde technieken voor een perfectly uniform bladerdak met maximale bloeipunten.',
                    },
                },
            },
            firstGrow: {
                title: 'Jouw Eerste Kweek',
                description:
                    'Alles wat je nodig hebt voor een succesvolle eerste oogst, stap voor stap.',
                step1Title: 'Opzet en Uitrusting',
                step1Desc:
                    'Leer wat je nodig hebt om te beginnen: tent, verlichting, ventilator, potten en substraat.',
                step2Title: 'Ontkieming',
                step2Desc:
                    'Hoe je zaden betrouwbaar laat kiemen -- papieren handdoek methode of direct in substraat.',
                step3Title: 'Vegetatieve Groei',
                step3Desc:
                    'Jouw zaailing opkweken tot een robuuste vegetatieve plant. Basis van bewaren, voedingsstoffen en licht.',
                step4Title: 'Bloei',
                step4Desc:
                    'De bloeifase activeren en beheren. Lichtschema, voedingswissel en bloemtopontwikkeling.',
                step5Title: 'Oogsten en Drogen',
                step5Desc:
                    'Trichomen lezen, het juiste oogsttijdstip kiezen en het cruciale droog- en uithardingsproces.',
                step6Title: 'VPD Oefening',
                step6Desc:
                    'Gebruik de VPD-calculator om te begrijpen hoe temperatuur en luchtvochtigheid je plant beinvloeden.',
            },
            environment: {
                title: 'Omgevingsmeesterschap',
                description:
                    'Diepgaand over temperatuur, luchtvochtigheid, VPD, CO2 en luchtcirculatie.',
                step1Title: 'Basis Temp. en Luchtvochtigheid',
                step1Desc: 'Optimale bereiken voor elke groeifase en hoe die te beheersen.',
                step2Title: 'VPD Verdieping',
                step2Desc:
                    'Dampdrukdeficit begrijpen en gebruiken om plantgezondheid te maximaliseren.',
                step3Title: 'Luchtcirculatie en CO2',
                step3Desc:
                    'Waarom luchtcirculatie belangrijk is en hoe ventilatoren in te stellen.',
                step4Title: 'Oefenen met Calculators',
                step4Desc:
                    'Gebruik de VPD-calculator in verschillende fases om intuïtie voor ideale omstandigheden te ontwikkelen.',
            },
            nutrients: {
                title: 'Nutrientenmeesterschap',
                description:
                    'Beheers macro- en micronutrienten, EC, pH en het diagnosticeren van tekorten.',
                step1Title: 'pH Gids',
                step1Desc: 'pH begrijpen en beheersen voor optimale nutrientenopname.',
                step2Title: 'Nutrientencalculator',
                step2Desc: 'Gebruik de ratiocalculator om bemesting per groeifase te plannen.',
                step3Title: 'Calciumtekort',
                step3Desc:
                    'Calciumtekort herkennen en behandelen -- een van de meest voorkomende problemen.',
                step4Title: 'Nutrientverbranding',
                step4Desc: 'Nutrientoverdosering herkennen en de plant helpen te herstellen.',
                step5Title: 'Oefenen met de Atlas',
                step5Desc:
                    'Gebruik de Ziekte-atlas om voedingsproblemen te identificeren en te behandelen.',
            },
            pests: {
                title: 'Plaag- en Ziektebestrijding',
                description:
                    'Identificeer, behandel en voorkom de meest voorkomende plagen en ziekten.',
                step1Title: 'Plaagbeheergids',
                step1Desc: 'Geintegreerde plaagbeheerstrategieen om de kweek plaagvrij te houden.',
                step2Title: 'Spintmijten',
                step2Desc: 'Spintmijten detecteren en behandelen -- de meest destructieve plaag.',
                step3Title: 'Echte Meeldauw',
                step3Desc:
                    'Echte meeldauw herkennen en behandelen voordat het de oogst vernietigt.',
            },
            training: {
                title: 'Geavanceerde Plantentraining',
                description:
                    'LST, topping, super cropping, SCROG en manifolding voor maximale opbrengst.',
                step1Title: 'Trainingsbasics',
                step1Desc:
                    'De principes van plantentraining begrijpen en LST en topping toepassen.',
                step2Title: 'Topping vs. LST',
                step2Desc: 'Topping en low-stress training vergelijken en de beste aanpak vinden.',
                step3Title: 'Oplossing voor Overbewatering',
                step3Desc:
                    'Overbewatering herkennen en oplossen -- een veelvoorkomend probleem bij training.',
            },
        },
    },
    growTech: {
        title: 'Cannabis Grow Technologies 2026',
        subtitle: 'Precision, automation, AI, and sustainability -- the future of cultivation.',
        badge2026: '2026 Tech Overview',
        intro: 'The cannabis cultivation technology landscape in 2026 is defined by data-driven, scalable systems that maximize yield, quality, and efficiency.',
        keyBenefits: 'Key Benefits',
        categories: {
            dynamicLighting: {
                title: 'Dynamic LED Lighting',
                tagline: 'Full-spectrum LEDs with adaptive spectra for each growth phase',
                content:
                    'High-efficiency full-spectrum LEDs with strong red emphasis reach >2.8 umol/J efficiency and reduce power consumption by up to 40%.',
                benefits:
                    '<ul><li>20-40% higher yield with optimized spectra</li><li>Up to 40% lower electricity costs</li><li>Better THC production</li></ul>',
                tip: 'A 350-600W LED panel in a 1.2 x 1.2m tent covers 4-6 plants.',
            },
            sensorsIoT: {
                title: 'Sensors, IoT & VPD Optimization',
                tagline: 'Wireless environmental monitoring with AI-driven control loops',
                content:
                    'Wireless sensors for temperature, humidity, VPD, EC, pH form the backbone of precision cultivation.',
                benefits:
                    '<ul><li>Real-time VPD optimization</li><li>Predictive adjustments</li><li>MQTT and BLE integration</li></ul>',
                tip: 'VPD is the "invisible killer" -- wrong values cause stress, mold, or low trichome production.',
            },
            aiAutomation: {
                title: 'AI & Automation',
                tagline: 'AI platforms that detect problems before visible symptoms appear',
                content:
                    'AI platforms analyze sensor data and detect pests and deficiencies before visible symptoms.',
                benefits:
                    '<ul><li>Proactive pest detection</li><li>Automated scheduling</li><li>Data-driven compliance</li></ul>',
                tip: 'CannaGuide includes AI-powered diagnostics and local AI fallback -- all working offline.',
            },
            digitalTwin: {
                title: 'Digital Twin Simulation',
                tagline: 'Virtual grow room replicas for risk-free experimentation',
                content:
                    'A Digital Twin creates a virtual replica of your grow environment using sensor data.',
                benefits:
                    '<ul><li>Zero-risk experimentation</li><li>Predictive yield modeling</li><li>Virtual optimization</li></ul>',
                tip: 'CannaGuide Sandbox offers what-if experiments on cloned plants.',
            },
            hydroAero: {
                title: 'Hydroponics & Aeroponics',
                tagline: 'Soilless systems with up to 30% faster growth and 90% less water',
                content:
                    'Aeroponics delivers nutrients via fine mist -- up to 30% faster growth with 90% less water.',
                benefits:
                    '<ul><li>Faster growth</li><li>90% water reduction</li><li>Precise nutrient control</li></ul>',
                tip: 'CannaGuide supports Soil, Coco, Hydro, and Aeroponics as grow media.',
            },
            tissueCulture: {
                title: 'Tissue Culture & Micropropagation',
                tagline: 'Virus-free cloning of elite genetics at scale',
                content: 'Home-lab kits enable virus-free propagation of elite genetics.',
                benefits:
                    '<ul><li>100% genetic consistency</li><li>Pathogen elimination</li><li>Faster scaling</li></ul>',
                tip: 'Track phenotypes in CannaGuide Breeding Lab and Genealogy Explorer.',
            },
            smartGrowBoxes: {
                title: 'All-in-One Smart Grow Boxes',
                tagline: 'Integrated systems with LEDs, fans, sensors, and app control',
                content:
                    'Complete systems with LEDs, ventilation, sensors, and app control in one unit.',
                benefits:
                    '<ul><li>Zero setup complexity</li><li>Integrated control</li><li>App-based monitoring</li></ul>',
                tip: 'Use CannaGuide alongside for grow journal and AI advice.',
            },
            sustainability: {
                title: 'Sustainability & Post-Harvest Tech',
                tagline: 'Energy savings, regenerative soils, and precision curing',
                content:
                    'LED + HVAC optimization reduces energy consumption. Regenerative soils maximize terpene retention.',
                benefits:
                    '<ul><li>30-50% energy reduction</li><li>Superior terpene preservation</li><li>Sustainable practices</li></ul>',
                tip: 'CannaGuide post-harvest simulation tracks humidity, chlorophyll, and mold risk.',
            },
        },
        impact: {
            title: 'Technology Impact Matrix',
            headers: {
                area: 'Technology',
                homeGrower: 'Home Grower Advantage',
                commercial: 'Commercial Advantage',
                effort: 'Setup Effort',
            },
            areas: {
                ledSensors: 'LED + Sensors',
                aiAutomation: 'AI / Automation',
                aeroponics: 'Aeroponics',
                digitalTwin: 'Digital Twin',
            },
            home: {
                ledSensors: '20-40% more yield, lower power bills',
                aiAutomation: 'Less daily work, proactive alerts',
                aeroponics: 'Faster growth, space-saving',
                digitalTwin: 'Risk-free experimentation',
            },
            commercial: {
                ledSensors: 'Cost savings, consistent quality',
                aiAutomation: 'Scalability, data compliance',
                aeroponics: 'Maximum efficiency at scale',
                digitalTwin: 'Predictive planning, optimization',
            },
            effort: {
                medium: 'Medium',
                high: 'High',
                highInitial: 'High (initial)',
                mediumHigh: 'Medium-High',
            },
        },
        cannaGuideIntegration: {
            title: 'Already in CannaGuide',
            content:
                'CannaGuide integrates many 2026 technologies: real-time VPD simulation, AI-powered diagnostics, what-if sandbox, IoT sensor integration, and 3-layer local AI fallback.',
        },
        searchPlaceholder: 'Technologieen filteren...', // machine-translated, review needed
        matchToGrow: 'Koppelen aan mijn setup',
        matchScore: 'Overeenkomstscore',
        noMatchResults: 'Geen technologieen komen overeen met uw zoekopdracht.',
        aiAnalyze: 'AI-aanbeveling',
        aiAnalyzing: 'Analyseren...',
        aiInsightLabel: 'AI-inzicht',
        noSetupAvailable:
            'Configureer uw kweekomgeving in de Instellingen om uw persoonlijke overeenkomstscore te zien.',
    },
    rechner: {
        title: 'Rekenmachinecentrum',
        vpdTab: 'VPD',
        nutrientTab: 'Voedingsstoffen',
        phTab: 'pH / EC',
        terpeneEntourageTab: 'Entourage',
        transpirationTab: 'Transpiratie',
        ecTdsTab: 'EC/TDS',
        lightSpectrumTab: 'Licht',
        cannabinoidRatioTab: 'Cannabinoiden',
        equipmentLink: 'Voor geavanceerde rekenmachines, zie de sectie Uitrusting.',
        vpd: {
            temperature: 'Luchttemperatuur',
            humidity: 'Relatieve Luchtvochtigheid',
            leafOffset: 'Bladtemp.-afwijking',
            celsius: '\u00b0C',
            result: 'VPD Resultaat',
            statusLow: 'VPD te laag -- risico op schimmel en trage groei.',
            statusOk: 'VPD optimaal -- ideale transpiratie.',
            statusHigh: 'VPD te hoog -- risico op hittestress en verwelking.',
            refTitle: 'VPD Referentiebereiken',
            rangeSeedling: 'Zaailing',
            rangeVeg: 'Vegetatief',
            rangeFlower: 'Bloei',
            rangeLateFlower: 'Late Bloei',
            simulate: '7 dagen simuleren',
            simulationTitle: '7-Daags VPD-Verloop',
            explainAi: 'Uitleggen met AI',
            aiExplanationTitle: 'AI Uitleg',
            aiLoading: 'Uitleg genereren...',
            deepDive: 'Verdieping: Leerpad ->',
        },
        nutrient: {
            growStage: 'Groeifase',
            volume: 'Watervolume (L)',
            seedling: 'Zaailing',
            veg: 'Vegetatief',
            earlyFlower: 'Vroege Bloei',
            lateFlower: 'Late Bloei',
            seedlingDesc: 'Lichte voeding, hoog N voor wortel- en blaadontwikkeling.',
            vegDesc: 'Sterk N, matig P/K voor krachtige vegetatieve groei.',
            earlyFlowerDesc: 'Verlaag N, verhoog P/K bij het begin van knopvorming.',
            lateFlowerDesc: 'Minimaal N -- rijpingsfase, focus op P/K en spoelbare mineralen.',
            targetEc: 'Doel-EC (mS/cm)',
            dosage: 'Geschatte Dosering',
            disclaimer: 'Waarden zijn richtlijnen. Meet altijd EC en pH na het mengen.',
            unitLiter: 'L',
        },
        ph: {
            intro: 'Optimale pH- en EC-bereiken varieren per groeisubstraat. Binnen deze bereiken blijven zorgt voor optimale voedingsstoffenbeschikbaarheid.',
            medium: 'Substraat',
            phRange: 'pH Bereik',
            ecRange: 'EC Bereik (mS/cm)',
            note: 'Stel altijd de pH van je water en voedingsoplossing in na elk mengsel. Gebruik een gekalibreerde pH-meter.',
            mediums: {
                soil: 'Aarde',
                coco: 'Kokos',
                hydro: 'Hydro',
            },
        },
        terpeneEntourage: {
            description:
                'Voer je terpeenprofiel in om de entourage-effectscore en synergiematrix te berekenen. Gebaseerd op Russo (2011) en Booth & Bohlmann (2019).',
            terpeneName: 'Terpeen',
            terpenePercent: 'Percentage',
            addTerpene: 'Terpeen toevoegen',
            remove: 'Verwijderen',
            score: 'Entourage Score',
            dominant: 'Dominant',
            profile: 'Profiel',
            synergyMatrix: 'Synergieparen',
            learnMore: 'Meer over terpeenwetenschap ->',
            explainAi: 'Uitleggen met AI',
            aiExplanationTitle: 'AI Uitleg',
            aiLoading: 'Uitleg genereren...',
            deepDive: 'Verdieping: Leerpad ->',
            thcLabel: 'THC',
            cbdLabel: 'CBD',
            cbgLabel: 'CBG',
        },
        transpiration: {
            description:
                'Bereken de transpiratiesnelheid van het bladerdak op basis van VPD, stomataire geleiding en Bladoppervlakindex (Penman-Monteith benadering).',
            vpd: 'VPD',
            gsmmol: 'Stomataire Geleiding',
            lai: 'Bladoppervlakindex (LAI)',
            hours: 'Fotoperiode (u/dag)',
            leafRate: 'Bladtranspiratie',
            canopyRate: 'Bladerdaktranspiratie',
            dailyWater: 'Dagelijks Waterverbruik',
            learnMore: 'Meer over waterbeheer bij planten ->',
            simulate: '7 dagen simuleren',
            simulationTitle: '7-Daagse Projectie',
            explainAi: 'Uitleggen met AI',
            aiExplanationTitle: 'AI Uitleg',
            aiLoading: 'Uitleg genereren...',
            deepDive: 'Verdieping: Leerpad ->',
        },
        ecTds: {
            description:
                'Converteer tussen EC (mS/cm) en TDS op alle drie gebruikelijke schalen. Voer pH-metingen in de loop van de tijd in voor een driftvoorspelling.',
            ecInput: 'EC (mS/cm)',
            tds500: 'TDS-500',
            tds640: 'TDS-640',
            tds700: 'TDS-700',
            phReadings: 'pH-metingen (kommagescheiden)',
            drift: 'pH-Drift',
            prediction: 'Dag 7 Projectie',
            learnMore: 'Meer over EC, TDS en pH-beheer ->',
            simulate: '7 dagen simuleren',
            simulationTitle: '7-Daagse EC-Drift',
            explainAi: 'Uitleggen met AI',
            aiExplanationTitle: 'AI Uitleg',
            aiLoading: 'Uitleg genereren...',
            deepDive: 'Verdieping: Leerpad ->',
        },
        lightSpectrum: {
            description:
                'Bereken DLI, fotosynthetische efficientie en geschatte terpeenproductieboost op basis van je lichtspectruminstellingen.',
            ppfd: 'PPFD',
            redPercent: '% Rood Band',
            bluePercent: '% Blauw Band',
            hours: 'Fotoperiode (u/dag)',
            stage: 'Groeifase',
            dli: 'Dagelijks Lichtintegraal (DLI)',
            efficiency: 'Fotosynthetische Efficientie',
            terpeneBoost: 'Terpeen Boost',
            recommended: 'Aanbevolen Verhouding',
            learnMore: 'Meer over lichtspectrum en terpeenproductie ->',
            simulate: '7 dagen simuleren',
            simulationTitle: '7-Daagse DLI-Curve',
            explainAi: 'Uitleggen met AI',
            aiExplanationTitle: 'AI Uitleg',
            aiLoading: 'Uitleg genereren...',
            deepDive: 'Verdieping: Leerpad ->',
        },
        cannabinoidRatio: {
            description:
                'Analyseer THC:CBD:CBG-verhoudingen, profieltype en entourage-harmoniescore.',
            ratio: 'Verhouding',
            profile: 'Profieltype',
            harmony: 'Harmoniescore',
            learnMore: 'Meer over cannabinoidprofielen ->',
            explainAi: 'Uitleggen met AI',
            aiExplanationTitle: 'AI Uitleg',
            aiLoading: 'Uitleg genereren...',
            deepDive: 'Verdieping: Leerpad ->',
        },
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

export const analytics = {
    gardenScore: 'Tuinscore',
    avgHealth: 'Gem. Gezondheid',
    envStability: 'Omgevingsstabiliteit',
    activePlants: 'Actieve Planten',
    stageDistribution: 'Faseverdeling',
    riskFactors: 'Risicofactoren',
    strainPerformance: 'Soortprestaties',
    nextMilestone: 'Volgende Mijlpaal',
    daysAway: 'dagen te gaan',
    analyticsEmpty: 'Voeg planten toe om analyses te zien',
    strain: 'Soort',
    health: 'Gezondheid',
    plants: 'Planten',
    avgAge: 'Gem. Leeftijd',
    relatedKnowledge: 'Gerelateerde Kennis',
    milestoneType: {
        flip: 'Overschakelen naar Bloei',
        harvest: 'Klaar voor Oogst',
        curing_done: 'Droging Voltooid',
        transplant: 'Verpotten',
    },
    recommendations: {
        title: 'Aanbevelingen',
        adjustVpd: 'VPD Aanpassen',
        adjustVpdDesc:
            'VPD is buiten het optimale bereik. Pas temperatuur of luchtvochtigheid aan.',
        considerTraining: 'Training Overwegen',
        considerTrainingDesc:
            'Plant is in late vegetatieve fase. LST of topping kan de opbrengst verbeteren.',
        checkTrichomes: 'Trichomen Controleren',
        checkTrichomesDesc: 'Plant is in late bloeifase. Monitor trichomen voor het oogstmoment.',
        improveHealth: 'Plantgezondheid Verbeteren',
        improveHealthDesc:
            'Plantgezondheid is onder optimaal. Controleer voedingsstoffen, pH en omgeving.',
        phDrift: 'pH-drift gedetecteerd',
        phDriftDesc: 'pH drijft buiten het optimale bereik 5.8-6.8. Kalibreren en aanpassen.',
        ecRampUp: 'EC verhogen voor bloei',
        ecRampUpDesc: 'EC is laag voor de bloeifase. Voedingsconcentratie geleidelijk verhogen.',
        defoliation: 'Ontbladering overwegen',
        defoliationDesc:
            'Plant is volwassen met goede gezondheid. Selectieve ontbladering kan lichtpenetratie verbeteren.',
    },
    healthTrend: 'Gezondheidstrend (14d)',
    nutrientConsistency: 'Voedingsconsistentie',
    nutrientRating: {
        stable: 'Stabiel',
        moderate: 'Matig',
        unstable: 'Instabiel',
    },
    growDuration: 'Kweekduur per Soort',
    growDurationMin: 'Min',
    growDurationMax: 'Max',
    growDurationAvg: 'Gem',
    growDurationCount: 'Oogsten',
    noFinishedGrows: 'Nog geen voltooide kweek.',
    journalTrend: 'Dagboekactiviteit (14d)',
    journalEntries: 'Invoer',
    exportCsv: 'CSV Exporteren',
    chartDay: 'Dag',
    chartHealth: 'Gezondheid',
    phLabel: 'pH',
    ecLabel: 'EC',
    riskType: {
        health: 'Gezondheid',
        environment: 'Omgeving',
        nutrient: 'Voedingsstof',
        pest: 'Plaag/Ziekte',
        overdue_task: 'Achterstallige Taak',
    },
    risks: {
        healthCritical: '{{name}} gezondheid is kritiek laag op {{health}}%',
        vpdOutOfRange: '{{name}} VPD buiten bereik: {{vpd}} kPa',
        severeProblem: '{{name}}: {{problem}} (ernst {{severity}}/10)',
        overdueTask: '{{name}}: Achterstallige taak -- {{task}}',
    },
}

export const growBible = {
    title: 'CannaGuide Kweekbijbel',
    generated: 'Gegenereerd',
    plants: 'Planten',
    appVersion: 'App Versie',
    toc: 'Inhoudsopgave',
    analyticsSummary: 'Analyse Samenvatting',
    relatedKnowledge: 'Gerelateerde Kennis',
    relatedKnowledgeDesc:
        'Op basis van je huidige kweek zijn deze kennisonderwerpen het meest relevant:',
    footer: 'Gegenereerd door CannaGuide 2025',
    property: 'Eigenschap',
    value: 'Waarde',
    strain: 'Soort',
    stage: 'Fase',
    age: 'Leeftijd',
    days: 'dagen',
    health: 'Gezondheid',
    temperature: 'Temperatuur',
    humidity: 'Luchtvochtigheid',
    environment: 'Omgeving',
    moisture: 'Substraatvochtigheid',
    activeProblems: 'Actieve Problemen',
    severity: 'ernst',
    journal: 'Dagboek',
    noNotes: 'Geen notities',
    harvestData: 'Oogstgegevens',
    wetWeight: 'Nat Gewicht',
    dryWeight: 'Droog Gewicht',
    quality: 'Kwaliteit',
    count: 'Aantal',
}
