import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strainsX: Strain[] = [
    createStrainObject({
        "id": "xanadu",
        "name": "Xanadu",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 60% Sativa / 40% Indica",
        "genetics": "Unknown",
        "floweringType": "Photoperiod",
        "description": "A well-balanced hybrid strain known for its euphoric and uplifting effects that gently transition into relaxation. It has a sweet, fruity aroma with floral and earthy undertones, making it a pleasant choice for managing stress and improving mood.",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Sweet", "Fruity", "Earthy", "Floral"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "xeno",
        "name": "Xeno",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 50% Sativa / 50% Indica",
        "genetics": "Kush Mints x Zkittlez",
        "floweringType": "Photoperiod",
        "description": "A potent and flavorful hybrid strain that offers a balanced high. It combines the minty, diesel notes of Kush Mints with the sweet, fruity candy flavor of Zkittlez. The effect is both euphoric and relaxing, perfect for any time of day.",
        "thc": 23,
        "cbd": 1,
        "thcRange": "20-26%",
        "cbdRange": "<1%",
        "floweringTime": 9,
        "floweringTimeRange": "8-10",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Sweet", "Fruity", "Mint", "Diesel"],
        "dominantTerpenes": ["Limonene", "Caryophyllene", "Myrcene"]
    }),
    createStrainObject({
        "id": "xj-13",
        "name": "XJ-13",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 50% Sativa / 50% Indica",
        "genetics": "Jack Herer x G13 Haze",
        "floweringType": "Photoperiod",
        "description": "A sativa-dominant hybrid praised for its therapeutic qualities and paranoia-free cerebral effects. It delivers a clear-headed, creative, and focused high, making it excellent for daytime use. The aroma is a delightful mix of lemon, pine, and sweet spice.",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Tall",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "150-200 cm", "outdoor": "180-250 cm" }
        },
        "aromas": ["Lemon", "Pine", "Spicy", "Sweet"],
        "dominantTerpenes": ["Terpinolene", "Caryophyllene", "Pinene"]
    })
];