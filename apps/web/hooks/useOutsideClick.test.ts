import { describe, expect, it, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOutsideClick } from './useOutsideClick'

describe('useOutsideClick', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('returns a ref object', () => {
        const handler = vi.fn()
        const { result } = renderHook(() => useOutsideClick(handler))
        expect(result.current).toBeDefined()
        expect(result.current.current).toBeNull()
    })

    it('registers mousedown and touchstart listeners', () => {
        const addSpy = vi.spyOn(document, 'addEventListener')
        const handler = vi.fn()
        renderHook(() => useOutsideClick(handler))
        const eventNames = addSpy.mock.calls.map((c) => c[0])
        expect(eventNames).toContain('mousedown')
        expect(eventNames).toContain('touchstart')
    })

    it('removes listeners on unmount', () => {
        const removeSpy = vi.spyOn(document, 'removeEventListener')
        const handler = vi.fn()
        const { unmount } = renderHook(() => useOutsideClick(handler))
        unmount()
        const eventNames = removeSpy.mock.calls.map((c) => c[0])
        expect(eventNames).toContain('mousedown')
        expect(eventNames).toContain('touchstart')
    })

    it('calls handler on mousedown outside element', () => {
        const handler = vi.fn()
        const { result } = renderHook(() => useOutsideClick<HTMLDivElement>(handler))

        // Create and attach a real DOM element
        const el = document.createElement('div')
        document.body.appendChild(el)

        // Manually assign ref
        Object.defineProperty(result.current, 'current', { value: el, writable: true })

        // Click outside
        act(() => {
            const event = new MouseEvent('mousedown', { bubbles: true })
            document.body.dispatchEvent(event)
        })

        expect(handler).toHaveBeenCalled()
        document.body.removeChild(el)
    })

    it('does not call handler on click inside element', () => {
        const handler = vi.fn()
        const { result } = renderHook(() => useOutsideClick<HTMLDivElement>(handler))

        const el = document.createElement('div')
        const child = document.createElement('span')
        el.appendChild(child)
        document.body.appendChild(el)

        Object.defineProperty(result.current, 'current', { value: el, writable: true })

        act(() => {
            const event = new MouseEvent('mousedown', { bubbles: true })
            child.dispatchEvent(event)
        })

        expect(handler).not.toHaveBeenCalled()
        document.body.removeChild(el)
    })
})
