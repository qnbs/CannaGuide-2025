
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
  }
};