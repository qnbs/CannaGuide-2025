import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strainsNumeric: Strain[] = [
    createStrainObject({
        "id": "1024",
        "name": "1024",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 70% Sativa / 30% Indica",
        "genetics": "Unknown cross",
        "floweringType": "Photoperiod",
        "thc": 22.5,
        "cbd": 2.5,
        "thcRange": "20-25%",
        "cbdRange": "1-4%",
        "floweringTime": 12,
        "floweringTimeRange": "11-13",
        "description": "A highly potent sativa-dominant strain from Medical Seeds Co., whose exact genetics are a well-kept secret. It's known for its intense, cerebral, and long-lasting effect that promotes creativity and euphoria. The complex aroma blends sweet, fruity notes with incense and spice.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "150-220 cm", "outdoor": "180-250 cm" }
        },
        "aromas": ["Sweet", "Fruity", "Spicy", "Incense"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "24k-gold",
        "name": "24k Gold",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 60% Indica / 40% Sativa",
        "genetics": "Kosher Kush x Tangie",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "18-26%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "Also known as Kosher Tangie, 24k Gold is an indica-dominant hybrid celebrated for its stunning appearance and powerful citrus aroma. It delivers a happy, uplifting high that gently melts into a deep body relaxation, making it ideal for stress relief without complete mental fog.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "450-550 g/m²", "outdoor": "500-600 g/plant" },
            "heightDetails": { "indoor": "150-200 cm", "outdoor": "180-220 cm" }
        },
        "aromas": ["Tangerine", "Citrus", "Sweet", "Pungent"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "303-og",
        "name": "303 OG",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 70% Indica / 30% Sativa",
        "genetics": "Pre-98 Bubba Kush x Chemdawg",
        "floweringType": "Photoperiod",
        "thc": 22,
        "cbd": 1,
        "thcRange": "18-26%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "Originating from Colorado's 303 area code, this indica-dominant strain is known for its classic OG characteristics. It delivers a potent, fast-acting high that starts with cerebral euphoria before settling into a deep, full-body relaxation. Its aroma is a pungent mix of earthy, piney, and diesel notes.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Low",
            "height": "Medium",
            "yieldDetails": { "indoor": "300-400 g/m²", "outdoor": "350-450 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Earthy", "Pine", "Pungent", "Diesel"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Limonene"]
    }),
    createStrainObject({
        "id": "501st-og",
        "name": "501st OG",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 80% Indica / 20% Sativa",
        "genetics": "Skywalker OG x Rare Dankness #1",
        "floweringType": "Photoperiod",
        "thc": 21.5,
        "cbd": 1,
        "thcRange": "17-26%",
        "cbdRange": "<1%",
        "floweringTime": 8,
        "floweringTimeRange": "7-9",
        "description": "Named after the elite clone trooper legion from Star Wars, 501st OG is a potent indica-dominant strain. It boasts a sweet, fruity aroma with earthy and piney undertones. The effect is heavily physical, providing deep relaxation that can effectively combat pain and insomnia, making it a powerful force for evening use.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Short",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "80-120 cm", "outdoor": "100-150 cm" }
        },
        "aromas": ["Sweet", "Fruity", "Earthy", "Pine"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "707-headband",
        "name": "707 Headband",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 70% Sativa / 30% Sativa",
        "genetics": "(Sour Diesel x OG Kush) x Master Kush",
        "floweringType": "Photoperiod",
        "thc": 22.5,
        "cbd": 1,
        "thcRange": "19-26%",
        "cbdRange": "<1%",
        "floweringTime": 9.5,
        "floweringTimeRange": "9-10",
        "description": "Originating from Humboldt County (area code 707), this sativa-dominant strain is a special phenotype of Headband. It is known for delivering a classic 'headband' sensation of pressure around the temples, accompanied by an uplifting, creative, and long-lasting cerebral high that gently eases into relaxation. Its aroma is a pungent mix of earthy lemon and diesel.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "High",
            "height": "Tall",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "150-200 cm", "outdoor": ">200 cm" }
        },
        "aromas": ["Earthy", "Citrus", "Diesel", "Pungent"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    }),
    createStrainObject({
        "id": "8-ball-kush",
        "name": "8 Ball Kush",
        "type": StrainType.Indica,
        "typeDetails": "Indica - 100% Indica",
        "genetics": "Afghan Landrace",
        "floweringType": "Photoperiod",
        "thc": 18.5,
        "cbd": 3,
        "thcRange": "15-22%",
        "cbdRange": "1-5%",
        "floweringTime": 8,
        "floweringTimeRange": "7-9",
        "description": "A pure Indica strain derived from Afghani landraces in the Hindu Kush region. It's prized for its high resin production, making it excellent for hash. The effect is strong, deeply relaxing, and sedating, with a classic earthy and spicy aroma. Ideal for evening use.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "Medium",
            "height": "Short",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "70-100 cm", "outdoor": "90-120 cm" }
        },
        "aromas": ["Earthy", "Spicy", "Sweet", "Pine"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "9-pound-hammer",
        "name": "9 Pound Hammer",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 80% Indica / 20% Sativa",
        "genetics": "Gooberry x Hells OG x Jack The Ripper",
        "floweringType": "Photoperiod",
        "thc": 20,
        "cbd": 1,
        "thcRange": "17-23%",
        "cbdRange": "~1%",
        "floweringTime": 8,
        "floweringTimeRange": "7-9",
        "description": "A potent indica-dominant strain that lives up to its name with heavy, sedating effects. It has a sweet, fruity aroma of grapes and limes. The high is fast-acting, providing a strong wave of relaxation that is perfect for combating pain and insomnia at the end of the day.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Short",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "80-120 cm", "outdoor": "100-150 cm" }
        },
        "aromas": ["Grape", "Lime", "Sweet", "Fruity"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    })
];