

export const knowledgeView = {
    title: 'Knowledge Hub',
    subtitle: 'Your interactive guide to successful cultivation.',
    tabs: {
        mentor: 'AI Mentor',
        guide: 'Grow Guide',
        archive: 'Mentor Archive',
        breeding: 'Breeding Lab',
        sandbox: 'Sandbox',
    },
    hub: {
        selectPlant: 'Select Plant',
        noPlants: 'No active plants for contextual advice. Start a grow to begin!',
        todaysFocus: 'Today\'s Focus for {{plantName}}',
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
        empty: 'You haven\'t archived any mentor responses yet.',
        saveButton: 'Save to Archive',
        saveSuccess: 'Response saved to archive!',
        queryLabel: 'Your Query',
        editTitle: 'Edit Response',
    },
    breeding: {
        title: 'Breeding Lab',
        description: 'Cross your collected seeds to create new, unique strains with combined characteristics.',
        collectedSeeds: 'Collected Seeds',
        noSeeds: 'Collect seeds from harvest-ready plants to start breeding.',
        parentA: 'Parent A',
        parentB: 'Parent B',
        selectSeed: 'Select a seed',
        dropSeed: 'Drop seed here',
        breedButton: 'Breed New Strain',
        resultsTitle: 'Breeding Result',
        newStrainName: 'New Strain Name',
        potentialTraits: 'Potential Traits',
        saveStrain: 'Save Strain',
        breedingSuccess: 'Successfully bred "{{name}}"! It has been added to "My Strains".',
    },
    scenarios: {
        toppingVsLst: {
            title: "Run Topping vs. LST Experiment",
            description: "Simulates a 14-day growth period comparing a plant that receives LST against one that has been topped."
        }
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
                      <strong>Environment Calibration:</strong> Calibrate your thermo-hygrometers. Aim for a stable environment around <strong>22-25°C (72-77°F)</strong> and <strong>65-75% relative humidity</strong>.`
        },
        'phase2-seedling': {
            title: 'Phase 2: Germination & Seedling',
            content: `<h3>The First Weeks of Life</h3><p>This is the most delicate phase. The motto is: less is more. Avoid over-loving your plant.</p>
                      <strong>Germination:</strong> Keep the medium consistently moist, but never soaking wet. A humidity dome can help maintain high humidity (70-80%), which is ideal for sprouting.<br>
                      <strong>Light:</strong> Seedlings don't need intense light. A lower wattage fluorescent or a dimmed LED is perfect. An 18/6 light cycle is standard. Keep lights far enough away to prevent burning—if the back of your hand feels uncomfortably warm at canopy level, the light is too close.<br>
                      <strong>Water:</strong> Water sparingly in a small circle around the stem. The root system is tiny and can easily drown.<br>
                      <strong>Nutrients:</strong> Do not feed nutrients yet! Most soils contain enough for the first 2-3 weeks. Wait until the plant has at least 3-4 sets of true leaves before introducing a very weak (1/4 strength) nutrient solution.`
        },
        'phase3-vegetative': {
            title: 'Phase 3: Vegetative Growth',
            content: `<h3>Time to Grow!</h3><p>During this phase, your plant will focus on developing a strong structure of leaves, branches, and roots. This is the time for training.</p>
                      <strong>Light:</strong> Your plant can now handle much more light. Gradually increase the intensity or lower the light source. An 18/6 light cycle remains standard for photoperiod plants.<br>
                      <strong>Nutrients:</strong> Slowly increase nutrient strength. A fertilizer rich in Nitrogen (N) is crucial for leafy growth.<br>
                      <strong>Training:</strong> Now is the perfect time to start training to create an even canopy and increase your final yield. Begin with <strong>LST (Low-Stress Training)</strong> to gently bend branches, or perform <strong>Topping</strong> to create multiple main colas.<br>
                      <strong>Environment:</strong> The ideal humidity drops to around 50-70%. Good air circulation becomes more important as the plant grows denser.`
        },
        'phase4-flowering': {
            title: 'Phase 4: Flowering',
            content: `<h3>The Bloom Begins</h3><p>This is the most exciting phase where your plant starts producing buds. The switch in the light cycle is the trigger for photoperiod strains.</p>
                      <strong>Light Cycle:</strong> To initiate flowering, you must switch to a strict <strong>12 hours of light and 12 hours of *uninterrupted* darkness</strong>.<br>
                      <strong>The Stretch:</strong> In the first 2-3 weeks of flowering, your plant may double or even triple in height. Be prepared for this growth spurt!<br>
                      <strong>Nutrients:</strong> Switch to a bloom-specific fertilizer, which is lower in Nitrogen (N) and higher in Phosphorus (P) and Potassium (K) to support bud development.<br>
                      <strong>Humidity:</strong> Gradually lower the humidity to <strong>40-50%</strong> to reduce the risk of bud rot (Botrytis) in the dense flowers.`
        },
        'phase5-harvest': {
            title: 'Phase 5: Harvest, Drying & Curing',
            content: `<h3>The Finishing Touches</h3><p>Patience in this final phase is what separates mediocre from top-shelf cannabis. Don't rush it!</p>
                      <strong>Harvest Time:</strong> The best indicator is the color of the trichomes. Use a jeweler's loupe or microscope. Harvest when most trichomes are cloudy/milky for peak THC, with a few amber ones for a more relaxing effect. Clear trichomes are too early.<br>
                      <strong>Drying:</strong> Hang branches upside down in a dark, cool space with gentle air circulation. Aim for <strong>18-20°C (64-68°F)</strong> and <strong>55-60% humidity</strong>. This slow-dry process takes 7-14 days and is crucial for preserving terpenes.<br>
                      <strong>Curing:</strong> Once smaller stems snap instead of bend, place the buds in airtight glass jars. Open the jars daily for 5-10 minutes for the first week ("burping") to release moisture. This process dramatically improves flavor, aroma, and smoothness.`
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
                      <strong>Prevention:</strong> Always lift your pot to feel its weight before and after watering. This is the most reliable way to know when it's time to water again.`
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
                      </ol>`
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
                      </ol>`
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
                      </ul>`
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
                      <strong>Result:</strong> Instead of one large main cola and many small "popcorn" buds, you get multiple large, dense colas and a much larger overall harvest.`
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
                      </ul>`
        }
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
    },
    guide: {
        phases: 'Phases',
        coreConcepts: 'Core Concepts',
        troubleshooting: 'Troubleshooting',
    },
};

export const tipOfTheDay = {
    title: 'Tip of the Day',
    tips: [
        "Always check the pH of your water after adding nutrients. Nutrients can significantly alter the pH level.",
        "A gentle breeze from a fan pointed at your plants helps strengthen stems and prevent mold.",
        "Less is more, especially with nutrients. It's easier to fix a deficiency than a toxicity (nutrient burn).",
        "Observe the color of your leaves. A rich, healthy green is good. Too dark green can indicate too much nitrogen, while pale green or yellow suggests a deficiency.",
        "Fabric pots are a great choice for beginners as they make overwatering almost impossible and provide oxygen to the roots."
    ]
};