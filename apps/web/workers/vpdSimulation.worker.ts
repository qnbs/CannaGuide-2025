/// <reference lib="webworker" />

import { calculateVPD, getVPDStatus, runDailySimulation } from '@/utils/vpdCalculator'
import type { PlantState, RunDailyPayload, RunGrowthPayload } from '@/types/simulation.types'
import type { WorkerRequest } from '@/types/workerBus.types'
import { workerOk, workerErr } from '@/types/workerBus.types'
import { initAbortHandler, checkAborted, clearAborted } from '@/utils/workerAbort'
import { initSabHandler, getWorkerChannel, getWorkerRingBuffer } from '@/utils/workerSabHandler'

// ---------------------------------------------------------------------------
// W-06/SAB: VPD status signal codes for AtomicsChannel (main reads these)
// ---------------------------------------------------------------------------

/** VPD status codes written to AtomicsChannel slot 0 by the worker. */
export const VPD_SIGNAL = {
    NONE: 0,
    OPTIMAL: 1,
    LOW: 2,
    HIGH: 3,
    DANGER: 4,
} as const

/** Map VPD status string to signal code. */
const STATUS_TO_SIGNAL: Record<string, number> = {
    optimal: VPD_SIGNAL.OPTIMAL,
    low: VPD_SIGNAL.LOW,
    high: VPD_SIGNAL.HIGH,
    danger: VPD_SIGNAL.DANGER,
}

const growthFactorByStage = {
    seedling: 0.012,
    vegetative: 0.02,
    earlyFlower: 0.016,
    lateFlower: 0.009,
} as const

const updatePlantForDay = (
    plant: PlantState,
    vpd: number,
    status: 'optimal' | 'low' | 'high' | 'danger',
): PlantState => {
    const stressDelta = status === 'optimal' ? -1.2 : status === 'danger' ? 4.5 : 2.2
    const nextStress = Math.max(0, Math.min(100, plant.stressLevel + stressDelta))
    const nextHealth = Math.max(
        0,
        Math.min(
            100,
            plant.health - Math.max(0, stressDelta * 0.8) + (status === 'optimal' ? 0.5 : 0),
        ),
    )

    const growthBase = growthFactorByStage[plant.growthStage]
    const growthPenalty = Math.max(0.35, 1 - nextStress / 120)
    const nextBiomass = Math.max(0, plant.biomass + plant.biomass * growthBase * growthPenalty)

    const yieldGain =
        nextBiomass * (plant.growthStage === 'lateFlower' ? 0.035 : 0.015) * (nextHealth / 100)

    return {
        ...plant,
        ageDays: plant.ageDays + 1,
        stressLevel: Number(nextStress.toFixed(2)),
        health: Number(nextHealth.toFixed(2)),
        biomass: Number(nextBiomass.toFixed(4)),
        projectedYield: Number((plant.projectedYield + yieldGain).toFixed(3)),
        vpdHistory: [
            ...plant.vpdHistory,
            {
                date: new Date(Date.now() + plant.ageDays * 86400000).toISOString(),
                vpd,
                status,
            },
        ],
    }
}

const isTrustedWorkerMessage = (event: MessageEvent<unknown>): boolean => {
    return !event.origin || event.origin === self.location.origin
}

self.onmessage = (e: MessageEvent<WorkerRequest<RunDailyPayload | RunGrowthPayload>>) => {
    if (!isTrustedWorkerMessage(e)) {
        return
    }

    const { messageId, type, payload } = e.data

    try {
        if (type === 'RUN_DAILY') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const p = payload as RunDailyPayload
            const result = runDailySimulation(p.baseInput, p.tempProfile, p.rhProfile)
            self.postMessage(workerOk(messageId, result))
            return
        }

        if (type === 'RUN_GROWTH') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const p = payload as RunGrowthPayload
            let plant: PlantState = p.plant
            const days = Math.max(1, p.days || 7)

            // W-06/SAB: Get hot-path primitives (null when SAB unavailable)
            const sabChannel = getWorkerChannel()
            const sabRing = getWorkerRingBuffer()

            for (let day = 0; day < days; day += 1) {
                // W-02.1: Cooperative preemption -- abort early if preempted
                checkAborted(messageId)

                const vpd = calculateVPD(p.env)
                const status = getVPDStatus(vpd, 1.2)
                plant = updatePlantForDay(plant, vpd, status)

                // W-06/SAB: Signal VPD status to main thread via Atomics (< 1us)
                if (sabChannel) {
                    sabChannel.signal(STATUS_TO_SIGNAL[status] ?? VPD_SIGNAL.NONE)
                }
                // W-06/SAB: Stream VPD value to ring buffer (main consumes async)
                // Encode as integer: vpd * 1000 (e.g. 1.234 -> 1234)
                if (sabRing) {
                    sabRing.push(Math.round(vpd * 1000))
                }
            }

            clearAborted(messageId)
            self.postMessage(workerOk(messageId, plant))
            return
        }

        self.postMessage(workerErr(messageId, `Unknown command: ${type}`))
    } catch (error) {
        self.postMessage(
            workerErr(messageId, error instanceof Error ? error.message : 'VPD worker error'),
        )
    }
}

// W-02.1: Install cooperative abort handler (must be after self.onmessage)
initAbortHandler()

// W-06/SAB: Install SAB handler (must be after initAbortHandler)
initSabHandler()
