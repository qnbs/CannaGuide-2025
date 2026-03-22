import React, { useState, useEffect, useMemo } from 'react'
import { Strain } from '@/types'
import { useAppSelector } from '@/stores/store'
import { strainService } from '@/services/strainService'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { selectUserStrains, selectFavoriteIds } from '@/stores/selectors'
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons'
import { SearchBar } from '@/components/common/SearchBar'
import { compareText } from './compareText'

interface InlineStrainSelectorProps {
    onClose: () => void
    onSelectStrain: (strain: Strain) => void
}

const DifficultyMeter: React.FC<{ difficulty: Strain['agronomic']['difficulty'] }> = ({
    difficulty,
}) => {
    const { t } = useTranslation()
    const safeDifficulty =
        difficulty === 'Easy' || difficulty === 'Medium' || difficulty === 'Hard'
            ? difficulty
            : 'Medium'
    const difficultyMap = { Easy: 1, Medium: 2, Hard: 3 }
    const level = difficultyMap[safeDifficulty] || 2
    const color =
        {
            Easy: 'text-green-400',
            Medium: 'text-amber-400',
            Hard: 'text-red-400',
        }[safeDifficulty] ?? 'text-amber-400'
    return (
        <div
            className="flex gap-0.5 items-center"
            title={t(`strainsView.difficulty.${safeDifficulty.toLowerCase()}`)}
        >
            {[1, 2, 3].map((marker) => {
                const markerColorClassName = marker <= level ? color : 'text-slate-600'
                return (
                    <PhosphorIcons.Cannabis
                        key={`difficulty-marker-${marker}`}
                        weight="fill"
                        className={`w-4 h-4 ${markerColorClassName}`}
                    />
                )
            })}
        </div>
    )
}

