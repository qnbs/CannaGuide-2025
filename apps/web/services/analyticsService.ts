// ---------------------------------------------------------------------------
// analyticsService -- Cross-Module Analytics Engine for CannaGuide 2025
//
// Aggregates data across Plants, Journal, Strains, Equipment, and IoT to
// produce actionable insights, success predictions, and trend analysis.
//
// All computation is synchronous / in-memory -- no external dependencies.
// ---------------------------------------------------------------------------

import { PlantStage } from '@/types'
import type { Plant } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GrowAnalytics {
    /** Overall garden health score (0-100) */
    readonly gardenScore: number
    /** Plants by stage distribution */
    readonly stageDistribution: Record<string, number>
    /** Average health across all plants */
    readonly avgHealth: number
    /** Journal activity trend (entries per day, last 14 days) */
    readonly journalActivityTrend: DailyCount[]
    /** Most common journal entry types */
    readonly topJournalTypes: Array<{ type: string; count: number }>
    /** Environment stability score (0-100) */
    readonly environmentStability: number
    /** Estimated days to next major event */
    readonly nextMilestone: MilestoneEstimate | undefined
    /** Risk assessment based on current conditions */
    readonly riskFactors: RiskFactor[]
    /** Strain performance ranking (if multiple grows) */
    readonly strainPerformance: StrainPerformanceEntry[]
    /** Actionable recommendations */
    readonly recommendations: AnalyticsRecommendation[]
    /** 14-day health trend per plant */
    readonly healthTrend: HealthTrendEntry[]
    /** pH/EC nutrient consistency analysis per plant */
    readonly nutrientConsistency: NutrientConsistencyEntry[]
    /** Grow duration statistics per strain (finished plants) */
    readonly growDurationStats: GrowDurationStatEntry[]
}

export interface DailyCount {
    readonly date: string
    readonly count: number
}

export interface MilestoneEstimate {
    readonly type: 'harvest' | 'flip' | 'transplant' | 'curing_done'
    readonly plantName: string
    readonly estimatedDays: number
}

export interface RiskFactor {
    readonly type: 'health' | 'environment' | 'nutrient' | 'pest' | 'overdue_task'
    readonly severity: 'low' | 'medium' | 'high'
    readonly descriptionKey: string
    readonly descriptionParams?: Record<string, string | number> | undefined
    readonly plantName?: string | undefined
}

export interface StrainPerformanceEntry {
    readonly strainName: string
    readonly avgHealth: number
    readonly plantCount: number
    readonly avgAge: number
}

export interface AnalyticsRecommendation {
    readonly id: string
    readonly category: 'environment' | 'nutrition' | 'training' | 'harvest' | 'general'
    readonly priority: 'high' | 'medium' | 'low'
    readonly titleKey: string
    readonly descriptionKey: string
    readonly relatedPlantId?: string | undefined
}

export interface HealthTrendEntry {
    readonly plantId: string
    readonly plantName: string
    readonly trend: DailyCount[]
}

export interface NutrientConsistencyEntry {
    readonly plantId: string
    readonly plantName: string
    readonly avgPh: number
    readonly avgEc: number
    readonly phVariance: number
    readonly ecVariance: number
    readonly rating: 'stable' | 'moderate' | 'unstable'
}

export interface GrowDurationStatEntry {
    readonly strainName: string
    readonly minDays: number
    readonly maxDays: number
    readonly avgDays: number
    readonly count: number
}

// ---------------------------------------------------------------------------
// Analytics Engine
// ---------------------------------------------------------------------------

