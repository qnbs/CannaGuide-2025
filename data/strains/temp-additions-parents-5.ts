import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "red-pop",
        "name": "Red Pop",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Afghan x Unknown Strain",
        "floweringType": "Photoperiod",
        "thc": 24,
        "cbd": 1,
        "thcRange": "22-26%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Strawberry", "Cherry", "Sweet", "Fizzy"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "killer-new-haven",
        "name": "Killer New Haven",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Connecticut Heirloom",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Earthy", "Pungent", "Spicy", "Hash"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "mendo-montage",
        "name": "Mendo Montage",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Mendo Purps x Crystal Locomotive F1",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Grape", "Caramel", "Earthy", "Sweet"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Linalool"]
    }),
    createStrainObject({
        "id": "pcs1-panama-creature-s1",
        "name": "PCS1 (Panama Creature S1)",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Panama Creature (Selfed)",
        "floweringType": "Photoperiod",
        "thc": 25,
        "cbd": 1,
        "thcRange": "23-27%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Earthy", "Diesel", "Pungent", "Chemical"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    }),
    createStrainObject({
        "id": "rbx4",
        "name": "RBx4",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Unknown Indica Backcross",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Earthy", "Sweet", "Pungent", "Herbal"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    })
];
