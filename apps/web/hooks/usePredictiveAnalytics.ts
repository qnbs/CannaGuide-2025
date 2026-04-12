// ---------------------------------------------------------------------------
// usePredictiveAnalytics -- React hook for predictive analytics insights
//
// Runs predictiveAnalyticsService.analyze() for each active plant and
// returns a map of plant-id -> PredictiveInsight. Results are cached in
// component state and refreshed every 5 minutes or on plant-list changes.
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { Plant } from '@/types'
import {
    predictiveAnalyticsService,
    type PredictiveInsight,
    type RiskLevel,
} from '@/services/predictiveAnalyticsService'
import * as Sentry from '@sentry/browser'

const REFRESH_INTERVAL_MS = 5 * 60 * 1000

const RISK_ORDER: Record<RiskLevel, number> = {
    low: 0,
    moderate: 1,
    high: 2,
    critical: 3,
}

export interface PredictiveAnalyticsResult {
    /** Per-plant predictive insights keyed by plant id */
    readonly insights: ReadonlyMap<string, PredictiveInsight>
    /** True while any analysis is in-flight */
    readonly loading: boolean
    /** Worst Botrytis risk level across all plants (null when no data) */
    readonly worstRisk: RiskLevel | null
    /** Manually trigger a re-analysis */
    readonly refresh: () => void
}

/**
 * Hook that provides predictive analytics for a list of plants.
 *
 * @param plants - Array of active plants to analyze
 * @param deviceId - IoT sensor device identifier (defaults to 'default')
 * @returns PredictiveAnalyticsResult with insights, loading state, and worst risk
 */
export function usePredictiveAnalytics(
    plants: readonly Plant[],
    deviceId = 'default',
): PredictiveAnalyticsResult {
    const [insights, setInsights] = useState<ReadonlyMap<string, PredictiveInsight>>(new Map())
    const [loading, setLoading] = useState(false)
    const cancelledRef = useRef(false)
    const runIdRef = useRef(0)
    const plantsRef = useRef(plants)
    plantsRef.current = plants

    // Stable identity key to avoid infinite re-renders from new array refs
    const plantsKey = useMemo(() => plants.map((p) => p.id).join(','), [plants])

    const runAnalysis = useCallback((): void => {
        const currentPlants = plantsRef.current
        if (currentPlants.length === 0) {
            setInsights(new Map())
            setLoading(false)
            return
        }

        const currentRun = ++runIdRef.current
        setLoading(true)
        const start = performance.now()

        const promises = currentPlants.map((plant) =>
            predictiveAnalyticsService
                .analyze(plant, deviceId)
                .then((result) => [plant.id, result] as const)
                .catch((err: unknown) => {
                    Sentry.addBreadcrumb({
                        category: 'predictive-analytics',
                        message: `Analysis failed for plant ${plant.id}`,
                        level: 'warning',
                    })
                    console.debug('[PredictiveAnalytics] Analysis failed for plant', plant.id, err)
                    return null
                }),
        )

        void Promise.all(promises).then((results) => {
            if (cancelledRef.current || currentRun !== runIdRef.current) return

            const map = new Map<string, PredictiveInsight>()
            for (const result of results) {
                if (result !== null) {
                    map.set(result[0], result[1])
                }
            }
            setInsights(map)
            setLoading(false)

            const elapsed = performance.now() - start
            Sentry.addBreadcrumb({
                category: 'predictive-analytics',
                message: `Analyzed ${map.size}/${currentPlants.length} plants in ${elapsed.toFixed(0)}ms`,
                level: 'info',
            })
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plantsKey, deviceId])

    useEffect(() => {
        cancelledRef.current = false
        runAnalysis()
        const intervalId = setInterval(runAnalysis, REFRESH_INTERVAL_MS)
        return () => {
            cancelledRef.current = true
            clearInterval(intervalId)
        }
    }, [runAnalysis])

    // Compute worst risk across all insights
    const worstRisk = (() => {
        let worst: RiskLevel | null = null
        for (const insight of insights.values()) {
            const level = insight.botrytisRisk.riskLevel
            if (worst === null || RISK_ORDER[level] > RISK_ORDER[worst]) {
                worst = level
            }
        }
        return worst
    })()

    return { insights, loading, worstRisk, refresh: runAnalysis }
}
