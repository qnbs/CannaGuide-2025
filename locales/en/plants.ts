export const plantsView = {
  title: 'My Grow Room',
  plantCard: {
    day: 'Day',
  },
  emptySlot: {
    title: 'Empty Plant Slot',
    subtitle: 'Start a new grow from the Strains section.',
  },
  notifications: {
    startSuccess: 'Grow for {name} started successfully!',
    allSlotsFull: 'All grow slots are full. Finish a grow to start a new one.',
    stageChange: 'Plant has reached the {stage} stage.',
    harvestReady: '{name} is ready for harvest!',
    finalYield: 'Final yield calculated: {yield}g',
    waterAllSuccess: 'Successfully watered {count} plants.',
    waterAllNone: 'No plants needed watering.',
  },
  setupModal: {
    title: 'Setup for {name}',
    subtitle: 'Configure your growing environment.',
    lightSource: 'Light Source',
    potSize: 'Pot Size',
    medium: 'Growing Medium',
    mediums: {
      soil: 'Soil',
      coco: 'Coco',
      hydro: 'Hydro',
    },
    environment: 'Environment',
    temp: 'Temperature (°C)',
    humidity: 'Humidity (%)',
    lightHours: 'Light Hours/Day',
    validation: {
        light: 'Light hours must be between 1 and 24.',
        temp: 'Temperature must be between 10 and 40°C.',
        humidity: 'Humidity must be between 10 and 99%.',
    }
  },
  detailedView: {
    vitals: 'Vitals',
    stage: 'Stage',
    height: 'Height',
    stress: 'Stress',
    lifecycle: 'Lifecycle',
    history: 'History',
    historyNoData: 'Not enough data for history chart.',
    journal: 'Journal',
    photos: 'Photos',
    tasks: 'Tasks',
    tabs: {
      overview: 'Overview',
      journal: 'Journal',
      photos: 'Photos',
      tasks: 'Tasks',
    },
    journalFilters: {
        watering: 'Watering',
        feeding: 'Feeding',
        training: 'Training',
        observation: 'Observation',
        system: 'System',
        photo: 'Photo',
    },
    journalNoEntries: 'No journal entries for this filter.',
    photosNoEntries: 'No photos added to the journal yet.',
    tasksComplete: 'Complete',
    tasksNoEntries: 'No completed tasks.',
  },
  aiAdvisor: {
    description: 'Get an AI-powered analysis of your plant\'s current state and an actionable recommendation.',
    archiveTitle: 'Advisor Archive',
    archiveEmpty: 'Saved advice for this plant will appear here.',
  },
  aiDiagnostics: {
    title: 'AI Plant Doctor',
    description: 'Upload a picture of a leaf or problem area to get an AI-powered diagnosis.',
    buttonLabel: 'Upload Image',
    prompt: 'PNG, JPG, WEBP up to 10MB',
    cameraError: 'Camera access failed. Please check permissions.',
    capture: 'Capture',
    retake: 'Retake',
  },
  gardenVitals: {
      title: 'Garden Vitals',
      avgTemp: 'Avg Temp',
      avgHumidity: 'Avg Humidity',
  },
  summary: {
    gardenHealth: 'Garden Health',
    activeGrows: 'Active Grows',
    openTasks: 'Open Tasks',
    waterAll: 'Water All',
    simulateNextDay: 'Simulate Next Day',
  },
  tasks: {
      title: 'Tasks & Warnings',
      none: 'No open tasks. Good job!',
      priority: 'Priority',
      priorities: {
          low: 'Low',
          medium: 'Medium',
          high: 'High',
      },
      wateringTask: {
          title: 'Watering Required',
          description: 'Substrate moisture is low.'
      }
  },
  warnings: {
      title: 'Active Warnings',
      none: 'No warnings. Everything looks good!',
  },
  actionModals: {
    wateringTitle: 'Add Watering',
    feedingTitle: 'Add Feeding',
    observationTitle: 'Add Observation',
    trainingTitle: 'Log Training',
    photoTitle: 'Add Photo',
    waterAmount: 'Water Amount (ml)',
    phValue: 'pH Value',
    ecValue: 'EC Value',
    observationPlaceholder: 'What did you observe?',
    trainingType: 'Training Type',
    trainingTypes: {
      lst: 'LST',
      topping: 'Topping',
      defoliation: 'Defoliation',
    },
    photoNotes: 'Notes for photo',
    defaultNotes: {
        watering: 'Watered the plant.',
        feeding: 'Fed the plant.',
    }
  }
};
