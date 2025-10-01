
export const equipmentView = {
  tabs: {
    configurator: 'Setup Configurator',
    setups: 'My Setups',
    calculators: 'Calculators',
    growShops: 'Grow Shops',
  },
  configurator: {
    title: 'AI Equipment Configurator',
    subtitleNew: 'Answer two simple questions to get a complete, AI-generated equipment recommendation for your grow.',
    step1TitleNew: '1. How many plants do you want to grow?',
    plantCount_one: '1 Plant',
    // FIX: Changed interpolation key from 'count' to 'range' to allow passing a string for display while still using the numeric 'count' for pluralization.
    plantCount_other: '{{range}} Plants',
    step2TitleNew: '2. Choose your configuration style',
    generate: 'Generate Setup',
    setupSaveSuccess: 'Setup "{{name}}" saved successfully!',
    resultsTitle: 'Your AI-Generated Setup',
    resultsSubtitle: 'For: {{area}} area, with a focus on {{style}} and a {{budget}} budget.',
    resultsSubtitleNew: 'For: {{plants}} plants, with a {{budget}} budget.',
    total: 'Total Cost',
    error: 'An error occurred while generating your setup.',
    tryAgain: 'Try Again',
    saveSetup: 'Save Setup',
    startOver: 'Start Over',
    costBreakdown: 'Cost Breakdown',
    setupNamePrompt: 'Enter a name for this setup:',
    budgets: {
      value: 'Value',
      balanced: 'Balanced',
      premium: 'Premium',
    },
    budgetDescriptions: {
      value: 'Focus on the essentials with reliable, cost-effective equipment.',
      balanced: 'A blend of quality and value components for an optimal balance.',
      premium: 'No compromises. The best technology available for maximum quality and yield.'
    },
    styles: {
      beginner: 'ease of use',
      balanced: 'a balance of quality and yield',
      yield: 'maximizing yield',
    },
    setupNameBudgets: {
      value: 'Value',
      balanced: 'Balanced',
      premium: 'Premium',
    },
    categories: {
      tent: 'Grow Tent',
      light: 'Lighting',
      ventilation: 'Exhaust Fan',
      circulationFan: 'Circulation Fan',
      pots: 'Pots & Saucers',
      soil: 'Medium/Substrate',
      nutrients: 'Nutrients',
      extra: 'Extras & Monitoring',
    },
    details: {
      zelt: 'Tent',
      beleuchtung: 'Light',
      abluft: 'Exhaust',
      toepfe: 'Pots',
      medium: 'Medium',
    },
  },
  savedSetups: {
    exportTitle: 'Saved Setups',
    noSetups: {
      title: 'No Saved Setups',
      subtitle: 'Use the configurator to generate and save your first setup!',
    },
    deleteConfirm: 'Are you sure you want to delete this setup?',
    editTitle: 'Edit Setup Name',
    pdfReport: {
      setup: 'Setup Report',
      createdAt: 'Created At',
      item: 'Item',
      product: 'Product',
      rationale: 'Rationale',
      price: 'Price (€)',
      category: 'Category',
    }
  },
  calculators: {
    yes: 'Yes',
    no: 'No',
    ventilation: {
      title: 'Ventilation Calculator',
      description: 'Calculate the required exhaust fan power (m³/h) for your grow space.',
      width: 'Width',
      depth: 'Depth',
      height: 'Height',
      lightWattage: 'Light Wattage',
      lightWattageTooltip: 'The heat from your light is a major factor in ventilation needs.',
      carbonFilter: 'Using a Carbon Filter?',
      carbonFilterTooltip: 'Carbon filters restrict airflow, requiring a more powerful fan (approx. +35%).',
      result: 'Recommended Fan Power',
    },
    light: {
      title: 'Light Calculator',
      description: 'Estimate the required LED wattage for your grow area based on the growth stage.',
      width: 'Area Width',
      depth: 'Area Depth',
      stage: 'Growth Stage',
      result: 'Recommended LED Wattage',
      ppfdTooltip: 'PPFD (Photosynthetic Photon Flux Density) is the amount of light that actually reaches your plants.',
      dliTooltip: 'DLI (Daily Light Integral) is the total amount of light your plants receive per day.',
    },
    cost: {
      title: 'Electricity Cost Calculator',
      description: 'Estimate the running costs of your equipment.',
      lightPower: 'Light Power',
      lightHours: 'Light Hours',
      fanPower: 'Fan Power',
      fanHours: 'Fan Hours',
      otherPower: 'Other Equipment',
      price: 'Price per kWh',
      daily: 'Daily Cost',
      weekly: 'Weekly Cost',
      monthly: 'Monthly Cost',
      cycle: '90-Day Cycle',
      cycleSub: '(approx.)',
    },
    nutrients: {
      title: 'Nutrient Mix Calculator',
      description: 'Calculate the amount of each nutrient component for your reservoir size.',
      reservoir: 'Reservoir Size',
      component: 'Component',
      dose: 'Dose',
      totalFor: 'Total for',
      addComponent: 'Add Component',
    },
    converter: {
      title: 'EC / PPM Converter',
      description: 'Convert between Electrical Conductivity (EC) and Parts Per Million (PPM) using different scales.',
      resultInfo: 'Values are rounded for simplicity.',
    },
    yield: {
      title: 'Yield Estimator',
      description: 'Get a rough estimate of your potential yield based on light wattage and efficiency.',
      lightWattage: 'Light Wattage',
      efficiency: 'Efficiency (g/W)',
      efficiencyTooltip: 'Beginner: 0.8-1.0, Advanced: 1.0-1.5, Expert: 1.5+',
      result: 'Estimated Yield',
      range: 'Range: {{low}}g - {{high}}g',
      levels: {
        '0': 'Beginner',
        '1': 'Advanced',
        '2': 'Expert'
      },
      techniques: {
        '0': 'No Training',
        '1': 'LST (Low-Stress Training)',
        '2': 'Topping / Main-Lining',
        '3': 'SCROG (Screen of Green)'
      },
    }
  },
  growShops: {
    region: {
      europe: 'Europe',
      usa: 'USA',
    },
    selectShopTitle: 'Select a Shop',
    selectShopSubtitle: 'Choose a recommended grow shop from the list to see more details.',
    strengths: 'Strengths',
    shipping: 'Shipping',
    paymentMethods: 'Payment Methods',
    visitShop: 'Visit {{shopName}}',

    us: {
        shopKeys: ['growGeneration', 'hydrobuilder', 'amazonGrow']
    },
    european: {
        shopKeys: ['growmart', 'zamnesia', 'royalQueen']
    },
    shops: {
        growGeneration: { name: 'GrowGeneration', location: 'USA (nationwide)', rating: 4.6, url: 'https://growgeneration.com/', description: 'One of the largest hydroponic retail chains in the US.', strengths: ['Physical stores', 'Commercial solutions', 'Large inventory'], shipping: 'USA only', paymentMethods: ['credit_card', 'paypal'] },
        hydrobuilder: { name: 'Hydrobuilder', location: 'USA', rating: 4.7, url: 'https://hydrobuilder.com/', description: 'Large online retailer with a wide selection.', strengths: ['Complete grow kits', 'Good prices', 'US-based customer service'], shipping: 'USA only', paymentMethods: ['credit_card', 'paypal', 'crypto'] },
        amazonGrow: { name: 'Amazon', location: 'Online', rating: 4.2, url: 'https://www.amazon.com/', description: 'Offers a selection of basic equipment for beginners.', strengths: ['Fast shipping (Prime)', 'Easy returns', 'Wide selection of beginner products'], shipping: 'Worldwide', paymentMethods: ['credit_card', 'paypal'] },
        growmart: { name: 'Growmart', location: 'Germany', rating: 4.8, url: 'https://www.growmart.de/', description: 'Leading German online shop with a large selection.', strengths: ['Large selection', 'Fast shipping', 'Good customer service'], shipping: 'EU-wide', paymentMethods: ['credit_card', 'paypal', 'bank_transfer'] },
        zamnesia: { name: 'Zamnesia', location: 'Netherlands', rating: 4.7, url: 'https://www.zamnesia.com/', description: 'Well-known Dutch head and grow shop.', strengths: ['Seeds & equipment', 'Discreet shipping', 'Large community'], shipping: 'Worldwide', paymentMethods: ['credit_card', 'paypal', 'bank_transfer', 'crypto'] },
        royalQueen: { name: 'Royal Queen Seeds', location: 'Spain', rating: 4.9, url: 'https://www.royalqueenseeds.com/', description: 'Seed bank that also offers high-quality equipment.', strengths: ['Award-winning genetics', 'High-quality accessories', 'Guides'], shipping: 'EU-wide', paymentMethods: ['credit_card', 'bank_transfer', 'crypto'] }
    }
  }
};
