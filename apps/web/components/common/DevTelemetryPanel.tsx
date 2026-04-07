/**
 * DevTelemetryPanel -- dev-only collapsible overlay showing live AI/Worker/GPU metrics.
 * Guarded by import.meta.env.DEV -- zero production overhead (tree-shaken).
 * Refreshes every 5s while expanded.
 */
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { getGpuLockState } from '@/services/gpuResourceManager'
import { workerBus } from '@/services/workerBus'
import { getSnapshot } from '@/services/localAiTelemetryService'
import { getStats as getRagStats } from '@/services/ragEmbeddingCacheService'
import { useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'

interface TelemetryState {
    gpu: { locked: boolean; holder: string | null; queueLength: number }
    workerByPriority: Record<string, number>
    rag: { total: number; hits: number; misses: number } | null
    inference: {
        avgLatencyMs: number
        avgTokPerSec: number
        successRate: number
        totalInferences: number
    }
    ecoMode: boolean
}

const EMPTY_STATE: TelemetryState = {
    gpu: { locked: false, holder: null, queueLength: 0 },
    workerByPriority: { critical: 0, high: 0, normal: 0, low: 0 },
    rag: null,
    inference: { avgLatencyMs: 0, avgTokPerSec: 0, successRate: 0, totalInferences: 0 },
    ecoMode: false,
}

const REFRESH_INTERVAL_MS = 5000

const safeCall = <T,>(fn: () => T, fallback: T): T => {
    try {
        return fn()
    } catch {
        return fallback
    }
}

const DevTelemetryPanelInner: React.FC = memo(() => {
    const [expanded, setExpanded] = useState(false)
    const [state, setState] = useState(EMPTY_STATE)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const settings = useAppSelector(selectSettings)

    const refresh = useCallback(async () => {
        const gpu = safeCall(() => getGpuLockState(), EMPTY_STATE.gpu)

        const workerQ = safeCall(
            () => workerBus.getQueueState(),
            {
                current: [],
                queued: [],
                byPriority: EMPTY_STATE.workerByPriority,
            },
        )

        let rag: TelemetryState['rag'] = null
        try {
            const s = await getRagStats()
            rag = { total: s.total, hits: s.hits, misses: s.misses }
        } catch {
            /* N/A */
        }

        const snap = safeCall(() => getSnapshot(), {
            averageLatencyMs: 0,
            averageTokensPerSecond: 0,
            successRate: 0,
            totalInferences: 0,
            totalTokensGenerated: 0,
            fallbackBreakdown: {} as Record<string, number>,
            cacheHitRate: 0,
            modelBreakdown: {},
            backendBreakdown: {},
            peakTokensPerSecond: 0,
            lastUpdated: 0,
        })

        setState({
            gpu,
            workerByPriority: workerQ.byPriority,
            rag,
            inference: {
                avgLatencyMs: snap.averageLatencyMs,
                avgTokPerSec: snap.averageTokensPerSecond,
                successRate: snap.successRate,
                totalInferences: snap.totalInferences,
            },
            ecoMode: settings.localAi?.ecoMode ?? false,
        })
    }, [settings.localAi?.ecoMode])

    useEffect(() => {
        if (!expanded) {
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
            return
        }
        // Refresh immediately on expand
        void refresh()
        timerRef.current = setInterval(() => void refresh(), REFRESH_INTERVAL_MS)
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }, [expanded, refresh])

    const toggle = useCallback(() => setExpanded((p) => !p), [])

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 8,
                right: 8,
                zIndex: 99999,
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#e2e8f0',
                background: 'rgba(15, 23, 42, 0.92)',
                borderRadius: 8,
                border: '1px solid rgba(148, 163, 184, 0.25)',
                maxWidth: 320,
                pointerEvents: 'auto',
            }}
        >
            <button
                onClick={toggle}
                type="button"
                style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 10px',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 11,
                    fontFamily: 'monospace',
                }}
            >
                {expanded ? '[-] Telemetry' : '[+] Telemetry'}
            </button>

            {expanded && (
                <div style={{ padding: '0 10px 8px' }}>
                    {/* GPU Mutex */}
                    <Section title="GPU Mutex">
                        <Row label="Holder" value={state.gpu.holder ?? 'none'} />
                        <Row label="Queue" value={String(state.gpu.queueLength)} />
                    </Section>

                    {/* WorkerBus */}
                    <Section title="WorkerBus">
                        {Object.entries(state.workerByPriority).map(([k, v]) => (
                            <Row key={k} label={k} value={String(v)} />
                        ))}
                    </Section>

                    {/* RAG Cache */}
                    <Section title="RAG Cache">
                        {state.rag ? (
                            <>
                                <Row label="Total" value={String(state.rag.total)} />
                                <Row label="Hits" value={String(state.rag.hits)} />
                                <Row label="Misses" value={String(state.rag.misses)} />
                            </>
                        ) : (
                            <Row label="Status" value="N/A" />
                        )}
                    </Section>

                    {/* Inference */}
                    <Section title="Inference">
                        <Row label="Count" value={String(state.inference.totalInferences)} />
                        <Row
                            label="Avg Latency"
                            value={`${state.inference.avgLatencyMs.toFixed(0)} ms`}
                        />
                        <Row label="Tok/s" value={state.inference.avgTokPerSec.toFixed(1)} />
                        <Row
                            label="Success"
                            value={`${(state.inference.successRate * 100).toFixed(0)}%`}
                        />
                    </Section>

                    {/* EcoMode */}
                    <Section title="EcoMode">
                        <Row label="Active" value={state.ecoMode ? 'YES' : 'no'} />
                    </Section>
                </div>
            )}
        </div>
    )
})
DevTelemetryPanelInner.displayName = 'DevTelemetryPanelInner'

// Sub-components -------------------------------------------------------

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div style={{ marginBottom: 6 }}>
        <div style={{ color: '#38bdf8', fontWeight: 600, marginBottom: 2 }}>{title}</div>
        {children}
    </div>
)

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
        <span style={{ color: '#94a3b8' }}>{label}</span>
        <span>{value}</span>
    </div>
)

/**
 * Export: renders nothing in production builds. The component is only
 * mounted when import.meta.env.DEV is true.
 */
export const DevTelemetryPanel: React.FC = import.meta.env.DEV ? DevTelemetryPanelInner : () => null
