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
    },
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
