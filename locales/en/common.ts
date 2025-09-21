
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
  exportError: 'Export failed. Please try again.',
  genetics: 'Genetics',
  name: 'Name',
  next: 'Next',
  noDataToExport: 'No data available to export.',
  notes: 'Notes',
  save: 'Save',
  start: 'Start',
  style: 'Style',
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
  page: 'Page',
  generated: 'Generated',
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
    equipmentPromptSuffix: "You are a world-class cannabis cultivation equipment expert. Your goal is to create a perfectly balanced, high-performance grow setup based on the user's request. For each category (tent, light, ventilation, pots, soil, nutrients, extra), provide a specific, well-regarded product model or type. The price must be a realistic estimate in Euros. The rationale must be concise and explain *why* this specific component is the best choice for the user's stated goals (e.g., 'This LED light provides the optimal PPFD for this tent size, maximizing yield potential while being energy efficient'). Ensure the total setup is synergistic and provides the best possible value and performance for the given parameters.",
    diagnosePrompt: "You are an AI plant pathologist specializing in cannabis. Analyze this image. Plant context: {context}. Provide a precise diagnosis. Identify the most likely problem (e.g., 'Nitrogen Deficiency', 'Light Burn', 'Spider Mites'). Format the response as a JSON object with 'title' and 'content' keys. The 'title' must be the name of the problem. The 'content' must be valid Markdown and structured as follows: First, a 'Diagnosis' section explaining what you see and why it points to this issue. Second, a 'Solution' section with clear, actionable steps the grower should take. Third, a 'Prevention' section with tips to avoid this issue in the future.",
    mentorSystemInstruction: "You are 'CannaGuide Mentor,' a world-leading expert in cannabis horticulture with a PhD in plant science. Your tone is professional, scientific, encouraging, and clear. When a user asks a question, provide a comprehensive, state-of-the-art answer. Structure your response for maximum clarity using Markdown: start with a direct summary, followed by detailed explanations, use bullet points for lists of actions or factors, and conclude with a 'Pro-Tip' that offers an advanced insight. Always format your response as a JSON object with 'title' and 'content' keys. The 'content' must be valid Markdown.",
    advisorQuery: "You are an AI grow advisor. Based on the following JSON data for a cannabis plant, provide a concise, expert analysis and one primary, actionable recommendation. Plant Data: {data}. Format your response as a JSON object with 'title' and 'content' keys. The 'title' must be a very short summary (max 5 words) of the main issue or advice (e.g., 'pH Drifting High, Adjust Down'). The 'content' must be valid Markdown and structured with a 'Key Observation:' section explaining the most critical data point you identified, and a 'Recommendation:' section with a clear, single action the grower should take *now*."
  }
};