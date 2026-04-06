import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Module mocks -- must come before component imports
// ---------------------------------------------------------------------------

vi.mock('@/services/gpuResourceManager', () => ({
    getGpuLockState: vi.fn(() => ({ locked: false, holder: null, queueLength: 0 })),
}))

vi.mock('@/services/workerBus', () => ({
    workerBus: {
        getQueueState: vi.fn(() => ({
            current: [],
            queued: [],
            byPriority: { critical: 0, high: 0, normal: 0, low: 0 },
        })),
    },
}))

vi.mock('@/services/localAiTelemetryService', () => ({
    getSnapshot: vi.fn(() => ({
        averageLatencyMs: 0,
        averageTokensPerSecond: 0,
        successRate: 0,
        totalInferences: 0,
    })),
}))

vi.mock('@/services/ragEmbeddingCacheService', () => ({
    getStats: vi.fn(() =>
        Promise.resolve({ total: 0, hits: 0, misses: 0, precomputeComplete: false }),
    ),
}))

vi.mock('@/stores/store', () => ({
    useAppSelector: vi.fn((selector: (s: unknown) => unknown) =>
        selector({ settings: { localAi: { ecoMode: false } } }),
    ),
    useAppDispatch: vi.fn(() => vi.fn()),
}))

vi.mock('@/stores/selectors', () => ({
    selectSettings: (s: { settings: unknown }) => s.settings,
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

// DevTelemetryPanel exports the inner component only when DEV is true.
// In Vitest, import.meta.env.DEV is true by default, so the real component
// is exported and can be rendered.
import { DevTelemetryPanel } from './DevTelemetryPanel'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DevTelemetryPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the collapsed toggle button', () => {
        render(<DevTelemetryPanel />)
        expect(screen.getByRole('button', { name: /telemetry/i })).toBeDefined()
    })

    it('shows section titles when expanded', () => {
        render(<DevTelemetryPanel />)
        fireEvent.click(screen.getByRole('button', { name: /telemetry/i }))
        expect(screen.getByText('GPU Mutex')).toBeDefined()
        expect(screen.getByText('WorkerBus')).toBeDefined()
        expect(screen.getByText('EcoMode')).toBeDefined()
    })

    it('collapses again on second click', () => {
        render(<DevTelemetryPanel />)
        const btn = screen.getByRole('button', { name: /telemetry/i })
        fireEvent.click(btn)
        expect(screen.getByText('GPU Mutex')).toBeDefined()
        fireEvent.click(btn)
        expect(screen.queryByText('GPU Mutex')).toBeNull()
    })
})
