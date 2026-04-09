export const helpView = {
    title: 'Hulp en Ondersteuning',
    subtitle: 'Vind antwoorden op je vragen en leer meer over de teelt.',
    tabs: {
        faq: 'FAQ',
        guides: 'Visuele Gidsen',
        lexicon: 'Lexicon',
        manual: 'Gebruikershandleiding',
        screenshots: 'Schermafbeeldingen',
        faqDescription: 'Snelle antwoorden op de meest gestelde vragen over de app en het kweken.',
        guidesDescription:
            'Stap-voor-stap visuele handleidingen voor trainingstechnieken en app-workflows.',
        lexiconDescription:
            'Een uitgebreide woordenlijst van cannabinoiden, terpenen, flavonoiden en kweektermen.',
        manualDescription:
            'De volledige gebruikershandleiding die elke functie van de app in detail behandelt.',
        screenshotsDescription:
            'Schermafbeeldingen van elk app-scherm in desktop- en mobiele weergaven.',
    },
    itemCount: '{{count}} items',
    termCount: '{{count}} termen',
    sectionCount: '{{count}} secties',
    subSectionCount: '{{count}} subsecties',
    guideCount: '{{count}} gidsen',
    screenshotCount: '{{count}} schermafbeeldingen',
    faq: {
        title: 'Veelgestelde Vragen',
        subtitle: 'Verdeeld in app-gebruik, AI/offline-ondersteuning en kweekonderwerpen.',
        searchPlaceholder: 'Zoek vragen...',
        noResults: 'Geen resultaten gevonden voor "{{term}}".',
        expandAll: 'Alles Uitvouwen',
        collapseAll: 'Alles Invouwen',
        resultCount: '{{count}} vragen gevonden',
        resultCountFiltered: '{{count}} van {{total}} vragen komen overeen',
        groups: {
            localAi: 'Lokale AI, Synchronisatie en App-Herstel',
            grow: 'Teelt en Plantenverzorging',
        },
    },
    guides: {
        title: 'Visuele Gidsen',
        subtitle: 'Stap-voor-stap visuele gidsen voor essentiele kweektechnieken.',
    },
    lexicon: {
        title: "Kweker's Lexicon",
        subtitle:
            'Ontdek de wetenschap achter cannabinoiden, terpenen, flavonoiden en essentiele kweekterminologie.',
        searchPlaceholder: 'Zoek termen...',
        noResults: 'Geen termen gevonden voor "{{term}}".',
        resultCount: '{{count}} van {{total}} termen weergegeven',
        categories: {
            all: 'Alle',
            cannabinoid: 'Cannabinoiden',
            terpene: 'Terpenen',
            flavonoid: 'Flavonoiden',
            general: 'Algemeen',
        },
        cannabinoids: {
            thc: {
                term: 'THC (Tetrahydrocannabinol)',
                definition:
                    'De meest bekende en voornaamste psychoactieve cannabinoide in cannabis, verantwoordelijk voor het "high" gevoel.',
            },
            cbd: {
                term: 'CBD (Cannabidiol)',
                definition:
                    'Een niet-psychoactieve cannabinoide bekend om zijn therapeutische eigenschappen, waaronder pijnstillende en ontstekingsremmende effecten.',
            },
            cbg: {
                term: 'CBG (Cannabigerol)',
                definition:
                    'Een niet-psychoactieve cannabinoide vaak aangeduid als de "moeder van alle cannabinoiden" omdat het een voorloper is van THC en CBD.',
            },
            cbn: {
                term: 'CBN (Cannabinol)',
                definition:
                    'Een licht psychoactieve cannabinoide die ontstaat wanneer THC afbreekt. Bekend om zijn sedatieve eigenschappen.',
            },
            cbc: {
                term: 'CBC (Cannabichromeen)',
                definition:
                    'Een niet-psychoactieve cannabinoide die potentieel heeft voor ontstekingsremmende en pijnstillende effecten.',
            },
            thca: {
                term: 'THCA (Tetrahydrocannabinolzuur)',
                definition:
                    'De niet-psychoactieve, zure voorloper van THC in rauwe cannabis. Het wordt omgezet in THC door warmte (decarboxylering).',
            },
            cbda: {
                term: 'CBDA (Cannabidiolzuur)',
                definition:
                    'De zure voorloper van CBD in rauwe cannabis. Heeft eigen potentiele therapeutische effecten, met name ontstekingsremmend.',
            },
            thcv: {
                term: 'THCV (Tetrahydrocannabivarine)',
                definition:
                    'Een cannabinoide structureel vergelijkbaar met THC maar met andere effecten. Bekend als eetlustremmer en kan psychoactief zijn in hoge doses.',
            },
            cbdv: {
                term: 'CBDV (Cannabidivarine)',
                definition:
                    'Een niet-psychoactieve cannabinoide structureel vergelijkbaar met CBD, bestudeerd voor potentieel bij neurologische aandoeningen.',
            },
        },
        terpenes: {
            myrcene: {
                term: 'Myrceen',
                definition:
                    "Een veelvoorkomend terpeen met een aards, muskusachtig aroma. Ook aanwezig in mango's. Bekend om kalmerende en ontspannende eigenschappen.",
            },
            limonene: {
                term: 'Limoneen',
                definition:
                    'Een terpeen met een sterk citrusaroma. Bekend om stemmingsverhogende en stressverlichtende effecten.',
            },
            caryophyllene: {
                term: 'Caryofylleen',
                definition:
                    'Een terpeen met een kruidig, peperachtig aroma. Het enige terpeen dat ook aan cannabinoidreceptoren kan binden en ontstekingsremmende eigenschappen heeft.',
            },
            pinene: {
                term: 'Pineen',
                definition:
                    'Een terpeen met een fris dennenaroma. Kan alertheid bevorderen en heeft ontstekingsremmende eigenschappen.',
            },
            linalool: {
                term: 'Linalool',
                definition:
                    'Een terpeen met een bloemig, lavendelachtig aroma. Bekend om kalmerende, angstverlichtende en slaapbevorderende effecten.',
            },
            terpinolene: {
                term: 'Terpinolene',
                definition:
                    'Een terpeen met een complex, fruitig-bloemig aroma. Heeft vaak een licht opbeurend effect en antioxidante eigenschappen.',
            },
            humulene: {
                term: 'Humuleen',
                definition:
                    'Een terpeen met een aards, houtig aroma, ook aanwezig in hop. Bekend om ontstekingsremmende en eetlustremmende eigenschappen.',
            },
            ocimene: {
                term: 'Ocimeen',
                definition:
                    'Een terpeen met een zoet, kruidig en houtig aroma. Kan opbeurende effecten hebben en wordt bestudeerd voor antivirale eigenschappen.',
            },
            bisabolol: {
                term: 'Bisabolol',
                definition:
                    'Een terpeen met een licht, zoet, bloemig aroma, ook aanwezig in kamille. Bekend om ontstekingsremmende en huidverzachtende eigenschappen.',
            },
            nerolidol: {
                term: 'Nerolidol',
                definition:
                    'Een terpeen met een houtig, bloemig aroma dat doet denken aan boomschors. Heeft sedatieve en angstverlichtende eigenschappen.',
            },
        },
        flavonoids: {
            cannaflavin: {
                term: 'Cannaflavines (A, B, C)',
                definition:
                    'Een groep flavonoiden die uitsluitend in cannabis voorkomen. Ze hebben krachtige ontstekingsremmende eigenschappen.',
            },
            quercetin: {
                term: 'Quercetine',
                definition:
                    'Een flavonoide aanwezig in veel groenten en fruit. Een krachtige antioxidant met antivirale eigenschappen.',
            },
            kaempferol: {
                term: 'Kaempferol',
                definition:
                    'Een flavonoide met sterke antioxidante eigenschappen die kan helpen bij het voorkomen van oxidatieve stress.',
            },
            apigenin: {
                term: 'Apigenine',
                definition:
                    'Een flavonoide met angstverlichtende en sedatieve eigenschappen, ook aanwezig in kamille.',
            },
            luteolin: {
                term: 'Luteoline',
                definition: 'Een flavonoide met antioxidante en ontstekingsremmende eigenschappen.',
            },
            orientin: {
                term: 'Orientine',
                definition:
                    'Een flavonoide met antioxidante, ontstekingsremmende en potentieel antibiotische eigenschappen.',
            },
            vitexin: {
                term: 'Vitexine',
                definition:
                    'Een flavonoide die pijnstillende en antioxidante effecten kan vertonen.',
            },
        },
        general: {
            phValue: {
                term: 'pH-waarde',
                definition:
                    'Een maat voor de zuurgraad of alkaliteit van een oplossing. Bij cannabisteelt is een correcte pH cruciaal voor de opname van voedingsstoffen.',
            },
            ecValue: {
                term: 'EC (Elektrische Geleidbaarheid)',
                definition:
                    'Een maat voor de totale hoeveelheid opgeloste zouten (voedingsstoffen) in een oplossing. Helpt bij het monitoren van de voedingsconcentratie.',
            },
            vpd: {
                term: 'VPD (Dampdrukdeficit)',
                definition:
                    'Een maat voor de gecombineerde druk van temperatuur en vochtigheid op de plant. Een optimale VPD-waarde maakt efficiente transpiratie mogelijk.',
            },
            trichomes: {
                term: 'Trichomen',
                definition:
                    'De kleine harsklieren op de bloemen en bladeren van cannabis die cannabinoiden en terpenen produceren. Hun kleur is een belangrijke indicator van rijpheid.',
            },
            topping: {
                term: 'Topping',
                definition:
                    'Een trainingstechniek waarbij de bovenste groeitop wordt afgeknipt om de groei van twee nieuwe hoofdtoppen te bevorderen, wat een meer struikvormige plant oplevert.',
            },
            fimming: {
                term: 'FIM (F*ck I Missed)',
                definition:
                    'Een techniek vergelijkbaar met topping, maar waarbij slechts een deel van de top wordt verwijderd, wat vaak resulteert in vier of meer nieuwe hoofdscheuten.',
            },
            lst: {
                term: 'LST (Low-Stress Training)',
                definition:
                    'Een trainingstechniek waarbij takken voorzichtig worden gebogen en vastgebonden, waardoor een breder, platter bladerdak ontstaat en de lichtblootstelling wordt gemaximaliseerd.',
            },
            lollipopping: {
                term: 'Lollipopping',
                definition:
                    'Het verwijderen van onderste bladeren en kleine scheuten die weinig licht krijgen om de energie van de plant op de bovenste, grotere bloemen te concentreren.',
            },
            scrog: {
                term: 'SCROG (Screen of Green)',
                definition:
                    'Een geavanceerde trainingstechniek waarbij een net of scherm over de planten wordt geplaatst om de scheuten horizontaal te leiden, waardoor een gelijkmatig en productief bladerdak ontstaat.',
            },
            sog: {
                term: 'SOG (Sea of Green)',
                definition:
                    'Een kweekmethode waarbij veel kleine planten dicht bij elkaar worden gekweekt en snel in bloei worden gezet voor een snelle en hoge opbrengst.',
            },
            curing: {
                term: 'Curing (Narijpen)',
                definition:
                    'Het proces van het bewaren van gedroogde cannabisbloemen in luchtdichte containers om chlorofyl af te breken en de smaak, het aroma en de zachtheid van de rook te verbeteren.',
            },
            nutrientLockout: {
                term: 'Voedingsblokkade',
                definition:
                    'Een toestand waarbij de plant beschikbare voedingsstoffen niet kan opnemen door een onjuiste pH in de wortelzone, zelfs als ze aanwezig zijn.',
            },
            flushing: {
                term: 'Spoelen (Flushing)',
                definition:
                    'Het uitsluitend gieten met zuiver, pH-aangepast water gedurende de laatste een tot twee weken voor de oogst om overtollige voedingszouten te verwijderen.',
            },
            phenotype: {
                term: 'Fenotype',
                definition:
                    'De waarneembare kenmerken van een plant (uiterlijk, geur, effect) die voortkomen uit de interactie van het genotype en de omgeving.',
            },
            genotype: {
                term: 'Genotype',
                definition:
                    'De genetische samenstelling van een plant, die het potentieel voor bepaalde eigenschappen bepaalt.',
            },
            landrace: {
                term: 'Landras',
                definition:
                    'Een pure, originele cannabisvarieteit die zich op natuurlijke wijze heeft aangepast en gestabiliseerd in een specifiek geografisch gebied over een lange periode.',
            },
        },
    },
    manual: {
        title: 'Gebruikershandleiding',
        toc: 'Ga naar Sectie',
        introduction: {
            title: 'Introductie en Filosofie',
            content: `Welkom bij CannaGuide 2025, je ultieme copiloot voor cannabisteelt. Deze handleiding begeleidt je door de geavanceerde functies van de app.<h4>Onze Kernprincipes:</h4><ul><li><strong>Offline First:</strong> 100% functionaliteit zonder internetverbinding. Acties worden in de wachtrij geplaatst en later gesynchroniseerd. Een drielaagse lokale AI-stack zorgt ervoor dat diagnostiek en advies beschikbaar blijven zelfs zonder netwerk.</li><li><strong>Prestatie-gericht:</strong> Een vloeiende UI dankzij het offloaden van complexe simulaties naar een Web Worker en ONNX-geoptimaliseerde inferentie met LRU-caching.</li><li><strong>Datasoevereiniteit:</strong> Volledige controle met backup, herstel en versleutelde one-tap cloud-sync via GitHub Gist. Geen server ziet ooit je data.</li><li><strong>Multi-Provider AI:</strong> Breng je eigen sleutel mee voor Google Gemini, OpenAI, Anthropic of xAI/Grok -- of gebruik de lokale AI-stack op het apparaat zonder API-sleutels.</li></ul>`,
        },
        general: {
            title: 'Platformbrede Functies',
            content: 'Functies die je ervaring in de hele app verbeteren.',
            pwa: {
                title: 'PWA en 100% Offline Functionaliteit',
                content:
                    'Installeer CannaGuide als een <strong>Progressive Web App</strong> voor een native app-ervaring. De robuuste Service Worker cached alle app-data, waardoor <strong>100% offline functionaliteit (exclusief live AI-verzoeken)</strong> is gegarandeerd.',
            },
            commandPalette: {
                title: 'Commandopalet (Cmd/Ctrl + K)',
                content:
                    'Druk op <code>Cmd/Ctrl + K</code> om het commandopalet te openen. Dit is de krachtige tool voor directe navigatie en acties zonder het toetsenbord te verlaten.',
            },
            voiceControl: {
                title: 'Spraakbesturing en Spraak',
                content:
                    'Bedien de app handsfree. Druk op de <strong>microfoonknop</strong> in de koptekst om te luisteren. Je kunt ook <strong>Tekst-naar-Spraak (TTS)</strong> inschakelen in Instellingen.',
            },
            dataManagement: {
                title: 'Datasoevereiniteit: Backup en Herstel',
                content:
                    'Onder <code>Instellingen > Gegevensbeheer</code> heb je volledige controle. Exporteer de volledige app-status als JSON-bestand voor <strong>backup</strong>. Importeer dit bestand om je status volledig te <strong>herstellen</strong> op elk apparaat.',
            },
            accessibility: {
                title: 'Verbeterde Toegankelijkheid',
                content:
                    'De app biedt uitgebreide toegankelijkheidsopties. Activeer een <strong>dyslexie-vriendelijk lettertype</strong>, een <strong>verminderde bewegingsmodus</strong>, diverse <strong>kleurenblindheidsfilters</strong> en <strong>Tekst-naar-Spraak (TTS)</strong>.',
            },
            localAi: {
                title: 'Lokale AI en Offline Modellen',
                content:
                    'CannaGuide bevat een <strong>drielaagse lokale AI-stack</strong>:<ol><li><strong>WebLLM</strong> -- GPU-versnelde inferentie via WebGPU (Qwen3-0.5B).</li><li><strong>Transformers.js</strong> -- ONNX-inferentie via WASM/WebGPU (Qwen2.5-1.5B-Instruct).</li><li><strong>Heuristische Regels</strong> -- Trefwoord- en VPD-gebaseerde analyse wanneer er geen model is geladen.</li></ol>Open <strong>Instellingen -> Algemeen en UI</strong> om modellen voor te laden.',
            },
            cloudSync: {
                title: 'One-Tap Cloud Sync',
                content:
                    'Maak een backup van je volledige app-status naar een <strong>privaat GitHub Gist</strong> met een enkele tik. Open <strong>Instellingen -> Gegevensbeheer</strong> en voer een GitHub Personal Access Token in met <code>gist</code> scope.',
            },
            multiProvider: {
                title: 'Multi-Provider AI (BYOK)',
                content:
                    'CannaGuide ondersteunt <strong>vier cloud AI-providers</strong> via een Bring-Your-Own-Key (BYOK) model: Google Gemini, OpenAI, Anthropic en xAI/Grok. Wissel van provider in <strong>Instellingen -> AI</strong>.',
            },
            dailyStrains: {
                title: 'Dagelijkse Catalogus Updates',
                content:
                    'De varieteitenbibliotheek wordt dagelijks automatisch vernieuwd om 04:20 UTC via een GitHub Actions workflow.',
            },
        },
        strains: {
            title: 'Varieteitenoverzicht',
            content:
                'Het hart van je cannabiskennisbank. Ontdek meer dan 700 varieteiten, voeg je eigen toe en gebruik krachtige analysetools.',
            library: {
                title: 'Bibliotheek (Alle/Mijn/Favorieten)',
                content:
                    'Wissel tussen de volledige bibliotheek, je eigen varieteiten en je favorieten. Gebruik de krachtige zoekfunctie en het geavanceerde filterpaneel.',
            },
            genealogy: {
                title: 'Genealogie Explorer',
                content:
                    'Visualiseer de genetische afstamming van elke varieteit. Gebruik de <strong>Analysetools</strong> om landrassen te markeren en Sativa/Indica-erfgoed te traceren.',
            },
            aiTips: {
                title: 'AI Kweektips',
                content:
                    'Genereer unieke, door AI aangedreven kweekadviezen voor elke varieteit op basis van je ervaringsniveau en doelen.',
            },
            exports: {
                title: 'Exports en Gegevensbeheer',
                content:
                    'Selecteer een of meer varieteiten en gebruik de exportknop om een PDF- of TXT-bestand te genereren.',
            },
        },
        plants: {
            title: 'Plantenoverzicht (De Kweekruimte)',
            content:
                'Je commandocentrum voor het beheren en simuleren van maximaal drie gelijktijdige kweken.',
            dashboard: {
                title: 'Dashboard en Tuinsignalen',
                content:
                    'Krijg een snel overzicht van de algehele gezondheid van je tuin. Gebruik de <strong>VPD-Meter</strong> om het transpiratiepotentieel te beoordelen.',
            },
            simulation: {
                title: 'Geavanceerde Simulatie',
                content:
                    'De app simuleert plantengroei in realtime op basis van wetenschappelijke principes zoals <strong>Dampdrukdeficit (VPD)</strong>.',
            },
            diagnostics: {
                title: 'AI Diagnostiek en Adviseur',
                content:
                    'Gebruik AI-tools om je planten gezond te houden. <strong>Fotodiagnose</strong> en <strong>Proactieve Adviseur</strong> op basis van realtime data.',
            },
            journal: {
                title: 'Uitgebreid Dagboek',
                content:
                    'Registreer elke actie -- van water geven en training tot plaagbestrijding en toevoegingen.',
            },
        },
        equipment: {
            title: 'Apparatuuroverzicht (De Werkplaats)',
            content:
                'Je gereedschapskist voor het plannen en optimaliseren van je kweekopstelling.',
            configurator: {
                title: 'AI Apparatuur Configurator',
                content:
                    'Beantwoord een paar eenvoudige vragen om een complete, merkspecifieke apparatuurlijst van de Gemini AI te ontvangen.',
            },
            calculators: {
                title: 'Precisiecalculators',
                content:
                    'Gebruik calculators voor <strong>Ventilatie</strong>, <strong>Verlichting (PPFD/DLI)</strong>, <strong>Elektriciteitskosten</strong>, <strong>Voedingsmix</strong> en meer.',
            },
            shops: {
                title: 'Grow Shops en Zaadbanken',
                content:
                    'Blader door samengestelde, regiospecifieke lijsten van aanbevolen Grow Shops en Zaadbanken.',
            },
        },
        knowledge: {
            title: 'Kennisoverzicht (De Bibliotheek)',
            content: 'Je centrale bron voor leren, experimenteren en het beheersen van de teelt.',
            mentor: {
                title: 'Contextbewuste AI Mentor',
                content:
                    'Stel kweetvragen aan de AI Mentor. Selecteer een van je actieve planten voor gepersonaliseerd advies.',
            },
            breeding: {
                title: 'Kweeklab',
                content:
                    'Kruis verzamelde zaden om een <strong>nieuwe permanente hybride varieteit</strong> te creeren die wordt toegevoegd aan je "Mijn Varieteiten" bibliotheek.',
            },
            sandbox: {
                title: 'Interactieve Sandbox',
                content:
                    'Voer risicovrije "wat als" scenario\'s uit. Kloon een actieve plant en voer een versnelde 14-daagse simulatie uit.',
            },
            guide: {
                title: 'Geintegreerde Kweekgids',
                content:
                    "Toegang tot een uitgebreide referentie inclusief deze Handleiding, een Kweker's Lexicon, visuele gidsen en een doorzoekbare FAQ.",
            },
        },
    },
}

