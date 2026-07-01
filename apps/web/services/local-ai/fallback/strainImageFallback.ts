// ---------------------------------------------------------------------------
// strainImageFallback.ts -- SVG strain image poster generation (facade)
// ---------------------------------------------------------------------------

import type { Language, Strain } from '@/types'
import type { ImageStyle } from '@/types/aiProvider'
import { buildStrainImageSvg } from './strainImageSvgComposer'
import { resolveStyle } from './strainImageSvgUtils'

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
