export const helpView = {
    title: 'Help & Support',
    subtitle: 'Find answers to your questions and learn more about cultivation.',
    tabs: {
        faq: 'FAQ',
        guides: 'Visual Guides',
        lexicon: 'Lexicon',
        manual: 'User Manual',
        screenshots: 'Screenshots',
        faqDescription: 'Quick answers to the most common questions about the app and growing.',
        guidesDescription:
            'Step-by-step visual walkthroughs for training techniques and app workflows.',
        lexiconDescription:
            'A comprehensive glossary of cannabinoids, terpenes, flavonoids, and grow terms.',
        manualDescription: 'The complete user manual covering every feature of the app in detail.',
        screenshotsDescription: 'Screenshots of every app screen in desktop and mobile viewports.',
    },
    itemCount: '{{count}} items',
    termCount: '{{count}} terms',
    sectionCount: '{{count}} sections',
    subSectionCount: '{{count}} sub-sections',
    guideCount: '{{count}} guides',
    screenshotCount: '{{count}} screenshots',
    faq: {
        title: 'Frequently Asked Questions',
        subtitle: 'Split into app operations, AI/offline support, and cultivation topics.',
        searchPlaceholder: 'Search questions...',
        noResults: 'No results found for "{{term}}".',
        expandAll: 'Expand All',
        collapseAll: 'Collapse All',
        resultCount: '{{count}} questions found',
        resultCountFiltered: '{{count}} of {{total}} questions match',
        groups: {
            localAi: 'Local AI, Sync & App Recovery',
            grow: 'Cultivation & Plant Care',
        },
    },
    guides: {
        title: 'Visual Guides',
        subtitle: 'Step-by-step visual guides for essential cultivation techniques.',
    },
    lexicon: {
        title: "Grower's Lexicon",
        subtitle:
            'Explore the science behind cannabinoids, terpenes, flavonoids, and essential grow terminology.',
        searchPlaceholder: 'Search terms...',
        noResults: 'No terms found for "{{term}}".',
        resultCount: 'Showing {{count}} of {{total}} terms',
        categories: {
            all: 'All',
            cannabinoid: 'Cannabinoids',
            terpene: 'Terpenes',
            flavonoid: 'Flavonoids',
            nutrient: 'Nutrients',
            disease: 'Diseases',
            general: 'General',
        },
        cannabinoids: {
            thc: {
                term: 'THC (Tetrahydrocannabinol)',
                definition:
                    'The most well-known and primary psychoactive cannabinoid in cannabis, responsible for the "high" sensation.',
            },
            cbd: {
                term: 'CBD (Cannabidiol)',
                definition:
                    'A non-psychoactive cannabinoid known for its therapeutic properties, including analgesic and anti-inflammatory effects.',
            },
            cbg: {
                term: 'CBG (Cannabigerol)',
                definition:
                    'A non-psychoactive cannabinoid often referred to as the "mother of all cannabinoids" because it is a precursor to THC and CBD.',
            },
            cbn: {
                term: 'CBN (Cannabinol)',
                definition:
                    'A mildly psychoactive cannabinoid that forms as THC degrades. It is known for its sedative properties.',
            },
            cbc: {
                term: 'CBC (Cannabichromene)',
                definition:
                    'A non-psychoactive cannabinoid that shows potential for anti-inflammatory and pain-relieving effects.',
            },
            thca: {
                term: 'THCA (Tetrahydrocannabinolic Acid)',
                definition:
                    'The non-psychoactive, acidic precursor to THC found in raw cannabis. It converts to THC through heat (decarboxylation).',
            },
            cbda: {
                term: 'CBDA (Cannabidiolic Acid)',
                definition:
                    'The acidic precursor to CBD found in raw cannabis. It has its own potential therapeutic effects, particularly anti-inflammatory.',
            },
            thcv: {
                term: 'THCV (Tetrahydrocannabivarin)',
                definition:
                    'A cannabinoid structurally similar to THC but with different effects. It is known to be an appetite suppressant and can be psychoactive in high doses.',
            },
            cbdv: {
                term: 'CBDV (Cannabidivarin)',
                definition:
                    'A non-psychoactive cannabinoid structurally similar to CBD, being studied for its potential in treating neurological conditions.',
            },
        },
        terpenes: {
            myrcene: {
                term: 'Myrcene',
                definition:
                    'A common terpene with an earthy, musky aroma. Also found in mangoes. Known for its calming and relaxing properties.',
            },
            limonene: {
                term: 'Limonene',
                definition:
                    'A terpene with a strong citrus aroma. It is known for its mood-elevating and stress-relieving effects.',
            },
            caryophyllene: {
                term: 'Caryophyllene',
                definition:
                    'A terpene with a spicy, peppery aroma. It is the only terpene that can also bind to cannabinoid receptors and has anti-inflammatory properties.',
            },
            pinene: {
                term: 'Pinene',
                definition:
                    'A terpene with a fresh pine aroma. It may promote alertness and has anti-inflammatory properties.',
            },
            linalool: {
                term: 'Linalool',
                definition:
                    'A terpene with a floral, lavender-like aroma. It is known for its calming, anti-anxiety, and sleep-promoting effects.',
            },
            terpinolene: {
                term: 'Terpinolene',
                definition:
                    'A terpene with a complex, fruity-floral aroma. It often has a slightly uplifting effect and antioxidant properties.',
            },
            humulene: {
                term: 'Humulene',
                definition:
                    'A terpene with an earthy, woody aroma, also found in hops. It is known for its anti-inflammatory and appetite-suppressant properties.',
            },
            ocimene: {
                term: 'Ocimene',
                definition:
                    'A terpene with a sweet, herbaceous, and woody aroma. It can have uplifting effects and is studied for its antiviral properties.',
            },
            bisabolol: {
                term: 'Bisabolol',
                definition:
                    'A terpene with a light, sweet, floral aroma, also found in chamomile. It is known for its anti-inflammatory and skin-soothing properties.',
            },
            nerolidol: {
                term: 'Nerolidol',
                definition:
                    'A terpene with a woody, floral aroma reminiscent of tree bark. It has sedative and anti-anxiety properties.',
            },
        },
        flavonoids: {
            cannaflavin: {
                term: 'Cannaflavins (A, B, C)',
                definition:
                    'A group of flavonoids found exclusively in cannabis. They have potent anti-inflammatory properties.',
            },
            quercetin: {
                term: 'Quercetin',
                definition:
                    'A flavonoid found in many fruits and vegetables. It is a powerful antioxidant with antiviral properties.',
            },
            kaempferol: {
                term: 'Kaempferol',
                definition:
                    'A flavonoid with strong antioxidant properties that may help prevent oxidative stress.',
            },
            apigenin: {
                term: 'Apigenin',
                definition:
                    'A flavonoid with anti-anxiety and sedative properties, also found in chamomile.',
            },
            luteolin: {
                term: 'Luteolin',
                definition: 'A flavonoid with antioxidant and anti-inflammatory properties.',
            },
            orientin: {
                term: 'Orientin',
                definition:
                    'A flavonoid with antioxidant, anti-inflammatory, and potential antibiotic properties.',
            },
            vitexin: {
                term: 'Vitexin',
                definition: 'A flavonoid that may exhibit pain-relieving and antioxidant effects.',
            },
        },
        general: {
            phValue: {
                term: 'pH Value',
                definition:
                    'A measure of the acidity or alkalinity of a solution. In cannabis cultivation, a correct pH is crucial for nutrient uptake.',
            },
            ecValue: {
                term: 'EC (Electrical Conductivity)',
                definition:
                    'A measure of the total amount of dissolved salts (nutrients) in a solution. It helps monitor nutrient concentration.',
            },
            vpd: {
                term: 'VPD (Vapor Pressure Deficit)',
                definition:
                    'A measure of the combined pressure of temperature and humidity on the plant. An optimal VPD value allows for efficient transpiration.',
            },
            trichomes: {
                term: 'Trichomes',
                definition:
                    'The small, resinous glands on the flowers and leaves of cannabis that produce cannabinoids and terpenes. Their color is a key indicator of maturity.',
            },
            topping: {
                term: 'Topping',
                definition:
                    'A training technique where the top tip of the plant is cut off to encourage the growth of two new main colas, creating a bushier shape.',
            },
            fimming: {
                term: 'FIM (F*ck I Missed)',
                definition:
                    'A technique similar to topping, but where only part of the tip is removed, often resulting in four or more new main shoots.',
            },
            lst: {
                term: 'LST (Low-Stress Training)',
                definition:
                    'A training technique where branches are gently bent down and tied, creating a wider, flatter canopy and maximizing light exposure.',
            },
            lollipopping: {
                term: 'Lollipopping',
                definition:
                    "The removal of lower leaves and small shoots that receive little light to focus the plant's energy on the upper, larger flowers.",
            },
            scrog: {
                term: 'SCROG (Screen of Green)',
                definition:
                    'An advanced training technique where a net or screen is placed over the plants to guide the shoots horizontally, creating an even, productive canopy.',
            },
            sog: {
                term: 'SOG (Sea of Green)',
                definition:
                    'A cultivation method where many small plants are grown closely together and quickly sent into flowering to achieve a fast and high-yielding harvest.',
            },
            curing: {
                term: 'Curing',
                definition:
                    'The process of storing dried cannabis flowers in airtight containers to break down chlorophyll and improve the taste, aroma, and smoothness of the smoke.',
            },
            nutrientLockout: {
                term: 'Nutrient Lockout',
                definition:
                    'A state where the plant cannot absorb available nutrients due to an incorrect pH in the root zone, even if they are present.',
            },
            flushing: {
                term: 'Flushing',
                definition:
                    'The practice of watering the plant with only pure, pH-adjusted water for the last one to two weeks before harvest to remove excess nutrient salts from the medium and the plant.',
            },
            phenotype: {
                term: 'Phenotype',
                definition:
                    'The observable characteristics of a plant (appearance, smell, effect) that result from the interaction of its genotype and the environment.',
            },
            genotype: {
                term: 'Genotype',
                definition:
                    'The genetic makeup of a plant, which determines its potential for certain traits.',
            },
            landrace: {
                term: 'Landrace',
                definition:
                    'A pure, original cannabis variety that has naturally adapted and stabilized in a specific geographic region over a long period.',
            },
            dynamicLighting: {
                term: 'Dynamic Lighting',
                definition:
                    'LED lighting systems that automatically adjust their spectral output based on the plant growth phase and environmental conditions (VPD). Blue-dominant for vegetative growth, red-dominant for flowering.',
            },
            digitalTwin: {
                term: 'Digital Twin',
                definition:
                    'A virtual replica of a grow environment built from real-time sensor data. Used to simulate what-if scenarios (CO2 changes, temperature adjustments) and predict their impact on yield before making real changes.',
            },
            aeroponics: {
                term: 'Aeroponics',
                definition:
                    'A soilless growing method where plant roots are suspended in air and nutrients are delivered via a fine mist. Achieves up to 30% faster growth with 90% less water than traditional soil methods.',
            },
            smartFertigation: {
                term: 'Smart Fertigation',
                definition:
                    'An automated system that combines irrigation with precision nutrient dosing, using EC/pH sensors and closed-loop control to maintain optimal nutrient levels in real-time.',
            },
            tissueCulture: {
                term: 'Tissue Culture',
                definition:
                    'A sterile laboratory technique (micropropagation) for producing virus-free, genetically identical clones from tiny plant tissue samples, enabling massive scaling of elite genetics.',
            },
            ppfd: {
                term: 'PPFD (Photosynthetic Photon Flux Density)',
                definition:
                    'A measure of the amount of photosynthetically active radiation (PAR) that reaches a surface per second, measured in umol/m2/s. The key metric for evaluating grow light performance.',
            },
            dli: {
                term: 'DLI (Daily Light Integral)',
                definition:
                    'The total amount of photosynthetically active photons delivered to a surface over a 24-hour period, measured in mol/m2/day. Combines PPFD and photoperiod to quantify total light energy.',
            },
            polyploidy: {
                term: 'Polyploidy',
                definition:
                    'A condition where organisms have more than two complete sets of chromosomes. In cannabis, triploid (3n), tetraploid (4n), and hexaploid (6n) plants can produce up to 65% more cannabinoids and higher biomass. Triploids are pollen-sterile.',
            },
            autoflowering: {
                term: 'Autoflowering',
                definition:
                    'Cannabis genetics carrying Ruderalis traits that flower based on age rather than light cycle changes. Modern autoflowers (2026) match photoperiod strains in potency and terpene richness with 75-90 day seed-to-harvest cycles.',
            },
            chemovar: {
                term: 'Chemovar',
                definition:
                    'A classification system based on chemical composition (cannabinoid and terpene profiles) rather than morphology. Type I (THC-dominant), Type II (balanced), Type III (CBD-dominant), Type IV (CBG-dominant), Type V (no cannabinoids).',
            },
            f1Hybrid: {
                term: 'F1 Hybrid',
                definition:
                    'First filial generation cross between two genetically distinct, stable parent lines. F1 hybrids exhibit hybrid vigor (heterosis) with uniform growth, higher yields, and consistent cannabinoid profiles.',
            },
        },
        nutrients: {
            nitrogen: {
                term: 'Nitrogen (N)',
                definition:
                    'The primary macronutrient responsible for leafy green growth, chlorophyll production, and protein synthesis. High demand during vegetative stage, reduced in late flower.',
            },
            phosphorus: {
                term: 'Phosphorus (P)',
                definition:
                    'A primary macronutrient essential for root development, energy transfer (ATP), and flowering/fruiting. Demand increases significantly during the bloom phase.',
            },
            potassium: {
                term: 'Potassium (K)',
                definition:
                    'A primary macronutrient involved in water regulation, enzyme activation, and nutrient transport. Critical for overall plant health and quality bud development.',
            },
            calcium: {
                term: 'Calcium (Ca)',
                definition:
                    'A secondary macronutrient needed for cell wall structure and stability. Immobile in the plant, so deficiency always shows on new growth. Cal-Mag supplements address this.',
            },
            magnesium: {
                term: 'Magnesium (Mg)',
                definition:
                    'A secondary macronutrient and the central atom of chlorophyll molecules. Deficiency causes interveinal chlorosis (yellowing between veins) on older leaves.',
            },
            sulfur: {
                term: 'Sulfur (S)',
                definition:
                    'A secondary macronutrient required for amino acid and protein synthesis. Deficiency shows as yellowing of new growth.',
            },
            iron: {
                term: 'Iron (Fe)',
                definition:
                    'An essential micronutrient for chlorophyll synthesis and enzyme function. Deficiency (interveinal chlorosis on new leaves) is most commonly caused by high pH.',
            },
            zinc: {
                term: 'Zinc (Zn)',
                definition:
                    'A micronutrient involved in enzyme function and growth hormone production. Deficiency causes stunted new leaves with interveinal chlorosis.',
            },
            manganese: {
                term: 'Manganese (Mn)',
                definition:
                    'A micronutrient involved in photosynthesis and nitrogen metabolism. Deficiency looks similar to iron deficiency but appears slightly further down the plant.',
            },
            boron: {
                term: 'Boron (B)',
                definition:
                    'A micronutrient essential for cell wall formation and pollen viability. Deficiency causes abnormal, distorted new growth.',
            },
            copper: {
                term: 'Copper (Cu)',
                definition:
                    'A micronutrient required for photosynthesis and respiration. Deficiency is rare but causes dark blue-green, wilting leaves with downward curl.',
            },
            molybdenum: {
                term: 'Molybdenum (Mo)',
                definition:
                    'A micronutrient needed for nitrogen metabolism. Deficiency causes cupping and pale yellow discoloration, starting with older leaves.',
            },
            silica: {
                term: 'Silica (SiO2)',
                definition:
                    'A beneficial mineral that strengthens cell walls, improves heat and drought tolerance, and increases resistance to pests and pathogens. Not technically essential but highly beneficial.',
            },
            calMag: {
                term: 'Cal-Mag Supplement',
                definition:
                    'A combined Calcium and Magnesium supplement widely used with RO/distilled water and coco coir, where these elements are naturally deficient or unavailable.',
            },
            npk: {
                term: 'NPK Ratio',
                definition:
                    'The standardized ratio of Nitrogen (N), Phosphorus (P), and Potassium (K) in a fertilizer. e.g., 3-1-2 for veg, 1-3-2 for bloom.',
            },
            micronutrients: {
                term: 'Micronutrients (Trace Elements)',
                definition:
                    'Nutrients required in very small amounts including Iron, Zinc, Manganese, Boron, Copper, Molybdenum, and Chlorine. Often included in chelated form in quality nutrient formulas.',
            },
        },
        diseases: {
            nutrientBurn: {
                term: 'Nutrient Burn',
                definition:
                    'Occurs when the nutrient solution EC/PPM is too high, causing crispy brown leaf tips and an upward curl. Treat by flushing the medium and reducing feed strength.',
            },
            nutrientDeficiency: {
                term: 'Nutrient Deficiency',
                definition:
                    'A condition where the plant lacks one or more essential nutrients, causing characteristic symptoms. Often caused by incorrect pH rather than actual nutrient absence.',
            },
            powderyMildew: {
                term: 'Powdery Mildew (PM)',
                definition:
                    'A fungal disease appearing as white powdery spots on leaves. Thrives in high humidity and poor airflow. Treat with potassium bicarbonate or neem oil.',
            },
            botrytis: {
                term: 'Botrytis (Bud Rot)',
                definition:
                    'A devastating grey mold fungus that attacks inside dense buds in humid conditions. Immediate removal of affected material is critical to prevent spread.',
            },
            rootRot: {
                term: 'Root Rot (Pythium)',
                definition:
                    'A water mold causing roots to turn brown, slimy, and foul-smelling. Caused by overwatering, poor drainage, or warm hydroponic reservoir temperatures.',
            },
            spiderMites: {
                term: 'Spider Mites',
                definition:
                    'Tiny arachnid pests that create stippling damage on leaves and fine webbing. Thrive in hot, dry conditions. Treat with neem oil or insecticidal soap.',
            },
            fungusGnats: {
                term: 'Fungus Gnats',
                definition:
                    'Small flies whose larvae damage roots in moist soil. A sign of overwatering. Allow soil surface to dry and use yellow sticky traps to manage adults.',
            },
            aphids: {
                term: 'Aphids',
                definition:
                    'Soft-bodied insects that cluster on new growth and secrete sticky honeydew. Treat with insecticidal soap, neem oil, or beneficial predatory insects.',
            },
            thrips: {
                term: 'Thrips',
                definition:
                    'Tiny insects that leave silver streak feeding scars on leaves. Treat with spinosad or predatory mites. Strict quarantine on new clones prevents introduction.',
            },
            heatStress: {
                term: 'Heat Stress',
                definition:
                    'Occurs when canopy temperatures exceed 28-30C, causing leaf edge curl (taco-ing). Improve ventilation, raise lights, and consider air conditioning.',
            },
            lightBurn: {
                term: 'Light Burn',
                definition:
                    'Bleached white or yellow patches on the uppermost leaves caused by lights being too close or having excessive PPFD. Raise the light to fix.',
            },
            phLockout: {
                term: 'pH Lockout',
                definition:
                    'Multiple simultaneous deficiencies caused by the root zone pH being outside the optimal range. Flush and reset pH to fix. The most common cause of apparent deficiencies.',
            },
            septoria: {
                term: 'Septoria (Yellow Leaf Spot)',
                definition:
                    'A fungal disease causing small yellow or brown circular spots on lower leaves. Spreads upward. Improve airflow, remove affected leaves, and avoid wetting foliage.',
            },
        },
    },
    screenshots: {
        title: 'Screenshots',
        subtitle: 'Browse all app screens in desktop and mobile viewports.',
        allCategories: 'All',
        noResults: 'No screenshots found.',
        lightboxLabel: 'Screenshot preview',
        resultCount: '{{count}} of {{total}} screenshots',
        categories: {
            plants: 'Plants',
            strains: 'Strains',
            equipment: 'Equipment',
            knowledge: 'Knowledge',
            settings: 'Settings',
            help: 'Help',
        },
        viewport: {
            all: 'All',
            desktop: 'Desktop',
            mobile: 'Mobile',
        },
    },
    manual: {
        title: 'User Manual',
        toc: 'Jump to Section',
        introduction: {
            title: 'Introduction & Philosophy',
            content: `Welcome to CannaGuide 2025, your ultimate co-pilot for cannabis cultivation. This manual guides you through the app's advanced features.<h4>Our Core Principles:</h4><ul><li><strong>Offline First:</strong> 100% functionality without an internet connection. Actions are queued and synced later. A three-layer local AI stack ensures diagnostics and advice stay available even without network.</li><li><strong>Performance-Driven:</strong> A fluid UI thanks to offloading complex simulations to a Web Worker and ONNX-optimised inference with LRU caching.</li><li><strong>Data Sovereignty:</strong> Complete control with full backup, restore, and encrypted one-tap cloud sync via GitHub Gist. No server ever sees your data.</li><li><strong>Multi-Provider AI:</strong> Bring your own key for Google Gemini, OpenAI, Anthropic, or xAI/Grok — or use the on-device local AI stack with zero API keys required.</li></ul>`,
        },
        general: {
            title: 'Platform-Wide Features',
            content: 'Features that enhance your experience throughout the app.',
            pwa: {
                title: 'PWA & 100% Offline Functionality',
                content:
                    'Install CannaGuide as a <strong>Progressive Web App</strong> for a native app experience via the header icon. The robust Service Worker caches all app data, including your plants, notes, and even AI archives, ensuring <strong>100% offline functionality (excluding live AI requests)</strong>.',
            },
            commandPalette: {
                title: 'Command Palette (Cmd/Ctrl + K)',
                content:
                    'Press <code>Cmd/Ctrl + K</code> to open the command palette. This is the power-user tool for instant navigation and actions, like searching strains or watering plants, without leaving the keyboard.',
            },
            voiceControl: {
                title: 'Voice Control & Speech',
                content:
                    'Control the app hands-free. Press the <strong>microphone button</strong> in the header to activate listening and speak commands like "Go to Strains" or "Search for Blue Dream". You can also enable <strong>Text-to-Speech (TTS)</strong> in Settings to have guides, AI advice, and descriptions read aloud.',
            },
            dataManagement: {
                title: 'Data Sovereignty: Backup & Restore',
                content:
                    'Under <code>Settings > Data Management</code>, you have full control. Export your entire app state (plants, settings, etc.) as a single JSON file for <strong>backup</strong>. Import this file later to fully <strong>restore</strong> your state on any device.',
            },
            accessibility: {
                title: 'Enhanced Accessibility',
                content:
                    'The app offers comprehensive accessibility options in Settings. Activate a <strong>dyslexia-friendly font</strong>, a <strong>reduced motion mode</strong>, various <strong>colorblind filters</strong>, and use the integrated <strong>Text-to-Speech (TTS)</strong> feature to have content read aloud.',
            },
            localAi: {
                title: 'Local AI Fallback & Offline Models',
                content:
                    'CannaGuide ships a <strong>three-layer local AI stack</strong> so advice never stops:<ol><li><strong>WebLLM</strong> — GPU-accelerated inference via WebGPU (Qwen3-0.5B). Best quality on high-end devices.</li><li><strong>Transformers.js</strong> — ONNX-based WASM/WebGPU inference (Qwen2.5-1.5B-Instruct). Works on every modern browser.</li><li><strong>Heuristic Rules</strong> — Keyword and VPD-based analysis when no model is loaded.</li></ol>Open <strong>Settings → General & UI</strong> to preload models while online. The <strong>Force WASM</strong> toggle locks inference to WASM when WebGPU causes instability. CLIP-ViT-L-14 handles vision classification with 33 cannabis-specific labels. Inference results are cached in an LRU-64 cache to avoid repeat work.',
            },
            cloudSync: {
                title: 'One-Tap Cloud Sync',
                content:
                    'Back up your entire app state to a <strong>private GitHub Gist</strong> with a single tap. Open <strong>Settings → Data Management</strong> and enter a GitHub Personal Access Token with <code>gist</code> scope. The app creates or updates a private Gist that you own — your data never touches a third-party server. Restore on any device by importing from the same Gist.',
            },
            multiProvider: {
                title: 'Multi-Provider AI (BYOK)',
                content:
                    'CannaGuide supports <strong>four cloud AI providers</strong> through a Bring-Your-Own-Key (BYOK) model: Google Gemini, OpenAI, Anthropic, and xAI/Grok. Switch providers in <strong>Settings → AI</strong>. API keys are encrypted at rest with AES-256-GCM through the integrated crypto service. All providers share the same rate limiter (15 req/min sliding window) and the same local AI fallback chain.',
            },
            dailyStrains: {
                title: 'Daily Strain Catalog Updates',
                content:
                    'The strain library is refreshed automatically every day at 04:20 UTC via a GitHub Actions workflow. New community-contributed strains are validated for duplicates and merged into the catalog. You receive the latest additions through the next PWA update without any manual action.',
            },
        },
        strains: {
            title: 'Strains View',
            content:
                'The heart of your cannabis knowledge base. Explore over 700 strains, add your own, and use powerful analysis tools.',
            library: {
                title: 'Library (All/My/Favorites)',
                content:
                    'Toggle between the full library, your custom-added strains, and your favorites. Use the powerful search, alphabetical filter, and the advanced filter drawer to find exactly what you need. Switch between list and grid views for your preferred layout.',
            },
            genealogy: {
                title: 'Genealogy Explorer',
                content:
                    "Visualize any strain's genetic lineage. Use the <strong>Analysis Tools</strong> to highlight landraces, trace Sativa/Indica heritage, and calculate the genetic influence of top ancestors. You can also discover known descendants of a selected strain.",
            },
            aiTips: {
                title: 'AI Grow Tips',
                content:
                    'Generate unique, AI-powered cultivation advice for any strain based on your experience level and goals. Each request also generates a unique, artistic image for the strain. Save your favorite tips to the "Tips" archive for offline access.',
            },
            exports: {
                title: 'Exports & Data Management',
                content:
                    'Select one or more strains and use the export button in the toolbar to generate a PDF or TXT file. Manage all your past exports in the "Exports" tab, where you can re-download or delete them.',
            },
            geneticTrends: {
                title: 'Genetics 2026 Trends',
                content:
                    'Explore the latest cannabis genetic trends for 2026 in a dedicated tab. Covers terpene diversity (savory/gassy aromas), ultra-high potency with full-spectrum effects, balanced hybrids for intentional consumption, the autoflowering revolution, advanced breeding techniques (polyploidy, F1 hybrids, marker-assisted selection), and the landrace revival movement. Each trend includes detailed descriptions, key examples, and relevance ratings.',
            },
        },
        plants: {
            title: 'Plants View (The Grow Room)',
            content:
                'Your command center for managing and simulating up to three simultaneous grows.',
            dashboard: {
                title: 'Dashboard & Garden Vitals',
                content:
                    'Get a quick overview of your garden\'s overall health, active plant count, and average environment. Use the <strong>VPD Gauge</strong> to assess the transpiration potential. Here, you can also perform global actions like "Water All Plants" or request an AI status summary.',
            },
            simulation: {
                title: 'Advanced Simulation',
                content:
                    "The app simulates plant growth in real-time based on scientific principles like <strong>Vapor Pressure Deficit (VPD)</strong>. This value combines temperature and humidity to determine the plant's ability to transpire. Switch to the <strong>Expert Profile</strong> in <code>Settings > Plants & Simulation</code> to reveal and adjust advanced physics parameters for a more granular simulation.",
            },
            diagnostics: {
                title: 'AI Diagnostics & Advisor',
                content:
                    "Use AI tools to keep your plants healthy.<ul><li><strong>Photo Diagnosis:</strong> Upload a photo of a leaf or problem area to get an instant AI-based diagnosis.</li><li><strong>Proactive Advisor:</strong> Get data-driven advice from the AI based on your plant's real-time vitals and recent history.</li></ul>All AI responses can be saved to the Advisor Archive.",
            },
            journal: {
                title: 'Comprehensive Journaling',
                content:
                    "Log every action—from watering and training to pest control and amendments. The journal is your detailed, timestamped record of the plant's entire lifecycle, which can be filtered by event type.",
            },
        },
        equipment: {
            title: 'Equipment View (The Workshop)',
            content: 'Your toolkit for planning and optimizing your grow setup.',
            configurator: {
                title: 'AI Setup Configurator',
                content:
                    'Answer a few simple questions about your budget, experience, and priorities (like yield vs. quality) to receive a complete, brand-specific equipment list from the Gemini AI.',
            },
            calculators: {
                title: 'Precision Calculators',
                content:
                    'Use a suite of calculators for <strong>Ventilation</strong>, <strong>Lighting (PPFD/DLI)</strong>, <strong>Electricity Cost</strong>, <strong>Nutrient Mixing</strong>, and more to optimize every aspect of your grow.',
            },
            shops: {
                title: 'Grow Shops & Seed Banks',
                content:
                    'Browse curated, region-specific lists of recommended Grow Shops and Seed Banks, complete with ratings, strengths, and shipping info.',
            },
        },
        knowledge: {
            title: 'Knowledge View (The Library)',
            content:
                'Your central resource for learning, experimenting, and mastering cultivation.',
            mentor: {
                title: 'Context-Aware AI Mentor',
                content:
                    'Ask the AI Mentor growing questions. Select one of your active plants to allow the mentor to incorporate its specific real-time data into its advice for a truly personalized consultation.',
            },
            breeding: {
                title: 'Breeding Lab',
                content:
                    'Harvested high-quality plants may yield seeds. In the Breeding Lab, you can cross two of these collected seeds to create an entirely new, <strong>permanent hybrid strain</strong> which is then added to your personal "My Strains" library for future grows.',
            },
            sandbox: {
                title: 'Interactive Sandbox',
                content:
                    'Run risk-free "what-if" scenarios. Clone one of your active plants and run an accelerated 14-day simulation to compare the effects of different training techniques (e.g., Topping vs. LST) without risking your real plants.',
            },
            guide: {
                title: 'Integrated Grow Guide',
                content:
                    "Access a comprehensive reference that includes this User Manual, a Grower's Lexicon, clearly separated visual guides, and a searchable FAQ organized by app and grow topics.",
            },
            growTech: {
                title: 'Grow Tech 2026',
                content:
                    'Explore the latest cannabis cultivation technologies for 2026 -- from dynamic LED spectra and AI-powered controllers to digital twins, aeroponics, tissue culture, and smart grow boxes. Each technology section includes key benefits, practical tips, and integration points with CannaGuide features already available in the app.',
            },
        },
        settings: {
            title: 'Settings',
            content:
                'Customize every aspect of the app to your needs. Settings are organized into 11 tabs.',
            general: {
                title: 'General & UI',
                content:
                    'Choose from 9 cannabis themes, change language (EN/DE/ES/FR/NL), set units (metric/imperial), enable dyslexia-friendly font, reduced motion, or color vision filters. Also find the local AI model preload toggle and Force-WASM switch here.',
            },
            ai: {
                title: 'AI Configuration',
                content:
                    'Manage API keys for up to four cloud AI providers: Google Gemini, OpenAI, Anthropic, and xAI/Grok. Select AI mode (Cloud/Local/Hybrid/Eco). All keys are encrypted at rest with AES-256-GCM. <strong>Tip: The Gemini API key from Google AI Studio is free with a Google account.</strong>',
            },
            tts: {
                title: 'Text-to-Speech (TTS)',
                content:
                    'Enable text-to-speech, choose the voice and speaking rate. Have AI advice, guides, and strain descriptions read aloud.',
            },
            strains: {
                title: 'Strain Settings',
                content:
                    'Configure the strain data source and enable or disable automatic strain catalog updates.',
            },
            plants: {
                title: 'Plants & Simulation',
                content:
                    'Set the maximum number of plant slots (up to 6), choose between beginner and expert simulation profiles, and configure default light cycle and pot size.',
            },
            notifications: {
                title: 'Notifications',
                content:
                    'Enable proactive Smart Coach notifications that alert you when environment values (temperature, humidity, VPD, pH, EC) exceed critical thresholds.',
            },
            privacy: {
                title: 'Privacy & Security',
                content:
                    'Protect the app with a PIN lock, manage data export/import, and configure one-tap cloud sync via GitHub Gist. Wipe all app data if needed.',
            },
            iot: {
                title: 'IoT Settings',
                content:
                    'Configure connection to ESP32 sensors for real-time environment monitoring (temperature, humidity, CO2, soil moisture). Manage device addresses and polling intervals.',
            },
            dataManagement: {
                title: 'Data Management',
                content:
                    'Export and import your entire app state as JSON. Use GitHub Gist sync for cross-device backups. Clear IndexedDB caches and reset the app if needed.',
            },
            about: {
                title: 'About',
                content:
                    'Shows the current app version, build information, open-source licenses used, and links to source code and documentation.',
            },
        },
    },
}

