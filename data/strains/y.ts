import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strainsY: Strain[] = [
    createStrainObject({
        "id": "ya-hemi",
        "name": "Ya Hemi",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 60% Sativa / 40% Indica",
        "genetics": "Melonatta x Project 4516",
        "floweringType": "Photoperiod",
        "description": "A sativa-dominant hybrid with a strong, fruity aroma underscored by gassy and earthy notes. Ya Hemi provides a potent, euphoric, and creative high that's perfect for daytime use, keeping you energized and focused.",
        "thc": 27.5,
        "cbd": 1,
        "thcRange": "25-30%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "120-180 cm", "outdoor": "150-220 cm" }
        },
        "aromas": ["Fruity", "Diesel", "Sweet", "Earthy"],
        "dominantTerpenes": ["Limonene", "Caryophyllene", "Myrcene"]
    }),
    createStrainObject({
        "id": "yeti-og",
        "name": "Yeti OG",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 70% Indica / 30% Sativa",
        "genetics": "OG Kush x an unknown strain",
        "floweringType": "Photoperiod",
        "description": "An indica-dominant hybrid with a classic OG aroma of earth, pine, and diesel. Yeti OG delivers a heavy, relaxing body high that is excellent for relieving pain and stress, often leading to a sleepy state.",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 8,
        "floweringTimeRange": "8",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Low",
            "height": "Short",
            "yieldDetails": { "indoor": "300-400 g/m²", "outdoor": "350-450 g/plant" },
            "heightDetails": { "indoor": "70-100 cm", "outdoor": "90-130 cm" }
        },
        "aromas": ["Earthy", "Pine", "Pungent", "Diesel"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "yumboldt",
        "name": "Yumboldt",
        "type": StrainType.Indica,
        "typeDetails": "Indica - 100% Indica",
        "genetics": "Humboldt County, CA Landrace",
        "floweringType": "Photoperiod",
        "description": "An old-school indica landrace from Humboldt County, California. It offers a deeply relaxing and calming high with a sweet, earthy aroma reminiscent of hash and berries. A great choice for a classic, soothing indica experience.",
        "thc": 18,
        "cbd": 1,
        "thcRange": "16-20%",
        "cbdRange": "<1%",
        "floweringTime": 8,
        "floweringTimeRange": "7-9",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "80-120 cm", "outdoor": "100-150 cm" }
        },
        "aromas": ["Sweet", "Earthy", "Hash", "Berry"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    })
];