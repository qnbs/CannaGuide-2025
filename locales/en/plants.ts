export const plantsView = {
  title: 'My Garden',
  syncProgress: 'Syncing plant progress...',
  emptySlot: {
    title: 'Start New Grow',
    subtitle: 'Select an empty slot to begin.',
    subtitleInline: 'Choose a strain to start a new simulation.',
  },
  inlineSelector: {
    title: 'Select a Strain for Slot',
    subtitle: 'Choose a strain to start growing in this slot.',
  },
  setupModal: {
    title: 'Configure Grow Setup for {name}',
    subtitle: 'Define the initial conditions for your new plant.',
    lightType: 'Light Type',
    wattage: 'Wattage',
    potSize: 'Pot Size (L)',
    medium: 'Medium',
    temperature: 'Temperature (°C)',
    humidity: 'Humidity (%)',
    lightHours: 'Light Hours (on)',
  },
  confirmationModal: {
    title: 'Are you ready to start your project?',
    text: "Once you click 'Start Germination', your plant's life begins in real-time. The simulation will now run continuously in the background, just like a real plant. You can visit, care for, and observe it at any time. This is the beginning of a long journey.",
    confirmButton: 'Start Germination'
  },
  notifications: {
    allSlotsFull: 'All plant slots are currently full.',
    growStarted: 'Successfully started growing {name}!',
    waterAllSuccess: 'Watered {count} plants that were thirsty.',
    waterAllNone: 'All plants are sufficiently watered.',
  },
  gardenVitals: {
    title: 'Garden Vitals',
    avgTemp: 'Avg. Temp',
    avgHumidity: 'Avg. Humidity',
  },
  summary: {
    gardenHealth: 'Garden Health',
    activeGrows: 'Active Grows',
    openTasks: 'Open Tasks',
    activeProblems: 'Active Problems',
    waterAll: 'Water All Thirsty Plants',
    advanceDay: 'Simulate Next Day',
  },
  tasks: {
    title: 'Priority Tasks',
    none: 'No open tasks. Everything is on track!',
    priority: 'Priority',
    priorities: {
        high: 'High',
        medium: 'Medium',
        low: 'Low'
    }
  },
  warnings: {
    title: 'Active Warnings',
    none: 'No active problems detected. Keep it up!',
  },
  plantCard: {
    day: 'Day',
  },
  vitals: {
    ph: 'pH',
    ec: 'EC',
    moisture: 'Moisture',
  },
  detailedView: {
    status: {
        title: 'Real-time Grow Status',
        syncActive: 'Simulation Active',
    },
    controls: {
        title: 'Equipment Controls',
        light: 'Light',
        fan: 'Fan',
        fanSpeed: 'Fan Speed',
    },
    lifecycle: 'Plant Lifecycle',
    history: 'Growth & Stress History',
    historyNoData: 'Not enough data to display chart.',
    vitals: 'Substrate Vitals',
    environment: 'Environment',
    height: 'Height',
    stress: 'Stress',
    tabs: {
      overview: 'Overview',
      ai: 'AI Advisor',
      journal: 'Journal',
      tasks: 'Tasks',
      photos: 'Photos',
    },
    journalFilters: {
        watering: 'Watering',
        feeding: 'Feeding',
        training: 'Training',
        observation: 'Observation',
        system: 'System',
        photo: 'Photo',
        pestControl: 'Pest Control',
        environment: 'Environment',
        amendment: 'Amendment',
    },
    journalNoEntries: 'No journal entries match the filter.',
    tasksComplete: 'Complete',
    tasksNoEntries: 'No completed tasks yet.',
    photosNoEntries: 'No photos have been logged yet.',
  },
  historyChart: {
    events: {
        watering: 'Watered',
        feeding: 'Fed',
        training: 'Trained',
    }
  },
  actionModals: {
    logWatering: 'Log Watering',
    logFeeding: 'Log Feeding',
    logTraining: 'Log Training',
    logPestControl: 'Log Pest Control',
    logObservation: 'Log Observation',
    logPhoto: 'Log Photo',
    defaultNotes: {
        watering: 'Standard watering with pH-adjusted water.',
        feeding: 'Standard feeding as per schedule.'
    }
  },
  aiAdvisor: {
    archiveTitle: 'Advisor Archive',
    archiveEmpty: 'No advice has been archived for this plant yet.',
  },
  aiDiagnostics: {
    title: 'AI Plant Doctor',
    description: 'Upload a clear photo of a leaf or problem area to get an AI-powered diagnosis.',
    dragDrop: 'Drag & drop image here, or click to select',
    capture: 'Use Camera',
    cameraError: 'Could not access camera. Please check permissions.',
    retake: 'Retake',
    validation: {
        imageOnly: 'Please upload an image file.',
    },
    plantContext: 'Provide context for',
    generalContext: 'General Diagnosis (No specific plant)',
    userNotesPlaceholder: 'Add any extra notes for the AI...',
    confidence: 'Confidence',
    diagnosis: 'Diagnosis',
    actions: 'Immediate Actions',
    solution: 'Long-Term Solution',
    prevention: 'Prevention',
    savedToJournal: 'Diagnosis saved to plant journal.',
    waitingDesc: 'Upload a photo and provide context to get a diagnosis.',
  },
  archivedPlant: 'Archived Plant',
};