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
        "description": "A phenotype of the famous Gelato strain, bred by Cookie Fam Genetics. It's known for its fruity, dessert-like aroma with notes of berry and citrus. The effect is typically relaxing and euphoric, leaning towards a calming body high. It's a key parent of Biscotti.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "450-550 g/m²", "outdoor": "500-600 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Fruity", "Berry", "Sweet", "Citrus"],
        "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "gelato-42",
        "name": "Gelato #42",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "Sunset Sherbet x Thin Mint GSC",
        "floweringType": "Photoperiod",
        "thc": 21,
        "cbd": 1,
        "thcRange": "20-22%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "A sativa-leaning phenotype of the Gelato family. It offers a more uplifting and cerebral high compared to its indica-dominant siblings, making it suitable for daytime use. The aroma is sweet and fruity with earthy undertones. It's one of the parent strains of Cheetah Piss.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "120-180 cm", "outdoor": "150-200 cm" }
        },
        "aromas": ["Sweet", "Fruity", "Earthy", "Citrus"],
        "dominantTerpenes": ["Limonene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "green-ribbon-bx",
        "name": "Green Ribbon BX",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "Green Ribbon x Green Ribbon IBL",
        "floweringType": "Photoperiod",
        "thc": 21,
        "cbd": 1,
        "thcRange": "18-24%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "A backcross of the Green Ribbon strain, bred to stabilize its desirable traits. It's known for a floral, earthy aroma and an uplifting, energetic high that's not overwhelming, making it suitable for daytime. It's one of the parents of Fruity Pebbles OG.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "120-180 cm", "outdoor": "150-200 cm" }
        },
        "aromas": ["Floral", "Earthy", "Sweet", "Pine"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "green-spirit",
        "name": "Green Spirit",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "Big Bud x Skunk #1",
        "floweringType": "Photoperiod",
        "thc": 17.5,
        "cbd": 1,
        "thcRange": "15-20%",
        "cbdRange": "<1%",
        "floweringTime": 7.5,
        "floweringTimeRange": "7-8",
        "description": "A fast-flowering hybrid from Dutch Passion that combines the massive yields of Big Bud with the classic potency of Skunk #1. It offers a balanced high that is both relaxing and pleasantly euphoric. The aroma is a classic skunky and sweet blend. It's a parent of Incredible Bulk.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Medium",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "550-650 g/plant" },
            "heightDetails": { "indoor": "100-140 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Skunk", "Sweet", "Earthy", "Pungent"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    })
];
