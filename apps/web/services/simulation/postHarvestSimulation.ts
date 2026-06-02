import {
    Plant,
    PlantStage,
    HarvestData,
    JournalEntry,
    JournalEntryType,
} from '@/types'
import { PLANT_STAGE_DETAILS } from '@/services/simulation/plantStageDetails'
import {
    getSimulationProfileCurve,
    type SimulationSettings,
} from '@/services/simulation/simulationProfiles'
import { simClamp } from '@/services/simulation/simulationMath'

export function createInitialHarvestData(plant: Plant): HarvestData {
    const wetWeight = Math.max(12, Number((plant.biomass.flowers * 5.5).toFixed(1)))
    const targetDryRatio = simClamp(0.2 + (plant.health / 100) * 0.05, 0.18, 0.28)
    const dryWeight = Number((wetWeight * targetDryRatio).toFixed(1))
    const thc = simClamp(
        plant.strain.thc * 0.78 + plant.health * 0.04 - plant.stressLevel * 0.02,
        4,
        plant.strain.thc * 1.05,
    )
    const cbn = simClamp(thc * 0.015, 0.05, 0.8)
    return {
        wetWeight,
        dryWeight,
        currentDryDay: 0,
        currentCureDay: 0,
        lastBurpDay: 0,
        jarHumidity: 68,
        chlorophyllPercent: 100,
        terpeneRetentionPercent: 100,
        moldRiskPercent: simClamp((plant.environment.internalHumidity - 50) * 1.2, 4, 25),
        finalQuality: 72,
        cannabinoidProfile: {
            thc: Number(thc.toFixed(2)),
            cbn: Number(cbn.toFixed(2)),
        },
        terpeneProfile: { ...plant.terpeneProfile },
    }
}

export function computePostHarvestQuality(
    harvestData: HarvestData,
    simulationSettings?: SimulationSettings | undefined,
): number {
    const profilePrecision = getSimulationProfileCurve(simulationSettings).postHarvestPrecision
    const humiditySweetSpot =
        Math.max(0, 12 - Math.abs(harvestData.jarHumidity - 61) * 3.5) * 2.1
    const chlorophyllScore = Math.max(0, 100 - harvestData.chlorophyllPercent)
    const terpeneScore = harvestData.terpeneRetentionPercent
    const moldPenalty = harvestData.moldRiskPercent * 1.2
    const cannabinoidScore =
        harvestData.cannabinoidProfile.thc * 1.4 + harvestData.cannabinoidProfile.cbn * 2.5
    return simClamp(
        (humiditySweetSpot +
            chlorophyllScore * 0.32 +
            terpeneScore * 0.42 +
            cannabinoidScore -
            moldPenalty) *
            profilePrecision,
        0,
        100,
    )
}

export function isPostHarvestActionAllowed(
    stage: PlantStage,
    action: 'dry' | 'burp' | 'cure',
): boolean {
    return (
        (action === 'dry' && (stage === PlantStage.Harvest || stage === PlantStage.Drying)) ||
        ((action === 'burp' || action === 'cure') && stage === PlantStage.Curing)
    )
}

export function getVentilationFactor(plant: Plant): number {
    return plant.equipment.exhaustFan.power === 'high'
        ? 1.15
        : plant.equipment.exhaustFan.power === 'low'
          ? 0.9
          : 1
}

export function applyDryPostHarvestStep(
    p: Plant,
    harvestData: HarvestData,
    profilePrecision: number,
    ventilationFactor: number,
    simulationSettings: SimulationSettings | undefined,
    newJournalEntries: JournalEntry[],
): void {
    const roomTemp = p.environment.internalTemperature
    const roomHumidity = p.environment.internalHumidity

    if (p.stage === PlantStage.Harvest) {
        p.stage = PlantStage.Drying
    }

    harvestData.currentDryDay += 1
    const humidityPenalty = Math.abs(roomHumidity - 58) / 12
    const tempPenalty = Math.abs(roomTemp - 19.5) / 8
    const controlledDryingScore = simClamp(
        1.15 - humidityPenalty - tempPenalty + (ventilationFactor - 1) * 0.35,
        0.45,
        1.18,
    )
    const waterLossProgress = simClamp(
        0.08 + (62 - roomHumidity) * 0.002 + (roomTemp - 18) * 0.003,
        0.04,
        0.15,
    )
    const remainingWater = Math.max(0, 1 - harvestData.currentDryDay * waterLossProgress)
    const targetWeight = harvestData.wetWeight * (0.22 + remainingWater * 0.78)
    harvestData.dryWeight = Number(Math.max(harvestData.wetWeight * 0.2, targetWeight).toFixed(1))
    harvestData.jarHumidity = simClamp(
        harvestData.jarHumidity - 2.2 * controlledDryingScore + (roomHumidity - 58) * 0.12,
        58,
        72,
    )
    harvestData.chlorophyllPercent = simClamp(
        harvestData.chlorophyllPercent - 8.5 * controlledDryingScore * profilePrecision,
        12,
        100,
    )
    harvestData.terpeneRetentionPercent = simClamp(
        harvestData.terpeneRetentionPercent -
            Math.max(0.4, (tempPenalty * 2.4 + humidityPenalty * 1.6) / profilePrecision),
        45,
        100,
    )
    harvestData.moldRiskPercent = simClamp(
        harvestData.moldRiskPercent +
            Math.max(0, roomHumidity - 62) * 0.9 +
            Math.max(0, roomTemp - 21) * 0.6 -
            ventilationFactor * 2.4,
        0,
        100,
    )
    harvestData.finalQuality = computePostHarvestQuality(harvestData, simulationSettings)

    if (
        harvestData.currentDryDay >= PLANT_STAGE_DETAILS[PlantStage.Drying].duration ||
        (harvestData.jarHumidity <= 62 && harvestData.currentDryDay >= 6)
    ) {
        p.stage = PlantStage.Curing
        harvestData.jarHumidity = simClamp(harvestData.jarHumidity + 1.6, 60, 64)
    }

    newJournalEntries.push({
        id: '',
        createdAt: 0,
        type: JournalEntryType.PostHarvest,
        notes: `Drying day ${harvestData.currentDryDay}: room ${roomTemp.toFixed(1)}°C / ${roomHumidity.toFixed(0)}% RH`,
    })
}

