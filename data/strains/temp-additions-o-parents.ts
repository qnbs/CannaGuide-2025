import { Strain, StrainType } from '@/types';
import { createStrainObject } from '@/services/strainFactory';

export const strains: Strain[] = [
    createStrainObject({
        "id": "orange-crush",
        "name": "Orange Crush",
        "type": StrainType.Hybrid,
        "typeDetails": "Sativa 70% / Indica 30%",
        "genetics": "Cali-O (California Orange) x Blueberry",
        "floweringType": "Photoperiod",
        "thc": 22, "cbd": 1, "floweringTime": 8.5,
        "description": "A sativa-dominant hybrid known for its strong, sweet orange aroma and uplifting, cerebral effects. It provides an energetic and happy high, making it a great choice for daytime use.",
        "agronomic": { "difficulty": "Easy", "yield": "High", "height": "Medium" },
        "aromas": ["Orange", "Citrus", "Sweet", "Fruity"],
        "dominantTerpenes": ["Myrcene", "Terpinolene", "Pinene"]
    }),
    createStrainObject({
        "id": "orange-cream",
        "name": "Orange Cream",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Orange Crush x Juicy Fruit",
        "floweringType": "Photoperiod",
        "thc": 20, "cbd": 1, "floweringTime": 8.5,
        "description": "A balanced hybrid with a sweet and creamy citrus flavor, reminiscent of an orange creamsicle. The effects are typically balanced, providing a happy, uplifting mental state along with gentle physical relaxation.",
        "agronomic": { "difficulty": "Medium", "yield": "Medium", "height": "Medium" },
        "aromas": ["Orange", "Creamy", "Sweet", "Vanilla"],
        "dominantTerpenes": ["Myrcene", "Limonene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "northern-lights-1",
        "name": "Northern Lights #1",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Afghani (phenotype)",
        "floweringType": "Photoperiod",
        "thc": 18, "cbd": 1, "floweringTime": 7,
        "description": "One of the original, foundational phenotypes of the Northern Lights line. A pure, fast-flowering indica known for its high resin production and deeply relaxing effects. Its genetics are a cornerstone of many modern hybrids.",
        "agronomic": { "difficulty": "Easy", "yield": "Medium", "height": "Short" },
        "aromas": ["Earthy", "Pine", "Sweet", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
    }),
    createStrainObject({
        "id": "blueberry-skunk",
        "name": "Blueberry Skunk",
        "type": StrainType.Hybrid,
        "typeDetails": "Indica 80% / Sativa 20%",
        "genetics": "Blueberry x Skunk #1",
        "floweringType": "Photoperiod",
        "thc": 19, "cbd": 1, "floweringTime": 8.5,
        "description": "An indica-dominant hybrid that combines the sweet berry flavors of Blueberry with the pungent, potent effects of Skunk #1. It delivers a relaxing body high accompanied by a happy, uplifting mental state.",
        "agronomic": { "difficulty": "Easy", "yield": "High", "height": "Medium" },
        "aromas": ["Blueberry", "Skunk", "Sweet", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "lowryder-1",
        "name": "Lowryder #1",
        "type": StrainType.Hybrid,
        "typeDetails": "Hybrid 50% / 50% (Autoflower)",
        "genetics": "Northern Lights #2 x William's Wonder x Ruderalis",
        "floweringType": "Autoflower",
        "thc": 12, "cbd": 1, "floweringTime": 8.5,
        "description": "The original autoflowering strain that revolutionized cannabis cultivation. It is small, fast, and discreet, with a mild, relaxing effect. Its genetics are the foundation for a vast number of modern autoflowers.",
        "agronomic": { "difficulty": "Easy", "yield": "Low", "height": "Short" },
        "aromas": ["Earthy", "Pine", "Spicy"],
        "dominantTerpenes": ["Myrcene", "Caryophyllene", "Pinene"]
    }),
    createStrainObject({
        "id": "williams-wonder",
        "name": "William's Wonder",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Afghani Landrace",
        "floweringType": "Photoperiod",
        "thc": 22, "cbd": 1, "floweringTime": 8,
        "description": "A classic, old-school indica known for its high yields, fast flowering time, and potent, relaxing effects. It has a sweet, citrusy, and floral aroma. It's a key parent of the original Lowryder.",
        "agronomic": { "difficulty": "Easy", "yield": "High", "height": "Short" },
        "aromas": ["Sweet", "Citrus", "Floral", "Earthy"],
        "dominantTerpenes": ["Myrcene", "Linalool", "Pinene"]
    }),
    createStrainObject({
        "id": "northern-lights-2",
        "name": "Northern Lights #2",
        "type": StrainType.Indica,
        "typeDetails": "Indica 100%",
        "genetics": "Northern Lights (phenotype)",
        "floweringType": "Photoperiod",
        "thc": 19, "cbd": 1, "floweringTime": 7.5,
        "description": "A fast-flowering and highly resilient phenotype of the Northern Lights line. It is known for its strong indica effects and piney, earthy aroma. It is a parent of the original Lowryder.",
        "agronomic": { "difficulty": "Easy", "yield": "Medium", "height": "Short" },
        "aromas": ["Pine", "Earthy", "Sweet", "Pungent"],
        "dominantTerpenes": ["Pinene", "Myrcene", "Caryophyllene"]
    })
];