export const plantsView = {
  title: 'My Plants',
  tabs: {
    dashboard: 'Dashboard',
    archive: 'AI Advisor Archive',
  },
  emptySlot: {
    title: 'Empty Slot',
    subtitle: 'Start a new grow from the strains view.',
    button: 'Select Strain',
  },
  plantCard: {
    day: 'Day',
    stage: 'Stage',
  },
  actionCenter: {
    title: 'Action Center',
    tasks: 'Tasks & Warnings',
    diagnostics: 'AI Diagnostics',
    tip: 'Tip of the Day',
  },
  gardenVitals: {
    title: 'Garden Vitals',
    avgTemp: 'Avg. Temp.',
    avgHumidity: 'Avg. Humidity',
  },
  vitals: {
    moisture: 'Moisture',
    ph: 'pH Level',
    ec: 'EC Level',
  },
  summary: {
    activeGrows: 'Active Grows',
    openTasks: 'Open Tasks',
    gardenHealth: 'Garden Health',
    waterAll: 'Water All',
    simulateNextDay: 'Next Day',
    heightChart: 'Height History',
  },
  tasks: {
    title: 'Tasks',
    none: 'No open tasks. Well done!',
    priority: 'Priority',
    priorities: {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    },
    wateringTask: {
      title: 'Water plant',
      description: 'The substrate is too dry.',
    }
  },
  warnings: {
    title: 'Warnings',
    none: 'No problems detected. Everything is looking good!',
  },
  notifications: {
    startSuccess: 'Successfully started growing {name}!',
    allSlotsFull: 'All grow slots are full.',
    stageChange: 'Stage changed to: {stage}',
    harvestReady: '{name} is ready for harvest!',
    finalYield: 'Final yield calculated: {yield}g',
    waterAllSuccess: '{count} plants have been watered.',
    waterAllNone: 'No plants needed watering.',
  },
  setupModal: {
    title: 'Setup for {name}',
    subtitle: 'Configure the environmental conditions for your grow.',
    lightSource: 'Light Source',
    potSize: 'Pot Size',
    medium: 'Medium',
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
      temp: 'Temperature must be between 10°C and 40°C.',
      humidity: 'Humidity must be between 10% and 99%.',
    }
  },
  detailedView: {
    tabs: {
      overview: 'Overview',
      journal: 'Journal',
      tasks: 'Tasks',
      photos: 'Photos',
    },
    vitals: 'Vitals',
    ph: 'pH Level',
    ec: 'EC Level',
    moisture: 'Substrate Moisture',
    stress: 'Stress Level',
    height: 'Height',
    age: 'Age',
    stage: 'Stage',
    history: 'History',
    historyNoData: 'Not enough data for history chart.',
    lifecycle: 'Lifecycle',
    journalFilters: {
      watering: 'Watering',
      feeding: 'Feeding',
      training: 'Training',
      observation: 'Observation',
      system: 'System',
      photo: 'Photo',
    },
    journalNoEntries: 'No journal entries found for this filter.',
    tasksComplete: 'Complete',
    tasksNoEntries: 'No tasks for this plant.',
    photosNoEntries: 'No photos in the journal for this plant.',
  },
  actionModals: {
    wateringTitle: 'Log Watering',
    waterAmount: 'Water Amount (ml)',
    phValue: 'pH Value',
    feedingTitle: 'Log Feeding',
    ecValue: 'EC Value (mS/cm)',
    observationTitle: 'Add Observation',
    observationPlaceholder: 'What did you notice?',
    trainingTitle: 'Log Training',
    trainingType: 'Training Type',
    trainingTypes: {
      topping: 'Topping',
      lst: 'LST',
      defoliation: 'Defoliation',
    },
    photoTitle: 'Add Photo',
    photoNotes: 'Notes for the photo',
    defaultNotes: {
      watering: 'Watered the plant.',
      feeding: 'Fed the plant.',
    },
  },
  aiDiagnostics: {
    title: 'AI Plant Doctor',
    buttonLabel: 'Upload Image',
    prompt: 'Upload a photo of a leaf or the plant to get a diagnosis.',
    diagnoseButton: 'Diagnose',
  },
  aiAdvisor: {
    description: 'Get a data-driven analysis and action recommendations for your plant from the AI.',
    archiveTitle: 'AI Advisor Archive',
    archiveEmpty: 'No AI analyses have been archived for this plant yet. Request an analysis and save it to build a history here.',
    archiveEmptyGlobal: {
        title: 'Global Advisor Archive is Empty',
        subtitle: 'All saved recommendations from the AI Advisor across all your plants will be collected here. Request analyses for your plants to build your personal knowledge base.'
    },
    unknownPlant: 'Unknown/Deleted Plant',
  },
  quickActions: {
      title: "Quick Actions",
      simulateNextDay: "Simulate Next Day"
  },
  journal: {
    problemDetected: 'Problem detected: {message}',
    newTask: 'New task: {title}',
  }
};