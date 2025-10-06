export const common = {
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    delete: 'Delete',
    edit: 'Edit',
    export: 'Export',
    downloadAgain: 'Download Again',
    all: 'All',
    none: 'None',
    name: 'Name',
    type: 'Type',
    typeDetails: 'Type Details',
    genetics: 'Genetics',
    description: 'Description',
    actions: 'Actions',
    page: 'Page',
    generated: 'Generated',
    loadMore: 'Load More... {{count}} of {{total}}',
    regenerate: 'Regenerate',
    confirm: 'Confirm',
    exportConfirm: 'Are you sure you want to export this data?',
    removeImage: 'Remove Image',
    unchanged: 'Unchanged',
    noDataToExport: 'No data to export.',
    successfullyExported_one: 'Successfully exported 1 item as {{format}}.',
    successfullyExported_other: 'Successfully exported {{count}} items as {{format}}.',
    installPwa: 'Install App',
    installPwaSuccess: 'App installed successfully!',
    installPwaDismissed: 'Installation dismissed.',
    offlineWarning: 'You are currently offline. Some features may be unavailable.',
    preparingGuide: 'Preparing your guide...',
    error: 'Error',
    deepDive: 'Deep Dive',
    saveToJournal: 'Save to Journal',
    editor: {
        bold: 'Bold',
        italic: 'Italic',
        list: 'List',
    },
    notes: 'Notes',
    units: {
        weeks: 'weeks',
        days: 'days',
        h_day: 'h/day',
        price_kwh: '€/kWh',
        currency_eur: '€',
        g_w: 'g/W',
        watt: 'Wattage',
    },
    aromas: {},
    terpenes: {},
    simulationErrors: {
        invalidSetup: 'Invalid grow setup configuration. Please try again.',
        invalidActionData: 'Invalid data provided for action: {{action}}.',
    },
    metadataDescription: 'Your AI-powered digital companion for the entire cannabis cultivation cycle. Track plants, explore over 500 strains, get AI equipment advice, and master your grow with an interactive guide.',
};

export const nav = {
    strains: 'Strains',
    plants: 'Plants',
    equipment: 'Equipment',
    knowledge: 'Knowledge',
    settings: 'Settings',
    help: 'Help',
};

export const plantStages = {
    SEED: 'Seed',
    GERMINATION: 'Germination',
    SEEDLING: 'Seedling',
    VEGETATIVE: 'Vegetative',
    FLOWERING: 'Flowering',
    HARVEST: 'Harvest',
    DRYING: 'Drying',
    CURING: 'Curing',
    FINISHED: 'Finished',
};

export const problemMessages = {
    nutrientDeficiency: { message: 'Nutrient Deficiency Detected' },
    overwatering: { message: 'Overwatering Detected' },
    underwatering: { message: 'Underwatering Detected' },
    pestInfestation: { message: 'Pest Infestation Detected' },
};

