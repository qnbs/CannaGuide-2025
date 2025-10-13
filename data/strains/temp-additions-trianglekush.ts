import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "triangle-kush",
        "name": "Triangle Kush",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 90% / Sativa 10%",
        "genetics": "OG Kush phenotype from Florida",
        "floweringType": "Photoperiod",
        "thc": 23,
        "cbd": 1,
        "thcRange": "20-26%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "Triangle Kush is a legendary and highly potent indica strain originating from Florida, named after the state's three major cannabis-producing cities: Jacksonville, Miami, and Tampa. Believed to be a direct descendant or a very close phenotype of the original OG Kush, it is considered a cornerstone of many modern Kush and OG varieties. The effect is powerful and balanced, starting with an uplifting cerebral rush that sparks creativity and conversation, before settling into a deep, full-body relaxation that can effectively manage pain and stress without being completely incapacitating. Its aroma is a classic and complex OG profile, dominated by notes of spicy fuel, earthy pine, and sour lemon.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "100-160 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Earthy", "Pine", "Spicy", "Diesel"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    })
];