const DetailedStrainSelectItem: React.FC<{ strain: Strain; onClick: () => void }> = ({
    strain,
    onClick,
}) => {
    const { t } = useTranslation()
    const userStrains = useAppSelector(selectUserStrains) ?? []
    const isUserStrain = userStrains.some((s) => s.id === strain.id)

    const typeClasses: Record<string, string> = {
        Sativa: 'text-amber-400',
        Indica: 'text-indigo-400',
        Hybrid: 'text-blue-400',
    }
    const safeType =
        strain.type === 'Sativa' || strain.type === 'Indica' || strain.type === 'Hybrid'
            ? strain.type
            : 'Hybrid'
    const safeYield =
        strain.agronomic?.yield === 'Low' ||
        strain.agronomic?.yield === 'Medium' ||
        strain.agronomic?.yield === 'High'
            ? strain.agronomic.yield
            : 'Medium'
    const safeHeight =
        strain.agronomic?.height === 'Short' ||
        strain.agronomic?.height === 'Medium' ||
        strain.agronomic?.height === 'Tall'
            ? strain.agronomic.height
            : 'Medium'
    const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[safeType]
    const safeName =
        typeof strain.name === 'string' && strain.name.trim() !== ''
            ? strain.name
            : 'Unknown Strain'
    const safeThc = typeof strain.thc === 'number' && Number.isFinite(strain.thc) ? strain.thc : 0
    const safeCbd = typeof strain.cbd === 'number' && Number.isFinite(strain.cbd) ? strain.cbd : 0
    const safeFloweringTime =
        typeof strain.floweringTime === 'number' && Number.isFinite(strain.floweringTime)
            ? strain.floweringTime
            : 0

    return (
        <button
            onClick={onClick}
            className="w-full text-left p-3 rounded-lg hover:bg-slate-700/50 transition-colors flex items-center gap-4 ring-1 ring-inset ring-white/20"
        >
            <div className="flex-shrink-0">
                <TypeIcon className={`w-10 h-10 ${typeClasses[safeType]}`} />
            </div>

            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                    {isUserStrain && (
                        <PhosphorIcons.Star
                            weight="fill"
                            className="w-4 h-4 text-amber-400 flex-shrink-0"
                        />
                    )}
                    <p className="font-bold text-slate-100 truncate">{safeName}</p>
                </div>
                <div className="grid grid-cols-3 gap-x-4 text-xs text-slate-400 mt-1">
                    <div className="flex items-center gap-1" title="THC">
                        <PhosphorIcons.Lightning className="w-3 h-3 text-red-400" />
                        <span>{safeThc.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1" title="CBD">
                        <PhosphorIcons.Drop className="w-3 h-3 text-blue-400" />
                        <span>{safeCbd.toFixed(1)}%</span>
                    </div>
                    <div
                        className="flex items-center gap-1"
                        title={t('strainsView.table.flowering')}
                    >
                        <PhosphorIcons.ArrowClockwise className="w-3 h-3 text-slate-400" />
                        <span>
                            {strain.floweringTimeRange || safeFloweringTime}{' '}
                            {t('common.units.weeks')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <DifficultyMeter difficulty={strain.agronomic?.difficulty ?? 'Medium'} />
                <div
                    className="flex items-center gap-1 text-xs text-slate-400"
                    title={t('strainsView.addStrainModal.yield')}
                >
                    <PhosphorIcons.Archive className="w-3 h-3" />
                    <span>{t(`strainsView.addStrainModal.yields.${safeYield.toLowerCase()}`)}</span>
                </div>
                <div
                    className="flex items-center gap-1 text-xs text-slate-400"
                    title={t('strainsView.addStrainModal.height')}
                >
                    <PhosphorIcons.Ruler className="w-3 h-3" />
                    <span>
                        {t(`strainsView.addStrainModal.heights.${safeHeight.toLowerCase()}`)}
                    </span>
                </div>
            </div>
        </button>
    )
}

export const InlineStrainSelector: React.FC<InlineStrainSelectorProps> = ({
    onClose,
    onSelectStrain,
}) => {
    const { t } = useTranslation()
    const [allStrains, setAllStrains] = useState<Strain[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const rawUserStrains = useAppSelector(selectUserStrains)
    const userStrains = useMemo(() => rawUserStrains ?? [], [rawUserStrains])
    const rawFavorites = useAppSelector(selectFavoriteIds)
    const favorites = useMemo(() => rawFavorites ?? new Set<string>(), [rawFavorites])

    useEffect(() => {
        strainService
            .getAllStrains()
            .then((strains) => {
                setAllStrains(strains.filter((strain): strain is Strain => Boolean(strain)))
                setLoadError(null)
                setIsLoading(false)
            })
            .catch((error: unknown) => {
                console.error('[InlineStrainSelector] Failed to load strains.', error)
                setLoadError(t('strainsView.inlineSelector.loadError'))
                setIsLoading(false)
            })
    }, [t])

    const filteredStrains = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase()

        let strainsToShow = allStrains.filter((strain): strain is Strain => Boolean(strain))

        if (searchTerm.trim() !== '') {
            strainsToShow = allStrains.filter(
                (s) =>
                    (typeof s.name === 'string' ? s.name : 'Unknown Strain')
                        .toLowerCase()
                        .includes(lowerCaseSearch) ||
                    (typeof s.type === 'string' ? s.type : 'Hybrid')
                        .toLowerCase()
                        .includes(lowerCaseSearch) ||
                    (Array.isArray(s.aromas) ? s.aromas : []).some(
                        (a) => typeof a === 'string' && a.toLowerCase().includes(lowerCaseSearch),
                    ),
            )
        }

        // Prioritize user strains and favorites
        return strainsToShow
            .toSorted((a, b) => {
                const aIsUser = userStrains.some((s) => s.id === a.id)
                const bIsUser = userStrains.some((s) => s.id === b.id)
                const aIsFav = favorites.has(a.id)
                const bIsFav = favorites.has(b.id)
                if (aIsUser && !bIsUser) return -1
                if (!aIsUser && bIsUser) return 1
                if (aIsFav && !bIsFav) return -1
                if (!aIsFav && bIsFav) return 1
                return compareText(a.name, b.name)
            })
            .slice(0, 100) // Limit results for performance
    }, [searchTerm, allStrains, userStrains, favorites])

    return (
        <Card className="flex flex-col h-full animate-fade-in">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h3 className="font-semibold text-primary-400">
                    {t('plantsView.inlineSelector.title')}
                </h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
                    <PhosphorIcons.X className="w-5 h-5" />
                </button>
            </div>
            <div className="mb-4 flex-shrink-0">
                <SearchBar
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('strainsView.searchPlaceholder')}
                    autoFocus
                />
            </div>
            <div className="flex-grow overflow-y-auto pr-2 -mr-4">
                {isLoading ? (
                    <SkeletonLoader count={5} />
                ) : loadError ? (
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                        {loadError}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredStrains.map((strain) => (
                            <DetailedStrainSelectItem
                                key={strain.id}
                                strain={strain}
                                onClick={() => onSelectStrain(strain)}
                            />
                        ))}
                        {filteredStrains.length === 0 && (
                            <div className="text-center py-4 text-slate-500 text-sm">
                                {t('strainsView.emptyStates.noResults.title')}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    )
}
