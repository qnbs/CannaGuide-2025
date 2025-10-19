import React, { useMemo, useState } from 'react'
import { Card } from '@/components/common/Card'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { ArchivedAdvisorResponse, Plant } from '@/types'
import { selectArchivedAdvisorResponses } from '@/stores/selectors'
import { Button } from '@/components/common/Button'
import { useActivePlants } from '@/hooks/useSimulationBridge'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { addNotification } from '@/stores/slices/uiSlice'
import { SearchBar } from '@/components/common/SearchBar'

export const GlobalAdvisorArchiveView: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const archive = useAppSelector(selectArchivedAdvisorResponses)
    const activePlants = useActivePlants()

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedIds, setSelectedIds] = useState(new Set<string>())

    const allAdvice = useMemo<(ArchivedAdvisorResponse & { plantName: string })[]>(() => {
        const plantMap = new Map<string, string>()
        const allKnownPlants: Plant[] = [...activePlants] // In a real scenario, you might merge with archived plants

        allKnownPlants.forEach((p) => plantMap.set(p.id, p.name))

        return Object.values(archive)
            .flat()
            .map((advice: ArchivedAdvisorResponse) => ({
                ...advice,
                plantName: plantMap.get(advice.plantId) || t('plantsView.archivedPlant'),
            }))
            .sort((a, b) => b.createdAt - a.createdAt)
    }, [archive, activePlants, t])

    const filteredAdvice = useMemo(() => {
        if (!searchTerm) return allAdvice
        const lowerCaseSearch = searchTerm.toLowerCase()
        return allAdvice.filter(
            (advice) =>
                advice.title.toLowerCase().includes(lowerCaseSearch) ||
                advice.content.toLowerCase().includes(lowerCaseSearch) ||
                advice.plantName.toLowerCase().includes(lowerCaseSearch),
        )
    }, [allAdvice, searchTerm])

    const handleToggleSelection = (id: string) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(id)) newSet.delete(id)
            else newSet.add(id)
            return newSet
        })
    }

    const handleToggleAll = () => {
        if (selectedIds.size === filteredAdvice.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredAdvice.map((advice) => advice.id)))
        }
    }

    return (
        <Card className="ring-1 ring-inset ring-white/20">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2">
                    <PhosphorIcons.ArchiveBox className="w-6 h-6" />
                    {t('plantsView.aiAdvisor.archiveTitle')}
                </h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex-grow">
                        <SearchBar
                            placeholder={t('strainsView.tips.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 -mr-4">
                {filteredAdvice.length > 0 ? (
                    <>
                        <div className="px-1 flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={
                                    selectedIds.size === filteredAdvice.length && filteredAdvice.length > 0
                                }
                                onChange={handleToggleAll}
                                className="custom-checkbox"
                            />
                            <label className="text-sm text-slate-400">
                                {t('strainsView.selectedCount', { count: selectedIds.size })}
                            </label>
                        </div>
                        {filteredAdvice.map((res) => {
                            const isProactive = res.query === t('ai.proactiveDiagnosis')
                            return (
                                <Card
                                    key={res.id}
                                    className="bg-slate-800/70 p-3 flex items-start gap-3"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(res.id)}
                                        onChange={() => handleToggleSelection(res.id)}
                                        className="custom-checkbox mt-1.5 flex-shrink-0"
                                    />
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <h4
                                                className={`font-bold mt-1 ${
                                                    isProactive ? 'text-amber-300' : 'text-primary-300'
                                                } flex items-center gap-2`}
                                            >
                                                {isProactive && (
                                                    <PhosphorIcons.FirstAidKit className="w-5 h-5" />
                                                )}
                                                {res.title}
                                            </h4>
                                            <div className="text-xs text-slate-400 text-right flex-shrink-0 ml-2">
                                                <p className="font-semibold">{res.plantName}</p>
                                                <p>{new Date(res.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div
                                            className="prose prose-sm dark:prose-invert max-w-none mt-2"
                                            dangerouslySetInnerHTML={{ __html: res.content }}
                                        ></div>
                                    </div>
                                </Card>
                            )
                        })}
                    </>
                ) : (
                    <div className="text-center py-10 text-slate-500">
                        <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-slate-500 mb-2" />
                        <h3 className="font-semibold text-slate-300">
                            {t('knowledgeView.archive.empty')}
                        </h3>
                    </div>
                )}
            </div>
        </Card>
    )
}