export const en = {
  common: {
    close: 'Close',
    apply: 'Apply',
    reset: 'Reset',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    add: 'Add',
    export: 'Export',
    delete: 'Delete',
    edit: 'Edit',
    next: 'Next',
    back: 'Back',
    start: 'Let\'s Go!',
    error: 'Error',
    success: 'Success',
    info: 'Info',
    warning: 'Warning',
    all: 'All',
    name: 'Name',
    type: 'Type',
    days: 'Days',
    details: 'Details',
    description: 'Description',
    genetics: 'Genetics',
    notes: 'Notes',
    or: 'or',
    why: 'Why?',
    downloadAgain: 'Re-download',
    aiResponseError: 'The AI could not generate a response. Please try again later or rephrase your request.',
    noDataToExport: 'No data available to export.',
    successfullyExported: 'Successfully exported {count} strains as {format} & saved to "My Exports".',
    actions: 'Actions',
  },
  nav: {
    strains: 'Strains',
    plants: 'Plants',
    equipment: 'Equipment',
    knowledge: 'Knowledge',
    settings: 'Setup',
    help: 'Help',
  },
  onboarding: {
    step1: {
      title: 'Welcome to the Grow Guide!',
      text: 'Discover hundreds of strains. Find the perfect genetics for your needs and save your favorites.',
    },
    step2: {
      title: 'Track Your Plants',
      text: 'Start a virtual grow, monitor your plants\' progress, log actions, and respond to their needs.',
    },
    step3: {
      title: 'Plan Your Equipment',
      text: 'Use the setup configurator and handy calculators to find your ideal equipment, whether you\'re a beginner or a pro.',
    },
    step4: {
      title: 'Learn & Grow',
      text: 'Follow the interactive guide to master the basics of cultivation and track your knowledge progress.',
    },
  },
  strainsView: {
    title: 'Strains',
    searchPlaceholder: 'Search strain...',
    all: 'All',
    sativa: 'Sativa',
    indica: 'Indica',
    hybrid: 'Hybrid',
    advancedFilters: 'Advanced Filters',
    matchingStrains: '{count} matching strains',
    thcMax: 'THC% max.',
    cbdMax: 'CBD% max.',
    floweringTime: 'Flowering Time',
    weeks: 'weeks',
    level: 'Level',
    terpenes: 'Terpenes',
    aromas: 'Aromas',
    resetFilters: 'Reset Filters',
    view: {
      list: 'List',
      grid: 'Grid',
    },
    sortBy: 'Sort by:',
    sortOptions: {
        name_asc: 'Name (A-Z)',
        name_desc: 'Name (Z-A)',
        thc_desc: 'THC (High-Low)',
        thc_asc: 'THC (Low-High)',
        cbd_desc: 'CBD (High-Low)',
        cbd_asc: 'CBD (Low-High)',
        flowering_asc: 'Flowering (Short-Long)',
        flowering_desc: 'Flowering (Long-Short)',
    },
    deleteStrainConfirm: 'Are you sure you want to delete the strain "{name}"? This cannot be undone.',
    deleteStrainSuccess: 'Strain "{name}" has been deleted.',
    deleteStrainError: 'Error deleting strain.',
    difficulty: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
    },
    table: {
      name: 'Name',
      type: 'Type',
      thc: 'THC',
      cbd: 'CBD',
      flowering: 'Flowering',
      agronomics: 'Agronomics',
      level: 'Level',
    },
    tabs: {
      all: 'All',
      user: 'My ({count})',
      exports: 'Exports ({count})',
    },
    noStrainsFound: {
      title: 'No strains found.',
      subtitle: 'Try adjusting your filters.',
    },
    noUserStrains: {
      title: 'You haven\'t added any custom strains yet.',
      subtitle: 'Click "Add" to create your first one.',
      button: 'Add first strain',
    },
    footer: {
      showFavorites: 'Favorites only ({count})',
      selected: '{count} selected',
      showing: 'Showing {shown} of {total} strains',
    },
    strainModal: {
      thc: 'THC',
      cbd: 'CBD',
      difficulty: 'Difficulty',
      floweringTime: 'Flowering Time',
      aromas: 'Aromas',
      dominantTerpenes: 'Dominant Terpenes',
      agronomicData: 'Agronomic Data',
      yieldIndoor: 'Yield (Indoor)',
      yieldOutdoor: 'Yield (Outdoor)',
      heightIndoor: 'Height (Indoor)',
      heightOutdoor: 'Height (Outdoor)',
      similarStrains: 'Similar Strains',
      startGrowing: 'Start Growing',
      allSlotsFull: 'All slots full',
      toggleFavorite: 'Toggle Favorite',
    },
    addStrainModal: {
      title: 'Add New Strain',
      editTitle: 'Edit Strain',
      editSuccess: 'Strain "{name}" successfully updated!',
      generalInfo: 'General Information',
      strainName: 'Strain Name',
      typeDetailsPlaceholder: 'e.g. Sativa 60% / Indica 40%',
      cannabinoids: 'Cannabinoids',
      thcPercent: 'THC (%)',
      cbdPercent: 'CBD (%)',
      thcRange: 'THC Range',
      thcRangePlaceholder: 'e.g. 20-25%',
      cbdRange: 'CBD Range',
      cbdRangePlaceholder: 'e.g. <1%',
      growData: 'Grow Data',
      floweringTimeWeeks: 'Flowering Time (weeks)',
      floweringTimeRange: 'Flowering Time Range',
      floweringTimeRangePlaceholder: 'e.g. 8-9',
      yield: 'Yield',
      yields: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
      },
      yieldIndoorPlaceholder: 'e.g. ~500 g/m²',
      yieldOutdoorPlaceholder: 'e.g. ~600 g/plant',
      heightIndoorPlaceholder: 'e.g. Medium (100-150cm)',
      heightOutdoorPlaceholder: 'e.g. Tall (up to 2m)',
      profile: 'Profile',
      aromasPlaceholder: 'Separate values with commas',
      terpenesPlaceholder: 'Separate values with commas',
      addStrainSuccess: 'Strain "{name}" added successfully!',
      addStrainError: 'Error saving strain.',
      validation: {
        name: 'Name is required.',
        thc: 'THC must be between 0 and 50.',
        floweringTime: 'Flowering time must be between 4 and 20 weeks.',
      }
    },
    exportModal: {
      title: 'Export Data',
      source: 'Source',
      format: 'Format',
      sources: {
        selected: 'Selected',
        favorites: 'Favorites',
        filtered: 'Filtered Results',
        all: 'All Strains',
      },
      formats: {
        json: 'JSON',
        csv: 'CSV',
        pdf: 'PDF',
      },
    },
    exportsManager: {
      noExports: {
        title: 'No Saved Exports',
        subtitle: 'When you export a strain list, it will appear here for later use.',
      },
      sourceLabel: 'Source',
      exportRemoved: 'Export removed from list.',
      redownloadConfirm: 'Are you sure you want to remove this export from the list?',
      strainsNotFound: 'The strains required for this export could not be found.',
      downloadingExport: 'Downloading export "{name}.{format}".',
    }
  },
  plantsView: {
    title: 'Grow Dashboard',
    welcome: 'Welcome back! Here\'s an overview of your current grows.',
    summary: {
      activeGrows: 'Active Grows',
      openTasks: 'Open Tasks',
      waterAll: 'Water All',
      addPlant: 'Add Plant',
    },
    yourGrowbox: 'Your Growbox',
    sortBy: 'Sort by',
    sortOptions: {
      age: 'Age',
      stage: 'Stage',
      name: 'Name',
    },
    noPlants: {
      title: 'No Plants Currently Growing',
      subtitle: 'Go to the Strain Database to start your first grow.',
      button: 'Start First Grow',
    },
    plantCard: {
      stage: 'Stage',
      day: 'Day',
      days: 'Days',
      of: 'of',
      ph: 'pH',
      temp: 'Temperature',
      moisture: 'Moisture',
      ec: 'EC',
      water: 'Water',
      feed: 'Feed',
      log: 'Observe',
      photo: 'Photo',
    },
    tasks: {
      title: 'Open Tasks',
      none: 'No open tasks. Everything is looking good!',
      priority: 'Priority',
      priorities: {
        high: 'High',
        medium: 'Medium',
        low: 'Low',
      },
      wateringTask: {
        title: 'Water Plant',
        description: 'Substrate moisture is low.'
      },
      feedingTask: {
        title: 'Feed Plant',
        description: 'EC is low, nutrients are needed.'
      },
      phTask: {
        title: 'Check pH',
        description: 'pH is outside the optimal range.'
      },
    },
    warnings: {
      title: 'Active Warnings',
      none: 'No problems detected with your plants. Keep it up!',
    },
    aiDiagnostics: {
      title: 'AI Plant Doctor',
      description: 'Upload a photo of an affected leaf to get an AI-powered diagnosis and solution suggestions.',
      buttonLabel: 'Select Photo',
      prompt: 'or drop it here',
      analyzing: 'Analyzing image...',
      diagnoseButton: 'Start Diagnosis',
      resultTitle: 'AI Diagnosis',
      error: 'Analysis failed. Please try again.',
    },
    notifications: {
      allSlotsFull: "All plant slots are occupied.",
      startSuccess: "Started growing {name}!",
      waterAllSuccess: "Watered {count} plants.",
      waterAllNone: "No plants need watering.",
      photoGallerySoon: 'Photo gallery feature is coming soon!',
      stageChange: 'New stage reached: {stage}',
      harvestReady: '{name} is ready for harvest!',
      finalYield: 'Final yield calculated: {yield}g',
    },
    detailedView: {
      back: 'Back to Dashboard',
      tabs: {
        overview: 'Overview',
        journal: 'Journal',
        tasks: 'Tasks',
        photos: 'Photos',
        ai: 'AI Advisor',
      },
      vitals: 'Vitals',
      ph: 'pH Level',
      ec: 'EC Level',
      moisture: 'Moisture',
      stress: 'Stress Level',
      environment: 'Environment',
      temperature: 'Temperature',
      humidity: 'Humidity',
      lightIntensity: 'Light Intensity',
      height: 'Height',
      history: 'History',
      historyNoData: 'Not enough data for chart.',
      aiTip: 'AI Care Tip',
      aiTipError: 'Could not load tip.',
      lifecycle: 'Plant Lifecycle',
      journalFilters: {
        watering: 'Watering',
        feeding: 'Feeding',
        training: 'Training',
        observation: 'Observation',
        system: 'System',
        photo: 'Photo',
      },
      journalNoEntries: 'No entries found for this filter.',
      tasksNoEntries: 'No tasks have been created yet.',
      tasksComplete: 'Complete',
      photosNoEntries: 'No photos have been added yet.',
      aiAdvisor: {
        prompt: 'Ask a question about this plant. The AI will analyze the current data.',
        placeholder: 'e.g., "Why are the leaves drooping?"',
        button: 'Ask',
        titleTemplate: 'AI Analysis for {name}'
      },
      actions: {
        water: 'Water',
        feed: 'Feed',
        train: 'Train',
        photo: 'Photo',
        observe: 'Observe',
      }
    },
    setupModal: {
      title: 'Setup for {name}',
      subtitle: 'Configure your grow setup for this strain.',
      lightSource: 'Light Source',
      potSize: 'Pot Size',
      medium: 'Grow Medium',
      mediums: {
        soil: 'Soil',
        coco: 'Coco',
        hydro: 'Hydro',
      },
      environment: 'Environment',
      temp: 'Temperature (°C)',
      humidity: 'Humidity (%)',
      lightHours: 'Light (h/day)',
      validation: {
        light: 'The light cycle must be between 1 and 24 hours.',
        temp: 'The temperature should be between 10°C and 40°C.',
        humidity: 'The humidity should be between 10% and 99%.',
      }
    },
    actionModals: {
      wateringTitle: 'Log Watering',
      waterAmount: 'Water Amount (ml)',
      phValue: 'pH Value',
      feedingTitle: 'Log Feeding',
      ecValue: 'EC Value (mS/cm)',
      observationTitle: 'Log Observation',
      observationPlaceholder: 'Observations, actions taken...',
      trainingTitle: 'Log Training',
      trainingType: 'Training Type',
      trainingTypes: {
        topping: 'Topping',
        lst: 'LST',
        defoliation: 'Defoliation',
      },
      photoTitle: 'Add Photo',
      photoNotes: 'Notes about the photo',
      photoSimulated: 'Camera function is simulated. A random image will be added.',
      defaultNotes: {
        watering: 'Watering',
        feeding: 'Feeding',
      }
    }
  },
  equipmentView: {
    title: 'Equipment Planner',
    tabs: {
      configurator: 'Configurator',
      calculators: 'Calculators',
      gear: 'Gear & Shops',
    },
    configurator: {
      title: 'Setup Configurator',
      subtitle: 'Find the right equipment in 3 easy steps.',
      step: 'Step {current}/{total}',
      step1Title: 'Choose your grow area',
      step2Title: 'Choose your grow style',
      styles: {
        beginner: 'Beginner-Friendly',
        yield: 'Maximum Yield',
        stealth: 'Stealth',
      },
      styleDescriptions: {
        beginner: 'Easy-to-use and forgiving components.',
        yield: 'Focus on performance and high harvest results.',
        stealth: 'Quiet and inconspicuous components for a stealth grow.',
      },
      step3Title: 'Choose your budget',
      budgets: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
      },
      budgetDescriptions: {
        low: 'Basic equipment to get started.',
        medium: 'Good balance of price and performance.',
        high: 'Premium components for optimal control.',
      },
      generate: 'Generate Setup',
      resultsTitle: 'Your Personal Setup Recommendation',
      resultsSubtitle: 'For your {area}cm space, with a {budget} budget and "{style}" style, this is an AI-generated configuration.',
      costBreakdown: 'Cost Breakdown',
      total: 'Total',
      startOver: 'Start Over',
      error: 'The AI could not generate a recommendation. Please try again later.',
      errorNetwork: 'An error occurred. Please try again later.',
      categories: {
        tent: 'Grow Tent',
        light: 'Lighting',
        ventilation: 'Ventilation System',
        pots: 'Pots',
        soil: 'Soil & Substrate',
        nutrients: 'Nutrients',
        extra: 'Accessories',
      },
      rationaleModalTitle: 'Why {category}?',
    },
    calculators: {
      ventilation: {
        title: 'Fan Calculator',
        description: 'Calculate the required fan power (m³/h) for your grow tent.',
        width: 'Width',
        depth: 'Depth',
        height: 'Height',
        result: 'Recommended exhaust fan power',
      },
      light: {
        title: 'Light Calculator',
        description: 'Estimate the required LED light power for your area.',
        width: 'Width',
        depth: 'Depth',
        result: 'Recommended LED power',
      },
      nutrients: {
        title: 'Nutrient Calculator',
        description: 'Calculate the right amount of fertilizer for your watering can.',
        waterAmount: 'Water Amount',
        dose: 'Dose',
        result: 'Required fertilizer',
      },
      yield: {
        title: 'Yield Estimator',
        description: 'Get a rough estimate of your potential harvest yield (g).',
        area: 'Area',
        wattage: 'Light Wattage',
        level: 'Experience Level',
        levels: {
            beginner: 'Beginner',
            advanced: 'Advanced',
            expert: 'Expert'
        },
        result: 'Estimated Yield'
      },
      calculate: 'Calculate',
    },
    gearAndShops: {
      shopsTitle: 'Recommended Online Shops (EU)',
      gearTitle: 'Essential Equipment',
      shops: {
        zamnesia: 'One of the largest and most well-known head and grow shops in Europe with a huge selection of seeds and accessories.',
        rqs: 'Royal Queen Seeds is a famous breeder and shop that offers high-quality seeds and a complete line of grow accessories.',
        growmart: 'An established German grow shop with a comprehensive range, from complete kits for beginners to professional equipment.'
      },
      gearItems: {
        tent: { name: 'Grow Tent', desc: 'Creates a controlled environment with reflective interior walls to make optimal use of light.' },
        led: { name: 'LED Lighting', desc: 'Modern full-spectrum LEDs are energy-efficient, produce little heat, and deliver excellent results.' },
        ventilation: { name: 'Exhaust Kit (Fan + Carbon Filter)', desc: 'Absolutely crucial. Removes stale air, controls temperature/humidity, and neutralizes odors.' },
        circulation: { name: 'Circulation Fan(s)', desc: 'One or more small fans inside the tent simulate wind, strengthen stems, and prevent air stagnation.' },
        pots: { name: 'Pots (Fabric or Air-Pots)', desc: 'Fabric pots or Air-Pots promote healthy root development through "air-pruning" and prevent root circling.' },
        timers: { name: 'Timer(s)', desc: 'At least one for the light cycle (e.g., 18/6 or 12/12 hours). Another one for ventilation can be useful.' },
        meters: { name: 'Meters (pH/EC, Thermo-Hygrometer)', desc: 'Essential for monitoring. pH & EC meters for the nutrient solution, thermo-hygrometer for temperature & humidity.' },
        harvest: { name: 'Harvesting Tools', desc: 'Sharp trimming scissors, a jeweler\'s loupe (60x) for checking trichomes, and airtight jars for curing.' },
      }
    }
  },
  knowledgeView: {
    title: 'Grow Guide',
    subtitle: 'Your guide from preparation to harvest.',
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
  },
  helpView: {
    title: 'Help Center',
    sections: {
      firstSteps: {
        title: 'First Steps & Main Features',
        description: 'Welcome to the Grow Guide! This app is your interactive companion for cannabis cultivation. Here is a brief overview:',
        list: {
          strains: '<strong>Discover Strains:</strong> Browse the <strong>{strainsView}</strong> database, use filters and search to find the perfect strain. Save favorites and start a new grow directly from the detail view.',
          plants: '<strong>Manage Plants:</strong> Manage up to three plants in the <strong>{plantsView}</strong> section. Observe their development in real-time, log all actions in the journal, and respond to problems and tasks.',
          knowledge: '<strong>Acquire Knowledge:</strong> Follow the step-by-step <strong>{knowledgeView}</strong> to learn the basics. Check off the checklist items to track your progress and ask the AI mentor your questions.',
          equipment: '<strong>Plan Setup:</strong> Plan your setup with the <strong>{equipmentView}</strong> configurator or use the practical calculators for light, ventilation, and nutrients.',
          settings: '<strong>Customize App:</strong> In the <strong>{settingsView}</strong> section, you can customize the color scheme (Light/Dark), font size, and language (German/English), as well as back up and import your data.'
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
            a: 'Yes! Go to the <strong>Setup</strong> section under "Data Management". There you can export all your data (plants, settings, custom strains, favorites) into a single backup file. You can later import this file on the same or another device.'
          },
          q4: {
            q: 'In which languages is the app available?',
            a: 'The app is fully available in <strong>German</strong> and <strong>English</strong>. You can change the language at any time in the <strong>Setup</strong> section under "Display" -> "Language". Your selection is saved automatically.'
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
      about: {
        title: 'About the App',
        version: 'v2.2.0',
        appName: 'Cannabis Grow Guide',
        description: 'This app is an interactive guide that supports you on your cannabis cultivation journey. Track your plants, learn about strains, and get expert tips on equipment and techniques.',
        features: '<strong>New Features:</strong> This version includes a full translation for English and German, as well as comprehensive accessibility improvements (keyboard & screen reader support).',
        devWithAIStudioTitle: 'Developed with AI Studio',
        devWithAIStudioText: 'This app was developed with Google\'s <strong>AI Studio</strong>, an innovative platform that allows for the creation and modification of complex web applications through natural language commands. The user interface was designed, functionalities implemented, and the Gemini AI integrated for intelligent features through iterative prompts. AI Studio significantly accelerates the development process and opens up new possibilities in app creation.',
        getTheAppHere: 'Get the App Here',
        disclaimerTitle: 'Disclaimer',
        disclaimerText: 'All information in this app is for educational and entertainment purposes only. The cultivation of cannabis is subject to strict legal regulations that vary from country to country. Please inform yourself about the laws in your region and always act responsibly and in accordance with the law.',
        privacyTitle: 'Privacy',
        privacyText: 'Your privacy is important to us. All your data, including plant journals and settings, is stored exclusively locally in your browser and never leaves your device.'
      }
    }
  },
  settingsView: {
    title: 'Settings',
    display: 'Display',
    design: 'Appearance & Design',
    designDescription: 'Customize the look and feel of the app. Choose from curated, professional designs.',
    themes: {
      'midnight-blue': {
        label: 'Midnight Blue',
        desc: 'A cutting-edge, dark blue design with cool cyan accents.',
      },
      'forest-deep': {
        label: 'Forest Deep',
        desc: 'The classic, deep green design with vibrant lime highlights.',
      },
      'purple-haze': {
        label: 'Purple Haze',
        desc: 'A cool theme with rich purples and magenta highlights.',
      },
      'og-kush': {
        label: 'OG Kush',
        desc: 'An earthy theme with warm amber and gold tones.',
      },
      'sativa-sun': {
        label: 'Sativa Sun',
        desc: 'A vibrant, energetic theme with bright orange and yellow accents.',
      },
      'hydro-tech': {
        label: 'Hydro-Tech',
        desc: 'A clean, futuristic look with cool cyan and teal colors.',
      }
    },
    fontSize: 'Font Size',
    fontSizeDescription: 'Adjust the font size for the entire app.',
    fontSizes: {
      sm: 'Small',
      base: 'Default',
      lg: 'Large',
    },
    language: 'Language',
    languageDescription: 'Choose your preferred language for the app.',
    languages: {
      de: 'Deutsch',
      en: 'English',
    },
    notificationsTitle: 'Notifications',
    notificationsEnable: 'Enable Notifications',
    notificationsEnableDescription: 'Receive notifications about important events.',
    stageChange: 'Stage Change',
    stageChangeDescription: 'Notify when a plant reaches a new life stage.',
    problemDetected: 'Problem Detection',
    problemDetectedDescription: 'Notify when a problem is detected with a plant.',
    harvestReady: 'Harvest Ready',
    harvestReadyDescription: 'Notify when a plant is ready for harvest.',
    simulation: 'Simulation & Gameplay',
    simulationSpeed: 'Simulation Speed',
    simulationSpeedDescription: 'Determines how fast time passes for your plants.',
    simulationDifficulty: 'Difficulty Level',
    simulationDifficultyDescription: 'Affects how much problems impact the plant\'s stress.',
    difficulties: {
      easy: 'Easy',
      normal: 'Normal',
      hard: 'Hard',
    },
    dataManagement: 'Data Management',
    exportBackup: 'Export Backup',
    exportBackupDescription: 'Back up all your app data: plants, favorites, custom strains, export history, and settings.',
    exportButton: 'Export Full Backup',
    importBackup: 'Import Backup',
    importBackupDescription: 'Restore all your data from a previously exported backup file.',
    importButton: 'Import Backup',
    dangerZone: 'Danger Zone',
    resetUserStrainsTitle: 'Reset "My Strains"',
    resetUserStrainsDescription: 'Deletes only the strains you have added. All other data will remain.',
    resetUserStrainsButton: 'Delete My Strains',
    resetExportsHistoryTitle: 'Reset "My Exports"',
    resetExportsHistoryDescription: 'Deletes only your export history. All other data will remain.',
    resetExportsHistoryButton: 'Delete Export History',
    fullResetTitle: 'Full App Reset',
    fullResetDescription: 'Permanently deletes all your saved data (plants, favorites, settings, etc.).',
    fullResetButton: 'Reset Everything',
    notifications: {
      fullResetConfirm: 'Are you sure you want to permanently delete all app data? This cannot be undone.',
      fullResetSuccess: 'All data has been reset. The app will now reload.',
      userStrainsResetConfirm: 'Are you sure you want to delete all strains you have added? Your plants and exports will remain.',
      userStrainsResetSuccess: 'Your custom strains have been deleted.',
      exportsResetConfirm: 'Are you sure you want to delete your export history? Your plants and custom strains will remain.',
      exportsResetSuccess: 'Export history has been deleted.',
      exportSuccess: 'All app data successfully exported.',
      exportError: 'Error exporting data.',
      importSuccess: 'Data successfully imported. The app will now reload.',
      importError: 'Error importing data. Invalid file format?',
    }
  },
  problemMessages: {
    overwatering: { message: 'Overwatering', solution: 'Reduce watering frequency.' },
    underwatering: { message: 'Underwatering', solution: 'Water the plant immediately.' },
    nutrientBurn: { message: 'Nutrient Burn (EC too high)', solution: 'Flush the substrate and reduce fertilizer dose.' },
    nutrientDeficiency: { message: 'Nutrient Deficiency (EC too low)', solution: 'Slightly increase fertilizer dose.' },
    phTooLow: { message: 'pH Level too low', solution: 'Adjust the pH of your water upwards.' },
    phTooHigh: { message: 'pH Level too high', solution: 'Adjust the pH of your water downwards.' },
    tempTooHigh: { message: 'Temperature too high', solution: 'Improve ventilation or cool the room.' },
    tempTooLow: { message: 'Temperature too low', solution: 'Increase the room temperature.' },
    humidityTooHigh: { message: 'Humidity too high', solution: 'Increase exhaust fan speed or use a dehumidifier.' },
    humidityTooLow: { message: 'Humidity too low', solution: 'Use a humidifier.' },
  },
  plantStages: {
    SEED: 'Seed',
    GERMINATION: 'Germination',
    SEEDLING: 'Seedling',
    VEGETATIVE: 'Vegetative',
    FLOWERING: 'Flowering',
    HARVEST: 'Harvest',
    DRYING: 'Drying',
    CURING: 'Curing',
    FINISHED: 'Finished',
  },
  commandPalette: {
    placeholder: 'Type a command or search...',
    noResults: 'No commands found.',
    actions: 'Actions',
    navigation: 'Navigation',
    settings: 'Settings',
    plants: 'Plants',
  },
};