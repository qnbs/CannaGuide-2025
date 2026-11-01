import type { Language, Strain } from '@/types'
import { getT } from '@/i18n'
import { localizeStr } from './localeHelpers'
import { DIFFICULTY_VAL, HEIGHT_VAL, YIELD_VAL, type StylePalette } from './strainImagePalette'
import { svgDataBar, svgTerpeneDots } from './strainImageSvgParts'

interface StrainDataBarsResult {
    bars: string[]
    dataY: number
}

const knownBarPercent = (table: Record<string, number>, value: string | undefined): number => {
    if (value === undefined || !Object.hasOwn(table, value)) return 0
    const score = table[value]
    return typeof score === 'number' ? score : 0
}

const finiteNumber = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined

const scaledPercent = (value: number | undefined, scale: number): number =>
    value === undefined ? 0 : (value / scale) * 100

const percentLabel = (
    range: string | undefined,
    value: number | undefined,
    unknownLabel: string,
): string => {
    if (range) return range
    return value === undefined ? unknownLabel : `${value}%`
}

const pushBar = (
    bars: string[],
    y: number,
    label: string,
    percent: number,
    color: string,
    palette: StylePalette,
    display: string,
): number => {
    bars.push(svgDataBar(86, y, label, percent, color, palette.barBg, palette.textDim, display))
    return y + 36
}

const pushOptionalPercent = (
    bars: string[],
    y: number,
    label: string,
    value: number | null | undefined,
    color: string,
    palette: StylePalette,
): number => {
    if (value === undefined || value === null) return y
    return pushBar(bars, y, label, scaledPercent(value, 5), color, palette, `${value}%`)
}

const barLabel = (lang: Language, labels: Record<Language, string>): string =>
    localizeStr(lang, labels)

export const buildStrainDataBars = (
    strain: Strain,
    palette: StylePalette,
    lang: Language,
): StrainDataBarsResult => {
    const unknownLabel = getT()('common.unknown', { lng: lang })
    const thc = finiteNumber(strain.thc)
    const cbd = finiteNumber(strain.cbd)
    const agronomic = strain.agronomic
    const bars: string[] = []
    let dataY = pushBar(
        bars,
        820,
        'THC',
        scaledPercent(thc, 35),
        palette.accent,
        palette,
        percentLabel(strain.thcRange, thc, unknownLabel),
    )
    dataY = pushBar(
        bars,
        dataY,
        'CBD',
        scaledPercent(cbd, 25),
        palette.accent2,
        palette,
        percentLabel(strain.cbdRange, cbd, unknownLabel),
    )
    dataY = pushOptionalPercent(bars, dataY, 'CBG', strain.cbg, '#fbbf24', palette)
    dataY = pushOptionalPercent(bars, dataY, 'THCV', strain.thcv, '#2dd4bf', palette)
    dataY = pushBar(
        bars,
        dataY,
        barLabel(lang, {
            en: 'Difficulty',
            de: 'Schwierigkeit',
            es: 'Dificultad',
            fr: 'Difficulte',
            nl: 'Moeilijkheid',
        }),
        knownBarPercent(DIFFICULTY_VAL, agronomic?.difficulty),
        '#f97316',
        palette,
        agronomic?.difficulty ?? unknownLabel,
    )
    dataY = pushBar(
        bars,
        dataY,
        barLabel(lang, {
            en: 'Yield',
            de: 'Ertrag',
            es: 'Rendimiento',
            fr: 'Rendement',
            nl: 'Opbrengst',
        }),
        knownBarPercent(YIELD_VAL, agronomic?.yield),
        '#22c55e',
        palette,
        agronomic?.yield ?? unknownLabel,
    )
    dataY = pushBar(
        bars,
        dataY,
        barLabel(lang, {
            en: 'Height',
            de: 'H\u00f6he',
            es: 'Altura',
            fr: 'Hauteur',
            nl: 'Hoogte',
        }),
        knownBarPercent(HEIGHT_VAL, agronomic?.height),
        '#60a5fa',
        palette,
        agronomic?.height ?? unknownLabel,
    )
    return { bars, dataY: dataY + 8 }
}

export const buildTerpenesBlock = (
    terpenes: string[],
    dataY: number,
    palette: StylePalette,
    lang: Language,
): { block: string; nextY: number } => {
    if (terpenes.length === 0) {
        return { block: '', nextY: dataY }
    }

    const terpeneLabel = localizeStr(lang, {
        en: 'Terpenes',
        de: 'Terpene',
        es: 'Terpenos',
        fr: 'Terpenes',
        nl: 'Terpenen',
    })

    const block = `<g transform="translate(86, ${dataY})">
        <text x="0" y="0" font-size="16" fill="${palette.textDim}" font-family="'Inter',sans-serif" opacity="0.6">${terpeneLabel}</text>
        ${svgTerpeneDots(0, 28, terpenes, palette.accent, palette.textDim)}
    </g>`

    return { block, nextY: dataY + 64 }
}

export const buildAromasBlock = (
    aromas: string,
    dataY: number,
    palette: StylePalette,
    lang: Language,
): { block: string; nextY: number } => {
    if (aromas.length === 0) {
        return { block: '', nextY: dataY }
    }

    const aromasLabel = localizeStr(lang, {
        en: 'Aromas',
        de: 'Aromen',
        es: 'Aromas',
        fr: 'Aromes',
        nl: "Aroma's",
    })

    const block = `<text x="86" y="${dataY}" font-size="16" fill="${palette.textDim}" font-family="'Inter',sans-serif" opacity="0.55">${aromasLabel}: ${aromas}</text>`
    return { block, nextY: dataY + 30 }
}

export const buildDynamicAccentBand = (
    composition: string,
    svgHeight: number,
    palette: StylePalette,
): string => {
    if (composition.toLowerCase() !== 'dynamic') {
        return ''
    }

    return `<rect x="0" y="0" width="5" height="${svgHeight}" fill="${palette.accent}" opacity="0.15"/>
    <line x1="0" y1="0" x2="1200" y2="${svgHeight}" stroke="${palette.accent}" stroke-width="0.5" opacity="0.06"/>`
}
