import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Button } from '@/components/common/Button'
import { useActivePlants } from '@/hooks/useSimulationBridge'
import { useUIStore } from '@/stores/useUIStore'
import { KnowledgeArticle, Plant } from '@/types'
import { knowledgeBase } from '@/data/knowledgebase'
import { Select } from '@/components/ui/form'
import { Card } from '@/components/common/Card'
import { GrowLogRagPanel } from './GrowLogRagPanel'
import { SafeHtml } from '@/components/common/SafeHtml'

const getRelevantArticles = (plant: Plant): KnowledgeArticle[] => {
    return knowledgeBase.filter((article) => {
        const { triggers } = article
        let isRelevant = true
        if (triggers.plantStage) {
            const stages = Array.isArray(triggers.plantStage)
                ? triggers.plantStage
                : [triggers.plantStage]
            if (!stages.includes(plant.stage)) isRelevant = false
        }
        if (isRelevant && triggers.ageInDays) {
            if (plant.age < triggers.ageInDays.min || plant.age > triggers.ageInDays.max)
                isRelevant = false
        }
        if (isRelevant && triggers.activeProblems) {
            const activeProblemTypes = new Set(
                plant.problems
                    .filter((problem) => problem.status === 'active')
                    .map((problem) => problem.type),
            )
            if (!triggers.activeProblems.some((problemType) => activeProblemTypes.has(problemType)))
                isRelevant = false
        }
        return isRelevant
    })
}

export const MentorView: React.FC = () => {
    const { t } = useTranslation()
    const activePlants = useActivePlants()
    const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)

    useEffect(() => {
        const hasPlants = activePlants.length > 0
        const hasSelectedPlant = Boolean(selectedPlantId)
        const selectedPlantExists = hasSelectedPlant
            ? activePlants.some((p) => p.id === selectedPlantId)
            : false

        if (hasPlants && (!hasSelectedPlant || !selectedPlantExists)) {
            setSelectedPlantId(activePlants[0]?.id ?? null)
        } else if (activePlants.length === 0) {
            setSelectedPlantId(null)
        }
    }, [activePlants, selectedPlantId])

    const selectedPlantForHub = useMemo(
        () => activePlants.find((p) => p.id === selectedPlantId),
        [activePlants, selectedPlantId],
    )

    const relevantArticles = useMemo(() => {
        if (!selectedPlantForHub) return []
        return getRelevantArticles(selectedPlantForHub)
    }, [selectedPlantForHub])

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2">
                    <PhosphorIcons.Brain className="w-6 h-6" /> {t('knowledgeView.aiMentor.title')}
                </h3>
                <p className="text-sm text-slate-400 mt-2">
                    {t('knowledgeView.aiMentor.plantContextSubtitle')}
                </p>
            </div>

            {activePlants.length > 0 ? (
                <Card className="!p-4 bg-slate-800/50">
                    <div className="space-y-3">
                        <Select
                            label={t('knowledgeView.hub.selectPlant')}
                            value={selectedPlantId ?? ''}
                            onChange={(e: { target: { value: string | number } }) =>
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                                setSelectedPlantId(e.target.value as string)
                            }
                            options={activePlants.map((p) => {
                                const stageLabel = t(`plantStages.${p.stage}`)
                                return {
                                    value: p.id,
                                    label: `${p.name} (${stageLabel})`,
                                }
                            })}
                        />
                        <Button
                            onClick={() =>
                                useUIStore.getState().setActiveMentorPlantId(selectedPlantId)
                            }
                            disabled={!selectedPlantId}
                            className="w-full"
                        >
                            {t('knowledgeView.aiMentor.startChat')}{' '}
                            <PhosphorIcons.ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                    </div>
                </Card>
            ) : (
                <p className="text-slate-400 text-sm text-center py-4">
                    {t('knowledgeView.hub.noPlants')}
                </p>
            )}

            {selectedPlantForHub &&
                relevantArticles.length > 0 &&
                (() => {
                    const firstArticle = relevantArticles[0]
                    if (!firstArticle) return null
                    return (
                        <div className="mt-4">
                            <h3 className="text-xl font-bold font-display text-slate-100 mb-2">
                                {t('knowledgeView.hub.todaysFocus', {
                                    plantName: selectedPlantForHub.name,
                                })}
                            </h3>
                            <details
                                className="group glass-pane rounded-lg overflow-hidden ring-1 ring-inset ring-white/20"
                                open
                            >
                                <summary className="list-none flex justify-between items-center p-4 cursor-pointer">
                                    <h4 className="font-semibold text-slate-100">
                                        {t(firstArticle.titleKey)}
                                    </h4>
                                    <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                                </summary>
                                <div className="p-4 border-t border-slate-700/50">
                                    <SafeHtml
                                        className="prose prose-sm dark:prose-invert max-w-none prose-h3:text-primary-400 prose-strong:text-slate-100 prose-ul:list-disc prose-ol:list-decimal prose-li:my-1"
                                        html={t(firstArticle.contentKey)}
                                    />
                                </div>
                            </details>
                        </div>
                    )
                })()}

            <GrowLogRagPanel />
        </div>
    )
}
export default MentorView
