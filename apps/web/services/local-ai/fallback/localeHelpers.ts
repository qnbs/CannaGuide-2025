// ---------------------------------------------------------------------------
// localeHelpers.ts -- Shared localization helpers for fallback services
// ---------------------------------------------------------------------------
// Centralizes language resolution for all heuristic fallback modules.
// Replaces duplicated isGerman() checks with full 5-language support.
// ---------------------------------------------------------------------------

import type { Language } from '@/types'

/** Map of language codes to human-readable language names. */
export const LANGUAGE_NAMES: Readonly<Record<Language, string>> = {
    en: 'English',
    de: 'German',
    es: 'Spanish',
    fr: 'French',
    nl: 'Dutch',
}

/**
 * Resolve a localized string with English fallback.
 * Accepts a partial record -- missing languages fall back to 'en'.
 */
export const localizeStr = (
    lang: Language,
    texts: Partial<Record<Language, string>> & { en: string },
): string => texts[lang] ?? texts['en']

/**
 * Build a language constraint instruction for AI prompts.
 * Mirrors the pattern used in promptHandlers.ts.
 */
export const languageConstraint = (lang: Language): string =>
    `CRITICAL: You MUST respond ENTIRELY in ${LANGUAGE_NAMES[lang]}. Do not use any other language.`

/**
 * Return a localized instruction for AI prompts.
 * Accepts per-language instructions with English fallback.
 */
export const localizeInstruction = (
    lang: Language,
    instructions: Partial<Record<Language, string>> & { en: string },
): string => instructions[lang] ?? instructions['en']
