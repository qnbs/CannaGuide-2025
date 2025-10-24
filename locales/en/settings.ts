export const settingsView = {
  title: 'Settings',
  saveSuccess: 'Settings saved!',
  categories: {
    general: 'General & UI',
    strains: 'Strains View',
    plants: 'Plants & Simulation',
    notifications: 'Notifications',
    defaults: 'Defaults',
    data: 'Data Management',
    about: 'About',
    tts: 'Voice & Speech',
    privacy: 'Privacy & Security',
    accessibility: 'Accessibility',
    lookAndFeel: 'Look & Feel',
    interactivity: 'Interactivity',
  },
  general: {
    title: 'General Settings',
    language: 'Language',
    theme: 'Theme',
    themes: {
      midnight: 'Midnight',
      forest: 'Forest',
      purpleHaze: 'Purple Haze',
      desertSky: 'Desert Sky',
      roseQuartz: 'Rose Quartz',
      rainbowKush: 'Rainbow Kush',
    },
    fontSize: 'Font Size',
    fontSizes: {
      sm: 'Small',
      base: 'Normal',
      lg: 'Large',
    },
    defaultView: 'Default View on Startup',
    installApp: 'Install App',
    installAppDesc: 'Install CannaGuide 2025 on your device for a native-app experience, including offline access.',
    uiDensity: 'UI Density',
    uiDensities: {
        comfortable: 'Comfortable',
        compact: 'Compact'
    },
    dyslexiaFont: 'Dyslexia-Friendly Font',
    dyslexiaFontDesc: 'Uses the Atkinson Hyperlegible font for improved readability.',
    reducedMotion: 'Reduced Motion',
    reducedMotionDesc: 'Disables or reduces animations and motion-based effects.',
    colorblindMode: 'Colorblind Mode',
    colorblindModeDesc: 'Adjusts app colors for different types of color vision deficiency.',
    colorblindModes: {
        none: 'None',
        protanopia: 'Protanopia (Red-Blind)',
        deuteranopia: 'Deuteranopia (Green-Blind)',
        tritanopia: 'Tritanopia (Blue-Blind)',
    },
  },
  languages: {
    en: 'English',
    de: 'German',
  },
  tts: {
    title: 'Voice & Speech',
    ttsOutput: 'Speech Output (Text-to-Speech)',
    voiceControlInput: 'Voice Control (Input)',
    ttsEnabled: 'Enable Text-to-Speech',
    ttsEnabledDesc: 'Adds buttons to have app content read aloud.',
    voice: 'Voice',
    noVoices: 'No voices available for the current language.',
    rate: 'Speech Rate',
    pitch: 'Pitch',
    volume: 'Volume',
    highlightSpeakingText: 'Highlight Speaking Text',
    highlightSpeakingTextDesc: 'Visually highlights the block of text currently being read.',
    testVoice: 'Test Voice',
    testVoiceSentence: 'This is a test of the selected voice.',
    voiceControl: {
      enabled: 'Enable Voice Control',
      enabledDesc: 'Control the app using simple voice commands.',
      confirmationSound: 'Confirmation Sounds',
      confirmationSoundDesc: 'Plays a short sound when a voice command is successfully recognized.',
    },
    commands: {
        title: 'Command Reference',
        description: 'Here is a list of commands you can use when voice control is active. Simply start with "Go to..." or "Search for...".',
        searchPlaceholder: 'Search commands...',
        groups: {
            navigation: 'Navigation',
            strains: 'Strains',
            plants: 'Plants',
        },
        goTo: 'Go to {{view}}',
        searchFor: 'Search for [strain name]',
        resetFilters: 'Reset filters',
        showFavorites: 'Show favorites',
        waterAll: 'Water all plants',
    },
    readThis: 'Read this section aloud',
    play: 'Play',
    pause: 'Pause',
    next: 'Next',
    stop: 'Stop',
  },
  strains: {
    title: 'Strains View Settings',
    defaultSort: 'Default Sort Order',
    defaultViewMode: 'Default View Mode',
    strainsPerPage: 'Items Per Page',
    viewModes: {
      list: 'List',
      grid: 'Grid',
    },
    visibleColumns: 'Visible Columns (List View)',
    visibleColumnsDesc: 'Choose which data columns to display in the list view.',
    columns: {
        type: 'Type',
        thc: 'THC',
        cbd: 'CBD',
        floweringTime: 'Flowering Time',
    },
    sortKeys: {
      name: 'Name',
      thc: 'THC',
      cbd: 'CBD',
      floweringTime: 'Flowering Time',
      difficulty: 'Difficulty',
      type: 'Type',
      yield: 'Yield',
      height: 'Height',
    },
    sortDirections: {
      asc: 'Ascending',
      desc: 'Descending',
    },
    defaults: {
        title: 'Defaults & Behavior',
        prioritizeTitle: 'Prioritize My Strains & Favorites',
        prioritizeDesc: 'Always show your custom and favorite strains at the top of the list.',
        sortDirection: 'Sort Direction'
    },
    listView: {
        title: 'List View Customization',
        description: 'Customize the columns displayed in the list view.'
    },
    advanced: {
        title: 'Advanced Features',
        genealogyLayout: 'Default Genealogy Layout',
        genealogyDepth: 'Default Genealogy Initial Depth',
        aiTipsExperience: 'Default AI Tips Experience Level',
        aiTipsFocus: 'Default AI Tips Focus'
    }
  },
  plants: {
    title: 'Plants & Simulation',
    behavior: 'Simulation Behavior',
    physics: 'Advanced Simulation Physics (Expert)',
    showArchived: 'Show Completed Grows',
    showArchivedDesc: 'Displays finished/harvested plants on the dashboard.',
    autoGenerateTasks: 'Auto-Generate Tasks',
    autoGenerateTasksDesc: 'Automatically create tasks for actions like watering.',
    realtimeSimulation: 'Real-time Simulation',
    realtimeSimulationDesc: 'The plant simulation continues to run in the background.',
    speedMultiplier: 'Simulation Speed',
    autoJournaling: 'Auto-Journaling',
    logStageChanges: 'Log stage changes',
    logProblems: 'Log problems',
    logTasks: 'Log tasks',
    simulationProfile: 'Simulation Profile',
    simulationProfiles: {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      expert: 'Expert',
    },
    pestPressure: 'Pest Pressure',
    pestPressureDesc: 'The base probability of pest-related events occurring.',
    nutrientSensitivity: 'Nutrient Sensitivity',
    nutrientSensitivityDesc: 'How strongly the plant reacts to nutrient imbalances.',
    environmentalStability: 'Environmental Stability',
    environmentalStabilityDesc: 'How much the temperature and humidity fluctuate randomly.',
    leafTemperatureOffset: 'Leaf Temperature Offset (°C)',
    leafTemperatureOffsetDesc: 'Simulates how much cooler (negative) or warmer (positive) the leaves are than the ambient air. Directly impacts VPD calculation.',
    lightExtinctionCoefficient: 'Light Penetration (k-value)',
    lightExtinctionCoefficientDesc: 'Controls how well light penetrates the canopy. A lower value means better penetration. Affects lower leaf photosynthesis.',
    nutrientConversionEfficiency: 'Nutrient Conversion Efficiency',
    nutrientConversionEfficiencyDesc: 'How efficiently the plant converts absorbed nutrients into biomass. A higher value means more growth for the same amount of nutrients.',
    stomataSensitivity: 'Stomata Sensitivity',
    stomataSensitivityDesc: 'Controls how quickly the plant closes its stomata in high VPD conditions to conserve water. A higher value means higher drought tolerance.',
  },
  notifications: {
    title: 'Notifications',
    enableAll: 'Enable All Notifications',
    stageChange: 'Stage Change',
    problemDetected: 'Problem Detected',
    harvestReady: 'Harvest Ready',
    newTask: 'New Task',
    lowWaterWarning: 'Low Water Warning',
    phDriftWarning: 'pH Drift Warning',
    quietHours: 'Quiet Hours',
    enableQuietHours: 'Enable Quiet Hours',
    quietHoursDesc: 'Notifications will be silenced during this time.',
  },
  defaults: {
      title: 'Defaults',
      growSetup: 'Default Grow Setup',
      export: 'Default Export Format',
      journalNotesTitle: 'Default Journal Notes',
      wateringNoteLabel: 'Note for Watering',
      feedingNoteLabel: 'Note for Feeding',
  },
  data: {
    title: 'Data Management',
    storageInsights: 'Storage Insights',
    backupAndRestore: 'Backup & Restore',
    dangerZone: 'Danger Zone',
    importData: 'Import Data',
    importDataDesc: 'Restore an app backup from a JSON file. This will overwrite all current data.',
    importConfirmTitle: 'Confirm Import',
    importConfirmText: 'Are you sure? All of your current data will be replaced by the contents of the selected file. This action cannot be undone.',
    importConfirmButton: 'Import & Overwrite',
    importSuccess: 'Data imported successfully. The app will now reload.',
    importError: 'Import failed. Please ensure it is a valid backup file.',
    totalUsage: 'Total Usage',
    lastBackup: 'Last Backup',
    noBackup: 'No backup created yet',
    autoBackup: 'Automatic Backup',
    backupOptions: {
        off: 'Off',
        daily: 'Daily',
        weekly: 'Weekly',
    },
    cloudSync: 'Cloud Sync',
    cloudSyncDesc: 'Sync your data with Google Drive (future feature).',
    replayOnboarding: 'Show Tutorial Again',
    replayOnboardingConfirm: 'This will show the welcome tutorial on the next app start. Continue?',
    replayOnboardingSuccess: 'Tutorial will be shown on next start.',
    resetPlants: 'Reset Plants',
    resetPlantsConfirm: 'Are you sure you want to delete all your current plants? This action cannot be undone.',
    resetPlantsSuccess: 'All plants have been reset.',
    resetAll: 'Reset All App Data',
    resetAllConfirm: 'WARNING: This will permanently delete all your plants, settings, favorites, and custom strains. Are you absolutely sure?',
    resetAllConfirmInput: "To confirm, please type '{{phrase}}'.",
    resetAllConfirmPhrase: 'delete all data',
    resetAllSuccess: 'All app data has been reset. The app will now reload.',
    exportAll: 'Export All Data',
    exportAsJson: 'Export as JSON',
    exportAsXml: 'Export as XML',
    exportConfirm: 'Are you sure you want to export all your app data as a backup?',
    exportSuccess: 'All data exported successfully!',
    exportError: 'Export failed.',
    clearArchives: 'Clear AI Archives',
    clearArchivesDesc: 'Deletes all saved responses from the AI Mentor and Advisor.',
    clearArchivesConfirm: 'Are you sure you want to delete all your saved AI responses?',
    clearArchivesSuccess: 'All AI archives have been cleared.',
    storageUsage: 'Storage Usage',
    storageBreakdown: {
        plants: 'Plant Data & Journals',
        images: 'Saved Photos',
        archives: 'AI Archives',
        customStrains: 'Custom Strains',
        savedItems: 'Saved Items',
    }
  },
  privacy: {
    title: 'Privacy & Security',
    requirePin: 'Require PIN on Launch',
    requirePinDesc: 'Protect your app with a 4-digit PIN.',
    setPin: 'Set/Change PIN',
    clearAiHistory: 'Clear AI History on Exit',
    clearAiHistoryDesc: 'Automatically clears all AI chat histories when the app is closed.',
  },
   about: {
      title: 'About the App',
      projectInfo: 'Project Info & README',
      version: 'Version',
      whatsNew: {
        title: "What's New in v2.0",
        items: {
            simulation: "Advanced Simulation Engine: Based on VPD, biomass, and a structural growth model.",
            genealogy: "Interactive Genealogy Tree: Visualize genetic lineage and ancestor influence.",
            ai: "AI Grow Tips & Image Generation: Get unique, AI-powered advice and imagery for any strain.",
            breeding: "Breeding Lab & Sandbox: Cross-breed new strains and run risk-free 'what-if' experiments."
        }
      },
      techStack: {
        title: "Technology Stack",
        gemini: "Powers all AI features for intelligent diagnostics and advice.",
        react: "For a modern, performant, and responsive user interface.",
        indexedDb: "Robust client-side database for 100% offline functionality.",
        webWorkers: "Runs complex simulations off the main thread to keep the UI smooth."
      },
      credits: {
          title: "Acknowledgements & Links",
          phosphor: "Icons provided by Phosphor Icons.",
      },
      githubLinkText: 'View Project on GitHub',
      aiStudioLinkText: 'Fork Project in AI Studio',
      disclaimer: {
        title: 'Disclaimer',
        content: 'All information in this app is for educational and entertainment purposes only. The cultivation of cannabis is subject to strict legal regulations. Please inform yourself about the laws in your region and always act responsibly and in accordance with the law.'
      },
      readmeContent: {
        header: `
          <h1>🌿 CannaGuide 2025 (English)</h1>
          <p><strong>The Definitive AI-Powered Cannabis Cultivation Companion</strong></p>
          <p>CannaGuide 2025 is your definitive AI-powered digital co-pilot for the entire cannabis cultivation lifecycle. Engineered for both novice enthusiasts and master growers, this state-of-the-art <strong>Progressive Web App (PWA)</strong> guides you from seed selection to a perfectly cured harvest.</p>
        `,
        philosophyTitle: "Project Philosophy",
        philosophyContent: `
            <p>CannaGuide 2025 is built upon a set of core principles designed to deliver a best-in-class experience:</p>
            <blockquote><strong>Offline First</strong>: Your garden doesn't stop when your internet does. The app is engineered to be <strong>100% functional offline</strong>.</blockquote>
            <blockquote><strong>Performance is Key</strong>: A fluid, responsive UI is non-negotiable. Heavy lifting, like the complex, multi-plant simulation, is offloaded to a dedicated <strong>Web Worker</strong>.</blockquote>
            <blockquote><strong>Data Sovereignty</strong>: Your data is yours, period. The ability to <strong>export and import your entire application state</strong> gives you complete control.</blockquote>
            <blockquote><strong>AI as a Co-pilot</strong>: We leverage the Google Gemini API not as a gimmick, but as a powerful tool to provide <strong>actionable, context-aware insights</strong>.</blockquote>
        `,
        featuresTitle: "Key Features",
        featuresContent: `
            <h4>1. The Grow Room (<code>Plants</code> View)</h4>
            <ul>
                <li><strong>Advanced Simulation Engine</strong>: Experience a state-of-the-art simulation based on <strong>VPD (Vapor Pressure Deficit)</strong>.</li>
                <li><strong>AI-Powered Diagnostics</strong>: Upload a photo of your plant to get an instant AI-based diagnosis.</li>
                <li><strong>Comprehensive Logging</strong>: Track every action in a detailed, filterable journal for each plant.</li>
            </ul>
            <h4>2. The Strain Encyclopedia (<code>Strains</code> View)</h4>
            <ul>
                <li><strong>Vast Library</strong>: Access detailed information on <strong>700+ cannabis strains</strong>.</li>
                <li><strong>Interactive Genealogy Tree</strong>: Visualize the complete genetic lineage of any strain.</li>
                <li><strong>AI Grow Tips</strong>: Generate unique, AI-powered cultivation advice for any strain.</li>
            </ul>
            <h4>3. The Workshop (<code>Equipment</code> View)</h4>
            <ul>
                <li><strong>Advanced AI Setup Configurator</strong>: Receive a complete, brand-specific equipment list generated by Gemini AI.</li>
                <li><strong>Suite of Calculators</strong>: Access a comprehensive set of precision tools.</li>
            </ul>
            <h4>4. The Library (<code>Knowledge</code> View)</h4>
            <ul>
                <li><strong>Context-Aware AI Mentor</strong>: Ask growing questions to the AI Mentor, which leverages your active plant's data for tailored advice.</li>
                <li><strong>Breeding Lab</strong>: Cross your high-quality collected seeds to create entirely new, <strong>permanent hybrid strains</strong>.</li>
                <li><strong>Interactive Sandbox</strong>: Run "what-if" scenarios without risking your real plants.</li>
            </ul>
            <h4>5. The Help Desk (<code>Help</code> View)</h4>
            <ul>
                <li>Comprehensive User Manual, searchable FAQ, Grower's Lexicon, and Visual Guides.</li>
            </ul>
            <h4>6. The Command Center (<code>Settings</code> View)</h4>
            <ul>
                <li>Customize themes, font sizes, accessibility options, and much more.</li>
            </ul>
        `,
        techTitle: "Technical Deep Dive",
        techContent: `
            <h4>Key Technologies</h4>
            <ul>
                <li><strong>Frontend</strong>: React 19 with TypeScript</li>
                <li><strong>State Management</strong>: Redux Toolkit</li>
                <li><strong>AI Integration</strong>: Google Gemini API (<code>@google/genai</code>)</li>
                <li><strong>Async Operations</strong>: RTK Query</li>
                <li><strong>Concurrency</strong>: Web Workers</li>
                <li><strong>Data Persistence</strong>: IndexedDB</li>
                <li><strong>PWA & Offline</strong>: Service Workers</li>
                <li><strong>Styling</strong>: Tailwind CSS</li>
            </ul>
            <h4>Gemini Service Abstraction (<code>geminiService.ts</code>)</h4>
            <p>As noted in the <a href="https://deepwiki.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer">project's DeepWiki</a>, the <code>geminiService.ts</code> file is a critical component that acts as a central abstraction layer for all communication with the Google Gemini API. This design decouples the API logic from the UI components and the Redux state management layer (RTK Query), making the code cleaner, more maintainable, and easier to test.</p>
            <p><strong>Key Responsibilities & Methods:</strong></p>
            <ul>
                <li><strong>Initialization & Context</strong>: The service initializes a single <code>GoogleGenAI</code> instance and automatically formats real-time plant data and language instructions for every prompt.</li>
                <li><strong>Structured JSON Output</strong>: For features like <code>getEquipmentRecommendation</code> and <code>diagnosePlant</code>, the service leverages Gemini's JSON mode with a <code>responseSchema</code> to enforce valid, type-safe JSON objects.</li>
                <li><strong>Multimodal Input (Vision)</strong>: The <code>diagnosePlant</code> method combines a Base64-encoded image with text in a multipart request, allowing the <code>gemini-2.5-flash</code> model to analyze both visual and textual data.</li>
                <li><strong>Image Generation</strong>: The <code>generateStrainImage</code> method uses the specialized <code>gemini-2.5-flash-image</code> model to create unique, artistic images for the AI Grow Tips feature.</li>
                <li><strong>Model Selection & Error Handling</strong>: The service intelligently selects between <code>gemini-2.5-flash</code> and the more powerful <code>gemini-2.5-pro</code>. Each method includes robust <code>try...catch</code> blocks that provide user-friendly error messages to the UI.</li>
            </ul>
        `,
        devTitle: "Local Development (Developer Guide)",
        devContent: `
            <h4>Prerequisites</h4>
            <ul>
                <li>Node.js (v18.x or later)</li>
                <li>npm</li>
                <li>A Google Gemini API Key</li>
            </ul>
            <h4>Installation & Setup</h4>
            <ol>
                <li>Clone the repository: <code>git clone https://github.com/qnbs/CannaGuide-2025.git</code></li>
                <li>Install dependencies: <code>npm install</code></li>
                <li>Create a <code>.env</code> file and add your API key: <code>VITE_API_KEY=YOUR_GEMINI_API_KEY</code></li>
                <li>Run the development server: <code>npm run dev</code></li>
            </ol>
        `,
        troubleshootingTitle: "Troubleshooting",
        troubleshootingContent: `
            <ul>
                <li><strong>AI Features Not Working</strong>: Ensure your Gemini API key is correctly set up in your <code>.env</code> file.</li>
                <li><strong>App Not Updating (PWA Caching)</strong>: If you've made changes but don't see them, clear your browser data or unregister the Service Worker in the developer tools.</li>
            </ul>
        `,
        aiStudioTitle: "Development with AI Studio & Open Source",
        aiStudioContent: `
            <p>This application was developed entirely with <strong>Google's AI Studio</strong>. The entire process, from the initial project scaffolding to implementing complex features, was driven by iterative prompts in natural language.</p>
            <p>This project is also fully open source. Dive into the code, fork the project, or contribute on GitHub. See firsthand how natural language can build sophisticated applications.</p>
            <ul>
                <li><a href="https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-" target="_blank" rel="noopener noreferrer">Fork project in AI Studio</a></li>
                <li><a href="https://github.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer">View source code on GitHub</a></li>
                <li><a href="https://deepwiki.com/qnbs/CannaGuide-2025/" target="_blank" rel="noopener noreferrer">View project documentation on DeepWiki</a></li>
            </ul>
        `,
        contributingTitle: "Contributing",
        contributingContent: `
            <p>We welcome contributions from the community! Whether you want to fix a bug, add a new feature, or improve translations, your help is appreciated.</p>
            <ol>
                <li><strong>Reporting Issues</strong>: If you find a bug or have an idea, please open an issue on GitHub first to discuss it.</li>
                <li><strong>Making Changes</strong>: Fork the repository, create a new branch, commit your changes, and create a new Pull Request.</li>
            </ol>
        `,
        disclaimerTitle: "Disclaimer",
        disclaimerContent: `<p>All information in this app is for educational and entertainment purposes only. The cultivation of cannabis is subject to strict legal regulations. Please inform yourself about the laws in your region and always act responsibly and in accordance with the law.</p>`
      }
    }
};