import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "champagne",
        "name": "Champagne",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "Hash Plant x Burmese Kush",
        "floweringType": "Photoperiod",
        "thc": 21,
        "cbd": 1,
        "thcRange": "18-24%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "Champagne Kush, often just called Champagne, is an indica-dominant hybrid known for its uplifting, 'bubbly' effect reminiscent of its namesake sparkling wine. It provides a happy, social high that settles into a gentle body relaxation. The aroma is typically sweet and grape-like with floral and earthy undertones. It is a parent of Rainbow Sherbet.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Grape", "Floral", "Berry"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    }),
    createStrainObject({
        "id": "chemdawg-sour-diesel",
        "name": "Chemdawg Sour Diesel",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Chemdawg x Sour Diesel",
        "floweringType": "Photoperiod",
        "thc": 24,
        "cbd": 1,
        "thcRange": "22-26%",
        "cbdRange": "<1%",
        "floweringTime": 10,
        "floweringTimeRange": "9-11",
        "description": "Chemdawg Sour Diesel is a phenotype that emphasizes the most potent characteristics of its parent strains. It is known for its extremely pungent diesel and sour citrus aroma. This sativa-dominant strain delivers a fast-acting, energetic, and dreamy cerebral high, perfect for daytime use to boost creativity and focus. It is a parent of Grape Stomper.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Tall"
        },
        "aromas": ["Diesel", "Pungent", "Sour", "Earthy"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    }),
    createStrainObject({
        "id": "chimera-2",
        "name": "Chimera #2",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "White Truffle x The Creature",
        "floweringType": "Photoperiod",
        "thc": 30.5,
        "cbd": 1,
        "thcRange": "28-33%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "description": "Chimera #2 is a highly potent and sought-after hybrid strain from BeLeaf Cannabis. Known for its complex aroma profile blending port wine, citrus, and gassy notes. The effect is potent, offering a euphoric and creative high that settles into a comfortable body relaxation. It is a parent of Permanent Chimera.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Citrus", "Diesel", "Sweet", "Fruity"],
        "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "congo-3",
        "name": "Congo #3",
        "type": StrainType.Sativa,
        "typeDetails": "Sativa 100%",
        "genetics": "Congolese Landrace",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 10.5,
        "floweringTimeRange": "10-11",
        "description": "Congo #3 is a specific phenotype of Congolese landrace, likely selected for certain desirable traits. It is one of the parents of the Congo strain. It provides a classic sativa high: clear, energetic, and uplifting with a spicy, fruity aroma.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall"
        },
        "aromas": ["Spicy", "Fruity", "Sweet", "Earthy"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Pinene"]
    }),
    createStrainObject({
        "id": "congo-pointe-noire",
        "name": "Congo Pointe Noire",
        "type": StrainType.Sativa,
        "typeDetails": "Sativa 100%",
        "genetics": "Congolese Landrace (Pointe-Noire)",
        "floweringType": "Photoperiod",
        "thc": 21,
        "cbd": 1,
        "thcRange": "19-23%",
        "cbdRange": "<1%",
        "floweringTime": 12,
        "floweringTimeRange": "11-13",
        "description": "A pure sativa landrace from the Pointe-Noire region of the Republic of Congo. Known for its energetic, long-lasting cerebral high that stimulates creativity. It has a fruity, spicy, and earthy aroma and is a parent of the Congo strain.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Tall"
        },
        "aromas": ["Fruity", "Spicy", "Earthy", "Tropical"],
        "dominantTerpenes": ["Myrcene", "Terpinolene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "cookie-monster",
        "name": "Cookie Monster",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "OG Kush x GSC",
        "floweringType": "Photoperiod",
        "thc": 26,
        "cbd": 1,
        "thcRange": "24-28%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "An award-winning indica-dominant hybrid. It delivers a powerful, relaxing, and sleepy high, true to its OG and Cookies lineage. The aroma is sweet and minty with woody, earthy undertones. It is a parent of Pineapple Upside Down Cake.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Sweet", "Mint", "Earthy", "Woody"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    })
];