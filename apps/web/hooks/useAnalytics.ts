// ---------------------------------------------------------------------------
// useAnalytics -- React hook for cross-module grow analytics
//
// Computes GrowAnalytics from current plant simulation state.
// Results are memoized and only recomputed when plants change.
// ---------------------------------------------------------------------------

import { useMemo } from 'react'
import { useAppSelector } from '@/stores/store'
import { selectAllPlants } from '@/stores/selectors'
import { analyticsService, type GrowAnalytics } from '@/services/analyticsService'

/**
 * Hook that provides computed analytics for the entire garden.
 *
 * @returns GrowAnalytics object with gardenScore, riskFactors, recommendations, etc.
 */
export function useAnalytics(): GrowAnalytics {
    const plants = useAppSelector(selectAllPlants)

    return useMemo(() => {
        return analyticsService.compute(plants)
    }, [plants])
}
