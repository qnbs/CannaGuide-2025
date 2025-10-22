import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
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