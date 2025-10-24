export const helpView = {
  title: 'Help & Support',
  subtitle: 'Find answers to your questions and learn more about cultivation.',
  tabs: {
    faq: 'FAQ',
    guides: 'Visual Guides',
    lexicon: 'Lexicon',
    manual: 'User Manual',
  },
  faq: {
    title: 'Frequently Asked Questions',
    searchPlaceholder: 'Search questions...',
    noResults: 'No results found for "{{term}}".',
  },
  guides: {
    title: 'Visual Guides',
  },
  lexicon: {
    title: 'Grower\'s Lexicon',
    searchPlaceholder: 'Search terms...',
    noResults: 'No terms found for "{{term}}".',
    categories: {
      all: 'All',
      cannabinoid: 'Cannabinoids',
      terpene: 'Terpenes',
      flavonoid: 'Flavonoids',
      general: 'General',
    },
    cannabinoids: {
      thc: { term: 'THC (Tetrahydrocannabinol)', definition: 'The most well-known and primary psychoactive cannabinoid in cannabis, responsible for the "high" sensation.' },
      cbd: { term: 'CBD (Cannabidiol)', definition: 'A non-psychoactive cannabinoid known for its therapeutic properties, including analgesic and anti-inflammatory effects.' },
      cbg: { term: 'CBG (Cannabigerol)', definition: 'A non-psychoactive cannabinoid often referred to as the "mother of all cannabinoids" because it is a precursor to THC and CBD.' },
      cbn: { term: 'CBN (Cannabinol)', definition: 'A mildly psychoactive cannabinoid that forms as THC degrades. It is known for its sedative properties.' },
      cbc: { term: 'CBC (Cannabichromene)', definition: 'A non-psychoactive cannabinoid that shows potential for anti-inflammatory and pain-relieving effects.' },
      thca: { term: 'THCA (Tetrahydrocannabinolic Acid)', definition: 'The non-psychoactive, acidic precursor to THC found in raw cannabis. It converts to THC through heat (decarboxylation).' },
      cbda: { term: 'CBDA (Cannabidiolic Acid)', definition: 'The acidic precursor to CBD found in raw cannabis. It has its own potential therapeutic effects, particularly anti-inflammatory.' },
      thcv: { term: 'THCV (Tetrahydrocannabivarin)', definition: 'A cannabinoid structurally similar to THC but with different effects. It is known to be an appetite suppressant and can be psychoactive in high doses.' },
      cbdv: { term: 'CBDV (Cannabidivarin)', definition: 'A non-psychoactive cannabinoid structurally similar to CBD, being studied for its potential in treating neurological conditions.' },
    },
    terpenes: {
      myrcene: { term: 'Myrcene', definition: 'A common terpene with an earthy, musky aroma. Also found in mangoes. Known for its calming and relaxing properties.' },
      limonene: { term: 'Limonene', definition: 'A terpene with a strong citrus aroma. It is known for its mood-elevating and stress-relieving effects.' },
      caryophyllene: { term: 'Caryophyllene', definition: 'A terpene with a spicy, peppery aroma. It is the only terpene that can also bind to cannabinoid receptors and has anti-inflammatory properties.' },
      pinene: { term: 'Pinene', definition: 'A terpene with a fresh pine aroma. It may promote alertness and has anti-inflammatory properties.' },
      linalool: { term: 'Linalool', definition: 'A terpene with a floral, lavender-like aroma. It is known for its calming, anti-anxiety, and sleep-promoting effects.' },
      terpinolene: { term: 'Terpinolene', definition: 'A terpene with a complex, fruity-floral aroma. It often has a slightly uplifting effect and antioxidant properties.' },
      humulene: { term: 'Humulene', definition: 'A terpene with an earthy, woody aroma, also found in hops. It is known for its anti-inflammatory and appetite-suppressant properties.' },
      ocimene: { term: 'Ocimene', definition: 'A terpene with a sweet, herbaceous, and woody aroma. It can have uplifting effects and is studied for its antiviral properties.' },
      bisabolol: { term: 'Bisabolol', definition: 'A terpene with a light, sweet, floral aroma, also found in chamomile. It is known for its anti-inflammatory and skin-soothing properties.' },
      nerolidol: { term: 'Nerolidol', definition: 'A terpene with a woody, floral aroma reminiscent of tree bark. It has sedative and anti-anxiety properties.' },
    },
    flavonoids: {
      cannaflavin: { term: 'Cannaflavins (A, B, C)', definition: 'A group of flavonoids found exclusively in cannabis. They have potent anti-inflammatory properties.' },
      quercetin: { term: 'Quercetin', definition: 'A flavonoid found in many fruits and vegetables. It is a powerful antioxidant with antiviral properties.' },
      kaempferol: { term: 'Kaempferol', definition: 'A flavonoid with strong antioxidant properties that may help prevent oxidative stress.' },
      apigenin: { term: 'Apigenin', definition: 'A flavonoid with anti-anxiety and sedative properties, also found in chamomile.' },
      luteolin: { term: 'Luteolin', definition: 'A flavonoid with antioxidant and anti-inflammatory properties.' },
      orientin: { term: 'Orientin', definition: 'A flavonoid with antioxidant, anti-inflammatory, and potential antibiotic properties.' },
      vitexin: { term: 'Vitexin', definition: 'A flavonoid that may exhibit pain-relieving and antioxidant effects.' },
    },
    general: {
      phValue: { term: 'pH Value', definition: 'A measure of the acidity or alkalinity of a solution. In cannabis cultivation, a correct pH is crucial for nutrient uptake.' },
      ecValue: { term: 'EC (Electrical Conductivity)', definition: 'A measure of the total amount of dissolved salts (nutrients) in a solution. It helps monitor nutrient concentration.' },
      vpd: { term: 'VPD (Vapor Pressure Deficit)', definition: 'A measure of the combined pressure of temperature and humidity on the plant. An optimal VPD value allows for efficient transpiration.' },
      trichomes: { term: 'Trichomes', definition: 'The small, resinous glands on the flowers and leaves of cannabis that produce cannabinoids and terpenes. Their color is a key indicator of maturity.' },
      topping: { term: 'Topping', definition: 'A training technique where the top tip of the plant is cut off to encourage the growth of two new main colas, creating a bushier shape.' },
      fimming: { term: 'FIM (F*ck I Missed)', definition: 'A technique similar to topping, but where only part of the tip is removed, often resulting in four or more new main shoots.' },
      lst: { term: 'LST (Low-Stress Training)', definition: 'A training technique where branches are gently bent down and tied, creating a wider, flatter canopy and maximizing light exposure.' },
      lollipopping: { term: 'Lollipopping', definition: 'The removal of lower leaves and small shoots that receive little light to focus the plant\'s energy on the upper, larger flowers.' },
      scrog: { term: 'SCROG (Screen of Green)', definition: 'An advanced training technique where a net or screen is placed over the plants to guide the shoots horizontally, creating an even, productive canopy.' },
      sog: { term: 'SOG (Sea of Green)', definition: 'A cultivation method where many small plants are grown closely together and quickly sent into flowering to achieve a fast and high-yielding harvest.' },
      curing: { term: 'Curing', definition: 'The process of storing dried cannabis flowers in airtight containers to break down chlorophyll and improve the taste, aroma, and smoothness of the smoke.' },
      nutrientLockout: { term: 'Nutrient Lockout', definition: 'A state where the plant cannot absorb available nutrients due to an incorrect pH in the root zone, even if they are present.' },
      flushing: { term: 'Flushing', definition: 'The practice of watering the plant with only pure, pH-adjusted water for the last one to two weeks before harvest to remove excess nutrient salts from the medium and the plant.' },
      phenotype: { term: 'Phenotype', definition: 'The observable characteristics of a plant (appearance, smell, effect) that result from the interaction of its genotype and the environment.' },
      genotype: { term: 'Genotype', definition: 'The genetic makeup of a plant, which determines its potential for certain traits.' },
      landrace: { term: 'Landrace', definition: 'A pure, original cannabis variety that has naturally adapted and stabilized in a specific geographic region over a long period.' },
    },
  },
  manual: {
    title: 'User Manual',
    introduction: {
        title: 'Introduction & Philosophy',
        content: `Welcome to CannaGuide 2025, your ultimate co-pilot for cannabis cultivation. This manual guides you through the app's advanced features.<h4>Our Core Principles:</h4><ul><li><strong>Offline First:</strong> 100% functionality without an internet connection (excluding live AI requests). Actions are queued and synced later.</li><li><strong>Performance-Driven:</strong> A fluid UI thanks to offloading complex simulations to a Web Worker.</li><li><strong>Data Sovereignty:</strong> Complete control with full backup and restore capabilities.</li><li><strong>AI as a Tool:</strong> Targeted use of Gemini AI for actionable, context-sensitive insights.</li></ul>`
    },
    general: {
      title: 'Platform-Wide Features',
      content: 'Features that enhance your experience throughout the app.',
      pwa: {
        title: 'PWA & 100% Offline Functionality',
        content: 'Install CannaGuide as a <strong>Progressive Web App</strong> for a native app experience via the header icon. The robust Service Worker caches all app data, including your plants, notes, and even AI archives, ensuring <strong>100% offline functionality (excluding live AI requests)</strong>.'
      },
      commandPalette: {
        title: 'Command Palette (Cmd/Ctrl + K)',
        content: 'Press <code>Cmd/Ctrl + K</code> to open the command palette. This is the power-user tool for instant navigation and actions, like searching strains or watering plants, without leaving the keyboard.'
      },
      voiceControl: {
        title: 'Voice Control & Speech',
        content: 'Control the app hands-free. Press the <strong>microphone button</strong> in the header to activate listening and speak commands like "Go to Strains" or "Search for Blue Dream". You can also enable <strong>Text-to-Speech (TTS)</strong> in Settings to have guides, AI advice, and descriptions read aloud.'
      },
      dataManagement: {
        title: 'Data Sovereignty: Backup & Restore',
        content: 'Under <code>Settings > Data Management</code>, you have full control. Export your entire app state (plants, settings, etc.) as a single JSON file for <strong>backup</strong>. Import this file later to fully <strong>restore</strong> your state on any device.'
      },
      accessibility: {
        title: 'Enhanced Accessibility',
        content: 'The app offers comprehensive accessibility options in Settings. Activate a <strong>dyslexia-friendly font</strong>, a <strong>reduced motion mode</strong>, various <strong>colorblind filters</strong>, and use the integrated <strong>Text-to-Speech (TTS)</strong> feature to have content read aloud.'
      }
    },
    strains: {
      title: 'Strains View',
      content: 'The heart of your cannabis knowledge base. Explore over 700 strains, add your own, and use powerful analysis tools.',
      library: {
        title: 'Library (All/My/Favorites)',
        content: 'Toggle between the full library, your custom-added strains, and your favorites. Use the powerful search, alphabetical filter, and the advanced filter drawer to find exactly what you need. Switch between list and grid views for your preferred layout.'
      },
      genealogy: {
        title: 'Genealogy Explorer',
        content: 'Visualize any strain\'s genetic lineage. Use the <strong>Analysis Tools</strong> to highlight landraces, trace Sativa/Indica heritage, and calculate the genetic influence of top ancestors. You can also discover known descendants of a selected strain.'
      },
      aiTips: {
        title: 'AI Grow Tips',
        content: 'Generate unique, AI-powered cultivation advice for any strain based on your experience level and goals. Each request also generates a unique, artistic image for the strain. Save your favorite tips to the "Tips" archive for offline access.'
      },
      exports: {
        title: 'Exports & Data Management',
        content: 'Select one or more strains and use the export button in the toolbar to generate a PDF or TXT file. Manage all your past exports in the "Exports" tab, where you can re-download or delete them.'
      }
    },
    plants: {
      title: 'Plants View (The Grow Room)',
      content: 'Your command center for managing and simulating up to three simultaneous grows.',
      dashboard: {
        title: 'Dashboard & Garden Vitals',
        content: 'Get a quick overview of your garden\'s overall health, active plant count, and average environment. Use the <strong>VPD Gauge</strong> to assess the transpiration potential. Here, you can also perform global actions like "Water All Plants" or request an AI status summary.'
      },
      simulation: {
        title: 'Advanced Simulation',
        content: 'The app simulates plant growth in real-time based on scientific principles like <strong>Vapor Pressure Deficit (VPD)</strong>. This value combines temperature and humidity to determine the plant\'s ability to transpire. Switch to the <strong>Expert Profile</strong> in <code>Settings > Plants & Simulation</code> to reveal and adjust advanced physics parameters for a more granular simulation.'
      },
      diagnostics: {
        title: 'AI Diagnostics & Advisor',
        content: 'Use AI tools to keep your plants healthy.<ul><li><strong>Photo Diagnosis:</strong> Upload a photo of a leaf or problem area to get an instant AI-based diagnosis.</li><li><strong>Proactive Advisor:</strong> Get data-driven advice from the AI based on your plant\'s real-time vitals and recent history.</li></ul>All AI responses can be saved to the Advisor Archive.'
      },
      journal: {
        title: 'Comprehensive Journaling',
        content: 'Log every action—from watering and training to pest control and amendments. The journal is your detailed, timestamped record of the plant\'s entire lifecycle, which can be filtered by event type.'
      }
    },
    equipment: {
      title: 'Equipment View (The Workshop)',
      content: 'Your toolkit for planning and optimizing your grow setup.',
      configurator: {
        title: 'AI Setup Configurator',
        content: 'Answer a few simple questions about your budget, experience, and priorities (like yield vs. quality) to receive a complete, brand-specific equipment list from the Gemini AI.'
      },
      calculators: {
        title: 'Precision Calculators',
        content: 'Use a suite of calculators for <strong>Ventilation</strong>, <strong>Lighting (PPFD/DLI)</strong>, <strong>Electricity Cost</strong>, <strong>Nutrient Mixing</strong>, and more to optimize every aspect of your grow.'
      },
      shops: {
        title: 'Grow Shops & Seed Banks',
        content: 'Browse curated, region-specific lists of recommended Grow Shops and Seed Banks, complete with ratings, strengths, and shipping info.'
      }
    },
    knowledge: {
      title: 'Knowledge View (The Library)',
      content: 'Your central resource for learning, experimenting, and mastering cultivation.',
      mentor: {
        title: 'Context-Aware AI Mentor',
        content: 'Ask the AI Mentor growing questions. Select one of your active plants to allow the mentor to incorporate its specific real-time data into its advice for a truly personalized consultation.'
      },
      breeding: {
        title: 'Breeding Lab',
        content: 'Harvested high-quality plants may yield seeds. In the Breeding Lab, you can cross two of these collected seeds to create an entirely new, <strong>permanent hybrid strain</strong> which is then added to your personal "My Strains" library for future grows.'
      },
      sandbox: {
        title: 'Interactive Sandbox',
        content: 'Run risk-free "what-if" scenarios. Clone one of your active plants and run an accelerated 14-day simulation to compare the effects of different training techniques (e.g., Topping vs. LST) without risking your real plants.'
      },
      guide: {
        title: 'Integrated Grow Guide',
        content: 'Access a comprehensive reference that includes this User Manual, a Grower\'s Lexicon, visual guides for common techniques, and a searchable FAQ.'
      }
    }
  }
};

