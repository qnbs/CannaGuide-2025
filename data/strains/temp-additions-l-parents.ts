import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "california-indica",
        "name": "California Indica",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 75% / Sativa 25%",
        "genetics": "Cali-O (California Orange) x Afghani Hash Plant",
        "floweringType": "Photoperiod",
        "thc": 18, "cbd": 1, "thcRange": "16-20%", "cbdRange": "<1%", "floweringTime": 7.5,
        "agronomic": { "difficulty": "Easy", "yield": "High", "height": "Short" },
        "aromas": ["Orange", "Citrus", "Earthy", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "jamaican-landrace",
        "name": "Jamaican Landrace",
        "type": StrainType.Sativa,
        "typeDetails": "Sativa 100%",
        "genetics": "Landrace",
        "floweringType": "Photoperiod",
        "thc": 19, "cbd": 1, "thcRange": "17-21%", "cbdRange": "<1%", "floweringTime": 11,
        "agronomic": { "difficulty": "Medium", "yield": "Medium", "height": "Tall" },
        "aromas": ["Tropical", "Sweet", "Earthy", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "big-skunk-korean",
        "name": "Big Skunk Korean",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "Big Bud x Skunk #1 x Korean Sativa",
        "floweringType": "Photoperiod",
        "thc": 20, "cbd": 1, "thcRange": "18-22%", "cbdRange": "<1%", "floweringTime": 8.5,
        "agronomic": { "difficulty": "Medium", "yield": "High", "height": "Medium" },
        "aromas": ["Sweet", "Skunk", "Earthy", "Fruity"],
        "dominantTerpenes": ["Myrcene", "Terpinolene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "korean-sativa",
        "name": "Korean Sativa",
        "type": StrainType.Sativa,
        "typeDetails": "Sativa 100%",
        "genetics": "Landrace",
        "floweringType": "Photoperiod",
        "thc": 19, "cbd": 1, "thcRange": "17-21%", "cbdRange": "<1%", "floweringTime": 10,
        "agronomic": { "difficulty": "Hard", "yield": "Medium", "height": "Tall" },
        "aromas": ["Sweet", "Herbal", "Spicy", "Earthy"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Pinene"]
    }),
    createStrainObject({
        "id": "afghani-hawaiian",
        "name": "Afghani Hawaiian",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "Afghani x Hawaiian Sativa",
        "floweringType": "Photoperiod",
        "thc": 21, "cbd": 1, "thcRange": "19-23%", "cbdRange": "<1%", "floweringTime": 9,
        "agronomic": { "difficulty": "Medium", "yield": "Medium", "height": "Medium" },
        "aromas": ["Tropical", "Sweet", "Earthy", "Pineapple"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Limonene"]
    }),
    createStrainObject({
        "id": "lebanese-landrace",
        "name": "Lebanese Landrace",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Landrace",
        "floweringType": "Photoperiod",
        "thc": 17, "cbd": 3, "thcRange": "15-20%", "cbdRange": "1-5%", "floweringTime": 8,
        "agronomic": { "difficulty": "Easy", "yield": "Medium", "height": "Short" },
        "aromas": ["Earthy", "Woody", "Spicy", "Hash"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "legend-og",
        "name": "Legend OG",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "OG Kush phenotype",
        "floweringType": "Photoperiod",
        "thc": 24, "cbd": 1, "thcRange": "22-26%", "cbdRange": "<1%", "floweringTime": 8.5,
        "agronomic": { "difficulty": "Hard", "yield": "Medium", "height": "Medium" },
        "aromas": ["Earthy", "Pine", "Floral", "Pungent"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "dabney-blue",
        "name": "Dabney Blue",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Blueberry x Unknown Indica",
        "floweringType": "Photoperiod",
        "thc": 17.5, "cbd": 1, "thcRange": "15-20%", "cbdRange": "<1%", "floweringTime": 8.5,
        "agronomic": { "difficulty": "Easy", "yield": "Medium", "height": "Short" },
        "aromas": ["Blueberry", "Berry", "Sweet", "Fruity"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "lemon-skunk",
        "name": "Lemon Skunk",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "Skunk #1 phenotype",
        "floweringType": "Photoperiod",
        "thc": 22, "cbd": 1, "thcRange": "20-24%", "cbdRange": "<1%", "floweringTime": 8.5,
        "agronomic": { "difficulty": "Easy", "yield": "High", "height": "Tall" },
        "aromas": ["Lemon", "Skunk", "Citrus", "Sweet"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Limonene"]
    }),
    createStrainObject({
        "id": "silver-haze",
        "name": "Silver Haze",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 80% / Indica 20%",
        "genetics": "Haze x Northern Lights",
        "floweringType": "Photoperiod",
        "thc": 23, "cbd": 1, "thcRange": "20-26%", "cbdRange": "<1%", "floweringTime": 10.5,
        "agronomic": { "difficulty": "Medium", "yield": "High", "height": "Tall" },
        "aromas": ["Spicy", "Earthy", "Citrus", "Sweet"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    }),
    createStrainObject({
        "id": "lemonnade",
        "name": "Lemonnade",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 80% / Indica 20%",
        "genetics": "Lemon OG x Gorilla Haze",
        "floweringType": "Photoperiod",
        "thc": 22.5, "cbd": 1, "thcRange": "20-25%", "cbdRange": "<1%", "floweringTime": 9.5,
        "agronomic": { "difficulty": "Medium", "yield": "High", "height": "Tall" },
        "aromas": ["Lemon", "Citrus", "Sweet", "Sour"],
        "dominantTerpenes": ["Limonene", "Terpinolene", "Myrcene"]
    }),
    createStrainObject({
        "id": "lemon-og",
        "name": "Lemon OG",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Lemon Skunk x OG Kush",
        "floweringType": "Photoperiod",
        "thc": 21, "cbd": 1, "thcRange": "19-23%", "cbdRange": "<1%", "floweringTime": 9,
        "agronomic": { "difficulty": "Medium", "yield": "Medium", "height": "Medium" },
        "aromas": ["Lemon", "Citrus", "Earthy", "Pine"],
        "dominantTerpenes": ["Limonene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "gorilla-haze",
        "name": "Gorilla Haze",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Amnesia Haze x Gorilla Glue",
        "floweringType": "Photoperiod",
        "thc": 24, "cbd": 1, "thcRange": "22-26%", "cbdRange": "<1%", "floweringTime": 9.5,
        "agronomic": { "difficulty": "Medium", "yield": "High", "height": "Tall" },
        "aromas": ["Citrus", "Haze", "Earthy", "Diesel"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Limonene"]
    })
];
