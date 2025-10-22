import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "gorilla-butter",
        "name": "Gorilla Butter",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Gorilla Glue #4 x Peanut Butter Breath",
        "floweringType": "Photoperiod",
        "thc": 26,
        "cbd": 1,
        "thcRange": "24-28%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Earthy", "Nutty", "Diesel", "Chocolate"],
        "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "killer-new-haven",
        "name": "Killer New Haven",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Connecticut Heirloom",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Short",
            "yieldDetails": { "indoor": "350-450 g/m²", "outdoor": "400-500 g/plant" },
            "heightDetails": { "indoor": "70-110 cm", "outdoor": "90-140 cm" }
        },
        "aromas": ["Earthy", "Pungent", "Spicy", "Hash"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "lilly",
        "name": "Lilly",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 90% / Indica 10%",
        "genetics": "Queen Mother x Congo",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "120-180 cm", "outdoor": ">200 cm" }
        },
        "aromas": ["Pineapple", "Tropical", "Sweet", "Fruity"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Ocimene"]
    }),
    createStrainObject({
        "id": "lucifer-og",
        "name": "Lucifer OG",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Hell's OG x SFV OG IBL",
        "floweringType": "Photoperiod",
        "thc": 25,
        "cbd": 1,
        "thcRange": "22-28%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "100-160 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Lemon", "Pine", "Diesel", "Earthy"],
        "dominantTerpenes": ["Limonene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "nepalese-sativa",
        "name": "Nepalese Sativa",
        "type": StrainType.Sativa,
        "typeDetails": "Sativa 100%",
        "genetics": "Nepalese Landrace",
        "floweringType": "Photoperiod",
        "thc": 18,
        "cbd": 1,
        "thcRange": "16-20%",
        "cbdRange": "<1%",
        "floweringTime": 11,
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Tall",
            "yieldDetails": { "indoor": "350-450 g/m²", "outdoor": "400-500 g/plant" },
            "heightDetails": { "indoor": "160-220 cm", "outdoor": ">250 cm" }
        },
        "aromas": ["Sweet", "Herbal", "Spicy", "Earthy"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Caryophyllene"]
    })
];