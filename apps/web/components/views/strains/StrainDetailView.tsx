import React, { useState, useEffect } from 'react'
import { Strain, StrainType } from '@/types'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectHasAvailableSlots, selectFavoriteIds } from '@/stores/selectors'
import { toggleFavorite } from '@/stores/slices/favoritesSlice'
import { initiateGrowFromStrainList } from '@/stores/slices/uiSlice'
import { updateNote, undoNoteChange, redoNoteChange } from '@/stores/slices/notesSlice'
import { StrainAiTips } from './StrainAiTips'
import { Tabs } from '@/components/common/Tabs'
import { InfoSection } from '@/components/common/InfoSection'
import { AttributeDisplay } from '@/components/common/AttributeDisplay'
import { Speakable } from '@/components/common/Speakable'
import { StrainImageGalleryTab } from './StrainImageGalleryTab'

// --- Sub-components for better structure ---

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1 rounded-full">
        {children}
    </span>
)

const DifficultyMeter: React.FC<{ difficulty: Strain['agronomic']['difficulty'] }> = ({
    difficulty,
}) => {
    const { t } = useTranslation()
    const safeDifficulty =
        difficulty === 'Easy' || difficulty === 'Medium' || difficulty === 'Hard'
            ? difficulty
            : 'Medium'
    const difficultyLabels: Record<'Easy' | 'Medium' | 'Hard', string> = {
        Easy: t('strainsView.difficulty.easy'),
        Medium: t('strainsView.difficulty.medium'),
        Hard: t('strainsView.difficulty.hard'),
    }
    const difficultyMap = {
        Easy: { level: 1, color: 'text-success' },
        Medium: { level: 2, color: 'text-warning' },
        Hard: { level: 3, color: 'text-danger' },
    }
    const { level, color } = difficultyMap[safeDifficulty] ?? difficultyMap.Medium

    return (
        <div
            className="flex items-center gap-2 justify-end"
            title={difficultyLabels[safeDifficulty]}
        >
            <span>{difficultyLabels[safeDifficulty]}</span>
            <div className="flex">
                {[1, 2, 3].map((marker) => (
                    <PhosphorIcons.Cannabis
                        key={`difficulty-marker-${marker}`}
                        className={`w-5 h-5 ${marker <= level ? color : 'text-slate-700'}`}
                    />
                ))}
            </div>
        </div>
    )
}

const OverviewTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslation()
    const safeThc =
        typeof strain.thc === 'number' && Number.isFinite(strain.thc)
            ? `${strain.thc.toFixed(1)}%`
            : 'N/A'
    const safeCbd =
        typeof strain.cbd === 'number' && Number.isFinite(strain.cbd)
            ? `${strain.cbd.toFixed(1)}%`
            : 'N/A'
    const description = t(`strainsData.${strain.id}.description`, {
        defaultValue: strain.description || 'No description available.',
    })
    const genetics = t(`strainsData.${strain.id}.genetics`, { defaultValue: strain.genetics ?? '' })

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoSection title={t('common.description')}>
                <Speakable elementId={`strain-desc-${strain.id}`}>
                    <p className="text-slate-300 italic text-sm">{description}</p>
                </Speakable>
            </InfoSection>
            <InfoSection title={t('strainsView.strainDetail.cannabinoidProfile')}>
                <div className="space-y-2">
                    <AttributeDisplay label={t('common.genetics')} value={genetics} />
                    <AttributeDisplay
                        label={t('strainsView.table.thc')}
                        value={strain.thcRange || safeThc}
                    />
                    <AttributeDisplay
                        label={t('strainsView.table.cbd')}
                        value={strain.cbdRange || safeCbd}
                    />
                </div>
            </InfoSection>
        </div>
    )
}

const AgronomicsTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslation()
    const yieldIndoor = t(`strainsData.${strain.id}.yieldDetails.indoor`, {
        defaultValue: strain.agronomic?.yieldDetails?.indoor ?? '',
    })
    const yieldOutdoor = t(`strainsData.${strain.id}.yieldDetails.outdoor`, {
        defaultValue: strain.agronomic?.yieldDetails?.outdoor ?? '',
    })
    const heightIndoor = t(`strainsData.${strain.id}.heightDetails.indoor`, {
        defaultValue: strain.agronomic?.heightDetails?.indoor ?? '',
    })
    const heightOutdoor = t(`strainsData.${strain.id}.heightDetails.outdoor`, {
        defaultValue: strain.agronomic?.heightDetails?.outdoor ?? '',
    })
    return (
        <InfoSection title={t('strainsView.strainModal.agronomicData')}>
            <div className="space-y-2">
                <AttributeDisplay
                    label={t('strainsView.strainModal.difficulty')}
                    value={
                        <DifficultyMeter difficulty={strain.agronomic?.difficulty ?? 'Medium'} />
                    }
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.yieldIndoor')}
                    value={yieldIndoor}
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.yieldOutdoor')}
                    value={yieldOutdoor}
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.heightIndoor')}
                    value={heightIndoor}
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.heightOutdoor')}
                    value={heightOutdoor}
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.floweringTime')}
                    value={`${strain.floweringTimeRange || strain.floweringTime} ${t('common.units.weeks')}`}
                />
            </div>
        </InfoSection>
    )
}

const ProfileTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslation()
    const aromas = Array.isArray(strain.aromas)
        ? strain.aromas.filter((item): item is string => typeof item === 'string')
        : []
    const terpenes = Array.isArray(strain.dominantTerpenes)
        ? strain.dominantTerpenes.filter((item): item is string => typeof item === 'string')
        : []
    return (
        <InfoSection title={t('strainsView.strainDetail.aromaProfile')}>
            <div className="space-y-4">
                <AttributeDisplay
                    label={t('strainsView.strainModal.aromas')}
                    value={
                        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                            {aromas.map((a) => (
                                <Tag key={a}>{t(`common.aromas.${a}`, { defaultValue: a })}</Tag>
                            ))}
                        </div>
                    }
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.dominantTerpenes')}
                    value={
                        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                            {terpenes.map((terp) => (
                                <Tag key={terp}>
                                    {t(`common.terpenes.${terp}`, { defaultValue: terp })}
                                </Tag>
                            ))}
                        </div>
                    }
                />
            </div>
        </InfoSection>
    )
}

const NotesTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const noteHistory = useAppSelector((state) => state.notes.strainNotes[strain.id])

    const canUndo = noteHistory && noteHistory.past.length > 0
    const canRedo = noteHistory && noteHistory.future.length > 0
    const noteContent = noteHistory ? noteHistory.present : ''

    const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        dispatch(updateNote({ strainId: strain.id, note: e.target.value }))
    }

    return (
        <InfoSection title={t('strainsView.strainModal.notes')}>
            <div className="bg-slate-800 rounded-md border border-slate-700">
                <div className="flex items-center p-2 border-b border-slate-700 gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => dispatch(undoNoteChange({ strainId: strain.id }))}
                        disabled={!canUndo}
                        className="!h-11 !w-11 !p-0"
                        aria-label={t('common.undo')}
                    >
                        <PhosphorIcons.ArrowClockwise className="w-4 h-4 transform scale-x-[-1]" />
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => dispatch(redoNoteChange({ strainId: strain.id }))}
                        disabled={!canRedo}
                        className="!h-11 !w-11 !p-0"
                        aria-label={t('common.redo')}
                    >
                        <PhosphorIcons.ArrowClockwise className="w-4 h-4" />
                    </Button>
                </div>
                <textarea
                    value={noteContent}
                    onChange={handleNoteChange}
                    className="w-full bg-transparent resize-none min-h-[180px] p-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 rounded-b-md"
                    placeholder={t('strainsView.addStrainModal.aromasPlaceholder')}
                />
            </div>
        </InfoSection>
    )
}

interface StrainDetailViewProps {
    strain: Strain
    onBack: () => void
}

