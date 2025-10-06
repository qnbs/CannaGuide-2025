
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
            content: `<h3>Welcome to the Grow!</h3><p>The key to a successful harvest is solid preparation. Ensure your equipment is clean and functional.</p>
                      <strong>Tent:</strong> Check for light leaks and clean the interior surfaces.<br>
                      <strong>Light:</strong> Test your lamp and timer. For seedlings, position the light further away than usual.<br>
                      <strong>Medium & Pots:</strong> If using soil, slightly dampen it before planting the seed. Ensure good drainage.<br>
                      <strong>Environment:</strong> Calibrate your thermo-hygrometers. A stable environment is crucial.`
        },
        'phase2-seedling': {
            title: 'Phase 2: Germination & Seedling',
            content: `<h3>The First Weeks of Life</h3><p>This is the most delicate phase. Less is often more.</p>
                      <strong>Germination:</strong> Keep the medium moist, but not soaking wet. High humidity (70-80%) is ideal.<br>
                      <strong>Light:</strong> Seedlings don't need much light. 18 hours of light per day is common. Keep a sufficient distance to avoid burns.<br>
                      <strong>Water:</strong> Water sparingly around the stem. The root ball is still very small.<br>
                      <strong>Nutrients:</strong> Most substrates have enough nutrients for the first 1-2 weeks. Only start with a very light feeding once the first true sets of leaves are well-developed.`
        },
        'phase3-vegetative': {
            title: 'Phase 3: Vegetative Growth',
            content: `<h3>Time to Grow!</h3><p>In this phase, your plant gains size and leaf mass. Now is the time for training techniques.</p>
                      <strong>Light:</strong> Your plant can now handle more light. Adjust the distance accordingly. 18 hours of light remains standard.<br>
                      <strong>Nutrients:</strong> Slowly increase the nutrient dosage. A nitrogen-rich fertilizer (N) is important now.<br>
                      <strong>Training:</strong> Start with LST (Low Stress Training) to make the plant grow bushier. Topping (cutting the main tip) is also a popular method to create multiple main colas.<br>
                      <strong>Environment:</strong> The ideal humidity is now around 50-60%.`
        },
        'phase4-flowering': {
            title: 'Phase 4: Flowering',
            content: `<h3>The Bloom Begins</h3><p>The most exciting phase! Switching the light cycle initiates flower production.</p>
                      <strong>Light Cycle:</strong> Switch to 12 hours of light and 12 hours of uninterrupted darkness.<br>
                      <strong>Nutrients:</strong> Change to a bloom fertilizer with more Phosphorus (P) and Potassium (K). Reduce Nitrogen.<br>
                      <strong>Stretch:</strong> In the first 2-3 weeks of flowering, the plant will stretch significantly. Plan for the space.<br>
                      <strong>Humidity:</strong> Lower the humidity to 40-50% to prevent mold in the dense buds.`
        },
        'phase5-harvest': {
            title: 'Phase 5: Harvest, Drying & Curing',
            content: `<h3>The Finishing Touches</h3><p>Patience in this phase determines the quality of the final product.</p>
                      <strong>Harvest Time:</strong> Observe the trichomes with a magnifying glass. Milky-cloudy trichomes indicate peak potency. Amber trichomes give a more body-relaxing effect.<br>
                      <strong>Drying:</strong> Hang the branches upside down in a dark, cool room with good air circulation at about 18-20°C and 55-60% humidity. This should take 7-14 days.<br>
                      <strong>Curing:</strong> Store the dry buds in airtight jars. Open the jars daily for a few minutes in the first week ("burping") to let moisture escape. This process breaks down chlorophyll and significantly improves taste and aroma.`
        },
        'fix-overwatering': {
            title: 'Troubleshooting: Overwatering',
            content: `<h3>Help, My Plant is Drowning!</h3><p>Overwatering is one of the most common beginner mistakes. The roots suffocate and cannot absorb nutrients.</p>
                      <strong>Symptoms:</strong> Droopy, limp leaves that feel firm and swollen (unlike the dry, limp leaves of underwatering). The medium stays wet for a long time.<br>
                      <strong>Immediate Actions:</strong> 1. Stop watering immediately. 2. Check the weight of the pot – only water again when it's significantly lighter. 3. Ensure good air circulation, also directed at the substrate.<br>
                      <strong>Long-Term:</strong> Use pots with good drainage (e.g., fabric pots). Mix perlite into your substrate to make it more airy. Learn to use the weight of the pot as an indicator.`
        },
        'fix-calcium-deficiency': {
            title: 'Troubleshooting: Calcium Deficiency',
            content: `<h3>Fixing Calcium Deficiency</h3><p>Calcium is a crucial nutrient for the plant's cell structure. A deficiency often shows on young, upper leaves.</p>
                      <strong>Symptoms:</strong> Small, rusty-brown spots on the leaves. Twisted or stunted new growth. Weak stems.<br>
                      <strong>Causes:</strong> Often not a lack of it in the fertilizer, but an incorrect pH in the root zone blocking uptake. Can also occur when using RO (reverse osmosis) water.<br>
                      <strong>Solution:</strong> 1. Check and correct the pH of your nutrient solution (Soil: 6.0-6.8, Hydro/Coco: 5.5-6.5). 2. Use a Cal-Mag supplement. 3. Ensure humidity is not too high, as this can slow transpiration and thus calcium uptake.`
        }
    },
    sandbox: {
        title: 'Experimental Sandbox',
        experimentOn: 'Experiment on {{name}}',
        scenarioDescription: 'Compared {{actionA}} vs {{actionB}} over {{duration}} days.',
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
        experimentMeta: 'Based on {{basePlantName}} - Run on {{date}}',
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
