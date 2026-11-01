import React, { useState, useEffect, useMemo } from 'react'
import { Strain, StrainType } from '@/types'
import { useAppSelector } from '@/stores/store'
import { strainService } from '@/services/strainService'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { selectUserStrains, selectFavoriteIds } from '@/stores/selectors'
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons'
import { SearchBar } from '@/components/common/SearchBar'
import { compareText } from '@/components/views/strains/compareText'
import { formatFloweringWeeks } from '@/components/views/strains/reportedStrainFacts'

const lowerText = (value: unknown): string => (typeof value === 'string' ? value : '').toLowerCase()

const includesQuery = (value: unknown, query: string): boolean => lowerText(value).includes(query)

const listIncludesQuery = (values: unknown, query: string): boolean =>
    (Array.isArray(values) ? values : []).some(
        (item) => typeof item === 'string' && item.toLowerCase().includes(query),
    )

const matchesStrainQuery = (strain: Strain, query: string): boolean =>
    includesQuery(strain.name, query) ||
    includesQuery(strain.type, query) ||
    listIncludesQuery(strain.aromas, query)

export const selectorRank = (
    strain: Strain,
    userIds: ReadonlySet<string>,
    favoriteIds: ReadonlySet<string>,
): number => {
    if (userIds.has(strain.id)) return favoriteIds.has(strain.id) ? 0 : 1
    if (favoriteIds.has(strain.id)) return 2
    return 3
}

export const compareSelectorStrains = (
    left: Strain,
    right: Strain,
    userIds: ReadonlySet<string>,
    favoriteIds: ReadonlySet<string>,
): number => {
    const rankGap =
        selectorRank(left, userIds, favoriteIds) - selectorRank(right, userIds, favoriteIds)
    if (rankGap !== 0) return rankGap
    return compareText(left.name, right.name)
}

const YIELD_LEVELS = ['Low', 'Medium', 'High'] as const
const HEIGHT_LEVELS = ['Short', 'Medium', 'Tall'] as const

const oneOf = <T extends string>(value: T | undefined, allowed: readonly T[]): T | undefined => {
    if (value !== undefined && allowed.includes(value)) return value
    return undefined
}

const reportedName = (name: unknown, unknownLabel: string): string => {
    if (typeof name !== 'string' || name.trim() === '') return unknownLabel
    return name
}

const reportedPercent = (value: unknown, unknownLabel: string): string => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return unknownLabel
    return `${value.toFixed(1)}%`
}

const typeIconFor = (type: string) => {
    if (type === StrainType.Sativa) return SativaIcon
    if (type === StrainType.Indica) return IndicaIcon
    if (type === StrainType.Hybrid) return HybridIcon
    return PhosphorIcons.Question
}

const typeClassFor = (type: string): string => {
    if (type === StrainType.Sativa) return 'text-amber-400'
    if (type === StrainType.Indica) return 'text-indigo-400'
    if (type === StrainType.Hybrid) return 'text-blue-400'
    return 'text-slate-400'
}

const EmptySearchResult: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center py-4 text-muted text-sm">
        <PhosphorIcons.MagnifyingGlass
            className="w-8 h-8 mx-auto text-slate-600 mb-1"
            aria-hidden="true"
        />
        {message}
    </div>
)

const UserStar: React.FC<{ visible: boolean }> = ({ visible }) => {
    if (!visible) return null
    return <PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" />
}

const levelLabel = (
    value: string | undefined,
    unknownLabel: string,
    labelFor: (value: string) => string,
): string => {
    if (value === undefined) return unknownLabel
    return labelFor(value)
}

const MetricChip: React.FC<{
    title: string
    icon: React.ComponentType<{ className?: string }>
    iconClassName: string
    value: string
}> = ({ title, icon: Icon, iconClassName, value }) => (
    <div className="flex items-center gap-1" title={title}>
        <Icon className={iconClassName} />
        <span>{value}</span>
    </div>
)

const DIFFICULTY_LEVEL: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 }
const DIFFICULTY_COLOR: Record<string, string> = {
    Easy: 'text-green-400',
    Medium: 'text-amber-400',
    Hard: 'text-red-400',
}

interface InlineStrainSelectorProps {
    onClose: () => void
    onSelectStrain: (strain: Strain) => void
}

