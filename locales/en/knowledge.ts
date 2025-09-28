export const knowledgeView = {
  title: 'Knowledge Hub',
  subtitle: 'Master the art of cultivation with interactive guides and AI-powered assistance.',
  tabs: {
    mentor: 'AI Mentor',
    guide: 'Guide',
    archive: 'Archive',
    breeding: 'Breeding Lab',
  },
  aiMentor: {
    title: 'Socratic Gardener',
    plantContext: 'Chatting with the AI Mentor about {name}',
    plantContextSubtitle: 'Select one of your active plants to get contextual advice.',
    inputPlaceholder: 'Ask a question about your plant...',
    startChat: 'Start Chat',
    clearChat: 'Clear Chat',
    clearConfirm: 'Are you sure you want to clear the entire chat history for this plant?',
    showChart: 'Show {chartName} Chart',
    examplePrompts: [
        'What is the biggest issue you see?',
        'How can I improve my yield based on this data?',
        'Explain my current VPD to me.',
        'Should I start training?',
    ]
  },
  hub: {
    selectPlant: 'Select Plant',
    noPlants: 'You have no active plants. Start a grow to use the AI Mentor.',
    todaysFocus: 'Today\'s Focus for {plantName}',
    browseAll: 'Browse All Guides',
  },
  archive: {
    title: 'Mentor Archive',
    empty: 'You haven\'t archived any mentor responses yet.',
    saveButton: 'Save to Archive',
    saveSuccess: 'Response archived successfully.',
    queryLabel: 'Your Query',
    editTitle: 'Edit Response',
  },
  guide: {
    progress: 'Progress',
  },
  breeding: {
    title: 'Breeding Lab',
    description: 'Cross two of your collected seeds to create a new, unique strain. The quality of the parents influences the outcome.',
    noSeeds: 'No Seeds Collected',
    noSeedsDesc: 'Seeds can be collected from plants harvested with exceptionally high quality.',
    selectParentA: 'Select Parent A',
    selectParentB: 'Select Parent B',
    parentSelected: '{name} selected',
    newStrainPlaceholder: 'New strain name...',
    breedButton: 'Breed Strain',
    breedSuccess: 'Successfully bred new strain "{name}" and added it to "My Strains"!',
    quality: 'Quality',
  },
  knowledgebase: {
    'phase1-prep': {
      title: 'Phase 1: Preparation & Germination',
      content: '<h3>Preparation</h3><p>The key to a successful grow is solid preparation. Ensure your tent is clean, your lights are at the correct height, and your ventilation is set for a constant, gentle air exchange.</p><h3>Germination</h3><p>Germination is the first step in your plant\'s life. The paper towel method is popular: place the seed between two damp paper towels and keep them warm and dark. Within a few days, the taproot should appear.</p>'
    },
    'phase2-seedling': {
      title: 'Phase 2: Seedling',
      content: '<h3>Handle with Care</h3><p>Seedlings are delicate. They need high humidity (60-70%) and moderate light (around 200-400 PPFD) to avoid getting burnt. Water sparingly around the stem to encourage roots to spread out.</p>'
    },
    'phase3-vegetative': {
      title: 'Phase 3: Vegetative Growth',
      content: '<h3>Time to Grow!</h3><p>The plant grows rapidly in this phase. Increase light intensity (400-600 PPFD) and start with a nitrogen-rich nutrient regimen. This is also the ideal time for training techniques like topping or LST to shape the plant\'s structure.</p>'
    },
    'phase4-flowering': {
      title: 'Phase 4: Flowering',
      content: '<h3>The Bloom Begins</h3><p>Switch the light cycle to 12/12 to induce flowering. The plant will stretch in the first few weeks. Switch to a phosphorus and potassium-rich bloom nutrient (PK). Be sure to lower humidity (40-50%) to prevent mold.</p>'
    },
    'phase5-harvest': {
      title: 'Phase 5: Harvest, Dry & Cure',
      content: '<h3>The Finishing Touches</h3><p>Harvest when the trichomes are mostly milky. Hang the branches upside down in a dark, cool room with good air circulation to dry (approx. 7-14 days). Then, cure the buds in airtight jars, burping them daily. This greatly improves flavor and potency.</p>'
    },
    'fix-overwatering': {
      title: 'Problem: Overwatering',
      content: '<h3>Symptoms</h3><p>Droopy, limp leaves that feel heavy and "full". The soil remains damp for a long time.</p><h3>Solution</h3><p>Allow the soil to dry out completely before watering again. Improve pot drainage and ensure good air circulation to aid evaporation.</p>'
    },
    'fix-calcium-deficiency': {
      title: 'Problem: Calcium Deficiency',
      content: '<h3>Symptoms</h3><p>Rust-colored spots on the leaves, often starting on younger leaves. Stunted growth.</p><h3>Solution</h3><p>Use a Cal-Mag supplement. Ensure the pH of your water is in the correct range (around 6.0-6.5 for soil), as incorrect pH can lock out calcium uptake.</p>'
    }
  }
};

export const tipOfTheDay = {
    tips: [
        "Check the pH of your water daily. It's the key to nutrient uptake.",
        "Good air circulation prevents mold and pests.",
        "Less is often more, especially with nutrients. Start with a lower dose than recommended.",
        "Low-Stress Training (LST) can significantly increase your yield without stressing the plant.",
        "Watch the trichome color to determine the perfect harvest time: milky for a potent high, amber for a more relaxing effect.",
        "Curing is crucial for the flavor and quality of your harvest. Don't skip this step!",
        "A stable climate is more important than high temperatures. Avoid large fluctuations."
    ],
    title: 'Tip of the Day'
};