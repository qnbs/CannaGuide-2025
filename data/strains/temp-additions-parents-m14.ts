import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "mandarin-sunset",
        "name": "Mandarin Sunset",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Herijuana x Orange Skunk",
        "floweringType": "Photoperiod",
        "thc": 24,
        "cbd": 1,
        "thcRange": "22-26%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "An indica-dominant hybrid known for its vibrant orange citrus aroma. It delivers a relaxing and euphoric high that melts away stress, making it great for evenings. Parent of Mandarin Cookies.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Orange", "Citrus", "Sweet", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "marleys-collie",
        "name": "Marley's Collie",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 80% / Indica 20%",
        "genetics": "Jamaican Landrace x Maple Leaf Indica",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 10,
        "floweringTimeRange": "9-11",
        "description": "A sativa-dominant strain created by Sensi Seeds in honor of Bob Marley. It combines a sweet, tropical aroma with an uplifting, creative, and energetic high. It's a parent of Jamaican Pearl.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall"
        },
        "aromas": ["Sweet", "Tropical", "Spicy", "Woody"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "martian-mean-green",
        "name": "Martian Mean Green",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "Sharksbreath x G13 Haze",
        "floweringType": "Photoperiod",
        "thc": 23,
        "cbd": 1,
        "thcRange": "20-26%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "A sativa-dominant hybrid from DNA Genetics, known for its potent, energetic, and creative high. The aroma is a complex mix of spicy, floral, and earthy notes. Parent of Cosmic Charlie.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Spicy", "Floral", "Earthy", "Sweet"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "meatloaf",
        "name": "Meatloaf",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Mendo Breath x an unknown strain",
        "floweringType": "Photoperiod",
        "thc": 25,
        "cbd": 1,
        "thcRange": "22-28%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "description": "Meatloaf is a potent and rare indica-dominant strain, known as one of the parents of Meat Breath. It carries the heavy, relaxing genetics of Mendo Breath and is known for a unique, savory, and pungent aroma. The effect is typically a heavy body high that is deeply calming and sedating.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Pungent", "Earthy", "Diesel", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    }),
    createStrainObject({
        "id": "mexican",
        "name": "Mexican",
        "type": StrainType.Sativa,
        "typeDetails": "Sativa 100%",
        "genetics": "Mexican Landrace",
        "floweringType": "Photoperiod",
        "thc": 18,
        "cbd": 1,
        "thcRange": "16-20%",
        "cbdRange": "<1%",
        "floweringTime": 11,
        "floweringTimeRange": "10-12",
        "description": "A term for various Sativa landraces from Mexico. These strains are known for their uplifting, energetic, and cerebral effects. They often have a sweet and earthy aroma. Mexican sativas, like Acapulco Gold, are a key genetic component in many famous hybrids, including Skunk #1.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Tall"
        },
        "aromas": ["Sweet", "Earthy", "Spicy", "Woody"],
        "dominantTerpenes": ["Pinene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "mochi-gelato",
        "name": "Mochi Gelato",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Thin Mint GSC x Sunset Sherbet",
        "floweringType": "Photoperiod",
        "thc": 25,
        "cbd": 1,
        "thcRange": "22-28%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "Also known as Mochi, this is a balanced hybrid strain with a sweet, fruity, and creamy aroma. The effect is relaxing and happy, ideal for the evening. It's a parent of Horchata.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Fruity", "Creamy", "Mint"],
        "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    })
];