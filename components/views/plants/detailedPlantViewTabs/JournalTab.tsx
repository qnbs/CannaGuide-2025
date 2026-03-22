import React, { useState, useMemo, memo, useCallback } from 'react'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import {
    JournalEntry,
    JournalEntryType,
    WateringDetails,
    TrainingDetails,
    PestControlDetails,
    AmendmentDetails,
    FeedingDetails,
    PhotoDetails,
    ObservationDetails,
    SystemDetails,
} from '@/types'
import { useTranslation } from 'react-i18next'

interface JournalTabProps {
    journal: JournalEntry[]
}

const appendBaseFeedDetails = (
    detailsArray: string[],
    details: { amountMl?: number; ph?: number; ec?: number },
    t: (key: string) => string,
): void => {
    if (details.amountMl)
        detailsArray.push(`${t('plantsView.journal.details.amount')}: ${details.amountMl}ml`)
    if (details.ph) detailsArray.push(`pH: ${details.ph.toFixed(2)}`)
    if (details.ec) detailsArray.push(`EC: ${details.ec.toFixed(2)}`)
}

const renderWateringDetails = (
    entry: JournalEntry,
    detailsArray: string[],
    t: (key: string) => string,
): void => {
    const d = entry.details as WateringDetails
    appendBaseFeedDetails(detailsArray, d, t)
}

const renderFeedingDetails = (
    entry: JournalEntry,
    detailsArray: string[],
    t: (key: string) => string,
): void => {
    const d = entry.details as FeedingDetails
    appendBaseFeedDetails(detailsArray, d, t)
    if (d.npk) detailsArray.push(`NPK: ${d.npk.n}-${d.npk.p}-${d.npk.k}`)
}

const renderTrainingDetails = (
    entry: JournalEntry,
    detailsArray: string[],
    t: (key: string) => string,
): void => {
    const d = entry.details as TrainingDetails
    if (!d.type) return
    const translatedType = t(`plantsView.actionModals.trainingTypes.${d.type}`)
    detailsArray.push(
        `${t('plantsView.journal.details.type')}: ${translatedType}`,
    )
}

const renderObservationDetails = (
    entry: JournalEntry,
    detailsArray: string[],
    t: (key: string) => string,
): void => {
    const d = entry.details as ObservationDetails
    if (d.diagnosis)
        detailsArray.push(`${t('plantsView.journal.details.diagnosis')}: ${d.diagnosis}`)
}

const renderPhotoDetails = (
    entry: JournalEntry,
    detailsArray: string[],
    t: (key: string) => string,
): void => {
    const d = entry.details as PhotoDetails
    if (d.photoCategory) {
        const translatedCategory = t(`plantsView.actionModals.photo.categories.${d.photoCategory}`)
        detailsArray.push(
            `${t('plantsView.journal.details.category')}: ${translatedCategory}`,
        )
    }
    if (d.timelineLabel)
        detailsArray.push(`${t('plantsView.journal.details.timeline')}: ${d.timelineLabel}`)
}

const renderPestControlDetails = (
    entry: JournalEntry,
    detailsArray: string[],
    t: (key: string) => string,
): void => {
    const d = entry.details as PestControlDetails
    if (d.method) detailsArray.push(`${t('plantsView.journal.details.method')}: ${d.method}`)
    if (d.product) detailsArray.push(`${t('plantsView.journal.details.product')}: ${d.product}`)
}

const renderAmendmentDetails = (
    entry: JournalEntry,
    detailsArray: string[],
    t: (key: string) => string,
): void => {
    const d = entry.details as AmendmentDetails
    if (!d.type) return
    const translatedType = t(`plantsView.actionModals.amendmentTypes.${d.type}`)
    detailsArray.push(
        `${t('plantsView.journal.details.type')}: ${translatedType}`,
    )
}

const renderGenericDetails = (entry: JournalEntry, detailsArray: string[]): void => {
    if (typeof entry.details !== 'object' || entry.details === null) {
        return
    }

    Object.entries(entry.details).forEach(([key, value]) => {
        if (value && !['imageUrl', 'imageId', 'from', 'to'].includes(key)) {
            detailsArray.push(`${key}: ${value}`)
        }
    })
}

