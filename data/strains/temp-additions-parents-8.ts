import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "bangi-haze",
        "name": "Bangi Haze",
        "type": StrainType.Sativa,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Congolese Sativa x Nepalese Indica",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "A classic sativa from ACE Seeds, known for its resistance to cold and mold. It delivers a clean, energetic, and focused cerebral high without paranoia. The aroma is sweet and floral with hints of anise and lemon.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Tall"
        },
        "aromas": ["Sweet", "Floral", "Anise", "Lemon", "Spicy"],
        "dominantTerpenes": ["Terpinolene", "Myrcene", "Pinene"]
    }),
    createStrainObject({
        "id": "bay-11",
        "name": "Bay 11",
        "type": StrainType.Sativa,
        "typeDetails": "Sativa 80% / Indica 20%",
        "genetics": "Appalachia (Green Crack x Tres Dawg)",
        "floweringType": "Photoperiod",
        "thc": 24,
        "cbd": 1,
        "thcRange": "22-26%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "An award-winning (High Times Cannabis Cup 2011) sativa strain known for its dense, crystal-coated buds. It provides a potent, uplifting, and creative high that's great for daytime use. The aroma is sweet and piney with earthy undertones.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Pine", "Sweet", "Earthy", "Woody"],
        "dominantTerpenes": ["Pinene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "biker-kush",
        "name": "Biker Kush",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 85% / Sativa 15%",
        "genetics": "Hell's OG x Lucifer OG",
        "floweringType": "Photoperiod",
        "thc": 27,
        "cbd": 1,
        "thcRange": "24-30%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "A potent indica-dominant strain from Karma Genetics. It delivers a heavy, relaxing body high that is great for pain relief and insomnia. The aroma is a classic OG profile with pungent notes of lemon, pine, and diesel fuel.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium"
        },
        "aromas": ["Lemon", "Pine", "Diesel", "Pungent", "Earthy"],
        "dominantTerpenes": ["Limonene", "Myrcene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "blue-monster",
        "name": "Blue Monster",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "G13 x Blueberry x Northern Lights #5 x Mexican Sativa",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "20-24%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "A potent indica-dominant strain known for its large, resinous buds and sweet berry flavor. It provides a long-lasting, deeply relaxing body high that can lead to couch-lock, making it ideal for evening use.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Short"
        },
        "aromas": ["Berry", "Sweet", "Fruity", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "california-black-rose",
        "name": "California Black Rose",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Roze x OG Eddy",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "18-22%",
        "cbdRange": "<1%",
        "floweringTime": 7.5,
        "floweringTimeRange": "7-8",
        "description": "An award-winning indica strain known for its fast flowering time and unique floral, rose-like aroma with fruity undertones. It provides a relaxing and calming effect, perfect for unwinding. Its beautiful dark purple to black coloration makes it visually stunning.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short"
        },
        "aromas": ["Rose", "Floral", "Sweet", "Fruity"],
        "dominantTerpenes": ["Myrcene", "Linalool", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "california-orange-cbd",
        "name": "California Orange CBD",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50% (CBD Dominant)",
        "genetics": "California Orange x high-CBD strain",
        "floweringType": "Photoperiod",
        "thc": 7,
        "cbd": 12,
        "thcRange": "5-10%",
        "cbdRange": "10-15%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "A CBD-rich version of the classic California Orange. It offers a ~1:2 THC to CBD ratio, providing a mild, uplifting, and functional effect with significant therapeutic benefits. The aroma is a sweet and tangy burst of fresh oranges and citrus.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Medium"
        },
        "aromas": ["Orange", "Citrus", "Sweet", "Tangy"],
        "dominantTerpenes": ["Limonene", "Myrcene", "Terpinolene"]
    })
];