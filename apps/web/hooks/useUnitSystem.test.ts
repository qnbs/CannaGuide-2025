import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const mockUseAppSelector = vi.fn()

vi.mock('@/stores/store', () => ({
    useAppSelector: (...args: unknown[]) => mockUseAppSelector(...args),
}))
vi.mock('@/stores/selectors', () => ({
    selectLanguage: vi.fn(),
}))

import { useUnitSystem } from '@/hooks/useUnitSystem'

describe('useUnitSystem', () => {
    beforeEach(() => {
        mockUseAppSelector.mockReset()
    })

    it('returns imperial for English', () => {
        mockUseAppSelector.mockReturnValue('en')
        const { result } = renderHook(() => useUnitSystem())
        expect(result.current).toBe('imperial')
    })

    it('returns metric for German', () => {
        mockUseAppSelector.mockReturnValue('de')
        const { result } = renderHook(() => useUnitSystem())
        expect(result.current).toBe('metric')
    })

    it('returns metric for Spanish', () => {
        mockUseAppSelector.mockReturnValue('es')
        const { result } = renderHook(() => useUnitSystem())
        expect(result.current).toBe('metric')
    })

    it('returns metric for French', () => {
        mockUseAppSelector.mockReturnValue('fr')
        const { result } = renderHook(() => useUnitSystem())
        expect(result.current).toBe('metric')
    })

    it('returns metric for Dutch', () => {
        mockUseAppSelector.mockReturnValue('nl')
        const { result } = renderHook(() => useUnitSystem())
        expect(result.current).toBe('metric')
    })
})
