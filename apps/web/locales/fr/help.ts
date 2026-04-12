export const helpView = {
    title: 'Aide et Support',
    subtitle: 'Trouvez des reponses a vos questions et apprenez-en plus sur la culture.',
    tabs: {
        faq: 'FAQ',
        guides: 'Guides Visuels',
        lexicon: 'Lexique',
        manual: 'Manuel Utilisateur',
        screenshots: "Captures d'Ecran",
        faqDescription:
            "Reponses rapides aux questions les plus courantes sur l'app et la culture.",
        guidesDescription:
            "Guides visuels pas a pas pour les techniques d'entrainement et les flux de travail de l'app.",
        lexiconDescription:
            'Un glossaire complet des cannabinoides, terpenes, flavonoides et termes de culture.',
        manualDescription:
            "Le manuel utilisateur complet couvrant chaque fonctionnalite de l'app en detail.",
        screenshotsDescription:
            "Captures d'ecran de chaque ecran de l'app en vues bureau et mobile.",
    },
    itemCount: '{{count}} elements',
    termCount: '{{count}} termes',
    sectionCount: '{{count}} sections',
    subSectionCount: '{{count}} sous-sections',
    guideCount: '{{count}} guides',
    screenshotCount: "{{count}} captures d'ecran",
    faq: {
        title: 'Questions Frequemment Posees',
        subtitle: "Divisees en operations de l'app, support IA/offline et sujets de culture.",
        searchPlaceholder: 'Rechercher des questions...',
        noResults: 'Aucun resultat trouve pour "{{term}}".',
        expandAll: 'Tout Developper',
        collapseAll: 'Tout Replier',
        resultCount: '{{count}} questions trouvees',
        resultCountFiltered: '{{count}} sur {{total}} questions correspondent',
        groups: {
            localAi: "IA Locale, Synchronisation et Recuperation de l'App",
            grow: 'Culture et Soin des Plantes',
        },
    },
    guides: {
        title: 'Guides Visuels',
        subtitle: 'Guides visuels pas a pas pour les techniques de culture essentielles.',
    },
    lexicon: {
        title: 'Lexique du Cultivateur',
        subtitle:
            'Explorez la science derriere les cannabinoides, terpenes, flavonoides et la terminologie essentielle de culture.',
        searchPlaceholder: 'Rechercher des termes...',
        noResults: 'Aucun terme trouve pour "{{term}}".',
        resultCount: 'Affichage de {{count}} sur {{total}} termes',
        categories: {
            all: 'Tous',
            cannabinoid: 'Cannabinoides',
            terpene: 'Terpenes',
            flavonoid: 'Flavonoides',
            general: 'General',
        },
        cannabinoids: {
            thc: {
                term: 'THC (Tetrahydrocannabinol)',
                definition:
                    'Le cannabinoide psychoactif le plus connu et principal du cannabis, responsable de la sensation de "high".',
            },
            cbd: {
                term: 'CBD (Cannabidiol)',
                definition:
                    'Un cannabinoide non psychoactif connu pour ses proprietes therapeutiques, notamment des effets analgesiques et anti-inflammatoires.',
            },
            cbg: {
                term: 'CBG (Cannabigerol)',
                definition:
                    'Un cannabinoide non psychoactif souvent appele la "mere de tous les cannabinoides" car c\'est un precurseur du THC et du CBD.',
            },
            cbn: {
                term: 'CBN (Cannabinol)',
                definition:
                    'Un cannabinoide legerement psychoactif qui se forme lorsque le THC se degrade. Il est connu pour ses proprietes sedatives.',
            },
            cbc: {
                term: 'CBC (Cannabichromene)',
                definition:
                    'Un cannabinoide non psychoactif qui montre un potentiel pour des effets anti-inflammatoires et analgesiques.',
            },
            thca: {
                term: 'THCA (Acide Tetrahydrocannabinolique)',
                definition:
                    'Le precurseur acide non psychoactif du THC present dans le cannabis brut. Il se convertit en THC par la chaleur (decarboxylation).',
            },
            cbda: {
                term: 'CBDA (Acide Cannabidiolique)',
                definition:
                    'Le precurseur acide du CBD present dans le cannabis brut. Il a ses propres effets therapeutiques potentiels, en particulier anti-inflammatoires.',
            },
            thcv: {
                term: 'THCV (Tetrahydrocannabivarine)',
                definition:
                    'Un cannabinoide structurellement similaire au THC mais avec des effets differents. Il est connu comme coupe-faim et peut etre psychoactif a fortes doses.',
            },
            cbdv: {
                term: 'CBDV (Cannabidivarine)',
                definition:
                    'Un cannabinoide non psychoactif structurellement similaire au CBD, etudie pour son potentiel dans le traitement des pathologies neurologiques.',
            },
        },
        terpenes: {
            myrcene: {
                term: 'Myrcene',
                definition:
                    'Un terpene commun avec un arome terreux et musque. Egalement present dans les mangues. Connu pour ses proprietes calmantes et relaxantes.',
            },
            limonene: {
                term: 'Limonene',
                definition:
                    "Un terpene avec un fort arome d'agrumes. Il est connu pour ses effets stimulants de l'humeur et anti-stress.",
            },
            caryophyllene: {
                term: 'Caryophyllene',
                definition:
                    "Un terpene avec un arome epice et poivre. C'est le seul terpene qui peut aussi se lier aux recepteurs cannabinoides et a des proprietes anti-inflammatoires.",
            },
            pinene: {
                term: 'Pinene',
                definition:
                    'Un terpene avec un arome frais de pin. Il peut favoriser la vigilance et a des proprietes anti-inflammatoires.',
            },
            linalool: {
                term: 'Linalol',
                definition:
                    'Un terpene avec un arome floral rappelant la lavande. Il est connu pour ses effets calmants, anxiolytiques et favorisant le sommeil.',
            },
            terpinolene: {
                term: 'Terpinolene',
                definition:
                    'Un terpene avec un arome complexe fruité-floral. Il a souvent un effet legerement stimulant et des proprietes antioxydantes.',
            },
            humulene: {
                term: 'Humulene',
                definition:
                    'Un terpene avec un arome terreux et boise, egalement present dans le houblon. Il est connu pour ses proprietes anti-inflammatoires et coupe-faim.',
            },
            ocimene: {
                term: 'Ocimene',
                definition:
                    'Un terpene avec un arome doux, herbace et boise. Il peut avoir des effets stimulants et est etudie pour ses proprietes antivirales.',
            },
            bisabolol: {
                term: 'Bisabolol',
                definition:
                    'Un terpene avec un arome leger, doux et floral, egalement present dans la camomille. Il est connu pour ses proprietes anti-inflammatoires et apaisantes pour la peau.',
            },
            nerolidol: {
                term: 'Nerolidol',
                definition:
                    "Un terpene avec un arome boise et floral rappelant l'ecorce d'arbre. Il a des proprietes sedatives et anxiolytiques.",
            },
        },
        flavonoids: {
            cannaflavin: {
                term: 'Cannaflavines (A, B, C)',
                definition:
                    'Un groupe de flavonoides presents exclusivement dans le cannabis. Ils ont de puissantes proprietes anti-inflammatoires.',
            },
            quercetin: {
                term: 'Quercetine',
                definition:
                    "Un flavonoide present dans de nombreux fruits et legumes. C'est un puissant antioxydant avec des proprietes antivirales.",
            },
            kaempferol: {
                term: 'Kaempferol',
                definition:
                    'Un flavonoide avec de fortes proprietes antioxydantes qui peut aider a prevenir le stress oxydatif.',
            },
            apigenin: {
                term: 'Apigenine',
                definition:
                    'Un flavonoide avec des proprietes anxiolytiques et sedatives, egalement present dans la camomille.',
            },
            luteolin: {
                term: 'Luteoline',
                definition:
                    'Un flavonoide avec des proprietes antioxydantes et anti-inflammatoires.',
            },
            orientin: {
                term: 'Orientine',
                definition:
                    'Un flavonoide avec des proprietes antioxydantes, anti-inflammatoires et potentiellement antibiotiques.',
            },
            vitexin: {
                term: 'Vitexine',
                definition:
                    'Un flavonoide qui peut presenter des effets analgesiques et antioxydants.',
            },
        },
        general: {
            phValue: {
                term: 'Valeur pH',
                definition:
                    "Une mesure de l'acidite ou de l'alcalinite d'une solution. Dans la culture du cannabis, un pH correct est crucial pour l'absorption des nutriments.",
            },
            ecValue: {
                term: 'EC (Conductivite Electrique)',
                definition:
                    'Une mesure de la quantite totale de sels dissous (nutriments) dans une solution. Elle aide a surveiller la concentration en nutriments.',
            },
            vpd: {
                term: 'VPD (Deficit de Pression de Vapeur)',
                definition:
                    "Une mesure de la pression combinee de la temperature et de l'humidite sur la plante. Une valeur VPD optimale permet une transpiration efficace.",
            },
            trichomes: {
                term: 'Trichomes',
                definition:
                    'Les petites glandes resineuses sur les fleurs et feuilles du cannabis qui produisent les cannabinoides et terpenes. Leur couleur est un indicateur cle de maturite.',
            },
            topping: {
                term: 'Topping',
                definition:
                    "Une technique d'entrainement ou la pointe superieure de la plante est coupee pour encourager la croissance de deux nouvelles tetes principales, creant une forme plus buissonnante.",
            },
            fimming: {
                term: 'FIM (F*ck I Missed)',
                definition:
                    'Une technique similaire au topping, mais ou seule une partie de la pointe est retiree, resultant souvent en quatre nouveaux branchages principaux ou plus.',
            },
            lst: {
                term: 'LST (Low-Stress Training)',
                definition:
                    "Une technique d'entrainement ou les branches sont delicatement pliees et attachees, creant une canopee plus large et plate et maximisant l'exposition a la lumiere.",
            },
            lollipopping: {
                term: 'Lollipopping',
                definition:
                    "Le retrait des feuilles inferieures et des petits branchages qui recoivent peu de lumiere pour concentrer l'energie de la plante sur les fleurs superieures plus grandes.",
            },
            scrog: {
                term: 'SCROG (Screen of Green)',
                definition:
                    "Une technique d'entrainement avancee ou un filet ou ecran est place au-dessus des plantes pour guider les pousses horizontalement, creant une canopee uniforme et productive.",
            },
            sog: {
                term: 'SOG (Sea of Green)',
                definition:
                    'Une methode de culture ou de nombreuses petites plantes sont cultivees ensemble et rapidement mises en floraison pour obtenir une recolte rapide et abondante.',
            },
            curing: {
                term: 'Affinage (Curing)',
                definition:
                    "Le processus de stockage des fleurs de cannabis sechees dans des contenants hermetiques pour decomposer la chlorophylle et ameliorer le gout, l'arome et la douceur de la fumee.",
            },
            nutrientLockout: {
                term: 'Blocage des Nutriments',
                definition:
                    "Un etat ou la plante ne peut pas absorber les nutriments disponibles en raison d'un pH incorrect dans la zone racinaire, meme s'ils sont presents.",
            },
            flushing: {
                term: 'Rincage (Flushing)',
                definition:
                    "La pratique d'arroser la plante uniquement avec de l'eau pure a pH ajuste pendant les une a deux dernieres semaines avant la recolte pour eliminer l'exces de sels nutritifs.",
            },
            phenotype: {
                term: 'Phenotype',
                definition:
                    "Les caracteristiques observables d'une plante (apparence, odeur, effet) qui resultent de l'interaction de son genotype et de l'environnement.",
            },
            genotype: {
                term: 'Genotype',
                definition:
                    "Le patrimoine genetique d'une plante, qui determine son potentiel pour certains traits.",
            },
            landrace: {
                term: 'Landrace',
                definition:
                    "Une variete de cannabis pure et originale qui s'est naturellement adaptee et stabilisee dans une region geographique specifique sur une longue periode.",
            },
            mainlining: {
                term: 'Mainlining (Manifolding)',
                definition:
                    "Une technique avancee d'entrainement a haut stress ou toutes les branches laterales sont supprimees tot et la plante est etee a plusieurs reprises pour creer un collecteur symetrique avec 8-16 tetes de taille uniforme. Produit des tetes de taille uniforme et maximise le rendement par plante.",
            },
            superCropping: {
                term: 'Super Cropping',
                definition:
                    "Une technique d'entrainement a haut stress ou les tiges sont delicatement pincees et pliees pour creer un cal similaire a un noeud. Cela renforce la branche, ameliore le flux de nutriments et peut augmenter la production de cannabinoides par une reponse au stress controlee.",
            },
            defoliation: {
                term: 'Defoliation',
                definition:
                    "Le retrait strategique de feuilles nourriceres selectionnees pendant la phase vegetative ou de floraison precoce pour ameliorer la penetration de la lumiere vers les sites de fleurs inferieurs et augmenter la circulation d'air, reduisant le risque de moisissure.",
            },
            runoff: {
                term: 'Eau de Drainage (Runoff)',
                definition:
                    "L'exces d'eau qui s'ecoule du fond d'un conteneur apres l'arrosage. Mesurer le pH et l'EC du drainage aide a surveiller les conditions de la zone racinaire. Un objectif de 10-20% de volume de drainage est la pratique standard.",
            },
            rootBound: {
                term: 'Racines Encerclees',
                definition:
                    "Un etat ou une plante a depasse son conteneur et les racines s'enroulent etroitement autour de l'interieur du pot, restreignant la croissance et l'absorption des nutriments. Rempoter dans un conteneur plus grand ou utiliser des pots en tissu previent cela.",
            },
            dlt: {
                term: 'DLT (Technique de Litiere Profonde)',
                definition:
                    "Une methode de sol vivant ou la matiere organique est superposee au-dessus du milieu de culture, creant un ecosysteme d'auto-compostage. Les microbes benefiques decomposent la litiere, fournissant des nutriments a liberation lente a la plante.",
            },
            ppfd: {
                term: 'PPFD (Densite de Flux de Photons Photosynth.)',
                definition:
                    "Une mesure de la quantite de rayonnement photosynth. actif (PAR) atteignant une surface par seconde, mesuree en umol/m2/s. La metrique cle pour evaluer les performances d'eclairage de culture.",
            },
            dli: {
                term: 'DLI (Integrale de Lumiere Quotidienne)',
                definition:
                    "La quantite totale de photons photosynth. actifs atteignant une surface sur 24 heures, mesuree en mol/m2/jour. Combine PPFD et photoperiode pour quantifier l'energie lumineuse totale.",
            },
            ipm: {
                term: 'IPM (Lutte Integree)',
                definition:
                    'Une approche systematique de la lutte antiparasitaire combinant prevention, surveillance, controles biologiques et traitements cibles en dernier recours. Privilegie les insectes benefiques, les cultures associees et les controles environnementaux aux pesticides chimiques.',
            },
            autoflower: {
                term: 'Autofloraison',
                definition:
                    "Genetique de cannabis portant des traits Ruderalis qui fleurit selon l'age plutot que les changements de cycle lumineux. Les autofloraisons modernes (2026) egalent les varietes a photoperiode en puissance et richesse terpenique avec des cycles de 75-90 jours de la graine a la recolte.",
            },
            feminized: {
                term: 'Graines Feminisees',
                definition:
                    "Graines genetiquement manipulees (typiquement via argent colloidal ou STS) pour produire uniquement des plantes femelles (99,9%). Elimine le besoin d'identifier et de supprimer les plantes males, maximisant la canopee productive.",
            },
            cloning: {
                term: 'Clonage (Bouturage)',
                definition:
                    "Le processus de prelevement d'une bouture d'une plante mere et de son enracinement pour creer une copie genetiquement identique. Assure la regularite des schemos de croissance, de la puissance et des profils terpeniques sur plusieurs cultures.",
            },
            dynamicLighting: {
                term: 'Eclairage Dynamique',
                definition:
                    "Systemes d'eclairage LED qui ajustent automatiquement leur sortie spectrale en fonction de la phase de croissance et des conditions environnementales (VPD). Dominance bleue pour la croissance vegetative, dominance rouge pour la floraison.",
            },
            digitalTwin: {
                term: 'Jumeau Numerique',
                definition:
                    "Une replique virtuelle d'un environnement de culture construite a partir de donnees de capteurs en temps reel. Utilise pour simuler des scenarios hypothetiques (changements de CO2, ajustements de temperature) et predire leur impact sur le rendement avant de faire des changements reels.",
            },
            aeroponics: {
                term: 'Aeroponie',
                definition:
                    "Une methode de culture sans sol ou les racines des plantes sont suspendues dans l'air et les nutriments sont distribues par brumisation fine. Atteint jusqu'a 30% de croissance plus rapide avec 90% moins d'eau que les methodes traditionnelles.",
            },
            smartFertigation: {
                term: 'Fertigation Intelligente',
                definition:
                    "Un systeme automatise qui combine l'irrigation avec un dosage precis des nutriments, utilisant des capteurs EC/pH et un controle en boucle fermee pour maintenir des niveaux de nutriments optimaux en temps reel.",
            },
            tissueCulture: {
                term: 'Culture de Tissus',
                definition:
                    "Une technique de laboratoire sterile (micropropagation) pour produire des clones exempts de virus et genetiquement identiques a partir de minuscules echantillons de tissu vegetal, permettant une mise a l'echelle massive de genetique d'elite.",
            },
            polyploidy: {
                term: 'Polyploidie',
                definition:
                    "Un etat ou les organismes possedent plus de deux jeux complets de chromosomes. Chez le cannabis, les plantes triploides (3n), tetraploides (4n) et hexaploides (6n) peuvent produire jusqu'a 65% plus de cannabinoides et une biomasse superieure. Les triploides sont steriles au pollen.",
            },
            chemovar: {
                term: 'Chemovar',
                definition:
                    'Un systeme de classification base sur la composition chimique (profils de cannabinoides et de terpenes) plutot que la morphologie. Type I (dominance THC), Type II (equilibre), Type III (dominance CBD), Type IV (dominance CBG), Type V (sans cannabinoides).',
            },
            f1Hybrid: {
                term: 'Hybride F1',
                definition:
                    "Premiere generation filiale issue d'un croisement entre deux lignees parentales genetiquement distinctes et stables. Les hybrides F1 presentent une vigueur hybride (heterosis) avec une croissance uniforme, des rendements superieurs et des profils de cannabinoides reguliers.",
            },
        },
    },
    manual: {
        title: 'Manuel Utilisateur',
        toc: 'Aller a la Section',
        introduction: {
            title: 'Introduction et Philosophie',
            content: `Bienvenue dans CannaGuide 2025, votre copilote ultime pour la culture du cannabis. Ce manuel vous guide a travers les fonctionnalites avancees de l'app.<h4>Nos Principes Fondamentaux :</h4><ul><li><strong>Offline First :</strong> 100% de fonctionnalite sans connexion internet. Les actions sont mises en file d'attente et synchronisees ulterieurement. Une pile IA locale a trois couches garantit que les diagnostics et conseils restent disponibles meme sans reseau.</li><li><strong>Axe sur la Performance :</strong> Une UI fluide grace au dechargement des simulations complexes vers un Web Worker et une inference optimisee ONNX avec cache LRU.</li><li><strong>Souverainete des Donnees :</strong> Controle complet avec sauvegarde complete, restauration et synchronisation chiffree en un clic via GitHub Gist. Aucun serveur ne voit jamais vos donnees.</li><li><strong>IA Multi-Fournisseur :</strong> Apportez votre propre cle pour Google Gemini, OpenAI, Anthropic ou xAI/Grok -- ou utilisez la pile IA locale sur l'appareil sans aucune cle API requise.</li></ul>`,
        },
        general: {
            title: 'Fonctionnalites de la Plateforme',
            content: "Fonctionnalites qui ameliorent votre experience dans toute l'app.",
            pwa: {
                title: 'PWA et Fonctionnalite 100% Offline',
                content:
                    "Installez CannaGuide comme une <strong>Progressive Web App</strong> pour une experience native via l'icone dans l'en-tete. Le Service Worker robuste met en cache toutes les donnees, assurant une <strong>fonctionnalite 100% offline (hors requetes IA en direct)</strong>.",
            },
            commandPalette: {
                title: 'Palette de Commandes (Cmd/Ctrl + K)',
                content:
                    "Appuyez sur <code>Cmd/Ctrl + K</code> pour ouvrir la palette de commandes. C'est l'outil puissant pour la navigation instantanee et les actions sans quitter le clavier.",
            },
            voiceControl: {
                title: 'Controle Vocal et Parole',
                content:
                    "Controlez l'app en mains libres. Appuyez sur le <strong>bouton microphone</strong> dans l'en-tete pour activer l'ecoute. Vous pouvez aussi activer le <strong>Texte-a-Parole (TTS)</strong> dans les Parametres.",
            },
            dataManagement: {
                title: 'Souverainete des Donnees : Sauvegarde et Restauration',
                content:
                    "Sous <code>Parametres > Gestion des Donnees</code>, vous avez le controle total. Exportez tout l'etat de votre app comme fichier JSON pour <strong>sauvegarde</strong>. Importez ce fichier pour <strong>restaurer</strong> completement votre etat sur n'importe quel appareil.",
            },
            accessibility: {
                title: 'Accessibilite Amelioree',
                content:
                    "L'app offre des options d'accessibilite completes. Activez une <strong>police adaptee a la dyslexie</strong>, un <strong>mode mouvement reduit</strong>, divers <strong>filtres pour daltoniens</strong> et le <strong>Texte-a-Parole (TTS)</strong> integre.",
            },
            localAi: {
                title: 'IA Locale et Modeles Offline',
                content:
                    "CannaGuide embarque une <strong>pile IA locale a trois couches</strong> :<ol><li><strong>WebLLM</strong> -- Inference acceleree GPU via WebGPU (Qwen3-0.5B).</li><li><strong>Transformers.js</strong> -- Inference ONNX via WASM/WebGPU (Qwen2.5-1.5B-Instruct).</li><li><strong>Regles Heuristiques</strong> -- Analyse par mots-cles et VPD quand aucun modele n'est charge.</li></ol>Ouvrez <strong>Parametres -> General et UI</strong> pour precharger les modeles.",
            },
            cloudSync: {
                title: 'Synchronisation Cloud en un Clic',
                content:
                    "Sauvegardez tout l'etat de votre app dans un <strong>Gist prive GitHub</strong> en un seul clic. Ouvrez <strong>Parametres -> Gestion des Donnees</strong> et entrez un Token d'Acces Personnel GitHub avec la portee <code>gist</code>.",
            },
            multiProvider: {
                title: 'IA Multi-Fournisseur (BYOK)',
                content:
                    'CannaGuide supporte <strong>quatre fournisseurs IA cloud</strong> via un modele Apportez-Votre-Propre-Cle (BYOK) : Google Gemini, OpenAI, Anthropic et xAI/Grok. Changez de fournisseur dans <strong>Parametres -> IA</strong>.',
            },
            dailyStrains: {
                title: 'Mises a Jour Quotidiennes du Catalogue de Varietes',
                content:
                    'La bibliotheque de varietes est rafraichie automatiquement chaque jour a 04:20 UTC via un workflow GitHub Actions.',
            },
            proactiveCoach: {
                title: 'Coach Intelligent Proactif',
                content:
                    'Le Smart Coach surveille les valeurs environnementales de vos plantes (temperature, humidite, VPD, pH, EC) en temps reel. Lorsqu une metrique depasse les limites, le coach demande des conseils IA specifiques a la plante et envoie une <strong>Alerte Intelligente</strong>. Un temps de refroidissement de 2 heures par metrique et par plante previent la fatigue des alertes.',
            },
            voiceCommands: {
                title: 'Reference des Commandes Vocales',
                content:
                    'Le systeme vocal supporte 37 commandes de navigation, d actions et de requetes. Exemples : <ul><li><strong>Navigation :</strong> "Aller aux Varietes", "Ouvrir Parametres"</li><li><strong>Actions :</strong> "Arroser toutes les plantes", "Chercher Blue Dream"</li><li><strong>Controle :</strong> "Arreter d ecouter", "Annuler", "Oui/Confirmer"</li></ul>',
            },
        },
        strains: {
            title: 'Vue Varietes',
            content:
                "Le coeur de votre base de connaissances cannabis. Explorez plus de 700 varietes, ajoutez les votres et utilisez des outils d'analyse puissants.",
            library: {
                title: 'Bibliotheque (Toutes/Miennes/Favoris)',
                content:
                    'Basculez entre la bibliotheque complete, vos varietes personnalisees et vos favoris. Utilisez la recherche puissante et le tiroir de filtre avance.',
            },
            genealogy: {
                title: 'Explorateur de Genealogie',
                content:
                    "Visualisez le lignage genetique de n'importe quelle variete. Utilisez les <strong>Outils d'Analyse</strong> pour mettre en evidence les landraces et tracer l'heritage Sativa/Indica.",
            },
            aiTips: {
                title: 'Conseils de Culture IA',
                content:
                    "Generez des conseils de culture uniques propulses par l'IA pour n'importe quelle variete bases sur votre niveau d'experience et vos objectifs.",
            },
            exports: {
                title: 'Exportations et Gestion des Donnees',
                content:
                    "Selectionnez une ou plusieurs varietes et utilisez le bouton d'exportation pour generer un fichier PDF ou TXT.",
            },
            seedVault: {
                title: 'Coffre a Graines',
                content:
                    'Suivez vos resultats de recolte, gerez un journal de pollen et stockez les graines collectees de vos cultures. Le Coffre a Graines fournit un registre centralise de tout le materiel genetique que vous avez produit ou collecte.',
            },
        },
        plants: {
            title: 'Vue Plantes (La Salle de Culture)',
            content:
                "Votre centre de commandement pour gerer et simuler jusqu'a trois cultures simultanees.",
            dashboard: {
                title: 'Tableau de Bord et Signes Vitaux du Jardin',
                content:
                    'Obtenez un apercu rapide de la sante globale de votre jardin. Utilisez le <strong>Jauge VPD</strong> pour evaluer le potentiel de transpiration.',
            },
            simulation: {
                title: 'Simulation Avancee',
                content:
                    "L'app simule la croissance des plantes en temps reel basee sur des principes scientifiques comme le <strong>Deficit de Pression de Vapeur (VPD)</strong>.",
            },
            diagnostics: {
                title: 'Diagnostics IA et Conseiller',
                content:
                    'Utilisez les outils IA pour garder vos plantes en bonne sante. <strong>Diagnostic Photo</strong> et <strong>Conseiller Proactif</strong> basee sur les donnees en temps reel.',
            },
            journal: {
                title: 'Journal Complet',
                content:
                    "Enregistrez chaque action -- de l'arrosage a l'entrainement en passant par le controle des parasites.",
            },
            growPlanner: {
                title: 'Planificateur de Culture',
                content:
                    'Planifiez votre culture avec un calendrier base sur les taches. Creez des taches avec dates d echeance, marquez-les comme terminees et suivez les elements en retard avec des avertissements visuels.',
            },
            problemTracker: {
                title: 'Suivi des Problemes',
                content:
                    'Enregistrez et suivez les problemes de sante des plantes de l identification a la resolution. Creez des problemes avec descriptions et niveaux de gravite, ajoutez des enregistrements de traitement.',
            },
            qrTags: {
                title: 'Etiquettes QR de Plantes',
                content:
                    'Generez des etiquettes QR pour le suivi physique. Chaque etiquette encode le nom de la plante, la variete et un identifiant unique. Imprimez ou exportez en PDF.',
            },
            growRoom3d: {
                title: 'Salle de Culture 3D',
                content:
                    'Visualisez votre espace de culture dans un canevas 3D interactif avec camera orbitale automatique. Integre les badges de capteurs IoT pour le contexte environnemental en temps reel.',
            },
        },
        equipment: {
            title: "Vue Equipement (L'Atelier)",
            content:
                'Votre boite a outils pour planifier et optimiser votre installation de culture.',
            configurator: {
                title: "Configurateur IA d'Equipement",
                content:
                    "Repondez a quelques questions simples pour recevoir une liste d'equipement complete avec des marques specifiques de l'IA Gemini.",
            },
            calculators: {
                title: 'Calculateurs de Precision',
                content:
                    'Utilisez une suite de calculateurs pour <strong>Ventilation</strong>, <strong>Eclairage (PPFD/DLI)</strong>, <strong>Cout Electrique</strong>, <strong>Melange Nutritif</strong> et plus.',
            },
            shops: {
                title: 'Grow Shops et Banques de Graines',
                content:
                    'Parcourez des listes curatees et regionales de Grow Shops et Banques de Graines recommandes.',
            },
        },
        knowledge: {
            title: 'Vue Connaissances (La Bibliotheque)',
            content:
                'Votre ressource centrale pour apprendre, experimenter et maitriser la culture.',
            mentor: {
                title: 'Mentor IA Contextuel',
                content:
                    'Posez des questions de culture au Mentor IA. Selectionnez une de vos plantes actives pour une consultation personnalisee.',
            },
            breeding: {
                title: 'Laboratoire de Croisement',
                content:
                    'Croisez des graines recoltees pour creer une <strong>variete hybride permanente</strong> ajoutee a votre bibliotheque "Mes Varietes".',
            },
            sandbox: {
                title: 'Bac a Sable Interactif',
                content:
                    'Executez des scenarios "et si" sans risque. Clonez une plante active et executez une simulation acceleree de 14 jours.',
            },
            guide: {
                title: 'Guide de Culture Integre',
                content:
                    'Accedez a une reference complete incluant ce Manuel, un Lexique du Cultivateur, des guides visuels et une FAQ consultable.',
            },
        },
    },
}

