import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strainsU: Strain[] = [
    createStrainObject({
        "id": "uk-cheese",
        "name": "UK Cheese",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 50% Sativa / 50% Indica",
        "genetics": "Skunk #1 Phenotype",
        "floweringType": "Photoperiod",
        "thc": 20.5,
        "cbd": 1,
        "thcRange": "18-23%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "A legendary hybrid strain that originated in the United Kingdom. It is a phenotype of Skunk #1 and is famous for its distinct, pungent, cheesy aroma. UK Cheese offers a balanced high that begins with an energetic, euphoric rush and settles into a relaxing body stone, making it suitable for managing stress and pain throughout the day.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Medium",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Cheese", "Pungent", "Skunk", "Earthy"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    }),
    createStrainObject({
        "id": "unicorn-poop",
        "name": "Unicorn Poop",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 50% Sativa / 50% Indica",
        "genetics": "GMO Cookies x Sophisticated Lady",
        "floweringType": "Photoperiod",
        "thc": 23,
        "cbd": 1,
        "thcRange": "21-25%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "A balanced hybrid with a sweet, fruity, and earthy aroma. The effect is relaxing, happy, and uplifting.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Sweet", "Fruity", "Earthy", "Citrus"],
        "dominantTerpenes": ["Limonene", "Caryophyllene", "Myrcene"]
    })
,
    createStrainObject({
        "id": "u-dub",
        "name": "U-Dub",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "OG Kush x Hindu Kush (presumed)",
        "floweringType": "Photoperiod",
        "thc": 24,
        "cbd": 1,
        "thcRange": "22-26%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Earthy", "Pine", "Pungent", "Skunk"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Limonene"]
    }),
    createStrainObject({
        "id": "ultima",
        "name": "Ultima",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Sativa x Indica cross",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Fruity", "Sweet", "Earthy", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "ultra-sour",
        "name": "Ultra Sour",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "MK Ultra x Sour Diesel",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall"
        },
        "aromas": ["Sour", "Diesel", "Pine", "Citrus"],
        "dominantTerpenes": ["Terpinolene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "urkle",
        "name": "Urkle",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Mendocino Purps phenotype",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Low",
            "height": "Short"
        },
        "aromas": ["Grape", "Sweet", "Berry", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "utopia-haze",
        "name": "Utopia Haze",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 90% / Indica 10%",
        "genetics": "Brazilian Sativa Landrace",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 10.5,
        "floweringTimeRange": "10-11",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall"
        },
        "aromas": ["Fruity", "Mint", "Spicy", "Citrus"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Pinene"]
    }),
];
