import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "sophisticated-lady",
        "name": "Sophisticated Lady",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Ghost OG x Grateful Breath",
        "floweringType": "Photoperiod",
        "thc": 24,
        "cbd": 1,
        "thcRange": "22-26%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Floral", "Earthy", "Sweet", "Diesel"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "black-banana",
        "name": "Black Banana",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Banana Fire Cookies x Black Dawg",
        "floweringType": "Photoperiod",
        "thc": 28,
        "cbd": 1,
        "thcRange": "25-32%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Banana", "Sweet", "Diesel", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    }),
    createStrainObject({
        "id": "lemon-cooler",
        "name": "Lemon Cooler",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "Lemon Tree x Cookies and Cream",
        "floweringType": "Photoperiod",
        "thc": 22.5,
        "cbd": 1,
        "thcRange": "20-25%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Lemon", "Citrus", "Sweet", "Creamy"],
        "dominantTerpenes": ["Limonene", "Caryophyllene", "Myrcene"]
    })
];