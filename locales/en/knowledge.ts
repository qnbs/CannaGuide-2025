export const knowledgeView = {
  title: 'Knowledge Hub',
  subtitle: 'Master the art of cultivation, from the basics to advanced techniques.',
  tabs: {
    mentor: 'AI Mentor',
    guide: 'Grow Guide',
    archive: 'Mentor Archive',
    breeding: 'Breeding Lab',
  },
  aiMentor: {
    title: 'AI Mentor',
    plantContextSubtitle: 'Select one of your active plants to ask context-aware questions.',
    startChat: 'Start Chat',
    askAboutPlant: 'Ask something about {name}...',
    startConversation: 'Start a conversation with your AI Mentor.',
    examplePrompts: {
      general: {
        q1: 'Explain Vapor Pressure Deficit (VPD) to me.',
        q2: 'What are the pros and cons of LED vs HPS lights?',
        q3: 'How do I create a living soil?'
      },
      plantSpecific: {
        q1: 'What nutrients does this plant need at its current stage?',
        q2: 'Is now a good time for topping?',
        q3: 'Based on its genetics, what terpenes are likely dominant?'
      }
    },
    clearChat: 'Clear chat history',
  },
  hub: {
    selectPlant: 'Select plant for context',
    noPlants: 'You have no active plants. Start a grow to use the contextual AI Mentor and Knowledge Hub.',
    todaysFocus: 'Today\'s Focus for {plantName}',
    noRelevantArticles: 'No specifically relevant articles for {plantName}\'s current state.',
    browseAll: 'Browse All Articles',
    searchPlaceholder: 'Search articles...',
  },
  archive: {
    title: 'Mentor Archive',
    empty: 'You haven\'t archived any responses yet. Save important advice from your mentor to find it here.',
    queryLabel: 'Your Query',
    saveButton: 'Archive Response',
    saveSuccess: 'Response successfully archived.',
    editTitle: 'Edit Response',
  },
  breeding: {
    title: 'Breeding Lab',
    description: 'Cross two of your collected seeds to create a new, unique strain. Seeds are collected from harvests with over 90% quality.',
    noSeeds: 'No Seeds Collected',
    noSeedsDesc: 'You haven\'t collected any high-quality seeds from your harvests yet. Achieve a final quality of over 90% to get a seed.',
    selectParentA: 'Select Parent A',
    selectParentB: 'Select Parent B',
    newStrainName: 'New Strain Name',
    newStrainPlaceholder: 'e.g., Sunshine Dream',
    breedButton: 'Breed',
    quality: 'Quality',
    parentSelected: '{name} selected',
    breedSuccess: 'Successfully bred new strain "{name}" and added it to "My Strains"!',
  },
  knowledgebase: {
    'phase1-prep': {
        title: 'Phase 1: Preparation & Equipment',
        content: `<h3>Welcome to the Grow Guide!</h3><p>The success of your grow begins long before the seed touches the soil. Careful planning and the right equipment are crucial.</p><h3>Key Factors:</h3><ul><li><strong>Tent:</strong> Choose a size that fits your space and the number of plants. An 80x80 cm (32x32 inch) tent is a good starting point for 1-2 plants.</li><li><strong>Light:</strong> Modern LED lights are energy-efficient and produce less heat. For a start, 150-250W is a good choice.</li><li><strong>Exhaust & Circulation:</strong> An exhaust fan with a carbon filter is essential for neutralizing odors and providing fresh air. A small clip-on fan provides a gentle breeze and strengthens the stems.</li><li><strong>Medium & Pots:</strong> High-quality cannabis soil in fabric pots (approx. 11-19 liters / 3-5 gallons) provides good aeration for the roots.</li></ul>`
    },
    'phase2-seedling': {
        title: 'Phase 2: Germination & Seedling',
        content: `<h3>The Start of Life</h3><p>This phase is the most delicate. Your goal is to create a stable and gentle environment.</p><h3>Key Factors:</h3><ul><li><strong>Germination:</strong> The paper towel method is reliable. Place the seed between two moist paper towels and keep them dark and warm (approx. 22-25°C / 72-77°F).</li><li><strong>Planting:</strong> Once the taproot is about 1-2 cm (0.5-1 inch) long, gently plant it about 0.5-1 cm deep into the soil, root down.</li><li><strong>Environment:</strong> Seedlings love high humidity (65-80%). A plastic dome can help. The temperature should be stable at 22-26°C / 72-79°F.</li><li><strong>Watering:</strong> Keep the soil moist, but not wet. A spray bottle is ideal to avoid overwatering.</li></ul>`
    },
    'phase3-vegetative': {
        title: 'Phase 3: Vegetative Growth',
        content: `<h3>Here We Grow!</h3><p>In this phase, the plant focuses on growing leaves, stems, and roots. Now is the time for training and a nitrogen-rich diet.</p><h3>Key Factors:</h3><ul><li><strong>Light:</strong> 18 hours of light and 6 hours of darkness is the standard (18/6).</li><li><strong>Nutrients:</strong> Start with half a dose of a nitrogen-rich (N) grow fertilizer. Observe the plant and slowly adjust the dose.</li><li><strong>Training:</strong> Techniques like Topping (cutting the main tip) or LST (Low Stress Training, tying down branches) encourage bushier growth and more flower sites.</li><li><strong>Environment:</strong> The humidity can now be slowly lowered to 50-60%.</li></ul>`
    },
    'phase4-flowering': {
        title: 'Phase 4: The Flowering Stage',
        content: `<h3>The Magic Begins</h3><p>By switching the light cycle to 12 hours of light and 12 hours of darkness (12/12), you signal the plant that it's time to produce flowers.</p><h3>Key Factors:</h3><ul><li><strong>Light Switch:</strong> The change to 12/12 is the trigger for flowering. Absolute darkness during the night phase is crucial!</li><li><strong>The "Stretch":</strong> In the first 2-3 weeks of flowering, the plant will stretch significantly and can double its height.</li><li><strong>Nutrients:</strong> Switch to a bloom fertilizer rich in Phosphorus (P) and Potassium (K). Slowly reduce nitrogen.</li><li><strong>Environment:</strong> Lower the humidity to 40-50% to prevent mold in the dense flowers.</li></ul>`
    },
    'phase5-harvest': {
        title: 'Phase 5: Harvest, Drying & Curing',
        content: `<h3>The Reward for Your Work</h3><p>Patience in this final phase is the key to maximizing flavor and potency.</p><h3>Key Factors:</h3><ul><li><strong>Harvest Time:</strong> The best indicator are the trichomes (the resin glands). Harvest when most are milky-white, with some amber trichomes for a more relaxing effect.</li><li><strong>Drying:</strong> Hang the manicured branches upside down in a dark, cool room (approx. 18-20°C / 64-68°F) with a humidity of 50-60%. This should take 7-14 days. The branches should snap, but not break.</li><li><strong>Curing:</strong> Place the dry buds in airtight glass jars. Open the jars daily for a few minutes ("burping") in the first week to let moisture escape. This process (at least 2-4 weeks) breaks down chlorophyll and drastically improves taste and aroma.</li></ul>`
    },
     'fix-overwatering': {
      title: 'Troubleshooting: Overwatering',
      content: `<h3>Symptoms</h3><p>Overwatered plants look droopy and wilted, but the leaves feel firm and curl downwards (claw shape). The soil is constantly wet and heavy.</p><h3>Solution</h3><ol><li><strong>Stop Watering:</strong> Give the plant time to dry out. Lift the pot to feel its weight. Only water again when it feels significantly lighter.</li><li><strong>Improve Aeration:</strong> Ensure good air circulation around the pot to promote evaporation. A small fan aimed at the pot can help.</li><li><strong>Check Drainage:</strong> Make sure your pot has enough drainage holes and is not sitting in water.</li></ol><h3>Pro-Tip</h3><p>Use fabric pots. They promote aeration of the root zone and make overwatering almost impossible, as excess water can escape through the fabric.</p>`
    },
    'fix-calcium-deficiency': {
      title: 'Troubleshooting: Calcium Deficiency',
      content: `<h3>Symptoms</h3><p>Calcium deficiency often appears on new, upper leaves. Symptoms include small, rusty or brown necrotic spots, often with a yellow border. New growth may be stunted or twisted.</p><h3>Causes & Solution</h3><ol><li><strong>Check pH:</strong> Calcium is best absorbed at a pH of 6.2-6.8 in soil. A too low pH is the most common cause. Measure the pH of your water and runoff.</li><li><strong>Use Cal-Mag:</strong> Add a Calcium-Magnesium supplement (Cal-Mag) to your water. Start with half the recommended dose.</li><li><strong>Medium Choice:</strong> When using coco coir or reverse osmosis water, regular Cal-Mag supplementation is almost always necessary.</li></ol><h3>Pro-Tip</h3><p>Some growers add a pinch of dolomite lime to their soil mix to provide a slow and steady supply of calcium and magnesium throughout the cycle.</p>`
    },
  }
};

export const tipOfTheDay = {
  title: 'Tip of the Day',
  tips: [
    "Vapor Pressure Deficit (VPD) is more important than just temperature and humidity alone. Optimize it for maximum growth rates.",
    "Use fabric pots instead of plastic pots. They promote root aeration and prevent root circling.",
    "Less is often more, especially with nutrients. Start with half a dose and observe your plant.",
    "Good air circulation under the canopy helps prevent mold and pests.",
    "Learn to feel the weight of your pots. It's the best way to know when to water.",
    "Invest in a good pH meter. The correct pH is crucial for nutrient uptake.",
    "Flush your plants with only water for the last 1-2 weeks before harvest to improve taste.",
    "Patience during drying and curing is the key to a premium final product. This step is often rushed.",
    "Document everything in your journal. It will help you learn from mistakes and repeat successes.",
    "Mycorrhizal fungi can drastically improve your roots' nutrient uptake. Add them to your medium."
  ]
};