export const visualGuides = {
    topping: {
        title: 'Topping',
        description:
            'Leer hoe je de top van je plant afknipt om struikachtige groei en meer hoofdtoppen te bevorderen.',
    },
    lst: {
        title: 'Low-Stress Training (LST)',
        description:
            'Buig en bind de takken van je plant om het bladerdak te openen en de lichtblootstelling te maximaliseren.',
    },
    defoliation: {
        title: 'Defoliatie',
        description:
            'Verwijder strategisch bladeren om de luchtstroom te verbeteren en meer licht bij de lagere bloemsites te laten komen.',
    },
    harvesting: {
        title: 'Oogsten',
        description:
            'Identificeer het perfecte moment om te oogsten voor maximale potentie en aroma van je toppen.',
    },
}

export const faq = {
    phValue: {
        question: 'Waarom is de pH-waarde zo belangrijk?',
        answer: 'De pH van je water en medium bepaalt hoe goed je plant voedingsstoffen kan opnemen. Een onjuiste pH leidt tot voedingsblokkade, zelfs als er genoeg voedingsstoffen aanwezig zijn. Voor aarde is het ideale bereik 6.0-6.8; voor hydro/kokos is het 5.5-6.5.',
    },
    yellowLeaves: {
        question: 'Wat betekenen gele bladeren?',
        answer: 'Gele bladeren (chlorose) kunnen vele oorzaken hebben. Als ze onderaan beginnen en naar boven bewegen, is het vaak een stikstoftekort. Vlekken kunnen wijzen op een calcium- of magnesiumtekort. Te veel of te weinig water geven kan ook gele bladeren veroorzaken. Controleer altijd eerst de pH en irrigatiegewoonten.',
    },
    whenToHarvest: {
        question: 'Wanneer weet ik dat het tijd is om te oogsten?',
        answer: 'De beste indicator zijn de trichomen (de kleine harskristallen op de toppen). Gebruik een vergrootglas. De oogst is optimaal wanneer de meeste trichomen melkwit zijn met een paar amberkleurige. Heldere trichomen zijn te vroeg; te veel amberkleurige geven een meer sedatief effect.',
    },
    lightDistanceSeedling: {
        question: 'Hoe ver moet mijn lamp van de zaailingen staan?',
        answer: 'Dit hangt sterk af van het lamptype en wattage. Een goede vuistregel voor de meeste LED-lampen is 45-60 cm afstand. Observeer je zaailingen goed. Als ze te veel strekken, is het licht te ver weg. Als de bladeren tekenen van verbranding vertonen, is het te dichtbij.',
    },
    whenToFeed: {
        question: 'Wanneer moet ik beginnen met voedingsstoffen geven?',
        answer: 'De meeste voorbemeste potgronden bevatten voldoende voedingsstoffen voor de eerste 2-3 weken. Begin bij zaailingen pas met een zeer verdunde voedingsoplossing (1/4 van de aanbevolen dosis) wanneer ze 3-4 paar echte bladeren hebben.',
    },
    npkMeaning: {
        question: 'Wat betekenen de N-P-K getallen op meststoffen?',
        answer: 'N-P-K staat voor Stikstof (N), Fosfor (P) en Kalium (K). Dit zijn de drie primaire macronutrienten die je plant nodig heeft. <ul><li><strong>N (Stikstof):</strong> Cruciaal voor vegetatieve groei.</li><li><strong>P (Fosfor):</strong> Essentieel voor wortelontwikkeling en bloemproductie.</li><li><strong>K (Kalium):</strong> Belangrijk voor algehele plantgezondheid en bloeidichtheid.</li></ul>',
    },
    calmagUsage: {
        question: 'Wanneer en waarom Cal-Mag gebruiken?',
        answer: 'Cal-Mag is belangrijk bij gebruik van gefilterd water (zoals omgekeerde osmose) of bij het kweken in kokosvezel, die calcium bindt. Tekorten verschijnen vaak als kleine roestkleurige vlekken op de bladeren.',
    },
    flushingPlants: {
        question: 'Wat is "flushing" en moet ik het doen?',
        answer: 'Flushing is de praktijk van uitsluitend gieten met zuiver, pH-aangepast water gedurende de laatste 1-2 weken voor de oogst. Bij organische teelt in aarde is het vaak niet nodig, maar het is gangbaar bij hydro- of kokossystemen.',
    },
    vpdImportance: {
        question: 'Wat is VPD en waarom is het belangrijk?',
        answer: 'VPD (Dampdrukdeficit) combineert temperatuur en vochtigheid om de "dorst" van de lucht te beschrijven. Een optimaal VPD stelt de plant in staat om efficient te transpireren. Te hoog VPD betekent te droge lucht. Te laag VPD betekent te vochtige lucht met schimmelrisico.',
    },
    idealTempHumidity: {
        question: 'Wat zijn de ideale temperatuur- en vochtigheidsniveaus?',
        answer: 'Hangt af van het stadium:<ul><li><strong>Zaailingen:</strong> 22-26 graden C, 70-80% RV</li><li><strong>Vegetatief:</strong> 22-28 graden C, 50-70% RV</li><li><strong>Bloei:</strong> 20-26 graden C, 40-50% RV</li><li><strong>Late Bloei:</strong> 18-24 graden C, 30-40% RV</li></ul>',
    },
    airCirculation: {
        question: 'Hoe belangrijk is luchtcirculatie?',
        answer: 'Extreem belangrijk. Een of meer oscillerende ventilatoren houden de lucht in beweging. Dit versterkt stengels, voorkomt vochtige "zakken" rond bladeren en vermindert het risico op schimmel en plagen aanzienlijk.',
    },
    nutrientBurn: {
        question: 'Wat is voedingsverbranding?',
        answer: 'Voedingsverbranding verschijnt als donkergroene bladeren met verbrande, gele of bruine punten die vaak omhoog krullen. De oplossing is de voedingsconcentratie (EC) verlagen en/of het medium spoelen met pH-aangepast water.',
    },
    spiderMites: {
        question: 'Hoe herken en bestrijd ik spintmijten?',
        answer: 'Spintmijten zijn kleine plaagdieren aan de onderkant van bladeren. Vroege tekenen zijn kleine witte of gele stippen. Bij ernstige besmetting zie je fijne webben. Neemolie of insecticide zeep kan helpen. Preventie: schone omgeving en vochtigheid niet te laag.',
    },
    stretchingCauses: {
        question: 'Waarom strekt mijn plant zo veel?',
        answer: 'Overmatig strekken wordt bijna altijd veroorzaakt door onvoldoende licht. De plant "reikt" naar de lichtbron. Breng je lamp dichterbij of gebruik een krachtigere. Sommige Sativa-varieteiten zijn ook genetisch geneigd tot strekken.',
    },
    toppingVsFimming: {
        question: 'Wat is het verschil tussen Topping en FIMming?',
        answer: 'Beide zijn "high-stress training" technieken. Bij <strong>Topping</strong> knip je de top netjes af, wat twee nieuwe hoofdscheuten oplevert. Bij <strong>FIMming</strong> verwijder je de top gedeeltelijk, wat potentieel vier of meer nieuwe scheuten kan opleveren.',
    },
    whatIsScrog: {
        question: 'Wat is een SCROG?',
        answer: 'SCROG staat voor "Screen of Green". Een geavanceerde techniek waarbij een net horizontaal over de planten wordt geplaatst. Scheuten worden onder het net geleid om een breed, plat en gelijkmatig bladerdak te creeren dat de opbrengst maximaliseert.',
    },
    whatIsLollipopping: {
        question: 'Wat betekent "lollipopping"?',
        answer: '"Lollipopping" is het verwijderen van alle onderste bladeren en kleine scheuten in de schaduw. Dit concentreert alle energie op de bovenste bloemen, wat grotere en dichtere hoofdtoppen oplevert.',
    },
    dryingDuration: {
        question: 'Hoe lang moet ik mijn oogst drogen?',
        answer: 'Drogen duurt meestal 7-14 dagen. Het doel is langzaam en gecontroleerd drogen in een donkere, koele ruimte op circa 18-20 graden C en 55-60% vochtigheid. De "steeltest": als de kleinere stelen knappen in plaats van buigen, zijn de toppen klaar voor curing.',
    },
    curingImportance: {
        question: 'Waarom is curing zo belangrijk?',
        answer: 'Curing is cruciaal voor de eindkwaliteit. Tijdens dit proces in luchtdichte potten breken bacterien chlorofyl af. Dit levert een veel zachtere rook op en laat het complexe terpenenprofiel (aroma en smaak) volledig ontwikkelen. Goed curen maakt het verschil tussen middelmatige en top-kwaliteit cannabis.',
    },
    storageHarvest: {
        question: 'Hoe bewaar ik mijn afgewerkte oogst?',
        answer: 'Na curing bewaar je toppen in luchtdichte glazen potten op een koele, donkere plek. Ideale opslagtemperatuur is onder 21 graden C. Vochtigheidspakjes (bijv. 62% RV) in de potten helpen het perfecte vochtigheidsniveau te handhaven.',
    },
    autoflowerVsPhotoperiod: {
        question: 'Autoflower vs. Fotoperiode: wat is het verschil?',
        answer: '<strong>Fotoperiode</strong>-planten vereisen een wijziging in de lichtcyclus (12u licht / 12u donker) om te gaan bloeien. <strong>Autoflowers</strong> bloeien automatisch na een bepaalde tijd, ongeacht de lichtcyclus. Sneller klaar en kleiner, vaak makkelijker voor beginners, maar de opbrengst is meestal lager.',
    },
    howOftenToWater: {
        question: 'Hoe vaak moet ik water geven?',
        answer: 'Er is geen vast schema. De beste methode is de pot optillen en het gewicht voelen. Geef royaal water tot er drainage is, en wacht dan tot de pot merkbaar lichter is. Steek ook je vinger 2-3 cm in de aarde; als die droog eruit komt, is het waarschijnlijk tijd om water te geven.',
    },
    potSize: {
        question: 'Welke potmaat moet ik gebruiken?',
        answer: '<ul><li><strong>Autoflowers:</strong> 10-15 liter potten (ideaal, ze worden niet graag verplant).</li><li><strong>Fotoperiode:</strong> Begin in kleine potten (1-3 liter) en verplant 1-2 keer naar 15-25 liter voor de eindfase.</li></ul>',
    },
    localAiFallback: {
        question: 'Wat gebeurt er als Gemini niet beschikbaar is?',
        answer: 'CannaGuide schakelt automatisch over naar de lokale AI-stack. De app gebruikt heuristische plantenanalyse zodat diagnostiek en advies beschikbaar blijven.',
    },
    localAiPreload: {
        question: 'Hoe gebruik ik Lokale AI offline?',
        answer: 'Open Instellingen -> Algemeen en UI en druk op <strong>Offline Modellen Voorladen</strong> terwijl je online bent.',
    },
    localAiStorage: {
        question: 'Hoeveel opslag hebben de lokale modellen nodig?',
        answer: 'Reken op enkele honderden megabytes browseropslag. Gebruik een apparaat met voldoende vrije ruimte en persistente opslag ingeschakeld.',
    },
    localAiWebGpu: {
        question: 'Heb ik WebGPU nodig?',
        answer: 'Nee. WebGPU maakt het WebLLM-runtime mogelijk, maar de app valt automatisch terug op Transformer.js als WebGPU niet beschikbaar is.',
    },
    localAiTroubleshooting: {
        question: 'Wat moet ik doen als het voorladen van offline modellen mislukt?',
        answer: 'Probeer opnieuw met een stabiele verbinding, controleer of de browseropslag niet vol is en bevestig dat het apparaat toestemming heeft voor persistente opslag.',
    },
    localAiSemanticRag: {
        question: 'Wat is Semantische RAG?',
        answer: 'Semantische RAG gebruikt een lokaal embeddingmodel (MiniLM) om de meest relevante kweeklogboekentries te vinden op basis van betekenis -- niet alleen trefwoorden.',
    },
    localAiSentiment: {
        question: 'Wat doet sentimentanalyse van het dagboek?',
        answer: 'Het lokale sentimentmodel analyseert de emotionele toon van je dagboekentries om patronen in de tijd te detecteren.',
    },
    localAiSummarization: {
        question: 'Hoe werkt lokale tekstsamenvatting?',
        answer: 'Het samenvattingsmodel condenseert lange kweeklogboeken en mentorchatgeschiedenissen tot beknopte samenvattingen.',
    },
    localAiQueryRouting: {
        question: 'Wat is slimme queryrouting?',
        answer: 'Het zero-shot classificatiemodel categoriseert automatisch je vragen voor relevantere antwoorden -- zelfs zonder internetverbinding.',
    },
    localAiPersistentCache: {
        question: 'Wat is de persistente inferentiecache?',
        answer: 'AI-antwoorden worden opgeslagen in IndexedDB zodat identieke vragen direct worden beantwoord -- zelfs na herladen. De cache bevat maximaal 256 entries.',
    },
    localAiTelemetry: {
        question: 'Wat meet lokale AI-telemetrie?',
        answer: "Telemetrie meet inferentiesnelheid, tokendoorvoer en cache-hitratio's -- alles lokaal op je apparaat. Geen data verlaat ooit de browser.",
    },
    cloudSync: {
        question: 'Hoe werkt One-Tap Cloud Sync?',
        answer: 'CannaGuide maakt een backup van je volledige app-status naar een <strong>privaat GitHub Gist</strong>. Open Instellingen -> Gegevensbeheer, voeg een GitHub Personal Access Token met <code>gist</code> scope toe en tik op Sync.',
    },
    multiProviderAi: {
        question: 'Kan ik een andere AI-provider gebruiken?',
        answer: 'Ja. CannaGuide ondersteunt <strong>Google Gemini, OpenAI, Anthropic en xAI/Grok</strong> via een BYOK-model. Wissel in Instellingen -> AI. Alle API-sleutels zijn versleuteld met AES-256-GCM.',
    },
    forceWasm: {
        question: 'Wat doet de Force WASM toggle?',
        answer: 'Het vergrendelt de Lokale AI-inferentie backend naar WASM, zelfs wanneer WebGPU wordt gedetecteerd. Gebruik het wanneer WebGPU crashes veroorzaakt.',
    },
    visionClassification: {
        question: 'Hoe werkt plantdiagnose per foto offline?',
        answer: 'De app gebruikt een CLIP-ViT-L-14 visiemodel dat 33 cannabisspecifieke labels herkent. Het model draait volledig in de browser via ONNX en stuurt geen afbeeldingen naar een server.',
    },
}
