import React from 'react'
import { render, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useVirtualizer } from './useVirtualizer'

describe('useVirtualizer', () => {
    class MockResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    }

    beforeEach(() => {
        vi.stubGlobal('ResizeObserver', MockResizeObserver)
    })

    afterEach(() => {
        document.body.innerHTML = ''
        vi.unstubAllGlobals()
    })

    it('does not enter a rerender loop when the row ref is rebound', () => {
        const mainElement = document.createElement('main')
        Object.defineProperty(mainElement, 'clientHeight', {
            configurable: true,
            value: 720,
        })
        Object.defineProperty(mainElement, 'scrollTop', {
            configurable: true,
            value: 0,
            writable: true,
        })
        document.body.appendChild(mainElement)

        const renderCount: number[] = []

        const TestComponent: React.FC = () => {
            const virtualizer = useVirtualizer({
                count: 1,
                getScrollElement: () => document.querySelector('main'),
                estimateSize: 68,
                overscan: 1,
            })

            renderCount.push(virtualizer.virtualItems.length)

            return <div ref={virtualizer.measureElement(0)} />
        }

        const { rerender } = render(<TestComponent />)

        act(() => {
            rerender(<TestComponent />)
            rerender(<TestComponent />)
        })

        expect(renderCount.length).toBeLessThan(8)
        expect(renderCount[renderCount.length - 1]).toBe(1)
    })
})
