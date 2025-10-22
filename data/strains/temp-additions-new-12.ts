import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "high-octane-og",
        "name": "High Octane OG",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "OG Kush phenotype",
        "floweringType": "Photoperiod",
        "thc": 26,
        "cbd": 1,
        "thcRange": "24-28%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "High Octane OG is a potent, pure indica strain known for its extremely gassy and pungent aroma. As a phenotype of OG Kush, it delivers a powerful, fast-acting high that is deeply relaxing and sedating, making it a favorite for evening use and for treating pain and insomnia.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Diesel", "Pungent", "Earthy", "Citrus"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "fire-alien-kush",
        "name": "Fire Alien Kush",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Fire OG x Alien Kush",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "description": "An indica-dominant hybrid with a complex aroma of lemon, spice, and diesel. The effect is strong, starting with a cerebral rush that evolves into a deep, relaxing body high.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Lemon", "Spicy", "Diesel", "Earthy"],
        "dominantTerpenes": ["Limonene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "f1-hybrid",
        "name": "F1 Hybrid",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Represents a first-generation cross",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "description": "This is a placeholder representing the concept of an 'F1 Hybrid,' which is the first filial generation cross between two distinct parent strains. F1 hybrids are prized for their 'hybrid vigor' (heterosis), often resulting in increased growth, yield, and stability. This entry serves as a genealogical placeholder.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Earthy", "Sweet", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    }),
    createStrainObject({
        "id": "panama-creature",
        "name": "Panama Creature",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "Panama Red x an unknown powerful indica",
        "floweringType": "Photoperiod",
        "thc": 25,
        "cbd": 1,
        "thcRange": "23-27%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "description": "A potent and rare indica-dominant strain known for its resinous buds and strong, relaxing effects. It is a key parent in the breeding of PCS1 (Panama Creature S1) and subsequently Cake Bomb.",
        "agronomic": {
            "difficulty": "Hard",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Earthy", "Pungent", "Chemical", "Diesel"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    }),
    createStrainObject({
        "id": "roze",
        "name": "Roze",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Unknown",
        "floweringType": "Photoperiod",
        "thc": 18,
        "cbd": 1,
        "thcRange": "16-20%",
        "cbdRange": "<1%",
        "floweringTime": 8,
        "floweringTimeRange": "7-9",
        "description": "Roze is a pure indica strain celebrated for its unique and intense floral aroma, strongly reminiscent of fresh roses. It provides a calming and relaxing high, perfect for unwinding. It is one of the parents of the visually stunning California Black Rose.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Rose", "Floral", "Sweet", "Earthy"],
        "dominantTerpenes": ["Linalool", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "og-eddy",
        "name": "OG Eddy",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "OG Kush x Grape Ape",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "Also known as OG Eddy Lepp, this is an indica-dominant hybrid with a sweet, grape, and earthy aroma. It delivers a relaxing body high, coupled with a happy, euphoric mental state. It is a parent of California Black Rose.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Grape", "Sweet", "Earthy", "Woody"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "maple-leaf",
        "name": "Maple Leaf",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Afghani Landrace",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 7.5,
        "floweringTimeRange": "7-8",
        "description": "A classic, pure indica strain descended from Afghani landraces. It's known for its fast flowering time, high resin production, and a deeply relaxing, sedative body high. The aroma is sweet and earthy with hints of citrus and spice.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Short"
        },
        "aromas": ["Sweet", "Earthy", "Citrus", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "humboldt-og",
        "name": "Humboldt OG",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "OG Kush (Humboldt phenotype)",
        "floweringType": "Photoperiod",
        "thc": 23,
        "cbd": 1,
        "thcRange": "21-25%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "description": "A potent OG Kush phenotype from Humboldt County, California. It features the classic OG aroma of pine, earth, and diesel. The effect is strong, physically relaxing, and long-lasting, making it a favorite for evening use.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Pine", "Earthy", "Diesel", "Pungent"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "grateful-breath",
        "name": "Grateful Breath",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "OG Kush Breath x Joseph OG",
        "floweringType": "Photoperiod",
        "thc": 25,
        "cbd": 1,
        "thcRange": "23-27%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "description": "A potent indica-dominant hybrid with a complex aroma of earth, fruit, and spice. It delivers a deeply relaxing and euphoric high that is said to induce a state of gratitude and calm.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Earthy", "Fruity", "Spicy", "Sweet"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
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
        "id": "malana",
        "name": "Malana",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Indian Landrace (Malana)",
        "floweringType": "Photoperiod",
        "thc": 18,
        "cbd": 1,
        "thcRange": "16-20%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "A pure indica landrace from the Malana Valley in India, famous for producing the highly prized 'Malana Cream' charas (hashish). It is known for its high resin production and a relaxing, cerebral high. The aroma is sweet, fruity, and hashy.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Sweet", "Fruity", "Hash", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    })
];