export const knowledgeView = {
  title: 'Knowledge & Mentor',
  subtitle: 'Expand your knowledge and get AI-powered advice.',
  tabs: {
    guide: 'Guide',
    archive: 'Knowledge Database'
  },
  progress: 'Your Progress',
  stepsCompleted: '{completed} of {total} steps completed',
  hub: {
      selectPlant: 'Select a plant',
      todaysFocus: 'Today\'s Focus for {plantName}',
      noRelevantArticles: 'No specific articles are relevant for {plantName} right now. Browse the full library below.',
      browseAll: 'Browse Knowledge Base',
      searchPlaceholder: 'Search articles...',
      noPlants: 'Start a new grow in the Plants view to use the AI Mentor and get personalized knowledge articles here.',
  },
  aiMentor: {
    title: 'AI Plant Mentor',
    subtitle: 'Your personal horticultural scientist. Ask anything about a specific plant.',
    plantContextSubtitle: 'Select a plant to give the AI Mentor context for tailored advice.',
    placeholder: 'e.g., Compare LST vs. Topping for yield...',
    askAboutPlant: 'Ask something about {name}...',
    startChat: 'Start Chat',
    clearChat: 'Clear Chat',
    startConversation: 'Start a conversation',
    button: 'Ask Mentor',
    loading: 'Consulting horticultural archives...',
    examplePromptsTitle: 'Example Prompts',
    examplePrompts: {
        plantSpecific: {
            q1: 'Based on its current vitals, what\'s the most important next step for this plant?',
            q2: 'Should I start training this plant? If so, which method?',
            q3: 'Are there any signs of deficiency in the recent journal entries?',
        }
    }
  },
  archive: {
    title: 'Knowledge Database',
    empty: 'Your saved responses from the AI Mentor will be displayed here.',
    saveButton: 'Save to Database',
    saveSuccess: 'Response saved to the Knowledge Database!',
    deleteConfirm: 'Are you sure you want to delete this response?',
    deleteSuccess: 'Response deleted.',
    queryLabel: 'Your Query',
    editTitle: 'Edit Response',
    updateSuccess: 'Response updated successfully!',
  },
  knowledgebase: {
    'phase1-prep': {
      title: 'Phase 1: Preparation & Setup',
      content: `<h3>The Right Space</h3><p>Choose a discreet, clean space with access to power and fresh air. A closet, spare room, or basement is ideal. Ensure the area can be made completely light-proof for the flowering stage and has good air exchange (an intake for fresh air and an exhaust).</p><h3>Assembling Equipment</h3><p>Use our Setup Configurator in the "Equipment" section to generate a shopping list. Key components include a tent, light, exhaust system with a carbon filter, pots, and a timer. Don't forget monitoring tools like a thermometer/hygrometer and a pH/EC meter.</p><h3>Pro Tip</h3><p>Master Vapor Pressure Deficit (VPD). It's the relationship between temperature and humidity that dictates how well your plant "breathes" (transpires). Keeping VPD in the optimal range for each growth stage leads to faster growth and healthier plants. Charts are available online!</p>`
    },
    'phase2-seedling': {
      title: 'Phase 2: Germination & Seedling',
      content: `<h3>Germinating Seeds</h3><p>The paper towel method is popular: place seeds between two damp paper towels on a plate and cover it. Keep them warm (22-25°C) and dark. After 2-7 days, a taproot should appear. Alternatively, you can sow directly into a starter plug or your final medium.</p><h3>The Seedling</h3><p>Once the taproot is 1-2 cm long, gently plant the seed about 0.5-1 cm deep in a small pot with seedling soil. The first two round leaves are cotyledons; the first "true" leaves will be serrated. Keep lighting gentle to prevent stretching or burning.</p><h3>Pro Tip</h3><p>Watch out for "damping off," a fungal disease that causes seedlings to collapse at the soil line. Prevent it by ensuring good air circulation, avoiding overwatering, and using a sterile growing medium.</p>`
    },
    'phase3-vegetative': {
        title: 'Phase 3: Vegetative Stage',
        content: `<h3>Growth Spurt</h3><p>In this phase, the plant focuses on growing leaves, stems, and roots, building its "solar panel" factory. It needs plenty of light (18+ hours/day) and nutrients rich in Nitrogen (N). Transplant to a larger pot when the plant's leaves reach the edges of its current one.</p><h3>Training Techniques</h3><p>Training shapes the plant to create an even canopy, ensuring all bud sites get optimal light, which dramatically increases yield. Techniques like LST (Low Stress Training) or Topping should be started when the plant has 5-6 nodes (leaf pairs).</p><h3>Pro Tip</h3><p>Topping (cutting the main stem) creates two main colas and a bushier plant. FIMing ("Fuck, I Missed"), a variation of topping, can produce four or more main colas and is slightly less stressful for the plant.</p>`
    },
    'phase4-flowering': {
      title: 'Phase 4: Flowering Stage',
      content: `<h3>Inducing Flower</h3><p>For photoperiod plants, switch the light cycle to 12 hours on / 12 hours off. This signals the plant to start flowering. In the first 2-3 weeks, the plant will stretch significantly, sometimes doubling in height, before focusing its energy on bud production.</p><h3>Nutrient & Environment Shift</h3><p>The plant's needs change. It now requires less Nitrogen (N) and more Phosphorus (P) and Potassium (K). Switch to a specialized bloom fertilizer. It's crucial to lower humidity (40-50%) to prevent bud rot (botrytis).</p><h3>Pro Tip</h3><p>The 12-hour dark period must be *uninterrupted*. Even a small light leak from equipment or outside can stress the plant, causing it to produce male flowers (hermaphroditism) or revert to the vegetative state.</p>`
    },
    'phase5-harvest': {
      title: 'Phase 5: Harvest, Drying & Curing',
      content: `<h3>The Perfect Harvest Window</h3><p>The best indicator is the trichomes (resin glands). Use a 60x loupe: Clear trichomes are immature. Milky/cloudy trichomes indicate peak THC and a more energetic high. Amber trichomes mean THC is degrading into CBN, resulting in a more sedative, body-heavy effect. Most growers harvest when it's mostly cloudy with about 10-20% amber.</p><h3>Drying and Curing</h3><p>Hang branches upside down in a dark, cool room (approx. 18-20°C, 50-60% humidity) for 7-14 days until smaller stems snap instead of bend. Then, trim the buds and place them in airtight glass jars for curing. "Burp" the jars daily for the first week to release moisture.</p><h3>Pro Tip</h3><p>Curing is a critical scientific process. It allows chlorophyll and sugars to break down, dramatically improving the smoothness, taste, and aroma of your final product. Use small hygrometers inside your curing jars to maintain the ideal humidity of around 62%.</p>`
    },
    'fix-overwatering': {
        title: 'How to Fix Overwatering',
        content: `<h3>Symptoms</h3><p>Droopy, heavy leaves that curl downwards, even when the soil is wet. The pot feels heavy. Growth is stunted.</p><h3>Immediate Action</h3><p>Stop watering immediately. Improve air circulation around the base of the plant. If the pot is sitting in runoff water, remove it.</p><h3>Long-Term Solution</h3><p>Allow the top 2-3 inches of soil to dry out completely before watering again. Lift the pot to feel its weight when dry vs. wet. Use pots with good drainage (fabric pots are excellent) to prevent waterlogging.</p>`
    },
    'fix-calcium-deficiency': {
        title: 'How to Fix Calcium Deficiency',
        content: `<h3>Symptoms</h3><p>Shows on newer growth first. Look for stunted, slow growth with small, crinkled, or distorted new leaves. Edges may turn brown or die off. Can also cause weak stems.</p><h3>Immediate Action</h3><p>Apply a Cal-Mag supplement. Ensure your pH is in the correct range (6.0-6.5 for soil), as pH lockout is a common cause.</p><h3>Long-Term Solution</h3><p>Regularly include a Cal-Mag supplement in your feeding schedule, especially if using RO water or growing in coco coir. Monitor pH closely.</p>`
    },
  },
};

