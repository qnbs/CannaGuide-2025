import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "n13-kush",
        "name": "N13 Kush",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "(G13 Hashplant x Nicole Kush) x (G13 x Chemdawg x SFV OG)",
        "floweringType": "Photoperiod",
        "thc": 21,
        "cbd": 1,
        "thcRange": "19-23%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Earthy", "Berry", "Pine", "Sweet"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "naranchup",
        "name": "Naranchup",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Naran J x Tropicana Cookies",
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
            "height": "Tall"
        },
        "aromas": ["Orange", "Tangerine", "Sweet", "Citrus"],
        "dominantTerpenes": ["Limonene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "nebula",
        "name": "Nebula",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "American Haze x Master Widow (likely)",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Honey", "Sweet", "Fruity", "Floral"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Terpinolene"]
    }),
    createStrainObject({
        "id": "nepalese-indica",
        "name": "Nepalese Indica",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Nepalese Landrace",
        "floweringType": "Photoperiod",
        "thc": 18,
        "cbd": 1,
        "thcRange": "16-20%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Hash", "Earthy", "Sweet", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Humulene"]
    }),
    createStrainObject({
        "id": "nevilles-haze",
        "name": "Neville's Haze",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 90% / Indica 10%",
        "genetics": "Haze x Northern Lights #5",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 14,
        "floweringTimeRange": "12-16",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "High",
            "height": "Tall"
        },
        "aromas": ["Pine", "Floral", "Earthy", "Spicy"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Ocimene"]
    }),
    createStrainObject({
        "id": "night-nurse",
        "name": "Night Nurse",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "BC Hashplant x Harmony x Fire OG Kush",
        "floweringType": "Photoperiod",
        "thc": 18,
        "cbd": 2,
        "thcRange": "16-21%",
        "cbdRange": "1-3%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Coffee", "Earthy", "Spicy", "Pungent"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    }),
    createStrainObject({
        "id": "night-queen",
        "name": "Night Queen",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 95% / Sativa 5%",
        "genetics": "Afghani Indica phenotype",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Short"
        },
        "aromas": ["Spicy", "Earthy", "Hash", "Pine"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "nlx",
        "name": "NLX",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Northern Lights #5 x White Widow",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Earthy", "Spicy", "Pine"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "nookies",
        "name": "Nookies",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "GSC x Animal Cookies",
        "floweringType": "Photoperiod",
        "thc": 26,
        "cbd": 1,
        "thcRange": "23-29%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Cookie", "Sweet", "Earthy", "Vanilla"],
        "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "nordle",
        "name": "Nordle",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20% (CBD Rich)",
        "genetics": "Afghani x Skunk #1",
        "floweringType": "Photoperiod",
        "thc": 6,
        "cbd": 8,
        "thcRange": "5-8%",
        "cbdRange": "7-10%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Short"
        },
        "aromas": ["Fruity", "Sweet", "Earthy", "Onion"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "nova-og",
        "name": "Nova OG",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Stardawg (Guava Chem cut) x OG/Chem #4 IBX",
        "floweringType": "Photoperiod",
        "thc": 32,
        "cbd": 1,
        "thcRange": "28-35%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Fruity", "Coffee", "Sweet", "Pepper"],
        "dominantTerpenes": ["Limonene", "Caryophyllene", "Myrcene"]
    })
];
