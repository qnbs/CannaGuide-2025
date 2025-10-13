import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "han-solo-hash-plant",
        "name": "Han-Solo Hash Plant",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "(King x Hash Plant) x (G13 x Hash Plant)",
        "floweringType": "Photoperiod",
        "thc": 27,
        "cbd": 1,
        "thcRange": "25-29%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "A potent indica-dominant hybrid known for its relaxing, heavy effects. It boasts a classic, pungent aroma profile of earth, spice, and traditional hash. It is a key parent strain of Hash Burger.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "90-140 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Earthy", "Spicy", "Hash", "Pungent"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    }),
    createStrainObject({
        "id": "hawaiian",
        "name": "Hawaiian",
        "type": StrainType.Sativa,
        "typeDetails": "Sativa 100%",
        "genetics": "Hawaiian Landrace",
        "floweringType": "Photoperiod",
        "thc": 21,
        "cbd": 1,
        "thcRange": "18-24%",
        "cbdRange": "<1%",
        "floweringTime": 11,
        "floweringTimeRange": "10-12",
        "description": "A classic sativa landrace from the volcanic soils of Hawaii. It delivers a quintessential sativa high: energetic, creative, and happy, perfect for daytime activities. The aroma is a sweet and tropical blend of pineapple and citrus.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Tall",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "500-600 g/plant" },
            "heightDetails": { "indoor": "150-200 cm", "outdoor": ">200 cm" }
        },
        "aromas": ["Tropical", "Pineapple", "Sweet", "Citrus"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Pinene"]
    }),
    createStrainObject({
        "id": "high-country-diesel",
        "name": "High Country Diesel",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "OG Kush x Granddaddy Purple (presumed)",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "A sativa-dominant hybrid with a strong diesel aroma and uplifting effects. It provides a surge of energy and euphoria, making it a key parent to the popular Jet Fuel (G6) strain.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "120-180 cm", "outdoor": "150-200 cm" }
        },
        "aromas": ["Diesel", "Pungent", "Earthy", "Sweet"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    }),
    createStrainObject({
        "id": "ice-2",
        "name": "Ice #2",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Unknown",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "Ice #2 is a select indica-dominant phenotype known for its heavy resin production and relaxing effects. It is a crucial parent strain for Papaya, contributing its sweet, earthy aroma and calming high.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "90-140 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Sweet", "Earthy", "Spicy", "Pungent"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "juanita-la-lagrimosa",
        "name": "Juanita la Lagrimosa",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 75% / Indica 25% (CBD Rich)",
        "genetics": "Queen Mother x (Mexican x Afghani)",
        "floweringType": "Photoperiod",
        "thc": 10,
        "cbd": 12,
        "thcRange": "8-12%",
        "cbdRange": "10-15%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "A pioneering CBD-rich strain from Spain, often with a 1:1 THC:CBD ratio. 'Juanita the Tearful' provides a clear-headed, functional effect with significant therapeutic benefits, making it ideal for managing anxiety and pain without a strong high. Its aroma is citrusy and hazy. It is a parent of Dance World.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium",
            "yieldDetails": { "indoor": "450-550 g/m²", "outdoor": "500-600 g/plant" },
            "heightDetails": { "indoor": "100-160 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Citrus", "Haze", "Spicy", "Fruity"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "juicy-fruit",
        "name": "Juicy Fruit",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "Afghani x Thai",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "A classic hybrid from the 1970s, also known as Fruity Juice. It is famous for its sweet, fruity aroma reminiscent of tropical punch and berries. The effect is uplifting and euphoric, with a gentle body buzz. It is a parent of Orange Cream Sicle.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "120-180 cm", "outdoor": "150-200 cm" }
        },
        "aromas": ["Tropical", "Sweet", "Fruity", "Berry"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    })
];
