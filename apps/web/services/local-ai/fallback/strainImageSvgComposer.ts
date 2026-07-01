import type { Language, Strain } from '@/types'
import type { ImageStyle } from '@/types/aiProvider'
import { localizeStr } from './localeHelpers'
import { buildStylePalette } from './strainImagePalette'
import {
    buildAromasBlock,
    buildDynamicAccentBand,
    buildStrainDataBars,
    buildTerpenesBlock,
} from './strainImageSvgDataBlocks'
import {
    buildFocusElement,
    buildMoodOverlay,
    buildStyleTexture,
    getCompositionLayout,
} from './strainImageSvgParts'
import { escapeXml } from './strainImageSvgUtils'

export const buildStrainImageSvg = (
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
    const title = localizeStr(lang, {
        en: 'LOCAL STRAIN PREVIEW',
        de: 'LOKALE STRAIN-VORSCHAU',
        es: 'VISTA PREVIA LOCAL',
        fr: 'APERCU LOCAL DE VARIETE',
        nl: 'LOKAAL STRAIN VOORBEELD',
    })
    const subtitle = localizeStr(lang, {
        en: 'SVG poster \u00b7 Local fallback',
        de: 'SVG-Poster \u00b7 Lokaler Fallback',
        es: 'Poster SVG \u00b7 Alternativa local',
        fr: 'Poster SVG \u00b7 Secours local',
        nl: 'SVG-poster \u00b7 Lokale terugval',
    })

    const terpenes = strain.dominantTerpenes ?? []
    const aromas = (strain.aromas ?? [])
        .slice(0, 5)
        .map((a) => escapeXml(a))
        .join(' \u00b7 ')
    const floweringText = localizeStr(lang, {
        en: `${strain.floweringTime}d flowering`,
        de: `${strain.floweringTime} Tage Bl\u00fcte`,
        es: `${strain.floweringTime}d floracion`,
        fr: `${strain.floweringTime}j floraison`,
        nl: `${strain.floweringTime}d bloei`,
    })
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
