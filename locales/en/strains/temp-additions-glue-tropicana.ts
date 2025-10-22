import type { StrainTranslationData } from '@/types';

// This file is required to match the import structure of other locales (e.g., 'de').
// Since the base strain data is already in English, this file can be empty.
// Its existence resolves the "Failed to resolve module specifier" error during app startup.
export const strains: Record<string, StrainTranslationData> = {
    "monkey-glue": {},
    "tropicana-banana": {}
};