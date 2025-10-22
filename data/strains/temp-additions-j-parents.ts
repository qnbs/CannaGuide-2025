import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "the-cleaner",
        "name": "The Cleaner",
        "type": StrainType.Sativa,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Lamb's Bread x Pluton x Purple Haze",
        "floweringType": "Photoperiod",
        "thc": 21, "cbd": 1, "thcRange": "18-24%", "cbdRange": "<1%", "floweringTime": 8.5,
        "agronomic": { "difficulty": "Hard", "yield": "High", "height": "Tall" },
        "aromas": ["Lemon", "Pine", "Chemical", "Sweet"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Pinene"]
    }),
    createStrainObject({
        "id": "pluton",
        "name": "Pluton",
        "type": StrainType.Sativa,
        "typeDetails": "Sativa 100%",
        "genetics": "Landrace",
        "floweringType": "Photoperiod",
        "thc": 19, "cbd": 1, "thcRange": "17-21%", "cbdRange": "<1%", "floweringTime": 10,
        "agronomic": { "difficulty": "Hard", "yield": "Medium", "height": "Tall" },
        "aromas": ["Earthy", "Spicy", "Herbal"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "pollyanna",
        "name": "Pollyanna",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "Princess x Cinderella 99",
        "floweringType": "Photoperiod",
        "thc": 20, "cbd": 1, "thcRange": "18-22%", "cbdRange": "<1%", "floweringTime": 9,
        "agronomic": { "difficulty": "Medium", "yield": "High", "height": "Medium" },
        "aromas": ["Sweet", "Fruity", "Tropical", "Pineapple"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Terpinolene"]
    }),
    createStrainObject({
        "id": "princess",
        "name": "Princess",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "Jack Herer phenotype",
        "floweringType": "Photoperiod",
        "thc": 22, "cbd": 1, "thcRange": "20-24%", "cbdRange": "<1%", "floweringTime": 9,
        "agronomic": { "difficulty": "Medium", "yield": "Medium", "height": "Medium" },
        "aromas": ["Pine", "Spicy", "Sweet", "Earthy"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Pinene"]
    }),
    createStrainObject({
        "id": "rare-dankness-2",
        "name": "Rare Dankness #2",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 50% Sativa / 50% Indica",
        "genetics": "Ghost OG x (Chemdawg x Triangle Kush)",
        "floweringType": "Photoperiod",
        "thc": 24, "cbd": 1, "thcRange": "22-26%", "cbdRange": "<1%", "floweringTime": 9.5,
        "agronomic": { "difficulty": "Hard", "yield": "Medium", "height": "Medium" },
        "aromas": ["Citrus", "Earthy", "Spicy", "Diesel"],
        "dominantTerpenes": ["Limonene", "Caryophyllene", "Myrcene"]
    }),
    createStrainObject({
        "id": "orange-velvet",
        "name": "Orange Velvet",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% Sativa / 50% Indica",
        "genetics": "Skunk phenotype (presumed)",
        "floweringType": "Photoperiod",
        "thc": 20, "cbd": 1, "thcRange": "18-22%", "cbdRange": "<1%", "floweringTime": 8.5,
        "agronomic": { "difficulty": "Medium", "yield": "Medium", "height": "Medium" },
        "aromas": ["Orange", "Creamy", "Sweet", "Citrus"],
        "dominantTerpenes": ["Myrcene", "Terpinolene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "kenyan-landrace",
        "name": "Kenyan Landrace",
        "type": StrainType.Sativa,
        "typeDetails": "Sativa 100%",
        "genetics": "Landrace",
        "floweringType": "Photoperiod",
        "thc": 18, "cbd": 1, "thcRange": "16-20%", "cbdRange": "<1%", "floweringTime": 11,
        "agronomic": { "difficulty": "Hard", "yield": "Medium", "height": "Tall" },
        "aromas": ["Earthy", "Sweet", "Citrus"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Caryophyllene"]
    })
];