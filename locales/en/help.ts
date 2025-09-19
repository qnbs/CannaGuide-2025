export const helpView = {
  title: 'Help Center',
  tabs: {
    cultivation: 'Cultivation',
  },
  sections: {
    firstSteps: {
      title: 'First Steps & Main Features',
      description: 'Welcome to the Grow Guide! This app is your interactive companion for cannabis cultivation. Here is a brief overview:',
      list: {
        strains: '<strong>Discover Strains:</strong> Browse the <strong>{strainsView}</strong> database, use filters and search to find the perfect strain. Save favorites, add your own strains, and export data.',
        plants: '<strong>Manage Plants:</strong> Manage up to three plants in the <strong>{plantsView}</strong> section. Observe their development in real-time, log all actions in the journal, and use the AI Advisor, whose advice you can now save and manage per plant.',
        knowledge: '<strong>Acquire Knowledge:</strong> Follow the step-by-step <strong>{knowledgeView}</strong> to learn the basics. Check off the checklist items to track your progress and ask the AI mentor your questions, the answers to which you can now save, edit, and manage.',
        equipment: '<strong>Plan Setup:</strong> Plan your setup with the <strong>{equipmentView}</strong> configurator. You can now fully edit, delete, and export your saved setups.',
        settings: '<strong>Customize App:</strong> In the <strong>{settingsView}</strong> section, you can customize language, theme, and default notes, as well as back up and import your data.',
        commandPalette: '<strong>Command Palette:</strong> Press <strong>Cmd/Ctrl + K</strong> anywhere to quickly navigate, perform actions like "Water All", or inspect a specific plant.'
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
          a: 'The app is fully available in <strong>German</strong> and <strong>English</strong>. You can change the language at any time in the <strong>Settings</strong> section under "Display" -> "Language". Your selection is saved automatically.'
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
        a1: { term: 'Sativa, Indica & Hybrid', def: 'These terms describe the main categories of cannabis, which traditionally differ in growth patterns and effects:<ul><li><strong>Sativa:</strong> Grows tall and slender with narrow leaves. The effect is often described as cerebral, energizing, and creative ("head high").</li><li><strong>Indica:</strong> Grows short, bushy, and compact with broad leaves. The effect is mostly physical, relaxing, and sedating ("body high").</li><li><strong>Hybrid:</strong> A cross between Sativa and Indica genetics. Modern strains are almost all hybrids, whose properties and effects are a mix of both parents. The terpene profile is often a better indicator of the expected effect than the simple Sativa/Indica classification.</li></ul>' },
        a2: { term: 'The Entourage Effect', def: 'The entourage effect describes the theory that all these compounds (cannabinoids, terpenes, flavonoids) work together synergistically to produce a more comprehensive and nuanced effect than any single compound alone. For example, THC and CBD work differently together than when isolated. A full-spectrum product is therefore often more effective than an isolate.'},
        a3: { term: 'Flowering Time: Photoperiod vs. Autoflower', def: '<ul><li><strong>Photoperiod:</strong> These plants require a change in the light cycle to initiate the flowering phase. Indoors, this is done by switching to 12 hours of light and 12 hours of darkness (12/12). They can theoretically be kept in the vegetative phase indefinitely.</li><li><strong>Autoflower (Autoflowering):</strong> These strains contain Ruderalis genetics, a cannabis subspecies from cold regions. They automatically start flowering after a genetically determined time (typically 2-4 weeks), regardless of the light cycle. They have a shorter life cycle and are often more beginner-friendly and compact.</li></ul>' },
        a4: { term: 'Understanding Yield & Height', def: 'These figures are estimates that depend heavily on growing conditions.<ul><li><strong>Yield (g/m²):</strong> Indicates how much harvest (in grams of dry buds) can be expected per square meter of cultivation area under optimal conditions. Relevant for indoor growing.</li><li><strong>Yield (g/plant):</strong> Indicates the expected yield for a single plant, typically in outdoor cultivation.</li><li><strong>Factors:</strong> Genetics, light intensity, pot size, nutrient supply, training techniques, and the grower\'s experience have a massive impact on both values.</li></ul>' },
      }
    },
    plantCareABCs: {
      title: 'Plant Care ABCs',
      items: {
        pc1: { term: 'Life Stages in Detail', def: '<ul><li><strong>Seed/Germination:</strong> The seed needs moisture, warmth, and darkness. The taproot emerges.</li><li><strong>Seedling:</strong> The plant develops its first cotyledons and then the first true, serrated leaves. A very vulnerable phase.</li><li><strong>Vegetative Growth:</strong> The plant focuses on growing leaves, stems, and roots. Needs lots of light (18+ hours) and nitrogen-rich fertilizer.</li><li><strong>Flowering:</strong> After switching to a 12/12 light cycle (for photoperiod strains), the plant stops vegetative growth and develops flowers. The nutrient needs shift to phosphorus and potassium.</li><li><strong>Harvest, Drying & Curing:</strong> The crucial finishing steps. Proper drying and curing are essential for quality, taste, and longevity.</li></ul>' },
        pc2: { term: 'Mastering Vitals', def: '<ul><li><strong>pH & Nutrient Lockout:</strong> The pH value influences the roots\' ability to absorb nutrients. An incorrect pH leads to "nutrient lockout," where the plant starves even though nutrients are present in the substrate. Ideal in soil: 6.0-7.0, in hydro/coco: 5.5-6.5.</li><li><strong>EC (Electrical Conductivity):</strong> Measures nutrient concentration. Too high EC leads to "nutrient burn" (burnt leaf tips), too low leads to deficiencies.</li><li><strong>Substrate Moisture & Root Respiration:</strong> The roots need not only water but also oxygen. A constant cycle between moist and slightly dry is ideal. Chronic wetness leads to root rot.</li></ul>' },
        pc3: { term: 'Advanced Training Techniques', def: 'Training shapes the plant for maximum light exposure and yield.<ul><li><strong>LST (Low Stress Training):</strong> Gently bending branches down to create a wide, flat canopy.</li><li><strong>Topping:</strong> Cutting off the main shoot to force the plant to grow two new main shoots (bushier growth).</li><li><strong>FIMing (Fuck I Missed):</strong> A variation of topping where only part of the main shoot is removed, which can result in 4+ new shoots.</li><li><strong>SCROG (Screen of Green):</strong> A net is stretched over the plants. All shoots are woven through the net to create a perfectly level and light-efficient canopy of flowers.</li><li><strong>Defoliation:</strong> Targeted removal of large fan leaves to improve light penetration and air circulation to lower bud sites.</li></ul>' },
        pc4: { term: 'Common Problems & Solutions', def: '<ul><li><strong>Nutrient Deficiencies (Mobile Nutrients like N, P, K, Mg):</strong> Symptoms first appear on the lower, older leaves as the plant moves nutrients to new growth. <strong>Solution:</strong> Adjust fertilization.</li><li><strong>Nutrient Deficiencies (Immobile Nutrients like Ca, S, B):</strong> Symptoms first appear on the upper, new leaves as the plant cannot move these nutrients internally. <strong>Solution:</strong> Adjust fertilization; often a Cal/Mag supplement is needed.</li><li><strong>Pests:</strong><ul><li><strong>Spider Mites:</strong> Tiny white dots on leaves, fine webbing. <strong>Solution:</strong> Neem oil, predatory mites.</li><li><strong>Fungus Gnats:</strong> Small black flies around the soil. <strong>Solution:</strong> Yellow sticky traps, let soil dry out more, nematodes.</li></ul></li></ul>' },
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
        g6: { term: 'N-P-K', def: 'The ratio of the three primary macronutrients that plants need: Nitrogen (N), Phosphorus (P), and Potassium (K). Fertilizer bottles often indicate this ratio as numbers (e.g., 5-10-5).' },
        g7: { term: 'Phenotype', def: 'The observable characteristics of a plant, resulting from the interaction of its genetics (genotype) and the environment. Seeds of the same strain can produce different phenotypes.' },
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
          title: 'Leafly (Website)',
          description: 'Although primarily known as a strain database, Leafly also offers a large learning section with articles on cultivation techniques, science, and culture. Ideal for learning about specific terpene profiles or cannabinoids.',
          url: 'https://www.leafly.com/learn'
        }
      ]
    },
    about: {
      title: 'About the App',
      version: 'v2.5.0',
      appName: 'Cannabis Grow Guide with Gemini',
      description: 'This app is an interactive guide that supports you on your cannabis cultivation journey. Track your plants, learn about strains, and get expert tips on equipment and techniques.',
      features: '<strong>New Features:</strong> This version now includes plant-specific AI advisor archives and full CRUD functionality for all saved data (setups & mentor responses).',
      devWithAIStudioTitle: 'Developed with AI Studio',
      devWithAIStudioText: 'This app was developed with Google\'s <strong>AI Studio</strong>, an innovative platform that allows for the creation and modification of complex web applications through natural language commands. The user interface was designed, functionalities implemented, and the Gemini AI integrated for intelligent features through iterative prompts. AI Studio significantly accelerates the development process and opens up new possibilities in app creation.',
      getTheAppHere: 'Get the App Here',
      githubTitle: 'Open Source on GitHub',
      githubText: 'This application is fully open source and the code is available on GitHub. You are welcome to view the source code, report issues, or contribute to the project\'s development. Your collaboration helps make the Grow Guide even better!',
      githubLinkText: 'View the project on GitHub',
      disclaimerTitle: 'Disclaimer',
      disclaimerText: 'All information in this app is for educational and entertainment purposes only. The cultivation of cannabis is subject to strict legal regulations that vary from country to country. Please inform yourself about the laws in your region and always act responsibly and in accordance with the law.',
      privacyTitle: 'Privacy',
      privacyText: 'Your privacy is important to us. All your data, including plant journals and settings, is stored exclusively locally in your browser and never leaves your device.'
    }
  }
};