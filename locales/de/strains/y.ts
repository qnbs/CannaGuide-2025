import type { StrainTranslationData } from '@/types';

export const strains: Record<string, StrainTranslationData> = {
    "ya-hemi": {
        "description": "Eine sativa-dominante Hybride mit einem starken, fruchtigen Aroma, untermalt von gasartigen und erdigen Noten. Ya Hemi bietet ein potentes, euphorisches und kreatives High, das perfekt für den Tagesgebrauch ist und dich energetisiert und fokussiert hält.",
        "typeDetails": "Hybrid - 60% Sativa / 40% Indica",
        "genetics": "Melonatta x Project 4516",
        "yieldDetails": { "indoor": "500-600 g/m²", "outdoor": "600-700 g/Pflanze" },
        "heightDetails": { "indoor": "120-180 cm", "outdoor": "150-220 cm" }
    },
    "yeti-og": {
        "description": "Eine indica-dominante Hybride mit einem klassischen OG-Aroma von Erde, Kiefer und Diesel. Yeti OG liefert ein schweres, entspannendes Körper-High, das hervorragend zur Linderung von Schmerzen und Stress geeignet ist und oft zu einem schläfrigen Zustand führt.",
        "typeDetails": "Hybrid - 70% Indica / 30% Sativa",
        "genetics": "OG Kush x eine unbekannte Sorte",
        "yieldDetails": { "indoor": "300-400 g/m²", "outdoor": "350-450 g/Pflanze" },
        "heightDetails": { "indoor": "70-100 cm", "outdoor": "90-130 cm" }
    },
    "yumboldt": {
        "description": "Eine Old-School-Indica-Landrasse aus Humboldt County, Kalifornien. Sie bietet ein tief entspannendes und beruhigendes High mit einem süßen, erdigen Aroma, das an Haschisch und Beeren erinnert. Eine gute Wahl für eine klassische, beruhigende Indica-Erfahrung.",
        "typeDetails": "Indica - 100% Indica",
        "genetics": "Humboldt County, CA Landrasse",
        "yieldDetails": { "indoor": "400-500 g/m²", "outdoor": "450-550 g/Pflanze" },
        "heightDetails": { "indoor": "80-120 cm", "outdoor": "100-150 cm" }
    }
};
