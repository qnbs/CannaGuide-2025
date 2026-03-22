// ---------------------------------------------------------------------------
// predictiveAnalyticsService — Proactive Insights from Historical Sensor Data
//
// Uses stored time-series sensor data (VPD, temperature, humidity) combined
// with plant metadata (strain, stage) to generate:
//   - Botrytis (mold) risk assessments
//   - Environmental trend warnings
//   - Data-driven yield impact estimates
//
// Integrates with the local AI fallback heuristics when ML models are not
// available, ensuring offline-capable predictive warnings.
// ---------------------------------------------------------------------------

import { type Plant, PlantStage } from '@/types'
import { timeSeriesService } from '@/services/timeSeriesService'
import type { TimeSeriesEntry, AggregatedStats } from '@/services/timeSeriesService'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical'

export interface BotrytisRiskAssessment {
    riskLevel: RiskLevel
    riskScore: number
    factors: string[]
    recommendation: string
}

export interface EnvironmentAlert {
    type: 'temperature' | 'humidity' | 'vpd' | 'ph'
    severity: RiskLevel
    message: string
    currentValue: number
    idealRange: [number, number]
}

export interface YieldImpactEstimate {
    impactPercent: number
    description: string
    factors: string[]
}

export interface PredictiveInsight {
    botrytisRisk: BotrytisRiskAssessment
    environmentAlerts: EnvironmentAlert[]
    yieldImpact: YieldImpactEstimate
    analyzedSamples: number
    analysisTimestamp: number
}

// ---------------------------------------------------------------------------
// Constants — thresholds derived from cannabis cultivation literature
// ---------------------------------------------------------------------------

const BOTRYTIS_HUMIDITY_THRESHOLD = 65
const BOTRYTIS_HUMIDITY_CRITICAL = 80
const BOTRYTIS_TEMP_LOW = 15
const BOTRYTIS_TEMP_HIGH = 25
const BOTRYTIS_VPD_LOW = 0.4

/** Ideal ranges per growth stage: [tempMin, tempMax, humMin, humMax, vpdMin, vpdMax] */
const STAGE_IDEAL_RANGES: Partial<
    Record<PlantStage, [number, number, number, number, number, number]>
> = {
    [PlantStage.Seedling]: [22, 28, 65, 75, 0.4, 0.8],
    [PlantStage.Vegetative]: [22, 28, 50, 65, 0.8, 1.2],
    [PlantStage.Flowering]: [20, 26, 40, 55, 1.0, 1.5],
    [PlantStage.Drying]: [18, 22, 55, 65, 0.8, 1.2],
    [PlantStage.Curing]: [18, 22, 58, 65, 0.6, 1.0],
}

const DEFAULT_IDEAL_RANGE: [number, number, number, number, number, number] = [
    20, 28, 45, 65, 0.6, 1.4,
]

const MS_PER_DAY = 86_400_000

const getIdealRange = (stage: PlantStage): [number, number, number, number, number, number] =>
    STAGE_IDEAL_RANGES[stage] ?? DEFAULT_IDEAL_RANGE

const buildTemperatureAlert = (
    avgTemperature: number,
    idealMin: number,
    idealMax: number,
): EnvironmentAlert | null => {
    if (avgTemperature >= idealMin && avgTemperature <= idealMax) {
        return null
    }

    const severity =
        Math.abs(avgTemperature - (avgTemperature < idealMin ? idealMin : idealMax)) > 5
            ? 'high'
            : 'moderate'

    return {
        type: 'temperature',
        severity,
        message: `Average temperature ${avgTemperature.toFixed(1)}°C is outside ideal range`,
        currentValue: avgTemperature,
        idealRange: [idealMin, idealMax],
    }
}

