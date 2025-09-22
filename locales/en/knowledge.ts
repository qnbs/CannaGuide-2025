export const knowledgeView = {
  title: 'Grow Guide',
  subtitle: 'Your guide from preparation to harvest.',
  tabs: {
    guide: 'Guide',
    archive: 'Knowledge Database'
  },
  progress: 'Your Progress',
  stepsCompleted: '{completed} of {total} steps completed',
  aiMentor: {
    title: 'Ask the AI Mentor',
    subtitle: 'Your personal horticultural scientist. Ask anything from basic questions to complex cultivation scenarios.',
    placeholder: 'e.g., Compare LST vs. Topping for yield...',
    button: 'Ask Mentor',
    loading: 'Consulting horticultural archives...',
    examplePromptsTitle: 'Example Prompts',
    examples: [
        'Explain nutrient lockout',
        'How to increase terpene production?',
        'Compare soil vs. hydroponics'
    ]
  },
  sections: {
    phase1: {
      title: 'Phase 1: Preparation & Setup',
      subtitle: 'Laying the groundwork for your success',
      p1_title: 'The Right Space',
      p1_text: 'Choose a discreet, clean space with access to power and fresh air. A closet, spare room, or basement is ideal. Ensure the area can be made completely light-proof for the flowering stage and has good air exchange (an intake for fresh air and an exhaust).',
      p2_title: 'Assembling Equipment',
      p2_text: 'Use our Setup Configurator in the "Equipment" section to generate a shopping list. Key components include a tent, light, exhaust system with a carbon filter, pots, and a timer. Don\'t forget monitoring tools like a thermometer/hygrometer and a pH/EC meter.',
      checklist: {
        'c1': 'Find a discreet location with a power outlet.',
        'c2': 'Assemble the grow tent and check for light leaks.',
        'c3': 'Install and test the lamp and ventilation system.',
        'c4': 'Calibrate pH and EC meters if you have them.',
        'c5': 'Set the timer for the lamp (18/6 light cycle).',
      },
      proTip: 'Master Vapor Pressure Deficit (VPD). It\'s the relationship between temperature and humidity that dictates how well your plant "breathes" (transpires). Keeping VPD in the optimal range for each growth stage leads to faster growth and healthier plants. Charts are available online!'
    },
    phase2: {
      title: 'Phase 2: Germination & Seedling',
      subtitle: 'The start of life (Week 1-2)',
      p1_title: 'Germinating Seeds',
      p1_text: 'The paper towel method is popular: place seeds between two damp paper towels on a plate and cover it. Keep them warm (22-25°C) and dark. After 2-7 days, a taproot should appear. Alternatively, you can sow directly into a starter plug or your final medium.',
      p2_title: 'The Seedling',
      p2_text: 'Once the taproot is 1-2 cm long, gently plant the seed about 0.5-1 cm deep in a small pot with seedling soil. The first two round leaves are cotyledons (seed leaves); the first "true" leaves will be serrated. Keep lighting gentle to prevent stretching or burning.',
      checklist: {
        'c1': 'Germinate the seeds successfully.',
        'c2': 'Plant the germinated seed into a small pot or starter plug.',
        'c3': 'Maintain high humidity (60-70%) using a humidity dome.',
        'c4': 'Avoid overwatering and ensure good airflow.',
        'c5': 'Gradually acclimate the seedling to stronger light.',
      },
      proTip: 'Watch out for "damping off," a fungal disease that causes seedlings to collapse at the soil line. Prevent it by ensuring good air circulation, avoiding overwatering, and using a sterile growing medium.'
    },
    phase3: {
      title: 'Phase 3: Vegetative Stage',
      subtitle: 'Building size and strength (Week 3-7)',
      p1_title: 'Growth Spurt',
      p1_text: 'In this phase, the plant focuses on growing leaves, stems, and roots, building its "solar panel" factory. It needs plenty of light (18+ hours/day) and nutrients rich in Nitrogen (N). Transplant to a larger pot when the plant\'s leaves reach the edges of its current one.',
      p2_title: 'Training Techniques',
      p2_text: 'Training shapes the plant to create an even canopy, ensuring all bud sites get optimal light, which dramatically increases yield. Techniques like LST (Low Stress Training) or Topping should be started when the plant has 5-6 nodes (leaf pairs).',
      checklist: {
        'c1': 'Transplant into the final pot as needed.',
        'c2': 'Begin feeding with a nitrogen-rich vegetative fertilizer.',
        'c3': 'Water regularly, allowing the medium to slightly dry out between waterings.',
        'c4': 'Apply training techniques like LST or Topping.',
        'c5': 'Monitor for pests and early signs of deficiencies.',
      },
      proTip: 'Topping (cutting the main stem) creates two main colas and a bushier plant. FIMing ("Fuck, I Missed"), a variation of topping, can produce four or more main colas and is slightly less stressful for the plant.'
    },
    phase4: {
      title: 'Phase 4: Flowering Stage',
      subtitle: 'The magic happens (Week 8+)',
      p1_title: 'Inducing Flower',
      p1_text: 'For photoperiod plants, switch the light cycle to 12 hours on / 12 hours off. This signals the plant to start flowering. In the first 2-3 weeks, the plant will stretch significantly, sometimes doubling in height, before focusing its energy on bud production.',
      p2_title: 'Nutrient & Environment Shift',
      p2_text: 'The plant\'s needs change. It now requires less Nitrogen (N) and more Phosphorus (P) and Potassium (K). Switch to a specialized bloom fertilizer. It\'s crucial to lower humidity (40-50%) to prevent bud rot (botrytis).',
      checklist: {
        'c1': 'Switch light cycle to 12/12.',
        'c2': 'Switch to a bloom-specific fertilizer.',
        'c3': 'Lower humidity and ensure excellent air circulation around the buds.',
        'c4': 'Provide support for heavy branches (stakes, yo-yos, or nets).',
        'c5': 'Begin flushing with plain water for the last 1-2 weeks.',
      },
      proTip: 'The 12-hour dark period must be *uninterrupted*. Even a small light leak from equipment or outside can stress the plant, causing it to produce male flowers (hermaphroditism) or revert to the vegetative state.'
    },
    phase5: {
      title: 'Phase 5: Harvest, Drying & Curing',
      subtitle: 'The reward for your effort',
      p1_title: 'The Perfect Harvest Window',
      p1_text: 'The best indicator is the trichomes (resin glands). Use a 60x loupe: Clear trichomes are immature. Milky/cloudy trichomes indicate peak THC and a more energetic high. Amber trichomes mean THC is degrading into CBN, resulting in a more sedative, body-heavy effect. Most growers harvest when it\'s mostly cloudy with about 10-20% amber.',
      p2_title: 'Drying and Curing',
      p2_text: 'Hang branches upside down in a dark, cool room (approx. 18-20°C, 50-60% humidity) for 7-14 days until smaller stems snap instead of bend. Then, trim the buds and place them in airtight glass jars for curing. "Burp" the jars daily for the first week to release moisture.',
      checklist: {
        'c1': 'Inspect trichomes to determine the perfect harvest time.',
        'c2': 'Harvest the plant and perform a preliminary trim (wet trim).',
        'c3': 'Dry the buds slowly in a controlled environment.',
        'c4': 'Perform the final trim (dry trim) and place buds in jars for curing.',
        'c5': 'Cure for at least 2-4 weeks, burping the jars regularly.',
      },
      proTip: 'Curing is a critical scientific process. It allows chlorophyll and sugars to break down, dramatically improving the smoothness, taste, and aroma of your final product. Use small hygrometers inside your curing jars to maintain the ideal humidity of around 62%.'
    }
  },
  proTip: {
    title: 'Pro Tip',
    button: 'Reveal Tip',
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
  }
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