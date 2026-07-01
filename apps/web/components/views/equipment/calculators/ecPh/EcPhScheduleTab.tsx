import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '../common'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppDispatch } from '@/stores/store'
import {
    applyPluginSchedule,
    detachPlugin,
    getOptimalRange,
    updateScheduleEntry,
} from '@/stores/slices/nutrientPlannerSlice'
import type { NutrientScheduleEntry } from '@/stores/slices/nutrientPlannerSlice'
import type { NutrientSchedulePlugin } from '@/services/pluginService'
import { StageLabel } from './EcPhSubcomponents'

export interface EcPhScheduleTabProps {
    nutrientPlugins: NutrientSchedulePlugin[]
    schedule: NutrientScheduleEntry[]
    medium: string
}

export const EcPhScheduleTab: React.FC<EcPhScheduleTabProps> = memo(
    ({ nutrientPlugins, schedule, medium }) => {
        const { t } = useTranslation()
        const dispatch = useAppDispatch()

        return (
            <div className="space-y-3">
                {nutrientPlugins.length > 0 && (
                    <Card className="!p-4 space-y-2">
                        <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <PhosphorIcons.Lightning className="w-4 h-4 text-primary-400" />
                            {t('equipmentView.calculators.ecPhPlanner.nutrientPlugins')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {nutrientPlugins.map((plugin) => (
                                <Button
                                    key={plugin.id}
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                        dispatch(
                                            applyPluginSchedule({
                                                pluginId: plugin.id,
                                                weeks: plugin.data.weeks,
                                            }),
                                        )
                                    }
                                >
                                    {plugin.name}
                                </Button>
                            ))}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => dispatch(detachPlugin())}
                            >
                                <PhosphorIcons.X className="w-3 h-3 mr-1" />
                                {t('common.reset')}
                            </Button>
                        </div>
                    </Card>
                )}
                {schedule.map((entry) => {
                    const range = getOptimalRange(medium, entry.stage)
                    return (
                        <Card key={entry.id} className="!p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-200">
                                    <StageLabel stage={entry.stage} />
                                </h4>
                                <span className="text-[0.65rem] text-slate-500 uppercase tracking-wider">
                                    {t('equipmentView.calculators.ecPhPlanner.optimal')}: EC{' '}
                                    {range.ecMin}-{range.ecMax} | pH {range.phMin}-{range.phMax}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <Input
                                    label={t('equipmentView.calculators.ecPhPlanner.targetEc')}
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="5"
                                    value={entry.targetEc}
                                    onChange={(e) =>
                                        dispatch(
                                            updateScheduleEntry({
                                                id: entry.id,
                                                changes: { targetEc: Number(e.target.value) },
                                            }),
                                        )
                                    }
                                />
                                <Input
                                    label={t('equipmentView.calculators.ecPhPlanner.targetPh')}
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="14"
                                    value={entry.targetPh}
                                    onChange={(e) =>
                                        dispatch(
                                            updateScheduleEntry({
                                                id: entry.id,
                                                changes: { targetPh: Number(e.target.value) },
                                            }),
                                        )
                                    }
                                />
                                <Input
                                    label={t('equipmentView.calculators.ecPhPlanner.npkN')}
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={entry.npkRatio.n}
                                    onChange={(e) =>
                                        dispatch(
                                            updateScheduleEntry({
                                                id: entry.id,
                                                changes: {
                                                    npkRatio: {
                                                        ...entry.npkRatio,
                                                        n: Number(e.target.value),
                                                    },
                                                },
                                            }),
                                        )
                                    }
                                />
                                <Input
                                    label={t('equipmentView.calculators.ecPhPlanner.npkPK')}
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={entry.npkRatio.p}
                                    onChange={(e) =>
                                        dispatch(
                                            updateScheduleEntry({
                                                id: entry.id,
                                                changes: {
                                                    npkRatio: {
                                                        ...entry.npkRatio,
                                                        p: Number(e.target.value),
                                                        k: Number(e.target.value),
                                                    },
                                                },
                                            }),
                                        )
                                    }
                                />
                            </div>
                        </Card>
                    )
                })}
            </div>
        )
    },
)
EcPhScheduleTab.displayName = 'EcPhScheduleTab'
