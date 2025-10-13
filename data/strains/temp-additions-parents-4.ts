import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "purple-elephant",
        "name": "Purple Elephant",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 85% / Sativa 15%",
        "genetics": "Purple Urkle (presumed)",
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
        "aromas": ["Grape", "Berry", "Sweet", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "gupta-kush",
        "name": "Gupta Kush",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 100%",
        "genetics": "Ghost OG x (likely another OG Kush phenotype)",
        "floweringType": "Photoperiod",
        "thc": 22.5,
        "cbd": 1,
        "thcRange": "20-25%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Earthy", "Pine", "Spicy", "Pungent"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    }),
    createStrainObject({
        "id": "blue-moonshine",
        "name": "Blue Moonshine",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 100%",
        "genetics": "Blueberry phenotype",
        "floweringType": "Photoperiod",
        "thc": 17.5,
        "cbd": 1,
        "thcRange": "15-20%",
        "cbdRange": "<1%",
        "floweringTime": 7.5,
        "floweringTimeRange": "7-8",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Blueberry", "Berry", "Sweet", "Fruity"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    })
];