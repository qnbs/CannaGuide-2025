
import { Plant, Scenario, ScenarioAction, PlantHistoryEntry } from '@/types'
import { plantSimulationService } from '@/services/plantSimulationService'

const applyAction = (plant: Plant, action: ScenarioAction): Plant => {
    switch (action) {
        case 'TOP':
            return plantSimulationService.topPlant(plant).updatedPlant
        case 'LST':
            return plantSimulationService.applyLst(plant).updatedPlant
        case 'NONE':
        default:
            return plant
    }
}

self.onmessage = (e: MessageEvent<{ basePlant: Plant; scenario: Scenario }>) => {
    let plantA = plantSimulationService.clonePlant(e.data.basePlant)
    let plantB = plantSimulationService.clonePlant(e.data.basePlant)
    const { scenario } = e.data

    const historyA: PlantHistoryEntry[] = []
    const historyB: PlantHistoryEntry[] = []

    const oneDayInMillis = 24 * 60 * 60 * 1000

    for (let day = 1; day <= scenario.durationDays; day++) {
        if (day === scenario.plantAModifier.day) {
            plantA = applyAction(plantA, scenario.plantAModifier.action)
        }
        if (day === scenario.plantBModifier.day) {
            plantB = applyAction(plantB, scenario.plantBModifier.action)
        }

        const resultA = plantSimulationService.calculateStateForTimeDelta(plantA, oneDayInMillis)
        plantA = resultA.updatedPlant
        historyA.push({
            day: plantA.age,
            height: plantA.height,
            health: plantA.health,
            stressLevel: plantA.stressLevel,
            medium: plantA.medium
        })

        const resultB = plantSimulationService.calculateStateForTimeDelta(plantB, oneDayInMillis)
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
