import { describe, it, expect } from 'vitest'
import {
    buildFanLeaves,
    svgDataBar,
    svgTerpeneDots,
    buildStyleTexture,
    buildMoodOverlay,
    buildFocusElement,
    getCompositionLayout,
} from './strainImageSvgParts'
import { buildStylePalette } from './strainImagePalette'

const palette = buildStylePalette('botanical')

describe('strainImageSvgParts', () => {
    describe('buildFanLeaves', () => {
        it('renders indica leaf geometry', () => {
            const svg = buildFanLeaves('Indica', palette, 100, 200)
            expect(svg).toContain('rotate(-28)')
            expect(svg).toContain(palette.accent)
        })

        it('renders sativa leaf geometry', () => {
            const svg = buildFanLeaves('Sativa', palette, 50, 50)
            expect(svg).toContain('M0 -230')
        })

        it('renders hybrid leaf geometry by default', () => {
            const svg = buildFanLeaves('Hybrid', palette, 0, 0)
            expect(svg).toContain('M0 -195')
        })
    })

    describe('svgDataBar', () => {
        it('clamps fill percentage between 0 and 100', () => {
            const low = svgDataBar(10, 20, 'THC', -10, '#0f0', '#111', '#fff', '18%')
            const high = svgDataBar(10, 20, 'THC', 200, '#0f0', '#111', '#fff', '18%')
            expect(low).toContain('width="0"')
            expect(high).toContain('width="340"')
        })
    })

    describe('svgTerpeneDots', () => {
        it('truncates long terpene labels and uses fallback color', () => {
            const svg = svgTerpeneDots(0, 10, ['verylongname', 'unknownTerp'], '#abc', '#def')
            expect(svg).toContain('veryl.')
            expect(svg).toContain('fill="#abc"')
        })

        it('limits dots to six terpenes', () => {
            const terpenes = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
            const svg = svgTerpeneDots(0, 10, terpenes, '#abc', '#def')
            expect(svg.match(/<circle/g)?.length).toBe(6)
        })
    })

    describe('buildStyleTexture', () => {
        it('returns empty string when decor scale is low', () => {
            expect(buildStyleTexture('botanical', palette, 0.4)).toBe('')
        })

        it('renders textures for each style', () => {
            const styles = ['fantasy', 'botanical', 'psychedelic', 'macro', 'cyberpunk'] as const
            for (const style of styles) {
                const svg = buildStyleTexture(style, buildStylePalette(style), 1)
                expect(svg.length).toBeGreaterThan(10)
            }
        })
    })

    describe('buildMoodOverlay', () => {
        it('renders mood-specific overlays', () => {
            expect(buildMoodOverlay('mystical', 800)).toContain('#7c3aed')
            expect(buildMoodOverlay('energetic', 800)).toContain('#f97316')
            expect(buildMoodOverlay('calm', 800)).toContain('#38bdf8')
            expect(buildMoodOverlay('unknown', 800)).toBe('')
        })
    })

    describe('getCompositionLayout', () => {
        it('returns layout presets', () => {
            expect(getCompositionLayout('symmetrical').decorScale).toBe(1)
            expect(getCompositionLayout('minimalist').decorScale).toBe(0.35)
            expect(getCompositionLayout('centered').centerX).toBe(650)
        })
    })

    describe('buildFocusElement', () => {
        it('renders bud focus geometry', () => {
            const svg = buildFocusElement('buds', palette, 'Hybrid', 100, 200)
            expect(svg).toContain('translate(100,200)')
        })

        it('renders knospen alias and default plant focus', () => {
            expect(buildFocusElement('knospen', palette, 'Indica', 0, 0)).toContain('<g')
            expect(buildFocusElement('plant', palette, 'Sativa', 50, 50)).toContain('M0 -230')
            expect(buildFocusElement('abstract', palette, 'Hybrid', 10, 10)).toContain('<polygon')
            expect(buildFocusElement('other', palette, 'Hybrid', 10, 10)).toContain('translate')
        })
    })
})
