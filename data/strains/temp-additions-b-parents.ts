import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "banana",
        "name": "Banana",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Unknown",
        "floweringType": "Photoperiod",
        "thc": 23, "cbd": 1, "floweringTime": 8,
        "description": "A strain of unknown origin, famous for its distinct banana aroma and flavor, which it passes on to its descendants like Banana OG.",
        "agronomic": { "difficulty": "Medium", "yield": "Medium", "height": "Medium" },
        "aromas": ["Banana", "Sweet", "Tropical"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Pinene"]
    }),
    createStrainObject({
        "id": "bay-11", "name": "Bay 11", "type": StrainType.Hybrid, "typeDetails": "Sativa 80% / Indica 20%",
        "genetics": "Appalachia", "floweringType": "Photoperiod", "thc": 24, "cbd": 1, "floweringTime": 9.5,
        "description": "An award-winning sativa strain known for its dense, crystal-coated buds and uplifting, creative high. It is a parent of Bay Platinum Cookies.",
        "agronomic": { "difficulty": "Medium", "yield": "High", "height": "Medium" },
        "aromas": ["Pine", "Sweet", "Earthy"], "dominantTerpenes": ["Pinene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "appalachia", "name": "Appalachia", "type": StrainType.Hybrid, "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Green Crack x Tres Dawg", "floweringType": "Photoperiod", "thc": 21, "cbd": 1, "floweringTime": 9,
        "description": "A potent hybrid with an earthy, sweet, and slightly spicy aroma. It offers a balanced effect and is the parent of Bay 11.",
        "agronomic": { "difficulty": "Medium", "yield": "Medium", "height": "Medium" },
        "aromas": ["Earthy", "Sweet", "Spicy"], "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "gelato-25", "name": "Gelato #25", "type": StrainType.Hybrid, "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "Sunset Sherbet x Thin Mint GSC", "floweringType": "Photoperiod", "thc": 22.5, "cbd": 1, "floweringTime": 8.5,
        "description": "A phenotype of Gelato known for its fruity, dessert-like aroma. Its relaxing and euphoric effects make it a key parent of Biscotti.",
        "agronomic": { "difficulty": "Hard", "yield": "Medium", "height": "Medium" },
        "aromas": ["Fruity", "Berry", "Sweet"], "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "south-florida-og", "name": "South Florida OG", "type": StrainType.Hybrid, "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Chemdawg x (Lemon Thai x Hindu Kush)", "floweringType": "Photoperiod", "thc": 22, "cbd": 1, "floweringTime": 9.5,
        "description": "A potent OG Kush phenotype from Florida, providing a strong, relaxing, and long-lasting high. It is a parent of Biscotti.",
        "agronomic": { "difficulty": "Medium", "yield": "Medium", "height": "Medium" },
        "aromas": ["Earthy", "Pine", "Pungent"], "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "emerald-headband", "name": "Emerald Headband", "type": StrainType.Hybrid, "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Headband x OG Kush", "floweringType": "Photoperiod", "thc": 23, "cbd": 1, "floweringTime": 9,
        "description": "A sativa-dominant hybrid that combines the cerebral 'headband' effect with classic OG potency. It's known for an uplifting and creative high, and is a parent to Black Dawg.",
        "agronomic": { "difficulty": "Medium", "yield": "High", "height": "Tall" },
        "aromas": ["Diesel", "Lemon", "Pine"], "dominantTerpenes": ["Terpinolene", "Caryophyllene", "Limonene"]
    }),
    createStrainObject({
        "id": "raspberry-cough", "name": "Raspberry Cough", "type": StrainType.Hybrid, "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Cambodian Landrace x Ice", "floweringType": "Photoperiod", "thc": 19, "cbd": 1, "floweringTime": 9.5,
        "description": "A sativa-dominant strain with a sweet raspberry aroma. The effect is uplifting and clear-headed. It is a parent of Blackberry.",
        "agronomic": { "difficulty": "Medium", "yield": "High", "height": "Tall" },
        "aromas": ["Raspberry", "Sweet", "Fruity"], "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "cambodian-landrace", "name": "Cambodian Landrace", "type": StrainType.Sativa, "typeDetails": "Sativa 100%",
        "genetics": "Landrace", "floweringType": "Photoperiod", "thc": 19, "cbd": 1, "floweringTime": 11,
        "description": "A pure sativa from Cambodia, known for its clear, energetic cerebral high. It is a parent of Raspberry Cough.",
        "agronomic": { "difficulty": "Hard", "yield": "Medium", "height": "Tall" },
        "aromas": ["Sweet", "Fruity", "Earthy"], "dominantTerpenes": ["Terpinolene", "Myrcene", "Pinene"]
    }),
    createStrainObject({
        "id": "california-orange-cbd", "name": "California Orange CBD", "type": StrainType.Hybrid, "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Cali-O (California Orange) x an unknown high-CBD strain", "floweringType": "Photoperiod", "thc": 7, "cbd": 12, "floweringTime": 9.5,
        "description": "A CBD-rich version of the classic California Orange, offering a ~1:2 THC to CBD ratio and a mild, functional effect. It is a parent of Blue Dream CBD.",
        "agronomic": { "difficulty": "Easy", "yield": "High", "height": "Medium" },
        "aromas": ["Orange", "Citrus", "Sweet"], "dominantTerpenes": ["Limonene", "Myrcene", "Terpinolene"]
    }),
    createStrainObject({
        "id": "williams-wonder", "name": "William's Wonder", "type": StrainType.Indica, "typeDetails": "Indica 100%",
        "genetics": "Afghani Landrace", "floweringType": "Photoperiod", "thc": 22, "cbd": 1, "floweringTime": 8,
        "description": "A classic, old-school indica known for high yields and potent, relaxing effects. It's a key parent of the original Lowryder and Blue Magoo.",
        "agronomic": { "difficulty": "Easy", "yield": "High", "height": "Short" },
        "aromas": ["Sweet", "Citrus", "Floral"], "dominantTerpenes": ["Myrcene", "Linalool", "Pinene"]
    }),
    createStrainObject({
        "id": "the-power",
        "name": "The Power",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 80% / Indica 20%",
        "genetics": "South African Sativa",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "floweringTime": 8.5,
        "description": "A fast-flowering sativa known for its uplifting and energetic high. It is a parent of Blue Power.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Earthy", "Spicy"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Pinene"]
    }),
    createStrainObject({
        "id": "blue-moonshine",
        "name": "Blue Moonshine",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Blueberry (phenotype)",
        "floweringType": "Photoperiod",
        "thc": 17.5,
        "cbd": 1,
        "floweringTime": 7.5,
        "description": "An indica-dominant phenotype of Blueberry, known for its sweet flavor and fast flowering time. The effect is relaxing and sedating. It is a parent of Blue Power.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Blueberry", "Berry", "Sweet"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "indiana-bubblegum",
        "name": "Indiana Bubblegum",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Bubble Gum (original phenotype)",
        "floweringType": "Photoperiod",
        "thc": 18,
        "cbd": 1,
        "floweringTime": 8.5,
        "description": "The original Bubblegum phenotype from Indiana, known for its distinctive sweet bubblegum flavor. The effect is balanced, euphoric, and relaxing.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Bubblegum", "Sweet", "Fruity"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    })
];