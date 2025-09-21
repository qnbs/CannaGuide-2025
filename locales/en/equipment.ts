export const equipmentView = {
  title: 'Equipment',
  tabs: {
    configurator: 'Configurator',
    calculators: 'Calculators',
    setups: 'My Setups',
    growShops: 'Grow Shops',
  },
  configurator: {
    title: 'Setup Configurator',
    subtitleNew: 'Select the number of plants and your preferred configuration to get a tailored equipment list.',
    step1TitleNew: 'How many plants do you want to grow?',
    step2TitleNew: 'Choose your configuration',
    plantCount: '{count} Plant(s)',
    details: {
      zelt: 'Tent',
      beleuchtung: 'Lighting',
      abluft: 'Exhaust',
      toepfe: 'Pots',
      medium: 'Medium',
    },
    setups: {
      '1': {
        standard: {
          title: 'Standard Setup (Value)',
          description: 'A balanced configuration for beginners aiming for good results without high initial investment.',
          prompt: 'Create a beginner-friendly grow setup recommendation for 1 plant in a 60x60x180cm grow tent. The lighting should be a 100-120W LED. The exhaust should be an AC fan with ~145-180 m³/h. The pot should be a 15-19L fabric pot. The medium is Light-Mix soil. The budget is low and value-oriented.'
        },
        medium: {
          title: 'Medium Setup (Balanced)',
          description: 'An upgrade to the standard setup with better lighting and more space for higher quality and yield.',
          prompt: 'Create a grow setup recommendation for 1 plant in an 80x80x180cm grow tent. The lighting should be a 150W LED. The exhaust should be an AC fan with ~220 m³/h. The pot should be a 19L fabric pot. The medium is All-Mix soil. The budget is medium, with a focus on a good balance between cost and quality.'
        },
        premium: {
          title: 'Premium Setup (Max Control)',
          description: 'High-end components for growers seeking full control and maximum quality and yield.',
          prompt: 'Create a high-end grow setup recommendation for 1 plant in a premium 60x60x180cm grow tent. The lighting should be a 150W high-end LED. The exhaust should be an EC fan with a controller and ~180-250 m³/h. The pot should be a 19-25L fabric pot. The medium is a Coco/Perlite mix. The budget is high.'
        }
      },
      '2': {
        standard: {
          title: 'Standard Setup (Value)',
          description: 'A solid configuration for 2 plants, optimized for good yields and ease of use.',
          prompt: 'Create a grow setup recommendation for 2 plants in an 80x80 or 120x60cm grow tent. The lighting should be a 200-240W LED. The exhaust should be an AC fan with ~220-280 m³/h. Pots: 2x 15-19L fabric pots. Medium: All-Mix soil. The budget is low and value-oriented.'
        },
        medium: {
            title: 'Medium Setup (Balanced)',
            description: 'More space and a stronger light for two plants to significantly increase yield potential.',
            prompt: 'Create a grow setup recommendation for 2 plants in a 100x100x200cm grow tent. The lighting should be a 280-300W LED. The exhaust should be an AC fan with ~360 m³/h. Pots: 2x 25L fabric pots. The medium is Coco/Perlite mix. The budget is medium, with a focus on high yield.'
        },
        premium: {
          title: 'Premium Setup (Max Control)',
          description: 'Advanced setup for maximum yields and full environmental control for 2 plants.',
          prompt: 'Create a high-end grow setup recommendation for 2 plants in a premium 80x80 or 120x60cm grow tent. The lighting should be a 250-300W high-end LED. The exhaust should be an EC fan with a controller and ~280-360 m³/h. Pots: 2x 19-25L fabric pots. Medium: Coco/Perlite mix or a hydro system. The budget is high.'
        }
      },
      '3': {
        standard: {
          title: 'Standard Setup (Value)',
          description: 'An efficient configuration for growing 3 plants with a focus on high total yield.',
          prompt: 'Create a grow setup recommendation for 3 plants in a 100x100x200cm grow tent. The lighting should be a 300-320W LED. The exhaust should be an AC fan with ~360 m³/h. Pots: 3x 19-25L fabric pots. Medium: All-Mix or Coco. The budget is low and value-oriented.'
        },
        medium: {
            title: 'Medium Setup (Balanced)',
            description: 'A larger tent and more powerful lighting to unlock the full potential of three plants.',
            prompt: 'Create a grow setup recommendation for 3 plants in a 120x120x200cm grow tent. The lighting should be a 400W LED. The exhaust should be an EC fan with ~400 m³/h. Pots: 3x 25L fabric pots. Medium: Coco/Perlite. The budget is medium and focused on quality and control.'
        },
        premium: {
          title: 'Premium Setup (Max Control)',
          description: 'A generous high-end setup for 3 plants, designed for maximum quality, yield, and automation.',
          prompt: 'Create a high-end grow setup recommendation for 3 plants in a premium 120x120x220cm grow tent. The lighting should be a 450-500W multi-bar LED. The exhaust should be an EC fan with a controller, silencer, and ~400-500 m³/h. Pots: 3x 30-50L fabric pots. Medium: Living Soil or Coco. The budget is high.'
        }
      }
    },
    generate: 'Generate Setup',
    resultsTitle: 'Your Personal Setup Recommendation',
    resultsSubtitle: 'For your {area}cm space, with a {budget} budget and "{style}" style, this is an AI-generated configuration.',
    costBreakdown: 'Cost Breakdown',
    total: 'Total',
    startOver: 'Start Over',
    tryAgain: 'Try Again',
    saveSetup: 'Save Setup',
    setupNamePrompt: 'What would you like to name this setup?',
    setupSaveConfirm: 'Are you sure you want to save the setup as "{name}"?',
    setupSaveSuccess: 'Setup "{name}" saved successfully!',
    setupSaveError: 'Error saving setup.',
    error: 'The AI could not generate a recommendation. Please try again later.',
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
    budgets: {
      low: 'low',
      medium: 'medium',
      high: 'high',
    },
    styles: {
      beginner: 'Beginner',
      balanced: 'Balanced',
      yield: 'Yield',
    },
    setupNameBudgets: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
    },
  },
  calculators: {
    ventilation: {
      title: 'Fan Calculator',
      description: 'Calculate the required fan power (m³/h) for your grow tent, accounting for light heat and filters.',
      width: 'Width',
      depth: 'Depth',
      height: 'Height',
      result: 'Recommended exhaust fan power',
      lightWattage: 'Light Wattage',
      lightWattageTooltip: 'High-power lights generate more heat and require stronger ventilation.',
      carbonFilter: 'Carbon Filter?',
      carbonFilterTooltip: 'A carbon filter adds air resistance and requires a more powerful fan.',
    },
    light: {
      title: 'Light Calculator',
      description: 'Get a wattage recommendation based on PPFD and DLI values for the specific growth stage.',
      width: 'Width',
      depth: 'Depth',
      result: 'Recommended LED power',
      stage: 'Growth Stage',
      ppfdTooltip: 'PPFD (Photosynthetic Photon Flux Density) measures the amount of usable light your plants receive. Different stages have different optimal values.',
      dliTooltip: 'DLI (Daily Light Integral) is the total amount of usable light a plant receives over a 24-hour period.',
    },
    cost: {
      title: 'Electrical Cost Calculator',
      description: 'Estimate the electricity costs of your grow setup over various periods.',
      lightPower: 'Light Power',
      lightHours: 'Light Hours',
      fanPower: 'Fan Power',
      fanHours: 'Fan Hours',
      otherPower: 'Other Power',
      price: 'Price per kWh',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      cycle: 'Per Cycle',
      cycleSub: '(~90 days)'
    },
    nutrients: {
      title: 'Nutrient Mixer',
      description: 'Calculate the right amount of fertilizer for your watering can for multiple components.',
      waterAmount: 'Water Amount',
      dose: 'Dose',
      result: 'Required fertilizer',
      reservoir: 'Reservoir Size',
      component: 'Component',
      totalFor: 'Total for Comp.',
    },
    yield: {
      title: 'Yield Estimator',
      description: 'Get a more accurate estimate of your potential harvest yield (g) based on multiple factors.',
      area: 'Area',
      wattage: 'Light Wattage',
      level: 'Experience Level',
      levels: {
          beginner: 'Beginner',
          advanced: 'Advanced',
          expert: 'Expert'
      },
      result: 'Estimated Yield',
      training: 'Training Technique',
      trainings: {
        none: 'None',
        lst: 'LST',
        scrog: 'Topping/SCROG',
      },
      efficiency: 'Efficiency'
    },
    converter: {
      title: 'PPM / EC Converter',
      description: 'Convert between EC (Electrical Conductivity) and PPM (Parts Per Million) scales.',
      resultInfo: 'Values are converted automatically as you type in any field.',
    },
    calculate: 'Calculate',
    yes: 'Yes',
    no: 'No',
  },
  savedSetups: {
    title: 'My Saved Setups',
    noSetups: {
      title: 'No Saved Setups',
      subtitle: 'When you save a recommendation from the configurator, it will appear here.',
    },
    inspect: 'Inspect',
    deleteConfirm: 'Are you sure you want to permanently delete the setup "{name}"?',
    deleteSuccess: 'Setup "{name}" has been deleted.',
    updateSuccess: 'Setup "{name}" has been updated.',
    updateError: 'Error updating setup.',
    exportConfirm: 'Are you sure you want to export the setup "{name}" as {format}?',
    exportSuccess: 'Setup "{name}" exported successfully.',
    modal: {
      title: 'Setup Details',
      editMode: 'Edit Mode',
      saveChanges: 'Save Changes',
      item: 'Component',
      price: 'Price',
      rationale: 'Rationale',
    },
    pdfReport: {
      setup: 'Setup Report',
      createdAt: 'Created at',
      source: 'Source',
      budget: 'Budget',
      total: 'Total',
      product: 'Product',
      rationale: 'Rationale',
      price: 'Price (€)',
      item: 'Component',
    }
  },
  growShops: {
    title: 'Grow Shops',
    intro: 'Based on user reviews, forum recommendations, and the general reputation within the grower community, certain online shops have proven to be particularly reputable, reliable, and comprehensive in their product range over the years. Here is a research of the best and most convenient online shops for grow equipment, divided by Europe and the USA.',
    european: {
        title: 'European Online Shops (Focus on DACH Region & EU Shipping)',
        description: 'These shops are mostly based in Germany, Austria, or the Netherlands and are known for fast, discreet shipping within the EU. This means no customs clearance is required for deliveries within the European Union.',
        shopKeys: ['growmart', 'growshop24', 'growland', 'zamnesia'],
    },
    us: {
        title: 'US Online Shops (North America)',
        description: 'These shops are the first port of call for growers in the US and Canada. They are characterized by a huge product range, often geared towards the commercial market, but also serving home growers. Shipping to Europe is often possible but usually not practical due to high shipping costs, customs fees, and different mains voltages (110V) for electronic items.',
        shopKeys: ['acInfinity', 'growGen', 'growersHouse', 'htgSupply'],
    },
    importantNote: {
        title: 'Important Note',
        content: 'Before placing a large order, it is always advisable to compare prices between the top shops and to briefly look for current user experiences or reviews.'
    },
    location: 'Location',
    strengths: 'Strengths',
    idealFor: 'Ideal for',
    shipping: 'Shipping',
    paymentMethods: 'Payment Methods',
    sortByName: 'Sort by Name',
    sortByRating: 'Sort by Rating',
    noResults: 'No shops found for the current selection.',
    region: {
      europe: 'Europe',
      usa: 'USA'
    },
    shops: {
        growmart: {
            name: 'Growmart',
            url: 'https://www.growmart.de/',
            location: 'Germany (Hamburg)',
            description: 'One of the largest and most well-known online grow shops in Europe. They are considered extremely reliable, have excellent customer service, and a huge assortment ranging from beginner sets to professional equipment. Their complete grow box kits are particularly popular and well-configured.',
            strengths: [
                'Very large selection of top brands (HOMEbox, SANlight, Lumatek, AC Infinity, BioBizz, etc.).',
                'Fast and very discreet shipping with DHL.',
                'Good and honest product descriptions and often helpful blog articles.',
                'Very good customer service accessibility.'
            ],
            idealFor: 'Beginners to professionals looking for an "all-in-one" solution.',
            rating: 4.9,
            shipping: 'Ships EU-wide, very discreet packaging',
            paymentMethods: ['credit_card', 'bank_transfer', 'crypto'],
            logo: 'growmart'
        },
        growshop24: {
            name: 'grow-shop24.de',
            url: 'https://www.grow-shop24.de/',
            location: 'Germany & Austria',
            description: 'Another very established shop with an extremely comprehensive range. They are known for competitive prices and often carry niche products that are harder to find elsewhere. With a separate domain for Austria, they serve this market particularly well.',
            strengths: [
                'Comprehensive range in all categories (lighting, climate, fertilizers).',
                'Carries all common brands and often cheaper alternatives.',
                'Frequent good offers and discount campaigns.',
                'Reliable shipping and good reviews (e.g., on Trusted Shops).'
            ],
            idealFor: 'Price-conscious buyers and growers looking for specific products.',
            rating: 4.7,
            shipping: 'Ships EU-wide',
            paymentMethods: ['credit_card', 'bank_transfer'],
            logo: 'growshop24'
        },
        growland: {
            name: 'Growland',
            url: 'https://www.growland.net/',
            location: 'Germany (Berlin)',
            description: 'Growland has also made a name for itself as a reputable and well-stocked dealer. They convince with many years of experience and a professional appearance. The range is carefully selected and covers all needs.',
            strengths: [
                'Clearly arranged online shop with a good filter function.',
                'Focus on high-quality brands.',
                'Also offers very well-coordinated complete sets.',
                'Good customer support and fast delivery.'
            ],
            idealFor: 'Growers who value a curated selection and a smooth ordering process.',
            rating: 4.8,
            shipping: 'Ships EU-wide',
            paymentMethods: ['credit_card', 'bank_transfer', 'crypto'],
            logo: 'growland'
        },
        zamnesia: {
            name: 'Zamnesia',
            url: 'https://www.zamnesia.com/5-grow-shop',
            location: 'Netherlands',
            description: 'Zamnesia is much more than just a seed shop. Their "Growshop" section is extremely comprehensive and offers everything you need for cultivation. As one of the largest players in Europe, their logistics and reliability are at a very high level.',
            strengths: [
                'Gigantic selection that also includes headshop and lifestyle products.',
                'Very fast delivery from the Netherlands to the entire EU.',
                'Excellent reputation and a huge community with many reviews.',
                'Ability to combine seeds and equipment in a single order.'
            ],
            idealFor: 'Growers who are also interested in a huge selection of genetics and want to source everything from one place.',
            rating: 4.9,
            shipping: 'Ships worldwide, very fast within the EU',
            paymentMethods: ['credit_card', 'bank_transfer', 'crypto'],
            logo: 'zamnesia'
        },
        acInfinity: {
            name: 'AC Infinity',
            url: 'https://acinfinity.com/',
            location: 'USA (California)',
            description: 'AC Infinity has evolved from a ventilation technology manufacturer to one of the most popular one-stop shops. They sell their own perfectly coordinated ecosystem of tents, fans, lights, and controllers. Their products are considered extremely innovative, high-quality, and user-friendly.',
            strengths: [
                'Perfectly integrated system (controllers manage fans, lights, etc.).',
                'Very high product quality and thoughtful design.',
                'Excellent customer service and a strong community.',
                'Purchase directly from the manufacturer.'
            ],
            idealFor: 'Tech-savvy growers looking for a smart, automated, and visually appealing setup.',
            rating: 4.9,
            shipping: 'Ships mainly within North America',
            paymentMethods: ['credit_card', 'paypal'],
            logo: 'acInfinity'
        },
        growGen: {
            name: 'GrowGeneration (GrowGen)',
            url: 'https://growgeneration.com/',
            location: 'USA (nationwide chain)',
            description: 'GrowGen is the largest chain of hydroponic specialty stores in the US and also operates a massive online shop. They are publicly traded and serve both small home growers and huge commercial facilities. Their range is correspondingly vast.',
            strengths: [
                'Enormous product variety from virtually every conceivable brand.',
                'Expertise in commercial cultivation, which is reflected in the product selection.',
                'Regular sales and professional advice.'
            ],
            idealFor: 'Growers of all sizes looking for the widest possible selection.',
            rating: 4.6,
            shipping: 'Ships within the USA',
            paymentMethods: ['credit_card', 'paypal'],
            logo: 'growGen'
        },
        growersHouse: {
            name: 'GrowersHouse',
            url: 'https://growershouse.com/',
            location: 'USA (Arizona)',
            description: 'Another very large and reputable online retailer known for its wide range and expertise. They offer detailed product comparisons, video reviews, and strong customer support that also helps with planning larger projects.',
            strengths: [
                'Large selection of high-end brands (e.g., HLG, Gavita).',
                'Very informative website with many resources for growers.',
                'Good reputation for reliability and customer service.'
            ],
            idealFor: 'Growers who appreciate detailed information and comparisons before buying.',
            rating: 4.7,
            shipping: 'Ships worldwide',
            paymentMethods: ['credit_card', 'crypto'],
            logo: 'growersHouse'
        },
        htgSupply: {
            name: 'HTG Supply',
            url: 'https://www.htgsupply.com/',
            location: 'USA (nationwide chain)',
            description: 'HTG Supply is one of the oldest and most established hydroponics shops in the US. They have both a strong online presence and physical stores. Their slogan "one of the fastest shippers in the industry" is often confirmed by customers.',
            strengths: [
                'Wide range covering all the basics.',
                'Known for very fast shipping.',
                'Often competitive prices and private labels.'
            ],
            idealFor: 'Growers who need fast and straightforward delivery.',
            rating: 4.5,
            shipping: 'Ships within the USA',
            paymentMethods: ['credit_card', 'paypal'],
            logo: 'htgSupply'
        }
    }
  },
};