class AnalyticsEngine {
    /**
     * Compute full analytics from the current app state.
     */
    compute(plants: Plant[]): GrowAnalytics {
        const activePlants = plants.filter((p) => !isFinishedStage(p.stage))

        return {
            gardenScore: this.calculateGardenScore(activePlants),
            stageDistribution: this.getStageDistribution(activePlants),
            avgHealth: this.getAverageHealth(activePlants),
            journalActivityTrend: this.getJournalActivityTrend(plants),
            topJournalTypes: this.getTopJournalTypes(plants),
            environmentStability: this.calculateEnvironmentStability(activePlants),
            nextMilestone: this.estimateNextMilestone(activePlants),
            riskFactors: this.assessRisks(activePlants),
            strainPerformance: this.rankStrainPerformance(plants),
            recommendations: this.generateRecommendations(activePlants),
            healthTrend: this.getHealthTrend(activePlants),
            nutrientConsistency: this.getNutrientConsistency(activePlants),
            growDurationStats: this.getGrowDurationStats(plants),
        }
    }

    // -- Sub-computations ---------------------------------------------------

    private calculateGardenScore(plants: Plant[]): number {
        if (plants.length === 0) return 0

        let score = 0
        let factors = 0

        // Factor 1: Average health (weight: 40%)
        const avgHealth = this.getAverageHealth(plants)
        score += avgHealth * 0.4
        factors += 0.4

        // Factor 2: Environment stability (weight: 30%)
        const envStability = this.calculateEnvironmentStability(plants)
        score += envStability * 0.3
        factors += 0.3

        // Factor 3: Problem-free ratio (weight: 20%)
        const problemFree = plants.filter((p) => !p.problems || p.problems.length === 0).length
        const problemFreeRatio = plants.length > 0 ? (problemFree / plants.length) * 100 : 100
        score += problemFreeRatio * 0.2
        factors += 0.2

        // Factor 4: Journal activity (weight: 10%)
        const hasRecentActivity = plants.some((p) => {
            if (!p.journal || p.journal.length === 0) return false
            const latest = p.journal[p.journal.length - 1]
            return latest !== undefined && Date.now() - latest.createdAt < 3 * 24 * 60 * 60 * 1000
        })
        score += (hasRecentActivity ? 100 : 50) * 0.1
        factors += 0.1

        return factors > 0 ? Math.round(score / factors) : 0
    }

    private getStageDistribution(plants: Plant[]): Record<string, number> {
        const dist: Record<string, number> = {}
        for (const p of plants) {
            dist[p.stage] = (dist[p.stage] ?? 0) + 1
        }
        return dist
    }

    private getAverageHealth(plants: Plant[]): number {
        if (plants.length === 0) return 0
        let total = 0
        for (const p of plants) {
            total += p.health
        }
        return Math.round(total / plants.length)
    }

    private getJournalActivityTrend(plants: Plant[]): DailyCount[] {
        const dayMs = 24 * 60 * 60 * 1000
        const now = Date.now()
        const counts = new Map<string, number>()

        // Initialize last 14 days
        for (let i = 13; i >= 0; i--) {
            const d = new Date(now - i * dayMs)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            counts.set(key, 0)
        }

        // Count journal entries
        for (const plant of plants) {
            if (!plant.journal) continue
            for (const entry of plant.journal) {
                const d = new Date(entry.createdAt)
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                const existing = counts.get(key)
                if (existing !== undefined) {
                    counts.set(key, existing + 1)
                }
            }
        }

        return Array.from(counts.entries()).map(([date, count]) => ({ date, count }))
    }

    private getTopJournalTypes(plants: Plant[]): Array<{ type: string; count: number }> {
        const typeCounts = new Map<string, number>()
        for (const plant of plants) {
            if (!plant.journal) continue
            for (const entry of plant.journal) {
                typeCounts.set(entry.type, (typeCounts.get(entry.type) ?? 0) + 1)
            }
        }
        return Array.from(typeCounts.entries())
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
    }

