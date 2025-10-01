import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "dream-star",
        "name": "Dream Star",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 50% Sativa / 50% Indica",
        "genetics": "Blue Dream x Stardawg",
        "floweringType": "Photoperiod",
        "thc": 23,
        "cbd": 1,
        "thcRange": "20-26%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Fruity", "Berry", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "early-girl",
        "name": "Early Girl",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 75% / Sativa 25%",
        "genetics": "Afghani x Indian Indica x Mexican Sativa",
        "floweringType": "Photoperiod",
        "thc": 15,
        "cbd": 1,
        "thcRange": "12-18%",
        "cbdRange": "<1%",
        "floweringTime": 7.5,
        "floweringTimeRange": "7-8",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Sweet", "Citrus", "Hash", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "erdpurt",
        "name": "Erdpurt",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Erdbeer x Purpurea Ticinensis",
        "floweringType": "Photoperiod",
        "thc": 10,
        "cbd": 5,
        "thcRange": "8-12%",
        "cbdRange": "4-8%",
        "floweringTime": 7.5,
        "floweringTimeRange": "7-8",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Earthy", "Fruity", "Strawberry", "Sweet"],
        "dominantTerpenes": ["Myrcene", "Linalool", "Pinene"]
    }),
    createStrainObject({
        "id": "ethos-glue",
        "name": "Ethos Glue",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "Gorilla Glue #4 Bx3",
        "floweringType": "Photoperiod",
        "thc": 29,
        "cbd": 1,
        "thcRange": "28-30%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Diesel", "Chocolate", "Pine", "Earthy"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    }),
    createStrainObject({
        "id": "florida-kush",
        "name": "Florida Kush",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "LA Kush Cake x Triangle Kush",
        "floweringType": "Photoperiod",
        "thc": 25,
        "cbd": 1,
        "thcRange": "22-28%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Earthy", "Pungent", "Citrus", "Herbal"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "forum-cut-cookies",
        "name": "Forum Cut Cookies",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 75% / Indica 25%",
        "genetics": "GSC (clone-only phenotype)",
        "floweringType": "Photoperiod",
        "thc": 25,
        "cbd": 1,
        "thcRange": "22-28%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Earthy", "Nutty", "Mint"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    })
];