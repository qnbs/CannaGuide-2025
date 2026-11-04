import { useCallback, useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import {
    clearAlerts,
    clearReadings,
    restoreHydroHistory,
    selectHydroReadings,
} from '@/stores/slices/hydroSlice'
import type { HydroAlert, HydroReading } from '@/types'

export type HydroClearTarget = 'readings' | 'alerts' | 'all'

/** What a confirmed clear removed, kept for the undo. */
export interface HydroClearUndo {
    readings: HydroReading[]
    alerts: HydroAlert[]
}

/** How long the undo of a clear stays available on the page. */
export const HYDRO_UNDO_WINDOW_MS = 10_000

const CLEARS: Readonly<Record<HydroClearTarget, { readings: boolean; alerts: boolean }>> = {
    readings: { readings: true, alerts: false },
    alerts: { readings: false, alerts: true },
    all: { readings: true, alerts: true },
}

const removedBy = (
    target: HydroClearTarget,
    readings: HydroReading[],
    alerts: HydroAlert[],
): HydroClearUndo => ({
    readings: CLEARS[target].readings ? readings : [],
    alerts: CLEARS[target].alerts ? alerts : [],
})

/**
 * Clearing the hydro history (GH #685): the grower picks readings, alerts or
 * both, confirms, and can undo it for HYDRO_UNDO_WINDOW_MS while the page is
 * open. The undo puts back exactly the removed entries, with their ids.
 */
export const useHydroClear = () => {
    const dispatch = useAppDispatch()
    const readings = useAppSelector(selectHydroReadings)
    // Every stored alert, dismissed ones included: clearing alerts removes them all.
    const alerts = useAppSelector((state) => state.hydro.alerts)
    const [target, setTarget] = useState<HydroClearTarget | null>(null)
    const [undo, setUndo] = useState<HydroClearUndo | null>(null)

    useEffect(() => {
        if (undo === null) return undefined
        const timer = setTimeout(() => setUndo(null), HYDRO_UNDO_WINDOW_MS)
        return () => clearTimeout(timer)
    }, [undo])

    const confirmClear = useCallback(() => {
        if (target === null) return
        const removed = removedBy(target, readings, alerts)
        if (CLEARS[target].readings) dispatch(clearReadings())
        if (CLEARS[target].alerts) dispatch(clearAlerts())
        setUndo(removed)
        setTarget(null)
    }, [alerts, dispatch, readings, target])

    const undoClear = useCallback(() => {
        if (undo !== null) dispatch(restoreHydroHistory(undo))
        setUndo(null)
    }, [dispatch, undo])

    return {
        readingCount: readings.length,
        alertCount: alerts.length,
        target,
        setTarget,
        confirmClear,
        undo,
        undoClear,
    }
}