const buildHumidityAlert = (
    avgHumidity: number,
    idealMin: number,
    idealMax: number,
): EnvironmentAlert | null => {
    if (avgHumidity >= idealMin && avgHumidity <= idealMax) {
        return null
    }

    const severity =
        Math.abs(avgHumidity - (avgHumidity < idealMin ? idealMin : idealMax)) > 15
            ? 'high'
            : 'moderate'

    return {
        type: 'humidity',
        severity,
        message: `Average humidity ${avgHumidity.toFixed(1)}% is outside ideal range`,
        currentValue: avgHumidity,
        idealRange: [idealMin, idealMax],
    }
}

const buildVpdAlert = (
    avgVpd: number | null,
    idealMin: number,
    idealMax: number,
): EnvironmentAlert | null => {
    if (avgVpd == null || (avgVpd >= idealMin && avgVpd <= idealMax)) {
        return null
    }

    const targetBoundary = avgVpd < idealMin ? idealMin : idealMax
    const deviation = Math.abs(avgVpd - targetBoundary)
    const severity = deviation > 0.5 ? 'high' : 'moderate'

    return {
        type: 'vpd',
        severity,
        message: `Average VPD ${avgVpd.toFixed(2)} kPa is outside ideal range`,
        currentValue: avgVpd,
        idealRange: [idealMin, idealMax],
    }
}

const buildPhAlert = (avgPh: number | null): EnvironmentAlert | null => {
    if (avgPh == null || (avgPh >= 5.8 && avgPh <= 6.5)) {
        return null
    }

    return {
        type: 'ph',
        severity: avgPh < 5.2 || avgPh > 7.0 ? 'high' : 'moderate',
        message: `Average pH ${avgPh.toFixed(1)} is outside ideal range`,
        currentValue: avgPh,
        idealRange: [5.8, 6.5],
    }
}

const getVpdPenalty = (
    avgVpd: number | null,
    ideal: [number, number, number, number, number, number],
): number => {
    if (avgVpd == null) {
        return 0
    }

    const vpdMid = (ideal[4] + ideal[5]) / 2
    const vpdDev = Math.abs(avgVpd - vpdMid)
    if (vpdDev <= 0.3) {
        return 0
    }

    return Math.min(vpdDev * 12, 20)
}

const getTemperaturePenalty = (
    avgTemperature: number,
    ideal: [number, number, number, number, number, number],
): number => {
    const tempMid = (ideal[0] + ideal[1]) / 2
    const tempDev = Math.abs(avgTemperature - tempMid)
    if (tempDev <= 3) {
        return 0
    }
    return Math.min(tempDev * 3, 18)
}

const getHumidityPenalty = (maxHumidity: number): number => {
    if (maxHumidity <= 80) {
        return 0
    }
    return Math.min((maxHumidity - 80) * 2, 15)
}

const getAlertPenalty = (alerts: EnvironmentAlert[]): number =>
    alerts.filter((alert) => alert.severity === 'high').length * 5

const addPenaltyFactor = (
    currentPenalty: number,
    factors: string[],
    penalty: number,
    message: string,
): number => {
    if (penalty <= 0) {
        return currentPenalty
    }

    factors.push(message)
    return currentPenalty + penalty
}

