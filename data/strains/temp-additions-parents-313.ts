import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "kish",
        "name": "Kish",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "DJ Short Blueberry x Afghani",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "18-26%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "Kish, often known as Shishkaberry, is a potent indica-dominant hybrid. It delivers a happy, blissful high that starts with a cerebral uplift before settling into a full-body relaxation. Its aroma is a delightful blend of sweet berries and earthy notes.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short",
            "yieldDetails": { "indoor": "450-550 g/m²", "outdoor": "500-600 g/plant" },
            "heightDetails": { "indoor": "80-120 cm", "outdoor": "100-150 cm" }
        },
        "aromas": ["Berry", "Sweet", "Earthy", "Fruity"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "la-reunion",
        "name": "La Reunion",
        "type": StrainType.Sativa,
        "typeDetails": "Sativa 100%",
        "genetics": "Landrace from Réunion Island",
        "floweringType": "Photoperiod",
        "thc": 19,
        "cbd": 1,
        "thcRange": "17-21%",
        "cbdRange": "<1%",
        "floweringTime": 13,
        "floweringTimeRange": "12-14",
        "description": "La Reunion is a pure sativa landrace from Réunion Island in the Indian Ocean. It is known for its classic long-flowering sativa characteristics and a powerful, energetic, and long-lasting cerebral high. Its aroma is typically spicy and hazy. It is a key parent in the breeding of the famous Queen Mother strain.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Tall",
            "yieldDetails": { "indoor": "350-450 g/m²", "outdoor": "400-500 g/plant" },
            "heightDetails": { "indoor": "180-250 cm", "outdoor": ">250 cm" }
        },
        "aromas": ["Spicy", "Haze", "Earthy", "Tropical"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Pinene"]
    }),
    createStrainObject({
        "id": "lemonnade",
        "name": "Lemonnade",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Lemon OG x Gorilla Haze",
        "floweringType": "Photoperiod",
        "thc": 22.5,
        "cbd": 1,
        "thcRange": "20-25%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "Lemonnade, sometimes spelled Lemonade, is a sativa-dominant hybrid known for its overwhelmingly sweet and zesty lemon flavor. It delivers an energetic, uplifting, and happy high that is perfect for daytime use and creative activities. It is a parent of the popular Lemonchello strain.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "150-200 cm", "outdoor": ">200 cm" }
        },
        "aromas": ["Lemon", "Citrus", "Sweet", "Sour"],
        "dominantTerpenes": ["Limonene", "Terpinolene", "Caryophyllene"]
    })
];
