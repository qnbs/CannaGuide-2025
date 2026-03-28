// This worker is intended for background simulation tasks.
// It receives a plant state and a time delta, runs the simulation logic,
// and posts the updated state back to the main thread.

import { Plant, AppSettings } from '@/types'
import { plantSimulationService } from '@/services/plantSimulationService'

export interface SimulationWorkerInput {
    plant: Plant
    deltaTime: number
    simulationSettings?: AppSettings['simulation']
}

export interface SimulationWorkerError {
    error: string
}

const isTrustedWorkerMessage = (event: MessageEvent<unknown>): boolean => {
    return !event.origin || event.origin === self.location.origin
}

self.onmessage = (e: MessageEvent<SimulationWorkerInput>) => {
    if (!isTrustedWorkerMessage(e)) {
        return
    }

    try {
        const data = e.data
        if (!data?.plant || typeof data.deltaTime !== 'number' || data.deltaTime <= 0) {
            self.postMessage({
                error: 'Invalid input: plant is required and deltaTime must be > 0',
            } satisfies SimulationWorkerError)
            return
        }
        const { plant, deltaTime, simulationSettings } = data
        const result = plantSimulationService.calculateStateForTimeDelta(
            plant,
            deltaTime,
            simulationSettings,
        )
        self.postMessage(result)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown simulation error'
        self.postMessage({ error: message } satisfies SimulationWorkerError)
    }
}
