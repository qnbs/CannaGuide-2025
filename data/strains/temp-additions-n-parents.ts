import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "shishkaberry", "name": "Shishkaberry", "type": StrainType.Hybrid, "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "DJ Short Blueberry x Afghani", "floweringType": "Photoperiod", "thc": 22, "cbd": 1, "floweringTime": 8
    }),
    createStrainObject({
        "id": "dj-short-blueberry", "name": "DJ Short Blueberry", "type": StrainType.Hybrid, "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Afghani x Thai", "floweringType": "Photoperiod", "thc": 20, "cbd": 1, "floweringTime": 8
    }),
    createStrainObject({
        "id": "g13-hashplant", "name": "G13 Hashplant", "type": StrainType.Hybrid, "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "G13 x Hash Plant", "floweringType": "Photoperiod", "thc": 21, "cbd": 1, "floweringTime": 9
    }),
    createStrainObject({
        "id": "nicole-kush", "name": "Nicole Kush", "type": StrainType.Hybrid, "typeDetails": "Indica 75% / Sativa 25%",
        "genetics": "Kosher Kush x MK Ultra", "floweringType": "Photoperiod", "thc": 23, "cbd": 1, "floweringTime": 8.5
    }),
    createStrainObject({
        "id": "naran-j", "name": "Naran J", "type": StrainType.Hybrid, "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Orange Juice x New England Rock Candy", "floweringType": "Photoperiod", "thc": 24, "cbd": 1, "floweringTime": 9
    }),
    createStrainObject({
        "id": "new-england-rock-candy", "name": "New England Rock Candy", "type": StrainType.Hybrid, "typeDetails": "Indica 60% / Sativa 40%",
        "genetics": "Rock Candy Kush x an unknown strain", "floweringType": "Photoperiod", "thc": 20, "cbd": 1, "floweringTime": 9
    }),
    createStrainObject({
        "id": "american-haze", "name": "American Haze", "type": StrainType.Hybrid, "typeDetails": "Sativa 80% / Indica 20%",
        "genetics": "Haze x American Sativa", "floweringType": "Photoperiod", "thc": 21, "cbd": 1, "floweringTime": 10
    }),
    createStrainObject({
        "id": "master-widow", "name": "Master Widow", "type": StrainType.Hybrid, "typeDetails": "Hybrid 50% / 50%",
        "genetics": "White Widow x Master Kush", "floweringType": "Photoperiod", "thc": 22, "cbd": 1, "floweringTime": 9
    }),
    createStrainObject({
        "id": "northern-lights-5", "name": "Northern Lights #5", "type": StrainType.Indica, "typeDetails": "Indica 95% / Sativa 5%",
        "genetics": "Northern Lights (phenotype)", "floweringType": "Photoperiod", "thc": 23, "cbd": 1, "floweringTime": 8
    }),
    createStrainObject({
        "id": "bc-hashplant", "name": "BC Hashplant", "type": StrainType.Indica, "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Hash Plant x BC Kush", "floweringType": "Photoperiod", "thc": 20, "cbd": 1, "floweringTime": 8
    }),
    createStrainObject({
        "id": "harmony", "name": "Harmony", "type": StrainType.Hybrid, "typeDetails": "Sativa 70% / Indica 30% (CBD Rich)",
        "genetics": "Unknown CBD strain", "floweringType": "Photoperiod", "thc": 8, "cbd": 12, "floweringTime": 9
    }),
    createStrainObject({
        "id": "og-chem-4-ibx", "name": "OG/Chem #4 IBX", "type": StrainType.Hybrid, "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Chemdawg #4 (backcross)", "floweringType": "Photoperiod", "thc": 25, "cbd": 1, "floweringTime": 9.5
    })
];