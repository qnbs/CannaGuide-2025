export const equipmentView = {
  tabs: {
    configurator: 'AI Configurator',
    calculators: 'Calculators',
    setups: 'My Setups',
    growShops: 'Grow Shops',
  },
  configurator: {
    title: 'AI Setup Configurator',
    subtitle: 'Answer a few questions and let our AI recommend the perfect equipment for your needs.',
    subtitleNew: 'Get a tailored equipment recommendation based on your planned number of plants and style.',
    step1Title: 'Grow Area & Budget',
    step1TitleNew: '1. How many plants are you planning to grow?',
    step2Title: 'Grow Style',
    step2TitleNew: '2. Choose your configuration style',
    area: 'Area',
    areas: {
      '60x60': 'Small (60x60 cm)',
      '80x80': 'Medium (80x80 cm)',
      '100x100': 'Large (100x100 cm)',
      '120x60': 'Rectangle (120x60 cm)',
      '120x120': 'XL (120x120 cm)',
    },
    plantCount_one: '1 Plant',
    plantCount_other: '{{count}} Plants',
    budget: 'Budget',
    budgets: {
      low: 'Value',
      medium: 'Balanced',
      high: 'Premium',
    },
    style: 'Grow Style',
    styles: {
      beginner: 'Beginner Friendly',
      balanced: 'Balanced',
      yield: 'Yield Maximization',
    },
    generate: 'Generate Setup',
    resultsTitle: 'Your Custom Setup Recommendation',
    resultsSubtitle: 'For: {area} area, {budget} budget, {style} style',
    categories: {
      tent: 'Tent',
      light: 'Lighting',
      ventilation: 'Ventilation',
      pots: 'Pots',
      soil: 'Soil/Medium',
      nutrients: 'Nutrients',
      extra: 'Extras',
    },
    total: 'Total Cost',
    costBreakdown: 'Cost Breakdown',
    tryAgain: 'Try Again',
    startOver: 'Start Over',
    saveSetup: 'Save Setup',
    setupNamePrompt: 'What would you like to name this setup?',
    setupSaveSuccess: 'Setup "{name}" saved successfully!',
    setupNameBudgets: {
      low: 'Value',
      medium: 'Balanced',
      high: 'Premium',
    },
    setups: {
      '1': {
        standard: {
          title: 'Starter Solo',
          description: 'A budget-friendly, simple setup perfect for a first-time single-plant grow.',
          prompt: 'Create a beginner-friendly, value-for-money grow setup for a single cannabis plant in a 60x60cm space.'
        },
        medium: {
          title: 'Balanced Soloist',
          description: 'A quality setup focusing on efficiency and yield for a single plant.',
          prompt: 'Create a balanced grow setup for a single cannabis plant in an 80x80cm space.'
        },
        premium: {
          title: 'Boutique Single',
          description: 'A high-end setup for maximizing quality and control over a single showcase plant.',
          prompt: 'Create a premium grow setup for a single cannabis plant in a 60x60cm space, focusing on highest quality and yield.'
        }
      },
      '2': {
        standard: {
          title: 'Efficient Duo',
          description: 'A solid setup for growing two plants with a good balance of cost and performance.',
          prompt: 'Create a beginner-friendly, value-for-money grow setup for two cannabis plants in an 80x80cm or 120x60cm space.'
        },
        medium: {
          title: 'Dynamic Duo',
          description: 'An optimized setup for two plants, aimed at higher yields and better quality.',
          prompt: 'Create a balanced grow setup for two cannabis plants in a 100x100cm space.'
        },
        premium: {
          title: 'High-Tech Twins',
          description: 'The ultimate setup for two plants, using state-of-the-art tech for maximum results.',
          prompt: 'Create a premium grow setup for two cannabis plants in an 80x80cm or 120x60cm space, focusing on maximum quality and yield.'
        }
      },
      '3': {
        standard: {
          title: 'Productive Trio',
          description: 'A cost-effective setup designed to maximize the yield of three plants.',
          prompt: 'Create a beginner-friendly, value-for-money grow setup for three cannabis plants in a 100x100cm space.'
        },
        medium: {
          title: 'Power Trio',
          description: 'A powerful setup for three plants, combining advanced components for impressive harvests.',
          prompt: 'Create a balanced grow setup for three cannabis plants in a 120x120cm space.'
        },
        premium: {
          title: 'Commercial-Grade',
          description: 'A professional-level setup for three plants, designed for maximum yields, quality, and automation.',
          prompt: 'Create a premium, commercial-style grow setup for three cannabis plants in a 120x120cm space, focusing on maximum quality and yield.'
        }
      }
    },
    details: {
      zelt: 'Tent',
      beleuchtung: 'Light',
      abluft: 'Exhaust',
      toepfe: 'Pots',
      medium: 'Medium'
    },
    error: 'Error generating recommendation.'
  },
  calculators: {
    title: 'Calculators',
    ventilation: {
      title: 'Exhaust Fan Calculator',
      description: 'Calculate the required power of your exhaust fan (in m³/h) to maintain an optimal environment.',
      width: 'Tent Width',
      depth: 'Tent Depth',
      height: 'Tent Height',
      lightWattage: 'Light Wattage (LED)',
      lightWattageTooltip: 'The heat from your light is a major factor. Enter the actual power draw of your LED light here.',
      carbonFilter: 'Using a carbon filter?',
      carbonFilterTooltip: 'A filter increases air resistance and requires about 25-40% more power from the fan.',
      result: 'Recommended Fan Power',
    },
    light: {
      title: 'Lighting Calculator',
      description: 'Estimate the required LED light wattage for your grow area and the current stage of your plant.',
      width: 'Area Width',
      depth: 'Area Depth',
      stage: 'Growth Stage',
      result: 'Recommended LED Wattage',
      ppfdTooltip: 'PPFD (Photosynthetic Photon Flux Density) measures the amount of usable light reaching your plants.',
      dliTooltip: 'DLI (Daily Light Integral) is the total amount of usable light your plants receive over a 24-hour period.'
    },
    cost: {
      title: 'Electricity Cost Calculator',
      description: 'Estimate the electricity cost of your grow per day, week, month, and for a typical 90-day cycle.',
      lightPower: 'Light Power',
      lightHours: 'Light Hours',
      fanPower: 'Fan Power',
      fanHours: 'Fan Hours',
      otherPower: 'Other Appliances',
      price: 'Electricity Price',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      cycle: 'Per Cycle',
      cycleSub: '(approx. 90 days)',
    },
    nutrients: {
      title: 'Nutrient Calculator',
      description: 'Calculate the required amount of each nutrient component for your water reservoir.',
      reservoir: 'Water Reservoir Size',
      component: 'Component',
      dose: 'Dose',
      totalFor: 'Total for',
      componentName: 'Comp. {count}',
      addComponent: 'Add Component',
    },
    converter: {
      title: 'EC / PPM Converter',
      description: 'Convert between EC (Electrical Conductivity) and PPM (Parts Per Million) on different scales.',
      resultInfo: 'Change one value to automatically convert the others.',
      ec: 'EC (mS/cm)',
      ppm500: 'PPM (500 Scale)',
      ppm700: 'PPM (700 Scale)'
    },
    yield: {
      title: 'Yield Calculator',
      description: 'Get a rough estimate of your potential yield based on your light wattage and experience.',
      wattage: 'LED Wattage',
      level: 'Experience Level',
      levels: {
        beginner: 'Beginner',
        advanced: 'Advanced',
        expert: 'Expert',
      },
      training: 'Training Technique',
      trainings: {
        none: 'None',
        lst: 'LST (Low Stress Training)',
        scrog: 'SCROG (Screen of Green)',
      },
      result: 'Estimated Yield',
      efficiency: 'Efficiency',
    },
    yes: 'Yes',
    no: 'No',
  },
  savedSetups: {
    title: 'Saved Setups',
    noSetups: {
      title: 'No Setups Saved',
      subtitle: 'Use the AI Configurator to create and save your first setup.',
    },
    deleteConfirm: 'Are you sure you want to delete this setup?',
    editTitle: 'Edit Setup',
    pdfReport: {
      setup: 'Setup Report',
      createdAt: 'Created At',
      item: 'Component',
      product: 'Product',
      rationale: 'Rationale',
      price: 'Price',
      category: 'Category',
    },
    exportTitle: 'Saved Setups Export',
  },
  growShops: {
    title: 'Recommended Grow Shops',
    strengths: 'Strengths',
    shipping: 'Shipping',
    paymentMethods: 'Payment Methods',
    region: {
      europe: 'Europe',
      usa: 'USA',
    },
    european: {
      title: 'Top Grow Shops in Europe',
      shopKeys: ['grow-guru', 'grow-shop-24', 'growmart'],
    },
    us: {
      title: 'Top Grow Shops in the USA',
      shopKeys: ['grow-generation', 'hydrobuilder', 'htg-supply'],
    },
    shops: {
      'grow-guru': {
        name: 'Grow Guru',
        location: 'Germany',
        rating: 4.8,
        description: 'A highly-rated German shop known for its excellent selection of high-quality brands like Sanlight and Lumatek, and for its fast, discreet shipping.',
        strengths: ['Excellent customer service', 'Great selection of premium brands', 'Fast shipping across Europe'],
        shipping: 'Europe-wide',
        paymentMethods: ['credit_card', 'paypal', 'bank_transfer'],
        url: 'https://www.grow-guru.com/',
      },
      'grow-shop-24': {
        name: 'Grow-Shop24',
        location: 'Germany',
        rating: 4.6,
        description: 'Offers a wide range of products for all budgets, from entry-level kits to professional equipment. Known for competitive pricing and frequent sales.',
        strengths: ['Good value for money', 'Wide assortment', 'Regular discount campaigns'],
        shipping: 'Europe-wide',
        paymentMethods: ['credit_card', 'paypal', 'bank_transfer'],
        url: 'https://www.grow-shop24.de/',
      },
      'growmart': {
        name: 'Growmart',
        location: 'Germany',
        rating: 4.7,
        description: 'An established shop with a strong focus on sustainability and organic growing. They offer a great selection of organic fertilizers and soils.',
        strengths: ['Focus on organic & sustainable products', 'Very informative website & blog', 'Good selection of complete kits'],
        shipping: 'Europe-wide',
        paymentMethods: ['credit_card', 'paypal', 'bank_transfer'],
        url: 'https://www.growmart.de/',
      },
      'grow-generation': {
        name: 'GrowGeneration',
        location: 'USA',
        rating: 4.9,
        description: 'One of the largest hydroponic retailers in the US, with brick-and-mortar stores and a massive online shop. Carries all major brands and caters to everything from hobby to commercial scale.',
        strengths: ['Huge selection', 'Physical store locations', 'Commercial-scale solutions available'],
        shipping: 'USA',
        paymentMethods: ['credit_card', 'paypal'],
        url: 'https://growgeneration.com/',
      },
      'hydrobuilder': {
        name: 'Hydrobuilder',
        location: 'USA',
        rating: 4.8,
        description: 'An online superstore for grow equipment, known for its excellent customer service and detailed product information. Often runs package deals and free shipping offers.',
        strengths: ['Stellar customer service', 'Free shipping on many items', 'Comprehensive product guides'],
        shipping: 'USA',
        paymentMethods: ['credit_card', 'paypal', 'crypto'],
        url: 'https://hydrobuilder.com/',
      },
      'htg-supply': {
        name: 'HTG Supply',
        location: 'USA',
        rating: 4.7,
        description: 'HTG Supply is known for its wide range of house-brand products, which offer a cost-effective alternative to more expensive brands. They also have physical locations on the East Coast.',
        strengths: ['Great selection of in-house brands', 'Competitive pricing', 'Helpful and knowledgeable staff'],
        shipping: 'USA',
        paymentMethods: ['credit_card', 'paypal'],
        url: 'https://www.htgsupply.com/',
      },
    },
    selectShopTitle: 'Select a Shop',
    selectShopSubtitle: 'Choose a shop from the list to view its details.',
    visitShop: 'Visit {shopName}',
  }
};
