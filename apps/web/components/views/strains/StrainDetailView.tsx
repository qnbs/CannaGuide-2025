import React, { useState, useEffect } from 'react'
import { Strain, StrainType } from '@/types'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectHasAvailableSlots, selectFavoriteIds } from '@/stores/selectors'
import { toggleFavorite } from '@/stores/slices/favoritesSlice'
import { initiateGrowFromStrainList } from '@/stores/useUIStore'
import { StrainAiTips } from './StrainAiTips'
import { Tabs } from '@/components/common/Tabs'
import { StrainImageGalleryTab } from './StrainImageGalleryTab'
import { AvailabilityTab } from './AvailabilityTab'
import { OverviewTab } from './strainDetail/OverviewTab'
import { AgronomicsTab } from './strainDetail/AgronomicsTab'
import { ProfileTab } from './strainDetail/ProfileTab'
import { NotesTab } from './strainDetail/NotesTab'

interface StrainDetailViewProps {
    strain: Strain
    onBack: () => void
    onNavigateToGenealogy?: (strainId: string) => void
}

export const StrainDetailView: React.FC<StrainDetailViewProps> = ({
    strain,
    onBack,
    onNavigateToGenealogy,
}) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const favoriteIds = useAppSelector(selectFavoriteIds) ?? new Set<string>()
    const isFavorite = favoriteIds.has(strain.id)
    const hasAvailableSlots = useAppSelector(selectHasAvailableSlots)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        setActiveTab('overview')
    }, [strain])

    // Scroll to top when strain detail opens or strain changes
    useEffect(() => {
        const mainEl = document.getElementById('main-content')
        if (mainEl) {
            mainEl.scrollTop = 0
        }
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
        {
            id: 'availability',
            label: t('strainsView.strainDetail.tabs.availability', { defaultValue: 'Seedbanks' }),
            icon: <PhosphorIcons.Storefront />,
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
                                onClick={() => initiateGrowFromStrainList(strain)}
                                disabled={!hasAvailableSlots}
                                className="inline-flex min-h-11 w-full sm:w-auto"
                            >
                                {t('strainsView.startGrowing')}
                            </Button>
                        </div>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => dispatch(toggleFavorite(strain.id))}
                            aria-pressed={isFavorite}
                            aria-label={
                                isFavorite
                                    ? t('strainsView.accessibility.removeFromFavorites', {
                                          name: strain.name,
                                      })
                                    : t('strainsView.accessibility.addToFavorites', {
                                          name: strain.name,
                                      })
                            }
                            className={`favorite-btn-glow ${isFavorite ? 'is-favorite' : ''}`}
                        >
                            <PhosphorIcons.Heart
                                weight={isFavorite ? 'fill' : 'regular'}
                                className="w-5 h-5"
                            />
                        </Button>
                        {onNavigateToGenealogy && (
                            <Button
                                variant="secondary"
                                size="icon"
                                onClick={() => onNavigateToGenealogy(strain.id)}
                                aria-label={t('strainsView.strainDetail.viewGenealogy')}
                                title={t('strainsView.strainDetail.viewGenealogyTooltip')}
                            >
                                <PhosphorIcons.TreeStructure className="w-5 h-5" />
                            </Button>
                        )}
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
                {activeTab === 'availability' && <AvailabilityTab strain={strain} />}
            </div>
        </div>
    )
}
