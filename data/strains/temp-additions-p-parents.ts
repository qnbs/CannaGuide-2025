import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "respect", "name": "Respect", "type": StrainType.Hybrid, "typeDetails": "Hybrid 50% / 50% (CBD Rich)",
        "genetics": "Juanita la Lagrimosa x Cannalope Haze", "floweringType": "Photoperiod", "thc": 10, "cbd": 10,
        "description": "A CBD-rich strain with a 1:1 THC:CBD ratio, known for its clear-headed and therapeutic effects. It has a fruity and hazy aroma. It is a parent of Painkiller XL.",
        "floweringTime": 9, "agronomic": { "difficulty": "Medium", "yield": "High", "height": "Medium" },
        "aromas": ["Fruity", "Haze", "Sweet", "Spicy"], "dominantTerpenes": ["Myrcene", "Terpinolene", "Pinene"]
    }),
    createStrainObject({
        "id": "panamanian-landrace", "name": "Panamanian Landrace", "type": StrainType.Sativa, "typeDetails": "Sativa 100%",
        "genetics": "Landrace", "floweringType": "Photoperiod", "thc": 18, "cbd": 1,
        "description": "A pure Sativa landrace from Panama, famous for its long flowering time and its energizing, cerebral, and almost psychedelic effect. A classic from the 1960s.",
        "floweringTime": 11, "agronomic": { "difficulty": "Hard", "yield": "Medium", "height": "Tall" },
        "aromas": ["Tropical", "Sweet", "Earthy", "Spicy"], "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "citral-13", "name": "Citral #13", "type": StrainType.Hybrid, "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "Citral x Skunk", "floweringType": "Photoperiod", "thc": 21, "cbd": 1,
        "description": "A potent phenotype of the Citral strain, known for its strong citrus and skunky aroma. The effect is relaxing and euphoric. It is a parent of Papaya.",
        "floweringTime": 8, "agronomic": { "difficulty": "Medium", "yield": "Medium", "height": "Medium" },
        "aromas": ["Citrus", "Lemon", "Skunk", "Sweet"], "dominantTerpenes": ["Myrcene", "Limonene", "Terpinolene"]
    }),
    createStrainObject({
        "id": "the-menthol", "name": "The Menthol", "type": StrainType.Hybrid, "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Gelato 45 x (White Diesel x (High Octane x Jet Fuel))", "floweringType": "Photoperiod", "thc": 25, "cbd": 1,
        "description": "A unique hybrid known for its distinctively sharp, minty, and chemical aroma, reminiscent of menthol. The high is balanced, offering an uplifting and creative cerebral buzz followed by a soothing body calm.",
        "floweringTime": 9.5, "agronomic": { "difficulty": "Medium", "yield": "High", "height": "Medium" },
        "aromas": ["Mint", "Chemical", "Diesel", "Menthol"], "dominantTerpenes": ["Limonene", "Caryophyllene", "Myrcene"]
    }),
    createStrainObject({
        "id": "sherb-bx", "name": "Sherb Bx", "type": StrainType.Hybrid, "typeDetails": "Indica 85% / Sativa 15%",
        "genetics": "Sunset Sherbet (Backcross)", "floweringType": "Photoperiod", "thc": 24, "cbd": 1,
        "description": "A backcross of the famous Sunset Sherbet, bred to stabilize and enhance its desirable traits. It has a sweet, fruity, and creamy aroma. The effect is relaxing and happy. Parent of Permanent Marker.",
        "floweringTime": 9, "agronomic": { "difficulty": "Medium", "yield": "Medium", "height": "Medium" },
        "aromas": ["Sweet", "Fruity", "Creamy", "Berry"], "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "peyote-purple", "name": "Peyote Purple", "type": StrainType.Indica, "typeDetails": "Indica 100%",
        "genetics": "Bubba Kush (selected phenotype)", "floweringType": "Photoperiod", "thc": 20, "cbd": 1,
        "description": "A pure Indica selected from Bubba Kush, known for its vibrant purple colors and a sweet, earthy, and coffee-like aroma. The effect is deeply relaxing and almost psychedelic.",
        "floweringTime": 8.5, "agronomic": { "difficulty": "Easy", "yield": "Medium", "height": "Short" },
        "aromas": ["Coffee", "Earthy", "Sweet", "Vanilla"], "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    }),
    createStrainObject({
        "id": "cookies-kush", "name": "Cookies Kush", "type": StrainType.Hybrid, "typeDetails": "Indica 70% / Sativa 30%",
        "genetics": "GSC x OG Kush", "floweringType": "Photoperiod", "thc": 24, "cbd": 1.2,
        "description": "An award-winning indica-dominant hybrid from Barney's Farm. It combines the sweet minty flavor of GSC with the potent effects of OG Kush. The effect is strong, relaxing, and happy.",
        "floweringTime": 8, "agronomic": { "difficulty": "Easy", "yield": "High", "height": "Short" },
        "aromas": ["Mint", "Chocolate", "Sweet", "Earthy"], "dominantTerpenes": ["Limonene", "Caryophyllene", "Myrcene"]
    }),
    createStrainObject({
        "id": "platinum-puff", "name": "Platinum Puff", "type": StrainType.Hybrid, "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "Platinum OG x GSC", "floweringType": "Photoperiod", "thc": 25, "cbd": 1,
        "description": "A potent hybrid known for its frosty appearance and a sweet, earthy aroma. The effect is strong, euphoric, and relaxing. It is a parent of Project 4516.",
        "floweringTime": 9.5, "agronomic": { "difficulty": "Medium", "yield": "Medium", "height": "Medium" },
        "aromas": ["Sweet", "Earthy", "Pungent", "Spicy"], "dominantTerpenes": ["Caryophyllene", "Limonene", "Myrcene"]
    }),
    createStrainObject({
        "id": "pina-acai", "name": "Pina Acai", "type": StrainType.Hybrid, "typeDetails": "Sativa 60% / Indica 40%",
        "genetics": "Unknown", "floweringType": "Photoperiod", "thc": 22, "cbd": 1,
        "description": "A sativa-dominant hybrid known for its exotic tropical fruit aroma, blending pineapple and acai berries. It delivers an uplifting, energetic, and happy high, making it a parent of Red Velvet.",
        "floweringTime": 9.5, "agronomic": { "difficulty": "Medium", "yield": "Medium", "height": "Medium" },
        "aromas": ["Pineapple", "Berry", "Sweet", "Tropical"], "dominantTerpenes": ["Myrcene", "Pinene", "Limonene"]
    }),
    createStrainObject({
        "id": "pine-tar-kush", "name": "Pine Tar Kush", "type": StrainType.Indica, "typeDetails": "Indica 100%",
        "genetics": "Pakistani Landrace", "floweringType": "Photoperiod", "thc": 20, "cbd": 1,
        "description": "A pure indica landrace from Pakistan, known for its extremely sticky resin and a classic, pungent pine and skunk aroma. It provides a deeply relaxing and sedative body high.",
        "floweringTime": 8, "agronomic": { "difficulty": "Easy", "yield": "Medium", "height": "Short" },
        "aromas": ["Pine", "Skunk", "Earthy", "Pungent"], "dominantTerpenes": ["Myrcene", "Pinene", "Terpinolene"]
    }),
    createStrainObject({
        "id": "pineapple-trainwreck", "name": "Pineapple Trainwreck", "type": StrainType.Hybrid, "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Pineapple Express x Trainwreck", "floweringType": "Photoperiod", "thc": 23, "cbd": 1,
        "description": "A potent sativa-dominant hybrid that combines the tropical flavor of Pineapple Express with the hard-hitting effects of Trainwreck. The result is an energetic, creative, and euphoric high.",
        "floweringTime": 9, "agronomic": { "difficulty": "Medium", "yield": "High", "height": "Tall" },
        "aromas": ["Pineapple", "Sweet", "Tropical", "Spicy"], "dominantTerpenes": ["Terpinolene", "Myrcene", "Pinene"]
    }),
    createStrainObject({
        "id": "burmese-kush", "name": "Burmese Kush", "type": StrainType.Hybrid, "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "Burmese Landrace x OG Kush", "floweringType": "Photoperiod", "thc": 20, "cbd": 1,
        "description": "An indica-dominant hybrid known for its relaxing yet clear-headed effects. The aroma is sweet and earthy with pine undertones. It is one of the parents of Pink Panties.",
        "floweringTime": 8, "agronomic": { "difficulty": "Easy", "yield": "Medium", "height": "Short" },
        "aromas": ["Sweet", "Earthy", "Pine", "Herbal"], "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "purple-thai", "name": "Purple Thai", "type": StrainType.Sativa, "typeDetails": "Sativa 100%",
        "genetics": "Thai Landrace x Highland Oaxacan Gold", "floweringType": "Photoperiod", "thc": 22, "cbd": 1,
        "description": "A classic sativa landrace cross known for its energetic, euphoric effects and beautiful purple hues. It delivers a creative and uplifting high. It is a key parent of Purple Haze.",
        "floweringTime": 12, "agronomic": { "difficulty": "Hard", "yield": "Medium", "height": "Tall" },
        "aromas": ["Grape", "Berry", "Earthy", "Floral"], "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "purple-afghani", "name": "Purple Afghani", "type": StrainType.Indica, "typeDetails": "Indica 100%",
        "genetics": "Afghani Landrace (purple phenotype)", "floweringType": "Photoperiod", "thc": 19, "cbd": 1,
        "description": "A pure indica known for its deep purple coloration and classic Afghani effects. It provides a deeply relaxing and sedating body high, with a sweet and earthy aroma. It is a parent of Purple Kush.",
        "floweringTime": 8, "agronomic": { "difficulty": "Easy", "yield": "Medium", "height": "Short" },
        "aromas": ["Earthy", "Sweet", "Grape", "Pungent"], "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    })
];