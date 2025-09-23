export const helpView = {
  title: 'Help Center',
  tabs: {
    start: 'Getting Started',
    faq: 'FAQ',
    cultivation: 'Cultivation Guide',
    lexicons: 'Lexicons',
    about: 'About'
  },
  searchPlaceholder: 'Search in help...',
  expandAll: 'Expand All',
  collapseAll: 'Collapse All',
  noResults: 'No results found for "{term}".',
  sections: {
    firstSteps: {
      title: 'First Steps & Main Features',
      sections: {
        s1: {
          title: '1. The Strain Database (<strong>Strains</strong> View)',
          description: 'Your central library for cannabis knowledge, fully available offline.<ul><li><strong>Massive Library:</strong> Access detailed information on 300+ cannabis strains.</li><li><strong>Powerful Filtering & Sorting:</strong> Find strains by name, THC/CBD range, flowering time, difficulty, type, aromas, and terpenes.</li><li><strong>Dual View Modes:</strong> Switch between a detailed List View and a visual Grid View.</li><li><strong>Manage Your Strains (CRUD):</strong> Add your own custom strains, edit, or delete them.</li><li><strong>Professional Exporting:</strong> Export data as professional PDF, CSV, TXT, or JSON files.</li><li><strong>Export Management:</strong> Access your export history in the "Exports" tab for quick re-downloads.</li></ul>'
        },
        s2: {
          title: '2. The Grow Room (<strong>Plants</strong> View)',
          description: 'Your command center for managing and simulating up to three simultaneous grows.<ul><li><strong>Interactive Dashboard:</strong> Manage your plants in three slots. Each card shows at-a-glance status.</li><li><strong>Garden Overview:</strong> See your garden\'s overall health, open tasks, and global actions like "Water All".</li><li><strong>Detailed Plant View:</strong> Click a plant for a deep dive with an overview, journal, tasks, photo gallery, and the AI Advisor.</li><li><strong>AI Plant Advisor:</strong> Get personalized, data-driven advice from the AI. Manage this advice in the plant-specific archive (CRUD).</li><li><strong>Global Advisor Archive:</strong> A dashboard that aggregates all saved AI advice from all your plants.</li></ul>'
        },
        s3: {
          title: '3. The Workshop (<strong>Equipment</strong> View)',
          description: 'Plan and optimize your real-world grow setup.<ul><li><strong>AI Setup Configurator:</strong> Generate a complete equipment list based on your needs.</li><li><strong>Saved Setups (CRUD):</strong> Save, edit, export, and delete your configurations.</li><li><strong>Essential Calculators:</strong> A suite of tools for ventilation, lighting, costs, and more.</li><li><strong>Curated Grow Shops:</strong> A helpful list of reputable online shops in Europe and the USA.</li></ul>'
        },
        s4: {
          title: '4. The Library (<strong>Knowledge</strong> & <strong>Help</strong> Views)',
          description: 'Your complete resource for learning and problem-solving.<ul><li><strong>Interactive Grow Guide:</strong> A guided journey through the five main phases of cultivation with progress tracking.</li><li><strong>AI Mentor with CRUD Archive:</strong> Ask general growing questions to the AI. Save, view, edit, and delete the responses to build your personal knowledge base.</li><li><strong>Comprehensive Help Center:</strong> Detailed FAQ, guides, and in-depth lexicons for cannabinoids, terpenes, and flavonoids.</li></ul>'
        },
        s5: {
          title: '5. The Control Panel (<strong>Settings</strong> View)',
          description: 'Customize the app and manage your data with confidence.<ul><li><strong>Personalization:</strong> Change language, theme, font size, and default view.</li><li><strong>Accessibility:</strong> Enable High Contrast Mode, a Dyslexia-Friendly Font, or Reduced Motion.</li><li><strong>Data Management:</strong> Create a full backup of all your app data to a single JSON file or reset the app.</li></ul>'
        },
        s6: {
          title: 'Command Palette (<strong>Cmd/Ctrl + K</strong>)',
          description: 'Press <strong>Cmd/Ctrl + K</strong> anywhere for quick access. Instantly navigate, perform actions like "Water All," or inspect a plant without clicking through menus.'
        }
      }
    },
    faq: {
      title: 'Frequently Asked Questions (FAQ)',
      items: {
        q1: {
          q: 'How do I start my first grow?',
          a: 'Go to the <strong>Strains</strong> section, choose a beginner-friendly strain (marked with "Easy"), and click "Start Growing". Fill in the setup details, and your plant will appear in the <strong>Plants</strong> section, where the simulation begins.'
        },
        q2: {
          q: 'My plant has problems. What should I do?',
          a: 'Go to the detailed view of your plant in the <strong>Plants</strong> section. Check the vitals and warnings. Use the <strong>AI Advisor</strong> to get an analysis and action recommendations based on your plant\'s current data. Also, compare the symptoms with the descriptions in the "Plant Care ABCs" section here in the Help Center.'
        },
        q3: {
          q: 'Can I back up or transfer my data?',
          a: 'Yes! Go to the <strong>Settings</strong> section under "Data Management". There you can export all your data (plants, settings, custom strains, favorites) into a single backup file. You can later import this file on the same or another device.'
        },
        q4: {
          q: 'In which languages is the app available?',
          a: 'The app is fully available in <strong>German</strong> and <strong>English</strong>. You can change the language at any time in the <strong>Settings</strong> section under "General" -> "Language". Your selection is saved automatically.'
        },
        q5: {
          q: 'Is the app accessible?',
          a: 'Yes, accessibility has been greatly improved. The app supports navigation via <strong>keyboard</strong> and is optimized for use with <strong>screen readers</strong>. All interactive elements have appropriate labels for clear operation.'
        },
        q6: {
          q: 'How accurate is the simulation?',
          a: 'The app simulates plant growth based on general models and specific strain data. Factors like genetics, age, and stress influence development. The simulation is an educational tool and may differ from a real grow. Regular interactions (watering, feeding) will keep your simulated plant healthy.'
        },
        q7: {
          q: 'Can I edit or delete my added strains?',
          a: 'Yes, when in the "My Strains" tab, edit and delete buttons will appear on list items, and on grid items when you hover over them.'
        },
        q8: {
          q: 'How do the AI features work?',
          a: 'The app uses Google\'s Gemini API for its intelligent features. The <strong>Setup Configurator</strong> generates recommendations based on your input. The <strong>AI Plant Doctor</strong> analyzes leaf images to diagnose problems. The <strong>AI Mentor</strong> answers general cultivation questions, and the <strong>AI Advisor</strong> provides specific, data-driven advice for your plants in the detailed view.'
        },
        q9: {
          q: 'How does the Command Palette work?',
          a: 'Press <strong>Cmd/Ctrl + K</strong> to open the Command Palette. It\'s a powerful tool that lets you instantly jump to any section of the app, perform common actions like "Water All", or directly inspect a plant without clicking through menus. Just start typing to find what you need!'
        },
        q10: {
          q: 'How does exporting work and what are the formats?',
          a: 'In the Strains view, you can export your strain lists in various formats. <strong>PDF</strong> is great for a printable, well-formatted report. <strong>CSV</strong> is perfect for spreadsheets. <strong>TXT</strong> provides a simple text file, and <strong>JSON</strong> is ideal for data backup or use in other applications. All exports are also saved in the "Exports" tab for quick re-downloading.'
        },
        q11: {
          q: 'How can I save the advice from the AI Plant Advisor?',
          a: 'After the AI Advisor generates an analysis for one of your plants, a <strong>"Save to Archive"</strong> button will appear below the response. Click it to save the advice in that specific plant\'s archive. You can view, edit, and delete all saved advice in the same "AI Advisor" tab.'
        },
        q12: {
          q: 'Can I edit my saved equipment setups?',
          a: 'Yes! In the "Equipment" view, go to the <strong>"My Setups"</strong> tab. Click "Inspect" on a saved setup. In the detail modal, you can then click "Edit" to change the setup\'s name, individual components, and even their prices.'
        }
      }
    },
    cannabinoidLexicon: {
      title: 'Comprehensive Cannabinoid Lexicon',
      items: {
        c1: { term: 'What are cannabinoids?', def: 'Cannabinoids are the primary chemical compounds in cannabis that interact with the human body\'s endocannabinoid system (ECS), producing the plant\'s diverse effects. They mimic the body\'s own endocannabinoids, influencing various physiological processes like mood, pain sensation, appetite, and memory. We distinguish between phytocannabinoids (from the plant) and endocannabinoids (produced by the body).' },
        c2: { term: 'THC (Δ⁹-Tetrahydrocannabinol)', def: '<strong>Property:</strong> The most well-known and primary psychoactive cannabinoid. THC is responsible for the "high" feeling.<br><strong>Potential Effects:</strong> Euphoric, analgesic (pain-relieving), appetite-stimulating, antiemetic (anti-nausea). Can cause anxiety or paranoia in high doses.<br><strong>Boiling Point:</strong> ~157°C' },
        c3: { term: 'CBD (Cannabidiol)', def: '<strong>Property:</strong> The second most abundant cannabinoid; non-psychoactive. It does not produce a "high" and can even mitigate the psychoactive effects of THC.<br><strong>Potential Effects:</strong> Anxiolytic (anxiety-reducing), anti-inflammatory, anticonvulsant, neuroprotective. Very popular for therapeutic applications.<br><strong>Boiling Point:</strong> ~160-180°C' },
        c4: { term: 'CBG (Cannabigerol)', def: '<strong>Property:</strong> Often called the "mother of all cannabinoids" as it is the precursor from which other cannabinoids (THC, CBD, CBC) are synthesized in the plant. Non-psychoactive.<br><strong>Potential Effects:</strong> Antibacterial, anti-inflammatory, analgesic, may reduce intraocular pressure. Promising in research.<br><strong>Boiling Point:</strong> ~52°C (decarboxylation)' },
        c5: { term: 'CBN (Cannabinol)', def: '<strong>Property:</strong> Forms mainly when THC degrades through oxidation (aging, light exposure). Only very mildly psychoactive.<br><strong>Potential Effects:</strong> Known for its strong sedative and sleep-promoting properties. Often found in aged cannabis.<br><strong>Boiling Point:</strong> ~185°C' },
        c6: { term: 'CBC (Cannabichromene)', def: '<strong>Property:</strong> Another non-psychoactive cannabinoid that forms from CBG. Does not bind well to CB1 receptors in the brain but does to other receptors in the body.<br><strong>Potential Effects:</strong> Strong anti-inflammatory, potentially antidepressant, promotes brain function (neurogenesis).<br><strong>Boiling Point:</strong> ~220°C' },
        c7: { term: 'THCV (Tetrahydrocannabivarin)', def: '<strong>Property:</strong> An analog of THC with a slightly different chemical structure. The psychoactive effect is often clearer, more energetic, and shorter than that of THC.<br><strong>Potential Effects:</strong> Appetite suppressant (unlike THC), can regulate blood sugar levels. Non-psychoactive in low doses, but psychoactive in high doses.<br><strong>Boiling Point:</strong> ~220°C' },
        c8: { term: 'Acidic Forms (THCA, CBDA, etc.)', def: 'In the raw cannabis plant, most cannabinoids exist in their acidic form (e.g., THCA, CBDA). These are not psychoactive. Only through heating (e.g., smoking, vaping, or cooking) is a carboxyl group removed—a process called <strong>decarboxylation</strong>—which converts them into their active form (THC, CBD).' },
      }
    },
    terpeneLexicon: {
      title: 'Terpene Lexicon',
      items: {
        t1: { term: 'What are Terpenes?', def: 'Terpenes are aromatic oils found in many plants that give them their characteristic scent and flavor (e.g., the smell of pine or lavender). In cannabis, they modulate the effects of cannabinoids like THC and CBD—a phenomenon known as the <strong>"entourage effect"</strong>. Each terpene has a unique aroma profile and potential therapeutic properties.' },
        t2: { term: 'Myrcene', def: '<strong>Aroma:</strong> Earthy, musky, herbaceous, with notes of cloves and tropical fruits like mango.<br><strong>Potential Effects:</strong> Often relaxing and sedating. Believed to enhance the effects of THC and make the blood-brain barrier more permeable, speeding up the onset of effects.<br><strong>Boiling Point:</strong> ~167°C' },
        t3: { term: 'Limonene', def: '<strong>Aroma:</strong> Strong, fresh citrus aroma reminiscent of lemons, oranges, and limes.<br><strong>Potential Effects:</strong> Mood-elevating, stress-relieving, and anxiolytic. Can provide a sense of energy and well-being.<br><strong>Boiling Point:</strong> ~176°C' },
        t4: { term: 'Caryophyllene', def: '<strong>Aroma:</strong> Peppery, spicy, woody, with notes of cloves and cinnamon.<br><strong>Potential Effects:</strong> Unique in that it binds to CB2 receptors in the endocannabinoid system (similar to a cannabinoid). Strongly anti-inflammatory and analgesic.<br><strong>Boiling Point:</strong> ~130°C' },
        t5: { term: 'Pinene', def: '<strong>Aroma:</strong> Fresh, sharp aroma of pine needles and fir trees.<br><strong>Potential Effects:</strong> Promotes alertness, memory, and focus. Can act as a bronchodilator (widens airways) and has anti-inflammatory properties.<br><strong>Boiling Point:</strong> ~155°C' },
        t6: { term: 'Terpinolene', def: '<strong>Aroma:</strong> Complex, multi-layered aroma: floral, herbaceous, piney with a hint of citrus and apple.<br><strong>Potential Effects:</strong> Often slightly sedating and calming. Has antioxidant and antibacterial properties.<br><strong>Boiling Point:</strong> ~186°C' },
        t7: { term: 'Linalool', def: '<strong>Aroma:</strong> Floral, sweet, with a strong lavender character.<br><strong>Potential Effects:</strong> Known for its calming, anxiolytic, and sleep-promoting properties. Reduces stress.<br><strong>Boiling Point:</strong> ~198°C' },
        t8: { term: 'Humulene', def: '<strong>Aroma:</strong> Earthy, woody, hoppy (it is the primary terpene in hops).<br><strong>Potential Effects:</strong> Appetite suppressant and anti-inflammatory. Contributes to the "earthy" taste of many strains.<br><strong>Boiling Point:</strong> ~106°C' },
        t9: { term: 'Ocimene', def: '<strong>Aroma:</strong> Sweet, herbaceous, and woody. Reminiscent of a mix of mint and parsley.<br><strong>Potential Effects:</strong> Uplifting, antiviral, and decongestant. Often found in Sativa strains that have an energetic effect.<br><strong>Boiling Point:</strong> ~100°C' },
        t10: { term: 'Bisabolol', def: '<strong>Aroma:</strong> Slightly sweet, floral, with notes of chamomile and a hint of pepper.<br><strong>Potential Effects:</strong> Strong anti-inflammatory and skin-soothing properties. Frequently used in cosmetics.<br><strong>Boiling Point:</strong> ~153°C' },
      }
    },
    flavonoidLexicon: {
      title: 'Flavonoid Lexicon',
      items: {
        f1: { term: 'What are Flavonoids?', def: 'Flavonoids are a diverse group of plant compounds responsible for the vibrant colors of many fruits, vegetables, and flowers (e.g., the blue of blueberries or the red of strawberries). In cannabis, they contribute not only to coloration (e.g., purple hues) but also to aroma and flavor, acting synergistically with cannabinoids and terpenes in the entourage effect. They possess strong antioxidant and anti-inflammatory properties.' },
        f2: { term: 'Cannflavins (A, B, C)', def: '<strong>Property:</strong> A group of flavonoids found exclusively in the cannabis plant.<br><strong>Potential Effects:</strong> Particularly known for their extremely potent anti-inflammatory properties. Studies have shown that Cannflavin A and B can be up to 30 times more effective than aspirin.' },
        f3: { term: 'Quercetin', def: '<strong>Property:</strong> One of the most common flavonoids in nature, also found in kale, apples, and onions.<br><strong>Potential Effects:</strong> A powerful antioxidant with antiviral and potentially anti-cancer properties.' },
        f4: { term: 'Kaempferol', def: '<strong>Property:</strong> Widespread in fruits and vegetables like broccoli and grapes.<br><strong>Potential Effects:</strong> Acts as a strong antioxidant and is being studied for its ability to reduce the risk of chronic diseases.' },
        f5: { term: 'Apigenin', def: '<strong>Property:</strong> Found in large quantities in chamomile, parsley, and celery.<br><strong>Potential Effects:</strong> Known for its anxiolytic, calming, and sedative properties, similar to the effects of chamomile tea.' },
      }
    },
    agronomyBasics: {
      title: 'Agronomic Basics',
      items: {
        a1: { term: 'Sativa, Indica & Hybrid', def: 'These terms traditionally describe cannabis categories with different growth patterns and effects:<ul><li><strong>Sativa:</strong> Grows tall with narrow leaves; often associated with an energizing, cerebral "head high".</li><li><strong>Indica:</strong> Grows short and bushy with broad leaves; typically associated with a relaxing, physical "body high".</li><li><strong>Hybrid:</strong> A cross of Sativa and Indica genetics. Today, nearly all strains are hybrids. The terms are more useful for describing a plant\'s physical structure. For predicting effects, the <strong>terpene profile</strong> is a much more accurate indicator.</li></ul>' },
        a2: { term: 'The Entourage Effect', def: 'The entourage effect is the theory that all compounds in cannabis—cannabinoids, terpenes, and flavonoids—work together synergistically. This synergy creates a more potent and nuanced effect than any single compound could achieve on its own. It\'s why "full-spectrum" products are often considered more effective than isolates.'},
        a3: { term: 'Flowering: Photoperiod vs. Autoflower', def: '<ul><li><strong>Photoperiod:</strong> These plants require a change in the light cycle to 12 hours of light and 12 hours of uninterrupted darkness to trigger flowering. They can be kept in the vegetative state indefinitely and can be cloned.</li><li><strong>Autoflower (Autoflowering):</strong> These strains contain Ruderalis genetics, which causes them to flower automatically after a set amount of time (usually 2-4 weeks), regardless of the light cycle. They are typically faster, smaller, and more beginner-friendly.</li></ul>' },
        a4: { term: 'Understanding Yield & Height', def: 'These figures are estimates heavily influenced by growing conditions.<ul><li><strong>Yield (g/m²):</strong> Estimates the harvest (in grams of dry flower) per square meter, typically achieved indoors using techniques like SOG (Sea of Green) or SCROG.</li><li><strong>Yield (g/plant):</strong> Estimates the harvest for a single plant, most relevant for outdoor growing.</li><li><strong>Key Factors:</strong> Genetics, light intensity (PPFD/DLI), pot size, nutrients, training techniques, and grower experience all have a massive impact on the final outcome.</li></ul>' },
      }
    },
    plantCareABCs: {
      title: 'Plant Care ABCs',
      items: {
        pc1: { term: 'Life Stages in Detail', def: '<ul><li><strong>Seed/Germination:</strong> The seed needs moisture, warmth, and darkness. The taproot emerges.</li><li><strong>Seedling:</strong> The plant develops its first two round cotyledons, then its first true, serrated leaves. This is a very vulnerable stage.</li><li><strong>Vegetative Stage:</strong> The plant focuses on growing leaves, stems, and roots, building its "solar panel" factory. It requires lots of light (18+ hours) and nitrogen-rich fertilizer.</li><li><strong>Flowering Stage:</strong> After a switch to a 12/12 light cycle (for photoperiods), the plant stops vegetative growth and develops flowers. Nutrient needs shift to Phosphorus and Potassium.</li><li><strong>Harvest, Drying & Curing:</strong> The crucial finishing steps. Proper drying and curing are essential for quality, flavor, and shelf life.</li></ul>' },
        pc2: { term: 'Mastering Vitals & Environment', def: '<ul><li><strong>pH & Nutrient Lockout:</strong> pH level affects the roots\' ability to absorb nutrients. An incorrect pH leads to "nutrient lockout," where the plant starves despite available nutrients. Ideal for soil: 6.0-7.0, for hydro/coco: 5.5-6.5.</li><li><strong>EC (Electrical Conductivity):</strong> Measures nutrient concentration. Too high causes "nutrient burn" (burnt leaf tips); too low causes deficiencies.</li><li><strong>VPD (Vapor Pressure Deficit):</strong> The key relationship between temperature and humidity. An optimal VPD allows the plant to transpire efficiently, leading to faster nutrient uptake and more robust growth. VPD charts help you dial in your environment for each stage.</li></ul>' },
        pc3: { term: 'Advanced Training Techniques', def: 'Training shapes the plant for maximum light exposure and yield.<ul><li><strong>LST (Low Stress Training):</strong> Gently bending branches down to create a wide, flat canopy.</li><li><strong>Topping:</strong> Cutting the main stem to force the plant to grow two new main shoots.</li><li><strong>SCROG (Screen of Green):</strong> A net is used to create a perfectly even canopy where all bud sites receive equal light.</li><li><strong>Super Cropping:</strong> A high-stress technique where stems are carefully pinched and bent to damage the inner tissue, promoting stronger growth and better nutrient flow.</li><li><strong>Defoliation:</strong> Strategic removal of large fan leaves to improve light penetration and air circulation to lower bud sites.</li></ul>' },
        pc4: { term: 'Common Problems & Solutions', def: '<ul><li><strong>Mobile Nutrient Deficiencies (N, P, K, Mg):</strong> Symptoms appear first on lower, older leaves as the plant moves nutrients to new growth. <strong>Solution:</strong> Adjust feeding.</li><li><strong>Immobile Nutrient Deficiencies (Ca, S, B):</strong> Symptoms appear first on upper, new leaves as the plant cannot relocate these nutrients. <strong>Solution:</strong> Adjust feeding; Cal/Mag supplements are often needed.</li><li><strong>Pests:</strong><ul><li><strong>Spider Mites:</strong> Tiny white dots on leaves, fine webbing. <strong>Solution:</strong> Neem oil, predatory mites.</li><li><strong>Fungus Gnats:</strong> Small black flies around the soil. <strong>Solution:</strong> Yellow sticky traps, allow soil to dry out more, beneficial nematodes.</li></ul></li></ul>' },
      }
    },
    glossary: {
      title: 'Comprehensive Glossary',
      items: {
        g1: { term: 'Calyx', def: 'The actual part of the flower that encloses the ovule. The calyxes are the most resinous parts of the plant.' },
        g2: { term: 'Clone (Cutting)', def: 'A genetically identical cutting from a mother plant that is rooted to grow a new plant.' },
        g3: { term: 'Feminized', def: 'Seeds that have been treated to produce almost exclusively (99%+) female plants, which produce the desired flowers.' },
        g4: { term: 'Flushing', def: 'Watering the plant only with plain, pH-adjusted water in the last 1-2 weeks before harvest to remove excess nutrient salts from the substrate and the plant, which improves the taste.' },
        g5: { term: 'Landrace', def: 'A pure, original cannabis strain that has naturally developed and adapted over a long time in a specific geographical region (e.g., Afghan Kush, Durban Poison).' },
        g6: { term: 'Living Soil', def: 'A soil mix containing a complex ecosystem of beneficial microorganisms that break down organic matter and feed the plant naturally, mimicking a forest floor.' },
        g7: { term: 'N-P-K', def: 'The ratio of the three primary macronutrients that plants need: Nitrogen (N), Phosphorus (P), and Potassium (K). Fertilizer bottles often indicate this ratio as numbers (e.g., 5-10-5).' },
        g8: { term: 'Pistil', def: 'The small "hairs" on the calyxes that are initially white and turn orange/brown as they mature. They serve to catch pollen.' },
        g9: { term: 'Trichomes', def: 'The tiny, mushroom-shaped resin glands on the flowers and leaves that produce cannabinoids and terpenes. Their color (clear, milky, amber) is the best indicator of harvest time.' },
      }
    },
     furtherReading: {
      title: 'Further Reading & Resources',
      description: 'If you want to dive even deeper into the subject, here are some recommended books and websites that are considered standard works in the grower community:',
      resources: [
        {
          title: 'Marijuana Grower\'s Handbook by Ed Rosenthal',
          description: 'Another standard work from a legend in the scene. Rosenthal explains complex topics in an understandable way and offers practical advice for all experience levels.',
          url: 'https://www.amazon.com/Marijuana-Growers-Handbook-Internationally-Authority/dp/0932551467'
        },
        {
          title: 'Grow Weed Easy (Website)',
          description: 'An incredibly extensive and beginner-friendly online resource. Offers detailed guides, problem-solving tutorials, and articles on every conceivable topic of cannabis cultivation. Perfect for quickly clarifying specific questions.',
          url: 'https://www.growweedeasy.com'
        },
        {
          title: 'ICMag (International Cannagraphic Magazine)',
          description: 'One of the oldest and most respected online forums for cannabis cultivation. A vast resource of user-generated grow reports, guides, and discussions. Perfect for deep-diving into specific techniques or strains.',
          url: 'https://www.icmag.com/forum/'
        }
      ]
    },
    about: {
      title: 'About the App',
      version: 'v2.5.0',
      appName: '🌿 CannaGuide 2025',
      description: '🌿 CannaGuide 2025 Cannabis Grow Guide with Gemini - Your AI-powered digital companion for the entire cannabis cultivation cycle. This advanced web application is designed to help both novice and experienced growers master their cultivation journey—from seed selection to a successful harvest and cure.',
      features: '<strong>New Features:</strong> This version now includes plant-specific AI advisor archives and full CRUD functionality for all saved data (setups & mentor responses).',
      devWithAIStudioTitle: 'Developed with AI Studio',
      devWithAIStudioText: 'This app was developed with Google\'s <strong>AI Studio</strong>, an innovative platform that allows for the creation and modification of complex web applications through natural language commands. The user interface was designed, functionalities implemented, and the Gemini AI integrated for intelligent features through iterative prompts. AI Studio significantly accelerates the development process and opens up new possibilities in app creation.',
      getTheAppHere: 'View App in AI Studio',
      githubTitle: 'Open Source on GitHub',
      githubText: 'This application is fully open source and the code is available on GitHub. You are welcome to view the source code, report issues, or contribute to the project\'s development. Your collaboration helps make CannaGuide 2025 even better! <a href="https://github.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer" class="text-primary-400 hover:underline">View the project on GitHub</a>.',
      githubLinkText: 'View Project on GitHub',
      disclaimerTitle: 'Disclaimer',
      disclaimerText: 'All information in this app is for educational and entertainment purposes only. The cultivation of cannabis is subject to strict legal regulations that vary from country to country. Please inform yourself about the laws in your region and always act responsibly and in accordance with the law.',
      privacyTitle: 'Privacy Policy',
      privacyText: 'Your privacy is important to us. All your data, including plant journals and settings, is stored exclusively locally in your browser and never leaves your device.'
    }
  }
};