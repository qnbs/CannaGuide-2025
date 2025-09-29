export const helpView = {
  title: 'Help & Support',
  subtitle: 'Find answers to your questions and learn more about cultivation.',
  tabs: {
    faq: 'FAQ',
    guides: 'Visual Guides',
    lexicon: 'Lexicon',
  },
  faq: {
    title: 'Frequently Asked Questions',
    searchPlaceholder: 'Search questions...',
    noResults: 'No results found for "{{term}}".',
  },
  guides: {
    title: 'Visual Guides',
  },
  lexicon: {
    title: 'Grower\'s Lexicon',
    searchPlaceholder: 'Search terms...',
    noResults: 'No terms found for "{{term}}".',
    categories: {
      all: 'All',
      cannabinoid: 'Cannabinoids',
      terpene: 'Terpenes',
      flavonoid: 'Flavonoids',
      general: 'General',
    },
    cannabinoids: {
      thc: { term: 'THC (Tetrahydrocannabinol)', definition: 'The most well-known and primary psychoactive cannabinoid in cannabis, responsible for the "high" sensation.' },
      cbd: { term: 'CBD (Cannabidiol)', definition: 'A non-psychoactive cannabinoid known for its therapeutic properties, including analgesic and anti-inflammatory effects.' },
      cbg: { term: 'CBG (Cannabigerol)', definition: 'A non-psychoactive cannabinoid often referred to as the "mother of all cannabinoids" because it is a precursor to THC and CBD.' },
      cbn: { term: 'CBN (Cannabinol)', definition: 'A mildly psychoactive cannabinoid that forms as THC degrades. It is known for its sedative properties.' },
      cbc: { term: 'CBC (Cannabichromene)', definition: 'A non-psychoactive cannabinoid that shows potential for anti-inflammatory and pain-relieving effects.' },
      thca: { term: 'THCA (Tetrahydrocannabinolic Acid)', definition: 'The non-psychoactive, acidic precursor to THC found in raw cannabis. It converts to THC through heat (decarboxylation).' },
      cbda: { term: 'CBDA (Cannabidiolic Acid)', definition: 'The acidic precursor to CBD found in raw cannabis. It has its own potential therapeutic effects, particularly anti-inflammatory.' },
      thcv: { term: 'THCV (Tetrahydrocannabivarin)', definition: 'A cannabinoid structurally similar to THC but with different effects. It is known to be an appetite suppressant and can be psychoactive in high doses.' },
      cbdv: { term: 'CBDV (Cannabidivarin)', definition: 'A non-psychoactive cannabinoid structurally similar to CBD, being studied for its potential in treating neurological conditions.' },
    },
    terpenes: {
      myrcene: { term: 'Myrcene', definition: 'A common terpene with an earthy, musky aroma. Also found in mangoes. Known for its calming and relaxing properties.' },
      limonene: { term: 'Limonene', definition: 'A terpene with a strong citrus aroma. It is known for its mood-elevating and stress-relieving effects.' },
      caryophyllene: { term: 'Caryophyllene', definition: 'A terpene with a spicy, peppery aroma. It is the only terpene that can also bind to cannabinoid receptors and has anti-inflammatory properties.' },
      pinene: { term: 'Pinene', definition: 'A terpene with a fresh pine aroma. It may promote alertness and has anti-inflammatory properties.' },
      linalool: { term: 'Linalool', definition: 'A terpene with a floral, lavender-like aroma. It is known for its calming, anti-anxiety, and sleep-promoting effects.' },
      terpinolene: { term: 'Terpinolene', definition: 'A terpene with a complex, fruity-floral aroma. It often has a slightly uplifting effect and antioxidant properties.' },
      humulene: { term: 'Humulene', definition: 'A terpene with an earthy, woody aroma, also found in hops. It is known for its anti-inflammatory and appetite-suppressant properties.' },
      ocimene: { term: 'Ocimene', definition: 'A terpene with a sweet, herbaceous, and woody aroma. It can have uplifting effects and is studied for its antiviral properties.' },
      bisabolol: { term: 'Bisabolol', definition: 'A terpene with a light, sweet, floral aroma, also found in chamomile. It is known for its anti-inflammatory and skin-soothing properties.' },
      nerolidol: { term: 'Nerolidol', definition: 'A terpene with a woody, floral aroma reminiscent of tree bark. It has sedative and anti-anxiety properties.' },
    },
    flavonoids: {
      cannaflavin: { term: 'Cannaflavins (A, B, C)', definition: 'A group of flavonoids found exclusively in cannabis. They have potent anti-inflammatory properties.' },
      quercetin: { term: 'Quercetin', definition: 'A flavonoid found in many fruits and vegetables. It is a powerful antioxidant with antiviral properties.' },
      kaempferol: { term: 'Kaempferol', definition: 'A flavonoid with strong antioxidant properties that may help prevent oxidative stress.' },
      apigenin: { term: 'Apigenin', definition: 'A flavonoid with anti-anxiety and sedative properties, also found in chamomile.' },
      luteolin: { term: 'Luteolin', definition: 'A flavonoid with antioxidant and anti-inflammatory properties.' },
      orientin: { term: 'Orientin', definition: 'A flavonoid with antioxidant, anti-inflammatory, and potential antibiotic properties.' },
      vitexin: { term: 'Vitexin', definition: 'A flavonoid that may exhibit pain-relieving and antioxidant effects.' },
    },
    general: {
      phValue: { term: 'pH Value', definition: 'A measure of the acidity or alkalinity of a solution. In cannabis cultivation, a correct pH is crucial for nutrient uptake.' },
      ecValue: { term: 'EC (Electrical Conductivity)', definition: 'A measure of the total amount of dissolved salts (nutrients) in a solution. It helps monitor nutrient concentration.' },
      vpd: { term: 'VPD (Vapor Pressure Deficit)', definition: 'A measure of the combined pressure of temperature and humidity on the plant. An optimal VPD value allows for efficient transpiration.' },
      trichomes: { term: 'Trichomes', definition: 'The small, resinous glands on the flowers and leaves of cannabis that produce cannabinoids and terpenes. Their color is a key indicator of maturity.' },
      topping: { term: 'Topping', definition: 'A training technique where the top tip of the plant is cut off to encourage the growth of two new main colas, creating a bushier shape.' },
      fimming: { term: 'FIM (F*ck I Missed)', definition: 'A technique similar to topping, but where only part of the tip is removed, often resulting in four or more new main shoots.' },
      lst: { term: 'LST (Low-Stress Training)', definition: 'A training technique where branches are gently bent down and tied, creating a wider, flatter canopy and maximizing light exposure.' },
      lollipopping: { term: 'Lollipopping', definition: 'The removal of lower leaves and small shoots that receive little light to focus the plant\'s energy on the upper, larger flowers.' },
      scrog: { term: 'SCROG (Screen of Green)', definition: 'An advanced training technique where a net or screen is placed over the plants to guide the shoots horizontally, creating an even, productive canopy.' },
      sog: { term: 'SOG (Sea of Green)', definition: 'A cultivation method where many small plants are grown closely together and quickly sent into flowering to achieve a fast and high-yielding harvest.' },
      curing: { term: 'Curing', definition: 'The process of storing dried cannabis flowers in airtight containers to break down chlorophyll and improve the taste, aroma, and smoothness of the smoke.' },
      nutrientLockout: { term: 'Nutrient Lockout', definition: 'A state where the plant cannot absorb available nutrients due to an incorrect pH in the root zone, even if they are present.' },
      flushing: { term: 'Flushing', definition: 'The practice of watering the plant with pure, pH-adjusted water in the last one to two weeks before harvest to remove excess nutrient salts from the medium and the plant.' },
      phenotype: { term: 'Phenotype', definition: 'The observable characteristics of a plant (appearance, smell, effect) that result from the interaction of its genotype and the environment.' },
      genotype: { term: 'Genotype', definition: 'The genetic makeup of a plant, which determines its potential for certain traits.' },
      landrace: { term: 'Landrace', definition: 'A pure, original cannabis variety that has naturally adapted and stabilized in a specific geographic region over a long period.' },
    },
  },
};

