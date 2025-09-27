export const knowledgeView = {
  title: 'Knowledge Hub',
  subtitle: 'Deepen your knowledge with contextual articles and the AI Mentor.',
  aiMentor: {
    title: 'AI Mentor',
    plantContextSubtitle: 'Select one of your active plants to start a chat session with the AI Mentor. The mentor will use your plant\'s context (age, stage, etc.) for more precise advice.',
    startChat: 'Start Chat',
    startConversation: 'Start a conversation by typing a question below.',
    askAboutPlant: 'Ask something about {name}...',
    clearChat: 'Clear chat history',
    examplePrompts: {
      general: {
        q1: 'What is the difference between topping and FIMing?',
        q2: 'Explain VPD and why it is important.',
        q3: 'How do I properly flush my plants before harvest?',
      },
      plantSpecific: {
        q1: 'What are the ideal environmental conditions for my plant at its current stage?',
        q2: 'Based on my plant\'s age, what training techniques should I consider now?',
        q3: 'Are there any nutrient deficiencies I should look out for with this strain?',
      }
    }
  },
  hub: {
    selectPlant: 'Select Plant',
    noPlants: 'Start a grow to get contextual advice.',
    todaysFocus: 'Today\'s Focus for {plantName}',
    noRelevantArticles: 'No specifically relevant articles found for the current state of {plantName}.',
    browseAll: 'Browse All Articles',
    searchPlaceholder: 'Search articles by title or tags...',
  },
  archive: {
    title: 'Mentor Archive',
    queryLabel: 'Your Query',
    saveSuccess: 'Response successfully archived!',
    empty: 'No archived responses found.',
    editTitle: 'Edit Response'
  },
  knowledgebase: {
    'phase1-prep': {
      title: 'Phase 1: Preparation & Germination',
      content: '<h3>Preparation is Key</h3><p>Before your seed even touches soil, ensure your environment is ready. Clean your tent thoroughly. Check that your light, ventilation, and timers are working correctly. Prepare your medium (e.g., soil or coco) and make sure it is lightly moist but not soaked.</p><h3>Germination</h3><p>The simplest method is the paper towel method. Place your seed between two damp paper towels, and place those between two plates. Store in a warm, dark place (approx. 22-25°C / 72-77°F). Check daily. Once a small white taproot emerges (usually after 24-72 hours), it\'s time to plant.</p><h3>Planting</h3><p>Plant the germinated seed about 0.5-1 cm (0.25-0.5 inches) deep into your medium, root-tip down. Cover it gently. Keep the soil moist, not wet. High humidity (70-80%) is ideal at this stage. Your light should still be dimmed or at a greater distance to avoid burning the delicate seedling.</p>'
    },
    'phase2-seedling': {
      title: 'Phase 2: The Seedling Stage',
      content: '<h3>The First Leaves</h3><p>Your seedling will first develop a pair of round cotyledon leaves, followed by the first set of true, serrated leaves. This marks the beginning of the seedling stage. The plant is very fragile during this time.</p><h3>Light & Water</h3><p>Seedlings don\'t need a lot of light. A lower-wattage LED or a CFL bulb is sufficient, or your dimmable LED on a low setting (approx. 25-40%) at a distance of 40-60 cm (16-24 inches). Water carefully around the stem when the top inch of soil feels dry. Overwatering is the most common mistake at this stage. The pot should feel light before you water again.</p><h3>Environment</h3><p>Maintain high humidity (65-75%) and a stable temperature (20-25°C / 68-77°F). A small fan providing a gentle breeze (not aimed directly at the plant) will strengthen the stem.</p><h3>Nutrients</h3><p>Most soils have enough nutrients for the first 1-2 weeks. Only start with a very diluted nutrient solution (1/4 of the recommended dose) once the plant has developed 2-3 sets of true leaves.</p>'
    },
    'phase3-vegetative': {
      title: 'Phase 3: The Vegetative Stage',
      content: '<h3>Explosive Growth</h3><p>This is the phase of rapid growth. Your plant will develop many new leaves and branches. The light cycle should be set to 18 hours of light and 6 hours of darkness.</p><h3>Feeding & Watering</h3><p>Your plant is hungry now. Start with a nitrogen-rich vegetative fertilizer. Gradually increase the dose from 1/4 to the full recommended amount, monitoring the plant\'s reaction. Water thoroughly when the pot is light, ensuring good runoff (about 10-20% of the water should drain out the bottom).</p><h3>Training Techniques</h3><p>This is the ideal time for training. <strong>Topping:</strong> Cut off the topmost shoot to force the plant to develop two main colas. This promotes bushier growth. <strong>LST (Low Stress Training):</strong> Gently bend the branches down and tie them in place to create an even, flat canopy. This significantly improves light utilization.</p>'
    },
    'phase4-flowering': {
      title: 'Phase 4: The Flowering Stage',
      content: '<h3>Flipping the Switch</h3><p>To induce flowering, switch your light cycle to 12 hours of light and 12 hours of uninterrupted darkness. This signals to the plant that it\'s time to produce flowers.</p><h3>The Stretch</h3><p>In the first 2-3 weeks of flowering, your plant will stretch significantly, potentially doubling or even tripling in height. Plan for this space requirement.</p><h3>Nutrient Adjustment</h3><p>Switch to a flowering fertilizer that is lower in nitrogen (N) and higher in phosphorus (P) and potassium (K). This promotes the development of dense, resinous buds. Many growers add a PK booster in the mid-to-late flowering stage.</p><h3>Environmental Control</h3><p>Gradually lower the humidity to 40-50% to prevent mold. Good air circulation is now crucial.</p>'
    },
    'phase5-harvest': {
      title: 'Phase 5: Harvest, Drying & Curing',
      content: '<h3>When to Harvest?</h3><p>The best indicator is the trichomes (the small resin glands). Use a magnifying glass to look at them. Harvest when most trichomes are milky-white, with a few amber ones. Clear trichomes mean it\'s too early; too many amber ones will lead to a more sedative effect.</p><h3>Drying</h3><p>Cut the branches and hang them upside down in a dark room with a temperature of about 18-20°C (65-68°F) and a humidity of 50-60%. A slow dry over 7-14 days is ideal for preserving terpenes. The branches are ready when they snap instead of bending.</p><h3>Curing</h3><p>This is the most important step for quality. Cut the dried buds from the branches and place them in airtight jars (e.g., mason jars), filling them about 75% full. Open the jars several times a day for a few minutes during the first week ("burping"). After that, once a day is sufficient. Curing for at least 2-4 weeks drastically improves the taste and aroma.</p>'
    },
    'fix-overwatering': {
      title: 'Troubleshooting: Overwatering',
      content: '<h3>Symptoms</h3><p>Overwatered plants look droopy and wilted, but the leaves feel firm and are curled downwards. The soil is consistently wet and heavy. This is one of the most common beginner mistakes.</p><h3>Cause</h3><p>The roots are suffocating because water displaces oxygen in the medium. This can lead to root rot and nutrient lockout.</p><h3>Immediate Actions</h3><ol><li><strong>Stop Watering:</strong> Do not water the plant again until the pot feels significantly lighter and the top 1-2 inches of soil are completely dry.</li><li><strong>Improve Airflow:</strong> Aim a fan at the pot (not the plant) to help speed up evaporation.</li><li><strong>Ensure Drainage:</strong> Make sure the pot has plenty of drainage holes and is not sitting in a saucer of standing water.</li></ol><h3>Long-Term Solution</h3><p>Learn to judge the weight of your pot. Lift it when freshly watered and then again when it\'s dry. This difference is the best indicator of when to water again. It\'s better to water thoroughly but less frequently than a little bit often.</p>'
    },
    'fix-calcium-deficiency': {
      title: 'Troubleshooting: Calcium Deficiency',
      content: '<h3>Symptoms</h3><p>A calcium (Ca) deficiency typically appears on newer leaves in the upper part of the plant. Symptoms include rust-colored spots, stunted growth, curled or twisted new leaves, and weak stems.</p><h3>Causes</h3><ol><li><strong>Lack in Water/Nutrients:</strong> Especially when using reverse osmosis (RO) water or very soft water, a lack of calcium and magnesium (CalMag) can occur.</li><li><strong>pH Lockout:</strong> Calcium is best absorbed at a pH between 6.2 and 7.0 in soil. If the pH is too low, the plant cannot absorb the available calcium.</li><li><strong>Coco Coir Medium:</strong> Coco coir tends to bind calcium. A CalMag supplement is almost always necessary when growing in coco.</li></ol><h3>Solution</h3><ol><li><strong>Check pH:</strong> Measure the pH of your runoff water. If it is below 6.0, adjust the pH of your nutrient solution to around 6.5 until the runoff stabilizes.</li><li><strong>Add CalMag:</strong> Add a CalMag supplement to your nutrient solution according to the manufacturer\'s instructions. Start with half a dose to avoid over-fertilizing.</li><li><strong>Foliar Feeding:</strong> For a quick fix, you can spray a highly diluted CalMag solution directly onto the leaves (not under full light intensity).</li></ol>'
    }
  }
};

export const tipOfTheDay = {
  title: 'Tip of the Day',
  tips: [
    "Overwatering is one of the most common beginner mistakes. Lift your pots to feel their weight—only water when they feel significantly lighter.",
    "Calibrate your pH meter regularly to ensure accurate nutrient uptake.",
    "A gentle, constant airflow in your tent strengthens your plants' stems and helps prevent mold.",
    "Low Stress Training (LST) during the vegetative stage can significantly increase your yield by exposing more bud sites to light.",
    "Watch the trichomes with a magnifier to determine the perfect harvest time. Milky white trichomes indicate peak potency.",
    "A slow dry and proper cure are crucial for the final taste and quality of your product. Don't skip these steps!",
    "Less is often more when it comes to nutrients. Start with a half dose and increase slowly to avoid nutrient burn.",
    "VPD (Vapor Pressure Deficit) is an advanced but important metric. Balancing temperature and humidity optimizes plant health.",
    "Keep a detailed grow journal. It will help you learn from successes and mistakes and refine your methods."
  ]
};