    private calculateEnvironmentStability(plants: Plant[]): number {
        if (plants.length === 0) return 100

        let totalStability = 0
        let count = 0

        for (const plant of plants) {
            // VPD stability: ideal range 0.8-1.2 kPa
            if (plant.environment?.vpd !== undefined) {
                const vpdDev = Math.abs(plant.environment.vpd - 1.0)
                const vpdScore = Math.max(0, 100 - vpdDev * 100)
                totalStability += vpdScore
                count++
            }

            // Temperature stability: ideal 22-28C
            if (plant.environment?.internalTemperature !== undefined) {
                const temp = plant.environment.internalTemperature
                const tempDev = temp < 22 ? 22 - temp : temp > 28 ? temp - 28 : 0
                const tempScore = Math.max(0, 100 - tempDev * 10)
                totalStability += tempScore
                count++
            }

            // Humidity stability
            if (plant.environment?.internalHumidity !== undefined) {
                const hum = plant.environment.internalHumidity
                const humDev = hum < 40 ? 40 - hum : hum > 65 ? hum - 65 : 0
                const humScore = Math.max(0, 100 - humDev * 3)
                totalStability += humScore
                count++
            }
        }

        return count > 0 ? Math.round(totalStability / count) : 100
    }

    private estimateNextMilestone(plants: Plant[]): MilestoneEstimate | undefined {
        let closest: MilestoneEstimate | undefined

        for (const plant of plants) {
            const estimate = estimateMilestoneForPlant(plant)
            if (!estimate) continue
            if (!closest || estimate.estimatedDays < closest.estimatedDays) {
                closest = estimate
            }
        }

        return closest
    }

    private assessRisks(plants: Plant[]): RiskFactor[] {
        const risks: RiskFactor[] = []

        for (const plant of plants) {
            // Health risk
            if (plant.health < 50) {
                risks.push({
                    type: 'health',
                    severity: plant.health < 30 ? 'high' : 'medium',
                    descriptionKey: 'analytics.risks.healthCritical',
                    descriptionParams: { name: plant.name, health: plant.health },
                    plantName: plant.name,
                })
            }

            // VPD risk
            if (
                plant.environment?.vpd !== undefined &&
                (plant.environment.vpd < 0.4 || plant.environment.vpd > 1.6)
            ) {
                risks.push({
                    type: 'environment',
                    severity:
                        plant.environment.vpd < 0.2 || plant.environment.vpd > 2.0
                            ? 'high'
                            : 'medium',
                    descriptionKey: 'analytics.risks.vpdOutOfRange',
                    descriptionParams: { name: plant.name, vpd: plant.environment.vpd.toFixed(2) },
                    plantName: plant.name,
                })
            }

            // Active problems
            if (plant.problems && plant.problems.length > 0) {
                for (const prob of plant.problems) {
                    if (prob.severity >= 7) {
                        risks.push({
                            type: 'pest',
                            severity: 'high',
                            descriptionKey: 'analytics.risks.severeProblem',
                            descriptionParams: {
                                name: plant.name,
                                problem: prob.type,
                                severity: prob.severity,
                            },
                            plantName: plant.name,
                        })
                    }
                }
            }

            // Overdue tasks
            if (plant.tasks) {
                for (const task of plant.tasks) {
                    if (!task.isCompleted) {
                        risks.push({
                            type: 'overdue_task',
                            severity: 'medium',
                            descriptionKey: 'analytics.risks.overdueTask',
                            descriptionParams: { name: plant.name, task: task.title },
                            plantName: plant.name,
                        })
                    }
                }
            }
        }

        return risks.sort((a, b) => severityValue(b.severity) - severityValue(a.severity))
    }

    private rankStrainPerformance(plants: Plant[]): StrainPerformanceEntry[] {
        const strainMap = new Map<
            string,
            { totalHealth: number; count: number; totalAge: number }
        >()

        for (const plant of plants) {
            const name = plant.strain?.name ?? 'Unknown'
            const existing = strainMap.get(name) ?? { totalHealth: 0, count: 0, totalAge: 0 }
            existing.totalHealth += plant.health
            existing.count += 1
            existing.totalAge += plant.age ?? 0
            strainMap.set(name, existing)
        }

        return Array.from(strainMap.entries())
            .map(([strainName, data]) => ({
                strainName,
                avgHealth: Math.round(data.totalHealth / data.count),
                plantCount: data.count,
                avgAge: Math.round(data.totalAge / data.count),
            }))
            .sort((a, b) => b.avgHealth - a.avgHealth)
    }