const DifficultyMeter: React.FC<{
    difficulty: Strain['agronomic']['difficulty'] | undefined
}> = ({ difficulty }) => {
    const { t } = useTranslation()
    if (difficulty === undefined) {
        return <span className="text-xs text-slate-400">{t('common.unknown')}</span>
    }
    const level = DIFFICULTY_LEVEL[difficulty]
    const color = DIFFICULTY_COLOR[difficulty]
    if (level === undefined || color === undefined) {
        return <span className="text-xs text-slate-400">{t('common.unknown')}</span>
    }
    return (
        <div
            className="flex gap-0.5 items-center"
            title={t(`strainsView.difficulty.${difficulty.toLowerCase()}`)}
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

const DetailedStrainSelectItem: React.FC<{
    strain: Strain
    isUserStrain: boolean
    onClick: () => void
}> = ({ strain, isUserStrain, onClick }) => {
    const { t } = useTranslation()
    const safeYield = oneOf(strain.agronomic?.yield, YIELD_LEVELS)
    const safeHeight = oneOf(strain.agronomic?.height, HEIGHT_LEVELS)
    const TypeIcon = typeIconFor(strain.type)
    const unknown = t('common.unknown')
    const safeName = reportedName(strain.name, unknown)
    const safeThc = reportedPercent(strain.thc, unknown)
    const safeCbd = reportedPercent(strain.cbd, unknown)
    const safeFloweringTime = formatFloweringWeeks(
        strain.floweringTimeRange,
        strain.floweringTime,
        t('common.units.weeks'),
        unknown,
    )

    return (
        <button
            onClick={onClick}
            className="w-full text-left p-3 rounded-lg hover:bg-slate-700/50 transition-colors flex items-center gap-4 ring-1 ring-inset ring-white/20"
        >
            <div className="flex-shrink-0">
                <TypeIcon className={`w-10 h-10 ${typeClassFor(strain.type)}`} />
            </div>

            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                    <UserStar visible={isUserStrain} />
                    <p className="font-bold text-slate-100 truncate">{safeName}</p>
                </div>
                <div className="grid grid-cols-3 gap-x-4 text-xs text-slate-400 mt-1">
                    <MetricChip
                        title="THC"
                        icon={PhosphorIcons.Lightning}
                        iconClassName="w-3 h-3 text-red-400"
                        value={safeThc}
                    />
                    <MetricChip
                        title="CBD"
                        icon={PhosphorIcons.Drop}
                        iconClassName="w-3 h-3 text-blue-400"
                        value={safeCbd}
                    />
                    <MetricChip
                        title={t('strainsView.table.flowering')}
                        icon={PhosphorIcons.ArrowClockwise}
                        iconClassName="w-3 h-3 text-slate-400"
                        value={safeFloweringTime}
                    />
                </div>
            </div>

            <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <DifficultyMeter difficulty={strain.agronomic?.difficulty} />
                <div
                    className="flex items-center gap-1 text-xs text-slate-400"
                    title={t('strainsView.addStrainModal.yield')}
                >
                    <PhosphorIcons.Archive className="w-3 h-3" />
                    <span>
                        {levelLabel(safeYield, unknown, (value) =>
                            t(`strainsView.addStrainModal.yields.${value.toLowerCase()}`),
                        )}
                    </span>
                </div>
                <div
                    className="flex items-center gap-1 text-xs text-slate-400"
                    title={t('strainsView.addStrainModal.height')}
                >
                    <PhosphorIcons.Ruler className="w-3 h-3" />
                    <span>
                        {levelLabel(safeHeight, unknown, (value) =>
                            t(`strainsView.addStrainModal.heights.${value.toLowerCase()}`),
                        )}
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
                console.debug('[InlineStrainSelector] Failed to load strains.', error)
                setLoadError(t('strainsView.inlineSelector.loadError'))
                setIsLoading(false)
            })
    }, [t])

    const userIds = useMemo(() => new Set(userStrains.map((strain) => strain.id)), [userStrains])

    const filteredStrains = useMemo(() => {
        const query = searchTerm.toLowerCase()
        const strainsToShow =
            searchTerm.trim() === ''
                ? allStrains.filter((strain): strain is Strain => Boolean(strain))
                : allStrains.filter((strain) => matchesStrainQuery(strain, query))
        return strainsToShow
            .toSorted((left, right) => compareSelectorStrains(left, right, userIds, favorites))
            .slice(0, 100)
    }, [searchTerm, allStrains, userIds, favorites])

    return (
        <Card className="flex flex-col h-full animate-fade-in">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h3 className="font-semibold text-primary-400">
                    {t('plantsView.inlineSelector.title')}
                </h3>
                <button
                    onClick={onClose}
                    className="p-2.5 rounded-full hover:bg-slate-700"
                    aria-label={t('common.close')}
                >
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
                                isUserStrain={userIds.has(strain.id)}
                                onClick={() => onSelectStrain(strain)}
                            />
                        ))}
                        {filteredStrains.length === 0 ? (
                            <EmptySearchResult
                                message={t('strainsView.emptyStates.noResults.title')}
                            />
                        ) : null}
                    </div>
                )}
            </div>
        </Card>
    )
}
