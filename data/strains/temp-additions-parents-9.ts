import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "champagne",
        "name": "Champagne",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "Hashplant x Kush",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Grape", "Earthy", "Floral"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    }),
    createStrainObject({
        "id": "chemdawg-sour-diesel",
        "name": "Chemdawg Sour Diesel",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Chemdawg x Sour Diesel",
        "floweringType": "Photoperiod",
        "thc": 24,
        "cbd": 1,
        "thcRange": "22-26%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall"
        },
        "aromas": ["Diesel", "Pungent", "Earthy", "Sour"],
        "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "chimera-2",
        "name": "Chimera #2",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "White Truffle x The Creature",
        "floweringType": "Photoperiod",
        "thc": 27.5,
        "cbd": 1,
        "thcRange": "25-30%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Fruity", "Butter", "Orange"],
        "dominantTerpenes": ["Limonene", "Caryophyllene", "Myrcene"]
    }),
    createStrainObject({
        "id": "congo-3",
        "name": "Congo #3",
        "type": StrainType.Sativa,
        "typeDetails": "Sativa 100%",
        "genetics": "Congolese Landrace",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 11,
        "floweringTimeRange": "10-12",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Tall"
        },
        "aromas": ["Fruity", "Spicy", "Earthy", "Sweet"],
        "dominantTerpenes": ["Myrcene", "Terpinolene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "congo-pointe-noire",
        "name": "Congo Pointe Noire",
        "type": StrainType.Sativa,
        "typeDetails": "Sativa 100%",
        "genetics": "Congolese Landrace",
        "floweringType": "Photoperiod",
        "thc": 21,
        "cbd": 1,
        "thcRange": "19-23%",
        "cbdRange": "<1%",
        "floweringTime": 12,
        "floweringTimeRange": "11-13",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Tall"
        },
        "aromas": ["Woody", "Spicy", "Incense", "Haze"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Pinene"]
    }),
    createStrainObject({
        "id": "cookie-monster",
        "name": "Cookie Monster",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "GSC x OG Kush",
        "floweringType": "Photoperiod",
        "thc": 24,
        "cbd": 1,
        "thcRange": "22-26%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Mint", "Woody", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    })
];