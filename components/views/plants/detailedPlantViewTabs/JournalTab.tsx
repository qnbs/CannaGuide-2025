import React, { useState, useMemo, memo } from 'react'
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

const renderDetails = (entry: JournalEntry, t: (key: string) => string): string => {
    if (!entry.details) return ''

    const detailsArray: string[] = []

    switch (entry.type) {
        case JournalEntryType.Watering: {
            const d = entry.details as WateringDetails
            if (d.amountMl) detailsArray.push(`Amount: ${d.amountMl}ml`)
            if (d.ph) detailsArray.push(`pH: ${d.ph.toFixed(2)}`)
            if (d.ec) detailsArray.push(`EC: ${d.ec.toFixed(2)}`)
            break
        }
        case JournalEntryType.Feeding: {
            const d = entry.details as FeedingDetails;
            if (d.amountMl) detailsArray.push(`Amount: ${d.amountMl}ml`);
            if (d.ph) detailsArray.push(`pH: ${d.ph.toFixed(2)}`);
            if (d.ec) detailsArray.push(`EC: ${d.ec.toFixed(2)}`);
            if (d.npk) detailsArray.push(`NPK: ${d.npk.n}-${d.npk.p}-${d.npk.k}`);
            break;
        }
        case JournalEntryType.Training: {
            const d = entry.details as TrainingDetails
            if (d.type) detailsArray.push(`Type: ${t(`plantsView.actionModals.trainingTypes.${d.type}`)}`)
            break
        }
        case JournalEntryType.Observation: {
            const d = entry.details as ObservationDetails;
            if (d.diagnosis) detailsArray.push(`Diagnosis: ${d.diagnosis}`);
            break;
        }
        case JournalEntryType.Photo: {
            const d = entry.details as PhotoDetails;
            if (d.photoCategory) detailsArray.push(`Category: ${t(`plantsView.actionModals.photo.categories.${d.photoCategory}`)}`);
            break;
        }
        case JournalEntryType.PestControl: {
            const d = entry.details as PestControlDetails
            if (d.method) detailsArray.push(`Method: ${d.method}`)
            if (d.product) detailsArray.push(`Product: ${d.product}`)
            break
        }
        case JournalEntryType.Amendment: {
            const d = entry.details as AmendmentDetails
            if (d.type) detailsArray.push(`Type: ${t(`plantsView.actionModals.amendmentTypes.${d.type}`)}`)
            break
        }
        default:
            // Generic fallback for any other types, excluding common non-display fields
            if (typeof entry.details === 'object' && entry.details !== null) {
                Object.entries(entry.details).forEach(([key, value]) => {
                    if (value && !['imageUrl', 'imageId', 'from', 'to'].includes(key)) {
                        detailsArray.push(`${key}: ${value}`)
                    }
                })
            }
    }
    return detailsArray.join(' | ')
}

export const JournalTab: React.FC<JournalTabProps> = memo(({ journal }) => {
    const { t } = useTranslation()
    const [journalFilter, setJournalFilter] = useState<JournalEntryType | 'ALL'>('ALL')

    const filteredJournal = useMemo(() => {
        if (journalFilter === 'ALL') return journal
        return journal.filter((entry) => entry.type === journalFilter)
    }, [journal, journalFilter])

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

    const journalFilterOptions: { label: string; value: JournalEntryType | 'ALL'; icon: React.ReactNode }[] =
        [
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

    return (
        <Card>
            <div className="flex flex-wrap gap-2 mb-4">
                {journalFilterOptions.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setJournalFilter(opt.value)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-colors ${
                            journalFilter === opt.value
                                ? 'bg-primary-600 text-white font-semibold'
                                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        } ring-1 ring-inset ring-white/20`}
                    >
                        {opt.icon} {opt.label}
                    </button>
                ))}
            </div>
            <ul className="space-y-4">
                {filteredJournal.length > 0 ? (
                    [...filteredJournal].reverse().map((entry) => (
                        <li
                            key={entry.id}
                            className="flex items-start gap-4 p-3 bg-slate-800 rounded-lg ring-1 ring-inset ring-white/20"
                        >
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full text-primary-400">
                                {journalTypeIcons[entry.type]}
                            </div>
                            <div className="flex-grow">
                                <p className="font-semibold text-slate-100">
                                    {String(
                                        t(entry.notes, {
                                            ...entry.details,
                                            from: t(`plantStages.${(entry.details as any)?.from}`),
                                            to: t(`plantStages.${(entry.details as any)?.to}`),
                                        }),
                                    )}
                                </p>
                                <p className="text-xs text-slate-400">{renderDetails(entry, t)}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {new Date(entry.createdAt).toLocaleString()}
                                </p>
                            </div>
                        </li>
                    ))
                ) : (
                    <p className="text-center text-slate-400 py-8">
                        {t('plantsView.detailedView.journalNoEntries')}
                    </p>
                )}
            </ul>
        </Card>
    )
});