export const tipOfTheDay = {
  title: "Tip of the Day",
  tips: [
    "Regularly check the pH of your nutrient solution. A stable pH (usually 6.0-6.5 in soil) is crucial for nutrient uptake.",
    "Don't overwater your plants! Lift the pot to check its weight. Only water when it feels significantly lighter.",
    "Ensure good air circulation with a small fan. This strengthens stems and helps prevent mold.",
    "Pay attention to the distance between your light and the plant canopy. Too close can cause light burn; too far reduces growth.",
    "During the flowering stage, humidity is critical. Try to keep it below 50% to minimize the risk of bud rot.",
    "Less is often more with nutrients. Start with half the recommended dose and observe your plant's reaction before increasing.",
    "Cal/Mag supplements are often necessary, especially with LED lighting and in coco coir, to prevent deficiencies.",
    "LST (Low Stress Training) is a beginner-friendly method to increase yield by gently bending branches downwards.",
    "The color of the trichomes is the best indicator for harvest time. A 60x jeweler's loupe is a worthwhile investment.",
    "Document everything in your journal! Notes on watering, feeding, and observations are invaluable for future grows.",
    "Cleanliness is key. Keep your grow area tidy to minimize the risk of pests and diseases.",
    "Nighttime temperatures shouldn't drop more than 10°C (18°F) below daytime temperatures to avoid stressing the plant.",
    "In late flower, selectively removing some large fan leaves (defoliation) can improve light penetration to lower buds.",
    "Flush your plants with plain water for the last 1-2 weeks before harvest to improve the final taste.",
    "Proper drying and curing is just as important as the grow itself. Take your time with this process; it's worth it!",
    "Yellow sticky traps are a simple and effective way to detect an infestation of fungus gnats or other flying pests early on.",
    "Use fabric pots to promote healthier roots through better oxygen exchange (air pruning).",
    "Learn to read the leaves for signs of nutrient deficiency. Yellowing from the bottom up often indicates a nitrogen deficiency.",
    "An EC meter is a valuable tool for accurately controlling the nutrient concentration of your solution.",
    "Be patient! Growing cannabis is a process that requires time and attention. Every mistake is a learning opportunity."
  ]
};