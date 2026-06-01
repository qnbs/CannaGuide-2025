import { Plant, PlantStage } from '@/types'
import type {
    AirflowLevel,
    GrowthStage,
    MediumType,
    PlantState as VPDPlantState,
    SimulationPoint,
    VPDInput,
} from '@/types/simulation.types'
import { workerBus } from '@/services/workerBus'
import {
    calculateVPD as calculateVpdValue,
    getVPDStatus,
    runDailySimulation,
} from '@/utils/vpdCalculator'
import type { SimulationSettings } from '@/services/simulation/simulationProfiles'
import { SIM_MILLISECONDS_PER_DAY } from '@/services/simulation/simulationProfiles'

const stageToGrowthStage = (stage: PlantStage): GrowthStage => {
    if (
        stage === PlantStage.Seed ||
        stage === PlantStage.Germination ||
        stage === PlantStage.Seedling
    ) {
        return 'seedling'
    }
    if (stage === PlantStage.Vegetative) {
        return 'vegetative'
    }
    if (stage === PlantStage.Flowering) {
        return 'earlyFlower'
    }
    return 'lateFlower'
}

const mediumToVPDMedium = (medium: Plant['mediumType']): MediumType => {
    if (medium === 'Hydro') return 'hydro'
    if (medium === 'Coco') return 'coco'
    return 'soil'
}

const airflowToLevel = (power: Plant['equipment']['exhaustFan']['power']): AirflowLevel =>
    power

const VPD_WORKER_NAME = 'vpd'

class VPDSimulationService {
    private registered = false

    private ensureWorker(): boolean {
        if (typeof Worker === 'undefined') {
            return false
        }
        this.registered = true
        return true
    }

    dispose(): void {
        if (this.registered) {
            workerBus.unregister(VPD_WORKER_NAME)
            this.registered = false
        }
    }

    private createProfiles(input: VPDInput): { tempProfile: number[]; rhProfile: number[] } {
        const tempProfile: number[] = []
        const rhProfile: number[] = []

        for (let hour = 0; hour < 24; hour += 1) {
            const lightOn = hour >= 6 && hour < 18
            const tempDelta = lightOn ? 2.5 : -2.0
            const rhDelta = lightOn ? -5 : 5
            tempProfile.push(Number((input.airTemp + tempDelta).toFixed(2)))
            rhProfile.push(Math.max(25, Math.min(90, Number((input.rh + rhDelta).toFixed(2)))))
        }

        return { tempProfile, rhProfile }
    }

    createInputFromPlant(
        plant: Plant,
        simulationSettings?: SimulationSettings | undefined,
    ): VPDInput {
        const dynamicLeafOffset =
            plant.equipment.light.type === 'HPS'
                ? 3.5
                : plant.equipment.circulationFan.isOn
                  ? 2.2
                  : 2.9
        return {
            airTemp: plant.environment.internalTemperature,
            rh: plant.environment.internalHumidity,
            leafTempOffset: simulationSettings?.leafTemperatureOffset ?? dynamicLeafOffset,
            altitudeM: simulationSettings?.altitudeM ?? 0,
            medium: mediumToVPDMedium(plant.mediumType),
            airflow: airflowToLevel(plant.equipment.exhaustFan.power),
            lightOn: plant.equipment.light.isOn,
            phase: stageToGrowthStage(plant.stage),
        }
    }

    createProjectionStateFromPlant(plant: Plant): VPDPlantState {
        return {
            id: plant.id,
            ageDays: plant.age,
            growthStage: stageToGrowthStage(plant.stage),
            biomass: plant.biomass.total,
            health: plant.health,
            projectedYield: plant.harvestData?.dryWeight ?? 0,
            stressLevel: plant.stressLevel,
            vpdHistory: (plant.history ?? []).map((entry) => ({
                date: new Date(plant.createdAt + entry.day * SIM_MILLISECONDS_PER_DAY).toISOString(),
                vpd: Number(plant.environment.vpd.toFixed(3)),
                status: 'optimal' as const,
            })),
        }
    }

    runDailyVPD(
        input: VPDInput,
        tempProfile?: number[] | undefined,
        rhProfile?: number[] | undefined,
    ): Promise<SimulationPoint[]> {
        const profiles =
            tempProfile && rhProfile ? { tempProfile, rhProfile } : this.createProfiles(input)
        if (!this.ensureWorker()) {
            return Promise.resolve(
                runDailySimulation(
                    {
                        medium: input.medium,
                        airflow: input.airflow,
                        phase: input.phase,
                        leafTempOffset: input.leafTempOffset,
                    },
                    profiles.tempProfile,
                    profiles.rhProfile,
                ),
            )
        }

        return workerBus.dispatch<SimulationPoint[]>(
            VPD_WORKER_NAME,
            'RUN_DAILY',
            {
                baseInput: {
                    medium: input.medium,
                    airflow: input.airflow,
                    phase: input.phase,
                    leafTempOffset: input.leafTempOffset,
                },
                tempProfile: profiles.tempProfile,
                rhProfile: profiles.rhProfile,
            },
            { priority: 'critical' },
        )
    }

    runGrowthProjection(plant: VPDPlantState, env: VPDInput, days = 7): Promise<VPDPlantState> {
        if (!this.ensureWorker()) {
            let projectedPlant = { ...plant }
            const runDays = Math.max(1, days)

            for (let day = 0; day < runDays; day += 1) {
                const vpd = calculateVpdValue(env)
                const status = getVPDStatus(vpd, 1.2)
                let stressDelta = 2.2
                if (status === 'optimal') {
                    stressDelta = -1.2
                } else if (status === 'danger') {
                    stressDelta = 4.5
                }
                projectedPlant = {
                    ...projectedPlant,
                    ageDays: projectedPlant.ageDays + 1,
                    stressLevel: Math.max(
                        0,
                        Math.min(100, projectedPlant.stressLevel + stressDelta),
                    ),
                    health: Math.max(
                        0,
                        Math.min(100, projectedPlant.health - Math.max(0, stressDelta * 0.8)),
                    ),
                    biomass: Number((projectedPlant.biomass * (1 + 0.01)).toFixed(4)),
                    projectedYield: Number(
                        (projectedPlant.projectedYield + projectedPlant.biomass * 0.01).toFixed(3),
                    ),
                    vpdHistory: [
                        ...projectedPlant.vpdHistory,
                        {
                            date: new Date().toISOString(),
                            vpd,
                            status,
                        },
                    ],
                }
            }

            return Promise.resolve(projectedPlant)
        }

        return workerBus.dispatch<VPDPlantState>(
            VPD_WORKER_NAME,
            'RUN_GROWTH',
            {
                plant,
                env,
                days,
            },
            { priority: 'critical' },
        )
    }
}

export const vpdService = new VPDSimulationService()
