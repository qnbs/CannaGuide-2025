import type { Language, Strain } from '@/types'
import { localizeStr } from './localeHelpers'
import {
    DIFFICULTY_VAL,
    HEIGHT_VAL,
    YIELD_VAL,
    type StylePalette,
} from './strainImagePalette'
import { svgDataBar, svgTerpeneDots } from './strainImageSvgParts'

interface StrainDataBarsResult {
    bars: string[]
    dataY: number
}

export const buildStrainDataBars = (
    strain: Strain,
    palette: StylePalette,
    lang: Language,
): StrainDataBarsResult => {
    const thcPct = (strain.thc / 35) * 100
    const cbdPct = (strain.cbd / 25) * 100
    const thcDisplay = strain.thcRange ?? `${strain.thc}%`
    const cbdDisplay = strain.cbdRange ?? `${strain.cbd}%`
    const diffVal = DIFFICULTY_VAL[strain.agronomic.difficulty] ?? 50
    const yieldVal = YIELD_VAL[strain.agronomic.yield] ?? 50
    const heightVal = HEIGHT_VAL[strain.agronomic.height] ?? 50
    const diffLabel = localizeStr(lang, {
        en: 'Difficulty',
        de: 'Schwierigkeit',
        es: 'Dificultad',
        fr: 'Difficulte',
        nl: 'Moeilijkheid',
    })
    const yieldLabel = localizeStr(lang, {
        en: 'Yield',
        de: 'Ertrag',
        es: 'Rendimiento',
        fr: 'Rendement',
        nl: 'Opbrengst',
    })
    const heightLabel = localizeStr(lang, {
        en: 'Height',
        de: 'H\u00f6he',
        es: 'Altura',
        fr: 'Hauteur',
        nl: 'Hoogte',
    })

    let dataY = 820
    const bars: string[] = []
    bars.push(
        svgDataBar(
            86,
            dataY,
            'THC',
            thcPct,
            palette.accent,
            palette.barBg,
            palette.textDim,
            thcDisplay,
        ),
    )
    dataY += 36
    bars.push(
        svgDataBar(
            86,
            dataY,
            'CBD',
            cbdPct,
            palette.accent2,
            palette.barBg,
            palette.textDim,
            cbdDisplay,
        ),
    )
    dataY += 36

    if (strain.cbg != null) {
        bars.push(
            svgDataBar(
                86,
                dataY,
                'CBG',
                (strain.cbg / 5) * 100,
                '#fbbf24',
                palette.barBg,
                palette.textDim,
                `${strain.cbg}%`,
            ),
        )
        dataY += 36
    }

    if (strain.thcv != null) {
        bars.push(
            svgDataBar(
                86,
                dataY,
                'THCV',
                (strain.thcv / 5) * 100,
                '#2dd4bf',
                palette.barBg,
                palette.textDim,
                `${strain.thcv}%`,
            ),
        )
        dataY += 36
    }

    bars.push(
        svgDataBar(
            86,
            dataY,
            diffLabel,
            diffVal,
            '#f97316',
            palette.barBg,
            palette.textDim,
            strain.agronomic.difficulty,
        ),
    )
    dataY += 36

    bars.push(
        svgDataBar(
            86,
            dataY,
            yieldLabel,
            yieldVal,
            '#22c55e',
            palette.barBg,
            palette.textDim,
            strain.agronomic.yield,
        ),
    )
    dataY += 36

    bars.push(
        svgDataBar(
            86,
            dataY,
            heightLabel,
            heightVal,
            '#60a5fa',
            palette.barBg,
            palette.textDim,
            strain.agronomic.height,
        ),
    )

    return { bars, dataY: dataY + 44 }
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
