import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "himalayan-kush",
        "name": "Himalayan Kush",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Himalayan Landrace",
        "floweringType": "Photoperiod",
        "thc": 18,
        "cbd": 1,
        "thcRange": "16-20%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Earthy", "Woody", "Sweet", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "double-burger",
        "name": "Double Burger",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "GMO Cookies x Donny Burger",
        "floweringType": "Photoperiod",
        "thc": 28,
        "cbd": 1,
        "thcRange": "25-31%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Garlic", "Diesel", "Pungent", "Earthy"],
        "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "lemon-pebbles",
        "name": "Lemon Pebbles",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Fruity Pebbles OG x Lemon Kush",
        "floweringType": "Photoperiod",
        "thc": 23,
        "cbd": 1,
        "thcRange": "20-26%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Lemon", "Fruity", "Sweet", "Citrus"],
        "dominantTerpenes": ["Limonene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "orange-apricot",
        "name": "Orange Apricot",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Orange Juice x Apricot Helix",
        "floweringType": "Photoperiod",
        "thc": 24,
        "cbd": 1,
        "thcRange": "22-26%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Orange", "Apricot", "Sweet", "Citrus"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    })
];