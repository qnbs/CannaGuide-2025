import {
    Plant,
    PlantStage,
    GrowSetup,
    Strain,
    JournalEntry,
    Task,
    ProblemType,
    JournalEntryType,
    GeneticModifiers,
    AppSettings,
    HarvestData,
} from '@/types'
import {
    STAGES_ORDER,
    SIM_PAR_PER_WATT_LED,
    SIM_LIGHT_EXTINCTION_COEFFICIENT_K,
    SIM_BIOMASS_CONVERSION_EFFICIENCY,
    SIM_SECONDS_PER_DAY,
} from '@/constants'
import type {
    AirflowLevel,
    GrowthStage,
    MediumType,
    PlantState as VPDPlantState,
    SimulationPoint,
    VPDInput,
    VPDWorkerResponse,
} from '@/types/simulation.types'
import {
    calculateVPD as calculateVpdValue,
    getVPDStatus,
    runDailySimulation,
} from '@/utils/vpdCalculator'
import { calculateVPD as calculateScientificVPD } from '@/lib/vpd/calculator'
import { secureRandom } from '@/utils/random'

const SIM_MILLISECONDS_PER_DAY = SIM_SECONDS_PER_DAY * 1000
type SimulationSettings = AppSettings['simulation']

const DEFAULT_GENETIC_MODIFIERS: GeneticModifiers = {
    pestResistance: 1,
    nutrientUptakeRate: 1,
    stressTolerance: 1,
    rue: 1.5,
    vpdTolerance: { min: 0.8, max: 1.4 },
    transpirationFactor: 1,
    stomataSensitivity: 1,
}

const SIMULATION_PROFILE_CURVES: Record<
    SimulationSettings['simulationProfile'],
    {
        environmentStress: number
        nutrientStress: number
        pestPressure: number
        environmentalDrift: number
        postHarvestPrecision: number
    }
> = {
    beginner: {
        environmentStress: 0.82,
        nutrientStress: 0.86,
        pestPressure: 0.78,
        environmentalDrift: 0.65,
        postHarvestPrecision: 0.82,
    },
    intermediate: {
        environmentStress: 1,
        nutrientStress: 1,
        pestPressure: 1,
        environmentalDrift: 1,
        postHarvestPrecision: 1,
    },
    expert: {
        environmentStress: 1.14,
        nutrientStress: 1.12,
        pestPressure: 1.2,
        environmentalDrift: 1.18,
        postHarvestPrecision: 1.12,
    },
}

export interface SimulationDiagnostics {
    profile: {
        name: SimulationSettings['simulationProfile']
        environmentStress: number
        nutrientStress: number
        pestPressure: number
        postHarvestPrecision: number
    }
    environment: {
        temperature: number
        humidity: number
        correctedRh: number
        vpd: number
        targetMin: number
        targetMax: number
        leafOffset: number
        altitudeM: number
    }
    growth: {
        lightAbsorption: number
        co2Factor: number
        nutrientAvailability: number
        nutrientConversionEfficiency: number
        lightExtinctionCoefficient: number
        stomataSensitivity: number
    }
    stress: {
        environmentalInstability: number
        nutrientSensitivityCurve: number
        pestPressureCurve: number
        accumulatedSubdayHours: number
    }
    dominantFactors: Array<{
        id: 'vpd' | 'lightCapture' | 'nutrientThroughput' | 'pestPressure'
        value: string
        tone: 'good' | 'warn' | 'critical'
        context: Record<string, string | number>
    }>
    postHarvest?: {
        stage: PlantStage
        jarHumidity: number
        chlorophyllPercent: number
        terpeneRetentionPercent: number
        moldRiskPercent: number
        finalQuality: number
        burpDebtDays: number
    }
}

// More detailed stage information for the mechanistic model
export const PLANT_STAGE_DETAILS: Record<
    PlantStage,
    {
        duration: number // days
        idealVitals: {
            ph: { min: number; max: number }
            ec: { min: number; max: number }
            vpd: { min: number; max: number } // in kPa
            temp: { min: number; max: number } // in °C
        }
        nutrientRatio: { n: number; p: number; k: number } // N-P-K uptake ratio
        biomassPartitioning: { roots: number; stem: number; leaves: number; flowers: number } // % distribution
    }
> = {
    [PlantStage.Seed]: {
        duration: 1,
        idealVitals: {
            ph: { min: 6.0, max: 7.0 },
            ec: { min: 0.2, max: 0.4 },
            vpd: { min: 0.4, max: 0.8 },
            temp: { min: 22, max: 26 },
        },
        nutrientRatio: { n: 1, p: 2, k: 1 },
        biomassPartitioning: { roots: 1.0, stem: 0, leaves: 0, flowers: 0 },
    },
    [PlantStage.Germination]: {
        duration: 3,
        idealVitals: {
            ph: { min: 6.0, max: 7.0 },
            ec: { min: 0.2, max: 0.4 },
            vpd: { min: 0.4, max: 0.8 },
            temp: { min: 22, max: 26 },
        },
        nutrientRatio: { n: 1, p: 2, k: 1 },
        biomassPartitioning: { roots: 0.8, stem: 0.1, leaves: 0.1, flowers: 0 },
    },
    [PlantStage.Seedling]: {
        duration: 14,
        idealVitals: {
            ph: { min: 5.8, max: 6.5 },
            ec: { min: 0.4, max: 0.8 },
            vpd: { min: 0.5, max: 0.9 },
            temp: { min: 22, max: 28 },
        },
        nutrientRatio: { n: 2, p: 1, k: 2 },
        biomassPartitioning: { roots: 0.5, stem: 0.25, leaves: 0.25, flowers: 0 },
    },
    [PlantStage.Vegetative]: {
        duration: 28,
        idealVitals: {
            ph: { min: 5.8, max: 6.5 },
            ec: { min: 0.8, max: 1.5 },
            vpd: { min: 0.8, max: 1.2 },
            temp: { min: 22, max: 28 },
        },
        nutrientRatio: { n: 3, p: 1, k: 2 },
        biomassPartitioning: { roots: 0.3, stem: 0.35, leaves: 0.35, flowers: 0 },
    },
    [PlantStage.Flowering]: {
        duration: 56,
        idealVitals: {
            ph: { min: 6.0, max: 6.8 },
            ec: { min: 1.2, max: 2.0 },
            vpd: { min: 1.2, max: 1.6 },
            temp: { min: 20, max: 26 },
        },
        nutrientRatio: { n: 1, p: 2, k: 3 },
        biomassPartitioning: { roots: 0.1, stem: 0.1, leaves: 0.2, flowers: 0.6 },
    },
    [PlantStage.Harvest]: {
        duration: 1,
        idealVitals: {
            ph: { min: 6.0, max: 7.0 },
            ec: { min: 0.0, max: 0.4 },
            vpd: { min: 0.8, max: 1.2 },
            temp: { min: 18, max: 22 },
        },
        nutrientRatio: { n: 0, p: 0, k: 0 },
        biomassPartitioning: { roots: 0.1, stem: 0.1, leaves: 0.2, flowers: 0.6 },
    },
    [PlantStage.Drying]: {
        duration: 10,
        idealVitals: {
            ph: { min: 0, max: 0 },
            ec: { min: 0, max: 0 },
            vpd: { min: 0, max: 0 },
            temp: { min: 0, max: 0 },
        },
        nutrientRatio: { n: 0, p: 0, k: 0 },
        biomassPartitioning: { roots: 0, stem: 0, leaves: 0, flowers: 1 },
    },
    [PlantStage.Curing]: {
        duration: 21,
        idealVitals: {
            ph: { min: 0, max: 0 },
            ec: { min: 0, max: 0 },
            vpd: { min: 0, max: 0 },
            temp: { min: 0, max: 0 },
        },
        nutrientRatio: { n: 0, p: 0, k: 0 },
        biomassPartitioning: { roots: 0, stem: 0, leaves: 0, flowers: 1 },
    },
    [PlantStage.Finished]: {
        duration: Infinity,
        idealVitals: {
            ph: { min: 0, max: 0 },
            ec: { min: 0, max: 0 },
            vpd: { min: 0, max: 0 },
            temp: { min: 0, max: 0 },
        },
        nutrientRatio: { n: 0, p: 0, k: 0 },
        biomassPartitioning: { roots: 0, stem: 0, leaves: 0, flowers: 1 },
    },
}

