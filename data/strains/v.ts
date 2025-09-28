
import { Strain, StrainType } from '@/types';

export const strainsV: Strain[] = [
    {
        "id": "v-kush",
        "name": "V-Kush",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 70% Indica / 30% Sativa",
        "genetics": "SFV OG Kush x Unknown",
        "floweringType": "Photoperiod",
        "thc": 25,
        "cbd": 1,
        "thcRange": "22-28%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "description": "Eine indica-dominante Sorte mit einem erdigen, kiefernartigen und scharfen Aroma. Die Wirkung ist stark, entspannend und sedierend.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "450-550 g/m²", "outdoor": "500-600 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Earthy", "Pine", "Pungent", "Diesel"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    },
    {
        "id": "vader-og",
        "name": "Vader OG",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "SFV OG Kush x Larry OG",
        "floweringType": "Photoperiod",
        "thc": 25,
        "cbd": 1,
        "thcRange": "22-28%",
        "cbdRange": "<1%",
        "floweringTime": 8,
        "floweringTimeRange": "8",
        "description": "Eine potente indica-dominante Sorte mit einem erdigen, süßen und traubenartigen Aroma. Die Wirkung ist stark, körperlich entspannend und sedierend.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Earthy", "Sweet", "Grape", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    },
    {
        "id": "vanilla-kush",
        "name": "Vanilla Kush",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Kashmir x Afghani",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1.25,
        "thcRange": "20-24%",
        "cbdRange": "1-1.5%",
        "floweringTime": 8,
        "floweringTimeRange": "8",
        "description": "Eine indica-dominante Sorte mit einem süßen, vanilleartigen und lavendelartigen Aroma. Die Wirkung ist stark, entspannend und beruhigend.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Short",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "80-120 cm", "outdoor": "100-150 cm" }
        },
        "aromas": ["Vanilla", "Sweet", "Lavender", "Citrus"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    },
    {
        "id": "velvet-glove",
        "name": "Velvet Glove",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "GMO Cookies x Nookies",
        "floweringType": "Photoperiod",
        "thc": 26,
        "cbd": 1,
        "thcRange": "24-28%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "description": "Eine potente indica-dominante Sorte mit einem dieselartigen, erdigen und scharfen Aroma. Die Wirkung ist stark, körperlich entspannend und langanhaltend.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Diesel", "Earthy", "Pungent", "Chemical"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    },
    {
        "id": "venom-og",
        "name": "Venom OG",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Poison OG x Rare Dankness #1",
        "floweringType": "Photoperiod",
        "thc": 23,
        "cbd": 1,
        "thcRange": "20-26%",
        "cbdRange": "<1%",
        "floweringTime": 8,
        "floweringTimeRange": "8",
        "description": "Eine indica-dominante Sorte mit einem erdigen, skunkigen und dieselartigen Aroma. Die Wirkung ist stark, entspannend und sedierend.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "450-550 g/m²", "outdoor": "500-600 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Earthy", "Skunk", "Diesel", "Pungent"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    },
    {
        "id": "violator-kush",
        "name": "Violator Kush",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Hindu Kush x Malana",
        "floweringType": "Photoperiod",
        "thc": 23,
        "cbd": 1.5,
        "thcRange": "20-26%",
        "cbdRange": "1-2%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "description": "Eine reine Indica mit einem erdigen, würzigen und scharfen Aroma. Die Wirkung ist stark, körperlich entspannend und sedierend, ideal bei Schmerzen und Schlaflosigkeit.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Short",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "80-120 cm", "outdoor": "100-150 cm" }
        },
        "aromas": ["Earthy", "Spicy", "Pungent", "Pine"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Humulene"]
    }
];