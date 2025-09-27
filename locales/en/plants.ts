export const plantsView = {
  emptySlot: {
    title: 'Empty Plant Slot',
    subtitle: 'Start a new grow here.',
    subtitleInline: 'Click to select a strain.',
  },
  inlineSelector: {
    title: 'Choose a Slot for Your New Grow',
    subtitle: 'You\'ve initiated a grow with {name}. Select an empty slot below to proceed.',
  },
  setupModal: {
    title: 'Setup for {name}',
    subtitle: 'Configure the initial environment and equipment parameters for your new grow.',
    lightType: 'Light Type',
    wattage: 'Wattage',
    potSize: 'Pot Size (Liters)',
    medium: 'Grow Medium',
    temperature: 'Temperature (°C)',
    humidity: 'Humidity (%)',
    lightHours: 'Light Hours per Day',
  },
  confirmationModal: {
    title: 'Ready to Grow!',
    text: 'Your setup is configured and the seed is ready. Confirm to start the grow and begin the simulation.',
    confirmButton: 'Start Grow',
  },
  gardenVitals: {
    title: 'Garden Vitals',
    avgTemp: 'Avg Temp',
    avgHumidity: 'Avg Humidity',
  },
  summary: {
    gardenHealth: 'Garden Health',
    activeGrows: 'Active Grows',
    waterAll: 'Water All Thirsty Plants',
    openTasks: 'Open Tasks',
  },
  tasks: {
    title: 'Tasks',
    none: 'No open tasks. Great job!',
    priority: 'Priority',
    priorities: {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    }
  },
  warnings: {
    title: 'Warnings',
    none: 'No active problems detected.',
  },
  aiDiagnostics: {
    title: 'AI Plant Diagnostics',
    description: 'Upload a photo of a leaf or problem area to get an AI-powered diagnosis and recommended actions.',
    dragDrop: 'Drag & drop image here or click to upload',
    capture: 'Capture with Camera',
    cameraError: 'Failed to access camera. Please check permissions.',
    plantContext: 'Select Plant Context (Optional)',
    generalContext: 'General (no specific plant)',
    userNotesPlaceholder: 'Add additional observations... (e.g., "affecting top leaves")',
    confidence: 'Confidence',
    diagnosis: 'Diagnosis',
    actions: 'Immediate Actions',
    solution: 'Long-Term Solution',
    prevention: 'Prevention',
    validation: {
      imageOnly: 'Please upload image files only.',
    },
    savedToJournal: 'Diagnosis saved to journal!',
    waitingDesc: 'Upload an image to start a diagnosis.',
    retake: 'Retake',
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
      title: 'Realtime Status',
      syncActive: 'Simulation active & syncing',
    },
    controls: {
      title: 'Equipment Control',
      light: 'Light',
      fan: 'Circulation Fan',
      fanSpeed: 'Fan Speed',
    },
    tabs: {
      overview: 'Overview',
      journal: 'Journal',
      tasks: 'Tasks',
      photos: 'Photos',
      ai: 'AI Advisor',
    },
    lifecycle: 'Lifecycle',
    history: 'History',
    vitals: 'Vitals',
    environment: 'Environment',
    height: 'Height',
    stress: 'Stress',
    journalFilters: {
      watering: 'Watering',
      feeding: 'Feeding',
      training: 'Training',
      observation: 'Observation',
      pestControl: 'Pest Control',
      amendment: 'Amendment',
      system: 'System',
      photo: 'Photo',
      environment: 'Environment',
    },
    journalNoEntries: 'No journal entries found for this filter.',
    tasksComplete: 'Complete',
    tasksNoEntries: 'No completed tasks.',
    photosNoEntries: 'No photos found in the journal.',
    historyNoData: 'Not enough data to display a chart.',
    historyChart: {
        events: {
            watering: 'Watering',
            feeding: 'Feeding',
            training: 'Training',
        }
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
      watering: 'Performed standard watering.',
      feeding: 'Applied nutrients according to schedule.',
    },
    trainingTypes: {
        lst: 'LST',
        topping: 'Topping',
        fiming: 'FIMing',
        defoliation: 'Defoliation'
    }
  },
  aiAdvisor: {
    archiveTitle: 'Advisor Archive',
    archiveEmpty: 'No archived advice for this plant.',
    exportModal: {
      sources: {
        selected: 'Selected ({count})',
        all: 'All Filtered ({count})',
      }
    }
  },
  archivedPlant: 'Archived Plant',
  notifications: {
    growStarted: 'Successfully started grow for {name}!',
    allSlotsFull: 'All plant slots are currently full.',
    waterAllSuccess_one: 'Watered 1 plant.',
    waterAllSuccess_other: 'Watered {{count}} plants.',
    waterAllNone: 'No plants needed watering.',
  },
  syncProgress: 'Syncing plant progress...'
};
