// This worker is intended for background simulation tasks.
// It receives a plant state and a time delta, runs the simulation logic,
// and posts the updated state back to the main thread.

import { Plant, AppSettings } from '@/types'
import { plantSimulationService } from '@/services/plantSimulationService'

self.onmessage = (e: MessageEvent<{ plant: Plant; deltaTime: number; simulationSettings?: AppSettings['simulation'] }>) => {
    const { plant, deltaTime, simulationSettings } = e.data
    if (plant && deltaTime > 0) {
        // Run the simulation logic from the shared service
        const result = plantSimulationService.calculateStateForTimeDelta(plant, deltaTime, simulationSettings)
        // Post the results back to the main thread
        self.postMessage(result)
    }
}