    private generateRecommendations(plants: Plant[]): AnalyticsRecommendation[] {
        const recs: AnalyticsRecommendation[] = []

        for (const plant of plants) {
            // VPD recommendation
            if (
                plant.environment?.vpd !== undefined &&
                (plant.environment.vpd < 0.6 || plant.environment.vpd > 1.4)
            ) {
                recs.push({
                    id: `vpd-${plant.id}`,
                    category: 'environment',
                    priority: 'high',
                    titleKey: 'recommendations.adjustVpd',
                    descriptionKey: 'recommendations.adjustVpdDesc',
                    relatedPlantId: plant.id,
                })
            }

            // Vegetative stage -> suggest training
            if (plant.stage === PlantStage.Vegetative && plant.age && plant.age > 21) {
                recs.push({
                    id: `train-${plant.id}`,
                    category: 'training',
                    priority: 'medium',
                    titleKey: 'recommendations.considerTraining',
                    descriptionKey: 'recommendations.considerTrainingDesc',
                    relatedPlantId: plant.id,
                })
            }

            // Flowering late stage -> harvest timing
            if (plant.stage === PlantStage.Flowering && plant.age && plant.age > 60) {
                recs.push({
                    id: `harvest-${plant.id}`,
                    category: 'harvest',
                    priority: 'high',
                    titleKey: 'recommendations.checkTrichomes',
                    descriptionKey: 'recommendations.checkTrichomesDesc',
                    relatedPlantId: plant.id,
                })
            }

            // Low health -> general advice
            if (plant.health < 70) {
                recs.push({
                    id: `health-${plant.id}`,
                    category: 'general',
                    priority: plant.health < 50 ? 'high' : 'medium',
                    titleKey: 'recommendations.improveHealth',
                    descriptionKey: 'recommendations.improveHealthDesc',
                    relatedPlantId: plant.id,
                })
            }

            // pH drift recommendation
            if (
                plant.medium?.ph !== undefined &&
                (plant.medium.ph < 5.8 || plant.medium.ph > 6.8)
            ) {
                recs.push({
                    id: `ph-${plant.id}`,
                    category: 'nutrition',
                    priority: plant.medium.ph < 5.5 || plant.medium.ph > 7.0 ? 'high' : 'medium',
                    titleKey: 'recommendations.phDrift',
                    descriptionKey: 'recommendations.phDriftDesc',
                    relatedPlantId: plant.id,
                })
            }

            // EC ramp-up for flowering
            if (
                plant.stage === PlantStage.Flowering &&
                plant.medium?.ec !== undefined &&
                plant.medium.ec < 1.2
            ) {
                recs.push({
                    id: `ec-${plant.id}`,
                    category: 'nutrition',
                    priority: 'medium',
                    titleKey: 'recommendations.ecRampUp',
                    descriptionKey: 'recommendations.ecRampUpDesc',
                    relatedPlantId: plant.id,
                })
            }

            // Defoliation timing for dense vegetative
            if (
                plant.stage === PlantStage.Vegetative &&
                plant.age !== undefined &&
                plant.age > 28 &&
                plant.health >= 70
            ) {
                recs.push({
                    id: `defol-${plant.id}`,
                    category: 'training',
                    priority: 'low',
                    titleKey: 'recommendations.defoliation',
                    descriptionKey: 'recommendations.defoliationDesc',
                    relatedPlantId: plant.id,
                })
            }
        }

        // Deduplicate by category per plant
        const seen = new Set<string>()
        return recs
            .filter((r) => {
                if (seen.has(r.id)) return false
                seen.add(r.id)
                return true
            })
            .slice(0, 10)
    }

