import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "early-girl",
        "name": "Early Girl",
        "type": StrainType.Indica,
        "typeDetails": "Indica 75% / Sativa 25%",
        "genetics": "Afghani x Indian Indica x Mexican Sativa",
        "floweringType": "Photoperiod",
        "thc": 16,
        "cbd": 1,
        "thcRange": "14-18%",
        "cbdRange": "<1%",
        "floweringTime": 7.5,
        "floweringTimeRange": "7-8",
        "description": "A classic Sensi Seeds strain from the 1980s, bred for its extremely fast flowering time and resilience, making it ideal for outdoor growing in cooler climates. It produces a mild, relaxing body high with a pleasant, uplifting cerebral effect. The aroma is sweet and earthy with hints of hash. It is one of the parents of Early Pearl.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short",
            "yieldDetails": { "indoor": "350-450 g/m²", "outdoor": "400-500 g/plant" },
            "heightDetails": { "indoor": "70-110 cm", "outdoor": "90-140 cm" }
        },
        "aromas": ["Earthy", "Sweet", "Hash", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "erdpurt",
        "name": "Erdpurt",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Erdbeer x Purpur Ticinensis",
        "floweringType": "Photoperiod",
        "thc": 12.5,
        "cbd": 1.5,
        "thcRange": "10-15%",
        "cbdRange": "1-2%",
        "floweringTime": 7.5,
        "floweringTimeRange": "7-8",
        "description": "A Swiss outdoor strain known for its extreme resilience to cold and mold, and its beautiful purple colors. It offers a mild, relaxing, and functional high with notable CBD content. The aroma is a sweet mix of strawberry and earth. It is a parent of the CBD strain Imperial Lion.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short",
            "yieldDetails": { "indoor": "300-400 g/m²", "outdoor": "350-450 g/plant" },
            "heightDetails": { "indoor": "70-100 cm", "outdoor": "90-120 cm" }
        },
        "aromas": ["Strawberry", "Sweet", "Earthy", "Woody"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "ethos-glue",
        "name": "Ethos Glue",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Gorilla Glue #4 S1",
        "floweringType": "Photoperiod",
        "thc": 28,
        "cbd": 1,
        "thcRange": "26-30%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "description": "From Ethos Genetics, this is a refined version of the legendary Gorilla Glue #4. It's known for its extreme resin production and a potent, balanced high that is both euphoric and deeply relaxing. The aroma is a classic 'glue' profile of pungent diesel, chocolate, and earth. It's a parent of Zour Apples.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "100-160 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Diesel", "Chocolate", "Earthy", "Pine"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    }),
    createStrainObject({
        "id": "florida-kush",
        "name": "Florida Kush",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Triangle Kush x an unknown strain",
        "floweringType": "Photoperiod",
        "thc": 23,
        "cbd": 1,
        "thcRange": "21-25%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "A potent indica-dominant strain originating from Florida, closely related to OG Kush and Triangle Kush. It delivers a strong, relaxing, and euphoric high. The aroma is a classic OG profile of pine, earth, and lemon. It is one of the parents of Pink Panties.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Pine", "Earthy", "Lemon", "Pungent"],
        "dominantTerpenes": ["Limonene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "forum-cut-cookies",
        "name": "Forum Cut Cookies",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 75% / Sativa 25%",
        "genetics": "GSC (phenotype)",
        "floweringType": "Photoperiod",
        "thc": 26,
        "cbd": 1,
        "thcRange": "24-28%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "The 'Forum Cut' is one of the original, legendary clone-only phenotypes of Girl Scout Cookies. It is prized for its classic GSC effects: a potent, euphoric head high that melts into a relaxing body buzz. It has a characteristic sweet, earthy, and doughy aroma. It's a parent of Mandarin Cookies.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Low",
            "height": "Short",
            "yieldDetails": { "indoor": "250-350 g/m²", "outdoor": "300-400 g/plant" },
            "heightDetails": { "indoor": "70-110 cm", "outdoor": "90-130 cm" }
        },
        "aromas": ["Sweet", "Earthy", "Cookie", "Pungent"],
        "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    })
];