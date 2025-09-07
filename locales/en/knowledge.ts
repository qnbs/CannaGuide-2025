export const knowledgeView = {
  title: 'Grow Guide',
  subtitle: 'Your guide from preparation to harvest.',
  tabs: {
    guide: 'Guide',
    database: 'Knowledge Database'
  },
  progress: 'Your Progress',
  stepsCompleted: '{completed} of {total} steps completed',
  aiMentor: {
    title: 'Ask the AI Mentor',
    subtitle: 'Have a specific question about growing? Ask it here and get a detailed answer.',
    placeholder: 'e.g., What is the best pH in the flowering stage?',
    button: 'Ask Question',
    loading: 'Analyzing question...',
  },
  sections: {
    phase1: {
      title: 'Phase 1: Preparation & Setup',
      subtitle: 'The foundation for your success',
      p1_title: 'The Right Place',
      p1_text: 'Choose a discreet location with access to electricity and fresh air. A basement, a closet, or an unused room are ideal. The temperature should be stable.',
      p2_title: 'Assembling Equipment',
      p2_text: 'Use our Setup Configurator in the "Equipment" section to create a shopping list. The most important components are the tent, light, exhaust fan, and pots.',
      checklist: {
          'c1': 'Find a discreet location with a power outlet.',
          'c2': 'Set up the grow tent.',
          'c3': 'Install and test the lamp and exhaust system.',
          'c4': 'Set the timer for the lamp.',
      },
      proTip: 'Invest in a good exhaust system with a carbon filter. It\'s crucial not only for odor control but also for constant air exchange, which prevents mold and pests.'
    },
    phase2: {
      title: 'Phase 2: Germination & Seedling',
      subtitle: 'The start of life (Week 1-2)',
      p1_title: 'Germinating Seeds',
      p1_text: 'The paper towel method is popular: place the seeds between two damp paper towels on a plate and cover it. Keep them warm (22-25°C) and dark. After 2-7 days, a small root should be visible.',
      p2_title: 'The Seedling',
      p2_text: 'Once the root is about 1-2 cm long, carefully plant the seed about 0.5-1 cm deep in a small pot with seedling soil. Keep the soil moist, but not wet. The lighting should now be set to 18 hours on / 6 hours off.',
      checklist: {
          'c1': 'Germinate the seeds.',
          'c2': 'Plant the germinated seed in a small pot.',
          'c3': 'Ensure high humidity (60-70%), e.g., with a mini greenhouse.',
          'c4': 'Do not overwater seedlings.'
      },
      proTip: 'Don\'t overwater your seedlings! This is the most common mistake. The small roots can rot quickly. Let the soil dry out slightly between waterings.'
    },
    phase3: {
      title: 'Phase 3: Vegetative Stage',
      subtitle: 'Building size and strength (Week 3-7)',
      p1_title: 'Growth Spurt',
      p1_text: 'In this phase, the plant focuses on growing leaves and stems. It now needs more light and nutrients. Once the plant is larger than its pot, it should be transplanted into its final pot.',
      p2_title: 'Training Techniques',
      p2_text: 'Techniques like LST (Low Stress Training) or topping can now be applied to encourage bushier growth and a higher yield. Start when the plant has 5-6 pairs of leaves.',
      checklist: {
          'c1': 'Transplant the plant into its final pot if necessary.',
          'c2': 'Start fertilizing according to the manufacturer\'s instructions (half dose at first).',
          'c3': 'Water regularly when the soil is dry and monitor the pH value.',
          'c4': 'Apply training techniques (e.g., LST).'
      },
      proTip: 'Low Stress Training (LST) is beginner-friendly and very effective. Gently bend the main stem to the side and tie it down. This encourages the lower branches to grow upwards, resulting in a more even canopy and more yield.'
    },
    phase4: {
      title: 'Phase 4: Flowering Stage',
      subtitle: 'The magic happens (Week 8+)',
      p1_title: 'Inducing Flowering',
      p1_text: 'To induce flowering, the light cycle is switched to 12 hours on / 12 hours off. The plant will continue to grow in the first few weeks ("the stretch") and then begin to form buds.',
      p2_title: 'Nutrient Needs',
      p2_text: 'The nutrient requirement changes. The plant now needs more phosphorus (P) and potassium (K). Use a special flowering fertilizer. Maintain lower humidity (40-50%) to prevent mold.',
      checklist: {
          'c1': 'Switch light cycle to 12/12.',
          'c2': 'Switch to flowering fertilizer and supplement with Cal/Mag.',
          'c3': 'Lower humidity and ensure good air circulation.',
          'c4': 'Flush with plain water for the last 1-2 weeks.'
      },
      proTip: 'In the last 1-2 weeks before harvest, you should stop fertilizing and only flush with plain water. This significantly improves the taste and quality of the final product.'
    },
    phase5: {
      title: 'Phase 5: Harvest, Drying & Curing',
      subtitle: 'The reward for your effort',
      p1_title: 'The Right Time to Harvest',
      p1_text: 'The best indicator is the trichomes (the small resin glands). Viewed with a magnifying glass, most should be milky-cloudy and some amber. If they are still clear, it is too early. If they are all amber, the effect will be very sedative.',
      p2_title: 'Drying and Curing',
      p2_text: 'Cut the branches and hang them upside down in a dark, cool room (approx. 18-20°C, 50-60% humidity) for 7-14 days. Afterward, the dry buds are placed in airtight jars for "curing". Burp the jars daily for the first week. This step is crucial for quality, taste, and effect.',
      checklist: {
          'c1': 'Check trichomes and harvest.',
          'c2': 'Hang the plant upside down in a dark, cool place.',
          'c3': 'Cure the buds in jars and burp regularly.',
          'c4': 'Be patient - good curing takes at least 2-4 weeks.'
      },
      proTip: 'The ideal humidity for curing is 62%. Use small hygrometers in your jars or special humidity packs (e.g., Boveda) to achieve perfect results.'
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