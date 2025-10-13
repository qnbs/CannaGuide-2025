import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "gelato-45",
        "name": "Gelato #45",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "Sunset Sherbet x Thin Mint GSC",
        "floweringType": "Photoperiod",
        "thc": 23,
        "cbd": 1,
        "thcRange": "20-26%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "description": "Gelato #45, often referred to simply as 'Gelato 45', is a popular indica-dominant phenotype of the Gelato line. It is known for its strong, relaxing effects and a sweet, earthy aroma with hints of lavender and citrus. This strain is a parent to Project 4516 and Tiramisu, passing on its potent effects and complex flavor profile.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "450-550 g/m²", "outdoor": "500-600 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Earthy", "Sweet", "Lavender", "Citrus"],
        "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "gelatti",
        "name": "Gelatti",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Gelato x Biscotti",
        "floweringType": "Photoperiod",
        "thc": 24,
        "cbd": 1,
        "thcRange": "21-27%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "description": "Gelatti is a balanced hybrid strain known for its potent effects and unique gassy, sweet flavor profile. A cross between Gelato and Biscotti, it delivers a powerful high that is both relaxing and uplifting. It is a parent to modern popular strains like Apples and Bananas and Georgia Pie.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "100-160 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Sweet", "Fruity", "Diesel", "Earthy"],
        "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    })
];
