// ---------------------------------------------------------------------------
// speakNatural -- TTS Text Normalization Service (v1.8 CannaVoice Pro)
// ---------------------------------------------------------------------------
// Pure-function SSML workaround: transforms raw text into speech-friendly form.
// Handles abbreviations, numbers with units, cannabis-specific terms, markdown
// stripping, and language-aware formatting. Works with ALL TTS providers.
// ---------------------------------------------------------------------------

import type { Language } from '@/types'

/** Common cannabis/science abbreviations -> spellout. */
const ABBREVIATION_MAP: Record<string, string> = {
    pH: 'P H',
    EC: 'E C',
    VPD: 'V P D',
    THC: 'T H C',
    CBD: 'C B D',
    CBG: 'C B G',
    CBN: 'C B N',
    PPM: 'P P M',
    LED: 'L E D',
    HPS: 'H P S',
    DWC: 'D W C',
    RH: 'R H',
    CO2: 'C O 2',
    NPK: 'N P K',
    PPFD: 'P P F D',
    DLI: 'D L I',
    SCROG: 'S C R O G',
    SOG: 'S O G',
    LST: 'L S T',
    HST: 'H S T',
    ONNX: 'O N N X',
    WASM: 'W A S M',
    PWA: 'P W A',
    TTS: 'T T S',
    STT: 'S T T',
}

/** Build abbreviation regex -- match whole words only, case-sensitive. */
const abbreviationRegex = new RegExp(`\\b(${Object.keys(ABBREVIATION_MAP).join('|')})\\b`, 'g')

/** Unit expansions keyed by language. */
const UNIT_EXPANSIONS: Record<string, Record<Language, string>> = {
    C: {
        en: 'degrees Celsius',
        de: 'Grad Celsius',
        es: 'grados Celsius',
        fr: 'degres Celsius',
        nl: 'graden Celsius',
    },
    F: {
        en: 'degrees Fahrenheit',
        de: 'Grad Fahrenheit',
        es: 'grados Fahrenheit',
        fr: 'degres Fahrenheit',
        nl: 'graden Fahrenheit',
    },
    '%': { en: 'percent', de: 'Prozent', es: 'por ciento', fr: 'pour cent', nl: 'procent' },
    ml: {
        en: 'milliliters',
        de: 'Milliliter',
        es: 'mililitros',
        fr: 'millilitres',
        nl: 'milliliter',
    },
    L: { en: 'liters', de: 'Liter', es: 'litros', fr: 'litres', nl: 'liter' },
    g: { en: 'grams', de: 'Gramm', es: 'gramos', fr: 'grammes', nl: 'gram' },
    kg: { en: 'kilograms', de: 'Kilogramm', es: 'kilogramos', fr: 'kilogrammes', nl: 'kilogram' },
    cm: {
        en: 'centimeters',
        de: 'Zentimeter',
        es: 'centimetros',
        fr: 'centimetres',
        nl: 'centimeter',
    },
    m: { en: 'meters', de: 'Meter', es: 'metros', fr: 'metres', nl: 'meter' },
    W: { en: 'watts', de: 'Watt', es: 'vatios', fr: 'watts', nl: 'watt' },
    lux: { en: 'lux', de: 'Lux', es: 'lux', fr: 'lux', nl: 'lux' },
}

/** Point/comma decimal word by language. */
const DECIMAL_WORD: Record<Language, string> = {
    en: 'point',
    de: 'Komma',
    es: 'coma',
    fr: 'virgule',
    nl: 'komma',
}

/**
 * Transform raw text into speech-friendly text for TTS output.
 *
 * Applies in order:
 * 1. Strip markdown formatting
 * 2. Expand abbreviations (pH -> P H, THC -> T H C)
 * 3. Expand numbers with units (22.5C -> 22 point 5 degrees Celsius)
 * 4. Normalize decimal numbers (22.5 -> 22 point 5)
 * 5. Insert natural pauses (sentence boundaries get extra spaces)
 *
 * @param text  Raw text from AI response or user content
 * @param lang  Current language (affects decimal word and unit expansion)
 * @returns     Speech-friendly normalized text
 */