class PlantSimulationService {
    private _clamp(value: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, value))
    }

    private _isFiniteNumber(value: unknown): value is number {
        return typeof value === 'number' && Number.isFinite(value)
    }

    private _finiteOr(value: unknown, fallback: number): number {
        return this._isFiniteNumber(value) ? value : fallback
    }

    private _finiteOrMin(value: unknown, fallback: number, min: number): number {
        return Math.max(min, this._finiteOr(value, fallback))
    }

    private _finiteOrClamped(value: unknown, fallback: number, min: number, max: number): number {
        return this._clamp(this._finiteOr(value, fallback), min, max)
    }

    private _normalizeModifiers(modifiers?: Partial<GeneticModifiers> | null): GeneticModifiers {
        const merged = {
            ...DEFAULT_GENETIC_MODIFIERS,
            ...(modifiers ?? {}),
            vpdTolerance: {
                ...DEFAULT_GENETIC_MODIFIERS.vpdTolerance,
                ...(modifiers?.vpdTolerance ?? {}),
            },
        }

        return {
            pestResistance: this._clamp(
                Number.isFinite(merged.pestResistance)
                    ? merged.pestResistance
                    : DEFAULT_GENETIC_MODIFIERS.pestResistance,
                0.2,
                3,
            ),
            nutrientUptakeRate: this._clamp(
                Number.isFinite(merged.nutrientUptakeRate)
                    ? merged.nutrientUptakeRate
                    : DEFAULT_GENETIC_MODIFIERS.nutrientUptakeRate,
                0.2,
                3,
            ),
            stressTolerance: this._clamp(
                Number.isFinite(merged.stressTolerance)
                    ? merged.stressTolerance
                    : DEFAULT_GENETIC_MODIFIERS.stressTolerance,
                0.2,
                3,
            ),
            rue: this._clamp(
                Number.isFinite(merged.rue) ? merged.rue : DEFAULT_GENETIC_MODIFIERS.rue,
                0.5,
                3,
            ),
            vpdTolerance: {
                min: this._clamp(
                    Number.isFinite(merged.vpdTolerance.min)
                        ? merged.vpdTolerance.min
                        : DEFAULT_GENETIC_MODIFIERS.vpdTolerance.min,
                    0.2,
                    2,
                ),
                max: this._clamp(
                    Number.isFinite(merged.vpdTolerance.max)
                        ? merged.vpdTolerance.max
                        : DEFAULT_GENETIC_MODIFIERS.vpdTolerance.max,
                    0.4,
                    2.5,
                ),
            },
            transpirationFactor: this._clamp(
                Number.isFinite(merged.transpirationFactor)
                    ? merged.transpirationFactor
                    : DEFAULT_GENETIC_MODIFIERS.transpirationFactor,
                0.2,
                3,
            ),
            stomataSensitivity: this._clamp(
                Number.isFinite(merged.stomataSensitivity)
                    ? merged.stomataSensitivity
                    : DEFAULT_GENETIC_MODIFIERS.stomataSensitivity,
                0.2,
                3,
            ),
        }
    }

    private _getSimulationAltitude(simulationSettings?: SimulationSettings): number {
        return this._clamp(simulationSettings?.altitudeM ?? 0, 0, 5000)
    }

    private _getProfileCurve(simulationSettings?: SimulationSettings) {
        return SIMULATION_PROFILE_CURVES[simulationSettings?.simulationProfile ?? 'intermediate']
    }

    private _getEnvironmentalInstabilityCurve(simulationSettings?: SimulationSettings): number {
        if (!simulationSettings) {
            return 0.18
        }

        const normalizedStability = this._clamp(
            (simulationSettings.environmentalStability - 0.5) / 0.5,
            0,
            1,
        )
        return Math.pow(1 - normalizedStability, 1.35)
    }

    private _getPestPressureCurve(simulationSettings?: SimulationSettings): number {
        if (!simulationSettings) {
            return 1
        }

        return 0.45 + Math.pow(this._clamp(simulationSettings.pestPressure, 0, 1), 1.6) * 3.2
    }

    private _getNutrientSensitivityCurve(simulationSettings?: SimulationSettings): number {
        if (!simulationSettings) {
            return 1
        }

        const sensitivity = this._clamp(simulationSettings.nutrientSensitivity, 0.5, 2)
        if (sensitivity >= 1) {
            return 1 + Math.pow(sensitivity - 1, 1.35) * 2.4
        }

        return 1 - Math.pow(1 - sensitivity, 1.1) * 0.45
    }

    private _getPlantSignal(plant: Plant): number {
        return plant.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) / 17
    }

    private _getSimulationLeafTemperatureOffset(
        plant: Plant,
        simulationSettings?: SimulationSettings,
    ): number {
        if (simulationSettings && Number.isFinite(simulationSettings.leafTemperatureOffset)) {
            return this._clamp(simulationSettings.leafTemperatureOffset, -5, 5)
        }

        const baseOffset = plant.equipment.light.type === 'HPS' ? 3.5 : 2.5
        const circulationAdjustment = plant.equipment.circulationFan.isOn ? -0.3 : 0.4
        return this._clamp(baseOffset + circulationAdjustment, 2, 4)
    }

    private _getSimulationLightExtinctionCoefficient(
        simulationSettings?: SimulationSettings,
    ): number {
        return this._clamp(
            simulationSettings?.lightExtinctionCoefficient ?? SIM_LIGHT_EXTINCTION_COEFFICIENT_K,
            0.2,
            1.5,
        )
    }

    private _getSimulationNutrientConversionEfficiency(
        simulationSettings?: SimulationSettings,
    ): number {
        return this._clamp(
            simulationSettings?.nutrientConversionEfficiency ?? SIM_BIOMASS_CONVERSION_EFFICIENCY,
            0.05,
            0.95,
        )
    }

    private _getSimulationStomataSensitivity(
        plant: Plant,
        simulationSettings?: SimulationSettings,
    ): number {
        const modifiers = this._getModifiers(plant)
        return this._clamp(
            (simulationSettings?.stomataSensitivity ?? 1) * modifiers.stomataSensitivity,
            0.2,
            3,
        )
    }

    private _getEnvironmentalStressMultiplier(simulationSettings?: SimulationSettings): number {
        return this._clamp(
            (0.72 + this._getEnvironmentalInstabilityCurve(simulationSettings) * 0.95) *
                this._getProfileCurve(simulationSettings).environmentStress,
            0.55,
            1.85,
        )
    }

    private _getNutrientStressMultiplier(simulationSettings?: SimulationSettings): number {
        return this._clamp(
            this._getNutrientSensitivityCurve(simulationSettings) *
                this._getProfileCurve(simulationSettings).nutrientStress,
            0.55,
            2.4,
        )
    }

    private _getPestPressureMultiplier(simulationSettings?: SimulationSettings): number {
        return this._clamp(
            this._getPestPressureCurve(simulationSettings) *
                this._getProfileCurve(simulationSettings).pestPressure,
            0.4,
            5.5,
        )
    }

    private _normalizeEnvironment(plant: Plant): Plant['environment'] {
        return {
            internalTemperature: this._finiteOr(plant.environment?.internalTemperature, 24),
            internalHumidity: this._finiteOrClamped(
                plant.environment?.internalHumidity,
                65,
                0,
                100,
            ),
            vpd: this._finiteOr(plant.environment?.vpd, 0),
            co2Level: this._finiteOrClamped(plant.environment?.co2Level, 400, 200, 1500),
        }
    }

    private _normalizeMedium(plant: Plant, waterCapacity: number): Plant['medium'] {
        return {
            ph: this._finiteOr(plant.medium?.ph, 6.5),
            ec: this._finiteOrMin(plant.medium?.ec, 0.8, 0),
            moisture: this._finiteOrClamped(plant.medium?.moisture, 100, 0, 100),
            microbeHealth: this._finiteOrClamped(plant.medium?.microbeHealth, 80, 0, 100),
            substrateWater: this._finiteOrMin(plant.medium?.substrateWater, waterCapacity, 0),
            nutrientConcentration: {
                nitrogen: this._finiteOrMin(plant.medium?.nutrientConcentration?.nitrogen, 100, 0),
                phosphorus: this._finiteOrMin(
                    plant.medium?.nutrientConcentration?.phosphorus,
                    100,
                    0,
                ),
                potassium: this._finiteOrMin(
                    plant.medium?.nutrientConcentration?.potassium,
                    100,
                    0,
                ),
            },
        }
    }

    private _normalizeNutrientPool(plant: Plant): Plant['nutrientPool'] {
        return {
            nitrogen: this._finiteOrMin(plant.nutrientPool?.nitrogen, 5, 0),
            phosphorus: this._finiteOrMin(plant.nutrientPool?.phosphorus, 5, 0),
            potassium: this._finiteOrMin(plant.nutrientPool?.potassium, 5, 0),
        }
    }

    private _normalizeRootSystem(plant: Plant): Plant['rootSystem'] {
        return {
            health: this._finiteOrClamped(plant.rootSystem?.health, 100, 0, 100),
            rootMass: this._finiteOrMin(plant.rootSystem?.rootMass, 0.01, 0.01),
        }
    }

    private _normalizeEquipment(plant: Plant): Plant['equipment'] {
        return {
            light: {
                type: plant.equipment?.light?.type ?? 'LED',
                wattage: Math.max(
                    10,
                    Number.isFinite(plant.equipment?.light?.wattage)
                        ? plant.equipment.light.wattage
                        : 300,
                ),
                isOn: Boolean(plant.equipment?.light?.isOn ?? true),
                lightHours: this._clamp(
                    Number.isFinite(plant.equipment?.light?.lightHours)
                        ? plant.equipment.light.lightHours
                        : 18,
                    0,
                    24,
                ),
            },
            exhaustFan: {
                power: plant.equipment?.exhaustFan?.power ?? 'medium',
                isOn: Boolean(plant.equipment?.exhaustFan?.isOn ?? true),
            },
            circulationFan: {
                isOn: Boolean(plant.equipment?.circulationFan?.isOn ?? true),
            },
            potSize: Math.max(
                1,
                Number.isFinite(plant.equipment?.potSize) ? plant.equipment.potSize : 11,
            ),
            potType: plant.equipment?.potType ?? 'Fabric',
        }
    }

    private _normalizeStructuralModel(plant: Plant): Plant['structuralModel'] {
        return {
            branches: Math.max(
                1,
                Number.isFinite(plant.structuralModel?.branches)
                    ? plant.structuralModel.branches
                    : 1,
            ),
            nodes: Math.max(
                1,
                Number.isFinite(plant.structuralModel?.nodes) ? plant.structuralModel.nodes : 1,
            ),
        }
    }

    private _normalizeCannabinoidProfile(plant: Plant): Plant['cannabinoidProfile'] {
        return {
            thc: Math.max(
                0,
                Number.isFinite(plant.cannabinoidProfile?.thc) ? plant.cannabinoidProfile.thc : 0,
            ),
            cbd: Math.max(
                0,
                Number.isFinite(plant.cannabinoidProfile?.cbd) ? plant.cannabinoidProfile.cbd : 0,
            ),
            cbn: Math.max(
                0,
                Number.isFinite(plant.cannabinoidProfile?.cbn) ? plant.cannabinoidProfile.cbn : 0,
            ),
        }
    }

    private _normalizeStressCounters(plant: Plant): Plant['stressCounters'] {
        return {
            vpd: Math.max(
                0,
                Number.isFinite(plant.stressCounters?.vpd) ? plant.stressCounters.vpd : 0,
            ),
            ph: Math.max(
                0,
                Number.isFinite(plant.stressCounters?.ph) ? plant.stressCounters.ph : 0,
            ),
            ec: Math.max(
                0,
                Number.isFinite(plant.stressCounters?.ec) ? plant.stressCounters.ec : 0,
            ),
            moisture: Math.max(
                0,
                Number.isFinite(plant.stressCounters?.moisture) ? plant.stressCounters.moisture : 0,
            ),
        }
    }

    private _normalizeSimulationClock(plant: Plant): Plant['simulationClock'] {
        return {
            accumulatedDayMs: Math.max(
                0,
                Number.isFinite(plant.simulationClock?.accumulatedDayMs)
                    ? plant.simulationClock.accumulatedDayMs
                    : 0,
            ),
        }
    }

    private _normalizePlant(plant: Plant): Plant {
        const waterCapacity = Math.max(
            1,
            (plant.equipment?.potSize ?? 11) *
                1000 *
                ((plant.equipment?.potType ?? 'Fabric') === 'Fabric' ? 0.28 : 0.35),
        )
        const strainModifiers = this._normalizeModifiers(plant.strain?.geneticModifiers)
        const phenotypeModifiers = this._normalizeModifiers(
            plant.phenotypeModifiers ?? strainModifiers,
        )

        return {
            ...plant,
            mediumType: plant.mediumType ?? 'Soil',
            createdAt: Number.isFinite(plant.createdAt) ? plant.createdAt : Date.now(),
            lastUpdated: Number.isFinite(plant.lastUpdated) ? plant.lastUpdated : Date.now(),
            age: Number.isFinite(plant.age) ? plant.age : 0,
            health: this._clamp(Number.isFinite(plant.health) ? plant.health : 100, 0, 100),
            stressLevel: this._clamp(
                Number.isFinite(plant.stressLevel) ? plant.stressLevel : 0,
                0,
                100,
            ),
            height: Number.isFinite(plant.height) ? plant.height : 0,
            biomass: {
                total: Number.isFinite(plant.biomass?.total) ? plant.biomass.total : 0.01,
                stem: Number.isFinite(plant.biomass?.stem) ? plant.biomass.stem : 0.01,
                leaves: Number.isFinite(plant.biomass?.leaves) ? plant.biomass.leaves : 0,
                flowers: Number.isFinite(plant.biomass?.flowers) ? plant.biomass.flowers : 0,
            },
            leafAreaIndex: Number.isFinite(plant.leafAreaIndex) ? plant.leafAreaIndex : 0.01,
            environment: this._normalizeEnvironment(plant),
            medium: this._normalizeMedium(plant, waterCapacity),
            nutrientPool: this._normalizeNutrientPool(plant),
            rootSystem: this._normalizeRootSystem(plant),
            equipment: this._normalizeEquipment(plant),
            problems: Array.isArray(plant.problems) ? plant.problems : [],
            journal: Array.isArray(plant.journal) ? plant.journal : [],
            tasks: Array.isArray(plant.tasks) ? plant.tasks : [],
            harvestData: plant.harvestData ?? null,
            structuralModel: this._normalizeStructuralModel(plant),
            phenotypeModifiers,
            strain: {
                ...plant.strain,
                geneticModifiers: strainModifiers,
            },
            history: Array.isArray(plant.history) ? plant.history : [],
            cannabinoidProfile: this._normalizeCannabinoidProfile(plant),
            terpeneProfile:
                plant.terpeneProfile && typeof plant.terpeneProfile === 'object'
                    ? plant.terpeneProfile
                    : {},
            stressCounters: this._normalizeStressCounters(plant),
            simulationClock: this._normalizeSimulationClock(plant),
        }
    }

    /** Returns per-plant phenotype modifiers, falling back to strain defaults for legacy/uninitialized plants. */
    private _getModifiers(plant: Plant): GeneticModifiers {
        return this._normalizeModifiers(plant.phenotypeModifiers ?? plant.strain.geneticModifiers)
    }

    private _getSubstrateRhCorrection(plant: Plant): number {
        const byMediumType: Record<Plant['mediumType'], number> = {
            Soil: 0,
            Coco: -2,
            Hydro: 2,
        }

        const potAdjustment = plant.equipment.potType === 'Fabric' ? -1 : 0
        return byMediumType[plant.mediumType ?? 'Soil'] + potAdjustment
    }

    private _getCorrectedRh(plant: Plant): number {
        return this._clamp(
            plant.environment.internalHumidity + this._getSubstrateRhCorrection(plant),
            25,
            95,
        )
    }

    private _applyDailyEnvironmentalDrift(
        plant: Plant,
        simulationSettings?: SimulationSettings,
    ): Plant {
        const p = this.clonePlant(plant)
        const instability = this._getEnvironmentalInstabilityCurve(simulationSettings)
        if (instability <= 0.01) {
            return p
        }

        const profileCurve = this._getProfileCurve(simulationSettings)
        const signal = this._getPlantSignal(p)
        const driftAmplitude = instability * profileCurve.environmentalDrift
        const tempDrift = Math.sin(signal + p.age * 0.73) * 2.4 * driftAmplitude
        const humidityDrift = Math.cos(signal * 1.3 + p.age * 0.57) * 6.5 * driftAmplitude

        p.environment.internalTemperature = this._clamp(
            p.environment.internalTemperature + tempDrift,
            14,
            36,
        )
        p.environment.internalHumidity = this._clamp(
            p.environment.internalHumidity + humidityDrift,
            25,
            90,
        )
        return p
    }

    private _createInitialHarvestData(plant: Plant): HarvestData {
        const wetWeight = Math.max(12, Number((plant.biomass.flowers * 5.5).toFixed(1)))
        const targetDryRatio = this._clamp(0.2 + (plant.health / 100) * 0.05, 0.18, 0.28)
        const dryWeight = Number((wetWeight * targetDryRatio).toFixed(1))
        const thc = this._clamp(
            plant.strain.thc * 0.78 + plant.health * 0.04 - plant.stressLevel * 0.02,
            4,
            plant.strain.thc * 1.05,
        )
        const cbn = this._clamp(thc * 0.015, 0.05, 0.8)
        return {
            wetWeight,
            dryWeight,
            currentDryDay: 0,
            currentCureDay: 0,
            lastBurpDay: 0,
            jarHumidity: 68,
            chlorophyllPercent: 100,
            terpeneRetentionPercent: 100,
            moldRiskPercent: this._clamp((plant.environment.internalHumidity - 50) * 1.2, 4, 25),
            finalQuality: 72,
            cannabinoidProfile: {
                thc: Number(thc.toFixed(2)),
                cbn: Number(cbn.toFixed(2)),
            },
            terpeneProfile: { ...plant.terpeneProfile },
        }
    }

    private _computePostHarvestQuality(
        harvestData: HarvestData,
        simulationSettings?: SimulationSettings,
    ): number {
        const profilePrecision = this._getProfileCurve(simulationSettings).postHarvestPrecision
        const humiditySweetSpot =
            Math.max(0, 12 - Math.abs(harvestData.jarHumidity - 61) * 3.5) * 2.1
        const chlorophyllScore = Math.max(0, 100 - harvestData.chlorophyllPercent)
        const terpeneScore = harvestData.terpeneRetentionPercent
        const moldPenalty = harvestData.moldRiskPercent * 1.2
        const cannabinoidScore =
            harvestData.cannabinoidProfile.thc * 1.4 + harvestData.cannabinoidProfile.cbn * 2.5
        return this._clamp(
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

    ensurePostHarvestData(plant: Plant): Plant {
        const p = this._normalizePlant(this.clonePlant(plant))
        if (
            ![
                PlantStage.Harvest,
                PlantStage.Drying,
                PlantStage.Curing,
                PlantStage.Finished,
            ].includes(p.stage)
        ) {
            return p
        }
        if (!p.harvestData) {
            p.harvestData = this._createInitialHarvestData(p)
        }
        return p
    }

    private _isPostHarvestActionAllowed(
        stage: PlantStage,
        action: 'dry' | 'burp' | 'cure',
    ): boolean {
        return (
            (action === 'dry' && (stage === PlantStage.Harvest || stage === PlantStage.Drying)) ||
            ((action === 'burp' || action === 'cure') && stage === PlantStage.Curing)
        )
    }

    private _getVentilationFactor(plant: Plant): number {
        return plant.equipment.exhaustFan.power === 'high'
            ? 1.15
            : plant.equipment.exhaustFan.power === 'low'
              ? 0.9
              : 1
    }

    private _applyDryPostHarvestStep(
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
        const controlledDryingScore = this._clamp(
            1.15 - humidityPenalty - tempPenalty + (ventilationFactor - 1) * 0.35,
            0.45,
            1.18,
        )
        const waterLossProgress = this._clamp(
            0.08 + (62 - roomHumidity) * 0.002 + (roomTemp - 18) * 0.003,
            0.04,
            0.15,
        )
        const remainingWater = Math.max(0, 1 - harvestData.currentDryDay * waterLossProgress)
        const targetWeight = harvestData.wetWeight * (0.22 + remainingWater * 0.78)
        harvestData.dryWeight = Number(
            Math.max(harvestData.wetWeight * 0.2, targetWeight).toFixed(1),
        )
        harvestData.jarHumidity = this._clamp(
            harvestData.jarHumidity - 2.2 * controlledDryingScore + (roomHumidity - 58) * 0.12,
            58,
            72,
        )
        harvestData.chlorophyllPercent = this._clamp(
            harvestData.chlorophyllPercent - 8.5 * controlledDryingScore * profilePrecision,
            12,
            100,
        )
        harvestData.terpeneRetentionPercent = this._clamp(
            harvestData.terpeneRetentionPercent -
                Math.max(0.4, (tempPenalty * 2.4 + humidityPenalty * 1.6) / profilePrecision),
            45,
            100,
        )
        harvestData.moldRiskPercent = this._clamp(
            harvestData.moldRiskPercent +
                Math.max(0, roomHumidity - 62) * 0.9 +
                Math.max(0, roomTemp - 21) * 0.6 -
                ventilationFactor * 2.4,
            0,
            100,
        )
        harvestData.finalQuality = this._computePostHarvestQuality(harvestData, simulationSettings)

        if (
            harvestData.currentDryDay >= PLANT_STAGE_DETAILS[PlantStage.Drying].duration ||
            (harvestData.jarHumidity <= 62 && harvestData.currentDryDay >= 6)
        ) {
            p.stage = PlantStage.Curing
            harvestData.jarHumidity = this._clamp(harvestData.jarHumidity + 1.6, 60, 64)
        }

        newJournalEntries.push({
            id: '',
            createdAt: 0,
            type: JournalEntryType.PostHarvest,
            notes: `Drying day ${harvestData.currentDryDay}: room ${roomTemp.toFixed(1)}°C / ${roomHumidity.toFixed(0)}% RH`,
        })
    }

    private _applyBurpPostHarvestStep(
        harvestData: HarvestData,
        profilePrecision: number,
        simulationSettings: SimulationSettings | undefined,
        newJournalEntries: JournalEntry[],
    ): void {
        harvestData.lastBurpDay = harvestData.currentCureDay
        harvestData.jarHumidity = this._clamp(harvestData.jarHumidity - 2.6, 56, 68)
        harvestData.moldRiskPercent = this._clamp(
            harvestData.moldRiskPercent - 6.5 * profilePrecision,
            0,
            100,
        )
        harvestData.terpeneRetentionPercent = this._clamp(
            harvestData.terpeneRetentionPercent - 0.35,
            40,
            100,
        )
        harvestData.finalQuality = this._computePostHarvestQuality(harvestData, simulationSettings)
        newJournalEntries.push({
            id: '',
            createdAt: 0,
            type: JournalEntryType.PostHarvest,
            notes: `Burped jars on cure day ${harvestData.currentCureDay}`,
        })
    }

    private _applyCurePostHarvestStep(
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
        harvestData.jarHumidity = this._clamp(
            harvestData.jarHumidity + humidityDrift - ventilationFactor * 0.35,
            56,
            70,
        )
        harvestData.chlorophyllPercent = this._clamp(
            harvestData.chlorophyllPercent - 3.6 * profilePrecision,
            2,
            100,
        )
        harvestData.terpeneRetentionPercent = this._clamp(
            harvestData.terpeneRetentionPercent -
                Math.max(0.2, Math.abs(harvestData.jarHumidity - 61) * 0.32 + burpDebt * 0.18),
            35,
            100,
        )
        harvestData.moldRiskPercent = this._clamp(
            harvestData.moldRiskPercent +
                Math.max(0, harvestData.jarHumidity - 64) * 1.8 +
                burpDebt * 1.4 -
                ventilationFactor * 1.2,
            0,
            100,
        )
        harvestData.cannabinoidProfile.cbn = Number(
            this._clamp(
                harvestData.cannabinoidProfile.cbn + harvestData.cannabinoidProfile.thc * 0.0022,
                0,
                6,
            ).toFixed(2),
        )
        harvestData.finalQuality = this._computePostHarvestQuality(harvestData, simulationSettings)

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

    advancePostHarvestState(
        plant: Plant,
        action: 'dry' | 'burp' | 'cure',
        simulationSettings?: SimulationSettings,
    ): { updatedPlant: Plant; newJournalEntries: JournalEntry[] } {
        let p = this.ensurePostHarvestData(plant)
        const harvestData = p.harvestData
        const newJournalEntries: JournalEntry[] = []
        if (!harvestData) {
            return { updatedPlant: p, newJournalEntries }
        }

        if (!this._isPostHarvestActionAllowed(p.stage, action)) {
            return { updatedPlant: p, newJournalEntries }
        }

        const profilePrecision = this._getProfileCurve(simulationSettings).postHarvestPrecision
        const ventilationFactor = this._getVentilationFactor(p)

        if (action === 'dry') {
            this._applyDryPostHarvestStep(
                p,
                harvestData,
                profilePrecision,
                ventilationFactor,
                simulationSettings,
                newJournalEntries,
            )
        }

        if (action === 'burp') {
            this._applyBurpPostHarvestStep(
                harvestData,
                profilePrecision,
                simulationSettings,
                newJournalEntries,
            )
        }

        if (action === 'cure') {
            this._applyCurePostHarvestStep(
                p,
                harvestData,
                profilePrecision,
                ventilationFactor,
                simulationSettings,
                newJournalEntries,
            )
        }

        harvestData.finalQuality = this._computePostHarvestQuality(harvestData, simulationSettings)
        return { updatedPlant: p, newJournalEntries }
    }

    getSimulationDiagnostics(
        plant: Plant,
        simulationSettings?: SimulationSettings,
    ): SimulationDiagnostics {
        const p = this.applyEnvironmentalCorrections(
            this.ensurePostHarvestData(plant),
            simulationSettings,
        )
        const ideal = PLANT_STAGE_DETAILS[p.stage].idealVitals
        const correctedRh = this._getCorrectedRh(p)
        const leafOffset = this._getSimulationLeafTemperatureOffset(p, simulationSettings)
        const altitudeM = this._getSimulationAltitude(simulationSettings)
        const lightAbsorption =
            1 -
            Math.exp(
                -this._getSimulationLightExtinctionCoefficient(simulationSettings) *
                    p.leafAreaIndex,
            )
        const nutrientAvailability =
            (p.nutrientPool.nitrogen + p.nutrientPool.phosphorus + p.nutrientPool.potassium) *
            this._getSimulationNutrientConversionEfficiency(simulationSettings)
        const co2Factor = this._clamp(p.environment.co2Level / 400, 0.5, 2)
        const profileCurve = this._getProfileCurve(simulationSettings)
        const dominantFactors: SimulationDiagnostics['dominantFactors'] = [
            {
                id: 'vpd',
                value: `${p.environment.vpd.toFixed(2)} kPa`,
                tone:
                    p.environment.vpd < ideal.vpd.min || p.environment.vpd > ideal.vpd.max
                        ? 'critical'
                        : 'good',
                context: {
                    min: ideal.vpd.min.toFixed(1),
                    max: ideal.vpd.max.toFixed(1),
                },
            },
            {
                id: 'lightCapture',
                value: `${(lightAbsorption * 100).toFixed(0)}%`,
                tone: lightAbsorption < 0.55 ? 'warn' : 'good',
                context: {
                    k: this._getSimulationLightExtinctionCoefficient(simulationSettings).toFixed(2),
                    lai: p.leafAreaIndex.toFixed(2),
                },
            },
            {
                id: 'nutrientThroughput',
                value: nutrientAvailability.toFixed(2),
                tone: nutrientAvailability < 5 ? 'warn' : 'good',
                context: {
                    sensitivity: this._getNutrientSensitivityCurve(simulationSettings).toFixed(2),
                },
            },
            {
                id: 'pestPressure',
                value: `${this._getPestPressureMultiplier(simulationSettings).toFixed(2)}x`,
                tone:
                    this._getPestPressureMultiplier(simulationSettings) > 1.8 ? 'critical' : 'warn',
                context: {
                    profile: profileCurve.pestPressure.toFixed(2),
                },
            },
        ]

        return {
            profile: {
                name: simulationSettings?.simulationProfile ?? 'intermediate',
                environmentStress: profileCurve.environmentStress,
                nutrientStress: profileCurve.nutrientStress,
                pestPressure: profileCurve.pestPressure,
                postHarvestPrecision: profileCurve.postHarvestPrecision,
            },
            environment: {
                temperature: p.environment.internalTemperature,
                humidity: p.environment.internalHumidity,
                correctedRh,
                vpd: p.environment.vpd,
                targetMin: ideal.vpd.min,
                targetMax: ideal.vpd.max,
                leafOffset,
                altitudeM,
            },
            growth: {
                lightAbsorption,
                co2Factor,
                nutrientAvailability,
                nutrientConversionEfficiency:
                    this._getSimulationNutrientConversionEfficiency(simulationSettings),
                lightExtinctionCoefficient:
                    this._getSimulationLightExtinctionCoefficient(simulationSettings),
                stomataSensitivity: this._getSimulationStomataSensitivity(p, simulationSettings),
            },
            stress: {
                environmentalInstability:
                    this._getEnvironmentalInstabilityCurve(simulationSettings),
                nutrientSensitivityCurve: this._getNutrientSensitivityCurve(simulationSettings),
                pestPressureCurve: this._getPestPressureCurve(simulationSettings),
                accumulatedSubdayHours: p.simulationClock.accumulatedDayMs / 3600000,
            },
            dominantFactors,
            postHarvest: p.harvestData
                ? {
                      stage: p.stage,
                      jarHumidity: p.harvestData.jarHumidity,
                      chlorophyllPercent: p.harvestData.chlorophyllPercent,
                      terpeneRetentionPercent: p.harvestData.terpeneRetentionPercent,
                      moldRiskPercent: p.harvestData.moldRiskPercent,
                      finalQuality: p.harvestData.finalQuality,
                      burpDebtDays: Math.max(
                          0,
                          p.harvestData.currentCureDay - p.harvestData.lastBurpDay - 1,
                      ),
                  }
                : undefined,
        }
    }

    applyEnvironmentalCorrections(plant: Plant, simulationSettings?: SimulationSettings): Plant {
        const p = this._normalizePlant(this.clonePlant(plant))
        const correctedRh = this._getCorrectedRh(p)
        const leafOffset = this._getSimulationLeafTemperatureOffset(p, simulationSettings)
        p.environment.vpd = this._calculateVPD(
            p.environment.internalTemperature,
            correctedRh,
            leafOffset,
            this._getSimulationAltitude(simulationSettings),
        )
        return p
    }

    createPlant(strain: Strain, setup: GrowSetup, name: string): Plant {
        const now = Date.now()
        const waterHoldingCapacity =
            setup.potSize * 1000 * (setup.potType === 'Fabric' ? 0.28 : 0.35)
        const newPlant: Plant = {
            id: `plant-${now}`,
            name,
            strain,
            mediumType: setup.medium,
            createdAt: now,
            lastUpdated: now,
            age: 0,
            stage: PlantStage.Seed,
            health: 100,
            stressLevel: 0,
            height: 0,
            biomass: { total: 0.01, stem: 0.01, leaves: 0, flowers: 0 },
            leafAreaIndex: 0.01,
            isTopped: false,
            lstApplied: 0,
            environment: {
                internalTemperature: 24,
                internalHumidity: 65,
                vpd: 0,
                co2Level: 400,
            },
            medium: {
                ph: 6.5,
                ec: 0.8,
                moisture: 100,
                microbeHealth: 80,
                substrateWater: waterHoldingCapacity,
                nutrientConcentration: { nitrogen: 100, phosphorus: 100, potassium: 100 },
            },
            nutrientPool: { nitrogen: 5, phosphorus: 5, potassium: 5 },
            rootSystem: { health: 100, rootMass: 0.01 },
            equipment: {
                light: {
                    type: setup.lightType,
                    wattage: setup.lightWattage,
                    isOn: true,
                    lightHours: setup.lightHours,
                },
                exhaustFan: {
                    power: setup.ventilation,
                    isOn: true,
                },
                circulationFan: {
                    isOn: setup.hasCirculationFan,
                },
                potSize: setup.potSize,
                potType: setup.potType,
            },
            problems: [],
            journal: [],
            tasks: [],
            harvestData: null,
            structuralModel: { branches: 1, nodes: 1 },
            // Copy strain defaults as starting phenotype; can be tuned per-plant via training or amendments
            phenotypeModifiers: { ...strain.geneticModifiers },
            history: [
                {
                    day: 0,
                    health: 100,
                    height: 0,
                    stressLevel: 0,
                    medium: { ph: 6.5, ec: 0.8, moisture: 100 },
                },
            ],
            cannabinoidProfile: { thc: 0, cbd: 0, cbn: 0 },
            terpeneProfile: {},
            stressCounters: { vpd: 0, ph: 0, ec: 0, moisture: 0 },
            simulationClock: { accumulatedDayMs: 0 },
        }

        return this.applyEnvironmentalCorrections(newPlant)
    }

    calculateStateForTimeDelta(
        plant: Plant,
        deltaTime: number,
        simulationSettings?: SimulationSettings,
    ): { updatedPlant: Plant; newJournalEntries: JournalEntry[]; newTasks: Task[] } {
        let updatedPlant = this._normalizePlant(this.clonePlant(plant))
        const newJournalEntries: JournalEntry[] = []
        const newTasks: Task[] = []
        const safeDeltaTime = Math.max(0, Number.isFinite(deltaTime) ? deltaTime : 0)
        const nextTimestamp = updatedPlant.lastUpdated + safeDeltaTime
        const totalMillisToSimulate = updatedPlant.simulationClock.accumulatedDayMs + safeDeltaTime
        const daysToSimulate = Math.floor(totalMillisToSimulate / SIM_MILLISECONDS_PER_DAY)

        updatedPlant.simulationClock.accumulatedDayMs =
            totalMillisToSimulate % SIM_MILLISECONDS_PER_DAY

        if (daysToSimulate < 1) {
            updatedPlant.lastUpdated = nextTimestamp
            return { updatedPlant, newJournalEntries, newTasks }
        }

        for (let i = 0; i < daysToSimulate; i++) {
            updatedPlant.age += 1

            updatedPlant = this._runDailyEcosystem(updatedPlant, simulationSettings)
            updatedPlant = this._runDailyMetabolism(updatedPlant, simulationSettings)
            updatedPlant = this._runDailyGrowth(updatedPlant, simulationSettings)
            updatedPlant = this._runDailySynthesis(updatedPlant)
            updatedPlant = this._updateHealthAndStress(updatedPlant, simulationSettings)

            const {
                plant: p,
                journalEntries: j,
                tasks: t,
            } = this._checkForEvents(updatedPlant, simulationSettings)
            updatedPlant = p
            newJournalEntries.push(...j)
            newTasks.push(...t)

            updatedPlant.history.push({
                day: updatedPlant.age,
                height: updatedPlant.height,
                health: updatedPlant.health,
                stressLevel: updatedPlant.stressLevel,
                medium: {
                    ph: updatedPlant.medium.ph,
                    ec: updatedPlant.medium.ec,
                    moisture: updatedPlant.medium.moisture,
                },
            })
        }

        updatedPlant.lastUpdated = nextTimestamp
        return { updatedPlant, newJournalEntries, newTasks }
    }

    private _runDailyEcosystem(plant: Plant, simulationSettings?: SimulationSettings): Plant {
        const p = this._applyDailyEnvironmentalDrift(this.clonePlant(plant), simulationSettings)

        // Exhaust fan replenishes CO2 toward ambient (400 ppm).
        // With poor or disabled ventilation, photosynthesis steadily depletes CO2.
        const co2RefreshRate: Record<string, number> = { high: 0.9, medium: 0.7, low: 0.4 }
        const fanRefreshRate = p.equipment.exhaustFan.isOn
            ? (co2RefreshRate[p.equipment.exhaustFan.power] ?? 0.7)
            : 0.1
        const stabilityFactor = simulationSettings
            ? this._clamp(simulationSettings.environmentalStability, 0.4, 1.2)
            : 1
        const ambientCo2 = 400
        const co2Consumption = p.equipment.light.isOn ? p.biomass.leaves * 8 : 0
        const co2After = p.environment.co2Level - co2Consumption
        p.environment.co2Level = this._clamp(
            co2After + (ambientCo2 - co2After) * fanRefreshRate * stabilityFactor,
            200,
            1500,
        )

        return p
    }

    private _runDailyMetabolism(plant: Plant, simulationSettings?: SimulationSettings): Plant {
        const p = this.clonePlant(plant)

        p.environment = this.applyEnvironmentalCorrections(p, simulationSettings).environment

        const mods = this._getModifiers(p)
        const vpd = p.environment.vpd
        const vpdOptimum = (mods.vpdTolerance.min + mods.vpdTolerance.max) / 2
        const stomataSensitivity = this._getSimulationStomataSensitivity(p, simulationSettings)
        const vpdStressFactor = this._clamp(
            1 - Math.abs(vpd - vpdOptimum) * stomataSensitivity,
            0.1,
            1,
        )
        const transpirationRate = p.biomass.leaves * mods.transpirationFactor * vpdStressFactor

        const waterUsed = Math.min(p.medium.substrateWater, transpirationRate * 100)
        p.medium.substrateWater -= waterUsed
        const waterCapacity =
            p.equipment.potSize * 1000 * (p.equipment.potType === 'Fabric' ? 0.28 : 0.35)
        p.medium.moisture = (p.medium.substrateWater / waterCapacity) * 100

        // pH lockout: nutrient availability is reduced when pH deviates beyond the ideal window
        const idealPh = PLANT_STAGE_DETAILS[p.stage].idealVitals.ph
        const phOptimal = (idealPh.min + idealPh.max) / 2
        const phHalfRange = Math.max(0.01, (idealPh.max - idealPh.min) / 2)
        const phDeviation = Math.max(0, Math.abs(p.medium.ph - phOptimal) - phHalfRange)
        const phLockoutFactor = this._clamp(1.0 - (phDeviation / phHalfRange) * 0.8, 0.2, 1.0)

        const uptakeFactor = mods.nutrientUptakeRate * (p.rootSystem.health / 100)
        const nutrientDemand = (p.biomass.total + p.rootSystem.rootMass) * 0.05
        const availableNutrients = waterUsed * p.medium.ec * uptakeFactor * phLockoutFactor

        const nutrientsTaken = Math.min(nutrientDemand, availableNutrients)
        if (nutrientsTaken > 0) {
            const ratio = PLANT_STAGE_DETAILS[p.stage].nutrientRatio
            const totalRatio = ratio.n + ratio.p + ratio.k
            p.nutrientPool.nitrogen += nutrientsTaken * (ratio.n / totalRatio)
            p.nutrientPool.phosphorus += nutrientsTaken * (ratio.p / totalRatio)
            p.nutrientPool.potassium += nutrientsTaken * (ratio.k / totalRatio)
        }

        return p
    }

    private _runDailyGrowth(plant: Plant, simulationSettings?: SimulationSettings): Plant {
        const p = this.clonePlant(plant)
        const nutrientConversionEfficiency =
            this._getSimulationNutrientConversionEfficiency(simulationSettings)
        const lightExtinctionCoefficient =
            this._getSimulationLightExtinctionCoefficient(simulationSettings)

        const parEfficiency =
            p.equipment.light.type === 'LED' ? SIM_PAR_PER_WATT_LED : SIM_PAR_PER_WATT_LED * 0.8
        const dailyLightIntegral =
            (p.equipment.light.wattage * parEfficiency * p.equipment.light.lightHours * 3600) /
            1000000
        const lightAbsorbed = 1 - Math.exp(-lightExtinctionCoefficient * p.leafAreaIndex)
        // CO2 enrichment factor: 1.0 at ambient 400 ppm, scales proportionally, capped at 2.0×
        const co2Factor = this._clamp(p.environment.co2Level / 400, 0.5, 2.0)
        const potentialBiomassGain =
            (dailyLightIntegral / 4) * lightAbsorbed * this._getModifiers(p).rue * co2Factor

        const nutrientSupply =
            (p.nutrientPool.nitrogen + p.nutrientPool.phosphorus + p.nutrientPool.potassium) *
            nutrientConversionEfficiency
        const actualBiomassGain = Math.min(potentialBiomassGain, nutrientSupply) * (p.health / 100)

        const partition = PLANT_STAGE_DETAILS[p.stage].biomassPartitioning
        const gainedRoots = actualBiomassGain * partition.roots
        const gainedStem = actualBiomassGain * partition.stem
        const gainedLeaves = actualBiomassGain * partition.leaves
        const gainedFlowers = actualBiomassGain * partition.flowers

        p.rootSystem.rootMass += gainedRoots
        p.biomass.stem += gainedStem
        p.biomass.leaves += gainedLeaves
        p.biomass.flowers += gainedFlowers
        p.biomass.total = p.biomass.stem + p.biomass.leaves + p.biomass.flowers

        p.height = p.biomass.stem * 20
        p.leafAreaIndex = p.biomass.leaves * 0.05

        const consumedNutrients = actualBiomassGain / nutrientConversionEfficiency
        const ratio = PLANT_STAGE_DETAILS[p.stage].nutrientRatio
        const totalRatio = ratio.n + ratio.p + ratio.k
        if (totalRatio > 0) {
            p.nutrientPool.nitrogen = Math.max(
                0,
                p.nutrientPool.nitrogen - consumedNutrients * (ratio.n / totalRatio),
            )
            p.nutrientPool.phosphorus = Math.max(
                0,
                p.nutrientPool.phosphorus - consumedNutrients * (ratio.p / totalRatio),
            )
            p.nutrientPool.potassium = Math.max(
                0,
                p.nutrientPool.potassium - consumedNutrients * (ratio.k / totalRatio),
            )
        }

        return p
    }

    private _runDailySynthesis(plant: Plant): Plant {
        const p = this.clonePlant(plant)

        if (p.stage !== PlantStage.Flowering) {
            return p
        }

        const productionFactor = 0.02 * (p.health / 100) * (1 - p.stressLevel / 150)
        const newCannabinoids = p.biomass.flowers * productionFactor

        if (newCannabinoids > 0) {
            const thcToCbdRatio = p.strain.thc / (p.strain.cbd + 0.1)
            p.cannabinoidProfile.thc += newCannabinoids * (thcToCbdRatio / (thcToCbdRatio + 1))
            p.cannabinoidProfile.cbd += newCannabinoids * (1 / (thcToCbdRatio + 1))
        }

        if (p.strain.dominantTerpenes && p.strain.dominantTerpenes.length > 0) {
            const newTerpenes = p.biomass.flowers * (productionFactor * 0.2)
            const terpeneCount = p.strain.dominantTerpenes.length
            const blockedTerpeneKeys = new Set(['__proto__', 'constructor', 'prototype'])
            const nextTerpeneProfile = new Map<string, number>(Object.entries(p.terpeneProfile))
            p.strain.dominantTerpenes.forEach((terpName) => {
                if (blockedTerpeneKeys.has(terpName)) {
                    return
                }
                const currentTerpeneAmount = nextTerpeneProfile.get(terpName) ?? 0
                nextTerpeneProfile.set(terpName, currentTerpeneAmount + newTerpenes / terpeneCount)
            })
            p.terpeneProfile = Object.fromEntries(nextTerpeneProfile)
        }

        return p
    }

    private _updateHealthAndStress(plant: Plant, simulationSettings?: SimulationSettings): Plant {
        const p = this.clonePlant(plant)
        const ideal = PLANT_STAGE_DETAILS[p.stage].idealVitals
        let stress = 0
        const environmentalStressMultiplier =
            this._getEnvironmentalStressMultiplier(simulationSettings)
        const nutrientStressMultiplier = this._getNutrientStressMultiplier(simulationSettings)

        // VPD Stress
        if (p.environment.vpd < ideal.vpd.min || p.environment.vpd > ideal.vpd.max) {
            stress += 10 * environmentalStressMultiplier
            p.stressCounters.vpd = (p.stressCounters.vpd ?? 0) + 1
        } else {
            p.stressCounters.vpd = 0
        }
        // pH Stress
        if (p.medium.ph < ideal.ph.min || p.medium.ph > ideal.ph.max) {
            stress += 15 * nutrientStressMultiplier
            p.stressCounters.ph = (p.stressCounters.ph ?? 0) + 1
        } else {
            p.stressCounters.ph = 0
        }
        // EC Stress
        if (p.medium.ec < ideal.ec.min || p.medium.ec > ideal.ec.max) {
            stress += 10 * nutrientStressMultiplier
            p.stressCounters.ec = (p.stressCounters.ec ?? 0) + 1
        } else {
            p.stressCounters.ec = 0
        }
        // Moisture Stress
        if (p.medium.moisture < 20) {
            // Underwatering
            stress += 20
            p.stressCounters.moisture = (p.stressCounters.moisture ?? 0) + 1
        } else if (p.medium.moisture > 98) {
            // Overwatering
            stress += 5
            p.stressCounters.moisture = (p.stressCounters.moisture ?? 0) + 1
        } else {
            p.stressCounters.moisture = 0
        }

        p.stressLevel = Math.min(100, p.stressLevel * 0.8 + stress)
        p.health = Math.max(0, 100 - p.stressLevel)

        return p
    }

    private _shouldEvaluateStageProgression(stage: PlantStage, currentStageIndex: number): boolean {
        return (
            currentStageIndex < STAGES_ORDER.length - 1 &&
            ![
                PlantStage.Harvest,
                PlantStage.Drying,
                PlantStage.Curing,
                PlantStage.Finished,
            ].includes(stage)
        )
    }

    private _applyStageProgression(p: Plant): void {
        const currentStageIndex = STAGES_ORDER.indexOf(p.stage)
        if (!this._shouldEvaluateStageProgression(p.stage, currentStageIndex)) {
            return
        }

        let cumulativeDuration = 0
        for (let i = 0; i <= currentStageIndex; i++) {
            cumulativeDuration += PLANT_STAGE_DETAILS[STAGES_ORDER[i]!]!.duration
        }

        const nextStage = STAGES_ORDER[currentStageIndex + 1]!
        const isPhotoperiodBlockedFlowerTransition =
            nextStage === PlantStage.Flowering &&
            p.strain.floweringType === 'Photoperiod' &&
            p.equipment.light.lightHours > 12

        if (!isPhotoperiodBlockedFlowerTransition && p.age >= cumulativeDuration) {
            p.stage = nextStage
        }
    }

    private _createStageChangeEntry(from: PlantStage, to: PlantStage): JournalEntry {
        return {
            id: '',
            createdAt: 0,
            type: JournalEntryType.System,
            notes: `Stage changed from ${from} to ${to}`,
            details: { from, to },
        }
    }

    private _createWaterTaskIfNeeded(p: Plant): Task | null {
        const hasWaterTask = p.tasks.some((task) => task.title === 'Task: Water Plant')
        if (p.medium.moisture >= 30 || hasWaterTask) {
            return null
        }

        return {
            id: `task-water-${p.id}`,
            title: 'Task: Water Plant',
            description: `${p.name} is thirsty!`,
            isCompleted: false,
            createdAt: Date.now(),
            priority: 'high',
        }
    }

    private _hasActiveProblem(p: Plant, type: ProblemType): boolean {
        return p.problems.some((problem) => problem.type === type && problem.status === 'active')
    }

    private _tryAddPestProblem(p: Plant, pestPressureMultiplier: number): void {
        if (p.stressCounters.vpd <= 3 || this._hasActiveProblem(p, ProblemType.PestInfestation)) {
            return
        }

        const vpdStressChance =
            ((p.stressCounters.vpd - 3) * 0.05 * pestPressureMultiplier) /
            this._getModifiers(p).pestResistance
        if (secureRandom() < vpdStressChance) {
            p.problems.push({
                type: ProblemType.PestInfestation,
                severity: 1,
                onsetDay: p.age,
                status: 'active',
            })
            p.stressCounters.vpd = 0
        }
    }

    private _tryAddNutrientProblem(p: Plant, nutrientStressMultiplier: number): void {
        if (
            (p.stressCounters.ph <= 3 && p.stressCounters.ec <= 3) ||
            this._hasActiveProblem(p, ProblemType.NutrientDeficiency)
        ) {
            return
        }

        const nutrientStressChance =
            ((p.stressCounters.ph + p.stressCounters.ec - 3) * 0.04 * nutrientStressMultiplier) /
            this._getModifiers(p).stressTolerance

        if (secureRandom() < nutrientStressChance) {
            p.problems.push({
                type: ProblemType.NutrientDeficiency,
                severity: 1,
                onsetDay: p.age,
                status: 'active',
            })
            p.stressCounters.ph = 0
            p.stressCounters.ec = 0
        }
    }

    private _tryAddMoistureProblem(p: Plant): void {
        if (
            p.stressCounters.moisture > 2 &&
            !this._hasActiveProblem(p, ProblemType.Underwatering) &&
            p.medium.moisture < 20
        ) {
            p.problems.push({
                type: ProblemType.Underwatering,
                severity: 1,
                onsetDay: p.age,
                status: 'active',
            })
            p.stressCounters.moisture = 0
            return
        }

        if (
            p.stressCounters.moisture > 4 &&
            !this._hasActiveProblem(p, ProblemType.Overwatering) &&
            p.medium.moisture > 95
        ) {
            p.problems.push({
                type: ProblemType.Overwatering,
                severity: 1,
                onsetDay: p.age,
                status: 'active',
            })
            p.stressCounters.moisture = 0
        }
    }

    private _checkForEvents(
        plant: Plant,
        simulationSettings?: SimulationSettings,
    ): { plant: Plant; journalEntries: JournalEntry[]; tasks: Task[] } {
        const p = this.clonePlant(plant)
        const journalEntries: JournalEntry[] = []
        const newTasks: Task[] = []
        const originalStage = p.stage
        const pestPressureMultiplier = this._getPestPressureMultiplier(simulationSettings)
        const nutrientStressMultiplier = this._getNutrientStressMultiplier(simulationSettings)

        this._applyStageProgression(p)

        if (p.stage !== originalStage) {
            if (p.stage === PlantStage.Harvest && !p.harvestData) {
                p.harvestData = this._createInitialHarvestData(p)
            }
            journalEntries.push(this._createStageChangeEntry(originalStage, p.stage))
        }

        const waterTask = this._createWaterTaskIfNeeded(p)
        if (waterTask) {
            newTasks.push(waterTask)
        }

        this._tryAddPestProblem(p, pestPressureMultiplier)
        this._tryAddNutrientProblem(p, nutrientStressMultiplier)
        this._tryAddMoistureProblem(p)

        return { plant: p, journalEntries, tasks: newTasks }
    }

    private _calculateVPD(
        tempC: number,
        rh: number,
        leafTempOffset: number,
        altitudeM = 0,
    ): number {
        return calculateScientificVPD(tempC, rh, leafTempOffset, altitudeM)
    }

    clonePlant(plant: Plant): Plant {
        if (typeof structuredClone === 'function') {
            return structuredClone(plant)
        }

        return JSON.parse(JSON.stringify(plant))
    }

    topPlant(plant: Plant): { updatedPlant: Plant } {
        const p = this.clonePlant(plant)
        if (p.stage === PlantStage.Vegetative && !p.isTopped) {
            p.isTopped = true
            p.structuralModel.branches *= 2
            p.stressLevel = Math.min(100, plant.stressLevel + 25)
        }
        return { updatedPlant: p }
    }

    applyLst(plant: Plant): { updatedPlant: Plant } {
        const p = this.clonePlant(plant)
        if (p.stage === PlantStage.Vegetative) {
            p.lstApplied += 1
            p.stressLevel = Math.min(100, plant.stressLevel + 5)
        }
        return { updatedPlant: p }
    }
}

export const plantSimulationService = new PlantSimulationService()

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

const airflowToLevel = (power: Plant['equipment']['exhaustFan']['power']): AirflowLevel => {
    return power
}

class VPDSimulationService {
    private worker: Worker | null = null

    private getWorker(): Worker | null {
        if (typeof Worker === 'undefined') {
            return null
        }

        if (!this.worker) {
            this.worker = new Worker(
                new URL('../workers/vpdSimulation.worker.ts', import.meta.url),
                { type: 'module' },
            )
        }

        return this.worker
    }

    /** Terminate the VPD simulation worker and release resources. */
    dispose(): void {
        if (this.worker) {
            this.worker.terminate()
            this.worker = null
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

    createInputFromPlant(plant: Plant, simulationSettings?: SimulationSettings): VPDInput {
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
                date: new Date(plant.createdAt + entry.day * 86400000).toISOString(),
                vpd: Number(plant.environment.vpd.toFixed(3)),
                status: 'optimal' as const,
            })),
        }
    }

    runDailyVPD(
        input: VPDInput,
        tempProfile?: number[],
        rhProfile?: number[],
    ): Promise<SimulationPoint[]> {
        const profiles =
            tempProfile && rhProfile ? { tempProfile, rhProfile } : this.createProfiles(input)
        const worker = this.getWorker()

        if (!worker) {
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

        return new Promise((resolve, reject) => {
            const VPD_WORKER_TIMEOUT_MS = 30_000
            const timer = setTimeout(() => {
                reject(new Error('VPD daily simulation timed out'))
            }, VPD_WORKER_TIMEOUT_MS)

            const onMessage = (e: MessageEvent<VPDWorkerResponse>) => {
                if (e.data.type === 'DAILY_RESULT') {
                    clearTimeout(timer)
                    worker.removeEventListener('message', onMessage)
                    worker.removeEventListener('error', onError)
                    resolve(e.data.data)
                }
            }
            const onError = (e: ErrorEvent) => {
                clearTimeout(timer)
                worker.removeEventListener('message', onMessage)
                worker.removeEventListener('error', onError)
                reject(new Error(e.message))
            }

            worker.addEventListener('message', onMessage)
            worker.addEventListener('error', onError)

            worker.postMessage({
                type: 'RUN_DAILY',
                payload: {
                    baseInput: {
                        medium: input.medium,
                        airflow: input.airflow,
                        phase: input.phase,
                        leafTempOffset: input.leafTempOffset,
                    },
                    tempProfile: profiles.tempProfile,
                    rhProfile: profiles.rhProfile,
                },
            })
        })
    }

    runGrowthProjection(plant: VPDPlantState, env: VPDInput, days = 7): Promise<VPDPlantState> {
        const worker = this.getWorker()

        if (!worker) {
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

        return new Promise((resolve, reject) => {
            const VPD_WORKER_TIMEOUT_MS = 30_000
            const timer = setTimeout(() => {
                reject(new Error('VPD growth projection timed out'))
            }, VPD_WORKER_TIMEOUT_MS)

            const onMessage = (e: MessageEvent<VPDWorkerResponse>) => {
                if (e.data.type === 'GROWTH_RESULT') {
                    clearTimeout(timer)
                    worker.removeEventListener('message', onMessage)
                    worker.removeEventListener('error', onError)
                    resolve(e.data.plant)
                }
            }
            const onError = (e: ErrorEvent) => {
                clearTimeout(timer)
                worker.removeEventListener('message', onMessage)
                worker.removeEventListener('error', onError)
                reject(new Error(e.message))
            }

            worker.addEventListener('message', onMessage)
            worker.addEventListener('error', onError)

            worker.postMessage({
                type: 'RUN_GROWTH',
                payload: { plant, env, days },
            })
        })
    }
}

export const vpdService = new VPDSimulationService()