const describeYieldImpact = (impactPercent: number): string => {
    if (impactPercent >= -5) {
        return 'Environmental conditions are optimal. Minimal yield impact expected.'
    }
    if (impactPercent >= -15) {
        return 'Minor environmental deviations may slightly reduce yield potential.'
    }
    if (impactPercent >= -30) {
        return 'Significant environmental stress detected. Yield may be noticeably reduced.'
    }

    return 'Severe environmental conditions are likely causing substantial yield loss. Immediate correction recommended.'
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const predictiveAnalyticsService = {
    /**
     * Generate a comprehensive predictive insight for a plant using its
     * recent sensor history and metadata.
     */
    async analyze(plant: Plant, deviceId: string, lookbackDays = 3): Promise<PredictiveInsight> {
        const now = Date.now()
        const from = now - lookbackDays * MS_PER_DAY

        const [entries, stats] = await Promise.all([
            timeSeriesService.query({ deviceId, from, to: now }),
            timeSeriesService.getStats(deviceId, from, now),
        ])

        const botrytisRisk = this.assessBotrytisRisk(entries, stats, plant)
        const environmentAlerts = this.checkEnvironment(stats, plant)
        const yieldImpact = this.estimateYieldImpact(stats, environmentAlerts, plant)

        return {
            botrytisRisk,
            environmentAlerts,
            yieldImpact,
            analyzedSamples: stats.sampleCount,
            analysisTimestamp: now,
        }
    },

    /**
     * Assess Botrytis (gray mold) risk based on environmental conditions.
     * Botrytis cinerea thrives in: high humidity (>65%), moderate temps
     * (15–25 °C), stagnant air (low VPD), and dense canopy (flowering stage).
     */
    assessBotrytisRisk(
        entries: TimeSeriesEntry[],
        stats: AggregatedStats,
        plant: Plant,
    ): BotrytisRiskAssessment {
        let score = 0
        const factors: string[] = []

        // Factor 1: Average humidity
        if (stats.avgHumidity > BOTRYTIS_HUMIDITY_CRITICAL) {
            score += 35
            factors.push(`High average humidity: ${stats.avgHumidity.toFixed(1)}%`)
        } else if (stats.avgHumidity > BOTRYTIS_HUMIDITY_THRESHOLD) {
            score += 20
            factors.push(`Elevated humidity: ${stats.avgHumidity.toFixed(1)}%`)
        }

        // Factor 2: Humidity spikes
        if (stats.maxHumidity > 85) {
            score += 15
            factors.push(`Humidity spike detected: ${stats.maxHumidity.toFixed(1)}%`)
        }

        // Factor 3: Temperature in Botrytis sweet spot
        if (
            stats.avgTemperature >= BOTRYTIS_TEMP_LOW &&
            stats.avgTemperature <= BOTRYTIS_TEMP_HIGH
        ) {
            score += 15
            factors.push(`Temperature in Botrytis range: ${stats.avgTemperature.toFixed(1)}°C`)
        }

        // Factor 4: Low VPD (stagnant, moist air)
        if (stats.avgVpd != null && stats.avgVpd < BOTRYTIS_VPD_LOW) {
            score += 20
            factors.push(`Low VPD (poor transpiration): ${stats.avgVpd.toFixed(2)} kPa`)
        }

        // Factor 5: Flowering stage (dense buds trap moisture)
        const floweringStages: PlantStage[] = [
            PlantStage.Flowering,
            PlantStage.Harvest,
            PlantStage.Drying,
        ]
        if (floweringStages.includes(plant.stage)) {
            score += 15
            factors.push(`Stage "${plant.stage}" increases mold susceptibility`)
        }

        // Factor 6: Sustained high humidity windows (>4 h consecutive above threshold)
        const sustainedWindows = this.countSustainedHighHumidity(
            entries,
            BOTRYTIS_HUMIDITY_THRESHOLD,
            4 * 3_600_000,
        )
        if (sustainedWindows > 0) {
            score += Math.min(sustainedWindows * 10, 20)
            factors.push(`${sustainedWindows} sustained high-humidity window(s) detected`)
        }

        const riskScore = Math.min(score, 100)
        const riskLevel = this.scoreToLevel(riskScore)

        const recommendations: Record<RiskLevel, string> = {
            low: 'Conditions are favorable. Continue monitoring.',
            moderate:
                'Consider increasing airflow and reducing humidity, especially during dark periods.',
            high: 'Reduce humidity below 55%, increase ventilation, and inspect dense bud sites for early mold signs.',
            critical:
                'Immediate action required: defoliate lower canopy, maximize air exchange, and consider a dehumidifier. Inspect all bud sites.',
        }

        return {
            riskLevel,
            riskScore,
            factors,
            recommendation: recommendations[riskLevel],
        }
    },

    /**
     * Check current environment against stage-specific ideal ranges.
     */
    checkEnvironment(stats: AggregatedStats, plant: Plant): EnvironmentAlert[] {
        if (stats.sampleCount === 0) return []

        const ideal = getIdealRange(plant.stage)
        const [tempMin, tempMax, humMin, humMax, vpdMin, vpdMax] = ideal
        const alerts: EnvironmentAlert[] = []

        const temperatureAlert = buildTemperatureAlert(stats.avgTemperature, tempMin, tempMax)
        if (temperatureAlert) alerts.push(temperatureAlert)

        const humidityAlert = buildHumidityAlert(stats.avgHumidity, humMin, humMax)
        if (humidityAlert) alerts.push(humidityAlert)

        const vpdAlert = buildVpdAlert(stats.avgVpd, vpdMin, vpdMax)
        if (vpdAlert) alerts.push(vpdAlert)

        const phAlert = buildPhAlert(stats.avgPh)
        if (phAlert) alerts.push(phAlert)

        return alerts
    },

    /**
     * Estimate the impact of current environmental conditions on yield.
     */
    estimateYieldImpact(
        stats: AggregatedStats,
        alerts: EnvironmentAlert[],
        plant: Plant,
    ): YieldImpactEstimate {
        if (stats.sampleCount === 0) {
            return {
                impactPercent: 0,
                description: 'No sensor data available for yield impact analysis.',
                factors: [],
            }
        }

        let totalPenalty = 0
        const factors: string[] = []
        const ideal = getIdealRange(plant.stage)

        const vpdPenalty = getVpdPenalty(stats.avgVpd, ideal)
        totalPenalty = addPenaltyFactor(
            totalPenalty,
            factors,
            vpdPenalty,
            `VPD deviation: -${vpdPenalty.toFixed(0)}%`,
        )

        const temperaturePenalty = getTemperaturePenalty(stats.avgTemperature, ideal)
        totalPenalty = addPenaltyFactor(
            totalPenalty,
            factors,
            temperaturePenalty,
            `Temperature stress: -${temperaturePenalty.toFixed(0)}%`,
        )

        const humidityPenalty = getHumidityPenalty(stats.maxHumidity)
        totalPenalty = addPenaltyFactor(
            totalPenalty,
            factors,
            humidityPenalty,
            `High humidity exposure: -${humidityPenalty.toFixed(0)}%`,
        )

        const alertPenalty = getAlertPenalty(alerts)
        totalPenalty = addPenaltyFactor(
            totalPenalty,
            factors,
            alertPenalty,
            `${alertPenalty / 5} high-severity alert(s): -${alertPenalty}%`,
        )

        const impactPercent = -Math.min(totalPenalty, 60)
        return { impactPercent, description: describeYieldImpact(impactPercent), factors }
    },

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /**
     * Count how many sustained windows of high humidity exceed the given duration.
     */
    countSustainedHighHumidity(
        entries: TimeSeriesEntry[],
        threshold: number,
        minDurationMs: number,
    ): number {
        if (entries.length < 2) return 0

        const sorted = entries.toSorted((a, b) => a.timestamp - b.timestamp)
        let windowCount = 0
        let windowStart: number | null = null

        for (const entry of sorted) {
            if (entry.humidityPercent > threshold) {
                if (windowStart === null) windowStart = entry.timestamp
            } else {
                if (windowStart !== null && entry.timestamp - windowStart >= minDurationMs) {
                    windowCount++
                }
                windowStart = null
            }
        }

        // Check final open window
        if (windowStart !== null && sorted.length > 0) {
            const last = sorted.at(-1)
            if (last && last.timestamp - windowStart >= minDurationMs) {
                windowCount++
            }
        }

        return windowCount
    },

    scoreToLevel(score: number): RiskLevel {
        if (score >= 70) return 'critical'
        if (score >= 45) return 'high'
        if (score >= 25) return 'moderate'
        return 'low'
    },
}