export const visualGuides = {
  topping: {
    title: 'Topping',
    description: 'Learn how to cut the top of your plant to encourage bushier growth and more main colas.',
  },
  lst: {
    title: 'Low-Stress Training (LST)',
    description: 'Bend and tie down your plant\'s branches to open up the canopy and maximize light exposure.',
  },
  defoliation: {
    title: 'Defoliation',
    description: 'Strategically remove leaves to improve airflow and allow more light to reach lower bud sites.',
  },
  harvesting: {
    title: 'Harvesting',
    description: 'Identify the perfect time to harvest to maximize the potency and aroma of your buds.',
  },
};

export const faq = {
  phValue: {
    question: 'Why is pH value so important?',
    answer: 'The pH of your water and medium determines how well your plant can absorb nutrients. An incorrect pH leads to nutrient lockout, even if enough nutrients are present. For soil, the ideal range is 6.0-6.8; for hydro/coco, it\'s 5.5-6.5.',
  },
  yellowLeaves: {
    question: 'What do yellow leaves mean?',
    answer: 'Yellow leaves (chlorosis) can have many causes. If they start at the bottom and move up, it\'s often a nitrogen deficiency. Spots can indicate a calcium or magnesium deficiency. Over or underwatering can also cause yellow leaves. Always check pH and watering habits first.',
  },
  whenToHarvest: {
    question: 'When do I know it\'s time to harvest?',
    answer: 'The best indicator is the trichomes (the small resin crystals on the buds). Use a magnifier. The harvest is optimal when most trichomes are milky-white with a few amber ones. Clear trichomes are too early; too many amber trichomes will lead to a more sedative effect.',
  },
  lightDistanceSeedling: {
    question: 'How far should my light be from seedlings?',
    answer: 'This depends heavily on the light type and wattage. A good rule of thumb for most LED lights is a distance of 45-60 cm (18-24 inches). Observe your seedlings closely. If they stretch too much (become long and thin), the light is too far. If the leaves show signs of burning or bleaching, it\'s too close.',
  },
  whenToFeed: {
    question: 'When should I start feeding nutrients?',
    answer: 'Most pre-fertilized soils have enough nutrients for the first 2-3 weeks. For seedlings, wait until they have 3-4 sets of true leaves before starting with a very weak nutrient solution (1/4 of the recommended dose). Observe the plant\'s reaction before increasing the dosage.'
  },
  npkMeaning: {
    question: 'What do N-P-K numbers on fertilizers mean?',
    answer: 'N-P-K stands for Nitrogen (N), Phosphorus (P), and Potassium (K). These are the three primary macronutrients your plant needs. The numbers represent the percentage of each nutrient in the fertilizer. <ul><li><strong>N (Nitrogen):</strong> Crucial for vegetative growth (leaves, stems).</li><li><strong>P (Phosphorus):</strong> Essential for root development and flower production.</li><li><strong>K (Potassium):</strong> Important for overall plant health, disease resistance, and flower density.</li></ul>'
  },
  calmagUsage: {
    question: 'When and why should I use Cal-Mag?',
    answer: 'Cal-Mag (Calcium-Magnesium supplement) is important when using filtered water (like reverse osmosis) that lacks these secondary nutrients, or when growing in coco coir, which tends to bind calcium. Deficiencies often show up as small, rust-colored spots on the leaves.'
  },
  flushingPlants: {
    question: 'What is "flushing" and do I need to do it?',
    answer: 'Flushing is the practice of watering the plant with only pure, pH-adjusted water for the last 1-2 weeks before harvest. The idea is to remove excess nutrient salts from the medium and the plant, which is believed to result in a cleaner, smoother taste. It\'s often unnecessary in organic soil grows but is common practice in hydroponic or coco systems.'
  },
  vpdImportance: {
    question: 'What is VPD and why should I care?',
    answer: 'VPD (Vapor Pressure Deficit) is an advanced measurement that combines temperature and humidity to describe the "thirst" of the air. An optimal VPD allows the plant to transpire (evaporate water) efficiently, driving nutrient uptake and growth. Too high a VPD means the air is too dry, causing stress. Too low a VPD means the air is too humid, increasing mold risk and slowing nutrient uptake.'
  },
  idealTempHumidity: {
    question: 'What are the ideal temperature and humidity levels?',
    answer: 'It depends on the stage:<ul><li><strong>Seedlings:</strong> 22-26°C (72-79°F), 70-80% RH</li><li><strong>Vegetative:</strong> 22-28°C (72-82°F), 50-70% RH</li><li><strong>Flowering:</strong> 20-26°C (68-79°F), 40-50% RH</li><li><strong>Late Flower:</strong> 18-24°C (64-75°F), 30-40% RH</li></ul>The goal is to hit the ideal VPD range for each stage.'
  },
  airCirculation: {
    question: 'How important is air circulation?',
    answer: 'Extremely important. One or more oscillating fans inside the tent keep the air moving around the plants. This strengthens stems, prevents humid "pockets" from forming around leaves, and significantly reduces the risk of mold and pests.'
  },
  nutrientBurn: {
    question: 'What is nutrient burn?',
    answer: 'Nutrient burn (or "nute burn") appears as dark green leaves with burnt, yellow or brown tips that often curl upwards. It means the plant is receiving more nutrients than it can process. The solution is to reduce the nutrient concentration (EC) and/or flush the medium with pH-adjusted water.'
  },
  spiderMites: {
    question: 'How do I spot and fight spider mites?',
    answer: 'Spider mites are tiny pests that live on the underside of leaves. Early signs are small white or yellow dots on the leaves. In a heavy infestation, you will see fine webbing. They reproduce extremely fast in warm, dry environments. Neem oil sprays or insecticidal soaps can be used to combat them. Good prevention includes a clean environment and not letting humidity get too low.'
  },
  stretchingCauses: {
    question: 'Why is my plant stretching so much?',
    answer: 'Excessive stretching, where the plant grows long, thin stems with large gaps between leaf nodes, is almost always caused by insufficient light. The plant is "reaching" for the light source. Move your light closer or use a more powerful one. Some Sativa strains are also genetically prone to stretching, especially at the start of the flowering phase.'
  },
  toppingVsFimming: {
    question: 'What is the difference between Topping and FIMing?',
    answer: 'Both are "high-stress training" techniques to break apical dominance and create more main colas. With <strong>Topping</strong>, you cleanly cut off the top of the main shoot, resulting in two new main shoots. With <strong>FIMing</strong> (F*ck I Missed), you pinch off the tip, leaving a small amount. If done right, this can result in four or more new shoots. Topping is more precise; FIMing can result in bushier growth.'
  },
  whatIsScrog: {
    question: 'What is a SCROG?',
    answer: 'SCROG stands for "Screen of Green". It is an advanced training technique where a net or screen is placed horizontally over the plants. As the plant grows, shoots are tucked under the screen and trained to grow horizontally. This creates a wide, flat, and even canopy where all bud sites receive the same, optimal amount of light, maximizing yield.'
  },
  whatIsLollipopping: {
    question: 'What does "lollipopping" mean?',
    answer: '"Lollipopping" is a defoliation technique usually performed just before or at the start of the flowering phase. It involves removing all the lower leaves and small shoots that are in the shade and would never develop into dense buds. This focuses all the plant\'s energy on the upper flowers in the canopy, resulting in larger, denser main colas.'
  },
  dryingDuration: {
    question: 'How long should I dry my harvest?',
    answer: 'Drying usually takes 7-14 days. The goal is a slow and controlled dry in a dark, cool space at around 18-20°C (64-68°F) and 55-60% humidity. A good test is the "stem snap test": if the smaller stems snap rather than just bend when you bend them, the buds are ready for curing in jars.'
  },
  curingImportance: {
    question: 'Why is curing so important?',
    answer: 'Curing is a crucial step for final quality. During this process, which takes place in airtight jars, bacteria break down chlorophyll and other unwanted substances. This leads to a much smoother smoke and allows the strain\'s complex terpene profile (aroma and flavor) to fully develop. A good cure can be the difference between mediocre and top-shelf cannabis.'
  },
  storageHarvest: {
    question: 'How should I store my finished harvest?',
    answer: 'After curing, buds should be stored long-term in airtight glass containers in a cool, dark place. Light, heat, and oxygen are the main enemies that degrade cannabinoids and terpenes. The ideal storage temperature is below 21°C (70°F). Humidity packs (e.g., 62% RH) in the jars can help maintain the perfect moisture level.'
  },
  autoflowerVsPhotoperiod: {
    question: 'Autoflower vs. Photoperiod: What\'s the difference?',
    answer: '<strong>Photoperiod</strong> plants require a change in the light cycle (switching to 12 hours of light / 12 hours of darkness) to initiate flowering. They have a longer vegetative phase and typically grow larger and yield more. <strong>Autoflowers</strong> flower automatically after a certain amount of time (usually 3-4 weeks), regardless of the light cycle. They are faster to finish, stay smaller, and are often easier for beginners, but the yield is usually lower.'
  },
  howOftenToWater: {
    question: 'How often do I need to water?',
    answer: 'There\'s no fixed schedule. The best method is to lift the pot and feel its weight. Water thoroughly until some runs out the bottom (runoff), then wait until the pot feels significantly lighter again. This ensures the roots get enough oxygen between waterings. Also, stick your finger about an inch (2-3 cm) into the soil; if it comes out dry, it\'s likely time to water.'
  },
  potSize: {
    question: 'What pot size should I use?',
    answer: 'Pot size depends on the type of plant and your desired final size. A good rule of thumb:<ul><li><strong>Autoflowers:</strong> 10-15 liter (3-4 gallon) pots are ideal, as they don\'t like being transplanted.</li><li><strong>Photoperiods:</strong> Start in smaller pots (1-3 liters) and transplant 1-2 times into larger ones, e.g., 15-25 liters (4-7 gallons) for the final stage. This promotes a healthy root system.</li></ul>Bigger pots mean more room for roots and potentially bigger plants, but they need watering less frequently.'
  }
};