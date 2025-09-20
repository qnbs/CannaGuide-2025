export const equipmentView = {
  title: 'Equipment',
  tabs: {
    configurator: 'Configurator',
    calculators: 'Calculators',
    setups: 'My Setups',
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
          title: 'Standard Setup (Value for Money)',
          description: 'A balanced configuration for beginners aiming for good results without high initial investment.',
          prompt: 'Create a beginner-friendly grow setup recommendation for 1 plant in a 60x60x180cm grow tent. The lighting should be a 100-120W LED. The exhaust should be an AC fan with ~145-180 m³/h. The pot should be a 15-19L fabric pot. The medium is Light-Mix soil. The budget is value-oriented.'
        },
        premium: {
          title: 'Premium Setup (Maximum Control)',
          description: 'High-end components for growers seeking full control and maximum quality and yield.',
          prompt: 'Create a high-end grow setup recommendation for 1 plant in a premium 60x60x180cm grow tent. The lighting should be a 150W high-end LED. The exhaust should be an EC fan with a controller and ~180-250 m³/h. The pot should be a 19-25L fabric pot. The medium is a Coco/Perlite mix. The budget is high.'
        }
      },
      '2': {
        standard: {
          title: 'Standard Setup (Value for Money)',
          description: 'A solid configuration for 2 plants, optimized for good yields and ease of use.',
          prompt: 'Create a grow setup recommendation for 2 plants in an 80x80 or 120x60cm grow tent. The lighting should be a 200-240W LED. The exhaust should be an AC fan with ~220-280 m³/h. Pots: 2x 15-19L fabric pots. Medium: All-Mix soil. The budget is value-oriented.'
        },
        premium: {
          title: 'Premium Setup (Maximum Control)',
          description: 'Advanced setup for maximum yields and full environmental control for 2 plants.',
          prompt: 'Create a high-end grow setup recommendation for 2 plants in a premium 80x80 or 120x60cm grow tent. The lighting should be a 250-300W high-end LED. The exhaust should be an EC fan with a controller and ~280-360 m³/h. Pots: 2x 19-25L fabric pots. Medium: Coco/Perlite mix or a hydro system. The budget is high.'
        }
      },
      '3': {
        standard: {
          title: 'Standard Setup (Value for Money)',
          description: 'An efficient configuration for growing 3 plants with a focus on high total yield.',
          prompt: 'Create a grow setup recommendation for 3 plants in a 100x100x200cm grow tent. The lighting should be a 300-320W LED. The exhaust should be an AC fan with ~360 m³/h. Pots: 3x 19-25L fabric pots. Medium: All-Mix or Coco. The budget is value-oriented.'
        },
        premium: {
          title: 'Premium Setup (Maximum Control)',
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
  }
};