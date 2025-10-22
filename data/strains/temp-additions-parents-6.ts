import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "rare-dankness-2",
        "name": "Rare Dankness #2",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 50% Sativa / 50% Indica",
        "genetics": "Ghost OG x (Chemdawg x Triangle Kush)",
        "floweringType": "Photoperiod",
        "thc": 24,
        "cbd": 1,
        "thcRange": "22-26%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Citrus", "Earthy", "Spicy", "Diesel"],
        "dominantTerpenes": ["Limonene", "Caryophyllene", "Myrcene"]
    })
];