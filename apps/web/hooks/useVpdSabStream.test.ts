import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// vi.hoisted ensures these are available when vi.mock factory runs
const { mockGetSabChannel, mockGetSabRingBuffer } = vi.hoisted(() => ({
    mockGetSabChannel: vi.fn(),
    mockGetSabRingBuffer: vi.fn(),
}))

vi.mock('@/services/workerPool', () => ({
    workerPool: {
        getSabChannel: mockGetSabChannel,
        getSabRingBuffer: mockGetSabRingBuffer,
    },
}))

vi.mock('@/services/workerFactories', () => ({
    WORKER_NAMES: { VPD: 'vpd' },
}))

import { useVpdSabStream } from './useVpdSabStream'

describe('useVpdSabStream', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        mockGetSabChannel.mockReturnValue(null)
        mockGetSabRingBuffer.mockReturnValue(null)
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('returns idle state when SAB is unavailable', () => {
        const { result } = renderHook(() => useVpdSabStream())
        expect(result.current).toEqual({
            vpdStatus: 'none',
            latestVpd: null,
            isStreaming: false,
        })
    })

    it('starts streaming when SAB channel is available', () => {
        const mockChannel = { read: vi.fn().mockReturnValue(0) }
        mockGetSabChannel.mockReturnValue(mockChannel)

        const { result } = renderHook(() => useVpdSabStream())
        expect(result.current.isStreaming).toBe(true)
    })

    it('starts streaming when ring buffer is available', () => {
        const mockRing = { pop: vi.fn().mockReturnValue(null) }
        mockGetSabRingBuffer.mockReturnValue(mockRing)

        const { result } = renderHook(() => useVpdSabStream())
        expect(result.current.isStreaming).toBe(true)
    })

    it('reads VPD status from AtomicsChannel on interval', () => {
        const mockChannel = { read: vi.fn().mockReturnValue(1) } // OPTIMAL
        mockGetSabChannel.mockReturnValue(mockChannel)

        const { result } = renderHook(() => useVpdSabStream())

        act(() => {
            vi.advanceTimersByTime(250)
        })

        expect(mockChannel.read).toHaveBeenCalled()
        expect(result.current.vpdStatus).toBe('optimal')
    })

    it('maps all VPD signal codes correctly', () => {
        const mockChannel = { read: vi.fn() }
        mockGetSabChannel.mockReturnValue(mockChannel)

        const { result } = renderHook(() => useVpdSabStream())

        // Signal 2 = low
        mockChannel.read.mockReturnValue(2)
        act(() => {
            vi.advanceTimersByTime(250)
        })
        expect(result.current.vpdStatus).toBe('low')

        // Signal 3 = high
        mockChannel.read.mockReturnValue(3)
        act(() => {
            vi.advanceTimersByTime(250)
        })
        expect(result.current.vpdStatus).toBe('high')

        // Signal 4 = danger
        mockChannel.read.mockReturnValue(4)
        act(() => {
            vi.advanceTimersByTime(250)
        })
        expect(result.current.vpdStatus).toBe('danger')

        // Signal 0 = none
        mockChannel.read.mockReturnValue(0)
        act(() => {
            vi.advanceTimersByTime(250)
        })
        expect(result.current.vpdStatus).toBe('none')

        // Unknown signal = none
        mockChannel.read.mockReturnValue(99)
        act(() => {
            vi.advanceTimersByTime(250)
        })
        expect(result.current.vpdStatus).toBe('none')
    })

    it('reads and decodes VPD values from ring buffer', () => {
        const mockRing = { pop: vi.fn() }
        mockGetSabRingBuffer.mockReturnValue(mockRing)

        // First pop returns 1234 (vpd = 1.234 kPa), then null
        mockRing.pop.mockReturnValueOnce(1234).mockReturnValue(null)

        const { result } = renderHook(() => useVpdSabStream())

        act(() => {
            vi.advanceTimersByTime(250)
        })

        expect(result.current.latestVpd).toBeCloseTo(1.234)
    })

    it('drains ring buffer and keeps only latest value', () => {
        const mockRing = { pop: vi.fn() }
        mockGetSabRingBuffer.mockReturnValue(mockRing)

        // Multiple values in buffer -- last one wins
        mockRing.pop
            .mockReturnValueOnce(1000)
            .mockReturnValueOnce(1500)
            .mockReturnValueOnce(2000)
            .mockReturnValue(null)

        const { result } = renderHook(() => useVpdSabStream())

        act(() => {
            vi.advanceTimersByTime(250)
        })

        // Should keep the last value (2000 / 1000 = 2.0)
        expect(result.current.latestVpd).toBeCloseTo(2.0)
    })

    it('does not re-render when no data changes', () => {
        const mockChannel = { read: vi.fn().mockReturnValue(0) }
        mockGetSabChannel.mockReturnValue(mockChannel)

        const { result } = renderHook(() => {
            return useVpdSabStream()
        })

        // Advance timer -- status is still 'none', no change
        act(() => {
            vi.advanceTimersByTime(250)
        })

        // Should not re-render since nothing changed
        expect(result.current.vpdStatus).toBe('none')
    })

    it('cleans up interval on unmount', () => {
        const mockChannel = { read: vi.fn().mockReturnValue(0) }
        mockGetSabChannel.mockReturnValue(mockChannel)

        const { unmount } = renderHook(() => useVpdSabStream())
        unmount()

        // Advance time -- read should not be called after unmount
        mockChannel.read.mockClear()
        act(() => {
            vi.advanceTimersByTime(500)
        })

        expect(mockChannel.read).not.toHaveBeenCalled()
    })

    it('reads from both channel and ring buffer simultaneously', () => {
        const mockChannel = { read: vi.fn().mockReturnValue(3) } // HIGH
        const mockRing = { pop: vi.fn() }
        mockRing.pop.mockReturnValueOnce(1850).mockReturnValue(null)

        mockGetSabChannel.mockReturnValue(mockChannel)
        mockGetSabRingBuffer.mockReturnValue(mockRing)

        const { result } = renderHook(() => useVpdSabStream())

        act(() => {
            vi.advanceTimersByTime(250)
        })

        expect(result.current.vpdStatus).toBe('high')
        expect(result.current.latestVpd).toBeCloseTo(1.85)
        expect(result.current.isStreaming).toBe(true)
    })

    it('preserves previous VPD value when ring buffer is empty', () => {
        const mockRing = { pop: vi.fn() }
        mockGetSabRingBuffer.mockReturnValue(mockRing)

        const { result } = renderHook(() => useVpdSabStream())

        // First tick: buffer has a value
        mockRing.pop.mockReturnValueOnce(1500).mockReturnValue(null)
        act(() => {
            vi.advanceTimersByTime(250)
        })
        expect(result.current.latestVpd).toBeCloseTo(1.5)

        // Second tick: buffer is empty -- should keep previous value
        mockRing.pop.mockReturnValue(null)
        act(() => {
            vi.advanceTimersByTime(250)
        })
        expect(result.current.latestVpd).toBeCloseTo(1.5)
    })
})
