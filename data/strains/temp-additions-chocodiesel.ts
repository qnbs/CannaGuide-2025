import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "chocolate-diesel",
        "name": "Chocolate Diesel",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 90% / Indica 10%",
        "genetics": "Chocolate Thai x Sour Diesel",
        "floweringType": "Photoperiod",
        "thc": 22.5,
        "cbd": 1,
        "thcRange": "20-25%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "Chocolate Diesel is a potent sativa-dominant hybrid, famous for its unique and complex aroma profile that blends pungent diesel with rich notes of coffee and dark chocolate. This strain is a genetic parent to the legendary Original Glue (GG4). It delivers a powerful, fast-acting cerebral high that is uplifting, energetic, and euphoric, making it a great choice for daytime use to combat fatigue and stimulate creativity. Due to its strong effects, it's best suited for experienced consumers.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "150-200 cm", "outdoor": ">200 cm" }
        },
        "aromas": ["Chocolate", "Coffee", "Diesel", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    })
];