export const ai = {
    error: {
        generic: 'An AI error occurred. Please try again.',
        equipment: 'Failed to generate equipment recommendation.',
        diagnostics: 'Failed to generate plant diagnosis.',
        tips: 'Failed to generate strain tips.',
        deepDive: 'Failed to generate deep dive guide.',
        unknown: 'An unknown AI error occurred.'
    },
    advisor: 'AI Advisor',
    getAdvice: 'Get Advice',
    diagnostics: 'Get Diagnosis',
    generating: 'AI is thinking...',
    disclaimer: 'AI-generated content. Always verify critical information.',
    prompts: {
        equipmentSystemInstruction: 'You are an expert cannabis grow consultant. The user will provide their constraints (area, budget, style) and you will provide a complete equipment list in JSON format. Provide specific, real-world product names and an estimated price in Euros. Your rationale should be concise and helpful for a beginner.',
        equipmentRequest: 'I want to set up a grow for {{plantCount}} plants in a {{tentSize}} tent with a {{budget}} budget.',
        advisor: 'You are an expert cannabis grow advisor. Based on the following plant data, provide concise, actionable advice for the next 24-48 hours. Format your response as a simple markdown.\n\n{{plant}}',
        proactiveDiagnosis: 'You are an expert plant pathologist specializing in cannabis. Analyze the following complete plant data report. Identify any potential underlying issues or risks that may not be immediately obvious. Provide a concise report with a title and content in markdown format, outlining your findings and preventative recommendations.\n\n{{plant}}',
        mentor: {
            main: 'Context: \n{{context}}\n\nUser Query: "{{query}}"',
            systemInstruction: 'You are a friendly and knowledgeable cannabis cultivation mentor. Your name is Kai. You provide helpful, concise, and encouraging advice. Respond in JSON format only. The response must include a "title", a "content" field (markdown formatted), and an optional "uiHighlights" array of objects with "elementId" (string) and optional "plantId" (string). Highlight UI elements relevant to your answer (e.g., vpd-gauge, ph-vital).',
        },
        strainTips: 'Provide structured, concise growing tips for the strain: {{strain}}. The user\'s focus is on "{{focus}}", their experience level is "{{experienceLevel}}", and they are asking about the "{{stage}}" stage. Respond in JSON format only with keys: "nutrientTip", "trainingTip", "environmentalTip", "proTip".',
        strainImage: 'Generate a fantastical, artistic representation of the cannabis strain "{{strainName}}". This is a {{type}} strain, renowned for its {{aromas}} aromas. Its effect is often described as {{description_snippet}}. The plant is known for its {{agronomic_yield}} yield and grows {{agronomic_height}}. Create a visually stunning and imaginative artwork that captures the *essence* of these traits in a subtle, artistic way. For example, a \'High\' yield could be represented by a sense of abundance, and a \'Tall\' height by vertical elements in the composition. Do not depict these literally. Do not create a photorealistic image of a cannabis bud. Instead, envision an abstract concept or fantasy landscape inspired by its characteristics. The style should be vibrant, memorable, and suitable for a premium guide.',
        deepDive: 'Generate a deep dive guide on the topic of "{{topic}}" in the context of the following plant: {{plant}}. Respond in JSON format with keys: "introduction" (string), "stepByStep" (array of strings), "prosAndCons" ({pros: string[], cons: string[]}), and "proTip" (string).',
    },
    loading: {
        equipment: {
            '1': 'Analyzing your space and budget...',
            '2': 'Selecting the optimal lighting solution...',
            '3': 'Calculating ventilation requirements for a healthy environment...',
            '4': 'Pairing the right nutrients and medium...',
            '5': 'Assembling your custom equipment list...'
        },
        diagnostics: {
            '1': 'Analyzing image for discoloration and texture...',
            '2': 'Cross-referencing with plant vitals...',
            '3': 'Consulting database for potential issues...',
            '4': 'Formulating immediate actions and long-term solutions...'
        },
        advisor: {
            '1': 'Reviewing {{plantName}}\'s latest vitals...',
            '2': 'Checking current growth stage and age...',
            '3': 'Formulating tailored advice for the next 48 hours...'
        },
        proactiveDiagnosis: {
            '1': 'Analyzing historical data for {{plantName}}...',
            '2': 'Identifying trends in pH and EC...',
            '3': 'Scanning for early signs of environmental stress...',
            '4': 'Compiling preventative care recommendations...'
        },
        growTips: {
            '1': 'Analyzing the genetic traits of {{strainName}}...',
            '2': 'Tailoring tips for a grower with {{experienceLevel}} experience...',
            '3': 'Focusing recommendations on {{focus}} for the {{stage}} stage...',
            '4': 'Crafting actionable, structured advice...'
        },
        deepDive: {
            '1': 'Researching "{{topic}}"...',
            '2': 'Applying concepts to {{plantName}}\'s current state...',
            '3': 'Structuring a step-by-step guide...',
            '4': 'Compiling pros, cons, and a special pro-tip...'
        }
    }
};