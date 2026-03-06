
import { Plant, Scenario, ScenarioAction, PlantHistoryEntry, AppSettings } from '@/types'
import { plantSimulationService } from '@/services/plantSimulationService'
import { SIM_SECONDS_PER_DAY } from '@/constants'

const applyAction = (plant: Plant, action: ScenarioAction, simulationSettings?: AppSettings['simulation']): Plant => {
    switch (action) {
        case 'TOP':
            return plantSimulationService.topPlant(plant).updatedPlant
        case 'LST':
            return plantSimulationService.applyLst(plant).updatedPlant
        case 'TEMP_PLUS_2': {
            const updated = plantSimulationService.clonePlant(plant)
            updated.environment.internalTemperature += 2
            return plantSimulationService.applyEnvironmentalCorrections(updated, simulationSettings)
        }
        case 'TEMP_MINUS_2': {
            const updated = plantSimulationService.clonePlant(plant)
            updated.environment.internalTemperature -= 2
            return plantSimulationService.applyEnvironmentalCorrections(updated, simulationSettings)
        }
        case 'NONE':
        default:
            return plant
    }
}

self.onmessage = (e: MessageEvent<{ basePlant: Plant; scenario: Scenario; simulationSettings?: AppSettings['simulation'] }>) => {
    let plantA = plantSimulationService.clonePlant(e.data.basePlant)
    let plantB = plantSimulationService.clonePlant(e.data.basePlant)
    const { scenario, simulationSettings } = e.data

    const historyA: PlantHistoryEntry[] = []
    const historyB: PlantHistoryEntry[] = []

    const oneDayInMillis = SIM_SECONDS_PER_DAY * 1000

    for (let day = 1; day <= scenario.durationDays; day++) {
        if (day === scenario.plantAModifier.day) {
            plantA = applyAction(plantA, scenario.plantAModifier.action, simulationSettings)
        }
        if (day === scenario.plantBModifier.day) {
            plantB = applyAction(plantB, scenario.plantBModifier.action, simulationSettings)
        }

        plantA = plantSimulationService.applyEnvironmentalCorrections(plantA, simulationSettings)
        plantB = plantSimulationService.applyEnvironmentalCorrections(plantB, simulationSettings)

        const resultA = plantSimulationService.calculateStateForTimeDelta(plantA, oneDayInMillis, simulationSettings)
        plantA = resultA.updatedPlant
        historyA.push({
            day: plantA.age,
            height: plantA.height,
            health: plantA.health,
            stressLevel: plantA.stressLevel,
            medium: plantA.medium
        })

        const resultB = plantSimulationService.calculateStateForTimeDelta(plantB, oneDayInMillis, simulationSettings)
        plantB = resultB.updatedPlant
        historyB.push({
            day: plantB.age,
            height: plantB.height,
            health: plantB.health,
            stressLevel: plantB.stressLevel,
            medium: plantB.medium
        })
    }

    self.postMessage({
        originalHistory: historyA,
        modifiedHistory: historyB,
        originalFinalState: plantA,
        modifiedFinalState: plantB,
    })
}
