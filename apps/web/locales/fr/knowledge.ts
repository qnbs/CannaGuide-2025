export const knowledgeView = {
    title: 'Centre de Connaissances',
    subtitle: 'Votre guide interactif pour une culture reussie.',
    tabs: {
        mentor: 'Mentor IA',
        guide: 'Guide de Culture',
        archive: 'Archives du Mentor',
        breeding: 'Laboratoire de Croisement',
        sandbox: 'Sandbox',
        growTech: 'Grow Tech 2026',
        lexikon: 'Lexique',
        atlas: 'Atlas des Maladies',
        rechner: 'Calculateur',
        lernpfad: "Parcours d'Apprentissage",
        analytik: 'Analytique',
        navLabel: 'Sections de connaissances',
    },
    hub: {
        selectPlant: 'Selectionner une Plante',
        noPlants:
            'Pas de plantes actives pour des conseils contextuels. Commencez une culture pour debuter !',
        todaysFocus: 'Focus du Jour pour {{plantName}}',
    },
    aiMentor: {
        title: 'Mentor IA',
        plantContext: 'Discussion avec le Mentor IA dans le contexte de {{name}}',
        plantContextSubtitle:
            'Selectionnez une plante pour poser des questions contextuelles et obtenir des conseils.',
        startChat: 'Demarrer le Chat',
        inputPlaceholder: 'Demandez au mentor...',
        clearChat: 'Effacer le Chat',
        clearConfirm: "Etes-vous sur de vouloir effacer l'historique du chat pour cette plante ?",
    },
    archive: {
        title: 'Archives du Mentor',
        empty: "Vous n'avez pas encore archive de reponses du mentor.",
        saveButton: 'Sauvegarder dans les Archives',
        saveSuccess: 'Reponse sauvegardee dans les archives !',
        queryLabel: 'Votre Question',
        editTitle: 'Modifier la Reponse',
    },
    breeding: {
        title: 'Laboratoire de Croisement',
        description:
            'Croisez vos graines collectees pour creer de nouvelles varietes uniques aux caracteristiques combinees.',
        collectedSeeds: 'Graines Collectees',
        noSeeds: 'Collectez des graines de plantes pretes a recolter pour commencer le croisement.',
        parentA: 'Parent A',
        parentB: 'Parent B',
        clearParent: 'Effacer {{title}}',
        selectSeed: 'Selectionner une graine',
        dropSeed: 'Deposez la graine ici',
        breedButton: 'Croiser Nouvelle Variete',
        resultsTitle: 'Resultat du Croisement',
        newStrainName: 'Nom de la Nouvelle Variete',
        potentialTraits: 'Traits Potentiels',
        saveStrain: 'Sauvegarder la Variete',
        breedingSuccess: '"{{name}}" croisee avec succes ! Elle a ete ajoutee a "Mes Varietes".',
        splicingGenes: 'Epissage des genes...',
        flowering: 'Floraison',
        phenoTracking: 'Suivi Phenotypique',
        vigor: 'Vigueur',
        resin: 'Resine',
        aroma: 'Arome',
        diseaseResistance: 'Resistance aux Maladies',
        automatedGenetics: 'Estimation Genetique Automatisee',
        stabilityScore: 'Score de Stabilite',
        arTitle: 'Apercu de Croisement AR',
        arSupported: 'WebXR pret',
        arFallback: 'Repli 3D',
        arPreviewLabel: 'Apercu tridimensionnel du croisement',
        arLoading: "Chargement de l'apercu AR...",
        webglUnavailableTitle: 'Apercu 3D indisponible',
        webglUnavailableDescription:
            "Votre navigateur n'a pas pu creer un contexte WebGL, cet apercu s'affiche en repli statique.",
        webglUnavailableHint:
            "Activez l'acceleration materielle ou passez a un profil de navigateur avec GPU pour restaurer l'apercu en direct.",
    },
    scenarios: {
        toppingVsLst: {
            title: "Lancer l'Experience Topping vs. LST",
            description:
                'Simule une periode de croissance de 14 jours comparant une plante recevant du LST a une qui a ete etee.',
        },
        tempPlus2c: {
            title: "Lancer l'Experience Temperature +2\u00b0C",
            description:
                'Simule une periode de croissance de 14 jours comparant les conditions de base a une augmentation de +2\u00b0C de la temperature de la canopee.',
        },
    },
    knowledgebase: {
        'phase1-prep': {
            title: 'Phase 1 : Preparation et Equipement',
            content: `<h3>Bienvenue dans la Culture !</h3><p>Une recolte reussie commence par une preparation solide.</p>
                      <strong>La Proprete est Essentielle :</strong> Nettoyez et desinfectez soigneusement tout votre espace de culture.<br>
                      <strong>Verification de l'Equipement :</strong>
                      <ul>
                        <li><strong>Lumiere :</strong> Testez votre lampe et minuterie.</li>
                        <li><strong>Ventilation :</strong> Assurez-vous que votre extracteur et ventilateurs fonctionnent correctement.</li>
                        <li><strong>Substrat et Pots :</strong> Humidifiez legerement le substrat avant la plantation.</li>
                      </ul>
                      <strong>Calibration :</strong> Visez <strong>22-25\u00b0C</strong> et <strong>65-75% d'humidite relative</strong>.`,
        },
        'phase2-seedling': {
            title: 'Phase 2 : Germination et Plantule',
            content: `<h3>Les Premieres Semaines de Vie</h3><p>C'est la phase la plus delicate. La devise est : moins c'est plus.</p>
                      <strong>Germination :</strong> Gardez le substrat humide mais jamais trempe.<br>
                      <strong>Lumiere :</strong> Les plantules n'ont pas besoin de lumiere intense. Cycle 18/6 standard.<br>
                      <strong>Eau :</strong> Arrosez avec parcimonie autour de la tige.<br>
                      <strong>Nutriments :</strong> Pas de nutriments ! La plupart des substrats suffisent pour les 2-3 premieres semaines.`,
        },
        'phase3-vegetative': {
            title: 'Phase 3 : Croissance Vegetative',
            content: `<h3>C'est l'Heure de Grandir !</h3><p>La plante developpe sa structure de feuilles, branches et racines.</p>
                      <strong>Lumiere :</strong> Augmentez progressivement l'intensite. Cycle 18/6.<br>
                      <strong>Nutriments :</strong> Augmentez lentement la concentration. L'Azote (N) est crucial.<br>
                      <strong>Entrainement :</strong> Commencez le <strong>LST</strong> ou le <strong>Topping</strong>.<br>
                      <strong>Environnement :</strong> L'humidite ideale descend a 50-70%.`,
        },
        'phase4-flowering': {
            title: 'Phase 4 : Floraison',
            content: `<h3>La Floraison Commence</h3><p>La phase la plus excitante ou votre plante produit des fleurs.</p>
                      <strong>Cycle Lumineux :</strong> Passez a <strong>12 heures de lumiere et 12 heures d'obscurite ininterrompue</strong>.<br>
                      <strong>L'Etirement :</strong> La plante peut doubler ou tripler de taille dans les 2-3 premieres semaines.<br>
                      <strong>Nutriments :</strong> Passez a un engrais de floraison (moins de N, plus de P et K).<br>
                      <strong>Humidite :</strong> Reduisez progressivement a <strong>40-50%</strong>.`,
        },
        'phase5-harvest': {
            title: 'Phase 5 : Recolte, Sechage et Affinage',
            content: `<h3>Les Touches Finales</h3><p>La patience dans cette phase finale fait toute la difference.</p>
                      <strong>Moment de Recolte :</strong> Le meilleur indicateur est la couleur des trichomes. Recoltez quand ils sont laiteux/nuageux.<br>
                      <strong>Sechage :</strong> Suspendez les branches a l'envers. <strong>18-20\u00b0C</strong> et <strong>55-60% d'humidite</strong>. 7-14 jours.<br>
                      <strong>Affinage :</strong> Placez les fleurs dans des bocaux hermetiques. Ouvrez quotidiennement 5-10 minutes la premiere semaine.`,
        },
        'fix-overwatering': {
            title: 'Depannage : Arrosage Excessif',
            content: `<h3>Ma Plante se Noie !</h3><p>L'arrosage excessif est l'erreur numero 1 des debutants.</p>
                      <strong>Symptomes :</strong> La plante semble tombante et triste. Les feuilles se recourbent vers le bas.<br>
                      <strong>Actions :</strong>
                      <ul>
                        <li><strong>Arretez d'arroser</strong> jusqu'a ce que le pot soit plus leger.</li>
                        <li><strong>Ameliorez la circulation d'air</strong> pres du substrat.</li>
                        <li><strong>Verifiez le drainage</strong> du pot.</li>
                      </ul>`,
        },
        'fix-calcium-deficiency': {
            title: 'Depannage : Carence en Calcium',
            content: `<h3>Corriger une Carence en Calcium</h3><p>Le calcium est un nutriment immobile.</p>
                      <strong>Symptomes :</strong> Petites taches brun-rouille sur les feuilles. Croissance nouvelle deformee.<br>
                      <strong>Causes :</strong> pH incorrect, eau RO/distillee, substrat coco.<br>
                      <strong>Solution :</strong> Corrigez le pH. Utilisez un supplement Cal-Mag.`,
        },
        'fix-nutrient-burn': {
            title: 'Depannage : Brulure de Nutriments',
            content: `<h3>Corriger une Brulure de Nutriments</h3><p>Survient quand la plante recoit trop de nutriments.</p>
                      <strong>Symptomes :</strong> Les pointes des feuilles deviennent jaunes, puis brunes et croustillantes.<br>
                      <strong>Solution :</strong>
                      <ol>
                        <li><strong>Rincez le substrat</strong> avec de l'eau pure ajustee en pH.</li>
                        <li><strong>Reduisez la concentration</strong> pour le prochain apport.</li>
                      </ol>`,
        },
        'fix-pests': {
            title: 'Depannage : Parasites Courants',
            content: `<h3>Gerer les Visiteurs Indesirables</h3><p>La detection precoce est la cle.</p>
                      <strong>Acariens :</strong> Petits points blancs ou jaunes sur les feuilles. Solution : huile de neem ou savon insecticide.<br>
                      <strong>Moucherons du Terreau :</strong> Petites mouches noires pres du substrat. Solution : laissez secher la couche superieure. Utilisez des pieges collants jaunes.`,
        },
        'concept-training': {
            title: 'Concept Cle : Entrainement des Plantes',
            content: `<h3>Pourquoi Entrainer Vos Plantes ?</h3><p>L'entrainement manipule la croissance pour une structure plus efficace.</p>
                      <strong>Types Principaux :</strong>
                      <ul>
                        <li><strong>LST :</strong> Plier et attacher doucement les branches.</li>
                        <li><strong>HST :</strong> Techniques comme le <strong>Topping</strong> ou le <strong>Super Cropping</strong>.</li>
                      </ul>
                      <strong>Resultat :</strong> Plusieurs grosses tetes denses au lieu d'une seule tete principale.`,
        },
        'concept-environment': {
            title: "Concept Cle : L'Environnement",
            content: `<h3>Maitriser Votre Espace de Culture</h3><p>Les trois piliers : Temperature, Humidite et Circulation d'Air.</p>
                      <strong>Temperature et Humidite :</strong> Liees et mesurees par le <strong>VPD</strong>.
                      <ul>
                        <li><strong>Plantule/Veg :</strong> 22-28\u00b0C et 50-70% d'humidite.</li>
                        <li><strong>Floraison :</strong> 20-26\u00b0C et 40-50% d'humidite.</li>
                      </ul>
                      <strong>Circulation :</strong>
                      <ul>
                        <li><strong>Extracteur :</strong> Evacue l'air chaud et humide en continu.</li>
                        <li><strong>Ventilateurs :</strong> Creent une brise legere dans la tente.</li>
                      </ul>`,
        },
    },
    sandbox: {
        title: 'Sandbox Experimental',
        experimentOn: 'Experimenter sur {{name}}',
        scenarioDescription: 'Compare {{actionA}} vs. {{actionB}} sur {{duration}} jours.',
        runningSimulation: 'Simulation acceleree en cours...',
        startExperiment: 'Nouvelle Experience',
        modal: {
            title: 'Demarrer une Nouvelle Experience',
            description:
                'Selectionnez une plante pour lancer une simulation "Topping vs. LST" de 14 jours.',
            runScenario: 'Lancer le Scenario',
            noPlants: "Vous devez d'abord cultiver une plante pour lancer une experience.",
        },
        savedExperiments: 'Experiences Sauvegardees',
        noExperiments: 'Aucune experience sauvegardee.',
        basedOn: 'Base sur : {{name}}',
        run: 'Execution : {{date}}',
    },
    guide: {
        phases: 'Phases',
        coreConcepts: 'Concepts Cles',
        troubleshooting: 'Depannage',
        growTech: 'Grow Tech 2026',
        genetics: 'Genetique',
        searchPlaceholder: 'Rechercher des guides...',
        noResults: 'Aucun article trouve pour "{{term}}"',
        readProgress: '{{read}} sur {{total}} articles lus',
    },
    growLog: {
        title: 'Grow-Log RAG',
        description:
            "Interrogez directement votre journal. Les entrees pertinentes sont chargees d'abord, puis analysees par l'IA.",
        placeholder: 'P. ex., Pourquoi mon VPD fluctue-t-il en semaine 4 ?',
        analyzing: 'Analyse en cours...',
        startAnalysis: "Lancer l'Analyse RAG",
        activeCorpus: 'Plantes actives dans le corpus RAG : {{count}}',
    },
    lexikon: {
        searchPlaceholder: 'Rechercher des termes...',
        filterLabel: 'Filtrer par categorie',
        all: 'Tous',
        categories: {
            cannabinoid: 'Cannabinoides',
            terpene: 'Terpenes',
            flavonoid: 'Flavonoides',
            nutrient: 'Nutriments',
            disease: 'Maladies',
            general: 'General',
        },
        noResults: 'Aucun resultat pour "{{term}}"',
        resultCount: '{{count}} sur {{total}} termes',
        totalCount: '{{count}} termes',
        noDefinition: 'Aucune definition disponible.',
    },
    atlas: {
        searchPlaceholder: 'Rechercher des diagnostics...',
        allCategories: 'Toutes les categories',
        allUrgencies: 'Toutes les urgences',
        noResults: 'Aucune entree trouvee.',
        filterByCategory: 'Filtrer par categorie',
        filterByUrgency: 'Filtrer par urgence',
        entryCount: '{{count}} entrees',
        close: 'Fermer',
        category: {
            deficiency: 'Carence',
            toxicity: 'Toxicite',
            environmental: 'Environnemental',
            pest: 'Ravageurs',
            disease: 'Maladie',
        },
        severity: {
            low: 'Faible',
            medium: 'Moyen',
            high: 'Eleve',
            critical: 'Critique',
        },
        urgency: {
            monitor: 'Surveiller',
            act_soon: 'Agir bientot',
            act_immediately: 'Agir immediatement',
        },
        detail: {
            symptoms: 'Symptomes',
            causes: 'Causes',
            treatment: 'Traitement',
            prevention: 'Prevention',
            relatedTerms: 'Termes associes',
        },
        diseases: {
            'nitrogen-deficiency': {
                name: 'Carence en Azote',
                symptoms:
                    'Le jaunissement commence sur les feuilles inferieures plus vieilles et progresse vers le haut. Les feuilles virent au jaune pale puis completement jaune. Croissance ralentie.',
                causes: "Arrosage excessif, pH bas (bloque l'N), azote insuffisant dans la solution nutritive, dommages aux racines.",
                treatment:
                    "Rincer le substrat avec de l'eau ajustee au pH correct, puis nourrir avec une solution riche en azote. Corriger le pH a 6,0-7,0 (terre) ou 5,5-6,5 (hydro).",
                prevention:
                    "Surveiller le pH en permanence, utiliser des nutriments equilibres, eviter l'arrosage excessif.",
            },
            'phosphorus-deficiency': {
                name: 'Carence en Phosphore',
                symptoms:
                    "Decoloration violette ou rougeatre sur la face inferieure des feuilles et des tiges. Feuilles vert fonce pouvant s'enrouler vers le bas. Croissance lente.",
                causes: 'pH bas (en dessous de 6,0 en terre), basses temperatures dans la zone racinaire (sous 15 C), peu de phosphore dans la solution.',
                treatment:
                    'Augmenter le pH si necessaire, elever la temperature de la salle, supplementer avec un nutriment de floraison riche en phosphore.',
                prevention:
                    'Maintenir la zone racinaire au-dessus de 18 C, conserver le pH correct, utiliser des nutriments de floraison au debut de la phase florale.',
            },
            'potassium-deficiency': {
                name: 'Carence en Potassium',
                symptoms:
                    'Bords et pointes de feuilles bruns et croustillants, debutant sur les feuilles les plus vieilles. Jaunissement entre les nervures. Tiges faibles.',
                causes: "pH eleve (bloque le K), exces de calcium ou de magnesium en competition d'absorption, peu de potassium dans la solution.",
                treatment:
                    'Verifier et corriger le pH, reduire les nutriments en competition si excessifs, supplementer en potassium.',
                prevention:
                    'Utiliser une formule nutritive complete avec potassium adequat, surtout en fin de floraison.',
            },
            'calcium-deficiency': {
                name: 'Carence en Calcium',
                symptoms:
                    'Petites taches brunes ou rouille sur les nouvelles feuilles. Nouvelle croissance tordue ou frippee. Tiges faibles.',
                causes: "pH bas reduisant la disponibilite du calcium, utilisation d'eau osmosee/distillee sans remineralisation, coco sans pre-buffering.",
                treatment:
                    'Corriger le pH a 6,2-7,0, ajouter un supplement Cal-Mag, pre-buffer le coco avant utilisation.',
                prevention:
                    "Pre-buffer le coco, utiliser Cal-Mag avec l'eau osmosee, maintenir le pH correct.",
            },
            'magnesium-deficiency': {
                name: 'Carence en Magnesium',
                symptoms:
                    "Jaunissement entre les nervures (chlorose internervaire) sur les feuilles intermediaires a vieilles tandis que les nervures restent vertes. Les feuilles peuvent s'enrouler vers le haut.",
                causes: "pH bas, potassium eleve en competition avec l'absorption de magnesium, magnesium insuffisant dans la solution.",
                treatment:
                    "Corriger le pH, reduire le potassium si excessif, ajouter Cal-Mag ou sel d'Epsom (MgSO4) -- 1 c. a c./litre en pulverisation foliaire pour des resultats rapides.",
                prevention:
                    'Utiliser une formule nutritive equilibree, inclure un supplement Cal-Mag, maintenir le pH correct.',
            },
            'iron-deficiency': {
                name: 'Carence en Fer',
                symptoms:
                    'Feuilles de couleur jaune vif (chlorotiques) sur la toute nouvelle croissance, les nervures restant vertes. Schema classique de chlorose internervaire.',
                causes: "pH eleve (cause la plus frequente, notamment au-dessus de 7,0), racines gorgees d'eau, exces de phosphore ou de manganese en competition.",
                treatment:
                    'Abaisser le pH a 6,0-6,5, ameliorer le drainage, utiliser un supplement de fer chelate.',
                prevention:
                    'Maintenir le pH correct, eviter le sur-arrosage, utiliser un pack de micronutriments chelates.',
            },
            'zinc-deficiency': {
                name: 'Carence en Zinc',
                symptoms:
                    'Jaunissement du tissu foliaire neuf entre les nervures. Les feuilles peuvent apparaitre tachetees ou distordues. Espacement internodal court.',
                causes: "pH eleve, exces de phosphore inhibant l'absorption du zinc, peu de zinc dans le substrat ou la solution.",
                treatment:
                    'Corriger le pH a la plage optimale, reduire le phosphore si excessif, supplementer en zinc.',
                prevention:
                    'Utiliser une formule complete de micronutriments, maintenir le pH correct.',
            },
            'sulfur-deficiency': {
                name: 'Carence en Soufre',
                symptoms:
                    'Les nouvelles feuilles virent uniformement au jaune pale au blanc. Contrairement a la carence en azote, elle commence sur le jeune/nouveau feuillage.',
                causes: 'Peu de soufre dans la solution nutritive, pH tres eleve, plantes recemment transplantees ou rincees.',
                treatment:
                    'Ajouter un nutriment contenant du soufre (de nombreux nutriments de base en contiennent), verifier le pH.',
                prevention: 'Utiliser une formule nutritive complete, eviter les pH extremes.',
            },
            'nutrient-burn': {
                name: 'Brulure par Nutriments (Toxicite)',
                symptoms:
                    "Les pointes des feuilles brunissent et deviennent croustillantes, puis progressent vers l'interieur. Les pointes peuvent s'enrouler vers le haut. Coloration vert fonce brillant.",
                causes: 'EC/PPM de la solution nutritive trop eleve, fertilisation trop frequente, terre tres enrichie.',
                treatment:
                    'Rincer le substrat avec 3 fois le volume du pot en eau adjustee au pH. Reduire la prochaine fertilisation a 50% de concentration.',
                prevention:
                    'Commencer avec des doses faibles de nutriments, augmenter progressivement, mesurer EC/PPM regulierement.',
            },
            'nitrogen-toxicity': {
                name: "Toxicite a l'Azote",
                symptoms:
                    'Feuilles vert fonce brillant. Les pointes peuvent s\'enrouler vers le bas (la "griffe"). Croissance foliaire excessive, densite de fleurs reduite.',
                causes: "Trop d'azote, notamment pendant la floraison quand la demande en N diminue.",
                treatment:
                    "Arreter la fertilisation azotee, rincer avec de l'eau ajustee au pH, passer aux nutriments de floraison.",
                prevention:
                    "Reduire l'azote lors du passage a la floraison, utiliser des nutriments specifiques a la floraison.",
            },
            overwatering: {
                name: 'Sur-Arrosage',
                symptoms:
                    "Toute la plante s'affaisse. Les feuilles semblent fermes mais pendent avec une courbe arrondie. La terre reste humide pendant de nombreux jours. Jaunissement.",
                causes: 'Arrosage trop frequent, mauvais drainage, pots sans trous, substrat trop dense.',
                treatment:
                    "Arreter completement l'arrosage jusqu'a ce que le pot soit tres leger. Ameliorer l'aeration autour du pot. Envisager un rempotage dans un melange mieux drainant.",
                prevention:
                    'Soulever les pots pour sentir le poids -- arroser seulement quand notablement plus legers. Utiliser des recipients avec de bons trous de drainage. Laisser le substrat secher partiellement.',
            },
            underwatering: {
                name: 'Sous-Arrosage',
                symptoms:
                    "Toute la plante se fane et s'affaisse. Les feuilles semblent fines et comme du papier avec une legere courbe vers l'interieur. Le pot est tres leger.",
                causes: 'Arrosage trop peu frequent, climat sec, substrat a drainage rapide, grande plante dans un petit pot.',
                treatment:
                    "Arroser abondamment jusqu'a ce que le drainage sorte par le bas. La plante devrait se remettre en quelques heures.",
                prevention:
                    'Verifier regulierement le poids du pot. Arroser quand la premiere couche du substrat est seche.',
            },
            'heat-stress': {
                name: 'Stress Thermique',
                symptoms:
                    'Les bords et pointes des feuilles se recourbent vers le haut comme des tacos. Taches blanchies ou brulees la ou les feuilles sont les plus proches de la lumiere. Fanaison malgre un arrosage adequat.',
                causes: 'Temperature de la salle au-dessus de 30 C, lumieres trop pres de la canopee, mauvaise ventilation, points chauds.',
                treatment:
                    'Ameliorer la ventilation, surtoiser les lumieres, ajouter la climatisation. Pulveriser les feuilles a court terme.',
                prevention:
                    "Maintenir la temperature de la canopee en dessous de 28 C. Assurer un flux d'air adequat au-dessus de la canopee.",
            },
            'light-burn': {
                name: 'Brulure par la Lumiere',
                symptoms:
                    'Taches blanches ou jaunes blanchies sur les feuilles superieures les plus proches de la lumiere. Les feuilles directement sous la lumiere paraissent blanchies malgre des nutriments adequats.',
                causes: 'Lampe de culture trop pres de la canopee, intensite lumineuse excessive (PPFD trop eleve).',
                treatment:
                    'Surtoiser la lampe immediatement. Les zones blanchies ne se recupereront pas, mais la nouvelle croissance sera saine.',
                prevention:
                    'Respecter les distances minimales de suspension recommandees par le fabricant, surveiller le PPFD.',
            },
            'ph-lockout': {
                name: 'Blocage de pH',
                symptoms:
                    'Multiples symptomes de carence apparaissant simultanement malgre des nutriments adequats. La plante semble generalement malade.',
                causes: "Le pH de la solution nutritive ou du substrat est hors de la plage d'absorption optimale pour les nutriments cles.",
                treatment:
                    "Tester le pH de la zone racinaire (test de drainage). Rincer le substrat avec de l'eau correctement ajustee au pH. Reprendre la fertilisation au pH correct.",
                prevention:
                    "Toujours ajuster le pH de l'eau et de la solution nutritive. Tester le pH du drainage hebdomadairement.",
            },
            'spider-mites': {
                name: 'Acariens',
                symptoms:
                    'Minuscules points blancs/jaunes sur la surface des feuilles. Fine toile de soie entre les feuilles et les tiges. Minuscules points en mouvement visibles a la loupe.',
                causes: "Conditions seches et chaudes. Boutures ou substrat infectes. Mauvais flux d'air.",
                treatment:
                    "Pulveriser toutes les surfaces des feuilles (surtout le dessous) avec de l'huile de neem, du savon insecticide ou du spinosad. Augmenter l'humidite. Repeter tous les 3 jours pendant 2 semaines.",
                prevention:
                    "Maintenir 50-60% d'humidite, assurer le flux d'air, inspecter les nouvelles plantes avant de les introduire dans la salle.",
            },
            'fungus-gnats': {
                name: 'Mouches des Terreaux',
                symptoms:
                    'Petites mouches noires autour de la surface du substrat. Jeunes plants fanes par des dommages de larves aux racines. Petites larves blanches visibles dans le substrat.',
                causes: 'Sur-arrosage maintenant la surface humide, permettant aux adultes de pondre. Melanges riches en tourbe.',
                treatment:
                    'Laisser les 5 cm superieurs du substrat se secher completement. Utiliser des pieges jaunes collants pour les adultes. Appliquer des nematodes benefiques ou Bacillus thuringiensis israelensis (Bti).',
                prevention:
                    'Eviter le sur-arrosage, laisser la surface du substrat secher, utiliser une couche de perlite sur le substrat.',
            },
            aphids: {
                name: 'Pucerons',
                symptoms:
                    'Groupes de petits insectes a corps mou sur la nouvelle croissance et le dessous des feuilles. Residus de miellat collant sur les feuilles. Nouvelles feuilles recourbees ou distordues.',
                causes: "Espace de culture ouvert, boutures contaminees ou exposition a l'exterieur.",
                treatment:
                    "Eliminer avec de l'eau, appliquer du savon insecticide ou de l'huile de neem, introduire des insectes benefiques (coccinelles, chrysopes).",
                prevention:
                    "Maintenir l'environnement de culture ferme, inspecter toutes les nouvelles plantes.",
            },
            thrips: {
                name: 'Thrips',
                symptoms:
                    "Stries ou taches argentees/blanches sur les feuilles (marques d'alimentation). Points de feces noirs sur la surface des feuilles. Les feuilles peuvent prendre une teinte bronzee.",
                causes: 'Plantes ou substrat contamines, environnement de culture ouvert.',
                treatment:
                    "Appliquer du spinosad, de l'huile de neem ou des insectes predateurs (Amblyseius cucumeris). Repeter regulierement.",
                prevention:
                    'Quarantaine stricte pour les nouvelles boutures, utiliser des pieges jaunes collants tot.',
            },
            'powdery-mildew': {
                name: 'Oidium (Mildiou Poudreux)',
                symptoms:
                    'Taches poudreuses blanches sur la surface des feuilles, les tiges et les fleurs. Les taches se repandent rapidement. Les tissus affectes peuvent jaunir et mourrir.',
                causes: "Forte humidite (superieure a 60%) combinee a un mauvais flux d'air et des temperatures moderees (15-27 C). Plantes surpeuplees.",
                treatment:
                    "Retirer les feuilles tres affectees. Appliquer du bicarbonate de potassium, de l'huile de neem ou du peroxyde d'hydrogene dilue. Augmenter le flux d'air et reduire l'humidite d'urgence.",
                prevention:
                    "Maintenir l'humidite en dessous de 50% en floraison. Assurer un fort flux d'air a travers la canopee. Eviter la surpopulation.",
            },
            botrytis: {
                name: 'Botrytis (Pourriture des Fleurs / Moisissure Grise)',
                symptoms:
                    "Moisissure grise et duvetense apparaissant a l'interieur des fleurs denses. Taches brunes molles au centre des colas. Spores grises visibles.",
                causes: "Forte humidite (superieure a 50% en floraison), mauvais flux d'air, fleurs denses, temperatures sous 20 C avec humidite elevee.",
                treatment:
                    "Retirer et mettre en sac immediatement tous les materiaux affectes. Ne pas agiter les fleurs -- les spores se repandent. Augmenter le flux d'air et baisser l'humidite drastiquement.",
                prevention:
                    "Maintenir l'humidite de floraison a 40-50%. Defolier la canopee dense pour le flux d'air. Recolter a temps.",
            },
            'root-rot': {
                name: 'Pourriture des Racines (Pythium/Phytophthora)',
                symptoms:
                    "Les racines deviennent brunes/grises et visqueuses au lieu d'etre blanches et fermes. Mauvaise odeur de la zone racinaire. La plante se fane malgre un arrosage adequat. En hydro : solution nutritive decoloree.",
                causes: "Sur-arrosage ou mauvais drainage. Conditions anaerobies dans la zone racinaire. Temperatures de l'eau au-dessus de 22 C en hydro. Manque de micro-organismes benefiques.",
                treatment:
                    "En terre : reduire l'arrosage, ameliorer le drainage, appliquer des bacteries benefiques/mycorhizes. En hydro : changer le reservoir, baisser la temperature de l'eau, traiter au peroxyde d'hydrogene ou bacteries benefiques.",
                prevention:
                    "Eviter le sur-arrosage. Maintenir le reservoir hydro sous 20 C. Utiliser des pierres d'air. Inoculer avec des micro-organismes benefiques.",
            },
        },
    },
    lernpfad: {
        title: "Parcours d'Apprentissage",
        progress: '{{done}} sur {{total}} etapes completees',
        filterByLevel: 'Filtrer par niveau',
        allLevels: 'Tous les niveaux',
        completed: 'Termine',
        markDone: 'Marquer comme fait',
        resetPath: 'Reinitialiser la progression',
        noPaths: "Aucun parcours d'apprentissage disponible.",
        level: {
            beginner: 'Debutant',
            intermediate: 'Intermediaire',
            expert: 'Expert',
        },
        paths: {
            'beginner-first-grow': {
                title: 'Votre Premiere Culture',
                description:
                    'Tout ce dont vous avez besoin pour une premiere recolte reussie, etape par etape.',
                steps: {
                    'step-setup': {
                        title: 'Configuration et Equipement',
                        description:
                            'Apprenez ce dont vous avez besoin pour commencer : tente, eclairage, ventilateur, pots et substrat.',
                    },
                    'step-germination': {
                        title: 'Germination',
                        description:
                            'Comment faire germer les graines de maniere fiable avec la methode du papier essuie-tout ou directement dans le substrat.',
                    },
                    'step-veg': {
                        title: 'Croissance Vegetative',
                        description:
                            "Nourrir votre plantule jusqu'a en faire une plante vegetative robuste. Bases de l'arrosage, des nutriments et de la lumiere.",
                    },
                    'step-flower': {
                        title: 'Floraison',
                        description:
                            'Declencher et gerer la phase de floraison. Calendrier lumineux, changement de nutriments et developpement des bourgeons.',
                    },
                    'step-harvest': {
                        title: 'Recolte et Sechage',
                        description:
                            'Lire les trichomes, choisir le bon moment de recolte et le processus crucial de sechage et de maturation.',
                    },
                    'step-vpd-practice': {
                        title: 'Pratique VPD',
                        description:
                            "Utiliser la calculatrice VPD pour comprendre comment la temperature et l'humidite affectent votre plante.",
                    },
                },
            },
            'environment-mastery': {
                title: "Maitrise de l'Environnement",
                description:
                    "Plongee en profondeur dans la temperature, l'humidite, le VPD, le CO2 et le flux d'air.",
                steps: {
                    'step-env-basics': {
                        title: "Bases de Temp. et d'Humidite",
                        description:
                            'Plages optimales pour chaque phase de croissance et comment les controler.',
                    },
                    'step-vpd-deep': {
                        title: 'VPD en Profondeur',
                        description:
                            'Comprendre et utiliser le deficit de pression de vapeur pour maximiser la sante et le rendement des plantes.',
                    },
                    'step-airflow': {
                        title: "Flux d'Air et CO2",
                        description:
                            "Pourquoi le flux d'air est important, comment configurer les ventilateurs de circulation et d'extraction et bases du CO2.",
                    },
                    'step-env-calc': {
                        title: 'Pratique avec les Calculatrices',
                        description:
                            'Utiliser la calculatrice VPD dans differentes phases pour developper une intuition des conditions ideales.',
                    },
                },
            },
            'nutrient-mastery': {
                title: 'Maitrise des Nutriments',
                description:
                    'Maitriser les macro et micronutriments, EC, pH et diagnostic des carences.',
                steps: {
                    'step-macros': {
                        title: 'Macronutriments (N-P-K)',
                        description:
                            "Le role de l'azote, du phosphore et du potassium dans toutes les phases de croissance.",
                    },
                    'step-micros': {
                        title: 'Micro et Secondaires',
                        description:
                            'Calcium, magnesium, soufre, fer, zinc et leurs symptomes de carence.',
                    },
                    'step-ec-ph': {
                        title: 'EC, PPM et pH',
                        description:
                            'Comment mesurer et controler la force et le pH de la solution nutritive.',
                    },
                    'step-deficiency-atlas': {
                        title: 'Atlas des Carences',
                        description:
                            "Utiliser l'Atlas des Maladies pour identifier et traiter les carences en nutriments.",
                    },
                    'step-nutrient-calc': {
                        title: 'Calculatrice de Nutriments',
                        description:
                            'Utiliser la calculatrice de ratios de nutriments pour planifier les fertilisations par phase de croissance.',
                    },
                },
            },
            'pest-disease-control': {
                title: 'Controle des Ravageurs et Maladies',
                description:
                    'Identifier, traiter et prevenir les ravageurs et maladies les plus courants.',
                steps: {
                    'step-plant-hygiene': {
                        title: 'Hygiene et Prevention',
                        description:
                            'Protocoles de nettoyage, quarantaine pour les nouvelles plantes et prevention environnementale.',
                    },
                    'step-pest-id': {
                        title: 'Identification des Ravageurs',
                        description:
                            'Detecter les acariens, les mouches des terreaux, les pucerons et les thrips a temps.',
                    },
                    'step-disease-id': {
                        title: 'Identification des Maladies',
                        description:
                            "Reconnaitre l'oidium, la botrytis et la pourriture des racines avant qu'elles ne detruisent une recolte.",
                    },
                },
            },
            'advanced-training': {
                title: 'Formation Avancee des Plantes',
                description:
                    'LST, topping, super cropping, SCROG et manifolding pour un rendement maximal.',
                steps: {
                    'step-why-train': {
                        title: 'Pourquoi Former les Plantes ?',
                        description:
                            'Comprendre la dominance apicale et comment la formation la brise pour de meilleurs rendements.',
                    },
                    'step-lst-topping': {
                        title: 'LST et Topping',
                        description:
                            'Bases de la formation a basse contrainte et du topping avec details de timing et de technique.',
                    },
                    'step-scrog-manifold': {
                        title: 'SCROG et Manifolding',
                        description:
                            'Techniques avancees pour une canopee parfaitement uniforme avec le nombre maximal de points de bourgeons.',
                    },
                },
            },
            firstGrow: {
                title: 'Votre Premiere Culture',
                description:
                    'Tout ce dont vous avez besoin pour une premiere recolte reussie, etape par etape.',
                step1Title: 'Configuration et Equipement',
                step1Desc:
                    'Apprenez ce dont vous avez besoin pour commencer : tente, eclairage, ventilateur, pots et substrat.',
                step2Title: 'Germination',
                step2Desc:
                    'Comment germer des graines de maniere fiable -- methode du papier essuie-tout ou directement dans le substrat.',
                step3Title: 'Croissance Vegetative',
                step3Desc:
                    "Nourrir votre plantule jusqu'a une plante vegetative robuste. Bases de l'arrosage, des nutriments et de la lumiere.",
                step4Title: 'Floraison',
                step4Desc:
                    'Declencher et gerer la phase de floraison. Calendrier lumineux, changement de nutriments et developpement des bourgeons.',
                step5Title: 'Recolte et Sechage',
                step5Desc:
                    'Lire les trichomes, choisir le bon moment de recolte et le processus crucial de sechage et de maturation.',
                step6Title: 'Pratique VPD',
                step6Desc:
                    "Utiliser la calculatrice VPD pour comprendre comment la temperature et l'humidite affectent votre plante.",
            },
            environment: {
                title: "Maitrise de l'Environnement",
                description:
                    "Plongee en profondeur dans la temperature, l'humidite, le VPD, le CO2 et le flux d'air.",
                step1Title: "Bases de Temp. et d'Humidite",
                step1Desc:
                    'Plages optimales pour chaque phase de croissance et comment les controler.',
                step2Title: 'VPD en Profondeur',
                step2Desc:
                    'Comprendre et utiliser le deficit de pression de vapeur pour maximiser la sante des plantes.',
                step3Title: "Flux d'Air et CO2",
                step3Desc:
                    "Pourquoi le flux d'air est important et comment configurer les ventilateurs.",
                step4Title: 'Pratique avec les Calculatrices',
                step4Desc:
                    'Utiliser la calculatrice VPD dans differentes phases pour developper une intuition des conditions ideales.',
            },
            nutrients: {
                title: 'Maitrise des Nutriments',
                description:
                    'Maitriser les macro et micronutriments, EC, pH et diagnostic des carences.',
                step1Title: 'Guide pH',
                step1Desc:
                    'Comprendre et controler le pH pour une absorption optimale des nutriments.',
                step2Title: 'Calculatrice de Nutriments',
                step2Desc:
                    'Utiliser la calculatrice de ratios pour planifier les fertilisations par phase.',
                step3Title: 'Carence en Calcium',
                step3Desc:
                    "Reconnaitre et traiter la carence en calcium -- l'un des problemes les plus courants.",
                step4Title: 'Brulure par Nutriments',
                step4Desc:
                    'Reconnaitre la surdose de nutriments et aider la plante a se recuperer.',
                step5Title: "Pratique avec l'Atlas",
                step5Desc:
                    "Utiliser l'Atlas des Maladies pour identifier et traiter les problemes nutritionnels.",
            },
            pests: {
                title: 'Controle des Ravageurs et Maladies',
                description:
                    'Identifier, traiter et prevenir les ravageurs et maladies les plus courants.',
                step1Title: 'Guide de Lutte Antiparasitaire',
                step1Desc:
                    'Strategies integrees de lutte antiparasitaire pour garder la culture sans parasites.',
                step2Title: 'Acariens',
                step2Desc: 'Detecter et traiter les acariens -- le ravageur le plus destructeur.',
                step3Title: 'Oidium',
                step3Desc: "Reconnaitre et traiter l'oidium avant qu'il ne detruise la culture.",
            },
            training: {
                title: 'Formation Avancee des Plantes',
                description:
                    'LST, topping, super cropping, SCROG et manifolding pour un rendement maximal.',
                step1Title: 'Fondamentaux de la Formation',
                step1Desc:
                    'Comprendre les principes de la formation des plantes et appliquer LST et topping.',
                step2Title: 'Topping vs. LST',
                step2Desc:
                    'Comparer topping et formation a basse contrainte et trouver la meilleure approche.',
                step3Title: 'Solution au Sur-Arrosage',
                step3Desc:
                    'Reconnaitre et resoudre le sur-arrosage -- un probleme courant lors de la formation.',
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
                    'Wireless sensors for temperature, humidity, VPD, EC, pH, PAR/PPFD, CO2, and soil moisture form the backbone of precision cultivation.',
                benefits:
                    '<ul><li>Real-time VPD optimization</li><li>Predictive environmental adjustments</li><li>Integration with CannaGuide via MQTT and BLE</li></ul>',
                tip: 'VPD is the "invisible killer" -- wrong values cause stress, mold, or low trichome production.',
            },
            aiAutomation: {
                title: 'AI & Automation',
                tagline: 'AI platforms that detect problems before visible symptoms appear',
                content:
                    'AI platforms analyze real-time sensor data, detect pests and deficiencies before visible symptoms.',
                benefits:
                    '<ul><li>Proactive pest detection</li><li>Automated scheduling</li><li>Data-driven compliance</li></ul>',
                tip: 'CannaGuide already includes AI-powered plant diagnostics and local AI fallback -- all working offline.',
            },
            digitalTwin: {
                title: 'Digital Twin Simulation',
                tagline: 'Virtual grow room replicas for risk-free experimentation',
                content:
                    'A Digital Twin creates a virtual replica of your grow environment using sensor data and CFD models.',
                benefits:
                    '<ul><li>Zero-risk experimentation</li><li>Predictive yield modeling</li><li>Virtual HVAC optimization</li></ul>',
                tip: 'CannaGuide Sandbox already offers what-if experiments on cloned plants.',
            },
            hydroAero: {
                title: 'Hydroponics & Aeroponics',
                tagline: 'Soilless systems with up to 30% faster growth and 90% less water',
                content:
                    'Aeroponics suspends roots in air and delivers nutrients via fine mist -- up to 30% faster growth with 90% less water.',
                benefits:
                    '<ul><li>Faster growth cycles</li><li>90% water reduction</li><li>Precise nutrient control</li></ul>',
                tip: 'CannaGuide supports Soil, Coco, Hydro, and Aeroponics as grow media.',
            },
            tissueCulture: {
                title: 'Tissue Culture & Micropropagation',
                tagline: 'Virus-free cloning of elite genetics at scale',
                content:
                    'Home-lab kits enable virus-free propagation of elite genetics with 100% genetic consistency.',
                benefits:
                    '<ul><li>100% genetic consistency</li><li>Pathogen elimination</li><li>Faster scaling</li></ul>',
                tip: 'Track phenotypes in CannaGuide Breeding Lab and Genealogy Explorer.',
            },
            smartGrowBoxes: {
                title: 'All-in-One Smart Grow Boxes',
                tagline: 'Integrated systems with LEDs, fans, sensors, and app control',
                content:
                    'Complete systems integrate LEDs, ventilation, sensors, and app control into a single unit.',
                benefits:
                    '<ul><li>Zero setup complexity</li><li>Integrated control</li><li>App-based monitoring</li></ul>',
                tip: 'Even with an all-in-one box, use CannaGuide for your grow journal and AI advice.',
            },
            sustainability: {
                title: 'Sustainability & Post-Harvest Tech',
                tagline: 'Energy savings, regenerative soils, and precision curing',
                content:
                    'LED + HVAC optimization reduces energy consumption. Regenerative soils maximize terpene retention.',
                benefits:
                    '<ul><li>30-50% energy cost reduction</li><li>Superior terpene preservation</li><li>Sustainable practices</li></ul>',
                tip: 'CannaGuide post-harvest simulation tracks jar humidity, chlorophyll breakdown, and mold risk.',
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
                'CannaGuide integrates many 2026 technologies: real-time VPD simulation, AI-powered diagnostics, what-if sandbox experiments, IoT sensor integration, and a 3-layer local AI fallback.',
        },
    },
    rechner: {
        title: 'Centre de Calculatrices',
        vpdTab: 'VPD',
        nutrientTab: 'Nutriments',
        phTab: 'pH / CE',
        terpeneEntourageTab: 'Entourage',
        transpirationTab: 'Transpiration',
        ecTdsTab: 'CE/TDS',
        lightSpectrumTab: 'Lumiere',
        cannabinoidRatioTab: 'Cannabinoides',
        equipmentLink: 'Pour des calculatrices avancees, voir la section Equipement.',
        vpd: {
            temperature: "Temperature de l'air",
            humidity: 'Humidite relative',
            leafOffset: 'Decalage temp. feuille',
            celsius: '\u00b0C',
            result: 'Resultat VPD',
            statusLow: 'VPD trop bas -- risque de moisissure et croissance lente.',
            statusOk: 'VPD optimal -- transpiration ideale.',
            statusHigh: 'VPD trop eleve -- risque de stress thermique et fletrissement.',
            refTitle: 'Plages de Reference VPD',
            rangeSeedling: 'Semis',
            rangeVeg: 'Vegetatif',
            rangeFlower: 'Floraison',
            rangeLateFlower: 'Floraison Tardive',
            simulate: 'Simuler 7 jours',
            simulationTitle: 'Courbe VPD 7 jours',
            explainAi: 'Expliquer avec IA',
            aiExplanationTitle: 'Explication IA',
            aiLoading: "Generation de l'explication...",
            deepDive: "Approfondir: Parcours d'Apprentissage ->",
        },
        nutrient: {
            growStage: 'Phase de Croissance',
            volume: "Volume d'eau (L)",
            seedling: 'Semis',
            veg: 'Vegetatif',
            earlyFlower: 'Floraison Precoce',
            lateFlower: 'Floraison Tardive',
            seedlingDesc:
                'Nutrition legere, N eleve pour le developpement des racines et des feuilles.',
            vegDesc: 'N fort, P/K modere pour une croissance vegetative vigoureuse.',
            earlyFlowerDesc: 'Reduire N, augmenter P/K au debut de la formation des bourgeons.',
            lateFlowerDesc: 'N minimal -- phase de maturation, focus sur P/K et mineraux lavables.',
            targetEc: 'CE Cible (mS/cm)',
            dosage: 'Dosage Approximatif',
            disclaimer:
                'Les valeurs sont des lignes directrices. Mesurez toujours la CE et le pH apres melange.',
        },
        ph: {
            intro: 'Les plages optimales de pH et CE varient selon le substrat. Rester dans ces plages garantit une disponibilite optimale des nutriments.',
            medium: 'Substrat',
            phRange: 'Plage pH',
            ecRange: 'Plage CE (mS/cm)',
            note: 'Ajustez toujours le pH de votre eau et solution nutritive apres chaque melange. Utilisez un pH-metre calibre.',
        },
        terpeneEntourage: {
            description:
                "Entrez votre profil de terpenes pour calculer le score d'effet entourage et la matrice de synergies. Base sur Russo (2011) et Booth & Bohlmann (2019).",
            terpeneName: 'Terpene',
            terpenePercent: 'Pourcentage',
            addTerpene: 'Ajouter un terpene',
            remove: 'Supprimer',
            score: 'Score Entourage',
            dominant: 'Dominant',
            profile: 'Profil',
            synergyMatrix: 'Paires de Synergie',
            learnMore: 'En savoir plus sur la science des terpenes ->',
            explainAi: 'Expliquer avec IA',
            aiExplanationTitle: 'Explication IA',
            aiLoading: "Generation de l'explication...",
            deepDive: "Approfondir: Parcours d'Apprentissage ->",
        },
        transpiration: {
            description:
                "Calculez le taux de transpiration du couvert a partir du VPD, de la conductance stomatique et de l'Indice de Surface Foliaire (approximation Penman-Monteith).",
            vpd: 'VPD',
            gsmmol: 'Conductance Stomatique',
            lai: 'Indice de Surface Foliaire (LAI)',
            hours: 'Photopériode (h/jour)',
            leafRate: 'Transpiration Foliaire',
            canopyRate: 'Transpiration du Couvert',
            dailyWater: "Utilisation Quotidienne d'Eau",
            learnMore: "En savoir plus sur la gestion de l'eau des plantes ->",
            simulate: 'Simuler 7 jours',
            simulationTitle: 'Projection 7 jours',
            explainAi: 'Expliquer avec IA',
            aiExplanationTitle: 'Explication IA',
            aiLoading: "Generation de l'explication...",
            deepDive: "Approfondir: Parcours d'Apprentissage ->",
        },
        ecTds: {
            description:
                'Convertir entre CE (mS/cm) et TDS sur les trois echelles courantes. Entrez des lectures de pH dans le temps pour une prediction de derive.',
            ecInput: 'CE (mS/cm)',
            tds500: 'TDS-500',
            tds640: 'TDS-640',
            tds700: 'TDS-700',
            phReadings: 'Lectures pH (separees par virgule)',
            drift: 'Derive pH',
            prediction: 'Projection Jour 7',
            learnMore: 'En savoir plus sur la gestion CE, TDS et pH ->',
            simulate: 'Simuler 7 jours',
            simulationTitle: 'Derive CE 7 jours',
            explainAi: 'Expliquer avec IA',
            aiExplanationTitle: 'Explication IA',
            aiLoading: "Generation de l'explication...",
            deepDive: "Approfondir: Parcours d'Apprentissage ->",
        },
        lightSpectrum: {
            description:
                "Calculez le DLI, l'efficacite photosynthetique et l'augmentation estimee de la production de terpenes a partir de vos parametres de spectre lumineux.",
            ppfd: 'PPFD',
            redPercent: '% Bande Rouge',
            bluePercent: '% Bande Bleue',
            hours: 'Photopériode (h/jour)',
            stage: 'Phase de Croissance',
            dli: 'Integrale de Lumiere Journaliere (DLI)',
            efficiency: 'Efficacite Photosynthetique',
            terpeneBoost: 'Amplificateur de Terpenes',
            recommended: 'Ratio Recommande',
            learnMore: 'En savoir plus sur le spectre lumineux et la production de terpenes ->',
            simulate: 'Simuler 7 jours',
            simulationTitle: 'Courbe DLI 7 jours',
            explainAi: 'Expliquer avec IA',
            aiExplanationTitle: 'Explication IA',
            aiLoading: "Generation de l'explication...",
            deepDive: "Approfondir: Parcours d'Apprentissage ->",
        },
        cannabinoidRatio: {
            description:
                "Analysez les ratios THC:CBD:CBG, le type de profil et le score d'harmonie entourage.",
            ratio: 'Ratio',
            profile: 'Type de Profil',
            harmony: "Score d'Harmonie",
            learnMore: 'En savoir plus sur les profils de cannabinoides ->',
            explainAi: 'Expliquer avec IA',
            aiExplanationTitle: 'Explication IA',
            aiLoading: "Generation de l'explication...",
            deepDive: "Approfondir: Parcours d'Apprentissage ->",
        },
    },
}

export const tipOfTheDay = {
    title: 'Conseil du Jour',
    tips: [
        'Verifiez toujours le pH de votre eau apres avoir ajoute des nutriments.',
        "Une brise legere d'un ventilateur dirigee vers vos plantes renforce les tiges et previent la moisissure.",
        "Moins c'est plus, surtout avec les nutriments. Il est plus facile de corriger une carence qu'une toxicite.",
        "Observez la couleur de vos feuilles. Un vert riche et sain est bon. Un vert trop fonce peut indiquer un exces d'azote.",
        "Les pots en tissu sont un excellent choix pour les debutants car ils rendent l'arrosage excessif presque impossible.",
    ],
}

export const analytics = {
    gardenScore: 'Score du Jardin',
    avgHealth: 'Sante Moyenne',
    envStability: 'Stabilite Environnementale',
    activePlants: 'Plantes Actives',
    stageDistribution: 'Repartition par Phase',
    riskFactors: 'Facteurs de Risque',
    strainPerformance: 'Performance par Variete',
    nextMilestone: 'Prochain Jalon',
    daysAway: 'jours restants',
    analyticsEmpty: 'Ajoutez des plantes pour voir les analyses',
    strain: 'Variete',
    health: 'Sante',
    plants: 'Plantes',
    avgAge: 'Age Moyen',
    relatedKnowledge: 'Connaissances Associees',
    milestoneType: {
        flip: 'Passage en Floraison',
        harvest: 'Pret pour la Recolte',
        curing_done: 'Sechage Termine',
        transplant: 'Transplantation',
    },
    recommendations: {
        title: 'Recommandations',
        adjustVpd: 'Ajuster le VPD',
        adjustVpdDesc:
            "Le VPD est en dehors de la plage optimale. Ajustez la temperature ou l'humidite.",
        considerTraining: "Envisager l'Entrainement",
        considerTrainingDesc:
            'Plante en phase vegetative tardive. Le LST ou le topping pourrait ameliorer le rendement.',
        checkTrichomes: 'Verifier les Trichomes',
        checkTrichomesDesc:
            'Plante en floraison tardive. Surveillez les trichomes pour le moment de la recolte.',
        improveHealth: 'Ameliorer la Sante de la Plante',
        improveHealthDesc:
            "La sante de la plante est en dessous de l'optimal. Verifiez les nutriments, le pH et l'environnement.",
    },
    riskType: {
        health: 'Sante',
        environment: 'Environnement',
        nutrient: 'Nutriment',
        pest: 'Ravageur/Maladie',
        overdue_task: 'Tache en Retard',
    },
    risks: {
        healthCritical: '{{name}} sante critique a {{health}}%',
        vpdOutOfRange: '{{name}} VPD hors limites: {{vpd}} kPa',
        severeProblem: '{{name}}: {{problem}} (severite {{severity}}/10)',
        overdueTask: '{{name}}: Tache en retard -- {{task}}',
    },
}

export const growBible = {
    title: 'CannaGuide Bible de Culture',
    generated: 'Genere',
    plants: 'Plantes',
    appVersion: "Version de l'App",
    toc: 'Table des Matieres',
    analyticsSummary: 'Resume des Analyses',
    relatedKnowledge: 'Connaissances Associees',
    relatedKnowledgeDesc:
        'En fonction de votre culture actuelle, ces sujets sont les plus pertinents:',
    footer: 'Genere par CannaGuide 2025',
    property: 'Propriete',
    value: 'Valeur',
    strain: 'Variete',
    stage: 'Phase',
    age: 'Age',
    days: 'jours',
    health: 'Sante',
    temperature: 'Temperature',
    humidity: 'Humidite',
    environment: 'Environnement',
    moisture: 'Humidite du substrat',
    activeProblems: 'Problemes Actifs',
    severity: 'severite',
    journal: 'Journal',
    noNotes: 'Pas de notes',
    harvestData: 'Donnees de Recolte',
    wetWeight: 'Poids Humide',
    dryWeight: 'Poids Sec',
    quality: 'Qualite',
    count: 'Nombre',
}
