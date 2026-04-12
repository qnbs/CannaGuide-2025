// ---------------------------------------------------------------------------
// strainImageFallback.ts -- SVG strain image poster generation
// ---------------------------------------------------------------------------
// Extracted from fallbackService.ts (~720 LOC SVG builder).
// ---------------------------------------------------------------------------

import type { Strain, Language } from '@/types'
import type { ImageStyle } from '@/types/aiProvider'
import DOMPurify from 'dompurify'
import { secureRandom } from '@/utils/random'

const isGerman = (lang: Language): boolean => lang === 'de'

const safe = (text: string): string =>
    DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })

const escapeXml = (value: string): string =>
    safe(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')

const AVAILABLE_STYLES: Exclude<ImageStyle, 'random'>[] = [
    'fantasy',
    'botanical',
    'psychedelic',
    'macro',
    'cyberpunk',
]

const resolveStyle = (style: ImageStyle): Exclude<ImageStyle, 'random'> => {
    if (style === 'random') {
        return AVAILABLE_STYLES[Math.floor(secureRandom() * AVAILABLE_STYLES.length)] ?? 'botanical'
    }
    return style as Exclude<ImageStyle, 'random'>
}

// -- Style Palette -----------------------------------------------------------

interface StylePalette {
    bg1: string
    bg2: string
    bg3: string
    accent: string
    accent2: string
    glow: string
    text: string
    textDim: string
    barBg: string
}

const buildStylePalette = (style: Exclude<ImageStyle, 'random'>): StylePalette => {
    switch (style) {
        case 'fantasy':
            return {
                bg1: '#0d0a1a',
                bg2: '#1b1340',
                bg3: '#3b1f7a',
                accent: '#c084fc',
                accent2: '#f9a8d4',
                glow: '#7c3aed',
                text: '#f1e8ff',
                textDim: '#a78bfa',
                barBg: '#1e1545',
            }
        case 'botanical':
            return {
                bg1: '#030f09',
                bg2: '#0a2618',
                bg3: '#134e33',
                accent: '#34d399',
                accent2: '#86efac',
                glow: '#10b981',
                text: '#ecfdf5',
                textDim: '#6ee7b7',
                barBg: '#0c2a1a',
            }
        case 'psychedelic':
            return {
                bg1: '#1a0525',
                bg2: '#3b0764',
                bg3: '#7c2d92',
                accent: '#e879f9',
                accent2: '#fde047',
                glow: '#d946ef',
                text: '#fdf4ff',
                textDim: '#d946ef',
                barBg: '#2e1065',
            }
        case 'macro':
            return {
                bg1: '#0a0f18',
                bg2: '#162032',
                bg3: '#1e3a5f',
                accent: '#60a5fa',
                accent2: '#93c5fd',
                glow: '#3b82f6',
                text: '#eff6ff',
                textDim: '#93c5fd',
                barBg: '#172554',
            }
        case 'cyberpunk':
            return {
                bg1: '#04080f',
                bg2: '#0c1929',
                bg3: '#132f4c',
                accent: '#22d3ee',
                accent2: '#fb7185',
                glow: '#06b6d4',
                text: '#f0fdfa',
                textDim: '#67e8f9',
                barBg: '#0e2337',
            }
    }
}

// -- Value Lookups -----------------------------------------------------------

const DIFFICULTY_VAL: Record<string, number> = { Easy: 30, Medium: 60, Hard: 95 }
const YIELD_VAL: Record<string, number> = { Low: 25, Medium: 55, High: 90 }
const HEIGHT_VAL: Record<string, number> = { Short: 25, Medium: 55, Tall: 90 }

// -- Terpene Color Mapping ---------------------------------------------------

const TERPENE_COLORS: Record<string, string> = {
    myrcene: '#86efac',
    limonene: '#fde047',
    caryophyllene: '#f97316',
    pinene: '#34d399',
    linalool: '#c084fc',
    terpinolene: '#22d3ee',
    ocimene: '#fb923c',
    humulene: '#a78bfa',
    bisabolol: '#f9a8d4',
    nerolidol: '#fbbf24',
    guaiol: '#2dd4bf',
    valencene: '#fdba74',
    camphene: '#4ade80',
    geraniol: '#f472b6',
    eucalyptol: '#67e8f9',
    borneol: '#a3e635',
    sabinene: '#c4b5fd',
    farnesene: '#fca5a5',
    phytol: '#6ee7b7',
    terpineol: '#7dd3fc',
}

// -- Leaf Shape Builders -----------------------------------------------------

const buildLeafPath = (strainType: string): string => {
    const t = strainType.toLowerCase()
    if (t.includes('indica')) {
        return 'M0 -160 C60 -110 118 -45 110 25 C104 72 55 130 0 200 C-55 130 -104 72 -110 25 C-118 -45 -60 -110 0 -160Z'
    }
    if (t.includes('sativa')) {
        return 'M0 -230 C28 -175 55 -90 52 -8 C50 46 34 130 0 225 C-34 130 -50 46 -52 -8 C-55 -90 -28 -175 0 -230Z'
    }
    return 'M0 -195 C44 -145 90 -75 96 -8 C100 40 65 110 0 195 C-65 110 -100 40 -96 -8 C-90 -75 -44 -145 0 -195Z'
}

const buildFanLeaves = (
    strainType: string,
    palette: StylePalette,
    cx: number,
    cy: number,
): string => {
    const leaf = buildLeafPath(strainType)
    const angles = [-28, -14, 0, 14, 28]
    const scales = [0.52, 0.74, 1.0, 0.74, 0.52]
    const opacities = [0.4, 0.6, 0.9, 0.6, 0.4]
    return angles
        .map(
            (a, i) =>
                `<g transform="translate(${cx},${cy}) rotate(${a}) scale(${scales[i]})" opacity="${opacities[i]}">
            <path d="${leaf}" fill="${palette.accent}" opacity="0.1"/>
            <path d="${leaf}" fill="none" stroke="${palette.accent}" stroke-width="2" stroke-linecap="round"/>
        </g>`,
        )
        .join('\n        ')
}

// -- Data Visualization ------------------------------------------------------

const svgDataBar = (
    x: number,
    y: number,
    label: string,
    fillPct: number,
    barColor: string,
    barBg: string,
    textColor: string,
    display: string,
): string => {
    const w = Math.min(1, Math.max(0, fillPct / 100)) * 340
    return `<text x="${x}" y="${y}" font-size="17" fill="${textColor}" font-family="'Inter',sans-serif" opacity="0.65">${escapeXml(label)}</text>
    <rect x="${x + 128}" y="${y - 12}" width="340" height="13" rx="6.5" fill="${barBg}"/>
    <rect x="${x + 128}" y="${y - 12}" width="${w}" height="13" rx="6.5" fill="${barColor}" opacity="0.9"/>
    <text x="${x + 478}" y="${y}" font-size="15" fill="${textColor}" font-family="'Inter',sans-serif" opacity="0.8">${escapeXml(display)}</text>`
}

const svgTerpeneDots = (
    x: number,
    y: number,
    terpenes: string[],
    accent: string,
    textColor: string,
): string => {
    const shown = terpenes.slice(0, 6)
    return shown
        .map((t, i) => {
            const color = TERPENE_COLORS[t.toLowerCase()] ?? accent
            const cx = x + i * 50
            const terpeneLabel = t.length > 6 ? `${t.slice(0, 5)}.` : t
            return `<circle cx="${cx + 8}" cy="${y}" r="10" fill="${color}" opacity="0.9"/>
        <text x="${cx + 8}" y="${y + 23}" font-size="10" fill="${textColor}" font-family="'Inter',sans-serif" text-anchor="middle" opacity="0.55">${escapeXml(terpeneLabel)}</text>`
        })
        .join('\n    ')
}

// -- Style-Specific Texture Overlays -----------------------------------------

const buildStyleTexture = (
    style: Exclude<ImageStyle, 'random'>,
    palette: StylePalette,
    decorScale: number,
): string => {
    if (decorScale < 0.5) return ''
    switch (style) {
        case 'fantasy': {
            const stars: [number, number][] = [
                [180, 340],
                [920, 180],
                [750, 660],
                [300, 850],
                [1050, 520],
                [140, 1200],
                [860, 960],
            ]
            return stars
                .map(([x, y], i) => {
                    const s = 3 + (i % 4) * 1.5
                    const o = (0.2 + (i % 3) * 0.1).toFixed(2)
                    return `<g transform="translate(${x},${y})" opacity="${o}">
                <line x1="-${s}" y1="0" x2="${s}" y2="0" stroke="${palette.accent2}" stroke-width="1.2"/>
                <line x1="0" y1="-${s}" x2="0" y2="${s}" stroke="${palette.accent2}" stroke-width="1.2"/>
            </g>`
                })
                .join('\n        ')
        }
        case 'botanical':
            return `<g opacity="0.05" stroke="${palette.accent}" stroke-width="1" fill="none">
            <path d="M0 400 Q300 350 600 500 T1200 380"/>
            <path d="M0 850 Q400 800 700 900 T1200 830"/>
            <circle cx="600" cy="550" r="280" stroke-dasharray="6 10"/>
        </g>`
        case 'psychedelic':
            return `<g opacity="0.07" fill="none" stroke-width="1.2">
            ${[100, 170, 240, 310, 380]
                .map((r, i) => {
                    const strokeColor = i % 2 === 0 ? palette.accent : palette.accent2
                    return `<circle cx="600" cy="500" r="${r}" stroke="${strokeColor}" stroke-dasharray="${3 + i * 2} ${5 + i * 2}"/>`
                })
                .join('\n            ')}
        </g>`
        case 'macro': {
            const bokeh: [number, number, number, number][] = [
                [140, 200, 40, 0.07],
                [900, 150, 55, 0.08],
                [1050, 400, 35, 0.06],
                [250, 700, 60, 0.07],
                [950, 750, 42, 0.06],
                [100, 1050, 48, 0.09],
                [800, 1100, 30, 0.06],
                [500, 250, 25, 0.07],
            ]
            return bokeh
                .map(
                    ([x, y, r, o]) =>
                        `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${palette.accent}" stroke-width="1.2" opacity="${o}"/>`,
                )
                .join('\n        ')
        }
        case 'cyberpunk':
            return `<g opacity="0.04" stroke="${palette.accent}" stroke-width="0.6">
            ${[200, 400, 600, 800, 1000].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="1400"/>`).join('\n            ')}
            ${[280, 560, 840, 1120].map((y) => `<line x1="0" y1="${y}" x2="1200" y2="${y}"/>`).join('\n            ')}
        </g>
        <g opacity="0.1">
            ${[
                [100, 100],
                [500, 300],
                [900, 200],
                [300, 800],
                [1000, 600],
                [200, 1100],
                [800, 1000],
            ]
                .map(
                    ([x, y]) =>
                        `<rect x="${x}" y="${y}" width="3" height="3" fill="${palette.accent2}"/>`,
                )
                .join('\n            ')}
        </g>`
    }
}

// -- Mood Overlay ------------------------------------------------------------

const buildMoodOverlay = (mood: string, h: number): string => {
    switch (mood.toLowerCase()) {
        case 'mystical':
            return `<rect width="1200" height="${h}" fill="#7c3aed" opacity="0.04"/>`
        case 'energetic':
            return `<rect width="600" height="${h}" x="300" fill="#f97316" opacity="0.025"/>`
        case 'calm':
            return `<rect width="1200" height="${h}" fill="#38bdf8" opacity="0.025"/>`
        default:
            return ''
    }
}

// -- Focus-Responsive Central Element ----------------------------------------

const buildFocusElement = (
    focus: string,
    palette: StylePalette,
    strainType: string,
    cx: number,
    cy: number,
): string => {
    switch (focus.toLowerCase()) {
        case 'buds':
        case 'knospen': {
            const outer = [0, 60, 120, 180, 240, 300]
            const inner = [30, 90, 150, 210, 270, 330]
            return `<g transform="translate(${cx},${cy})" filter="url(#softglow)">
            <circle r="75" fill="${palette.accent}" opacity="0.07"/>
            <circle r="50" fill="${palette.accent}" opacity="0.12"/>
            <circle r="25" fill="${palette.glow}" opacity="0.25"/>
            ${outer
                .map((a) => {
                    const rad = (a * Math.PI) / 180
                    const x = Math.cos(rad) * 48
                    const y = Math.sin(rad) * 48
                    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14" fill="${palette.accent}" opacity="0.13"/>
            <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${palette.accent2}" opacity="0.55"/>`
                })
                .join('\n            ')}
            ${inner
                .map((a) => {
                    const rad = (a * Math.PI) / 180
                    const x = Math.cos(rad) * 82
                    const y = Math.sin(rad) * 82
                    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" fill="${palette.accent2}" opacity="0.08"/>
            <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${palette.accent2}" opacity="0.4"/>`
                })
                .join('\n            ')}
        </g>`
        }
        case 'abstract':
        case 'abstrakt': {
            const hex = [0, 1, 2, 3, 4, 5]
                .map((i) => {
                    const a = ((i * 60 - 90) * Math.PI) / 180
                    return `${(Math.cos(a) * 95).toFixed(1)},${(Math.sin(a) * 95).toFixed(1)}`
                })
                .join(' ')
            const innerHex = [0, 1, 2, 3, 4, 5]
                .map((i) => {
                    const a = ((i * 60 - 60) * Math.PI) / 180
                    return `${(Math.cos(a) * 55).toFixed(1)},${(Math.sin(a) * 55).toFixed(1)}`
                })
                .join(' ')
            return `<g transform="translate(${cx},${cy})" filter="url(#softglow)">
            ${[75, 125, 170]
                .map(
                    (r) =>
                        `<circle r="${r}" fill="none" stroke="${palette.accent}" stroke-width="0.8" opacity="0.12" stroke-dasharray="${r / 4} ${r / 6}"/>`,
                )
                .join('\n            ')}
            ${[0, 45, 90, 135]
                .map((a) => {
                    const rad = (a * Math.PI) / 180
                    const x = Math.cos(rad) * 170
                    const y = Math.sin(rad) * 170
                    return `<line x1="${(-x).toFixed(1)}" y1="${(-y).toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${palette.accent}" stroke-width="0.6" opacity="0.08"/>`
                })
                .join('\n            ')}
            <polygon points="${hex}" fill="none" stroke="${palette.accent}" stroke-width="1" opacity="0.1"/>
            <polygon points="${innerHex}" fill="none" stroke="${palette.accent2}" stroke-width="0.8" opacity="0.08"/>
        </g>`
        }
        case 'plant':
        case 'pflanze':
        default:
            return `<g filter="url(#softglow)">
            ${buildFanLeaves(strainType, palette, cx, cy)}
            <circle cx="${cx}" cy="${cy}" r="18" fill="${palette.accent}" opacity="0.6"/>
            <circle cx="${cx}" cy="${cy}" r="60" fill="${palette.accent}" opacity="0.06"/>
        </g>`
    }
}

// -- Composition Layout ------------------------------------------------------

const getCompositionLayout = (
    composition: string,
): { centerX: number; centerY: number; decorScale: number } => {
    switch (composition.toLowerCase()) {
        case 'symmetrical':
            return { centerX: 600, centerY: 490, decorScale: 1.0 }
        case 'minimalist':
            return { centerX: 600, centerY: 510, decorScale: 0.35 }
        default:
            return { centerX: 650, centerY: 470, decorScale: 1.15 }
    }
}

interface StrainDataBarsResult {
    bars: string[]
    dataY: number
}

const buildStrainDataBars = (
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
    const diffLabel = isGerman(lang) ? 'Schwierigkeit' : 'Difficulty'
    const yieldLabel = isGerman(lang) ? 'Ertrag' : 'Yield'
    const heightLabel = isGerman(lang) ? 'H\u00f6he' : 'Height'

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

const buildTerpenesBlock = (
    terpenes: string[],
    dataY: number,
    palette: StylePalette,
    lang: Language,
): { block: string; nextY: number } => {
    if (terpenes.length === 0) {
        return { block: '', nextY: dataY }
    }

    const terpeneLabel = isGerman(lang) ? 'Terpene' : 'Terpenes'

    const block = `<g transform="translate(86, ${dataY})">
        <text x="0" y="0" font-size="16" fill="${palette.textDim}" font-family="'Inter',sans-serif" opacity="0.6">${terpeneLabel}</text>
        ${svgTerpeneDots(0, 28, terpenes, palette.accent, palette.textDim)}
    </g>`

    return { block, nextY: dataY + 64 }
}

const buildAromasBlock = (
    aromas: string,
    dataY: number,
    palette: StylePalette,
    lang: Language,
): { block: string; nextY: number } => {
    if (aromas.length === 0) {
        return { block: '', nextY: dataY }
    }

    const aromasLabel = isGerman(lang) ? 'Aromen' : 'Aromas'

    const block = `<text x="86" y="${dataY}" font-size="16" fill="${palette.textDim}" font-family="'Inter',sans-serif" opacity="0.55">${aromasLabel}: ${aromas}</text>`
    return { block, nextY: dataY + 30 }
}

const buildDynamicAccentBand = (
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

// -- Main SVG Builder --------------------------------------------------------

const buildStrainImageSvg = (
    strain: Strain,
    style: Exclude<ImageStyle, 'random'>,
    criteria: { focus: string; composition: string; mood: string },
    lang: Language,
): string => {
    const p = buildStylePalette(style)
    const { centerX: cx, centerY: cy, decorScale } = getCompositionLayout(criteria.composition)
    const cleanName = escapeXml(strain.name.slice(0, 42))
    let nameFontSize = 68
    if (cleanName.length > 28) {
        nameFontSize = 48
    } else if (cleanName.length > 20) {
        nameFontSize = 56
    }
    const typeLabel = escapeXml(strain.type)
    const flowerTypeLabel = escapeXml(strain.floweringType)
    const title = isGerman(lang) ? 'LOKALE STRAIN-VORSCHAU' : 'LOCAL STRAIN PREVIEW'
    const subtitle = isGerman(lang)
        ? 'SVG-Poster \u00b7 Lokaler Fallback'
        : 'SVG poster \u00b7 Local fallback'

    // -- Terpenes, aromas, metadata
    const terpenes = strain.dominantTerpenes ?? []
    const aromas = (strain.aromas ?? [])
        .slice(0, 5)
        .map((a) => escapeXml(a))
        .join(' \u00b7 ')
    const floweringText = isGerman(lang)
        ? `${strain.floweringTime} Tage Bl\u00fcte`
        : `${strain.floweringTime}d flowering`
    const genetics = strain.genetics ? escapeXml(strain.genetics.slice(0, 55)) : ''
    const description = strain.description ? escapeXml(strain.description.slice(0, 100)) : ''

    const { bars, dataY: afterBarsY } = buildStrainDataBars(strain, p, lang)
    const { block: terpenesBlock, nextY: afterTerpenesY } = buildTerpenesBlock(
        terpenes,
        afterBarsY,
        p,
        lang,
    )
    const { block: aromasBlock, nextY: dataY } = buildAromasBlock(aromas, afterTerpenesY, p, lang)

    const footerY = Math.max(dataY + 40, 1180)
    const svgHeight = Math.max(1400, footerY + 120)
    const accentBand = buildDynamicAccentBand(criteria.composition, svgHeight, p)
    const hasDescription = description.length > 0
    const hasLongDescription =
        typeof strain.description === 'string' && strain.description.length > 100
    const descriptionSuffix = hasLongDescription ? '\u2026' : ''
    const descriptionLine = hasDescription
        ? `<text x="86" y="${footerY + 32}" font-size="16" opacity="0.45">${description}${descriptionSuffix}</text>`
        : ''
    const metadataMainY = footerY + (hasDescription ? 60 : 34)
    const metadataSubY = footerY + (hasDescription ? 88 : 62)
    const signatureDotsY = footerY + (hasDescription ? 75 : 50)
    const geneticsSuffix = genetics.length > 0 ? ` -- ${genetics}` : ''

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 ${svgHeight}" role="img" aria-label="${cleanName} \u2014 ${typeLabel} ${flowerTypeLabel} cannabis strain poster, ${escapeXml(style)} style, ${escapeXml(criteria.focus)} focus, ${escapeXml(criteria.mood)} mood">
    <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stop-color="${p.bg1}"/>
            <stop offset="45%" stop-color="${p.bg2}"/>
            <stop offset="100%" stop-color="${p.bg3}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="32%" r="55%">
            <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="${p.glow}" stop-opacity="0"/>
        </radialGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="22"/></filter>
        <filter id="softglow">
            <feGaussianBlur stdDeviation="5" result="g"/>
            <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
            <feBlend in="SourceGraphic" mode="multiply"/>
        </filter>
    </defs>

    <!-- Background -->
    <rect width="1200" height="${svgHeight}" fill="url(#bg)"/>
    <rect width="1200" height="${svgHeight}" fill="url(#glow)"/>

    <!-- Noise texture -->
    <rect width="1200" height="${svgHeight}" filter="url(#noise)" opacity="0.03"/>

    <!-- Mood tint -->
    ${buildMoodOverlay(criteria.mood, svgHeight)}

    <!-- Ambient orbs -->
    <g filter="url(#blur)" opacity="${(0.25 * decorScale).toFixed(2)}">
        <circle cx="220" cy="240" r="130" fill="${p.accent}"/>
        <circle cx="940" cy="330" r="160" fill="${p.bg3}"/>
        <circle cx="160" cy="980" r="180" fill="${p.bg2}"/>
        <circle cx="970" cy="1100" r="140" fill="${p.accent2}"/>
    </g>

    <!-- Style-specific texture -->
    ${buildStyleTexture(style, p, decorScale)}

    <!-- Composition accent -->
    ${accentBand}

    <!-- Header -->
    <g fill="${p.text}" font-family="'Inter',sans-serif">
        <text x="86" y="100" font-size="36" font-weight="700" letter-spacing="3.5" opacity="0.9">${escapeXml(title)}</text>
        <text x="86" y="140" font-size="19" opacity="0.5">${escapeXml(subtitle)}</text>
    </g>

    <!-- Badges -->
    <g font-family="'Inter',sans-serif">
        <rect x="86" y="162" width="${typeLabel.length * 12 + 28}" height="28" rx="14" fill="${p.accent}" opacity="0.18"/>
        <text x="100" y="181" font-size="15" font-weight="600" fill="${p.accent}">${typeLabel}</text>

        <rect x="${86 + typeLabel.length * 12 + 40}" y="162" width="${style.length * 10 + 28}" height="28" rx="14" fill="${p.bg3}" opacity="0.35"/>
        <text x="${100 + typeLabel.length * 12 + 40}" y="181" font-size="14" font-weight="600" fill="${p.textDim}">${escapeXml(style)}</text>

        <rect x="${86 + typeLabel.length * 12 + style.length * 10 + 80}" y="162" width="${flowerTypeLabel.length * 9 + 28}" height="28" rx="14" fill="${p.accent2}" opacity="0.15"/>
        <text x="${100 + typeLabel.length * 12 + style.length * 10 + 80}" y="181" font-size="13" font-weight="600" fill="${p.accent2}">${flowerTypeLabel}</text>
    </g>

    <!-- Central focus element -->
    ${buildFocusElement(criteria.focus, p, strain.type, cx, cy)}

    <!-- Center ring -->
    <circle cx="${cx}" cy="${cy}" r="120" fill="none" stroke="${p.accent}" stroke-width="0.6" opacity="0.08" stroke-dasharray="4 8"/>

    <!-- Data bars -->
    <g>${bars.join('\n        ')}</g>

    <!-- Terpenes -->
    ${terpenesBlock}

    <!-- Aromas -->
    ${aromasBlock}

    <!-- Strain name -->
    <g fill="${p.text}" font-family="'Inter',sans-serif">
        <text x="86" y="${footerY}" font-size="${nameFontSize}" font-weight="700">${cleanName}</text>
        ${descriptionLine}
    </g>

    <!-- Metadata -->
    <g fill="${p.textDim}" font-family="'Inter',sans-serif" opacity="0.55">
        <text x="86" y="${metadataMainY}" font-size="20">${floweringText}${geneticsSuffix}</text>
        <text x="86" y="${metadataSubY}" font-size="16" opacity="0.7">${escapeXml(criteria.focus)} -- ${escapeXml(criteria.composition)} -- ${escapeXml(criteria.mood)}</text>
    </g>

    <!-- Signature dots -->
    <g fill="${p.accent}" opacity="0.6">
        <circle cx="1060" cy="${signatureDotsY}" r="4"/>
        <circle cx="1080" cy="${signatureDotsY}" r="4"/>
        <circle cx="1100" cy="${signatureDotsY}" r="4"/>
        <circle cx="1120" cy="${signatureDotsY}" r="3" fill="${p.accent2}"/>
    </g>
</svg>`
}

// -- Public API --------------------------------------------------------------

export const buildStrainImage = (
    strain: Strain,
    style: ImageStyle,
    criteria: { focus: string; composition: string; mood: string },
    lang: Language,
): string => {
    const resolved = resolveStyle(style)
    const svg = buildStrainImageSvg(strain, resolved, criteria, lang)
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
