export const knowledgeView = {
    title: 'Centre de Connaissances',
    subtitle: 'Votre guide interactif pour une culture reussie.',
    tabs: {
        mentor: 'Mentor IA',
        guide: 'Guide de Culture',
        archive: 'Archives du Mentor',
        breeding: 'Laboratoire de Croisement',
        sandbox: 'Sandbox',
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