const renderDetails = (entry: JournalEntry, t: (key: string) => string): string => {
    if (!entry.details) return ''

    const detailsArray: string[] = []

    switch (entry.type) {
        case JournalEntryType.Watering:
            renderWateringDetails(entry, detailsArray, t)
            break
        case JournalEntryType.Feeding:
            renderFeedingDetails(entry, detailsArray, t)
            break
        case JournalEntryType.Training:
            renderTrainingDetails(entry, detailsArray, t)
            break
        case JournalEntryType.Observation:
            renderObservationDetails(entry, detailsArray, t)
            break
        case JournalEntryType.Photo:
            renderPhotoDetails(entry, detailsArray, t)
            break
        case JournalEntryType.PestControl:
            renderPestControlDetails(entry, detailsArray, t)
            break
        case JournalEntryType.Amendment:
            renderAmendmentDetails(entry, detailsArray, t)
            break
        default:
            renderGenericDetails(entry, detailsArray)
    }
    return detailsArray.join(' · ')
}

const getDateGroupKey = (timestamp: number): string => {
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const formatDateGroup = (key: string): string => {
    const [year = 0, month = 1, day = 1] = key.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export const JournalTab: React.FC<JournalTabProps> = memo(({ journal }) => {
    const { t } = useTranslation()
    const [journalFilter, setJournalFilter] = useState<JournalEntryType | 'ALL'>('ALL')

    const filteredJournal = useMemo(() => {
        if (journalFilter === 'ALL') return journal
        return journal.filter((entry) => entry.type === journalFilter)
    }, [journal, journalFilter])

    // Group entries by date (newest first)
    const groupedEntries = useMemo(() => {
        const reversed = [...filteredJournal].reverse()
        const groups = new Map<string, JournalEntry[]>()
        for (const entry of reversed) {
            const key = getDateGroupKey(entry.createdAt)
            const existing = groups.get(key)
            if (existing) {
                existing.push(entry)
            } else {
                groups.set(key, [entry])
            }
        }
        return groups
    }, [filteredJournal])

    // Count entries by type for filter badges
    const entryCounts = useMemo(() => {
        const counts = new Map<JournalEntryType | 'ALL', number>()
        counts.set('ALL', journal.length)
        for (const entry of journal) {
            counts.set(entry.type, (counts.get(entry.type) ?? 0) + 1)
        }
        return counts
    }, [journal])

    const journalTypeIcons: Record<JournalEntryType, React.ReactNode> = {
        [JournalEntryType.Watering]: <PhosphorIcons.Drop />,
        [JournalEntryType.Feeding]: <PhosphorIcons.TestTube />,
        [JournalEntryType.Training]: <PhosphorIcons.Scissors />,
        [JournalEntryType.Observation]: <PhosphorIcons.MagnifyingGlass />,
        [JournalEntryType.System]: <PhosphorIcons.Gear />,
        [JournalEntryType.Photo]: <PhosphorIcons.Camera />,
        [JournalEntryType.PestControl]: <PhosphorIcons.WarningCircle />,
        [JournalEntryType.Environment]: <PhosphorIcons.Fan />,
        [JournalEntryType.Amendment]: <PhosphorIcons.Flask />,
        [JournalEntryType.Harvest]: <PhosphorIcons.ArchiveBox />,
        [JournalEntryType.PostHarvest]: <PhosphorIcons.ArchiveBox />,
    }

    const journalFilterOptions: {
        label: string
        value: JournalEntryType | 'ALL'
        icon: React.ReactNode
    }[] = [
        { label: t('common.all'), value: 'ALL', icon: <PhosphorIcons.ListChecks /> },
        {
            label: t('plantsView.detailedView.journalFilters.watering'),
            value: JournalEntryType.Watering,
            icon: <PhosphorIcons.Drop />,
        },
        {
            label: t('plantsView.detailedView.journalFilters.feeding'),
            value: JournalEntryType.Feeding,
            icon: <PhosphorIcons.TestTube />,
        },
        {
            label: t('plantsView.detailedView.journalFilters.training'),
            value: JournalEntryType.Training,
            icon: <PhosphorIcons.Scissors />,
        },
        {
            label: t('plantsView.detailedView.journalFilters.observation'),
            value: JournalEntryType.Observation,
            icon: <PhosphorIcons.MagnifyingGlass />,
        },
        {
            label: t('plantsView.detailedView.journalFilters.pestControl'),
            value: JournalEntryType.PestControl,
            icon: <PhosphorIcons.WarningCircle />,
        },
        {
            label: t('plantsView.detailedView.journalFilters.amendment'),
            value: JournalEntryType.Amendment,
            icon: <PhosphorIcons.Flask />,
        },
        {
            label: t('plantsView.detailedView.journalFilters.system'),
            value: JournalEntryType.System,
            icon: <PhosphorIcons.Gear />,
        },
        {
            label: t('plantsView.detailedView.journalFilters.photo'),
            value: JournalEntryType.Photo,
            icon: <PhosphorIcons.Camera />,
        },
        {
            label: t('plantsView.detailedView.journalFilters.environment'),
            value: JournalEntryType.Environment,
            icon: <PhosphorIcons.Fan />,
        },
    ]

    const handleFilterChange = useCallback(
        (value: JournalEntryType | 'ALL') => setJournalFilter(value),
        [],
    )

    const getFilterButtonClassName = (isSelected: boolean): string => {
        const stateClassName = isSelected
            ? 'bg-primary-600 text-white font-semibold'
            : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
        return `flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors ${stateClassName} ring-1 ring-inset ring-white/20`
    }

    const getFilterCountClassName = (isSelected: boolean): string => {
        return isSelected
            ? 'text-[10px] rounded-full px-1.5 py-0.5 bg-white/20 text-white'
            : 'text-[10px] rounded-full px-1.5 py-0.5 bg-slate-700 text-slate-400'
    }

    return (
        <Card>
            {/* Filter bar with entry counts */}
            <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-sm text-slate-400 flex-shrink-0">
                    {filteredJournal.length}{' '}
                    {t('plantsView.detailedView.journalEntries', { defaultValue: 'entries' })}
                </p>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
                {journalFilterOptions.map((opt) => {
                    const count = entryCounts.get(opt.value) ?? 0
                    const isSelected = journalFilter === opt.value
                    return (
                        <button
                            type="button"
                            key={opt.value}
                            onClick={() => handleFilterChange(opt.value)}
                            className={getFilterButtonClassName(isSelected)}
                        >
                            <span className="w-4 h-4">{opt.icon}</span>
                            <span>{opt.label}</span>
                            {count > 0 && (
                                <span className={getFilterCountClassName(isSelected)}>
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Grouped journal entries */}
            {filteredJournal.length > 0 ? (
                <div className="space-y-6">
                    {[...groupedEntries.entries()].map(([dateKey, entries]) => (
                        <div key={dateKey}>
                            <div className="flex items-center gap-3 mb-3">
                                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                                    {formatDateGroup(dateKey)}
                                </h4>
                                <div className="flex-grow h-px bg-slate-700/60" />
                                <span className="text-xs text-slate-500">{entries.length}</span>
                            </div>
                            <ul className="space-y-3">
                                {entries.map((entry) =>
                                    (() => {
                                        const detailsText = renderDetails(entry, t)
                                        return (
                                            <li
                                                key={entry.id}
                                                className="flex items-start gap-4 p-3 bg-slate-800 rounded-lg ring-1 ring-inset ring-white/10 hover:ring-white/20 transition-colors"
                                            >
                                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full text-primary-400">
                                                    {journalTypeIcons[entry.type]}
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <p className="font-semibold text-slate-100">
                                                        {String(
                                                            t(entry.notes, {
                                                                ...entry.details,
                                                                from: t(
                                                                    `plantStages.${(entry.details as SystemDetails)?.from}`,
                                                                ),
                                                                to: t(
                                                                    `plantStages.${(entry.details as SystemDetails)?.to}`,
                                                                ),
                                                            }),
                                                        )}
                                                    </p>
                                                    {detailsText && (
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {detailsText}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {new Date(
                                                            entry.createdAt,
                                                        ).toLocaleTimeString(undefined, {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>
                                            </li>
                                        )
                                    })(),
                                )}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-slate-400 py-8">
                    {t('plantsView.detailedView.journalNoEntries')}
                </p>
            )}
        </Card>
    )
})

JournalTab.displayName = 'JournalTab'
