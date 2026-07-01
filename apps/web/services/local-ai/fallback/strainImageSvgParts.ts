import type { ImageStyle } from '@/types/aiProvider'
import { TERPENE_COLORS, type StylePalette } from './strainImagePalette'
import { escapeXml } from './strainImageSvgUtils'

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

export const buildFanLeaves = (
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

export const svgDataBar = (
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

export const svgTerpeneDots = (
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

export const buildStyleTexture = (
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

export const buildMoodOverlay = (mood: string, h: number): string => {
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

export const buildFocusElement = (
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

export const getCompositionLayout = (
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
