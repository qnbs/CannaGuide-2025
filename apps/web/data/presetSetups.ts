import type { SavedSetup } from '@/types'

// ---------------------------------------------------------------------------
// Pre-configured standard grow setups -- researched for 2025/2026 market
// Covers: Micro -> Small -> Medium -> Large, Beginner -> Expert,
//         Soil, Coco, Hydro, Autoflower-optimized, Stealth, Budget
// All prices in EUR, realistic 2025 market rates (EU online retail)
// ---------------------------------------------------------------------------

export type PresetCategory = 'micro' | 'small' | 'medium' | 'large' | 'specialty'

export interface PresetSetup extends Omit<SavedSetup, 'id' | 'createdAt'> {
    presetId: string
    category: PresetCategory
    tags: string[]
    difficulty: 'beginner' | 'intermediate' | 'expert'
}

export const PRESET_SETUPS: PresetSetup[] = [
    // ---- MICRO (< 60x60) ----
    {
        presetId: 'preset-micro-stealth',
        name: 'Micro Stealth (40x40)',
        category: 'micro',
        tags: ['stealth', 'autoflower', 'beginner', '1-plant'],
        difficulty: 'beginner',
        totalCost: 195,
        sourceDetails: {
            plantCount: '1',
            experience: 'beginner',
            budget: 200,
            priorities: ['stealth', 'easeOfUse'],
            customNotes: '',
            growSpace: { width: 40, depth: 40 },
            floweringTypePreference: 'autoflower',
        },
        recommendation: {
            tent: {
                name: 'Secret Jardin Hydro Shoot 40 (40x40x120cm)',
                price: 45,
                rationale:
                    'Ultra-compact stealth tent with lightproof zippers. Fits in a wardrobe or corner. 600D Oxford fabric.',
            },
            light: {
                name: 'Spider Farmer SF300 (33W LED)',
                price: 40,
                watts: 33,
                rationale:
                    'Low-power full-spectrum LED, perfect for a single autoflower. Minimal heat output for small spaces.',
            },
            ventilation: {
                name: '100mm Inline Fan + Carbon Filter Kit',
                price: 35,
                rationale:
                    'Compact 100mm fan with carbon filter eliminates odor completely. Essential for stealth grows.',
            },
            circulationFan: {
                name: 'USB Clip Fan 15cm',
                price: 10,
                rationale: 'Small clip-on fan for air circulation. Prevents mold in tight spaces.',
            },
            pots: {
                name: '7L Fabric Pot (1x)',
                price: 5,
                rationale: 'Air-pruning fabric pot, ideal size for autoflowers in micro spaces.',
            },
            soil: {
                name: 'BioBizz Light Mix 20L',
                price: 12,
                rationale:
                    'Light pre-fertilized organic soil. Gentle for seedlings, easy for beginners.',
            },
            nutrients: {
                name: 'BioBizz Try-Pack Indoor',
                price: 18,
                rationale:
                    'Starter nutrient trio (Bio-Grow, Bio-Bloom, Top-Max). Covers full autoflower cycle.',
            },
            extra: {
                name: 'pH Test Kit + Timer',
                price: 30,
                rationale:
                    'Basic pH test drops and a mechanical timer for light schedule. Essentials for any grow.',
            },
            proTip: 'For stealth: run lights during nighttime to mask heat signature and reduce fan noise during the day. Autoflowers finish in 70-80 days from seed.',
        },
    },

    // ---- SMALL (60x60) ----
    {
        presetId: 'preset-small-beginner',
        name: 'Beginner Soil (60x60)',
        category: 'small',
        tags: ['beginner', 'soil', '1-plant', 'budget'],
        difficulty: 'beginner',
        totalCost: 310,
        sourceDetails: {
            plantCount: '1',
            experience: 'beginner',
            budget: 350,
            priorities: ['easeOfUse'],
            customNotes: '',
            growSpace: { width: 60, depth: 60 },
            floweringTypePreference: 'any',
        },
        recommendation: {
            tent: {
                name: 'Mars Hydro 60x60x150cm Grow Tent',
                price: 55,
                rationale:
                    'Reliable entry-level tent with high-reflectivity Mylar interior. Diamond pattern for even light distribution.',
            },
            light: {
                name: 'Mars Hydro TS 600 (100W LED)',
                price: 60,
                watts: 100,
                rationale:
                    'Full-spectrum Samsung LM301B diodes. Excellent PAR output for 60x60cm footprint.',
            },
            ventilation: {
                name: 'AC Infinity CLOUDLINE T4 (100mm)',
                price: 80,
                rationale:
                    'Whisper-quiet 100mm inline fan with built-in temperature/humidity controller. Auto speed adjustment.',
                manufacturer: 'AC Infinity',
            },
            circulationFan: {
                name: 'Secret Jardin Monkey Fan 20cm',
                price: 18,
                rationale:
                    'Clip-on oscillating fan for pole mounting inside the tent. Good airflow at low noise.',
            },
            pots: {
                name: '11L Fabric Pot (1x)',
                price: 6,
                rationale:
                    'Air-pruning fabric pot for healthy root development. Standard size for 60x60 single plant.',
            },
            soil: {
                name: 'Plagron Royalmix 25L',
                price: 14,
                rationale:
                    'Pre-fertilized premium soil with perlite. Feeds plants for 3-4 weeks without extra nutrients. Beginner-friendly.',
            },
            nutrients: {
                name: 'Plagron Terra Grow + Bloom Set',
                price: 22,
                rationale:
                    'Simple 2-part mineral nutrient system for soil. Easy dosing charts. Covers veg + flower.',
            },
            extra: {
                name: 'Bluelab pH Pen + Thermometer/Hygrometer',
                price: 55,
                rationale:
                    'Digital pH pen for accurate readings + combo environmental sensor. Monitor is key to success.',
            },
            proTip: 'Start with 18/6 light for photoperiod or 20/4 for autoflowers. Switch to 12/12 to trigger flowering for photoperiod strains. Keep pH between 6.0-6.5 in soil.',
        },
    },

    {
        presetId: 'preset-small-auto',
        name: 'Autoflower Express (60x60)',
        category: 'small',
        tags: ['autoflower', 'beginner', 'fast', '2-plant'],
        difficulty: 'beginner',
        totalCost: 345,
        sourceDetails: {
            plantCount: '2',
            experience: 'beginner',
            budget: 350,
            priorities: ['easeOfUse', 'yield'],
            customNotes: '',
            growSpace: { width: 60, depth: 60 },
            floweringTypePreference: 'autoflower',
        },
        recommendation: {
            tent: {
                name: 'Secret Jardin Dark Street 60 (60x60x170cm)',
                price: 65,
                rationale:
                    'Taller version for autoflower stretch. Quality zippers, tool pouch, multiple ducting ports.',
            },
            light: {
                name: 'Spider Farmer SF1000 (100W LED)',
                price: 80,
                watts: 100,
                rationale:
                    'Samsung LM301B diodes with MeanWell driver. Dimmable 0-100%. Excellent spectrum for autoflowers.',
                manufacturer: 'Spider Farmer',
            },
            ventilation: {
                name: 'AC Infinity CLOUDLINE T4 + Carbon Filter',
                price: 95,
                rationale:
                    'Smart controller fan with programmable temp/humidity targets. Activated carbon filter for full odor control.',
            },
            circulationFan: {
                name: 'Clip Fan 15cm Oscillating',
                price: 15,
                rationale:
                    'Basic oscillating clip fan. Keeps air moving between two plants to strengthen stems.',
            },
            pots: {
                name: '7L Fabric Pots (2x)',
                price: 8,
                rationale:
                    '7L is the sweet spot for autoflowers. Two pots for two plants, root air-pruning prevents circling.',
            },
            soil: {
                name: 'BioBizz All-Mix 50L',
                price: 18,
                rationale:
                    'Hot soil with microbial activity. Pre-amended for 4+ weeks of feeding. Great for autoflowers that skip transplanting.',
            },
            nutrients: {
                name: 'BioBizz Starter Pack',
                price: 25,
                rationale:
                    'Complete organic feed line (Grow, Bloom, Top-Max, Root-Juice). Gentle dosing for autos.',
            },
            extra: {
                name: 'pH Kit + Digital Timer + Plant Ties',
                price: 39,
                rationale:
                    'pH drops, smart timer for 20/4 light schedule, and LST clips for low-stress training.',
            },
            proTip: 'Autoflowers do not need a light change to flower. Run 20/4 or 18/6 from seed to harvest. Start nutrients at 50% strength -- autoflowers are sensitive to overfeeding.',
        },
    },

    // ---- MEDIUM (80x80) ----
    {
        presetId: 'preset-medium-soil',
        name: 'Standard Soil (80x80)',
        category: 'medium',
        tags: ['soil', 'intermediate', '2-plant', 'quality'],
        difficulty: 'intermediate',
        totalCost: 520,
        sourceDetails: {
            plantCount: '2',
            experience: 'intermediate',
            budget: 550,
            priorities: ['quality', 'yield'],
            customNotes: '',
            growSpace: { width: 80, depth: 80 },
            floweringTypePreference: 'photoperiod',
        },
        recommendation: {
            tent: {
                name: 'Mars Hydro 80x80x180cm Grow Tent',
                price: 70,
                rationale:
                    'Popular mid-size tent. 1680D Oxford exterior, Diamond Mylar interior. Multiple ventilation ports.',
            },
            light: {
                name: 'Mars Hydro TSW 2000 (300W LED)',
                price: 160,
                watts: 300,
                rationale:
                    'Full-spectrum quantum board with Samsung LM301B diodes. 300W true draw covers 80x80 perfectly at flower.',
                manufacturer: 'Mars Hydro',
            },
            ventilation: {
                name: 'AC Infinity CLOUDLINE T6 (150mm) + Filter',
                price: 120,
                rationale:
                    '150mm fan for excellent airflow in 80x80 space. Smart controller with alarms. Premium carbon filter included.',
            },
            circulationFan: {
                name: 'Secret Jardin Monkey Fan 30cm',
                price: 25,
                rationale:
                    'Larger oscillating fan for 80x80 canopy coverage. Pole-mount keeps floor space clear.',
            },
            pots: {
                name: '15L Fabric Pots (2x)',
                price: 12,
                rationale:
                    '15L gives photoperiod plants room for 4-6 week veg cycle. Root air-pruning for vigorous growth.',
            },
            soil: {
                name: 'Canna Terra Professional Plus 50L',
                price: 20,
                rationale:
                    'Premium coco/peat blend with perlite. Buffered and pH-stable. Industry standard for indoor grows.',
            },
            nutrients: {
                name: 'Canna Terra Vega + Flores + Boost',
                price: 55,
                rationale:
                    '3-part mineral system by Canna. Precise NPK ratios for each phase. Proven results in soil grows.',
                manufacturer: 'Canna',
            },
            extra: {
                name: 'Bluelab pH Pen + EC Pen + Scrog Net',
                price: 58,
                rationale:
                    'Digital pH + EC meters for precise feeding. Scrog net maximizes light coverage across the canopy.',
            },
            proTip: 'Use the scrog net during early flower to create an even canopy. Tuck branches under the net weekly during stretch. This maximizes yield per watt.',
        },
    },

    {
        presetId: 'preset-medium-coco',
        name: 'Coco Coir Performance (80x80)',
        category: 'medium',
        tags: ['coco', 'intermediate', '3-plant', 'yield'],
        difficulty: 'intermediate',
        totalCost: 580,
        sourceDetails: {
            plantCount: '3',
            experience: 'intermediate',
            budget: 600,
            priorities: ['yield', 'quality'],
            customNotes: '',
            growSpace: { width: 80, depth: 80 },
            floweringTypePreference: 'photoperiod',
        },
        recommendation: {
            tent: {
                name: 'Secret Jardin Dark Room 80 (80x80x180cm)',
                price: 85,
                rationale:
                    'Professional-grade tent with sturdy metal frame. Lightproof double-stitched zippers. Excellent for coco grows needing drainage.',
            },
            light: {
                name: 'Lumatek ATS 300W Pro LED',
                price: 190,
                watts: 300,
                rationale:
                    'Top-tier full-spectrum bar-style LED. Osram diodes. Uniform PPFD distribution. Dimmable with external controller support.',
                manufacturer: 'Lumatek',
            },
            ventilation: {
                name: 'AC Infinity CLOUDLINE T6 + Carbon Filter Kit',
                price: 120,
                rationale:
                    'Reliable 150mm extraction with smart controller. Essential for managing coco humidity levels.',
            },
            circulationFan: {
                name: 'Oscillating Tower Fan 40cm',
                price: 30,
                rationale:
                    'Floor-standing oscillating tower fan. Better coverage than clip fans for 3-plant canopy.',
            },
            pots: {
                name: '11L Coco Slab Pots (3x) + Saucers',
                price: 15,
                rationale:
                    '11L pots with drainage saucers. Coco requires frequent fertigation with runoff collection.',
            },
            soil: {
                name: 'Canna Coco Professional Plus 50L',
                price: 18,
                rationale:
                    'Pre-buffered RHP-certified coco coir. Low EC, consistent fiber structure. Industry gold standard.',
                manufacturer: 'Canna',
            },
            nutrients: {
                name: 'Canna Coco A+B + CalMag + PK 13/14',
                price: 65,
                rationale:
                    'Complete coco nutrition: base A+B for all phases, CalMag for coco CEC, PK booster for heavy flowering.',
            },
            extra: {
                name: 'Bluelab Truncheon EC + pH Pen + Drip Tray',
                price: 57,
                rationale:
                    'EC/pH measurement essential for coco. Drip tray for runoff management. Target 10-20% runoff per feeding.',
            },
            proTip: 'Coco is forgiving but hungry. Feed 2-3 times daily in flower with 10-20% runoff. Never let coco dry out completely. EC drift between input and runoff tells you if plants are eating or building salt.',
        },
    },

    // ---- LARGE (100x100 / 120x120) ----
    {
        presetId: 'preset-large-yield',
        name: 'High-Yield Pro (120x120)',
        category: 'large',
        tags: ['yield', 'expert', '3-plant', 'photoperiod'],
        difficulty: 'expert',
        totalCost: 1050,
        sourceDetails: {
            plantCount: '3',
            experience: 'expert',
            budget: 1100,
            priorities: ['yield', 'quality'],
            customNotes: '',
            growSpace: { width: 120, depth: 120 },
            floweringTypePreference: 'photoperiod',
        },
        recommendation: {
            tent: {
                name: 'Gorilla Grow Tent 120x120x240cm',
                price: 180,
                rationale:
                    'Premium 1680D tent with height extension kit. Infrared-blocking roof insert. Metal interlocking frame for maximum stability.',
                manufacturer: 'Gorilla Grow Tent',
            },
            light: {
                name: 'Lumatek ZEUS 600W Pro LED',
                price: 380,
                watts: 600,
                rationale:
                    'Professional 8-bar LED with Osram white + red diodes. 2.7 umol/J efficiency. IP65 rated. Perfect for 120x120 flower.',
                manufacturer: 'Lumatek',
            },
            ventilation: {
                name: 'AC Infinity CLOUDLINE S6 + Carbon Filter + Ducting',
                price: 140,
                rationale:
                    'High-CFM 150mm extraction system with smart controller Pro. Handles heat from 600W LED with ease.',
            },
            circulationFan: {
                name: '2x Secret Jardin Monkey Fan 30cm',
                price: 45,
                rationale:
                    'Two oscillating fans for proper circulation under a dense 120x120 canopy. Prevents microclimates.',
            },
            pots: {
                name: '20L Fabric Pots (3x)',
                price: 18,
                rationale:
                    '20L gives photoperiods ample root space for 6+ week veg. Maximizes yield potential per plant.',
            },
            soil: {
                name: 'Gold Label Special Mix 45L + Perlite 10L',
                price: 35,
                rationale:
                    'Professional coarse-fiber coco/peat blend with added perlite for drainage. Excellent aeration.',
            },
            nutrients: {
                name: 'Advanced Nutrients pH Perfect Sensi Grow/Bloom + Big Bud + Overdrive',
                price: 120,
                rationale:
                    'Auto-pH-adjusting 2-part base nutrients plus bloom boosters. Premium line for maximum yield.',
                manufacturer: 'Advanced Nutrients',
            },
            extra: {
                name: 'Bluelab Guardian + Trellis Net + Climate Controller',
                price: 132,
                rationale:
                    'Continuous pH/EC/Temp monitoring. Double trellis net for scrog. Inkbird climate controller for fan/heater automation.',
            },
            proTip: 'In large tents, CO2 supplementation can boost yields 20-30%. Keep VPD at 0.8-1.2 kPa in flower. Use the double-scrog technique: first net at 30cm for horizontal training, second net at 60cm for bud support.',
        },
    },

    {
        presetId: 'preset-large-led-premium',
        name: 'Premium LED Garden (100x100)',
        category: 'large',
        tags: ['quality', 'expert', '3-plant', 'premium'],
        difficulty: 'expert',
        totalCost: 920,
        sourceDetails: {
            plantCount: '3',
            experience: 'expert',
            budget: 1000,
            priorities: ['quality', 'energy'],
            customNotes: '',
            growSpace: { width: 100, depth: 100 },
            floweringTypePreference: 'photoperiod',
        },
        recommendation: {
            tent: {
                name: 'Secret Jardin Dark Room DR100 (100x100x200cm)',
                price: 110,
                rationale:
                    'Professional tent with durable Mylar lining, reinforced frame, and multiple intake/exhaust ports.',
            },
            light: {
                name: 'Sanlight EVO 4-100 (250W LED)',
                price: 330,
                watts: 250,
                manufacturer: 'Sanlight',
                rationale:
                    'Swiss-engineered passive-cooled LED. 3.0 umol/J efficiency. Uniform light spread with secondary optics. Zero fan noise.',
            },
            ventilation: {
                name: 'AC Infinity CLOUDLINE T6 + Charcoal Filter',
                price: 120,
                rationale:
                    'Smart 150mm extraction handles the 100x100 volume. Temperature/humidity based auto-speed.',
            },
            circulationFan: {
                name: 'Clip Fan 20cm + Floor Fan 30cm',
                price: 35,
                rationale:
                    'Dual-fan setup: overhead clip fan for canopy strengthening plus floor fan for lower airflow.',
            },
            pots: {
                name: '15L Airpots (3x)',
                price: 30,
                rationale:
                    'Airpots with side perforations for superior air-pruning. Produces incredibly dense root systems.',
            },
            soil: {
                name: 'Biobizz Light-Mix 50L + Worm Humus 10L',
                price: 28,
                rationale:
                    'Living soil approach: light base amended with worm castings for beneficial microbes. Enhanced terpene production.',
            },
            nutrients: {
                name: 'Green House Feeding Bio Line (Grow + Bloom + Enhancer)',
                price: 45,
                rationale:
                    'Organic powder nutrients -- dissolve in water. Highly concentrated, long shelf life. Quality-focused terpene enhancement.',
            },
            extra: {
                name: 'Apera PH60 + AC Infinity Controller 69 + Trellis',
                price: 222,
                rationale:
                    'Lab-grade pH meter, smart climate controller with data logging, and cannabis-specific trellis net.',
            },
            proTip: 'For maximum terpene production, reduce temperatures to 18-20C during the last 2 weeks of flower and increase the dark period to 14 hours. UV-B supplementation for the last 3 weeks can increase resin production.',
        },
    },

    // ---- SPECIALTY ----
    {
        presetId: 'preset-hydro-dwc',
        name: 'DWC Hydro Starter (60x60)',
        category: 'specialty',
        tags: ['hydro', 'DWC', 'intermediate', '1-plant'],
        difficulty: 'intermediate',
        totalCost: 395,
        sourceDetails: {
            plantCount: '1',
            experience: 'intermediate',
            budget: 400,
            priorities: ['yield', 'quality'],
            customNotes: '',
            growSpace: { width: 60, depth: 60 },
            floweringTypePreference: 'photoperiod',
        },
        recommendation: {
            tent: {
                name: 'Mars Hydro 60x60x150cm',
                price: 55,
                rationale:
                    'Compact tent suitable for a single DWC bucket. Waterproof floor tray included.',
            },
            light: {
                name: 'Spider Farmer SF1000D (100W LED)',
                price: 90,
                watts: 100,
                rationale:
                    'Dimmable full-spectrum LED with Samsung diodes. Daisy-chainable for future expansion.',
                manufacturer: 'Spider Farmer',
            },
            ventilation: {
                name: 'AC Infinity CLOUDLINE T4 + Carbon Filter',
                price: 95,
                rationale:
                    'Essential for humidity control in DWC grows. Smart speed controller prevents condensation on reservoir.',
            },
            circulationFan: {
                name: 'Clip Fan 15cm',
                price: 12,
                rationale:
                    'Basic circulation to prevent mold above the water surface. Strengthens stems.',
            },
            pots: {
                name: 'DWC Bucket 20L + Net Pot 15cm + Air Stone',
                price: 25,
                rationale:
                    'Complete DWC setup: food-grade bucket, mesh net pot for hydroton, and large air stone for oxygenation.',
            },
            soil: {
                name: 'Hydroton Clay Pebbles 10L',
                price: 12,
                rationale:
                    'Expanded clay aggregate for net pot support. pH-neutral, reusable, provides excellent root aeration.',
            },
            nutrients: {
                name: 'General Hydroponics Flora Series (Micro+Grow+Bloom)',
                price: 35,
                rationale:
                    'The industry-standard 3-part hydro nutrient system. Precise control over NPK ratios. NASA-tested formula.',
                manufacturer: 'GHE',
            },
            extra: {
                name: 'Bluelab pH Pen + EC Pen + Air Pump (4W)',
                price: 71,
                rationale:
                    'pH/EC monitoring is non-negotiable in hydro. Air pump runs 24/7 to oxygenate the reservoir.',
            },
            proTip: 'Change reservoir water weekly and maintain pH 5.5-6.0. Water temperature must stay 18-22C -- use frozen water bottles if needed. DWC can produce 2-3x the yield of soil in the same space.',
        },
    },

    {
        presetId: 'preset-budget-ultra',
        name: 'Ultra Budget (60x60)',
        category: 'small',
        tags: ['budget', 'beginner', '1-plant', 'minimal'],
        difficulty: 'beginner',
        totalCost: 180,
        sourceDetails: {
            plantCount: '1',
            experience: 'beginner',
            budget: 200,
            priorities: ['easeOfUse'],
            customNotes: '',
            growSpace: { width: 60, depth: 60 },
            floweringTypePreference: 'autoflower',
        },
        recommendation: {
            tent: {
                name: 'Generic 60x60x140cm Grow Tent',
                price: 35,
                rationale:
                    'Affordable entry-level tent. Functional but not premium -- expect basic zippers and thin fabric. Gets the job done.',
            },
            light: {
                name: 'Viparspectra P600 (75W LED)',
                price: 45,
                watts: 75,
                rationale:
                    'Budget-friendly LED with full spectrum. Not the highest efficiency but delivers usable PPFD for 60x60.',
            },
            ventilation: {
                name: '100mm Inline Fan + Basic Carbon Filter',
                price: 30,
                rationale:
                    'No-frills extraction. Manual speed controller. Gets odor under control on a tight budget.',
            },
            circulationFan: {
                name: 'USB Desk Fan',
                price: 8,
                rationale:
                    'Cheapest working circulation option. Position at canopy level for stem strengthening.',
            },
            pots: {
                name: '10L Plastic Pot with Drainage',
                price: 3,
                rationale:
                    'Standard nursery pot with drainage holes. Not fancy but functional for a first grow.',
            },
            soil: {
                name: 'Local Garden Center Potting Mix 20L + Perlite 5L',
                price: 10,
                rationale:
                    'Budget soil option: mix standard potting soil with 30% perlite for drainage improvement.',
            },
            nutrients: {
                name: 'General Hydroponics FloraSeries Starter',
                price: 22,
                rationale:
                    'Affordable 3-part nutrient at half the price of premium brands. Works in soil at reduced strength.',
            },
            extra: {
                name: 'pH Test Drops + Mechanical Timer',
                price: 27,
                rationale:
                    'Bare minimum monitoring: liquid pH test kit and a simple outlet timer for light schedules.',
            },
            proTip: 'Budget growing is totally viable. Focus on environment over fancy gear: consistent temperature (22-26C), proper pH (6.0-6.5), and do not overwater. A cheap setup with good technique beats expensive gear with poor care.',
        },
    },

    {
        presetId: 'preset-organic-living-soil',
        name: 'Organic Living Soil (80x80)',
        category: 'medium',
        tags: ['organic', 'intermediate', '2-plant', 'quality'],
        difficulty: 'intermediate',
        totalCost: 490,
        sourceDetails: {
            plantCount: '2',
            experience: 'intermediate',
            budget: 500,
            priorities: ['quality'],
            customNotes: '',
            growSpace: { width: 80, depth: 80 },
            floweringTypePreference: 'photoperiod',
        },
        recommendation: {
            tent: {
                name: 'Mars Hydro 80x80x180cm',
                price: 70,
                rationale:
                    'Solid mid-range tent for organic living soil grows. Good ventilation port options for passive intake.',
            },
            light: {
                name: 'Spider Farmer SE3000 (300W LED)',
                price: 170,
                watts: 300,
                rationale:
                    'Bar-style LED with Samsung LM301B + Osram red diodes. Even canopy coverage ideal for organic multi-plant setups.',
                manufacturer: 'Spider Farmer',
            },
            ventilation: {
                name: 'AC Infinity CLOUDLINE T4 + Carbon Filter',
                price: 95,
                rationale:
                    'Smart controller for consistent VPD management. Carbon filter handles organic grow odors.',
            },
            circulationFan: {
                name: 'Oscillating Clip Fan 20cm',
                price: 18,
                rationale:
                    'Gentle oscillating airflow to strengthen stems without disrupting beneficial soil microbes.',
            },
            pots: {
                name: '25L Fabric Pots (2x)',
                price: 16,
                rationale:
                    'Large fabric pots for living soil -- the microbiome needs volume. Air-pruning keeps roots healthy.',
            },
            soil: {
                name: 'BioTabs Starterkit (25L Soil + Amendments)',
                price: 40,
                rationale:
                    'Complete organic soil kit: pre-mixed living soil with slow-release pellets, mycorrhiza, and beneficial bacteria.',
                manufacturer: 'BioTabs',
            },
            nutrients: {
                name: 'BioTabs PK Booster Compost Tea + Orgatrex',
                price: 35,
                rationale:
                    'Compost tea for bloom boost, liquid organic supplement. The soil microbiome does the heavy lifting.',
            },
            extra: {
                name: 'Soil pH Meter + Worm Castings 5L + Mulch Layer',
                price: 46,
                rationale:
                    'Soil pH probe (not liquid), worm castings for top-dressing, and straw mulch to retain moisture and feed soil life.',
            },
            proTip: 'Living soil is "water only" after setup -- the microbiome breaks down organic matter into plant-available nutrients. Top-dress with worm castings every 2-3 weeks. Avoid chemical pH adjusters -- they kill beneficial microbes. Terpene profiles from organic grows are noticeably richer.',
        },
    },

    {
        presetId: 'preset-energy-efficient',
        name: 'Energy Saver (80x80)',
        category: 'medium',
        tags: ['energy', 'intermediate', '2-plant', 'autoflower'],
        difficulty: 'intermediate',
        totalCost: 460,
        sourceDetails: {
            plantCount: '2',
            experience: 'intermediate',
            budget: 500,
            priorities: ['energy', 'easeOfUse'],
            customNotes: '',
            growSpace: { width: 80, depth: 80 },
            floweringTypePreference: 'autoflower',
        },
        recommendation: {
            tent: {
                name: 'Mars Hydro 80x80x180cm',
                price: 70,
                rationale:
                    'Standard 80x80 tent. Energy efficiency comes from lighting and schedule choices, not the tent.',
            },
            light: {
                name: 'Sanlight EVO 3-60 (190W LED)',
                price: 230,
                watts: 190,
                manufacturer: 'Sanlight',
                rationale:
                    'Ultra-efficient 3.0 umol/J passive-cooled LED. Zero fan noise, zero driver heat. Saves on electricity and cooling.',
            },
            ventilation: {
                name: 'AC Infinity CLOUDLINE T4 ECO',
                price: 70,
                rationale:
                    'Low-power brushless motor fan. Minimal electricity draw while maintaining adequate airflow.',
            },
            circulationFan: {
                name: 'USB Clip Fan 15cm (2W)',
                price: 12,
                rationale:
                    'Ultra-low power USB fan. Combined with efficient LED, total system power stays under 200W.',
            },
            pots: {
                name: '11L Fabric Pots (2x)',
                price: 10,
                rationale:
                    'Standard fabric pots. Slightly smaller for autoflowers to keep root zone manageable.',
            },
            soil: {
                name: 'Plagron Royalmix 50L',
                price: 18,
                rationale:
                    'Pre-fertilized soil reduces nutrient mixing energy. Less water heating needed vs. hydro.',
            },
            nutrients: {
                name: 'Plagron Alga Grow + Bloom (Organic)',
                price: 28,
                rationale:
                    'Seaweed-based organic nutrients. Simple 2-part system minimizes mixing complexity.',
            },
            extra: {
                name: 'Kill-A-Watt Power Meter + pH Kit + Timer',
                price: 22,
                rationale:
                    'Power meter tracks actual electricity usage. pH drops and timer keep things simple and efficient.',
            },
            proTip: 'Autoflowers under 18/6 light consume 25% less electricity than 20/4 with minimal yield difference. This setup runs under 200W total -- about 3.6 kWh/day at 18h. At EU average electricity rates, that is roughly 30-35 EUR/month.',
        },
    },

    {
        presetId: 'preset-full-spectrum-120',
        name: 'Full Spectrum Pro (120x120)',
        category: 'large',
        tags: ['expert', '3-plant', 'photoperiod', 'premium', 'yield'],
        difficulty: 'expert',
        totalCost: 1280,
        sourceDetails: {
            plantCount: '3',
            experience: 'expert',
            budget: 1300,
            priorities: ['yield', 'quality'],
            customNotes: '',
            growSpace: { width: 120, depth: 120 },
            floweringTypePreference: 'photoperiod',
        },
        recommendation: {
            tent: {
                name: 'Gorilla Grow Tent 4x4 (120x120x210cm + Extension)',
                price: 190,
                rationale:
                    'Top-of-the-line tent with height extension to 280cm. Diamond reflective interior, infrared blocking, industrial zippers.',
                manufacturer: 'Gorilla Grow Tent',
            },
            light: {
                name: 'Lumatek ZEUS 600W Pro 2.9 LED',
                price: 400,
                watts: 600,
                rationale:
                    'Professional 8-bar fixture with Osram LEDs. 2.9 umol/J. External dimmable driver. IP65 water-resistant for humid environments.',
                manufacturer: 'Lumatek',
            },
            ventilation: {
                name: 'AC Infinity CLOUDLINE S8 (200mm) + Carbon Filter + Ducting',
                price: 170,
                rationale:
                    '200mm high-CFM extraction for large tent + 600W heat load. Smart controller Pro with data logging.',
            },
            circulationFan: {
                name: '2x Oscillating Wall Fan 30cm + 1x Floor Fan',
                price: 55,
                rationale:
                    'Triple-fan circulation: two wall-mounted for canopy movement, one floor fan for lower stem strengthening and CO2 distribution.',
            },
            pots: {
                name: '25L Fabric Pots (3x) + Drip Trays',
                price: 25,
                rationale:
                    'Large 25L fabric pots for extended veg photoperiod grows. Drip trays for runoff collection.',
            },
            soil: {
                name: 'Canna Coco Professional Plus 50L x2',
                price: 32,
                rationale:
                    'Running coco in a big tent for maximum control and yield. Two 50L bags cover three 25L pots.',
                manufacturer: 'Canna',
            },
            nutrients: {
                name: 'Canna Coco A+B + Rhizotonic + Cannazym + PK 13/14 + Boost',
                price: 140,
                rationale:
                    'Complete Canna professional line: base nutrients, root stimulator, enzyme cleaner, PK booster, and metabolic enhancer.',
                manufacturer: 'Canna',
            },
            extra: {
                name: 'Bluelab Guardian Monitor + Trellis Net + CO2 Bag + Inkbird Controller',
                price: 268,
                rationale:
                    'Continuous monitoring station, double trellis, passive CO2 enrichment bag, and climate automation controller.',
            },
            proTip: 'In a 120x120 with 600W, you are pushing serious photon density. Maintain VPD at 1.0-1.4 kPa in late flower. Defoliation at day 21 and day 42 of flower opens bud sites. With this setup, 600-800g dry per cycle is achievable.',
        },
    },
]

export const PRESET_CATEGORIES: Record<PresetCategory, { order: number }> = {
    micro: { order: 1 },
    small: { order: 2 },
    medium: { order: 3 },
    large: { order: 4 },
    specialty: { order: 5 },
}
