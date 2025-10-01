import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "ace-of-spades",
        "name": "Ace of Spades",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Black Cherry Soda x Jack The Ripper",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-23%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "An indica-dominant hybrid known for its sweet and sour berry aroma. It provides a relaxing and euphoric high that is great for unwinding and stimulating creativity. The buds often have a beautiful purple hue.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Sour", "Berry", "Citrus", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "afghani-bullrider",
        "name": "Afghani Bullrider",
        "type": StrainType.Indica,
        "typeDetails": "Indica 95% / Sativa 5%",
        "genetics": "Afghani landrace phenotype",
        "floweringType": "Photoperiod",
        "thc": 21,
        "cbd": 1,
        "thcRange": "18-24%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "A potent indica strain believed to be a phenotype of an Afghani landrace. It delivers a deeply relaxing, almost narcotic body high that melts away pain and stress, making it ideal for nighttime use. Its aroma is a classic mix of earthy, sweet, and pungent notes.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Earthy", "Sweet", "Pungent", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "albert-walker-og",
        "name": "Albert Walker OG",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Afghan Skunk phenotype (clone-only)",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "19-25%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "description": "A clone-only indica-dominant hybrid with mysterious origins, though it's believed to be a phenotype of Afghan Skunk. It is known for its potent, long-lasting effects that are both euphoric and deeply relaxing. The aroma is a pungent mix of skunk, lemon, and diesel.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Low",
            "height": "Short"
        },
        "aromas": ["Skunk", "Lemon", "Diesel", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "alien-technology",
        "name": "Alien Technology",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Afghani Landrace",
        "floweringType": "Photoperiod",
        "thc": 19,
        "cbd": 1,
        "thcRange": "16-22%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "A pure indica landrace strain reportedly brought back from Afghanistan by a US soldier. It is known for its strong, sedating effects and its high resin production. The aroma is a classic Afghani mix of earthy, spicy, and woody notes with a hint of diesel.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Earthy", "Spicy", "Woody", "Diesel"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "atlas-star",
        "name": "Atlas Star",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Sensi Star x an unknown Dutch indica",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-24%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "A balanced hybrid known for its sweet, fruity aroma and well-rounded effects. It provides a euphoric and happy high that gently relaxes the body without being overly sedating, making it a good choice for various occasions.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Fruity", "Earthy", "Floral"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Pinene"]
    })
];