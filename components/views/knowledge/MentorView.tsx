import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Button } from '@/components/common/Button'
import { useActivePlants } from '@/hooks/useSimulationBridge'
import { useAppDispatch } from '@/stores/store'
import { setActiveMentorPlantId } from '@/stores/slices/uiSlice'
import { KnowledgeArticle, Plant } from '@/types'
import { knowledgeBase } from '@/data/knowledgebase'
import { Select } from '@/components/ui/ThemePrimitives'
import { Card } from '@/components/common/Card'

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
            const activeProblemTypes = plant.problems.filter((p) => p.status === 'active').map((p) => p.type)
            if (!triggers.activeProblems.some((p) => activeProblemTypes.includes(p)))
                isRelevant = false
        }
        return isRelevant
    })
}

export const MentorView: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const activePlants = useActivePlants()
    const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)

    useEffect(() => {
        if (activePlants.length > 0 && (!selectedPlantId || !activePlants.some((p) => p.id === selectedPlantId))) {
            setSelectedPlantId(activePlants[0].id)
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
                            value={selectedPlantId || ''}
                            onChange={(e) => setSelectedPlantId(e.target.value as string)}
                            options={activePlants.map((p) => ({
                                value: p.id,
                                label: `${p.name} (${t(`plantStages.${p.stage}`)})`,
                            }))}
                        />
                        <Button
                            onClick={() => dispatch(setActiveMentorPlantId(selectedPlantId))}
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

            {selectedPlantForHub && relevantArticles.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-xl font-bold font-display text-slate-100 mb-2">
                        {t('knowledgeView.hub.todaysFocus', { plantName: selectedPlantForHub.name })}
                    </h3>
                    <details
                        className="group glass-pane rounded-lg overflow-hidden ring-1 ring-inset ring-white/20"
                        open
                    >
                        <summary className="list-none flex justify-between items-center p-4 cursor-pointer">
                            <h4 className="font-semibold text-slate-100">
                                {t(relevantArticles[0].titleKey)}
                            </h4>
                            <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                        </summary>
                        <div className="p-4 border-t border-slate-700/50">
                            <div
                                className="prose prose-sm dark:prose-invert max-w-none prose-h3:text-primary-400 prose-strong:text-slate-100 prose-ul:list-disc prose-ol:list-decimal prose-li:my-1"
                                dangerouslySetInnerHTML={{ __html: t(relevantArticles[0].contentKey) }}
                            />
                        </div>
                    </details>
                </div>
            )}
        </div>
    )
}
export default MentorView