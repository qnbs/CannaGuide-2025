import type { Plant, JournalEntry, Task } from '@/types'
import type { SimulationSettings } from '@/services/simulation/simulationProfiles'
import { plantSimulationService } from '@/services/plantSimulationService'

export type AdvancePlantSimulationTimeInput = {
    plant: Plant
    deltaMs: number
    simulationSettings?: SimulationSettings
}

export type AdvancePlantSimulationTimeResult = {
    updatedPlant: Plant
    newJournalEntries: JournalEntry[]
    newTasks: Task[]
}

/** Application use-case facade for advancing plant simulation time (DDD entry point). */
export function advancePlantSimulationTimeUseCase(
    input: AdvancePlantSimulationTimeInput,
): AdvancePlantSimulationTimeResult {
    return plantSimulationService.calculateStateForTimeDelta(
        input.plant,
        input.deltaMs,
        input.simulationSettings,
    )
}