export const visualGuides = {
    topping: {
        title: 'Topping',
        description:
            'Apprenez a couper le sommet de votre plante pour encourager une croissance plus buissonnante et plus de tetes principales.',
    },
    lst: {
        title: 'Low-Stress Training (LST)',
        description:
            "Pliez et attachez les branches de votre plante pour ouvrir la canopee et maximiser l'exposition a la lumiere.",
    },
    defoliation: {
        title: 'Defoliation',
        description:
            "Retirez strategiquement des feuilles pour ameliorer la circulation de l'air et permettre a plus de lumiere d'atteindre les sites de bourgeons inferieurs.",
    },
    harvesting: {
        title: 'Recolte',
        description:
            "Identifiez le moment parfait pour recolter afin de maximiser la puissance et l'arome de vos bourgeons.",
    },
}

export const faq = {
    phValue: {
        question: 'Pourquoi la valeur du pH est-elle si importante ?',
        answer: "Le pH de votre eau et de votre substrat determine la capacite de votre plante a absorber les nutriments. Un pH incorrect entraine un blocage des nutriments, meme s'ils sont presents en quantite suffisante. Pour la terre, la plage ideale est de 6.0-6.8 ; pour l'hydro/coco, c'est 5.5-6.5.",
    },
    yellowLeaves: {
        question: 'Que signifient les feuilles jaunes ?',
        answer: "Les feuilles jaunes (chlorose) peuvent avoir de nombreuses causes. Si elles commencent en bas et remontent, c'est souvent une carence en azote. Les taches peuvent indiquer une carence en calcium ou magnesium. L'arrosage excessif ou insuffisant peut aussi causer des feuilles jaunes. Verifiez toujours le pH et les habitudes d'arrosage en premier.",
    },
    whenToHarvest: {
        question: "Comment savoir quand c'est le moment de recolter ?",
        answer: 'Le meilleur indicateur sont les trichomes (les petits cristaux de resine sur les bourgeons). Utilisez une loupe. La recolte est optimale quand la plupart des trichomes sont blanc laiteux avec quelques-uns ambre. Les trichomes transparents sont trop tot ; trop de trichomes ambre donneront un effet plus sedatif.',
    },
    lightDistanceSeedling: {
        question: 'A quelle distance doit etre ma lumiere des semis ?',
        answer: "Cela depend beaucoup du type de lumiere et de la puissance. Une bonne regle pour la plupart des LED est une distance de 45-60 cm. Observez vos semis de pres. S'ils s'etirent trop, la lumiere est trop loin. Si les feuilles montrent des signes de brulure, elle est trop proche.",
    },
    whenToFeed: {
        question: 'Quand dois-je commencer a nourrir avec des nutriments ?',
        answer: "La plupart des terreaux pre-fertilises contiennent assez de nutriments pour les 2-3 premieres semaines. Pour les semis, attendez qu'ils aient 3-4 paires de vraies feuilles avant de commencer avec une solution nutritive tres faible (1/4 de la dose recommandee).",
    },
    npkMeaning: {
        question: 'Que signifient les chiffres N-P-K sur les engrais ?',
        answer: 'N-P-K signifie Azote (N), Phosphore (P) et Potassium (K). Ce sont les trois macronutriments primaires dont votre plante a besoin. <ul><li><strong>N (Azote) :</strong> Crucial pour la croissance vegetative.</li><li><strong>P (Phosphore) :</strong> Essentiel pour le developpement racinaire et la production de fleurs.</li><li><strong>K (Potassium) :</strong> Important pour la sante generale, la resistance aux maladies et la densite des fleurs.</li></ul>',
    },
    calmagUsage: {
        question: 'Quand et pourquoi utiliser du Cal-Mag ?',
        answer: "Le Cal-Mag est important lors de l'utilisation d'eau filtree (comme l'osmose inverse) ou de la culture en fibre de coco, qui tend a retenir le calcium. Les carences se manifestent souvent par de petites taches couleur rouille sur les feuilles.",
    },
    flushingPlants: {
        question: 'Qu\'est-ce que le "flushing" et dois-je le faire ?',
        answer: "Le flushing consiste a arroser la plante uniquement avec de l'eau pure a pH ajuste pendant les 1-2 dernieres semaines avant la recolte pour eliminer l'exces de sels nutritifs. C'est souvent inutile en culture organique en terre mais courant en hydroponie ou coco.",
    },
    vpdImportance: {
        question: "Qu'est-ce que le VPD et pourquoi devrais-je m'en preoccuper ?",
        answer: "Le VPD (Deficit de Pression de Vapeur) est une mesure avancee qui combine temperature et humidite pour decrire la \"soif\" de l'air. Un VPD optimal permet a la plante de transpirer efficacement. Un VPD trop eleve signifie que l'air est trop sec. Un VPD trop bas signifie que l'air est trop humide, augmentant le risque de moisissure.",
    },
    idealTempHumidity: {
        question: "Quels sont les niveaux ideaux de temperature et d'humidite ?",
        answer: 'Cela depend du stade :<ul><li><strong>Semis :</strong> 22-26 degres C, 70-80% HR</li><li><strong>Vegetatif :</strong> 22-28 degres C, 50-70% HR</li><li><strong>Floraison :</strong> 20-26 degres C, 40-50% HR</li><li><strong>Floraison Tardive :</strong> 18-24 degres C, 30-40% HR</li></ul>',
    },
    airCirculation: {
        question: "Quelle est l'importance de la circulation d'air ?",
        answer: 'Extremement importante. Un ou plusieurs ventilateurs oscillants dans la tente maintiennent l\'air en mouvement. Cela renforce les tiges, empeche les "poches" d\'humidite et reduit significativement le risque de moisissure et de parasites.',
    },
    nutrientBurn: {
        question: "Qu'est-ce que la brulure de nutriments ?",
        answer: "La brulure de nutriments se manifeste par des feuilles vert fonce avec des pointes brulees, jaunes ou brunes qui se recourbent souvent vers le haut. Cela signifie que la plante recoit plus de nutriments qu'elle ne peut en traiter. La solution est de reduire la concentration (EC) et/ou de rincer le substrat.",
    },
    spiderMites: {
        question: 'Comment detecter et combattre les acariens ?',
        answer: "Les acariens sont de minuscules parasites qui vivent sous les feuilles. Les signes precoces sont de petits points blancs ou jaunes sur les feuilles. En cas de forte infestation, vous verrez de fines toiles. L'huile de neem ou le savon insecticide peuvent les combattre. Bonne prevention : environnement propre et humidite pas trop basse.",
    },
    stretchingCauses: {
        question: "Pourquoi ma plante s'etire-t-elle autant ?",
        answer: 'L\'etirement excessif est presque toujours cause par une lumiere insuffisante. La plante "cherche" la source de lumiere. Rapprochez votre lumiere ou utilisez-en une plus puissante. Certaines varietes Sativa sont aussi genetiquement sujettes a l\'etirement.',
    },
    toppingVsFimming: {
        question: 'Quelle est la difference entre Topping et FIMing ?',
        answer: 'Les deux sont des techniques de "stress eleve". Avec le <strong>Topping</strong>, vous coupez nettement le sommet, obtenant deux nouvelles pousses principales. Avec le <strong>FIMing</strong>, vous pincez la pointe, obtenant potentiellement quatre nouvelles pousses ou plus.',
    },
    whatIsScrog: {
        question: "Qu'est-ce qu'un SCROG ?",
        answer: 'SCROG signifie "Screen of Green". C\'est une technique avancee ou un filet est place horizontalement au-dessus des plantes. Les pousses sont guidees horizontalement sous le filet pour creer une canopee plate et uniforme, maximisant le rendement.',
    },
    whatIsLollipopping: {
        question: 'Que signifie "lollipopping" ?',
        answer: 'Le "lollipopping" consiste a retirer toutes les feuilles et petites pousses inferieures qui sont a l\'ombre. Cela concentre l\'energie de la plante sur les fleurs superieures, resultant en des tetes principales plus grosses et denses.',
    },
    dryingDuration: {
        question: 'Combien de temps dois-je secher ma recolte ?',
        answer: "Le sechage prend generalement 7-14 jours. L'objectif est un sechage lent et controle dans un espace sombre et frais a environ 18-20 degres C et 55-60% d'humidite. Le \"test de la tige\" : si les petites tiges cassent plutot que de simplement plier, les bourgeons sont prets pour l'affinage.",
    },
    curingImportance: {
        question: "Pourquoi l'affinage est-il si important ?",
        answer: "L'affinage est crucial pour la qualite finale. Pendant ce processus en bocaux hermetiques, les bacteries decomposent la chlorophylle. Cela donne une fumee beaucoup plus douce et permet au profil terpenique de se developper pleinement. Un bon affinage fait la difference entre un cannabis mediocre et premium.",
    },
    storageHarvest: {
        question: 'Comment conserver ma recolte terminee ?',
        answer: "Apres l'affinage, conservez les bourgeons dans des contenants en verre hermetiques dans un endroit frais et sombre. Temperature ideale : en dessous de 21 degres C. Des sachets d'humidite (ex. 62% HR) dans les bocaux maintiennent le niveau d'humidite parfait.",
    },
    autoflowerVsPhotoperiod: {
        question: 'Autofloraison vs. Photoperiode : quelle difference ?',
        answer: 'Les plantes <strong>Photoperiode</strong> necessitent un changement de cycle lumineux (12h lumiere / 12h obscurite) pour fleurir. Les <strong>Autofloraisons</strong> fleurissent automatiquement apres un certain temps, independamment du cycle lumineux. Plus rapides et plus petites, souvent plus faciles pour les debutants, mais rendement generalement moindre.',
    },
    howOftenToWater: {
        question: 'A quelle frequence dois-je arroser ?',
        answer: "Il n'y a pas de planning fixe. La meilleure methode est de soulever le pot et sentir son poids. Arrosez abondamment jusqu'au drainage, puis attendez que le pot soit nettement plus leger. Enfoncez aussi votre doigt a 2-3 cm dans le substrat ; s'il ressort sec, il est probablement temps d'arroser.",
    },
    potSize: {
        question: 'Quelle taille de pot choisir ?',
        answer: "<ul><li><strong>Autofloraisons :</strong> Pots de 10-15 litres ideaux, car elles n'aiment pas etre transplantees.</li><li><strong>Photoperiodes :</strong> Commencez en petits pots (1-3 litres) et transplantez 1-2 fois vers 15-25 litres pour le stade final.</li></ul>",
    },
    localAiFallback: {
        question: 'Que se passe-t-il si Gemini est indisponible ?',
        answer: "CannaGuide bascule automatiquement sur la pile IA locale. L'app utilise l'analyse heuristique des plantes pour que les diagnostics et conseils restent disponibles.",
    },
    localAiPreload: {
        question: "Comment utiliser l'IA locale offline ?",
        answer: 'Ouvrez Parametres -> General et UI et appuyez sur <strong>Precharger les Modeles Offline</strong> pendant que vous etes en ligne.',
    },
    localAiStorage: {
        question: 'Combien de stockage les modeles locaux necessitent-ils ?',
        answer: "Prevoyez environ quelques centaines de megaoctets de stockage navigateur. Utilisez un appareil avec suffisamment d'espace libre et le stockage persistant active.",
    },
    localAiWebGpu: {
        question: 'Ai-je besoin de WebGPU ?',
        answer: "Non. WebGPU permet l'utilisation du runtime WebLLM, mais l'app bascule automatiquement sur Transformer.js si WebGPU n'est pas disponible.",
    },
    localAiTroubleshooting: {
        question: 'Que faire si le prechargement du modele offline echoue ?',
        answer: "Reessayez avec une connexion stable, verifiez que le stockage du navigateur n'est pas plein et que l'appareil a l'autorisation de stocker de maniere persistante.",
    },
    localAiSemanticRag: {
        question: "Qu'est-ce que le RAG Semantique ?",
        answer: "Le RAG Semantique utilise un modele d'embeddings local (MiniLM) pour trouver les entrees de journal les plus pertinentes par signification -- pas seulement par mots-cles.",
    },
    localAiSentiment: {
        question: "A quoi sert l'analyse de sentiment du journal ?",
        answer: 'Le modele de sentiment local analyse le ton emotionnel de vos entrees de journal pour detecter des tendances au fil du temps.',
    },
    localAiSummarization: {
        question: 'Comment fonctionne la synthese de texte locale ?',
        answer: 'Le modele de synthese condense les longs journaux de culture et historiques de chat en resumes concis.',
    },
    localAiQueryRouting: {
        question: "Qu'est-ce que le routage intelligent des requetes ?",
        answer: 'Le modele de classification zero-shot categorise automatiquement vos questions pour des reponses plus pertinentes -- meme sans connexion internet.',
    },
    localAiPersistentCache: {
        question: "Qu'est-ce que le cache d'inference persistant ?",
        answer: "Les reponses IA sont stockees dans IndexedDB pour que les questions identiques soient repondues instantanement -- meme apres rechargement. Le cache contient jusqu'a 256 entrees.",
    },
    localAiTelemetry: {
        question: 'Que mesure la telemetrie IA locale ?',
        answer: "La telemetrie mesure la vitesse d'inference, le debit de tokens et les taux de cache -- tout localement sur votre appareil. Aucune donnee ne quitte jamais le navigateur.",
    },
    cloudSync: {
        question: 'Comment fonctionne la Synchronisation Cloud en un Clic ?',
        answer: "CannaGuide sauvegarde tout l'etat dans un <strong>Gist prive GitHub</strong>. Ouvrez Parametres -> Gestion des Donnees, ajoutez un Token d'Acces Personnel GitHub avec portee <code>gist</code>.",
    },
    multiProviderAi: {
        question: "Puis-je utiliser un autre fournisseur d'IA ?",
        answer: 'Oui. CannaGuide supporte <strong>Google Gemini, OpenAI, Anthropic et xAI/Grok</strong> via un modele BYOK. Changez dans Parametres -> IA. Toutes les cles API sont chiffrees avec AES-256-GCM.',
    },
    forceWasm: {
        question: 'A quoi sert le toggle Forcer WASM ?',
        answer: "Il verrouille le backend d'inference sur WASM meme quand WebGPU est detecte. Utilisez-le quand WebGPU cause des plantages.",
    },
    visionClassification: {
        question: 'Comment fonctionne le diagnostic de plantes par photo offline ?',
        answer: "L'app utilise un modele de vision CLIP-ViT-L-14 qui reconnait 33 etiquettes specifiques au cannabis. Le modele s'execute entierement dans le navigateur via ONNX.",
    },
}
