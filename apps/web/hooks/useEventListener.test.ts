import { describe, expect, it, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEventListener } from './useEventListener'

describe('useEventListener', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('adds event listener to window by default', () => {
        const addSpy = vi.spyOn(window, 'addEventListener')
        const handler = vi.fn()
        renderHook(() => useEventListener('resize', handler))
        expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('removes event listener on unmount', () => {
        const removeSpy = vi.spyOn(window, 'removeEventListener')
        const handler = vi.fn()
        const { unmount } = renderHook(() => useEventListener('resize', handler))
        unmount()
        expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('calls handler when event fires', () => {
        const handler = vi.fn()
        renderHook(() => useEventListener('click', handler))
        window.dispatchEvent(new Event('click'))
        expect(handler).toHaveBeenCalledOnce()
    })

    it('adds listener to custom target', () => {
        const target = document.createElement('div')
        const addSpy = vi.spyOn(target, 'addEventListener')
        const handler = vi.fn()
        renderHook(() => useEventListener('click', handler, target))
        expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function))
    })

    it('handles null target gracefully', () => {
        const handler = vi.fn()
        expect(() => renderHook(() => useEventListener('click', handler, null))).not.toThrow()
    })
})
