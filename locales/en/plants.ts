export const plantsView = {
  emptySlot: {
    title: 'Empty Plant Slot',
    subtitle: 'Start a new grow',
    subtitleInline: 'or select a strain from the library.',
  },
  plantCard: {
    day: 'Day',
    stage: 'Stage',
  },
  vitals: {
    ph: 'pH',
    ec: 'EC',
    moisture: 'Moisture',
  },
  gardenVitals: {
    title: 'Garden Vitals',
    avgTemp: 'Avg Temp',
    avgHumidity: 'Avg RH',
  },
  summary: {
    gardenHealth: 'Garden Health',
    activeGrows: 'Active Grows',
    openTasks: 'Open Tasks',
    waterAll: 'Water All Plants',
  },
  tasks: {
    title: 'Tasks',
    none: 'No open tasks.',
    priority: 'Priority',
    priorities: {
        high: 'High',
        medium: 'Medium',
        low: 'Low'
    }
  },
  warnings: {
    title: 'Warnings',
    none: 'No active problems detected.',
  },
  detailedView: {
    tabs: {
      overview: 'Overview',
      journal: 'Journal',
      tasks: 'Tasks',
      photos: 'Photos',
      ai: 'AI Advisor',
      postHarvest: 'Post-Harvest'
    },
    tasksComplete: 'Complete',
    tasksNoEntries: 'No completed tasks.',
    journalNoEntries: 'No journal entries for this filter.',
    journalFilters: {
        watering: 'Watering',
        feeding: 'Feeding',
        training: 'Training',
        observation: 'Observation',
        pestControl: 'Pest Control',
        amendment: 'Amendment',
        system: 'System',
        photo: 'Photo',
        environment: 'Environment'
    },
    photosNoEntries: 'No photos found in the journal.',
    lifecycle: 'Lifecycle',
    history: 'History',
    historyNoData: 'Not enough data for a chart.',
     historyChart: {
        events: {
            watering: 'Watered',
            feeding: 'Fed',
            training: 'Training'
        }
    },
    vitals: 'Vitals',
    height: 'Height',
    stress: 'Stress Level',
    structuralModel: 'Structural Model',
    healthStatus: 'Health & Status',
    activeIssues: 'Active Issues',
    environment: 'Environment',
    substrateAndRoots: 'Substrate & Roots',
    rootHealth: 'Root Health',
    microbeHealth: 'Microbe Health',
     controls: {
        title: 'Equipment Controls',
        light: 'Light',
        fan: 'Circulation Fan',
        fanSpeed: 'Fan Speed'
    },
    status: {
        title: 'Real-Time Status',
        syncActive: 'Simulation Active'
    }
  },
  aiAdvisor: {
    description: 'Request an AI analysis of your plant\'s current state to get targeted advice and action recommendations.',
    proactiveDiagnosisTitle: 'Proactive Diagnosis',
    proactiveDiagnosisDescription: 'Run a full analysis of all grow data to find root causes for issues and get a treatment plan.',
    runDiagnosis: 'Run Full Diagnosis',
    archiveTitle: 'Advisor Archive',
    archiveEmpty: 'No advisor responses have been archived for this plant.',
    exportModal: {
      sources: {
        selected_one: '1 selected response',
        selected_other: '{{count}} selected responses',
        all_one: 'All 1 filtered response',
        all_other: 'All {{count}} filtered responses',
      }
    }
  },
  aiDiagnostics: {
    title: 'AI Plant Diagnostics',
    description: 'Upload a photo of an issue (e.g., a discolored leaf) to get an AI-powered diagnosis.',
    dragDrop: 'Drag & drop image here, or click to select',
    capture: 'Take Photo',
    cameraError: 'Camera access failed. Please check permissions.',
    plantContext: 'Plant Context (optional)',
    generalContext: 'General / Unknown Plant',
    userNotesPlaceholder: 'Add extra notes... (e.g., "affecting top leaves")',
    validation: {
        imageOnly: 'Please upload image files only.'
    },
    diagnosis: 'Diagnosis',
    confidence: 'Confidence',
    actions: 'Immediate Actions',
    solution: 'Long-Term Solution',
    prevention: 'Prevention',
    savedToJournal: 'Diagnosis saved to journal.',
    waitingDesc: 'Upload an image to start a diagnosis.',
    retake: 'Retake',
  },
  inlineSelector: {
    title: 'Choose an empty slot',
    subtitle: 'Select an empty slot on your dashboard to start growing',
  },
  setupModal: {
    title: 'Configure Setup for {name}',
    subtitle: 'Adjust the starting conditions for your new grow.',
    lightType: 'Light Type',
    wattage: 'Wattage',
    potSize: 'Pot Size (Liters)',
    medium: 'Grow Medium',
    temperature: 'Temperature (°C)',
    humidity: 'Humidity (%)',
    lightHours: 'Light Hours / Day',
  },
  confirmationModal: {
    title: 'Start Grow?',
    text: 'Your plant will be initialized with the selected settings and placed in your grow room. Are you ready to begin?',
    confirmButton: 'Confirm Grow',
  },
  actionModals: {
    logWatering: 'Log Watering',
    logFeeding: 'Log Feeding',
    logTraining: 'Log Training',
    logPestControl: 'Log Pest Control',
    logObservation: 'Log Observation',
    logPhoto: 'Log Photo',
    logAmendment: 'Log Amendment',
    defaultNotes: {
        watering: 'Watered with pH-adjusted water.',
        feeding: 'Applied nutrient solution as per schedule.'
    }
  },
  notifications: {
    allSlotsFull: 'All your grow slots are full!',
    growStarted: 'Successfully started growing {name}!',
    seedCollected: 'Collected a high-quality seed from {name}!',
  },
  archivedPlant: 'Archived Plant',
  syncProgress: 'Syncing simulation progress...',
  postHarvest: {
    title: 'Post-Harvest Management',
    drying: 'Drying',
    curing: 'Curing',
    day: 'Day',
    days_one: '1 Day',
    days_other: '{{count}} Days',
    currentConditions: 'Current Conditions',
    targetConditions: 'Target Conditions',
    temperature: 'Temperature',
    humidity: 'Humidity',
    dryingProgress: 'Drying Progress',
    curingProgress: 'Curing Progress',
    jarHumidity: 'Jar Humidity',
    finalQuality: 'Final Quality',
    ideal: 'Ideal',
    tooHigh: 'Too High',
    tooLow: 'Too Low',
    simulateNextDay: 'Simulate Next Day',
    burpJars: 'Burp Jars',
    burpComplete: 'Burping complete!',
    finishDrying: 'Finish Drying',
    finishCuring: 'Finish Curing',
    processComplete: 'Process Complete',
  },
  harvestPlant: 'Harvest Plant'
};