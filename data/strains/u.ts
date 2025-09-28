
import { Strain, StrainType } from '@/types';

export const strainsU: Strain[] = [
    {
        "id": "uk-cheese",
        "name": "UK Cheese",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 50% Sativa / 50% Indica",
        "genetics": "Skunk #1 Phenotype",
        "floweringType": "Photoperiod",
        "thc": 20.5,
        "cbd": 1,
        "thcRange": "18-23%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "Eine legendäre Hybridsorte, die im Vereinigten Königreich entstanden ist. Sie ist ein Phänotyp von Skunk #1 und berühmt für ihr ausgeprägtes, scharfes, käsiges Aroma. UK Cheese bietet ein ausgewogenes High, das mit einem energetischen, euphorischen Rausch beginnt und in einen entspannenden Körperstein übergeht, was sie für die Bewältigung von Stress und Schmerzen über den Tag hinweg geeignet macht.",
        "agronomic": {
            "difficulty": "Easy",
            "yield": "High",
            "height": "Medium",
            "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Cheese", "Pungent", "Skunk", "Earthy"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"]
    },
    {
        "id": "unicorn-poop",
        "name": "Unicorn Poop",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid - 50% Sativa / 50% Indica",
        "genetics": "GMO Cookies x Sophisticated Lady",
        "floweringType": "Photoperiod",
        "thc": 23,
        "cbd": 1,
        "thcRange": "21-25%",
        "cbdRange": "<1%",
        "floweringTime": 8.5,
        "floweringTimeRange": "8-9",
        "description": "Eine ausgewogene Hybride mit einem süßen, fruchtigen und erdigen Aroma. Die Wirkung ist entspannend, glücklich und erhebend.",
        "agronomic": {
            "difficulty": "Medium",
            "yield": "Medium",
            "height": "Medium",
            "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/plant" },
            "heightDetails": { "indoor": "100-150 cm", "outdoor": "120-180 cm" }
        },
        "aromas": ["Sweet", "Fruity", "Earthy", "Citrus"],
        "dominantTerpenes": ["Limonene", "Caryophyllene", "Myrcene"]
    }
];