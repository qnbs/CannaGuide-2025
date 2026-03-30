import type { StrainTranslationData } from '@/types'

// This file is required to match the import structure of other locales (e.g., 'de').
// Since the base strain data is already in English, this file can be empty.
// Its existence resolves the "Failed to resolve module specifier" error during app startup.
export const strains: Record<string, StrainTranslationData> = {
    'monkey-glue': {
        description:
            'Monkey Glue is a balanced hybrid that combines the extreme resinousness of GG4 with the complex aromatics of Wookie. The effect is potent and long-lasting, beginning with a euphoric head high that transitions into a comfortable but not overwhelming physical relaxation.',
        typeDetails: 'Hybrid 50% / 50%',
        genetics: 'Gorilla Glue #4 x Wookie #15',
    },
    'tropicana-banana': {
        description:
            'Tropicana Banana combines the citrus profile of Tropicana Cookies with the creamy sweetness of Banana Kush. The result is an exotic fruit cocktail aroma. The effect is happy, euphoric, and relaxing, perfect for social occasions or creative activities in the afternoon.',
        typeDetails: 'Hybrid 60% Sativa / 40% Indica',
        genetics: 'Tropicana Cookies x Banana Kush',
    },
}
