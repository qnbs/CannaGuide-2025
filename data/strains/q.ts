import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strainsQ: Strain[] = [
    createStrainObject({
        "id": "qrazy-train",
        "name": "Qrazy Train",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 80% / Indica 20%",
        "genetics": "Querkle x Trainwreck x Trinity x Space Queen",
        "floweringType": "Photoperiod",
        "thc": 25,
        "cbd": 1,
        "thcRange": "22-28%",
        "cbdRange": "<1%",
        "floweringTime": 8,
        "floweringTimeRange": "8",
        "description": "A complex hybrid with a grape-like, spicy aroma. The effect is strong, euphoric, and relaxing, ideal for experienced consumers.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Grape", "Spicy", "Sweet", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Terpinolene"]
    }),
    createStrainObject({
        "id": "quantum-kush",
        "name": "Quantum Kush",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 75% / Indica 25%",
        "genetics": "Sweet Irish Kush x Timewreck",
        "floweringType": "Photoperiod",
        "thc": 29.5,
        "cbd": 1,
        "thcRange": "27-32%",
        "cbdRange": "<1%",
        "floweringTime": 8,
        "floweringTimeRange": "8",
        "description": "A potent sativa-dominant strain, known for its extremely high THC content. The effect is strong, cerebral, and energizing.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "150-200 cm", "outdoor": ">200 cm" }
        },
        "aromas": ["Earthy", "Sweet", "Tropical", "Skunk"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "quattro-kush",
        "name": "Quattro Kush",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "707 Headband x Triangle Kush x SFV OG Kush",
        "floweringType": "Photoperiod",
        "thc": 26.5,
        "cbd": 1,
        "thcRange": "24-29%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "description": "An indica-dominant strain with a strong, diesel-like, and earthy aroma. The effect is strong, relaxing, and long-lasting.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Diesel", "Earthy", "Pine", "Pungent"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    }),
    createStrainObject({
        "id": "queen-mother",
        "name": "Queen Mother",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 75% / Indica 25%",
        "genetics": "La Reunion x Congo",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 10,
        "floweringTimeRange": "10",
        "description": "A sativa-dominant strain with a spicy, incense-like aroma. The effect is uplifting, cerebral, and energizing.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "150-200 cm", "outdoor": ">200 cm" }
        },
        "aromas": ["Spicy", "Incense", "Earthy", "Woody"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "queens-sangria",
        "name": "Queen's Sangria",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Mimosa x Royal Kush",
        "floweringType": "Photoperiod",
        "thc": 27.5,
        "cbd": 1,
        "thcRange": "25-30%",
        "cbdRange": "<1%",
        "floweringTime": 10,
        "floweringTimeRange": "10",
        "description": "A balanced hybrid with a sweet, citrusy, and grape-like aroma. The effect is relaxing, happy, and uplifting.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Citrus", "Grape", "Sweet", "Berry"],
        "dominantTerpenes": ["Limonene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "querkle",
        "name": "Querkle",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Urkle x Space Queen",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 8,
        "floweringTimeRange": "8",
        "description": "An indica-dominant strain with a sweet grape and berry aroma. The effect is strongly relaxing and ideal for pain and insomnia.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "80-120 cm", "outdoor": "100-150 cm" }
        },
        "aromas": ["Grape", "Berry", "Sweet", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    })
];