import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "moroccan-landrace",
        "name": "Moroccan Landrace",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Landrace",
        "floweringType": "Photoperiod",
        "thc": 15,
        "cbd": 2,
        "thcRange": "12-18%",
        "cbdRange": "1-3%",
        "floweringTime": 8,
        "floweringTimeRange": "7-9",
        "description": "A pure indica landrace from the mountainous regions of Morocco, traditionally cultivated for hashish (kif) production. These plants are typically short, resinous, and fast-flowering, adapted to arid climates. The effect is generally mild, relaxing, and clear-headed.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Earthy", "Spicy", "Hash"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    })
];