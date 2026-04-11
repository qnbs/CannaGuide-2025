import { Plant, Scenario, ScenarioAction, PlantHistoryEntry, AppSettings } from '@/types'
import { plantSimulationService } from '@/services/plantSimulationService'
import { SIM_SECONDS_PER_DAY } from '@/constants'
import type { WorkerRequest } from '@/types/workerBus.types'
import { workerOk, workerErr } from '@/types/workerBus.types'
import { initAbortHandler, checkAborted, clearAborted } from '@/utils/workerAbort'

const applyAction = (
    plant: Plant,
    action: ScenarioAction,
    simulationSettings?: AppSettings['simulation'],
): Plant => {
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

const isTrustedWorkerMessage = (event: MessageEvent<unknown>): boolean => {
    return !event.origin || event.origin === self.location.origin
}

interface ScenarioPayload {
    basePlant: Plant
    scenario: Scenario
    simulationSettings?: AppSettings['simulation']
}

self.onmessage = (e: MessageEvent<WorkerRequest<ScenarioPayload>>) => {
    if (!isTrustedWorkerMessage(e)) {
        return
    }

    const { messageId, payload } = e.data

    try {
        if (!payload) {
            self.postMessage(workerErr(messageId, 'Missing payload'))
            return
        }

        let plantA = plantSimulationService.clonePlant(payload.basePlant)
        let plantB = plantSimulationService.clonePlant(payload.basePlant)
        const { scenario, simulationSettings } = payload

        const historyA: PlantHistoryEntry[] = []
        const historyB: PlantHistoryEntry[] = []

        const oneDayInMillis = SIM_SECONDS_PER_DAY * 1000

        for (let day = 1; day <= scenario.durationDays; day++) {
            // W-02.1: Cooperative preemption -- abort early if preempted
            checkAborted(messageId)

            if (day === scenario.plantAModifier.day) {
                plantA = applyAction(plantA, scenario.plantAModifier.action, simulationSettings)
            }
            if (day === scenario.plantBModifier.day) {
                plantB = applyAction(plantB, scenario.plantBModifier.action, simulationSettings)
            }

            plantA = plantSimulationService.applyEnvironmentalCorrections(
                plantA,
                simulationSettings,
            )
            plantB = plantSimulationService.applyEnvironmentalCorrections(
                plantB,
                simulationSettings,
            )

            const resultA = plantSimulationService.calculateStateForTimeDelta(
                plantA,
                oneDayInMillis,
                simulationSettings,
            )
            plantA = resultA.updatedPlant
            historyA.push({
                day: plantA.age,
                height: plantA.height,
                health: plantA.health,
                stressLevel: plantA.stressLevel,
                medium: plantA.medium,
            })

            const resultB = plantSimulationService.calculateStateForTimeDelta(
                plantB,
                oneDayInMillis,
                simulationSettings,
            )
            plantB = resultB.updatedPlant
            historyB.push({
                day: plantB.age,
                height: plantB.height,
                health: plantB.health,
                stressLevel: plantB.stressLevel,
                medium: plantB.medium,
            })
        }

        clearAborted(messageId)
        self.postMessage(
            workerOk(messageId, {
                originalHistory: historyA,
                modifiedHistory: historyB,
                originalFinalState: plantA,
                modifiedFinalState: plantB,
            }),
        )
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown scenario error'
        self.postMessage(workerErr(messageId, message))
    }
}

// W-02.1: Install cooperative abort handler (must be after self.onmessage)
initAbortHandler()
