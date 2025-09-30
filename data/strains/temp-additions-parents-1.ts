import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "cherry-cookies",
        "name": "Cherry Cookies",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Cherry Pie x GSC",
        "floweringType": "Photoperiod",
        "thc": 23,
        "cbd": 1,
        "thcRange": "20-26%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Cherry", "Sweet", "Berry", "Earthy"],
        "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "the-menthol",
        "name": "The Menthol",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Gelato 45 x (White Diesel x (High Octane x Jet Fuel))",
        "floweringType": "Photoperiod",
        "thc": 25,
        "cbd": 1,
        "thcRange": "22-28%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Mint", "Chemical", "Diesel", "Menthol"],
        "dominantTerpenes": ["Limonene", "Caryophyllene", "Myrcene"]
    }),
    createStrainObject({
        "id": "og-kush-breath",
        "name": "OG Kush Breath",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "GSC (phenotype)",
        "floweringType": "Photoperiod",
        "thc": 27,
        "cbd": 1,
        "thcRange": "24-30%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Low",
            "height": "Short"
        },
        "aromas": ["Earthy", "Nutty", "Sweet", "Vanilla"],
        "dominantTerpenes": ["Limonene", "Caryophyllene", "Myrcene"]
    }),
    createStrainObject({
        "id": "white-fire-alien-og",
        "name": "White Fire Alien OG",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "The White x Fire Alien Kush",
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
        "aromas": ["Lemon", "Earthy", "Pungent", "Diesel"],
        "dominantTerpenes": ["Limonene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "grape-gasoline",
        "name": "Grape Gasoline",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Grape Pie x Jet Fuel Gelato",
        "floweringType": "Photoperiod",
        "thc": 25,
        "cbd": 1,
        "thcRange": "23-28%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Grape", "Diesel", "Sweet", "Pungent"],
        "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    })
];