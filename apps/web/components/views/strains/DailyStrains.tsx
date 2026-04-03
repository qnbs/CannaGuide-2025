import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { dailyStrainsService } from '@/services/dailyStrainsService'
import {
    buildUserProfile,
    rankStrainsByRelevance,
    resolveDiscoveredToStrain,
} from '@/services/dailyStrainsService'
import { StrainLookupSection } from './StrainLookupSection'
import type {
    DiscoveredStrain,
    DailyStrainsFeed,
    FeedStatus,
    ScoredStrain,
} from '@/services/dailyStrainsService'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { getUISnapshot } from '@/stores/useUIStore'
import { useAppSelector, useAppDispatch } from '@/stores/store'
import { selectUserStrains } from '@/stores/selectors'
import { addUserStrainWithValidation } from '@/stores/slices/userStrainsSlice'

// ---------------------------------------------------------------------------
// CategoryBadge
// ---------------------------------------------------------------------------

interface CategoryBadgeProps {
    category: string
}

const categoryStyles: Record<string, string> = {
    'high-thc': 'text-red-400 bg-red-400/10',
    'balanced-cbd': 'text-blue-400 bg-blue-400/10',
    autoflower: 'text-cyan-400 bg-cyan-400/10',
    'classic-indica': 'text-purple-400 bg-purple-400/10',
    'classic-sativa': 'text-orange-400 bg-orange-400/10',
    'beginner-friendly': 'text-emerald-400 bg-emerald-400/10',
    'terpene-rich': 'text-amber-400 bg-amber-400/10',
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
    const { t } = useTranslation()
    const style = categoryStyles[category] ?? 'text-slate-400 bg-slate-400/10'
    const label = t(`strainsView.dailyStrains.categories.${category}`, category)
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style}`}>{label}</span>
    )
}

// ---------------------------------------------------------------------------
// DiscoveryCard -- single daily pick
// ---------------------------------------------------------------------------

interface DiscoveryCardProps {
    strain: DiscoveredStrain | ScoredStrain
    onDismiss: (id: string) => void
    onQuickAdd: (strain: DiscoveredStrain) => void
    onEditAndAdd: (strain: DiscoveredStrain) => void
    isInLibrary: boolean
}

const DiscoveryCard: React.FC<DiscoveryCardProps> = memo(
    ({ strain, onDismiss, onQuickAdd, onEditAndAdd, isInLibrary }) => {
        const { t } = useTranslation()
        const relevanceScore = 'relevanceScore' in strain ? strain.relevanceScore : null

        const typeColor =
            strain.type === 'Indica'
                ? 'text-purple-400 bg-purple-400/10'
                : strain.type === 'Sativa'
                  ? 'text-orange-400 bg-orange-400/10'
                  : 'text-green-400 bg-green-400/10'

        return (
            <Card className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-100 truncate">{strain.name}</h3>
                        <p className="text-sm text-slate-400">{strain.breeder}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor}`}
                        >
                            {strain.type}
                        </span>
                        {strain.floweringType === 'Autoflower' && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-cyan-400 bg-cyan-400/10">
                                {t('strainsView.dailyStrains.auto')}
                            </span>
                        )}
                        {strain.pickCategory && <CategoryBadge category={strain.pickCategory} />}
                        {relevanceScore !== null && relevanceScore >= 65 && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-amber-400 bg-amber-400/10">
                                {relevanceScore}% {t('strainsView.dailyStrains.match')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Pick reason */}
                {strain.pickCategory && (
                    <p className="text-xs text-primary-400 font-medium">
                        {t('strainsView.dailyStrains.whyToday')}:{' '}
                        {t(
                            `strainsView.dailyStrains.pickReasons.${strain.pickCategory}`,
                            strain.pickReason ?? '',
                        )}
                    </p>
                )}

                {strain.genetics && (
                    <p className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-400">
                            {t('strainsView.dailyStrains.genetics')}:
                        </span>{' '}
                        {strain.genetics}
                    </p>
                )}

                <div className="flex gap-4 text-sm">
                    {strain.thc > 0 && (
                        <span className="text-emerald-400">THC: {strain.thc.toFixed(1)}%</span>
                    )}
                    {strain.cbd > 0 && (
                        <span className="text-blue-400">CBD: {strain.cbd.toFixed(1)}%</span>
                    )}
                </div>

                {strain.description && (
                    <p className="text-sm text-slate-400 line-clamp-2">{strain.description}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        {strain.source === 'ai-lookup' && (
                            <span className="text-primary-400">AI</span>
                        )}
                        {strain.source === 'local-catalog' && (
                            <span className="text-emerald-400">
                                {t('strainsView.dailyStrains.catalog')}
                            </span>
                        )}
                        {strain.source === 'daily-pick' && (
                            <span className="text-amber-400">
                                {t('strainsView.dailyStrains.dailyPick')}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDismiss(strain.id)}
                            aria-label={t('strainsView.dailyStrains.dismiss')}
                        >
                            <PhosphorIcons.X className="w-4 h-4" />
                        </Button>
                        {isInLibrary ? (
                            <span className="text-xs text-emerald-400 flex items-center gap-1 px-2">
                                <PhosphorIcons.CheckCircle className="w-4 h-4" />
                                {t('strainsView.dailyStrains.inLibrary')}
                            </span>
                        ) : (
                            <>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onEditAndAdd(strain)}
                                    aria-label={t('strainsView.dailyStrains.editAndAdd')}
                                    title={t('strainsView.dailyStrains.editAndAdd')}
                                >
                                    <PhosphorIcons.PencilSimple className="w-4 h-4" />
                                </Button>
                                <Button size="sm" onClick={() => onQuickAdd(strain)}>
                                    <PhosphorIcons.Plus className="w-4 h-4 mr-1" />
                                    {t('strainsView.dailyStrains.addToLibrary')}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </Card>
        )
    },
)
DiscoveryCard.displayName = 'DiscoveryCard'

// ---------------------------------------------------------------------------
// DailyStrains view -- 4:20 Daily Drop
// ---------------------------------------------------------------------------

export const DailyStrains: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const [status, setStatus] = useState<FeedStatus>('idle')
    const [feed, setFeed] = useState<DailyStrainsFeed | null>(null)
    const [discoveries, setDiscoveries] = useState<DiscoveredStrain[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<DiscoveredStrain[]>([])
    const [isSearching, setIsSearching] = useState(false)

    // Build user preference profile for recommendation scoring
    const userStrains = useAppSelector(selectUserStrains)
    const userProfile = useMemo(
        () =>
            buildUserProfile(
                (userStrains ?? []).map((s) => {
                    const entry: { type?: string; thc?: number; cbd?: number } = {}
                    if (typeof s.type === 'string') entry.type = s.type
                    if (typeof s.thc === 'number') entry.thc = s.thc
                    if (typeof s.cbd === 'number') entry.cbd = s.cbd
                    return entry
                }),
            ),
        [userStrains],
    )

    // Set of user strain IDs for "already in library" badge
    const userStrainIds = useMemo(
        () => new Set((userStrains ?? []).map((s) => s.id)),
        [userStrains],
    )

    // Load feed on mount
    useEffect(() => {
        setStatus('loading')
        try {
            const loadedFeed = dailyStrainsService.loadFeed()
            setFeed(loadedFeed)
            setDiscoveries(dailyStrainsService.getNewDiscoveries())
            setStatus('loaded')
        } catch {
            setStatus('error')
        }
    }, [])

    const handleDismiss = useCallback((id: string) => {
        dailyStrainsService.dismiss(id)
        setDiscoveries((prev) => prev.filter((d) => d.id !== id))
    }, [])

    /** Quick-add: resolve to full Strain and dispatch to Redux. */
    const handleQuickAdd = useCallback(
        (discovered: DiscoveredStrain) => {
            const fullStrain = resolveDiscoveredToStrain(discovered)
            void dispatch(addUserStrainWithValidation(fullStrain))
            dailyStrainsService.dismiss(discovered.id)
            setDiscoveries((prev) => prev.filter((d) => d.id !== discovered.id))
            setSearchResults((prev) => prev.filter((d) => d.id !== discovered.id))
        },
        [dispatch],
    )

    /** Edit-and-add: resolve to full Strain, open AddStrainModal pre-filled. */
    const handleEditAndAdd = useCallback((discovered: DiscoveredStrain) => {
        const fullStrain = resolveDiscoveredToStrain(discovered)
        getUISnapshot().openAddModal(fullStrain)
    }, [])

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim() || searchQuery.length < 2) return
        setIsSearching(true)
        try {
            const results = await dailyStrainsService.search(searchQuery.trim())
            setSearchResults(results)
        } catch {
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }, [searchQuery])

    const handleSearchKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                void handleSearch()
            }
        },
        [handleSearch],
    )

    const allItems = useMemo(() => {
        const base = searchResults.length > 0 ? searchResults : discoveries
        if (userProfile.strainCount > 0) {
            return rankStrainsByRelevance(base, userProfile)
        }
        return base
    }, [discoveries, searchResults, userProfile])

    if (status === 'loading') {
        return <SkeletonLoader count={4} />
    }

    return (
        <div className="space-y-6">
            {/* Strain Intelligence Lookup -- prominently at the top */}
            <StrainLookupSection />

            {/* Header -- 4:20 Daily Drop branding */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-100">
                    {t('strainsView.dailyStrains.title')}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                    {t('strainsView.dailyStrains.subtitle', {
                        count: feed?.stats.existingCatalogSize ?? 778,
                    })}
                </p>
            </div>

            {/* Stats bar */}
            {feed && (
                <div className="flex justify-center gap-6 text-sm flex-wrap">
                    <span className="text-emerald-400">
                        {t('strainsView.dailyStrains.picksCount', {
                            count: feed.stats.totalPicks,
                        })}
                    </span>
                    <span className="text-blue-400">
                        {t('strainsView.dailyStrains.categoriesCount', {
                            count: feed.stats.categories.length,
                        })}
                    </span>
                    <span className="text-slate-500">
                        {t('strainsView.dailyStrains.catalogSize', {
                            count: feed.stats.existingCatalogSize,
                        })}
                    </span>
                </div>
            )}

            {/* Category pills */}
            {feed && feed.stats.categories.length > 0 && (
                <div className="flex justify-center gap-2 flex-wrap">
                    {feed.stats.categories.map((cat) => (
                        <CategoryBadge key={cat} category={cat} />
                    ))}
                </div>
            )}

            {/* Search bar */}
            <Card className="p-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder={t('strainsView.dailyStrains.searchPlaceholder')}
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        />
                    </div>
                    <Button
                        onClick={() => void handleSearch()}
                        disabled={isSearching || searchQuery.length < 2}
                    >
                        {isSearching ? (
                            <PhosphorIcons.ArrowClockwise className="w-4 h-4 animate-spin" />
                        ) : (
                            t('strainsView.dailyStrains.search')
                        )}
                    </Button>
                </div>
                {searchResults.length > 0 && (
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                            {t('strainsView.dailyStrains.searchResultCount', {
                                count: searchResults.length,
                            })}
                        </span>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setSearchResults([])
                                setSearchQuery('')
                            }}
                        >
                            {t('strainsView.dailyStrains.clearSearch')}
                        </Button>
                    </div>
                )}
            </Card>

            {/* Discovery feed */}
            {allItems.length === 0 && status === 'loaded' && (
                <Card className="p-8 text-center">
                    <PhosphorIcons.BellSimple className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400">
                        {searchQuery
                            ? t('strainsView.dailyStrains.noSearchResults')
                            : t('strainsView.dailyStrains.allDismissed')}
                    </p>
                </Card>
            )}

            <div className="space-y-3">
                {allItems.map((strain) => (
                    <DiscoveryCard
                        key={strain.id}
                        strain={strain}
                        onDismiss={handleDismiss}
                        onQuickAdd={handleQuickAdd}
                        onEditAndAdd={handleEditAndAdd}
                        isInLibrary={userStrainIds.has(strain.id)}
                    />
                ))}
            </div>

            {/* Last updated */}
            {feed?.generatedAt && (
                <p className="text-center text-xs text-slate-600">
                    {t('strainsView.dailyStrains.lastUpdated', {
                        date: new Date(feed.generatedAt).toLocaleString(),
                    })}
                </p>
            )}
        </div>
    )
}
