import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "og-badazz",
        "name": "OG Badazz",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "OG Kush x Afghani x Skunk",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Diesel", "Earthy", "Spicy", "Pine"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "petrolia-headstash",
        "name": "Petrolia Headstash",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Afghani Landrace (Humboldt, CA)",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 8,
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Short",
            "yieldDetails": { "indoor": "350-450 g/m²", "outdoor": "400-500 g/plant" },
            "heightDetails": { "indoor": "70-100 cm", "outdoor": "90-130 cm" }
        },
        "aromas": ["Diesel", "Earthy", "Pungent", "Pine"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "red-river-delta",
        "name": "Red River Delta",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Vietnamese Landrace Indica",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 8,
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Short",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "80-120 cm", "outdoor": "100-150 cm" }
        },
        "aromas": ["Sweet", "Fruity", "Earthy", "Floral"],
        "dominantTerpenes": ["Myrcene", "Linalool", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "sweet-skunk",
        "name": "Sweet Skunk",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Skunk #1 x an unknown sweet Indica",
        "floweringType": "Photoperiod",
        "thc": 19,
        "cbd": 1,
        "thcRange": "17-21%",
        "cbdRange": "<1%",
        "floweringTime": 7.5,
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "80-120 cm", "outdoor": "100-150 cm" }
        },
        "aromas": ["Sweet", "Skunk", "Fruity", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "west-coast-dog",
        "name": "West Coast Dog",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "Chemdawg x Humboldt OG",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "100-160 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Diesel", "Earthy", "Pine", "Pungent"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    }),
    createStrainObject({
        "id": "aspen-og",
        "name": "Aspen OG",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Sour Cream x OG Kush",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Tall"
        },
        "aromas": ["Sour", "Diesel", "Earthy", "Sweet"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    })
];