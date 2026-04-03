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
    readonly description: string
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
                    description: `${plant.name} health is critically low at ${plant.health}%`,
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
                    description: `${plant.name} VPD out of range: ${plant.environment.vpd.toFixed(2)} kPa`,
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
                            description: `${plant.name}: ${prob.type} (severity ${prob.severity}/10)`,
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
                            description: `${plant.name}: Overdue task - ${task.title}`,
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
                    titleKey: 'analytics.recommendations.adjustVpd',
                    descriptionKey: 'analytics.recommendations.adjustVpdDesc',
                    relatedPlantId: plant.id,
                })
            }

            // Vegetative stage -> suggest training
            if (plant.stage === PlantStage.Vegetative && plant.age && plant.age > 21) {
                recs.push({
                    id: `train-${plant.id}`,
                    category: 'training',
                    priority: 'medium',
                    titleKey: 'analytics.recommendations.considerTraining',
                    descriptionKey: 'analytics.recommendations.considerTrainingDesc',
                    relatedPlantId: plant.id,
                })
            }

            // Flowering late stage -> harvest timing
            if (plant.stage === PlantStage.Flowering && plant.age && plant.age > 60) {
                recs.push({
                    id: `harvest-${plant.id}`,
                    category: 'harvest',
                    priority: 'high',
                    titleKey: 'analytics.recommendations.checkTrichomes',
                    descriptionKey: 'analytics.recommendations.checkTrichomesDesc',
                    relatedPlantId: plant.id,
                })
            }

            // Low health -> general advice
            if (plant.health < 70) {
                recs.push({
                    id: `health-${plant.id}`,
                    category: 'general',
                    priority: plant.health < 50 ? 'high' : 'medium',
                    titleKey: 'analytics.recommendations.improveHealth',
                    descriptionKey: 'analytics.recommendations.improveHealthDesc',
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