    private getHealthTrend(plants: Plant[]): HealthTrendEntry[] {
        const dayMs = 24 * 60 * 60 * 1000
        const now = Date.now()

        return plants.map((plant) => {
            const counts = new Map<string, { total: number; count: number }>()

            for (let i = 13; i >= 0; i--) {
                const d = new Date(now - i * dayMs)
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                counts.set(key, { total: 0, count: 0 })
            }

            if (plant.journal) {
                for (const entry of plant.journal) {
                    const d = new Date(entry.createdAt)
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                    const bucket = counts.get(key)
                    if (bucket !== undefined) {
                        bucket.total += plant.health
                        bucket.count += 1
                    }
                }
            }

            const trend: DailyCount[] = Array.from(counts.entries()).map(([date, data]) => ({
                date,
                count: data.count > 0 ? Math.round(data.total / data.count) : plant.health,
            }))

            return {
                plantId: plant.id,
                plantName: plant.name,
                trend,
            }
        })
    }

    private getNutrientConsistency(plants: Plant[]): NutrientConsistencyEntry[] {
        return plants
            .filter((p) => p.medium?.ph !== undefined && p.medium?.ec !== undefined)
            .map((plant) => {
                const ph = plant.medium?.ph ?? 6.0
                const ec = plant.medium?.ec ?? 1.0

                const phIdeal = 6.2
                const ecIdeal = plant.stage === PlantStage.Flowering ? 1.8 : 1.2
                const phDeviation = Math.abs(ph - phIdeal)
                const ecDeviation = Math.abs(ec - ecIdeal)

                let rating: 'stable' | 'moderate' | 'unstable' = 'stable'
                if (phDeviation > 0.5 || ecDeviation > 0.8) {
                    rating = 'unstable'
                } else if (phDeviation > 0.3 || ecDeviation > 0.4) {
                    rating = 'moderate'
                }

                return {
                    plantId: plant.id,
                    plantName: plant.name,
                    avgPh: Math.round(ph * 10) / 10,
                    avgEc: Math.round(ec * 10) / 10,
                    phVariance: Math.round(phDeviation * 100) / 100,
                    ecVariance: Math.round(ecDeviation * 100) / 100,
                    rating,
                }
            })
    }

    private getGrowDurationStats(plants: Plant[]): GrowDurationStatEntry[] {
        const finishedPlants = plants.filter((p) => isFinishedStage(p.stage))
        if (finishedPlants.length === 0) return []

        const strainMap = new Map<string, number[]>()

        for (const plant of finishedPlants) {
            const name = plant.strain?.name ?? 'Unknown'
            const existing = strainMap.get(name) ?? []
            existing.push(plant.age ?? 0)
            strainMap.set(name, existing)
        }

        return Array.from(strainMap.entries()).map(([strainName, ages]) => ({
            strainName,
            minDays: Math.min(...ages),
            maxDays: Math.max(...ages),
            avgDays: Math.round(ages.reduce((a, b) => a + b, 0) / ages.length),
            count: ages.length,
        }))
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isFinishedStage(stage: PlantStage): boolean {
    return stage === PlantStage.Finished
}

function estimateMilestoneForPlant(plant: Plant): MilestoneEstimate | undefined {
    const age = plant.age ?? 0

    switch (plant.stage) {
        case PlantStage.Vegetative:
            // Typical flip at ~30 days vegetative
            return {
                type: 'flip',
                plantName: plant.name,
                estimatedDays: Math.max(1, 30 - age),
            }
        case PlantStage.Flowering:
            // Typical harvest at ~60-70 days flowering
            return {
                type: 'harvest',
                plantName: plant.name,
                estimatedDays: Math.max(1, 65 - age),
            }
        case PlantStage.Drying:
            // Typical drying ~10 days
            return {
                type: 'curing_done',
                plantName: plant.name,
                estimatedDays: Math.max(1, 10 - age),
            }
        case PlantStage.Seedling:
            // Transplant at ~14 days
            return {
                type: 'transplant',
                plantName: plant.name,
                estimatedDays: Math.max(1, 14 - age),
            }
        default:
            return undefined
    }
}

function severityValue(s: 'low' | 'medium' | 'high'): number {
    if (s === 'high') return 3
    if (s === 'medium') return 2
    return 1
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const analyticsService = new AnalyticsEngine()