export const visualGuides = {
  topping: {
    title: 'Topping',
    description: 'Learn how to cut the top of your plant to encourage bushier growth and more main colas.',
  },
  lst: {
    title: 'Low-Stress Training (LST)',
    description: 'Bend and tie down your plant\'s branches to open up the canopy and maximize light exposure.',
  },
  defoliation: {
    title: 'Defoliation',
    description: 'Strategically remove leaves to improve airflow and allow more light to reach lower bud sites.',
  },
  harvesting: {
    title: 'Harvesting',
    description: 'Identify the perfect time to harvest to maximize the potency and aroma of your buds.',
  },
};

export const faq = {
  phValue: {
    question: 'Why is pH value so important?',
    answer: 'The pH of your water and medium determines how well your plant can absorb nutrients. An incorrect pH leads to nutrient lockout, even if enough nutrients are present. For soil, the ideal range is 6.0-6.8; for hydro/coco, it\'s 5.5-6.5.',
  },
  yellowLeaves: {
    question: 'What do yellow leaves mean?',
    answer: 'Yellow leaves (chlorosis) can have many causes. If they start at the bottom and move up, it\'s often a nitrogen deficiency. Spots can indicate a calcium or magnesium deficiency. Over or underwatering can also cause yellow leaves. Always check pH and watering habits first.',
  },
  whenToHarvest: {
    question: 'When do I know it\'s time to harvest?',
    answer: 'The best indicator is the trichomes (the small resin crystals on the buds). Use a magnifier. The harvest is optimal when most trichomes are milky-white with a few amber ones. Clear trichomes are too early; too many amber trichomes will lead to a more sedative effect.',
  },
  lightDistanceSeedling: {
    question: 'How far should my light be from seedlings?',
    answer: 'This depends heavily on the light type and wattage. A good rule of thumb for most LED lights is a distance of 45-60 cm (18-24 inches). Observe your seedlings closely. If they stretch too much (become long and thin), the light is too far. If the leaves show signs of burning or bleaching, it\'s too close.',
  },
  whenToFeed: {
    question: 'When should I start feeding nutrients?',
    answer: 'Most pre-fertilized soils have enough nutrients for the first 2-3 weeks. For seedlings, wait until they have 3-4 sets of true leaves before starting with a very weak nutrient solution (1/4 of the recommended dose). Observe the plant\'s reaction before increasing the dosage.'
  },
  npkMeaning: {
    question: 'What do the N-P-K values on fertilizers mean?',
    answer: 'N-P-K stands for the three primary macronutrients: Nitrogen (N), Phosphorus (P), and Potassium (K). <strong>N (Nitrogen)</strong> is mainly responsible for leaf and stem growth (vegetative phase). <strong>P (Phosphorus)</strong> is crucial for root development and flower production. <strong>K (Potassium)</strong> strengthens overall plant health and flower quality.'
  },
  calmagUsage: {
    question: 'What is Cal-Mag and when do I need it?',
    answer: 'Cal-Mag is a supplement that provides Calcium and Magnesium. These secondary nutrients are crucial but are sometimes not adequately covered by base fertilizers. You often need it when using filtered/RO water or growing in coco coir, as this medium tends to bind calcium. Symptoms of a deficiency are often small, rust-brown spots on the leaves.'
  },
  flushingPlants: {
    question: 'What does "flushing" mean and do I have to do it?',
    answer: 'Flushing means watering the plant with only pure, pH-adjusted water for the last 1-2 weeks before harvest. The goal is to remove excess nutrient salts from the medium and the plant, which is said to result in a cleaner, smoother final product. It is a common practice, especially with mineral fertilizers.'
  },
  vpdImportance: {
    question: 'What is VPD and why is it important?',
    answer: 'VPD stands for Vapor Pressure Deficit and is a more accurate measure of the optimal ratio of temperature to humidity than relative humidity alone. A correct VPD value allows the plant to transpire optimally (to "sweat"), promoting nutrient uptake and growth. Too high a VPD (too dry) stresses the plant, while too low a VPD (too humid) increases the risk of mold.'
  },
  idealTempHumidity: {
    question: 'What are the ideal temperature and humidity levels?',
    answer: 'This varies by phase: <br><strong>Seedlings:</strong> 22-25°C (72-77°F), 70-80% RH. <br><strong>Vegetative:</strong> 22-28°C (72-82°F), 50-60% RH. <br><strong>Flowering:</strong> 20-26°C (68-79°F), 40-50% RH. <br>Try to avoid large fluctuations between light and dark periods.'
  },
  airCirculation: {
    question: 'How important is air circulation?',
    answer: 'Extremely important. A light, constant breeze from an oscillating fan has several benefits: it strengthens the stems, prevents mold and pests, ensures even gas exchange on the leaves, and helps to avoid hot and humid spots in the tent.'
  },
  nutrientBurn: {
    question: 'What are burnt leaf tips?',
    answer: 'Brown, dry, and "burnt" leaf tips are a classic sign of nutrient burn (over-fertilization). The plant is taking up more nutrients than it can process, and the salts accumulate in the leaf tips. Reduce the fertilizer concentration at the next feeding or flush the medium with pH-adjusted water.'
  },
  spiderMites: {
    question: 'How do I recognize and combat spider mites?',
    answer: 'Spider mites are tiny pests that live on the underside of leaves. The first signs are small white or yellow dots on the top of the leaf. In a severe infestation, fine webs will form. They multiply quickly in warm, dry environments. To combat them, you can use neem oil or insecticidal soap solutions. Predatory mites are a good biological control method.'
  },
  stretchingCauses: {
    question: 'Why is my plant stretching so much?',
    answer: 'Excessive stretching (long internodal spacing) is usually caused by a lack of light. The plant is trying to grow closer to the light source. Make sure your lamp is powerful enough for your area and is at the correct distance. High temperatures can also contribute to stretching.'
  },
  toppingVsFimming: {
    question: 'What is the difference between Topping and FIMing?',
    answer: 'Both are "high-stress training" methods to make the plant bushier. With <strong>Topping</strong>, the main shoot is completely cut off, resulting in two new main shoots. With <strong>FIMing</strong>, about 80% of the new shoot is pinched off, which can result in four or more new shoots. Topping is more precise, while FIMing can produce more, but often more uneven, shoots.'
  },
  whatIsScrog: {
    question: 'What is a SCROG?',
    answer: 'SCROG (Screen of Green) is a growing technique where a net or screen is stretched over the plants. As the plant grows, the shoots are tucked under the net and guided horizontally. This creates a very wide, flat, and even canopy where all the flowers receive optimal light, which can lead to maximum yields.'
  },
  whatIsLollipopping: {
    question: 'What is Lollipopping?',
    answer: 'Lollipopping is the removal of the lower shoots and leaves that receive little to no light. By removing these "unnecessary" plant parts, the plant directs all its energy to the upper, light-exposed flowers (colas), resulting in larger and denser main buds. This is typically done shortly before or at the beginning of the flowering phase.'
  },
  dryingDuration: {
    question: 'How long should I dry my buds?',
    answer: 'The goal is a slow and even drying process. Hang the branches in a dark room at about 18-20°C (64-68°F) and 55-60% humidity. This usually takes 7-14 days. A good test is to bend a small twig: if it snaps but doesn\'t break, the buds are ready for curing.'
  },
  curingImportance: {
    question: 'What is curing and why is it important?',
    answer: 'Curing is the process of maturing the dried flowers in airtight jars. During this time, enzymes and bacteria break down chlorophyll and other undesirable substances. This significantly improves the taste and aroma, makes the smoke smoother, and can even increase potency. It is a crucial step for a high-quality end product.'
  },
  storageHarvest: {
    question: 'How should I store my harvested buds?',
    answer: 'Store your fully cured buds in airtight glass jars in a cool, dark, and dry place. Light, air, high temperatures, and humidity are the biggest enemies of cannabinoids and terpenes. A humidity level of 58-62% in the jar is considered ideal and can be maintained with special humidity packs.'
  },
  autoflowerVsPhotoperiod: {
    question: 'Autoflower vs. Photoperiod: What\'s the difference?',
    answer: '<strong>Photoperiod</strong> plants need a change in the light cycle (to 12 hours of darkness per day) to start flowering. They have a longer vegetative phase and can grow larger. <strong>Autoflower</strong> plants automatically flower after a certain time (about 3-4 weeks), regardless of the light cycle. They are faster to finish and stay smaller, making them ideal for beginners or small spaces.'
  },
  howOftenToWater: {
    question: 'How often should I water?',
    answer: 'There is no fixed rule, as it depends on pot size, plant size, temperature, and medium. The best method is to lift the pot and feel the weight. Water thoroughly until some water runs out the bottom, then wait until the pot is significantly lighter again. Stick a finger about 2-3 cm (1 inch) deep into the soil; if it comes out dry, it\'s time to water.'
  },
  potSize: {
    question: 'What pot size should I use?',
    answer: 'The pot size depends on the desired final size of your plant. A general guideline: for every 30 cm (1 foot) of plant height, you need about 4 liters (1 gallon) of pot volume. Common sizes are 11-19 liters (3-5 gallons) for medium-sized indoor plants. Larger pots need to be watered less frequently but also dry out more slowly.'
  }
};