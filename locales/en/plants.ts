export const plantsView = {
  title: 'My Grow Room',
  plantCard: {
    day: 'Day',
  },
  emptySlot: {
    title: 'Empty Plant Slot',
    subtitle: 'Start a new grow from the Strains section.',
  },
  archivedPlant: 'Archived Plant',
  vitals: {
    ph: 'pH Value',
    ec: 'EC Value',
    moisture: 'Moisture',
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
    logAction: 'Log Action',
    idealRange: 'Ideal: {min} - {max}',
    current: 'Current',
    wateringTitle: 'Log Watering',
    feedingTitle: 'Log Feeding',
    observationTitle: 'Log Observation',
    trainingTitle: 'Log Training',
    photoTitle: 'Log Photo',
    waterAmount: 'Water Amount (ml)',
    phValue: 'pH Value (In)',
    ecValue: 'EC Value (In)',
    runoffPh: 'pH Value (Runoff)',
    runoffEc: 'EC Value (Runoff)',
    runoff: 'Runoff (Optional)',
    nutrientDetails: 'Nutrient Details',
    nutrientDetailsPlaceholder: 'e.g. BioBizz Grow 2ml/L',
    observationPlaceholder: 'What did you observe?',
    trainingType: 'Training Type',
    trainingTypes: {
      topping: {
        label: 'Topping',
        tooltip: 'Cutting the main stem to encourage two new main shoots, creating a bushier plant.'
      },
      lst: {
        label: 'LST',
        tooltip: 'Gently bending branches down to create a wide, flat canopy for better light exposure.'
      },
      defoliation: {
        label: 'Defoliation',
        tooltip: 'Strategically removing fan leaves to improve light penetration and air circulation to lower buds.'
      },
      fiming: {
        label: 'FIMing',
        tooltip: 'A variation of topping where only part of the new shoot is removed, potentially resulting in four or more new shoots.'
      },
      scrog: {
        label: 'SCROG',
        tooltip: 'Using a screen (Screen of Green) to guide shoots horizontally, creating a perfectly even canopy.'
      },
      superCropping: {
        label: 'Super Cropping',
        tooltip: 'Carefully pinching and bending stems to damage the inner tissue, promoting stronger growth and better nutrient flow.'
      }
    },
    photoNotes: 'Notes for photo',
    photoCategory: 'Category',
    photoCategories: {
      'Full Plant': 'Full Plant',
      'Bud': 'Bud',
      'Leaf': 'Leaf',
      'Problem': 'Problem',
      'Trichomes': 'Trichomes',
    },
    healthStatus: 'Health Status',
    healthStatuses: {
      'Excellent': 'Excellent',
      'Good': 'Good',
      'Showing Issues': 'Showing Issues',
    },
    observationTags: 'Tags (comma-separated)',
    observationTagsPlaceholder: 'e.g. Pests, Deficiency',
    defaultNotes: {
        watering: 'Watered the plant.',
        feeding: 'Fed the plant.',
    }
  }
};