export const visualGuides = {
    topping: {
        title: 'Topping',
        description:
            'Learn how to cut the top of your plant to encourage bushier growth and more main colas.',
    },
    lst: {
        title: 'Low-Stress Training (LST)',
        description:
            "Bend and tie down your plant's branches to open up the canopy and maximize light exposure.",
    },
    defoliation: {
        title: 'Defoliation',
        description:
            'Strategically remove leaves to improve airflow and allow more light to reach lower bud sites.',
    },
    harvesting: {
        title: 'Harvesting',
        description:
            'Identify the perfect time to harvest to maximize the potency and aroma of your buds.',
    },
}

export const faq = {
    phValue: {
        question: 'Why is pH value so important?',
        answer: "The pH of your water and medium determines how well your plant can absorb nutrients. An incorrect pH leads to nutrient lockout, even if enough nutrients are present. For soil, the ideal range is 6.0-6.8; for hydro/coco, it's 5.5-6.5.",
    },
    yellowLeaves: {
        question: 'What do yellow leaves mean?',
        answer: "Yellow leaves (chlorosis) can have many causes. If they start at the bottom and move up, it's often a nitrogen deficiency. Spots can indicate a calcium or magnesium deficiency. Over or underwatering can also cause yellow leaves. Always check pH and watering habits first.",
    },
    whenToHarvest: {
        question: "When do I know it's time to harvest?",
        answer: 'The best indicator is the trichomes (the small resin crystals on the buds). Use a magnifier. The harvest is optimal when most trichomes are milky-white with a few amber ones. Clear trichomes are too early; too many amber trichomes will lead to a more sedative effect.',
    },
    lightDistanceSeedling: {
        question: 'How far should my light be from seedlings?',
        answer: "This depends heavily on the light type and wattage. A good rule of thumb for most LED lights is a distance of 45-60 cm (18-24 inches). Observe your seedlings closely. If they stretch too much (become long and thin), the light is too far. If the leaves show signs of burning or bleaching, it's too close.",
    },
    whenToFeed: {
        question: 'When should I start feeding nutrients?',
        answer: "Most pre-fertilized soils have enough nutrients for the first 2-3 weeks. For seedlings, wait until they have 3-4 sets of true leaves before starting with a very weak nutrient solution (1/4 of the recommended dose). Observe the plant's reaction before increasing the dosage.",
    },
    npkMeaning: {
        question: 'What do N-P-K numbers on fertilizers mean?',
        answer: 'N-P-K stands for Nitrogen (N), Phosphorus (P), and Potassium (K). These are the three primary macronutrients your plant needs. The numbers represent the percentage of each nutrient in the fertilizer. <ul><li><strong>N (Nitrogen):</strong> Crucial for vegetative growth (leaves, stems).</li><li><strong>P (Phosphorus):</strong> Essential for root development and flower production.</li><li><strong>K (Potassium):</strong> Important for overall plant health, disease resistance, and flower density.</li></ul>',
    },
    calmagUsage: {
        question: 'When and why should I use Cal-Mag?',
        answer: 'Cal-Mag (Calcium-Magnesium supplement) is important when using filtered water (like reverse osmosis) that lacks these secondary nutrients, or when growing in coco coir, which tends to bind calcium. Deficiencies often show up as small, rust-colored spots on the leaves.',
    },
    flushingPlants: {
        question: 'What is "flushing" and do I need to do it?',
        answer: "Flushing is the practice of watering the plant with only pure, pH-adjusted water for the last 1-2 weeks before harvest. The idea is to remove excess nutrient salts from the medium and the plant, which is believed to result in a cleaner, smoother taste. It's often unnecessary in organic soil grows but is common practice in hydroponic or coco systems.",
    },
    vpdImportance: {
        question: 'What is VPD and why should I care?',
        answer: 'VPD (Vapor Pressure Deficit) is an advanced measurement that combines temperature and humidity to describe the "thirst" of the air. An optimal VPD allows the plant to transpire (evaporate water) efficiently, driving nutrient uptake and growth. Too high a VPD means the air is too dry, causing stress. Too low a VPD means the air is too humid, increasing mold risk and slowing nutrient uptake.',
    },
    idealTempHumidity: {
        question: 'What are the ideal temperature and humidity levels?',
        answer: 'It depends on the stage:<ul><li><strong>Seedlings:</strong> 22-26°C (72-79°F), 70-80% RH</li><li><strong>Vegetative:</strong> 22-28°C (72-82°F), 50-70% RH</li><li><strong>Flowering:</strong> 20-26°C (68-79°F), 40-50% RH</li><li><strong>Late Flower:</strong> 18-24°C (64-75°F), 30-40% RH</li></ul>The goal is to hit the ideal VPD range for each stage.',
    },
    airCirculation: {
        question: 'How important is air circulation?',
        answer: 'Extremely important. One or more oscillating fans inside the tent keep the air moving around the plants. This strengthens stems, prevents humid "pockets" from forming around leaves, and significantly reduces the risk of mold and pests.',
    },
    nutrientBurn: {
        question: 'What is nutrient burn?',
        answer: 'Nutrient burn (or "nute burn") appears as dark green leaves with burnt, yellow or brown tips that often curl upwards. It means the plant is receiving more nutrients than it can process. The solution is to reduce the nutrient concentration (EC) and/or flush the medium with pH-adjusted water.',
    },
    spiderMites: {
        question: 'How do I spot and fight spider mites?',
        answer: 'Spider mites are tiny pests that live on the underside of leaves. Early signs are small white or yellow dots on the leaves. In a heavy infestation, you will see fine webbing. They reproduce extremely fast in warm, dry environments. Neem oil sprays or insecticidal soaps can be used to combat them. Good prevention includes a clean environment and not letting humidity get too low.',
    },
    stretchingCauses: {
        question: 'Why is my plant stretching so much?',
        answer: 'Excessive stretching, where the plant grows long, thin stems with large gaps between leaf nodes, is almost always caused by insufficient light. The plant is "reaching" for the light source. Move your light closer or use a more powerful one. Some Sativa strains are also genetically prone to stretching, especially at the start of the flowering phase.',
    },
    toppingVsFimming: {
        question: 'What is the difference between Topping and FIMing?',
        answer: 'Both are "high-stress training" techniques to break apical dominance and create more main colas. With <strong>Topping</strong>, you cleanly cut off the top of the main shoot, resulting in two new main shoots. With <strong>FIMing</strong> (F*ck I Missed), you pinch off the tip, leaving a small amount. If done right, this can result in four or more new shoots. Topping is more precise; FIMing can result in bushier growth.',
    },
    whatIsScrog: {
        question: 'What is a SCROG?',
        answer: 'SCROG stands for "Screen of Green". It is an advanced training technique where a net or screen is placed horizontally over the plants. As the plant grows, shoots are tucked under the screen and trained to grow horizontally. This creates a wide, flat, and even canopy where all bud sites receive the same, optimal amount of light, maximizing yield.',
    },
    whatIsLollipopping: {
        question: 'What does "lollipopping" mean?',
        answer: '"Lollipopping" is a defoliation technique usually performed just before or at the start of the flowering phase. It involves removing all the lower leaves and small shoots that are in the shade and would never develop into dense buds. This focuses all the plant\'s energy on the upper flowers in the canopy, resulting in larger, denser main colas.',
    },
    dryingDuration: {
        question: 'How long should I dry my harvest?',
        answer: 'Drying usually takes 7-14 days. The goal is a slow and controlled dry in a dark, cool space at around 18-20°C (64-68°F) and 55-60% humidity. A good test is the "stem snap test": if the smaller stems snap rather than just bend when you bend them, the buds are ready for curing in jars.',
    },
    curingImportance: {
        question: 'Why is curing so important?',
        answer: "Curing is a crucial step for final quality. During this process, which takes place in airtight jars, bacteria break down chlorophyll and other unwanted substances. This leads to a much smoother smoke and allows the strain's complex terpene profile (aroma and flavor) to fully develop. A good cure can be the difference between mediocre and top-shelf cannabis.",
    },
    storageHarvest: {
        question: 'How should I store my finished harvest?',
        answer: 'After curing, buds should be stored long-term in airtight glass containers in a cool, dark place. Light, heat, and oxygen are the main enemies that degrade cannabinoids and terpenes. The ideal storage temperature is below 21°C (70°F). Humidity packs (e.g., 62% RH) in the jars can help maintain the perfect moisture level.',
    },
    autoflowerVsPhotoperiod: {
        question: "Autoflower vs. Photoperiod: What's the difference?",
        answer: '<strong>Photoperiod</strong> plants require a change in the light cycle (switching to 12 hours of light / 12 hours of darkness) to initiate flowering. They have a longer vegetative phase and typically grow larger and yield more. <strong>Autoflowers</strong> flower automatically after a certain amount of time (usually 3-4 weeks), regardless of the light cycle. They are faster to finish, stay smaller, and are often easier for beginners, but the yield is usually lower.',
    },
    howOftenToWater: {
        question: 'How often do I need to water?',
        answer: "There's no fixed schedule. The best method is to lift the pot and feel its weight. Water thoroughly until some runs out the bottom (runoff), then wait until the pot feels significantly lighter again. This ensures the roots get enough oxygen between waterings. Also, stick your finger about an inch (2-3 cm) into the soil; if it comes out dry, it's likely time to water.",
    },
    potSize: {
        question: 'What pot size should I use?',
        answer: "Pot size depends on the type of plant and your desired final size. A good rule of thumb:<ul><li><strong>Autoflowers:</strong> 10-15 liter (3-4 gallon) pots are ideal, as they don't like being transplanted.</li><li><strong>Photoperiods:</strong> Start in smaller pots (1-3 liters) and transplant 1-2 times into larger ones, e.g., 15-25 liters (4-7 gallons) for the final stage. This promotes a healthy root system.</li></ul>Bigger pots mean more room for roots and potentially bigger plants, but they need watering less frequently.",
    },
    localAiFallback: {
        question: 'What happens if Gemini is unavailable?',
        answer: 'CannaGuide automatically falls back to the local AI stack. If the online model cannot answer, the app uses heuristic plant analysis so diagnostics and advice stay available.',
    },
    localAiPreload: {
        question: 'How do I use Local AI offline?',
        answer: 'Open Settings → General & UI and press <strong>Preload Offline Models</strong> while you are online. This warms the local text, vision, embedding, and NLP models for offline use.',
    },
    localAiStorage: {
        question: 'How much storage do the local models need?',
        answer: 'Expect roughly a few hundred megabytes of browser storage for the current local AI models. Use a device with enough free space and persistent storage enabled for best results.',
    },
    localAiWebGpu: {
        question: 'Do I need WebGPU?',
        answer: 'No. WebGPU lets CannaGuide use the WebLLM runtime on supported devices, but the app automatically falls back to Transformer.js if WebGPU is missing.',
    },
    localAiTroubleshooting: {
        question: 'What should I do if offline model preload fails?',
        answer: 'Retry on a stable connection, make sure browser storage is not full, and confirm the device is allowed to persist storage. If needed, clear the offline cache in Settings and preload again.',
    },
    localAiSemanticRag: {
        question: 'What is Semantic RAG?',
        answer: 'Semantic RAG uses a local embedding model (MiniLM) to find the most relevant grow-log entries by meaning — not just keywords. This dramatically improves AI context quality when answering questions about your grow history.',
    },
    localAiSentiment: {
        question: 'What does journal sentiment analysis do?',
        answer: 'The local sentiment model analyzes the emotional tone of your journal entries to detect patterns over time. It can show whether your grow experience is trending positively, negatively, or staying stable — helping you spot issues early.',
    },
    localAiSummarization: {
        question: 'How does local text summarization work?',
        answer: 'The summarization model condenses long grow logs and mentor chat histories into concise summaries. This helps you quickly review past sessions without scrolling through hundreds of entries.',
    },
    localAiQueryRouting: {
        question: 'What is smart query routing?',
        answer: 'The zero-shot classification model automatically categorizes your questions (e.g., watering, nutrients, pests) to help the AI provide more relevant answers — even without an internet connection.',
    },
    localAiPersistentCache: {
        question: 'What is the persistent inference cache?',
        answer: 'AI responses are stored in IndexedDB so that identical questions return instantly — even after reloading the app. The cache holds up to 256 entries and automatically evicts the oldest when full.',
    },
    localAiTelemetry: {
        question: 'What does local AI telemetry track?',
        answer: 'Telemetry measures inference speed, token throughput, cache hit rates, and model usage — all locally on your device. No data ever leaves the browser. This helps you understand if your device is powerful enough for local AI.',
    },
    cloudSync: {
        question: 'How does One-Tap Cloud Sync work?',
        answer: 'CannaGuide backs up your entire app state to a <strong>private GitHub Gist</strong> that only you own. Open Settings → Data Management, add a GitHub Personal Access Token with <code>gist</code> scope, and tap Sync. Restore on any device by importing from the same Gist. No third-party server ever touches your data.',
    },
    multiProviderAi: {
        question: 'Can I use a different AI provider?',
        answer: 'Yes. CannaGuide supports <strong>Google Gemini, OpenAI, Anthropic, and xAI/Grok</strong> through a Bring-Your-Own-Key model. Switch providers in Settings → AI. All API keys are encrypted at rest with AES-256-GCM. If every provider is unavailable, the app falls back to the local AI stack.',
    },
    forceWasm: {
        question: 'What does the Force WASM toggle do?',
        answer: 'It locks the Local AI inference backend to WASM even when WebGPU is detected. Use it when WebGPU causes crashes or visual artifacts on your device. The toggle is found under Settings → General & UI.',
    },
    visionClassification: {
        question: 'How does photo-based plant diagnosis work offline?',
        answer: 'The app uses a CLIP-ViT-L-14 vision model that recognises 33 cannabis-specific labels — from healthy leaves to nutrient deficiencies, pests, and mould. The model runs entirely in the browser via ONNX and does not send images to any server. Preload it in Settings → General & UI while online.',
    },
    dynamicLighting: {
        question: 'What is dynamic lighting and how does it help?',
        answer: 'Dynamic lighting uses LEDs that automatically adjust their spectrum based on the growth phase and VPD conditions. Blue-heavy spectra promote compact vegetative growth, while red-dominant spectra increase bud density and THC production during flowering. Modern panels achieve >2.8 umol/J efficiency, reducing power consumption by up to 40% versus legacy HPS lamps.',
    },
    aeroponicsBasics: {
        question: 'What is aeroponics and is it suitable for home growing?',
        answer: 'Aeroponics suspends plant roots in air and delivers nutrients via a fine mist. It can achieve up to 30% faster growth with 90% less water than soil. While it requires more initial setup, it is increasingly accessible for home growers with compact systems. CannaGuide supports Aeroponics as a grow medium with adapted EC/pH targets.',
    },
    digitalTwin: {
        question: 'What is a Digital Twin in cannabis growing?',
        answer: 'A Digital Twin is a virtual replica of your grow environment built from sensor data. It lets you simulate "what-if" scenarios -- like adding CO2 or changing light schedules -- and see the projected yield impact before making real changes. CannaGuide\'s Sandbox already offers basic digital twin experiments (Topping vs. LST, Temperature +2C).',
    },
    tissueCulture: {
        question: 'What is tissue culture for cannabis?',
        answer: 'Tissue culture (micropropagation) is a sterile laboratory technique for producing virus-free, genetically identical clones from tiny plant tissue samples. It eliminates the need for mother plants and enables massive scaling of elite genetics. Home-lab kits are now available for advanced growers.',
    },
    smartGrowBox: {
        question: 'Are all-in-one smart grow boxes worth it?',
        answer: 'Smart grow boxes like Hey Abby GrowMate integrate LEDs, ventilation, sensors, and app control into a single unit. They are ideal for beginners and urban growers who want minimal setup complexity. Even with a smart box, using CannaGuide for journaling, AI advice, and VPD simulation adds significant value.',
    },
    co2Enrichment: {
        question: 'When should I add CO2 to my grow room?',
        answer: 'CO2 enrichment (typically 800-1500 ppm) is most effective during the vegetative and early flowering phases when combined with high-intensity lighting (>600 PPFD). It can increase yields by 20-30% but requires a sealed room and proper safety equipment. Without sufficient light, extra CO2 provides no benefit.',
    },
    smartFertigation: {
        question: 'What is smart fertigation?',
        answer: 'Smart fertigation combines automated irrigation with precision nutrient dosing using EC/pH sensors and closed-loop control systems. It automatically adjusts nutrient concentration and pH in real-time based on runoff readings, eliminating manual mixing and reducing waste. This is the standard in modern hydroponic and aeroponic setups.',
    },
    terpeneTrends: {
        question: 'What are the terpene trends in 2026?',
        answer: 'In 2026, the market is shifting away from sweet candy-gas profiles toward complex, savory and gassy aromas. Dark cherry, vanilla-petrol, lemon-pine-fuel, cheese revivals, and earthy/spicy notes dominated by beta-caryophyllene and humulene are the new premium. Functional terpenes like THCV for energy without hunger are also gaining popularity.',
    },
    autoflowerQuality: {
        question: 'Are autoflowers now as good as photoperiod strains?',
        answer: 'Yes, in 2026 modern autoflowers have closed the gap. Advanced backcrossing techniques produce autoflower genetics that match photoperiod strains in potency, terpene richness, and yield. With 75-90 day cycles, growers can achieve 2-3 harvests per year. They are ideal for beginners and quick turnarounds.',
    },
    polyploidyBasics: {
        question: 'What is polyploidy in cannabis?',
        answer: 'Polyploidy refers to plants with more than two sets of chromosomes. Triploid (3n), tetraploid (4n), and hexaploid (6n) cannabis plants can produce up to 65% more cannabinoids, higher biomass, and better pest resistance. Triploids are pollen-sterile, preventing accidental pollination. This is the most advanced breeding technology available in 2026.',
    },
    balancedHybrids: {
        question: 'Why are balanced hybrids trending in 2026?',
        answer: 'Consumers increasingly seek cultivars that deliver specific functional effects -- calm focus without sedation, social uplift without anxiety, or therapeutic relief without heavy intoxication. Balanced hybrids with moderate THC and rich terpene profiles meet this demand for intentional, everyday consumption.',
    },
    landraceGenetics: {
        question: 'What is the landrace revival movement?',
        answer: 'The landrace revival preserves and revitalizes original cannabis genetics from regions like Afghanistan, Morocco, Thailand, and South Africa. These ancient cultivars offer unique terpene profiles, natural pest resistance, and effects rarely found in modern hybrids. Breeders cross them with modern genetics to create climate-resilient, heritage-honoring cultivars.',
    },
    ultraThcStrains: {
        question: 'Are ultra-high THC strains (33%+) safe to grow?',
        answer: 'Ultra-high THC strains (33-37%) are safe to grow but require careful environmental control. They often need precise VPD management, strong lighting (>800 PPFD), and nutrient precision to reach their full potential. These cultivars pair best with experienced growers who can leverage the CannaGuide simulation and diagnostic tools.',
    },
}