export function speakNatural(text: string, lang: Language = 'en'): string {
    let result = text

    // 1. Strip markdown: **bold**, *italic*, __underline__, ~~strike~~
    result = result.replace(/\*\*(.+?)\*\*/g, '$1')
    result = result.replace(/\*(.+?)\*/g, '$1')
    result = result.replace(/__(.+?)__/g, '$1')
    result = result.replace(/~~(.+?)~~/g, '$1')

    // Strip markdown headers: ## Title -> Title
    result = result.replace(/^#{1,6}\s+/gm, '')

    // Strip markdown list markers: - item, * item, 1. item
    result = result.replace(/^[\s]*[-*]\s+/gm, '')
    result = result.replace(/^[\s]*\d+\.\s+/gm, '')

    // Strip markdown links: [text](url) -> text
    result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

    // Strip inline code backticks
    result = result.replace(/`([^`]+)`/g, '$1')

    // Strip code block fences
    result = result.replace(/```[\s\S]*?```/g, '')

    // 2. Expand abbreviations (case-sensitive)
    result = result.replace(abbreviationRegex, (match) => ABBREVIATION_MAP[match] ?? match)

    // 3. Expand numbers with degree symbol + unit (e.g. 22.5\u00b0C)
    const degreeUnitRegex = /(\d+)([.,])(\d+)\s*\u00b0?\s*(C|F)\b/g
    result = result.replace(
        degreeUnitRegex,
        (_match, whole: string, sep: string, frac: string, unit: string) => {
            const decWord = DECIMAL_WORD[lang]
            const unitWord = UNIT_EXPANSIONS[unit]?.[lang] ?? unit
            if (sep === ',' && lang === 'de') {
                return `${whole} ${decWord} ${frac} ${unitWord}`
            }
            return `${whole} ${decWord} ${frac} ${unitWord}`
        },
    )

    // 4. Expand numbers with units (e.g. 500ml, 15g, 1.2kg)
    const unitRegex = /(\d+)([.,])(\d+)\s*(ml|L|g|kg|cm|m|W|lux|%)\b/g
    result = result.replace(
        unitRegex,
        (_match, whole: string, sep: string, frac: string, unit: string) => {
            const decWord = DECIMAL_WORD[lang]
            const unitWord = UNIT_EXPANSIONS[unit]?.[lang] ?? unit
            if (sep === ',' && lang === 'de') {
                return `${whole} ${decWord} ${frac} ${unitWord}`
            }
            return `${whole} ${decWord} ${frac} ${unitWord}`
        },
    )

    // Whole numbers with units (e.g. 500ml, 15g)
    const wholeUnitRegex = /(\d+)\s*(ml|L|g|kg|cm|m|W|lux|%)\b/g
    result = result.replace(wholeUnitRegex, (_match, num: string, unit: string) => {
        const unitWord = UNIT_EXPANSIONS[unit]?.[lang] ?? unit
        return `${num} ${unitWord}`
    })

    // 5. Normalize standalone decimal numbers (e.g. 6.5 pH already expanded)
    const decimalRegex = /\b(\d+)\.(\d+)\b/g
    result = result.replace(decimalRegex, (_match, whole: string, frac: string) => {
        const decWord = DECIMAL_WORD[lang]
        return `${whole} ${decWord} ${frac}`
    })

    // German comma decimals (e.g. 6,5)
    if (lang === 'de') {
        const deDecimalRegex = /\b(\d+),(\d+)\b/g
        result = result.replace(deDecimalRegex, (_match, whole: string, frac: string) => {
            return `${whole} Komma ${frac}`
        })
    }

    // 6. Normalize multiple spaces/newlines into single space
    result = result.replace(/\n+/g, '. ')
    result = result.replace(/\s{2,}/g, ' ')

    return result.trim()
}
