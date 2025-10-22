import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "nevilles-a5-haze",
        "name": "Neville's A5 Haze",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 95% / Indica 5%",
        "genetics": "Haze x Northern Lights #5",
        "floweringType": "Photoperiod",
        "thc": 24,
        "cbd": 1,
        "thcRange": "22-26%",
        "cbdRange": "<1%",
        "floweringTime": 12,
        "floweringTimeRange": "11-13",
        "description": "A legendary and potent sativa-dominant hybrid, Neville's A5 Haze is a specific phenotype of Neville's Haze. It is renowned for its powerful, almost psychedelic cerebral high that is long-lasting and energizing. The aroma is a complex mix of spicy, incense-like, and piney notes. It is a parent of Tangerine Dream.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "High",
            "height": "Tall"
        },
        "aromas": ["Spicy", "Incense", "Pine", "Earthy"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Pinene"]
    }),
    createStrainObject({
        "id": "pure-power-plant",
        "name": "Pure Power Plant",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 90% / Indica 10%",
        "genetics": "South African Sativa",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "A fast-flowering sativa known for its uplifting and energetic effects, as well as its massive yields. It has a sweet and skunky aroma with citrus undertones. It is a parent of THC Bomb.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Skunk", "Citrus", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "chocolate-kush",
        "name": "Chocolate Kush",
        "type": StrainType.Indica,
        "typeDetails": "Indica 95% / Sativa 5%",
        "genetics": "Chocolate Thai x OG Kush",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "An indica-dominant hybrid with a delicious aroma of sweet chocolate, coffee, and earth. The effect is deeply relaxing and calming, making it a great choice for evening use. It is a parent of Truffle Butter.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Chocolate", "Coffee", "Sweet", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    })
];