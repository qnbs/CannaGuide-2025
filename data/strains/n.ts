import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strainsN: Strain[] = [
    createStrainObject({
        "id": "northern-lights",
        "name": "Northern Lights",
        "type": StrainType.Indica,
        "typeDetails": "Indica - 95% Indica / 5% Sativa",
        "genetics": "Afghani x Thai Landrace",
        "floweringType": "Photoperiod",
        "thc": 21,
        "cbd": 1,
        "thcRange": "18-24%",
        "cbdRange": "<1%",
        "floweringTime": 8,
        "floweringTimeRange": "7-9",
        "description": "A legendary, almost pure Indica strain known for its fast flowering, high resin production, and deeply relaxing effect. Ideal for evening use and for insomnia.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Short",
            "yieldDetails": { "indoor": "500-550 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "80-120 cm", "outdoor": "100-150 cm" }
        },
        "aromas": ["Earthy", "Sweet", "Pine", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "nyc-diesel",
        "name": "NYC Diesel",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 60% Sativa / 40% Indica",
        "genetics": "Sour Diesel x (Afghani x Hawaiian)",
        "floweringType": "Photoperiod",
        "thc": 21,
        "cbd": 1,
        "thcRange": "18-24%",
        "cbdRange": "<1%",
        "floweringTime": 10.5,
        "floweringTimeRange": "10-11",
        "description": "A popular sativa-dominant hybrid known for its strong, uplifting, and talkative effects. It features a pungent diesel aroma mixed with notes of ripe grapefruit and lime.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Tall",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "150-200 cm", "outdoor": ">200 cm" }
        },
        "aromas": ["Diesel", "Grapefruit", "Lime", "Pungent"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "nuken",
        "name": "Nuken",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 80% Indica / 20% Sativa",
        "genetics": "God Bud x Kish",
        "floweringType": "Photoperiod",
        "thc": 25,
        "cbd": 1,
        "thcRange": "22-28%",
        "cbdRange": "<1%",
        "floweringTime": 7.5,
        "floweringTimeRange": "7-8",
        "description": "A Canadian indica-dominant strain with a sweet, earthy, and marshmallow-like aroma. It delivers a strong, relaxing body high that calms pain and stress without complete sedation.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Sweet", "Earthy", "Skunk", "Pine"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    })
];