import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "trinity",
        "name": "Trinity",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Northern Californian Landrace blend",
        "floweringType": "Photoperiod",
        "thc": 19,
        "cbd": 1,
        "thcRange": "17-21%",
        "cbdRange": "<1%",
        "floweringTime": 8,
        "description": "Trinity is a legendary, fast-flowering sativa-dominant strain from Northern California. It's known for its complex, pungent aroma of earth, skunk, and pine. The high is typically clear-headed, energetic, and long-lasting. It is a parent of Qrazy Train.",
        "agronomic": { "difficulty": "Hard", "yield": "High", "height": "Medium" },
        "aromas": ["Earthy", "Skunk", "Pine", "Pungent"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Pinene"]
    }),
    createStrainObject({
        "id": "timewreck",
        "name": "Timewreck",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 80% / Indica 20%",
        "genetics": "Blood Wreck x Vortex",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "description": "Timewreck is a potent sativa-dominant hybrid from Subcool's The Dank, known for its intense and almost psychedelic cerebral high. The aroma is a sharp mix of sour, fruity, and earthy notes. It is a parent of Quantum Kush.",
        "agronomic": { "difficulty": "Medium", "yield": "High", "height": "Tall" },
        "aromas": ["Sour", "Fruity", "Earthy", "Sweet"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Limonene"]
    }),
    createStrainObject({
        "id": "royal-kush",
        "name": "Royal Kush",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Afghani #1 x Skunk #1",
        "floweringType": "Photoperiod",
        "thc": 23,
        "cbd": 1,
        "thcRange": "21-25%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "description": "Royal Kush is a potent indica-dominant hybrid known for its long-lasting, relaxing effects. The aroma is a classic blend of earthy, skunky, and piney notes. It's a parent of Queen's Sangria.",
        "agronomic": { "difficulty": "Medium", "yield": "High", "height": "Medium" },
        "aromas": ["Earthy", "Skunk", "Pine", "Pungent"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    })
];
