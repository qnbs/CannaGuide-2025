export const helpView = {
  title: 'Help & FAQ',
  subtitle: 'Find answers to common questions about CannaGuide 2025.',
  sections: {
    general: {
      title: 'General Questions',
      faqs: [
        {
          q: 'What is CannaGuide 2025?',
          a: 'CannaGuide 2025 is a comprehensive tool for cannabis enthusiasts and cultivators. It allows you to explore strains, manage virtual plant grows, get AI-powered equipment recommendations, and learn about the cultivation process from seed to harvest.'
        },
        {
          q: 'Is this app for legal use only?',
          a: 'Yes. This application is intended as an educational and tracking tool for users in regions where cannabis cultivation is legal. Please always adhere to your local laws and regulations.'
        },
        {
          q: 'How is my data stored?',
          a: 'Your data is stored locally in your browser. Nothing is sent to a server. You can export your data for backup purposes in the Settings view.'
        }
      ]
    },
    strains: {
      title: 'Strains View',
      faqs: [
        {
          q: 'How do I add a custom strain?',
          a: 'In the Strains view, click the "Add Strain" button. A modal will appear where you can enter all the details for your custom strain. It will then appear under the "My Strains" tab.'
        },
        {
          q: 'What do the AI Grow Tips do?',
          a: 'In the strain detail view, you can request AI-generated tips. The AI analyzes the strain\'s characteristics and your specified goals (like maximizing yield) to provide tailored advice on nutrients, training, and environment.'
        }
      ]
    },
    plants: {
      title: 'Plants View',
      faqs: [
        {
          q: 'How do I start a new plant?',
          a: 'You can start a new grow in two ways: either by clicking an empty plant slot in the Plants view and selecting a strain, or by going to the Strains view, finding a strain you like, and clicking the "Start Growing" button.'
        },
        {
          q: 'What does "Simulate Next Day" do?',
          a: 'This button advances the simulation for all your active plants by one day. It updates their age, height, and vitals, and checks for any new problems or tasks based on their current state.'
        },
        {
          q: 'How does the AI Plant Doctor work?',
          a: 'You can upload a photo of a plant leaf or problem area. The AI will analyze the image and provide a potential diagnosis, along with recommended actions, long-term solutions, and prevention tips.'
        }
      ]
    },
    equipment: {
      title: 'Equipment View',
      faqs: [
        {
          q: 'How does the Setup Configurator work?',
          a: 'The configurator uses AI to generate a complete equipment list based on your needs. Simply select how many plants you want to grow and your preferred configuration style (e.g., value, balanced, premium), and the AI will provide a tailored recommendation.'
        },
        {
          q: 'Can I save the AI recommendations?',
          a: 'Yes. After a recommendation is generated, you can give it a name and save it. All your saved setups will appear in the "My Setups" tab for later reference.'
        }
      ]
    }
  }
};