export function applyBurpPostHarvestStep(
    harvestData: HarvestData,
    profilePrecision: number,
    simulationSettings: SimulationSettings | undefined,
    newJournalEntries: JournalEntry[],
): void {
    harvestData.lastBurpDay = harvestData.currentCureDay
    harvestData.jarHumidity = simClamp(harvestData.jarHumidity - 2.6, 56, 68)
    harvestData.moldRiskPercent = simClamp(
        harvestData.moldRiskPercent - 6.5 * profilePrecision,
        0,
        100,
    )
    harvestData.terpeneRetentionPercent = simClamp(
        harvestData.terpeneRetentionPercent - 0.35,
        40,
        100,
    )
    harvestData.finalQuality = computePostHarvestQuality(harvestData, simulationSettings)
    newJournalEntries.push({
        id: '',
        createdAt: 0,
        type: JournalEntryType.PostHarvest,
        notes: `Burped jars on cure day ${harvestData.currentCureDay}`,
    })
}

export function applyCurePostHarvestStep(
    p: Plant,
    harvestData: HarvestData,
    profilePrecision: number,
    ventilationFactor: number,
    simulationSettings: SimulationSettings | undefined,
    newJournalEntries: JournalEntry[],
): void {
    const roomHumidity = p.environment.internalHumidity

    harvestData.currentCureDay += 1
    const burpDebt = Math.max(0, harvestData.currentCureDay - harvestData.lastBurpDay - 1)
    const humidityDrift = (roomHumidity - 60) * 0.08 + burpDebt * 0.45
    harvestData.jarHumidity = simClamp(
        harvestData.jarHumidity + humidityDrift - ventilationFactor * 0.35,
        56,
        70,
    )
    harvestData.chlorophyllPercent = simClamp(
        harvestData.chlorophyllPercent - 3.6 * profilePrecision,
        2,
        100,
    )
    harvestData.terpeneRetentionPercent = simClamp(
        harvestData.terpeneRetentionPercent -
            Math.max(0.2, Math.abs(harvestData.jarHumidity - 61) * 0.32 + burpDebt * 0.18),
        35,
        100,
    )
    harvestData.moldRiskPercent = simClamp(
        harvestData.moldRiskPercent +
            Math.max(0, harvestData.jarHumidity - 64) * 1.8 +
            burpDebt * 1.4 -
            ventilationFactor * 1.2,
        0,
        100,
    )
    harvestData.cannabinoidProfile.cbn = Number(
        simClamp(
            harvestData.cannabinoidProfile.cbn + harvestData.cannabinoidProfile.thc * 0.0022,
            0,
            6,
        ).toFixed(2),
    )
    harvestData.finalQuality = computePostHarvestQuality(harvestData, simulationSettings)

    if (harvestData.currentCureDay >= PLANT_STAGE_DETAILS[PlantStage.Curing].duration) {
        p.stage = PlantStage.Finished
    }

    newJournalEntries.push({
        id: '',
        createdAt: 0,
        type: JournalEntryType.PostHarvest,
        notes: `Curing day ${harvestData.currentCureDay}: jar ${harvestData.jarHumidity.toFixed(1)}% RH`,
    })
}

export function advancePostHarvestState(
    plant: Plant,
    action: 'dry' | 'burp' | 'cure',
    simulationSettings?: SimulationSettings | undefined,
): { updatedPlant: Plant; newJournalEntries: JournalEntry[] } {
    const p = plant
    const harvestData = p.harvestData
    const newJournalEntries: JournalEntry[] = []
    if (!harvestData) {
        return { updatedPlant: p, newJournalEntries }
    }

    if (!isPostHarvestActionAllowed(p.stage, action)) {
        return { updatedPlant: p, newJournalEntries }
    }

    const profilePrecision = getSimulationProfileCurve(simulationSettings).postHarvestPrecision
    const ventilationFactor = getVentilationFactor(p)

    if (action === 'dry') {
        applyDryPostHarvestStep(
            p,
            harvestData,
            profilePrecision,
            ventilationFactor,
            simulationSettings,
            newJournalEntries,
        )
    }

    if (action === 'burp') {
        applyBurpPostHarvestStep(
            harvestData,
            profilePrecision,
            simulationSettings,
            newJournalEntries,
        )
    }

    if (action === 'cure') {
        applyCurePostHarvestStep(
            p,
            harvestData,
            profilePrecision,
            ventilationFactor,
            simulationSettings,
            newJournalEntries,
        )
    }

    harvestData.finalQuality = computePostHarvestQuality(harvestData, simulationSettings)
    return { updatedPlant: p, newJournalEntries }
}
