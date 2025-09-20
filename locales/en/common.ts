
export const common = {
  add: 'Add',
  all: 'All',
  apply: 'Apply',
  back: 'Back',
  cancel: 'Cancel',
  close: 'Close',
  confirm: 'Confirm',
  delete: 'Delete',
  details: 'Details',
  downloadAgain: 'Download Again',
  edit: 'Edit',
  export: 'Export',
  genetics: 'Genetics',
  name: 'Name',
  next: 'Next',
  noDataToExport: 'No data available to export.',
  notes: 'Notes',
  save: 'Save',
  start: 'Start',
  successfullyExported: 'Successfully exported {count} items as {format}.',
  type: 'Type',
  typeDetails: 'Type Details',
  why: 'Why?',
  days: 'Days',
  description: 'Description',
  actions: 'Actions',
  error: 'Error',
  offlineWarning: 'You are currently offline. Functionality may be limited.',
  installPwa: 'Install App',
  installPwaDescription: 'Install this application on your device for quick access and an offline experience.',
  installPwaSuccess: 'App installed successfully!',
  installPwaDismissed: 'Installation dismissed.',
  removeImage: 'Remove image',
  deleteResponse: 'Delete response',
  deleteSetup: 'Delete setup',
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
    overwatering: { message: 'Overwatering detected', solution: 'Water less frequently and ensure the pot has good drainage.' },
    underwatering: { message: 'Underwatering detected', solution: 'Water the plant thoroughly until water runs out the bottom of the pot.' },
    nutrientBurn: { message: 'Nutrient Burn', solution: 'Reduce EC level and flush with pH-neutral water.' },
    nutrientDeficiency: { message: 'Nutrient Deficiency', solution: 'Increase feeding according to schedule and check pH.' },
    phTooLow: { message: 'pH Too Low', solution: 'Adjust water with pH-Up to bring the value into the ideal range.' },
    phTooHigh: { message: 'pH Too High', solution: 'Adjust water with pH-Down to bring the value into the ideal range.' },
    tempTooHigh: { message: 'Temperature Too High', solution: 'Increase exhaust fan speed, provide more air circulation, or dim/raise the light.' },
    tempTooLow: { message: 'Temperature Too Low', solution: 'Use a heating mat or increase room temperature.' },
    humidityTooHigh: { message: 'Humidity Too High', solution: 'Increase exhaust fan speed and use a dehumidifier if necessary.' },
    humidityTooLow: { message: 'Humidity Too Low', solution: 'Use a humidifier or hang wet towels.' },
};

export const ai = {
  advisor: 'AI Advisor',
  mentor: 'AI Mentor',
  diagnostics: 'AI Diagnostics',
  getAdvice: 'Request AI Analysis',
  generating: 'Generating response...',
  disclaimer: 'AI-generated content may be inaccurate. Always verify important information.',
  loading: {
    equipment: {
      analyzing: 'Analyzing requirements...',
      custom: 'Configuring for setup: {config}',
      selecting: 'Selecting suitable components...',
      finalizing: 'Finalizing recommendation...'
    },
    diagnostics: {
      receiving: 'Receiving image data...',
      analyzing: 'Analyzing image for anomalies...',
      identifying: 'Identifying potential issues...',
      formulating: 'Formulating diagnosis & solution...'
    },
    mentor: {
      processing: 'Processing query: "{query}"',
      searching: 'Searching knowledge base...',
      compiling: 'Compiling a detailed response...'
    },
    advisor: {
      analyzing: 'Analyzing data for plant in {stage} stage...',
      vitals: 'Checking vitals (pH: {ph}, EC: {ec})...',
      problems: 'Assessing {count} active problems...',
      formulating: 'Formulating a recommendation...'
    }
  },
  error: {
    parsing: 'Failed to understand the AI\'s response. It might be malformed.',
    apiKey: 'The AI service is not configured correctly (Invalid API Key).',
    api: 'The AI service returned an error. Please try again later.',
    network: 'Could not connect to the AI service. Please check your network connection.',
    unknown: 'An unknown error occurred with the AI service.'
  },
  gemini: {
    equipmentPromptSuffix: 'Provide specific product types (e.g., \'Mars Hydro TS 1000\' or \'Fabric Pot 5 Gallon\') but avoid brand favoritism unless a specific model is iconic for that category. Prices should be realistic estimates in Euros. The rationale should be concise and explain why the item fits the user\'s needs. Categories to include are: tent, light, ventilation, pots, soil, nutrients, extra.',
    diagnosePrompt: 'Analyze this image of a cannabis plant leaf/plant. The user is looking for a potential problem diagnosis. Plant context: {context}. Provide a concise diagnosis. Identify the most likely problem (e.g., \'Nitrogen Deficiency\', \'Light Burn\', \'Spider Mites\'). Format the response as a JSON object with "title" and "content" keys. The "title" should be the name of the problem. The "content" should be a 2-3 sentence explanation of the problem and a suggested solution.',
    mentorSystemInstruction: 'You are an expert cannabis cultivation mentor. Your tone is helpful, encouraging, and scientific. Provide detailed, actionable advice. Format your response as a JSON object with \'title\' and \'content\' keys. The \'title\' should be a concise summary of the answer. The \'content\' should be the detailed explanation, using markdown for formatting (like lists or bold text).',
    advisorQuery: 'Based on the following data for a cannabis plant, provide a concise analysis and one key recommendation for the grower. Plant Data: {data}. Format the response as a JSON object with "title" and "content" keys. The "title" should be a very short summary of the advice (e.g., "Slightly high pH, suggest adjustment"). The "content" should be a 2-4 sentence explanation of your observation and a clear, actionable recommendation.'
  }
};