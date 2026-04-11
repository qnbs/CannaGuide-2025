export const onboarding = {
    legalStep: {
        title: 'Welcome to CannaGuide 2025',
        subtitle: 'Before we begin, please confirm the following.',
        ageLabel: 'Age Verification',
        ageText:
            'Under the German Cannabis Act (KCanG), access is restricted to persons aged 18 and older. By continuing, you confirm that you are at least 18 years old.',
        consentLabel: 'Privacy & Data',
        consentText:
            'All your data is stored locally on your device (IndexedDB & localStorage). No account is required. Optional AI features send queries directly to the provider you choose -- no data is stored on our servers.',
        geoLabel: 'Legal Notice',
        geoText:
            'Cannabis cultivation laws vary by country and region. This app is designed for use in jurisdictions where personal cannabis cultivation is legal.',
        accept: 'I am 18+ and I agree',
        deny: 'I am under 18',
        denied: 'Access to this application is restricted to persons aged 18 and older.',
        bilingualHint: 'Willkommen -- Bitte oben rechts die Sprache waehlen',
    },
    languageTitle: 'Choose Your Language',
    languageSubtitle: 'Select your preferred language to continue.',
    german: 'German',
    english: 'English',
    step1: {
        title: '🧬 Strain Encyclopedia',
        text: 'Discover 800+ strains with detailed filters, explore their genetic lineage in an interactive tree, or add your own. Get AI-powered cultivation tips.',
    },
    step2: {
        title: '🌿 The Digital Grow Room',
        text: 'Manage up to three plants in an ultra-realistic real-time simulation. Intervene, log everything, and watch them grow.',
    },
    step3: {
        title: '🛠 The Workshop',
        text: 'Plan your perfect setup with the AI configurator, use precise calculators, and save your equipment for future projects.',
    },
    step4: {
        title: '🧠 The Knowledge Center',
        text: 'Learn with the interactive guide, ask the AI mentor for advice, and use the lexicons to deepen your knowledge.',
    },
    step5: {
        title: 'Offline Sync',
        text: 'Your data syncs seamlessly across devices using conflict-free CRDT technology. Works offline -- changes merge automatically when you reconnect.',
    },
    startGrow: "Let's Start Your First Grow!",
    localOnlyNote:
        'No account needed. All data stays on your device. You can optionally enable cloud sync later in Settings.',
    wizard: {
        stepExperience: {
            title: '🌱 Your Experience Level',
            text: 'This personalises the simulation difficulty and AI advice for you.',
            beginner: { label: 'Beginner', desc: 'First grow ever – keep it simple!' },
            intermediate: { label: 'Intermediate', desc: 'A few grows under my belt.' },
            expert: { label: 'Expert', desc: 'Advanced grower – max realism.' },
        },
        stepGoal: {
            title: '🎯 Your Main Goal',
            text: 'We will highlight the most relevant features and strains for you.',
            medical: { label: 'Medical / CBD', desc: 'High-CBD, low-stress cultivation.' },
            recreational: { label: 'Recreational', desc: 'Top yields and potency.' },
            hobbyist: { label: 'Hobbyist', desc: 'Learn and explore at my own pace.' },
        },
        stepSetup: {
            title: '🏠 Space & Budget',
            text: 'We will suggest the best starter setup and top 3 strains for you.',
            small: { label: 'Small (< 0.5 m²)', desc: 'Micro-tent or closet.' },
            medium: { label: 'Medium (0.6–1.5 m²)', desc: 'Classic 80×80 or 1×1 tent.' },
            large: { label: 'Large (> 1.5 m²)', desc: '1.2×1.2 tent or room.' },
            budgetLabel: 'Starter Budget',
            budgetLow: '< €150',
            budgetMid: '€150 – €400',
            budgetHigh: '> €400',
        },
        finish: "Perfect – let's grow! 🎉",
    },
}
