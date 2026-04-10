/// <reference lib="webworker" />

import { calculateVPD, getVPDStatus, runDailySimulation } from '@/utils/vpdCalculator'
import type { PlantState, RunDailyPayload, RunGrowthPayload } from '@/types/simulation.types'
import type { WorkerRequest } from '@/types/workerBus.types'
import { workerOk, workerErr } from '@/types/workerBus.types'

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

            for (let day = 0; day < days; day += 1) {
                const vpd = calculateVPD(p.env)
                const status = getVPDStatus(vpd, 1.2)
                plant = updatePlantForDay(plant, vpd, status)
            }

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
