export const knowledgeView = {
    title: 'Knowledge Hub',
    subtitle: 'Your interactive guide to successful cultivation.',
    tabs: {
        mentor: 'AI Mentor',
        guide: 'Grow Guide',
        archive: 'Mentor Archive',
        breeding: 'Breeding Lab',
        sandbox: 'Sandbox',
        growTech: 'Grow Tech 2026',
        lexikon: 'Lexicon',
        atlas: 'Disease Atlas',
        rechner: 'Calculator',
        lernpfad: 'Learning Paths',
        analytik: 'Analytics',
        navLabel: 'Knowledge sections',
    },
    hub: {
        selectPlant: 'Select Plant',
        noPlants: 'No active plants for contextual advice. Start a grow to begin!',
        todaysFocus: "Today's Focus for {{plantName}}",
    },
    aiMentor: {
        title: 'AI Mentor',
        plantContext: 'Chatting with AI Mentor in the context of {{name}}',
        plantContextSubtitle: 'Select a plant to ask contextual questions and get advice.',
        startChat: 'Start Chat',
        inputPlaceholder: 'Ask the mentor...',
        clearChat: 'Clear Chat',
        clearConfirm: 'Are you sure you want to clear the chat history for this plant?',
    },
    archive: {
        title: 'Mentor Archive',
        empty: "You haven't archived any mentor responses yet.",
        saveButton: 'Save to Archive',
        saveSuccess: 'Response saved to archive!',
        queryLabel: 'Your Query',
        editTitle: 'Edit Response',
    },
    breeding: {
        title: 'Breeding Lab',
        description:
            'Cross your collected seeds to create new, unique strains with combined characteristics.',
        collectedSeeds: 'Collected Seeds',
        noSeeds: 'Collect seeds from harvest-ready plants to start breeding.',
        parentA: 'Parent A',
        parentB: 'Parent B',
        clearParent: 'Clear {{title}}',
        selectSeed: 'Select a seed',
        dropSeed: 'Drop seed here',
        breedButton: 'Breed New Strain',
        resultsTitle: 'Breeding Result',
        newStrainName: 'New Strain Name',
        potentialTraits: 'Potential Traits',
        saveStrain: 'Save Strain',
        breedingSuccess: 'Successfully bred "{{name}}"! It has been added to "My Strains".',
        splicingGenes: 'Splicing genes...',
        flowering: 'Flowering',
        phenoTracking: 'Pheno Tracking',
        vigor: 'Vigor',
        resin: 'Resin',
        aroma: 'Aroma',
        diseaseResistance: 'Disease Resistance',
        automatedGenetics: 'Automated Genetics Estimate',
        stabilityScore: 'Stability Score',
        arTitle: 'AR Breeding Preview',
        arSupported: 'WebXR ready',
        arFallback: '3D fallback',
        arPreviewLabel: 'Three-dimensional breeding preview',
        arLoading: 'Loading AR preview...',
        webglUnavailableTitle: '3D preview unavailable',
        webglUnavailableDescription:
            'Your browser could not create a WebGL context, so this preview is shown as a static fallback.',
        webglUnavailableHint:
            'Turn on hardware acceleration or switch to a GPU-enabled browser profile to restore the live preview.',
    },
    scenarios: {
        toppingVsLst: {
            title: 'Run Topping vs. LST Experiment',
            description:
                'Simulates a 14-day growth period comparing a plant that receives LST against one that has been topped.',
        },
        tempPlus2c: {
            title: 'Run Temperature +2\u00b0C Experiment',
            description:
                'Simulates a 14-day growth period comparing baseline conditions against a +2\u00b0C canopy temperature increase.',
        },
    },
    knowledgebase: {
        'phase1-prep': {
            title: 'Phase 1: Preparation & Equipment',
            content: `<h3>Welcome to the Grow!</h3><p>A successful harvest begins with solid preparation. This phase is all about creating the perfect environment before your seed even touches the medium.</p>
                      <strong>Cleanliness is Key:</strong> Thoroughly clean and disinfect your entire grow space, including tent walls, floor, and all equipment to prevent pests and diseases from day one.<br>
                      <strong>Equipment Check:</strong>
                      <ul>
                        <li><strong>Light:</strong> Test your lamp and timer. For seedlings, position the light much higher than you would for a mature plant to avoid stress. Check manufacturer recommendations.</li>
                        <li><strong>Ventilation:</strong> Ensure your exhaust fan, intake, and any circulation fans are working correctly. Good airflow is critical.</li>
                        <li><strong>Medium & Pots:</strong> If using soil, lightly pre-moisten it before planting. Ensure your pots have excellent drainage to prevent root rot.</li>
                      </ul>
                      <strong>Environment Calibration:</strong> Calibrate your thermo-hygrometers. Aim for a stable environment around <strong>22-25°C (72-77°F)</strong> and <strong>65-75% relative humidity</strong>.`,
        },
        'phase2-seedling': {
            title: 'Phase 2: Germination & Seedling',
            content: `<h3>The First Weeks of Life</h3><p>This is the most delicate phase. The motto is: less is more. Avoid over-loving your plant.</p>
                      <strong>Germination:</strong> Keep the medium consistently moist, but never soaking wet. A humidity dome can help maintain high humidity (70-80%), which is ideal for sprouting.<br>
                      <strong>Light:</strong> Seedlings don't need intense light. A lower wattage fluorescent or a dimmed LED is perfect. An 18/6 light cycle is standard. Keep lights far enough away to prevent burning—if the back of your hand feels uncomfortably warm at canopy level, the light is too close.<br>
                      <strong>Water:</strong> Water sparingly in a small circle around the stem. The root system is tiny and can easily drown.<br>
                      <strong>Nutrients:</strong> Do not feed nutrients yet! Most soils contain enough for the first 2-3 weeks. Wait until the plant has at least 3-4 sets of true leaves before introducing a very weak (1/4 strength) nutrient solution.`,
        },
        'phase3-vegetative': {
            title: 'Phase 3: Vegetative Growth',
            content: `<h3>Time to Grow!</h3><p>During this phase, your plant will focus on developing a strong structure of leaves, branches, and roots. This is the time for training.</p>
                      <strong>Light:</strong> Your plant can now handle much more light. Gradually increase the intensity or lower the light source. An 18/6 light cycle remains standard for photoperiod plants.<br>
                      <strong>Nutrients:</strong> Slowly increase nutrient strength. A fertilizer rich in Nitrogen (N) is crucial for leafy growth.<br>
                      <strong>Training:</strong> Now is the perfect time to start training to create an even canopy and increase your final yield. Begin with <strong>LST (Low-Stress Training)</strong> to gently bend branches, or perform <strong>Topping</strong> to create multiple main colas.<br>
                      <strong>Environment:</strong> The ideal humidity drops to around 50-70%. Good air circulation becomes more important as the plant grows denser.`,
        },
        'phase4-flowering': {
            title: 'Phase 4: Flowering',
            content: `<h3>The Bloom Begins</h3><p>This is the most exciting phase where your plant starts producing buds. The switch in the light cycle is the trigger for photoperiod strains.</p>
                      <strong>Light Cycle:</strong> To initiate flowering, you must switch to a strict <strong>12 hours of light and 12 hours of *uninterrupted* darkness</strong>.<br>
                      <strong>The Stretch:</strong> In the first 2-3 weeks of flowering, your plant may double or even triple in height. Be prepared for this growth spurt!<br>
                      <strong>Nutrients:</strong> Switch to a bloom-specific fertilizer, which is lower in Nitrogen (N) and higher in Phosphorus (P) and Potassium (K) to support bud development.<br>
                      <strong>Humidity:</strong> Gradually lower the humidity to <strong>40-50%</strong> to reduce the risk of bud rot (Botrytis) in the dense flowers.`,
        },
        'phase5-harvest': {
            title: 'Phase 5: Harvest, Drying & Curing',
            content: `<h3>The Finishing Touches</h3><p>Patience in this final phase is what separates mediocre from top-shelf cannabis. Don't rush it!</p>
                      <strong>Harvest Time:</strong> The best indicator is the color of the trichomes. Use a jeweler's loupe or microscope. Harvest when most trichomes are cloudy/milky for peak THC, with a few amber ones for a more relaxing effect. Clear trichomes are too early.<br>
                      <strong>Drying:</strong> Hang branches upside down in a dark, cool space with gentle air circulation. Aim for <strong>18-20°C (64-68°F)</strong> and <strong>55-60% humidity</strong>. This slow-dry process takes 7-14 days and is crucial for preserving terpenes.<br>
                      <strong>Curing:</strong> Once smaller stems snap instead of bend, place the buds in airtight glass jars. Open the jars daily for 5-10 minutes for the first week ("burping") to release moisture. This process dramatically improves flavor, aroma, and smoothness.`,
        },
        'fix-overwatering': {
            title: 'Troubleshooting: Overwatering',
            content: `<h3>Help, My Plant is Drowning!</h3><p>Overwatering is the #1 mistake for new growers. It suffocates the roots, preventing them from absorbing oxygen and nutrients.</p>
                      <strong>Symptoms:</strong> The entire plant looks droopy and sad. The leaves feel firm and heavy, and curl downwards (clawing). The soil remains dark and wet for days.<br>
                      <strong>Immediate Actions:</strong>
                      <ul>
                        <li><strong>Stop Watering:</strong> Do not water again until the pot is significantly lighter.</li>
                        <li><strong>Improve Airflow:</strong> Point a fan at the soil surface to help it dry out.</li>
                        <li><strong>Check Drainage:</strong> Ensure your pot is not sitting in a puddle of runoff water.</li>
                      </ul>
                      <strong>Prevention:</strong> Always lift your pot to feel its weight before and after watering. This is the most reliable way to know when it's time to water again.`,
        },
        'fix-calcium-deficiency': {
            title: 'Troubleshooting: Calcium Deficiency',
            content: `<h3>Fixing Calcium Deficiency</h3><p>Calcium is an immobile nutrient, meaning the plant can't move it from old leaves to new ones. Deficiency signs usually appear on new growth.</p>
                      <strong>Symptoms:</strong> Small, rusty-brown spots on leaves, often with yellowing edges. Stunted or twisted new growth. Weak stems.<br>
                      <strong>Common Causes:</strong>
                      <ul>
                        <li><strong>Incorrect pH:</strong> This is the most common cause. If the pH at the roots is too low, the plant cannot absorb available calcium.</li>
                        <li><strong>Using RO/Distilled Water:</strong> This water is stripped of minerals, so you must add them back.</li>
                        <li><strong>Coco Coir Medium:</strong> Coco naturally binds to calcium, making it unavailable to the plant unless you use a buffered coco product or supplement.</li>
                      </ul>
                      <strong>Solution:</strong>
                      <ol>
                        <li>First, always check and correct the pH of your water/nutrient solution.</li>
                        <li>Use a Cal-Mag (Calcium-Magnesium) supplement, especially if using RO water or coco.</li>
                      </ol>`,
        },
        'fix-nutrient-burn': {
            title: 'Troubleshooting: Nutrient Burn',
            content: `<h3>Fixing Nutrient Burn (Overfeeding)</h3><p>Nutrient burn occurs when a plant is fed more nutrients than it can use, causing toxicity.</p>
                      <strong>Symptoms:</strong> The very tips of the leaves turn yellow, then brown and crispy. This often starts on upper leaves. The rest of the leaf may become a very dark, glossy green. In severe cases, the tips will curl upwards.<br>
                      <strong>Common Causes:</strong>
                      <ul>
                        <li><strong>Nutrient solution is too strong (high EC/PPM).</strong></li>
                        <li><strong>Feeding too frequently without allowing the medium to dry slightly.</strong></li>
                        <li><strong>Using "hot" soil that is heavily amended with nutrients from the start.</strong></li>
                      </ul>
                      <strong>Solution:</strong>
                      <ol>
                        <li><strong>Flush the medium:</strong> Water the plant with a generous amount of plain, pH-adjusted water until there is significant runoff. This washes out excess nutrient salts.</li>
                        <li><strong>Reduce feeding strength:</strong> For the next feeding, use only half of the recommended nutrient dose and slowly work your way back up.</li>
                      </ol>`,
        },
        'fix-pests': {
            title: 'Troubleshooting: Common Pests',
            content: `<h3>Dealing with Unwanted Guests</h3><p>Early detection is key to controlling pests before they become a major infestation.</p>
                      <strong>Spider Mites:</strong>
                      <ul>
                        <li><strong>Symptoms:</strong> Tiny white or yellow speckles on the top of leaves. In advanced stages, you'll see fine webbing between leaves and buds.</li>
                        <li><strong>Solution:</strong> They thrive in hot, dry conditions. Increase humidity. Spray plants (especially the undersides of leaves) with a neem oil solution or insecticidal soap.</li>
                      </ul>
                      <strong>Fungus Gnats:</strong>
                      <ul>
                        <li><strong>Symptoms:</strong> Small, black flies buzzing around the soil surface. Their larvae in the soil can damage roots, especially on seedlings.</li>
                        <li><strong>Solution:</strong> They are a sign of overwatering. Let the top layer of your soil dry out completely between waterings. Use yellow sticky traps to catch the adults.</li>
                      </ul>`,
        },
        'concept-training': {
            title: 'Core Concept: Plant Training',
            content: `<h3>Why Train Your Plants?</h3><p>Training manipulates a plant's growth to create a more efficient structure, leading to significantly higher yields and better quality buds.</p>
                      <strong>The Goal:</strong> Break "apical dominance" (the tendency to grow one main central cola) and create a flat, even canopy where multiple bud sites receive direct, intense light.<br>
                      <strong>Main Types:</strong>
                      <ul>
                        <li><strong>LST (Low-Stress Training):</strong> Gently bending and tying down branches to guide their growth horizontally. Can be started very early and is low-risk.</li>
                        <li><strong>HST (High-Stress Training):</strong> Techniques that involve intentionally damaging the plant to promote bushier growth, such as <strong>Topping</strong> (cutting the main stem) or <strong>Super Cropping</strong> (pinching stems). These should only be done on healthy plants during the vegetative stage.</li>
                      </ul>
                      <strong>Result:</strong> Instead of one large main cola and many small "popcorn" buds, you get multiple large, dense colas and a much larger overall harvest.`,
        },
        'concept-environment': {
            title: 'Core Concept: The Environment',
            content: `<h3>Mastering Your Grow Space</h3><p>Your environment is just as important as light and nutrients. The three pillars are Temperature, Humidity, and Airflow.</p>
                      <strong>Temperature & Humidity:</strong> These two are linked and their relationship is measured by <strong>VPD (Vapor Pressure Deficit)</strong>. Keeping VPD in the ideal range for each growth stage is key to maximizing growth.
                      <ul>
                        <li><strong>Seedling/Veg:</strong> Warmer temps (22-28°C) and higher humidity (50-70%).</li>
                        <li><strong>Flower:</strong> Cooler temps (20-26°C) and lower humidity (40-50%) to increase resin production and prevent mold.</li>
                      </ul>
                      <strong>Airflow:</strong>
                      <ul>
                        <li><strong>Exhaust Fan:</strong> Constantly removes hot, stale, humid air and pulls in fresh air rich in CO₂. This is non-negotiable.</li>
                        <li><strong>Circulation Fan(s):</strong> Creates a gentle breeze within the tent. This strengthens stems, prevents humid air pockets from forming around leaves, and deters pests.</li>
                      </ul>`,
        },
    },
    sandbox: {
        title: 'Experimental Sandbox',
        experimentOn: 'Experiment on {{name}}',
        scenarioDescription: 'Compared {{actionA}} vs. {{actionB}} over {{duration}} days.',
        runningSimulation: 'Running accelerated simulation...',
        startExperiment: 'New Experiment',
        modal: {
            title: 'Start New Experiment',
            description: 'Select a plant to run a 14-day "Topping vs. LST" simulation.',
            runScenario: 'Start Scenario',
            noPlants: 'You must first grow a plant to start an experiment.',
        },
        savedExperiments: 'Saved Experiments',
        noExperiments: 'No experiments saved yet.',
        basedOn: 'Based on: {{name}}',
        run: 'Run: {{date}}',
    },
    guide: {
        phases: 'Phases',
        coreConcepts: 'Core Concepts',
        troubleshooting: 'Troubleshooting',
        growTech: 'Grow Tech 2026',
        genetics: 'Genetics',
        searchPlaceholder: 'Search guides...',
        noResults: 'No articles found for "{{term}}"',
        readProgress: '{{read}} of {{total}} articles read',
    },
    growLog: {
        title: 'Grow-Log RAG',
        description:
            'Query your own journal directly. Relevant log entries are loaded first, then analyzed by the AI.',
        placeholder: 'e.g. Why does my VPD fluctuate in week 4?',
        analyzing: 'Analyzing...',
        startAnalysis: 'Start RAG Analysis',
        activeCorpus: 'Active plants in RAG corpus: {{count}}',
    },
    lexikon: {
        searchPlaceholder: 'Search terms...',
        filterLabel: 'Filter by category',
        all: 'All',
        categories: {
            cannabinoid: 'Cannabinoids',
            terpene: 'Terpenes',
            flavonoid: 'Flavonoids',
            nutrient: 'Nutrients',
            disease: 'Diseases',
            general: 'General',
        },
        noResults: 'No results for "{{term}}"',
        resultCount: '{{count}} of {{total}} terms',
        totalCount: '{{count}} terms',
        noDefinition: 'No definition available.',
    },
    atlas: {
        searchPlaceholder: 'Search diagnoses...',
        allCategories: 'All categories',
        allUrgencies: 'All urgencies',
        noResults: 'No entries found.',
        filterByCategory: 'Filter by category',
        filterByUrgency: 'Filter by urgency',
        entryCount: '{{count}} entries',
        close: 'Close',
        category: {
            deficiency: 'Deficiency',
            toxicity: 'Toxicity',
            environmental: 'Environmental',
            pest: 'Pests',
            disease: 'Disease',
        },
        severity: {
            low: 'Low',
            medium: 'Medium',
            high: 'High',
            critical: 'Critical',
        },
        urgency: {
            monitor: 'Monitor',
            act_soon: 'Act Soon',
            act_immediately: 'Act Immediately',
        },
        detail: {
            symptoms: 'Symptoms',
            causes: 'Causes',
            treatment: 'Treatment',
            prevention: 'Prevention',
            relatedTerms: 'Related Terms',
        },
        diseases: {
            'nitrogen-deficiency': {
                name: 'Nitrogen Deficiency',
                symptoms:
                    'Yellowing starts on older lower leaves and progresses upward. Leaves turn pale yellow-green then fully yellow. Stunted growth.',
                causes: 'Over-watering, low pH (locks out N), insufficient nitrogen in nutrient solution, root damage.',
                treatment:
                    'Flush medium with pH-correct water, then feed a nitrogen-rich nutrient solution. Correct pH to 6.0-7.0 (soil) or 5.5-6.5 (hydro).',
                prevention: 'Monitor pH consistently, use balanced nutrients, avoid overwatering.',
            },
            'phosphorus-deficiency': {
                name: 'Phosphorus Deficiency',
                symptoms:
                    'Purple or reddish discoloration on the undersides of leaves and stems. Dark green leaves that may curl downward. Slow growth.',
                causes: 'Low pH (below 6.0 in soil), cold root zone temperatures (below 15C), low phosphorus in solution.',
                treatment:
                    'Raise pH if needed, increase grow-room temperature, supplement with phosphorus-rich bloom nutrient.',
                prevention:
                    'Keep root zone above 18C, maintain correct pH, use bloom nutrients when entering flower.',
            },
            'potassium-deficiency': {
                name: 'Potassium Deficiency',
                symptoms:
                    'Crispy brown leaf edges and tips, starting on older leaves. Yellowing between the veins. Weak stems.',
                causes: 'High pH (locks out K), excessive calcium or magnesium competing for uptake, low potassium in solution.',
                treatment:
                    'Check and correct pH, reduce competing nutrients if excessive, supplement potassium.',
                prevention:
                    'Use a complete nutrient formula with adequate potassium, especially during late flowering.',
            },
            'calcium-deficiency': {
                name: 'Calcium Deficiency',
                symptoms:
                    'Small brown or rust-colored spots on new leaves. Twisted or crinkled new growth. Weak stems.',
                causes: 'Low pH reducing calcium availability, use of RO/distilled water without remineralization, coco coir without buffering.',
                treatment: 'Correct pH to 6.2-7.0, add Cal-Mag supplement, buffer coco before use.',
                prevention: 'Buffer coco coir, use Cal-Mag with RO water, maintain correct pH.',
            },
            'magnesium-deficiency': {
                name: 'Magnesium Deficiency',
                symptoms:
                    'Yellowing between the veins (interveinal chlorosis) on mid-to-older leaves while veins remain green. Leaves may curl upward.',
                causes: 'Low pH, high potassium competing with magnesium uptake, insufficient magnesium in solution.',
                treatment:
                    'Correct pH, reduce potassium if excessive, add Cal-Mag or Epsom salt (MgSO4) -- 1 tsp/gallon foliar spray for fast results.',
                prevention:
                    'Use a balanced nutrient formula, include Cal-Mag supplement, maintain correct pH.',
            },
            'iron-deficiency': {
                name: 'Iron Deficiency',
                symptoms:
                    'Bright yellow (chlorotic) leaves on very new growth, while veins remain green. Classic interveinal chlorosis pattern.',
                causes: 'High pH (most common, especially above 7.0), waterlogged roots, excessive phosphorus or manganese competing.',
                treatment: 'Lower pH to 6.0-6.5, improve drainage, use chelated iron supplement.',
                prevention:
                    'Maintain proper pH, avoid overwatering, use chelated micronutrient package.',
            },
            'zinc-deficiency': {
                name: 'Zinc Deficiency',
                symptoms:
                    'Yellowing of new leaf tissue between veins. Leaves may appear mottled or distorted. Short internodal spacing.',
                causes: 'High pH, excessive phosphorus inhibiting zinc uptake, low zinc in medium or solution.',
                treatment:
                    'Correct pH to optimal range, reduce phosphorus if excessive, supplement with zinc.',
                prevention: 'Use a complete micronutrient formula, maintain correct pH.',
            },
            'sulfur-deficiency': {
                name: 'Sulfur Deficiency',
                symptoms:
                    'New leaves turn uniformly pale yellow to white. Unlike nitrogen deficiency, it starts on young/new growth.',
                causes: 'Low sulfur in nutrient solution, very high pH, recently transplanted or flushed plants.',
                treatment:
                    'Add a sulfur-containing nutrient (many base nutrients include it), check pH.',
                prevention: 'Use a complete nutrient formula, avoid extreme pH.',
            },
            'nutrient-burn': {
                name: 'Nutrient Burn (Toxicity)',
                symptoms:
                    'Leaf tips turn brown and crispy, then progress inward. Tips may curl upward. Dark glossy green coloration on leaves.',
                causes: 'Nutrient solution EC/PPM too high, feeding too frequently, highly amended hot soil.',
                treatment:
                    'Flush medium with 3x the pot volume of plain pH-adjusted water. Reduce next feeding to 50% strength.',
                prevention:
                    'Start low with nutrients, increase gradually, measure EC/PPM regularly.',
            },
            'nitrogen-toxicity': {
                name: 'Nitrogen Toxicity',
                symptoms:
                    'Very dark glossy green leaves. Tips may claw downward (the "claw"). Excessive leafy growth, reduced flower density.',
                causes: 'Too much nitrogen, especially during flowering when N demand drops.',
                treatment:
                    'Stop nitrogen feeding, flush with plain pH-correct water, switch to bloom-ratio nutrients.',
                prevention:
                    'Reduce nitrogen when switching to flowering, use bloom-specific nutrients.',
            },
            overwatering: {
                name: 'Overwatering',
                symptoms:
                    'Entire plant droops. Leaves feel firm but droop down with rounded curl. Soil stays wet for many days. Yellowing.',
                causes: 'Watering too frequently, poor drainage, pots without holes, growing medium too dense.',
                treatment:
                    'Stop watering completely until pot is very light. Improve aeration around pot. Consider repotting into a better-draining mix.',
                prevention:
                    'Lift pots to feel weight -- water only when noticeably lighter. Use containers with good drainage holes. Allow medium to partially dry.',
            },
            underwatering: {
                name: 'Underwatering',
                symptoms:
                    'Entire plant wilts and droops. Leaves feel thin and papery with a slight inward curl. Pot is very light.',
                causes: 'Watering too infrequently, dry climate, fast-draining medium, large plant in small pot.',
                treatment:
                    'Water thoroughly until runoff drains from the bottom. Plant should recover within hours.',
                prevention: 'Check pot weight regularly. Water when the top inch of medium is dry.',
            },
            'heat-stress': {
                name: 'Heat Stress',
                symptoms:
                    'Leaf edges and tips curl upward like tacos. Bleached or burned patches where leaves are closest to light. Wilting despite adequate water.',
                causes: 'Grow room temperature above 30C, lights too close to canopy, poor ventilation, hotspots.',
                treatment:
                    'Improve ventilation, raise lights, add air conditioning or cooler AC unit. Mist leaves in the short term.',
                prevention:
                    'Keep canopy temperature below 28C. Ensure adequate airflow above canopy.',
            },
            'light-burn': {
                name: 'Light Burn',
                symptoms:
                    'Bleached white or yellow patches on uppermost leaves nearest the light. Leaves directly below the light appear bleached despite adequate nutrients.',
                causes: 'Grow light too close to the canopy, excessive light intensity (PPFD too high).',
                treatment:
                    'Raise light immediately. The bleached areas will not recover, but new growth will be healthy.',
                prevention:
                    'Follow manufacturer minimum hanging distance guidelines, monitor PPFD.',
            },
            'ph-lockout': {
                name: 'pH Lockout',
                symptoms:
                    'Multiple deficiency symptoms appearing simultaneously despite adequate nutrients. Plant appears generally unwell.',
                causes: 'Nutrient solution or growing medium pH is outside the optimal absorption range for key nutrients.',
                treatment:
                    'Test root zone pH (runoff test). Flush medium with correctly pH-adjusted water. Resume feeding at correct pH.',
                prevention: 'Always pH your water and nutrient solution. Test runoff pH weekly.',
            },
            'spider-mites': {
                name: 'Spider Mites',
                symptoms:
                    'Tiny white/yellow stippling dots on leaf surfaces. Fine silky webbing between leaves and stems. Tiny moving dots visible with a loupe.',
                causes: 'Dry, hot conditions. Infected clones or growing medium. Poor airflow.',
                treatment:
                    'Spray all leaf surfaces (especially undersides) with neem oil, insecticidal soap, or spinosad. Increase humidity. Repeat every 3 days for 2 weeks.',
                prevention:
                    'Maintain 50-60% humidity, ensure airflow, inspect new plants before introducing to grow room.',
            },
            'fungus-gnats': {
                name: 'Fungus Gnats',
                symptoms:
                    'Small black flies around the soil surface. Wilting seedlings due to root damage from larvae. Tiny white larvae visible in soil.',
                causes: 'Overwatering keeping soil surface moist, allowing adults to lay eggs. Peat-heavy mixes.',
                treatment:
                    'Let top 2 inches of soil dry completely. Use yellow sticky traps for adults. Apply beneficial nematodes or Bacillus thuringiensis israelensis (Bti) to soil.',
                prevention:
                    'Avoid overwatering, allow soil surface to dry, use a layer of perlite on top of soil.',
            },
            aphids: {
                name: 'Aphids',
                symptoms:
                    'Clusters of small, soft-bodied insects on new growth and leaf undersides. Sticky honeydew residue on leaves. Curling or distorted new leaves.',
                causes: 'Open grow space, contaminated clones, or outdoor exposure.',
                treatment:
                    'Blast with water, apply insecticidal soap or neem oil, introduce beneficial insects (ladybugs, lacewings).',
                prevention: 'Maintain closed grow environment, inspect all new plants.',
            },
            thrips: {
                name: 'Thrips',
                symptoms:
                    'Silver-white streaks or patches on leaves (feeding scars). Black fecal dots on leaf surfaces. Leaves may become bronzed.',
                causes: 'Contaminated plants or soil, open grow environment.',
                treatment:
                    'Apply spinosad, neem oil, or predatory insects (Amblyseius cucumeris). Repeat regularly.',
                prevention: 'Strict quarantine on new clones, use sticky yellow traps early.',
            },
            'powdery-mildew': {
                name: 'Powdery Mildew (PM)',
                symptoms:
                    'White powdery spots on leaf surfaces, stems, and buds. Spots spread rapidly. Affected tissue may turn yellow and die.',
                causes: 'High humidity (above 60%) combined with poor airflow and moderate temperatures (15-27C). Overcrowded plants.',
                treatment:
                    'Remove heavily affected leaves. Apply potassium bicarbonate, neem oil, or dilute hydrogen peroxide spray. Increase airflow and reduce humidity urgently.',
                prevention:
                    'Keep humidity below 50% in flower. Ensure strong airflow through the canopy. Avoid overcrowding.',
            },
            botrytis: {
                name: 'Botrytis (Bud Rot / Grey Mold)',
                symptoms:
                    'Grey fuzzy mold appearing inside dense buds. Brown mushy patches in the center of colas. Grey spores visible.',
                causes: 'High humidity (above 50% in flower), poor airflow, dense buds, temperatures below 20C with high RH.',
                treatment:
                    'Immediately remove and bag all affected material. Do not shake buds -- spores spread. Increase airflow and lower humidity drastically.',
                prevention:
                    'Keep flowering humidity 40-50%. Defoliate dense canopy for airflow. Harvest on time.',
            },
            'root-rot': {
                name: 'Root Rot (Pythium/Phytophthora)',
                symptoms:
                    'Roots turn brown/grey and slimy instead of white and firm. Foul smell from the root zone. Plant wilts despite adequate water. In hydro: discolored nutrient solution.',
                causes: 'Overwatering or poor drainage. Anaerobic conditions in root zone. Water temperatures above 22C in hydro. Lack of beneficial microbes.',
                treatment:
                    'In soil: reduce watering, improve drainage, apply beneficial bacteria/mycorrhizae. In hydro: change reservoir, lower water temp, dose with hydrogen peroxide or beneficial bacteria.',
                prevention:
                    'Avoid overwatering. Keep hydro reservoir below 68F/20C. Use air stones. Inoculate with beneficial microbes.',
            },
        },
    },
    rechner: {
        title: 'Calculator Hub',
        vpdTab: 'VPD',
        nutrientTab: 'Nutrients',
        phTab: 'pH / EC',
        terpeneEntourageTab: 'Entourage',
        transpirationTab: 'Transpiration',
        ecTdsTab: 'EC/TDS',
        lightSpectrumTab: 'Light',
        cannabinoidRatioTab: 'Cannabinoids',
        equipmentLink: 'For advanced calculators, see the Equipment section.',
        vpd: {
            temperature: 'Air Temperature',
            humidity: 'Relative Humidity',
            leafOffset: 'Leaf Temp. Offset',
            celsius: '°C',
            result: 'VPD Result',
            statusLow: 'VPD too low -- risk of mold and slow growth.',
            statusOk: 'VPD optimal -- ideal transpiration.',
            statusHigh: 'VPD too high -- risk of heat stress and wilting.',
            refTitle: 'VPD Reference Ranges',
            rangeSeedling: 'Seedling',
            rangeVeg: 'Vegetative',
            rangeFlower: 'Flowering',
            rangeLateFlower: 'Late Flower',
            simulate: 'Simulate 7 days',
            simulationTitle: '7-Day VPD Curve',
            explainAi: 'Explain with AI',
            aiExplanationTitle: 'AI Explanation',
            aiLoading: 'Generating explanation...',
            deepDive: 'Deep dive: Learning Path ->',
        },
        nutrient: {
            growStage: 'Growth Stage',
            volume: 'Water Volume (L)',
            seedling: 'Seedling',
            veg: 'Vegetative',
            earlyFlower: 'Early Flower',
            lateFlower: 'Late Flower',
            seedlingDesc: 'Light nutrition, high N for root and leaf development.',
            vegDesc: 'Strong N, moderate P/K for vigorous vegetative growth.',
            earlyFlowerDesc: 'Reduce N, increase P/K as buds begin to form.',
            lateFlowerDesc: 'Minimal N -- ripening stage, focus on P/K and flushable minerals.',
            targetEc: 'Target EC (mS/cm)',
            dosage: 'Approximate Dosage',
            disclaimer: 'Values are guidelines only. Always measure EC and pH after mixing.',
        },
        ph: {
            intro: 'Ideal pH and EC ranges vary by growing medium. Keeping within these ranges ensures optimal nutrient availability.',
            medium: 'Medium',
            phRange: 'pH Range',
            ecRange: 'EC Range (mS/cm)',
            note: 'Always pH your water and nutrient solution after every mix. Use a calibrated pH meter.',
        },
        terpeneEntourage: {
            description:
                'Enter your terpene profile to calculate the entourage effect score and synergy matrix. Based on Russo (2011) and Booth & Bohlmann (2019).',
            terpeneName: 'Terpene',
            terpenePercent: 'Percentage',
            addTerpene: 'Add terpene',
            remove: 'Remove',
            score: 'Entourage Score',
            dominant: 'Dominant',
            profile: 'Profile',
            synergyMatrix: 'Synergy Pairs',
            learnMore: 'Learn more about terpene science ->',
            explainAi: 'Explain with AI',
            aiExplanationTitle: 'AI Explanation',
            aiLoading: 'Generating explanation...',
            deepDive: 'Deep dive: Learning Path ->',
        },
        transpiration: {
            description:
                'Calculate canopy transpiration rate from VPD, stomatal conductance, and Leaf Area Index (Penman-Monteith approximation).',
            vpd: 'VPD',
            gsmmol: 'Stomatal Conductance',
            lai: 'Leaf Area Index (LAI)',
            hours: 'Photoperiod (h/day)',
            leafRate: 'Leaf Transpiration',
            canopyRate: 'Canopy Transpiration',
            dailyWater: 'Daily Water Use',
            learnMore: 'Learn more about plant water management ->',
            simulate: 'Simulate 7 days',
            simulationTitle: '7-Day Projection',
            explainAi: 'Explain with AI',
            aiExplanationTitle: 'AI Explanation',
            aiLoading: 'Generating explanation...',
            deepDive: 'Deep dive: Learning Path ->',
        },
        ecTds: {
            description:
                'Convert between EC (mS/cm) and TDS on all three common scales. Enter pH readings over time for a drift prediction.',
            ecInput: 'EC (mS/cm)',
            tds500: 'TDS-500',
            tds640: 'TDS-640',
            tds700: 'TDS-700',
            phReadings: 'pH Readings (comma-separated)',
            drift: 'pH Drift',
            prediction: 'Day 7 Projection',
            learnMore: 'Learn more about EC, TDS, and pH management ->',
            simulate: 'Simulate 7 days',
            simulationTitle: '7-Day EC Drift',
            explainAi: 'Explain with AI',
            aiExplanationTitle: 'AI Explanation',
            aiLoading: 'Generating explanation...',
            deepDive: 'Deep dive: Learning Path ->',
        },
        lightSpectrum: {
            description:
                'Calculate DLI, photosynthetic efficiency, and estimated terpene production boost from your light spectrum settings.',
            ppfd: 'PPFD',
            redPercent: 'Red Band %',
            bluePercent: 'Blue Band %',
            hours: 'Photoperiod (h/day)',
            stage: 'Growth Stage',
            dli: 'Daily Light Integral (DLI)',
            efficiency: 'Photosynthetic Efficiency',
            terpeneBoost: 'Terpene Boost',
            recommended: 'Recommended Ratio',
            learnMore: 'Learn more about light spectrum and terpene production ->',
            simulate: 'Simulate 7 days',
            simulationTitle: '7-Day DLI Curve',
            explainAi: 'Explain with AI',
            aiExplanationTitle: 'AI Explanation',
            aiLoading: 'Generating explanation...',
            deepDive: 'Deep dive: Learning Path ->',
        },
        cannabinoidRatio: {
            description: 'Analyze THC:CBD:CBG ratios, profile type, and entourage harmony score.',
            ratio: 'Ratio',
            profile: 'Profile Type',
            harmony: 'Harmony Score',
            learnMore: 'Learn more about cannabinoid profiles ->',
            explainAi: 'Explain with AI',
            aiExplanationTitle: 'AI Explanation',
            aiLoading: 'Generating explanation...',
            deepDive: 'Deep dive: Learning Path ->',
        },
    },
    lernpfad: {
        title: 'Learning Paths',
        progress: '{{done}} of {{total}} steps completed',
        filterByLevel: 'Filter by level',
        allLevels: 'All levels',
        completed: 'Completed',
        markDone: 'Mark as done',
        resetPath: 'Reset progress',
        noPaths: 'No learning paths available.',
        level: {
            beginner: 'Beginner',
            intermediate: 'Intermediate',
            expert: 'Expert',
        },
        paths: {
            'beginner-first-grow': {
                title: 'Your First Grow',
                description: 'Everything you need for a successful first harvest, step by step.',
                steps: {
                    'step-setup': {
                        title: 'Setup & Equipment',
                        description:
                            'Learn what you need to get started: tent, light, fan, pots, and medium.',
                    },
                    'step-germination': {
                        title: 'Germination',
                        description:
                            'How to germinate seeds reliably using the paper towel method or direct-in-medium planting.',
                    },
                    'step-veg': {
                        title: 'Vegetative Growth',
                        description:
                            'Nurturing your seedling into a strong vegetative plant. Watering, nutrients, and light basics.',
                    },
                    'step-flower': {
                        title: 'Flowering',
                        description:
                            'Triggering and managing the flowering phase. Light schedule, nutrient switch, and bud development.',
                    },
                    'step-harvest': {
                        title: 'Harvest & Cure',
                        description:
                            'Reading trichomes, timing your harvest, and the crucial drying and curing process.',
                    },
                    'step-vpd-practice': {
                        title: 'Practice VPD',
                        description:
                            'Use the VPD Calculator to understand how temperature and humidity affect your plant.',
                    },
                },
            },
            'environment-mastery': {
                title: 'Environment Mastery',
                description: 'Deep dive into temperature, humidity, VPD, CO2, and airflow.',
                steps: {
                    'step-env-basics': {
                        title: 'Temperature & Humidity Basics',
                        description:
                            'Optimal ranges for each growth stage and how to control them.',
                    },
                    'step-vpd-deep': {
                        title: 'VPD Deep Dive',
                        description:
                            'Understanding Vapor Pressure Deficit and using it to maximize plant health and yield.',
                    },
                    'step-airflow': {
                        title: 'Airflow & CO2',
                        description:
                            'Why airflow matters, how to set up circulation and exhaust fans, and CO2 basics.',
                    },
                    'step-env-calc': {
                        title: 'Calculator Practice',
                        description:
                            'Run the VPD calculator across different stages to build intuition for ideal conditions.',
                    },
                },
            },
            'nutrient-mastery': {
                title: 'Nutrient Mastery',
                description: 'Master macro and micronutrients, EC, pH, and deficiency diagnosis.',
                steps: {
                    'step-macros': {
                        title: 'Macro Nutrients (N-P-K)',
                        description:
                            'The role of Nitrogen, Phosphorus, and Potassium through all growth stages.',
                    },
                    'step-micros': {
                        title: 'Secondary & Micro Nutrients',
                        description:
                            'Calcium, Magnesium, Sulfur, Iron, Zinc and their deficiency symptoms.',
                    },
                    'step-ec-ph': {
                        title: 'EC, PPM & pH',
                        description:
                            'How to measure and control the strength and pH of your nutrient solution.',
                    },
                    'step-deficiency-atlas': {
                        title: 'Deficiency Atlas',
                        description:
                            'Browse the Disease Atlas to identify and treat nutrient deficiencies.',
                    },
                    'step-nutrient-calc': {
                        title: 'Nutrient Calculator',
                        description:
                            'Use the Nutrient Ratio calculator to plan your feeds by growth stage.',
                    },
                },
            },
            'pest-disease-control': {
                title: 'Pest & Disease Control',
                description: 'Identify, treat, and prevent the most common pests and diseases.',
                steps: {
                    'step-plant-hygiene': {
                        title: 'Plant Hygiene & Prevention',
                        description:
                            'Cleaning protocols, quarantine for new plants, and environmental prevention.',
                    },
                    'step-pest-id': {
                        title: 'Pest Identification',
                        description:
                            'Learn to identify spider mites, fungus gnats, aphids, and thrips early.',
                    },
                    'step-disease-id': {
                        title: 'Disease Identification',
                        description:
                            'Recognizing powdery mildew, botrytis, and root rot before they destroy a harvest.',
                    },
                },
            },
            'advanced-training': {
                title: 'Advanced Plant Training',
                description:
                    'LST, topping, super cropping, SCROG, and manifolding for maximum yield.',
                steps: {
                    'step-why-train': {
                        title: 'Why Train Plants?',
                        description:
                            'Understanding apical dominance and how training breaks it for better yields.',
                    },
                    'step-lst-topping': {
                        title: 'LST & Topping',
                        description:
                            'Low-Stress Training and topping fundamentals with timing and technique details.',
                    },
                    'step-scrog-manifold': {
                        title: 'SCROG & Manifolding',
                        description:
                            'Advanced techniques for creating a perfectly even canopy with maximum bud sites.',
                    },
                },
            },
            firstGrow: {
                title: 'Your First Grow',
                description: 'Everything you need for a successful first harvest, step by step.',
                step1Title: 'Setup & Equipment',
                step1Desc:
                    'Learn what you need to get started: tent, light, fan, pots, and medium.',
                step2Title: 'Germination',
                step2Desc:
                    'How to germinate seeds reliably using the paper towel method or direct-in-medium planting.',
                step3Title: 'Vegetative Growth',
                step3Desc:
                    'Nurturing your seedling into a strong vegetative plant. Watering, nutrients, and light basics.',
                step4Title: 'Flowering',
                step4Desc:
                    'Triggering and managing the flowering phase. Light schedule, nutrient switch, and bud development.',
                step5Title: 'Harvest & Cure',
                step5Desc:
                    'Reading trichomes, timing your harvest, and the crucial drying and curing process.',
                step6Title: 'Practice VPD',
                step6Desc:
                    'Use the VPD Calculator to understand how temperature and humidity affect your plant.',
            },
            environment: {
                title: 'Environment Mastery',
                description: 'Deep dive into temperature, humidity, VPD, CO2, and airflow.',
                step1Title: 'Temperature & Humidity Basics',
                step1Desc: 'Optimal ranges for each growth stage and how to control them.',
                step2Title: 'VPD Deep Dive',
                step2Desc:
                    'Understanding Vapor Pressure Deficit and using it to maximize plant health and yield.',
                step3Title: 'Airflow & CO2',
                step3Desc:
                    'Why airflow matters, how to set up circulation and exhaust fans, and CO2 basics.',
                step4Title: 'Calculator Practice',
                step4Desc:
                    'Run the VPD calculator across different stages to build intuition for ideal conditions.',
            },
            nutrients: {
                title: 'Nutrient Mastery',
                description: 'Master macro and micronutrients, EC, pH, and deficiency diagnosis.',
                step1Title: 'pH Guide',
                step1Desc: 'Understanding pH and how to control it for optimal nutrient uptake.',
                step2Title: 'Nutrient Calculator',
                step2Desc:
                    'Use the nutrient ratio calculator to plan your feed schedule by growth stage.',
                step3Title: 'Calcium Deficiency',
                step3Desc:
                    'Identify and treat calcium deficiency -- one of the most common grow problems.',
                step4Title: 'Nutrient Burn',
                step4Desc:
                    'Recognize and recover from overfeeding your plants with too many nutrients.',
                step5Title: 'Disease Atlas Practice',
                step5Desc:
                    'Browse the disease atlas to identify nutrient-related issues and find treatments.',
            },
            pests: {
                title: 'Pest & Disease Control',
                description: 'Identify, treat, and prevent the most common pests and diseases.',
                step1Title: 'Pest Management Guide',
                step1Desc:
                    'Learn integrated pest management strategies to keep your grow free from pests.',
                step2Title: 'Spider Mites',
                step2Desc: 'Identify and treat spider mites -- the most destructive grow pest.',
                step3Title: 'Powdery Mildew',
                step3Desc: 'Recognize and treat powdery mildew before it destroys your crop.',
            },
            training: {
                title: 'Advanced Plant Training',
                description:
                    'LST, topping, super cropping, SCROG, and manifolding for maximum yield.',
                step1Title: 'Training Fundamentals',
                step1Desc:
                    'Learn the principles of plant training and how to apply LST and topping techniques.',
                step2Title: 'Topping vs. LST',
                step2Desc:
                    'Compare topping and low-stress training to find the best approach for your grow.',
                step3Title: 'Overwatering Recovery',
                step3Desc:
                    'Recognize and fix overwatering -- a common issue when training dense canopies.',
            },
        },
    },
    growTech: {
        title: 'Cannabis Grow Technologies 2026',
        subtitle: 'Precision, automation, AI, and sustainability -- the future of cultivation.',
        badge2026: '2026 Tech Overview',
        intro: 'The cannabis cultivation technology landscape in 2026 is defined by data-driven, scalable systems that maximize yield, quality (THC, terpenes, cannabinoids), and efficiency. From dynamic LED spectra and AI-powered controllers to digital twins and aeroponics -- these technologies benefit both professional and home growers.',
        keyBenefits: 'Key Benefits',
        categories: {
            dynamicLighting: {
                title: 'Dynamic LED Lighting',
                tagline: 'Full-spectrum LEDs with adaptive spectra for each growth phase',
                content:
                    'High-efficiency full-spectrum LEDs with strong red emphasis reach >2.8 umol/J efficiency and reduce power consumption by up to 40% versus legacy HPS lamps. Models like HLG 350R or AC Infinity systems deliver superior light uniformity and less heat.<br><br><strong>Dynamic Lighting:</strong> Advanced controllers automatically adjust the light spectrum to match the growth phase and VPD conditions -- blue-heavy for vegetative growth, red-dominant for dense flowering.',
                benefits:
                    '<ul><li>20-40% higher yield with optimized spectra</li><li>Up to 40% lower electricity costs</li><li>Better THC production through targeted red/far-red wavelengths</li><li>Reduced canopy heat stress</li></ul>',
                tip: 'A 350-600W LED panel in a 1.2 x 1.2m tent covers 4-6 plants. Look for models with >2.5 umol/J efficiency for best ROI in 1-2 harvest cycles.',
            },
            sensorsIoT: {
                title: 'Sensors, IoT & VPD Optimization',
                tagline: 'Wireless environmental monitoring with AI-driven control loops',
                content:
                    'Wireless sensors for temperature, humidity, VPD, EC, pH, PAR/PPFD, CO2, and soil moisture form the backbone of precision cultivation. AI-powered controllers like the AC Infinity Controller AI+ predict temperature swings and automatically regulate heating, ventilation, and humidity for perfect VPD (0.8-1.2 kPa in flower).',
                benefits:
                    '<ul><li>Real-time VPD optimization prevents stress, mold, and low resin production</li><li>Predictive environmental adjustments reduce manual intervention</li><li>Continuous data logging enables trend analysis and early warning</li><li>Integration with CannaGuide via MQTT and BLE sensors</li></ul>',
                tip: 'VPD is the "invisible killer" -- wrong values cause stress, mold, or low trichome production. CannaGuide already calculates real-time VPD with altitude correction.',
            },
            aiAutomation: {
                title: 'AI & Automation',
                tagline: 'AI platforms that detect problems before visible symptoms appear',
                content:
                    'AI platforms analyze real-time sensor data, detect pests and deficiencies before visible symptoms, and automatically optimize nutrient, light, and irrigation schedules. Systems like Spectron AI cameras (4K + timelapse) or Hey Abby GrowMate provide smartphone-controlled precision growing.',
                benefits:
                    '<ul><li>Proactive pest and deficiency detection saves entire harvests</li><li>Automated nutrient and irrigation scheduling reduces daily effort</li><li>Data-driven compliance logging for commercial operations</li><li>Scalable from single tents to multi-room facilities</li></ul>',
                tip: 'CannaGuide already includes AI-powered plant diagnostics (photo + data-based), proactive advisor, and local AI fallback -- all working offline.',
            },
            digitalTwin: {
                title: 'Digital Twin Simulation',
                tagline: 'Virtual grow room replicas for risk-free experimentation',
                content:
                    'A Digital Twin creates a virtual replica of your grow environment using sensor data and CFD (Computational Fluid Dynamics) models. You simulate "what-if" scenarios -- like adding 200 ppm CO2 or changing light schedules -- and see the yield impact before making any real changes.',
                benefits:
                    '<ul><li>Zero-risk experimentation with environment changes</li><li>Predictive yield and quality modeling</li><li>Optimize HVAC and lighting placement virtually</li><li>Reduce trial-and-error cycles dramatically</li></ul>',
                tip: "CannaGuide's Sandbox already offers what-if experiments (Topping vs. LST, Temperature +2C) on cloned plants -- the first step toward full Digital Twin capability.",
            },
            hydroAero: {
                title: 'Hydroponics & Aeroponics',
                tagline: 'Soilless systems with up to 30% faster growth and 90% less water',
                content:
                    'Aeroponics suspends roots in air and delivers nutrients via fine mist -- achieving up to 30% faster growth with 90% less water usage. Recirculating hydroponic systems with smart fertigation use closed loops, automatic pH/EC adjustment, and precision dosing via substrate sensors.',
                benefits:
                    '<ul><li>Dramatically faster growth cycles</li><li>90% water reduction vs. soil-based growing</li><li>Precise nutrient control eliminates waste</li><li>Ideal for vertical farming and space-constrained setups</li></ul>',
                tip: 'CannaGuide supports Soil, Coco, Hydro, and Aeroponics as grow media. The nutrient planner adapts EC/pH targets automatically per medium.',
            },
            tissueCulture: {
                title: 'Tissue Culture & Micropropagation',
                tagline: 'Virus-free cloning of elite genetics at scale',
                content:
                    'Home-lab kits and professional tissue culture systems enable virus-free propagation of elite genetics. This produces genetically identical clones without maintaining mother plants -- enabling massive scaling with stable genetics and higher disease resistance.',
                benefits:
                    '<ul><li>100% genetic consistency across all clones</li><li>Virus and pathogen elimination</li><li>No need for mother plant maintenance</li><li>Faster scaling of prized phenotypes</li></ul>',
                tip: "Track your phenotypes and genetic lineage in CannaGuide's Breeding Lab and Genealogy Explorer to identify elite candidates for tissue culture.",
            },
            smartGrowBoxes: {
                title: 'All-in-One Smart Grow Boxes',
                tagline: 'Integrated systems with LEDs, fans, sensors, and app control',
                content:
                    'Complete systems like Hey Abby GrowMate or Mars Hydro Smart Tents integrate LEDs, ventilation fans, sensors, and app control into a single unit. "Set it and forget it" -- perfect for beginners and urban growers with limited space.',
                benefits:
                    '<ul><li>Zero setup complexity for beginners</li><li>Integrated environmental control</li><li>Compact footprint for apartment growing</li><li>App-based monitoring and alerts</li></ul>',
                tip: 'Even with an all-in-one box, use CannaGuide to track your grow journal, get AI advice, and run the VPD simulation for optimal results.',
            },
            sustainability: {
                title: 'Sustainability & Post-Harvest Tech',
                tagline: 'Energy savings, regenerative soils, and precision curing',
                content:
                    'LED + HVAC optimization dramatically reduces energy and water consumption. Regenerative soil practices, CO2 enrichment, and precision drying/curing systems (like Cannatrol) maximize terpene retention and final product quality. Post-harvest technology is increasingly recognized as equally important as cultivation itself.',
                benefits:
                    '<ul><li>30-50% reduction in energy costs with modern LEDs + HVAC</li><li>Superior terpene and cannabinoid preservation</li><li>Regenerative soils improve quality over multiple cycles</li><li>Sustainable practices meet growing regulatory requirements</li></ul>',
                tip: "CannaGuide's post-harvest simulation (Drying + Curing phases) tracks jar humidity, chlorophyll breakdown, terpene retention, and mold risk.",
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
                'CannaGuide integrates many of these 2026 technologies: real-time VPD simulation with altitude correction, AI-powered diagnostics (cloud + local), what-if sandbox experiments, IoT sensor integration (MQTT + BLE), dynamic spectrum awareness in the lighting calculator, aeroponics as a grow medium, post-harvest simulation with terpene tracking, and a 3-layer local AI fallback for fully offline operation.',
        },
    },
}

export const tipOfTheDay = {
    title: 'Tip of the Day',
    tips: [
        'Always check the pH of your water after adding nutrients. Nutrients can significantly alter the pH level.',
        'A gentle breeze from a fan pointed at your plants helps strengthen stems and prevent mold.',
        "Less is more, especially with nutrients. It's easier to fix a deficiency than a toxicity (nutrient burn).",
        'Observe the color of your leaves. A rich, healthy green is good. Too dark green can indicate too much nitrogen, while pale green or yellow suggests a deficiency.',
        'Fabric pots are a great choice for beginners as they make overwatering almost impossible and provide oxygen to the roots.',
    ],
}

export const analytics = {
    gardenScore: 'Garden Score',
    avgHealth: 'Avg Health',
    envStability: 'Env Stability',
    activePlants: 'Active Plants',
    stageDistribution: 'Stage Distribution',
    riskFactors: 'Risk Factors',
    strainPerformance: 'Strain Performance',
    nextMilestone: 'Next Milestone',
    daysAway: 'days away',
    analyticsEmpty: 'Add plants to see analytics',
    strain: 'Strain',
    health: 'Health',
    plants: 'Plants',
    avgAge: 'Avg Age',
    relatedKnowledge: 'Related Knowledge',
    milestoneType: {
        flip: 'Flip to Flower',
        harvest: 'Harvest Ready',
        curing_done: 'Curing Complete',
        transplant: 'Transplant',
    },
    recommendations: {
        title: 'Recommendations',
        adjustVpd: 'Adjust VPD',
        adjustVpdDesc: 'VPD is outside the optimal range. Adjust temperature or humidity.',
        considerTraining: 'Consider Training',
        considerTrainingDesc:
            'Plant is in late vegetative stage. LST or topping could improve yield.',
        checkTrichomes: 'Check Trichomes',
        checkTrichomesDesc: 'Plant is in late flowering. Monitor trichomes for harvest timing.',
        improveHealth: 'Improve Plant Health',
        improveHealthDesc: 'Plant health is below optimal. Check nutrients, pH, and environment.',
    },
    riskType: {
        health: 'Health',
        environment: 'Environment',
        nutrient: 'Nutrient',
        pest: 'Pest/Disease',
        overdue_task: 'Overdue Task',
    },
    risks: {
        healthCritical: '{{name}} health is critically low at {{health}}%',
        vpdOutOfRange: '{{name}} VPD out of range: {{vpd}} kPa',
        severeProblem: '{{name}}: {{problem}} (severity {{severity}}/10)',
        overdueTask: '{{name}}: Overdue task -- {{task}}',
    },
}

export const growBible = {
    title: 'CannaGuide Grow Bible',
    generated: 'Generated',
    plants: 'Plants',
    appVersion: 'App Version',
    toc: 'Table of Contents',
    analyticsSummary: 'Analytics Summary',
    relatedKnowledge: 'Related Knowledge',
    relatedKnowledgeDesc: 'Based on your current grow, these knowledge topics are most relevant:',
    footer: 'Generated by CannaGuide 2025',
    property: 'Property',
    value: 'Value',
    strain: 'Strain',
    stage: 'Stage',
    age: 'Age',
    days: 'days',
    health: 'Health',
    temperature: 'Temperature',
    humidity: 'Humidity',
    environment: 'Environment',
    moisture: 'Moisture',
    activeProblems: 'Active Problems',
    severity: 'severity',
    journal: 'Journal',
    noNotes: 'No notes',
    harvestData: 'Harvest Data',
    wetWeight: 'Wet Weight',
    dryWeight: 'Dry Weight',
    quality: 'Quality',
    count: 'Count',
}
