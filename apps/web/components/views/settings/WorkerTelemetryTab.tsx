/**
 * WorkerTelemetryTab -- Worker efficiency dashboard (A-03).
 *
 * Displays WorkerBus pool metrics, per-worker dispatch statistics,
 * SAB mode indicator, and concurrency information.
 * Reads data from Redux `workerMetrics` slice (5s refresh via telemetry service).
 */

import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/stores/store'
import { getCrossOriginIsolationStatus } from '@/utils/crossOriginIsolation'
import type { WorkerBusMetrics } from '@/services/workerBus'
import type { PoolMetrics } from '@/services/workerPool'

// ---------------------------------------------------------------------------
// SAB Mode Badge
// ---------------------------------------------------------------------------

const SabBadge: React.FC = memo(() => {
    const { t } = useTranslation()
    const status = useMemo(() => getCrossOriginIsolationStatus(), [])

    return (
        <div className="flex items-center gap-2">
            <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    status.canUseLockFree
                        ? 'bg-green-500/20 text-green-300 ring-1 ring-green-500/30'
                        : 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30'
                }`}
                role="status"
            >
                <span
                    className={`h-2 w-2 rounded-full ${
                        status.canUseLockFree ? 'bg-green-400' : 'bg-amber-400'
                    }`}
                    aria-hidden="true"
                />
                {status.canUseLockFree
                    ? t('workerTelemetry.sabActive', { defaultValue: 'SAB Mode: Active' })
                    : t('workerTelemetry.sabFallback', {
                          defaultValue: 'Fallback: Transferable',
                      })}
            </span>
        </div>
    )
})
SabBadge.displayName = 'SabBadge'

// ---------------------------------------------------------------------------
// Pool Status Card
// ---------------------------------------------------------------------------

interface PoolStatusProps {
    poolMetrics: PoolMetrics | undefined
}

const PoolStatus: React.FC<PoolStatusProps> = memo(({ poolMetrics }) => {
    const { t } = useTranslation()

    if (!poolMetrics) {
        return (
            <div className="rounded-lg bg-slate-800/50 p-4 text-sm text-slate-400">
                {t('workerTelemetry.noPool', { defaultValue: 'Worker pool not initialized' })}
            </div>
        )
    }

    const stats = [
        {
            label: t('workerTelemetry.active', { defaultValue: 'Active' }),
            value: poolMetrics.activeCount,
            color: 'text-green-400',
        },
        {
            label: t('workerTelemetry.idle', { defaultValue: 'Idle' }),
            value: poolMetrics.idleCount,
            color: 'text-amber-400',
        },
        {
            label: t('workerTelemetry.spawned', { defaultValue: 'Spawned' }),
            value: poolMetrics.totalSpawned,
            color: 'text-cyan-400',
        },
        {
            label: t('workerTelemetry.terminated', { defaultValue: 'Terminated' }),
            value: poolMetrics.totalTerminated,
            color: 'text-slate-400',
        },
    ]

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
                <div key={s.label} className="rounded-lg bg-slate-800/50 p-3 text-center">
                    <div className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                </div>
            ))}
        </div>
    )
})
PoolStatus.displayName = 'PoolStatus'

// ---------------------------------------------------------------------------
// Per-Worker Metrics Table
// ---------------------------------------------------------------------------

interface WorkerTableProps {
    metrics: Record<string, WorkerBusMetrics>
}

const WorkerTable: React.FC<WorkerTableProps> = memo(({ metrics }) => {
    const { t } = useTranslation()
    const entries = useMemo(
        () => Object.entries(metrics).sort(([a], [b]) => a.localeCompare(b)),
        [metrics],
    )

    if (entries.length === 0) {
        return (
            <div className="rounded-lg bg-slate-800/50 p-4 text-sm text-slate-400">
                {t('workerTelemetry.noWorkers', { defaultValue: 'No workers active' })}
            </div>
        )
    }

    return (
        <div className="overflow-x-auto rounded-lg bg-slate-800/50">
            <table className="w-full text-sm" role="table">
                <thead className="border-b border-slate-700">
                    <tr>
                        <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                        >
                            {t('workerTelemetry.workerName', { defaultValue: 'Worker' })}
                        </th>
                        <th
                            scope="col"
                            className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider"
                        >
                            {t('workerTelemetry.dispatches', { defaultValue: 'Dispatches' })}
                        </th>
                        <th
                            scope="col"
                            className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider"
                        >
                            {t('workerTelemetry.errors', { defaultValue: 'Errors' })}
                        </th>
                        <th
                            scope="col"
                            className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider"
                        >
                            {t('workerTelemetry.avgLatency', { defaultValue: 'Avg Latency' })}
                        </th>
                        <th
                            scope="col"
                            className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider"
                        >
                            {t('workerTelemetry.preemptions', { defaultValue: 'Preemptions' })}
                        </th>
                        <th
                            scope="col"
                            className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase tracking-wider"
                        >
                            {t('workerTelemetry.concurrency', { defaultValue: 'Concurrency' })}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                    {entries.map(([name, m]) => (
                        <tr key={name} className="hover:bg-slate-700/30 transition-colors">
                            <td className="px-3 py-2 font-mono text-xs text-slate-200">{name}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                                {m.totalDispatches}
                            </td>
                            <td
                                className={`px-3 py-2 text-right tabular-nums ${m.totalErrors > 0 ? 'text-red-400' : 'text-slate-400'}`}
                            >
                                {m.totalErrors}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                                {m.averageLatencyMs}ms
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-400">
                                {m.preemptionCount}
                                {m.cooperativePreemptions > 0 && (
                                    <span className="text-green-400 ml-1">
                                        (+{m.cooperativePreemptions})
                                    </span>
                                )}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-400">
                                {m.concurrencyLimit}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
})
WorkerTable.displayName = 'WorkerTable'

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const WorkerTelemetryTab: React.FC = () => {
    const { t } = useTranslation()
    const metrics = useAppSelector((s) => s.workerMetrics.metrics)
    const poolMetrics = useAppSelector((s) => s.workerMetrics.poolMetrics)
    const lastUpdated = useAppSelector((s) => s.workerMetrics.lastUpdatedAt)

    const lastUpdatedStr = useMemo(() => {
        if (lastUpdated === 0) return '--'
        return new Date(lastUpdated).toLocaleTimeString()
    }, [lastUpdated])

    return (
        <div className="space-y-6">
            {/* Header row: title + SAB badge */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-100">
                    {t('workerTelemetry.title', { defaultValue: 'Worker Telemetry' })}
                </h3>
                <SabBadge />
            </div>

            {/* Pool status */}
            <section aria-labelledby="pool-status-heading">
                <h4 id="pool-status-heading" className="text-sm font-medium text-slate-300 mb-2">
                    {t('workerTelemetry.poolStatus', { defaultValue: 'Pool Status' })}
                </h4>
                <PoolStatus poolMetrics={poolMetrics} />
                {poolMetrics && (
                    <div className="mt-2 text-xs text-slate-500">
                        {t('workerTelemetry.maxPool', { defaultValue: 'Max pool size' })}:{' '}
                        <span className="text-slate-400 tabular-nums">
                            {poolMetrics.maxPoolSize}
                        </span>
                    </div>
                )}
            </section>

            {/* Per-worker metrics table */}
            <section aria-labelledby="worker-table-heading">
                <h4 id="worker-table-heading" className="text-sm font-medium text-slate-300 mb-2">
                    {t('workerTelemetry.perWorker', { defaultValue: 'Per-Worker Metrics' })}
                </h4>
                <WorkerTable metrics={metrics} />
            </section>

            {/* Last updated timestamp */}
            <div className="text-xs text-slate-500 text-right">
                {t('workerTelemetry.lastUpdated', { defaultValue: 'Last updated' })}:{' '}
                <span className="tabular-nums">{lastUpdatedStr}</span>
            </div>
        </div>
    )
}

export default memo(WorkerTelemetryTab)
