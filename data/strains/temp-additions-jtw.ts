import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "joseph-og",
        "name": "Joseph OG",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "OG Kush phenotype",
        "floweringType": "Photoperiod",
        "thc": 26,
        "cbd": 1,
        "thcRange": "24-28%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "Joseph OG is a potent indica-dominant phenotype of OG Kush, known for its heavy resin production and classic OG aroma. It delivers a powerful, relaxing body high with a euphoric cerebral buzz. It's one of the parent strains of Grateful Breath.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Earthy", "Pine", "Diesel", "Lemon"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "the-creature",
        "name": "The Creature",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Unknown (presumed OG Kush lineage)",
        "floweringType": "Photoperiod",
        "thc": 27.5,
        "cbd": 1,
        "thcRange": "25-30%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "description": "The Creature is a highly potent and mysterious indica-dominant strain, rumored to have emerged from OG Kush genetics. It's known for its monstrously dense, resin-caked buds and a pungent, gassy aroma. The effects are heavy and sedating, providing a powerful body stone. It is a parent of the acclaimed Chimera #2.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Pungent", "Diesel", "Earthy", "Skunk"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    }),
    createStrainObject({
        "id": "wookie-15",
        "name": "Wookie #15",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "The White x Girl Scout Cookies",
        "floweringType": "Photoperiod",
        "thc": 25,
        "cbd": 1,
        "thcRange": "22-28%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "description": "Wookie #15 is a potent indica-dominant hybrid, famous for its unique aroma profile that blends lavender, mint, and diesel. It provides a happy, relaxing high that soothes the body while keeping the mind euphoric. It is a parent of Monkey Glue.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Lavender", "Mint", "Diesel", "Pine"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "trophy-wife",
        "name": "Trophy Wife",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "The Wife x Cherry Wine",
        "floweringType": "Photoperiod",
        "thc": 24,
        "cbd": 1,
        "thcRange": "22-26%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "description": "While often known as a high-CBD strain, Trophy Wife also has high-THC phenotypes that are used for breeding. This version offers a balanced, relaxing high with a sweet and earthy cherry aroma. It is a parent of the popular Point Break strain.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Cherry", "Sweet", "Earthy", "Floral"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "lemon-joy",
        "name": "Lemon Joy",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "Lemon Pebbles x Lemon Cooler",
        "floweringType": "Photoperiod",
        "thc": 21,
        "cbd": 1,
        "thcRange": "19-23%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "Lemon Joy is a sativa-dominant hybrid known for its vibrant and uplifting effects, along with a sweet, zesty lemon aroma. It provides a happy and energetic high, making it a key parent in the breeding of Lemon Kush.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Lemon", "Citrus", "Sweet", "Earthy"],
        "dominantTerpenes": ["Limonene", "Myrcene", "Caryophyllene"]
    })
];