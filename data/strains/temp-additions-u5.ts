import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "u-dub",
        "name": "U-Dub",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "OG Kush x Hindu Kush (presumed)",
        "floweringType": "Photoperiod",
        "thc": 24,
        "cbd": 1,
        "thcRange": "22-26%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Earthy", "Pine", "Pungent", "Skunk"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Limonene"]
    }),
    createStrainObject({
        "id": "ultima",
        "name": "Ultima",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Sativa x Indica cross",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Fruity", "Sweet", "Earthy", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "ultra-sour",
        "name": "Ultra Sour",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "MK Ultra x Sour Diesel",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall"
        },
        "aromas": ["Sour", "Diesel", "Pine", "Citrus"],
        "dominantTerpenes": ["Terpinolene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "urkle",
        "name": "Urkle",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Mendocino Purps phenotype",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Low",
            "height": "Short"
        },
        "aromas": ["Grape", "Sweet", "Berry", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "utopia-haze",
        "name": "Utopia Haze",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 90% / Indica 10%",
        "genetics": "Brazilian Sativa Landrace",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 10.5,
        "floweringTimeRange": "10-11",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall"
        },
        "aromas": ["Fruity", "Mint", "Spicy", "Citrus"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Pinene"]
    })
];
