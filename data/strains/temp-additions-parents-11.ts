import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "gelato-25",
        "name": "Gelato #25",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "Sunset Sherbet x Thin Mint GSC",
        "floweringType": "Photoperiod",
        "thc": 22.5,
        "cbd": 1,
        "thcRange": "20-25%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Fruity", "Earthy", "Citrus"],
        "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "gelato-42",
        "name": "Gelato #42",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Sunset Sherbet x Thin Mint GSC",
        "floweringType": "Photoperiod",
        "thc": 22.5,
        "cbd": 1,
        "thcRange": "20-25%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Earthy", "Citrus", "Vanilla"],
        "dominantTerpenes": ["Limonene", "Caryophyllene", "Myrcene"]
    }),
    createStrainObject({
        "id": "gelato-45",
        "name": "Gelato #45",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "Sunset Sherbet x Thin Mint GSC",
        "floweringType": "Photoperiod",
        "thc": 24.5,
        "cbd": 1,
        "thcRange": "22-27%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Earthy", "Citrus", "Lavender"],
        "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "gooberry",
        "name": "Gooberry",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Afgoo x Blueberry",
        "floweringType": "Photoperiod",
        "thc": 21,
        "cbd": 1,
        "thcRange": "18-24%",
        "cbdRange": "<1%",
        "floweringTime": 8,
        "floweringTimeRange": "7-9",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Berry", "Nutty", "Sweet", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "green-ribbon-bx",
        "name": "Green Ribbon BX",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Green Ribbon x Green Ribbon",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall"
        },
        "aromas": ["Floral", "Pine", "Sweet", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "green-spirit",
        "name": "Green Spirit",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Big Bud x Skunk #1",
        "floweringType": "Photoperiod",
        "thc": 17.5,
        "cbd": 1,
        "thcRange": "15-20%",
        "cbdRange": "<1%",
        "floweringTime": 7.5,
        "floweringTimeRange": "7-8",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Skunk", "Sweet", "Citrus", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    })
];