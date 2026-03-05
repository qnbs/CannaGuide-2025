import React, { memo, useMemo } from 'react'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppSelector } from '@/stores/store'
import { selectActivePlants, selectOpenTasksSummary } from '@/stores/selectors'
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService'
import { PlantStage } from '@/types'

const ENERGY_PRICE_EUR_PER_KWH = 0.31

const growthOrder: PlantStage[] = [
    PlantStage.Seed,
    PlantStage.Germination,
    PlantStage.Seedling,
    PlantStage.Vegetative,
    PlantStage.Flowering,
    PlantStage.Harvest,
]

const totalDaysToHarvest = growthOrder.reduce((sum, stage) => {
    const duration = PLANT_STAGE_DETAILS[stage].duration
    return Number.isFinite(duration) ? sum + duration : sum
}, 0)

const GrowStatsDashboardComponent: React.FC = () => {
    const activePlants = useAppSelector(selectActivePlants)
    const openTasks = useAppSelector(selectOpenTasksSummary)

    const {
        yieldForecast,
        energyCostPerDay,
        totalTrackedCost,
        timeline,
    } = useMemo(() => {
        const yieldForecastValue = activePlants.reduce((sum, plant) => {
            if (plant.harvestData?.dryWeight) {
                return sum + plant.harvestData.dryWeight
            }
            const qualityFactor = Math.max(0.65, plant.health / 100)
            return sum + plant.biomass.flowers * 0.22 * qualityFactor
        }, 0)

        const dailyEnergyCost = activePlants.reduce((sum, plant) => {
            const dailyKwh = (plant.equipment.light.wattage * plant.equipment.light.lightHours) / 1000
            return sum + dailyKwh * ENERGY_PRICE_EUR_PER_KWH
        }, 0)

        const nutrientCostPerDay = activePlants.reduce((sum, plant) => sum + plant.medium.ec * 0.08, 0)

        const estimatedRunningCost = activePlants.reduce((sum, plant) => {
            const perPlantDailyKwh =
                (plant.equipment.light.wattage * plant.equipment.light.lightHours) / 1000
            const perPlantDailyCost = perPlantDailyKwh * ENERGY_PRICE_EUR_PER_KWH + plant.medium.ec * 0.08
            return sum + perPlantDailyCost * Math.max(1, plant.age)
        }, 0)

        const timelineItems: string[] = []

        openTasks.slice(0, 3).forEach((task) => {
            timelineItems.push(`Task: ${task.title} (${task.plantName})`)
        })

        activePlants.forEach((plant) => {
            const remainingDays = Math.max(0, Math.round(totalDaysToHarvest - plant.age))
            if (remainingDays <= 14) {
                timelineItems.push(`${plant.name}: harvest ETA ~${remainingDays} day(s)`)
            }
        })

        return {
            yieldForecast: yieldForecastValue,
            energyCostPerDay: dailyEnergyCost + nutrientCostPerDay,
            totalTrackedCost: estimatedRunningCost,
            timeline: timelineItems.slice(0, 4),
        }
    }, [activePlants, openTasks])

    return (
        <Card>
            <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-xl font-bold font-display text-primary-300">Grow Stats Dashboard</h3>
                <PhosphorIcons.ChartLineUp className="w-6 h-6 text-primary-300" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-800/60 p-3 ring-1 ring-inset ring-white/20">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Yield forecast</p>
                    <p className="text-2xl font-bold text-slate-100 mt-1">{yieldForecast.toFixed(1)} g</p>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-3 ring-1 ring-inset ring-white/20">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Cost tracker / day</p>
                    <p className="text-2xl font-bold text-slate-100 mt-1">{energyCostPerDay.toFixed(2)} EUR</p>
                </div>
                <div className="rounded-lg bg-slate-800/60 p-3 ring-1 ring-inset ring-white/20">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Tracked total</p>
                    <p className="text-2xl font-bold text-slate-100 mt-1">{totalTrackedCost.toFixed(0)} EUR</p>
                </div>
            </div>

            <div className="mt-4 rounded-lg bg-slate-900/60 p-3 ring-1 ring-inset ring-white/20">
                <p className="text-sm font-semibold text-slate-200 mb-2">Timeline</p>
                {timeline.length > 0 ? (
                    <ul className="space-y-1.5 text-sm text-slate-300">
                        {timeline.map((item, index) => (
                            <li key={`${item}-${index}`} className="flex items-center gap-2">
                                <PhosphorIcons.DotOutline className="w-4 h-4 text-primary-300" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-slate-400">No upcoming events yet.</p>
                )}
            </div>
        </Card>
    )
}

export const GrowStatsDashboard = memo(GrowStatsDashboardComponent)