export const StrainDetailView: React.FC<StrainDetailViewProps> = ({ strain, onBack }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const favoriteIds = useAppSelector(selectFavoriteIds) ?? new Set<string>()
    const isFavorite = favoriteIds.has(strain.id)
    const hasAvailableSlots = useAppSelector(selectHasAvailableSlots)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        setActiveTab('overview')
    }, [strain])

    const tabs: { id: string; label: string; icon: React.ReactNode }[] = [
        {
            id: 'overview',
            label: t('strainsView.strainDetail.tabs.overview'),
            icon: <PhosphorIcons.Book />,
        },
        {
            id: 'agronomics',
            label: t('strainsView.strainDetail.tabs.agronomics'),
            icon: <PhosphorIcons.Ruler />,
        },
        {
            id: 'profile',
            label: t('strainsView.strainDetail.tabs.profile'),
            icon: <PhosphorIcons.Sparkle />,
        },
        {
            id: 'notes',
            label: t('strainsView.strainDetail.tabs.notes'),
            icon: <PhosphorIcons.BookOpenText />,
        },
        {
            id: 'aiTips',
            label: t('strainsView.strainDetail.tabs.aiTips'),
            icon: <PhosphorIcons.Brain />,
        },
        {
            id: 'images',
            label: t('strainsView.strainDetail.tabs.images'),
            icon: <PhosphorIcons.Camera />,
        },
    ]

    const typeClasses: Record<StrainType, string> = {
        [StrainType.Sativa]: 'text-accent-400',
        [StrainType.Indica]: 'text-secondary-400',
        [StrainType.Hybrid]: 'text-primary-400',
    }
    const TypeIcon =
        {
            [StrainType.Sativa]: SativaIcon,
            [StrainType.Indica]: IndicaIcon,
            [StrainType.Hybrid]: HybridIcon,
        }[strain.type] ?? HybridIcon

    const typeDetails = t(`strainsData.${strain.id}.typeDetails`, {
        defaultValue: strain.typeDetails ?? '',
    })

    return (
        <div className="space-y-6">
            <header>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                        variant="secondary"
                        onClick={onBack}
                        className="min-h-11 w-full sm:w-auto"
                    >
                        <PhosphorIcons.ArrowLeft className="w-5 h-5 mr-1" />
                        {t('common.back')}
                    </Button>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div
                            title={
                                !hasAvailableSlots
                                    ? t('plantsView.notifications.allSlotsFull')
                                    : undefined
                            }
                        >
                            <Button
                                onClick={() => dispatch(initiateGrowFromStrainList(strain))}
                                disabled={!hasAvailableSlots}
                                className="inline-flex min-h-11 w-full sm:w-auto"
                            >
                                {t('strainsView.startGrowing')}
                            </Button>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => dispatch(toggleFavorite(strain.id))}
                            aria-pressed={isFavorite}
                            className={`favorite-btn-glow !h-11 !w-11 !p-0 ${isFavorite ? 'is-favorite' : ''}`}
                        >
                            <PhosphorIcons.Heart
                                weight={isFavorite ? 'fill' : 'regular'}
                                className="w-5 h-5"
                            />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                    <TypeIcon
                        className={`w-12 h-12 flex-shrink-0 ${typeClasses[strain.type] ?? typeClasses[StrainType.Hybrid]}`}
                    />
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold font-display text-primary-300">
                            {typeof strain.name === 'string' && strain.name.trim() !== ''
                                ? strain.name
                                : t('strainsView.unknownStrain')}
                        </h1>
                        <p className="text-slate-300">
                            {strain.type ?? StrainType.Hybrid} {typeDetails && `- ${typeDetails}`}
                        </p>
                    </div>
                </div>
            </header>

            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="mt-6">
                {activeTab === 'overview' && <OverviewTab strain={strain} />}
                {activeTab === 'agronomics' && <AgronomicsTab strain={strain} />}
                {activeTab === 'profile' && <ProfileTab strain={strain} />}
                {activeTab === 'notes' && <NotesTab strain={strain} />}
                {activeTab === 'aiTips' && <StrainAiTips strain={strain} />}
                {activeTab === 'images' && <StrainImageGalleryTab strain={strain} />}
            </div>
        </div>
    )
}
