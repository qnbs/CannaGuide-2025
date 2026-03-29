// This worker is intended for background simulation tasks.
// It receives a plant state and a time delta, runs the simulation logic,
// and posts the updated state back to the main thread.

import type { Plant, AppSettings } from '@/types'
import { plantSimulationService } from '@/services/plantSimulationService'
import type { WorkerRequest } from '@/types/workerBus.types'
import { workerOk, workerErr } from '@/types/workerBus.types'

export interface SimulationWorkerInput {
    plant: Plant
    deltaTime: number
    simulationSettings?: AppSettings['simulation']
}

const isTrustedWorkerMessage = (event: MessageEvent<unknown>): boolean => {
    return !event.origin || event.origin === self.location.origin
}

self.onmessage = (e: MessageEvent<WorkerRequest<SimulationWorkerInput>>) => {
    if (!isTrustedWorkerMessage(e)) {
        return
    }

    const { messageId, payload } = e.data

    try {
        if (!payload?.plant || typeof payload.deltaTime !== 'number' || payload.deltaTime <= 0) {
            self.postMessage(
                workerErr(messageId, 'Invalid input: plant is required and deltaTime must be > 0'),
            )
            return
        }
        const { plant, deltaTime, simulationSettings } = payload
        const result = plantSimulationService.calculateStateForTimeDelta(
            plant,
            deltaTime,
            simulationSettings,
        )
        self.postMessage(workerOk(messageId, result))
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown simulation error'
        self.postMessage(workerErr(messageId, message))
    }
}
