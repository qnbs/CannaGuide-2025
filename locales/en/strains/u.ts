import { StrainTranslationData } from '@/types';

export const strains: Record<string, StrainTranslationData> = {
    "unicorn-poop": {
        "description": "A balanced hybrid with a sweet, fruity, and earthy aroma. The effect is relaxing, happy, and uplifting.",
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "GMO Cookies x Sophisticated Lady",
        "aromas": ["Sweet", "Fruity", "Earthy", "Citrus"],
        "dominantTerpenes": ["Limonene", "Caryophyllene", "Myrcene"],
        "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "~550 g/plant" },
        "heightDetails": { "indoor": "100-150 cm", "outdoor": "up to 1.8 m" }
    },
    "uk-cheese": {
        "description": "A legendary hybrid strain that originated in the United Kingdom. It is a phenotype of Skunk #1 and is famous for its distinct, pungent cheesy aroma. UK Cheese provides a balanced high, starting with an energetic, euphoric buzz that mellows into a relaxing body stone, making it suitable for managing stress and pain throughout the day.",
        "typeDetails": "Hybrid 50% / 50%",
        "genetics": "Skunk #1 Phenotype",
        "aromas": ["Cheese", "Pungent", "Skunk", "Earthy"],
        "dominantTerpenes": ["Caryophyllene", "Myrcene", "Limonene"],
        "yieldDetails": { "indoor": "450-550 g/m²", "outdoor": "~600 g/plant" },
        "heightDetails": { "indoor": "Medium", "outdoor": "Medium (up to 1.8m)" }
    }
};