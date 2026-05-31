import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { View } from '@/types'
import { scheduleRoutePreloads } from './routePreload'

describe('scheduleRoutePreloads', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'requestIdleCallback',
            (cb: IdleRequestCallback) => {
                cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline)
                return 1
            },
        )
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('schedules preload without throwing for main views', () => {
        expect(() => scheduleRoutePreloads([View.Plants, View.Strains])).not.toThrow()
    })

    it('schedules Help view preload without throwing', () => {
        expect(() => scheduleRoutePreloads([View.Help])).not.toThrow()
    })
})
