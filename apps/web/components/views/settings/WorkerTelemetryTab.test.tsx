import { describe, it, expect, vi } from 'vitest'
import { changeAppLanguage } from '@/i18n'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import workerMetricsReducer from '@/stores/slices/workerMetricsSlice'
import type { WorkerBusMetrics } from '@/services/workerBus'
import type { PoolMetrics } from '@/services/workerPool'

// Mock crossOriginIsolation
vi.mock('@/utils/crossOriginIsolation', () => ({
    canUseSharedArrayBuffer: () => false,
    isCrossOriginIsolated: () => false,
    getCrossOriginIsolationStatus: () => ({
        isolated: false,
        sabAvailable: false,
        atomicsAvailable: false,
        canUseLockFree: false,
    }),
}))

// Lazy-loaded component -- import directly for unit test
import WorkerTelemetryTab from './WorkerTelemetryTab'

function makeStore(
    metrics: Record<string, WorkerBusMetrics> = {},
    poolMetrics: PoolMetrics | undefined = undefined,
) {
    return configureStore({
        reducer: {
            workerMetrics: workerMetricsReducer,
        },
        preloadedState: {
            workerMetrics: {
                metrics,
                poolMetrics,
                lastUpdatedAt: 0,
            },
        },
    })
}

function renderTab(
    metrics: Record<string, WorkerBusMetrics> = {},
    poolMetrics: PoolMetrics | undefined = undefined,
) {
    const store = makeStore(metrics, poolMetrics)
    return render(
        <Provider store={store}>
            <WorkerTelemetryTab />
        </Provider>,
    )
}

describe('WorkerTelemetryTab', () => {
    // CG-AUD-20261027-N03: the tab called `workerTelemetry.*` while the strings live
    // under `settingsView.workerTelemetry.*`, so every language got the English
    // defaultValue. In German the real translation must render.
    it('renders its translated strings, not the English fallback', async () => {
        await changeAppLanguage('de')
        try {
            renderTab()
            expect(screen.getByText('Worker-Telemetrie')).toBeInTheDocument()
            expect(screen.queryByText('Worker Telemetry')).not.toBeInTheDocument()
        } finally {
            await changeAppLanguage('en')
        }
    })

    it('renders title and SAB fallback badge', () => {
        renderTab()
        expect(screen.getByText('Worker Telemetry')).toBeInTheDocument()
        expect(screen.getByText('Fallback: Transferable')).toBeInTheDocument()
    })

    it('shows "no pool" when poolMetrics is undefined', () => {
        renderTab()
        expect(screen.getByText('Worker pool not initialized')).toBeInTheDocument()
    })

    it('shows "no workers" when metrics is empty', () => {
        renderTab()
        expect(screen.getByText('No workers active')).toBeInTheDocument()
    })

    it('renders pool metrics when provided', () => {
        const pool: PoolMetrics = {
            activeCount: 3,
            idleCount: 2,
            totalSpawned: 5,
            totalTerminated: 7,
            maxPoolSize: 8,
            sabAvailable: false,
            sabBufferUtilization: {},
        }
        renderTab({}, pool)

        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('Active')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('Idle')).toBeInTheDocument()
        expect(screen.getByText('5')).toBeInTheDocument()
        expect(screen.getByText('Spawned')).toBeInTheDocument()
        expect(screen.getByText('7')).toBeInTheDocument()
        expect(screen.getByText('Terminated')).toBeInTheDocument()
    })

    it('renders per-worker metrics table', () => {
        const metrics: Record<string, WorkerBusMetrics> = {
            vpd: {
                totalDispatches: 42,
                totalErrors: 1,
                totalTimeouts: 0,
                pendingCount: 0,
                queuedCount: 0,
                averageLatencyMs: 12,
                preemptionCount: 0,
                cooperativePreemptions: 0,
                concurrencyLimit: 4,
            },
        }
        renderTab(metrics)

        expect(screen.getByText('vpd')).toBeInTheDocument()
        expect(screen.getByText('42')).toBeInTheDocument()
        expect(screen.getByText('12ms')).toBeInTheDocument()
    })
})
