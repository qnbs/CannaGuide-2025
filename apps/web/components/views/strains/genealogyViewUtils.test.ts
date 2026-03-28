import { describe, expect, it } from 'vitest'
import {
    getNextLayoutOrientation,
    getNodeGroupClass,
    toSelectedStrainId,
    type HighlightMode,
} from './genealogyViewUtils'

describe('genealogyViewUtils', () => {
    it('returns empty class when highlight mode is none', () => {
        expect(getNodeGroupClass('none', true)).toBe('')
        expect(getNodeGroupClass('none', false)).toBe('')
    })

    it('returns highlighted class only for matching nodes in active highlight modes', () => {
        const modes: HighlightMode[] = ['landraces', 'sativa', 'indica']
        for (const mode of modes) {
            expect(getNodeGroupClass(mode, true)).toBe('genealogy-node-highlighted')
            expect(getNodeGroupClass(mode, false)).toBe('genealogy-node-dimmed')
        }
    })

    it('toggles layout orientation deterministically', () => {
        expect(getNextLayoutOrientation('horizontal')).toBe('vertical')
        expect(getNextLayoutOrientation('vertical')).toBe('horizontal')
    })

    it('normalizes selected strain id values', () => {
        expect(toSelectedStrainId('abc')).toBe('abc')
        expect(toSelectedStrainId(42)).toBe('42')
        expect(toSelectedStrainId('')).toBeNull()
        expect(toSelectedStrainId(null)).toBeNull()
        expect(toSelectedStrainId(undefined)).toBeNull()
    })
})
