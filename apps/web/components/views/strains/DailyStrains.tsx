import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { dailyStrainsService } from '@/services/dailyStrainsService'
import { buildUserProfile, rankStrainsByRelevance } from '@/services/dailyStrainsService'
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
import { useAppSelector } from '@/stores/store'
import { selectUserStrains } from '@/stores/selectors'

// ---------------------------------------------------------------------------
// DiscoveryCard -- single strain discovery entry
// ---------------------------------------------------------------------------

interface DiscoveryCardProps {
    strain: DiscoveredStrain | ScoredStrain
    onDismiss: (id: string) => void
    onAddToLibrary: (strain: DiscoveredStrain) => void
}

const DiscoveryCard: React.FC<DiscoveryCardProps> = memo(
    ({ strain, onDismiss, onAddToLibrary }) => {
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
                    <div className="flex items-center gap-2 shrink-0">
                        <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor}`}
                        >
                            {strain.type}
                        </span>
                        {strain.floweringType === 'Autoflower' && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-cyan-400 bg-cyan-400/10">
                                Auto
                            </span>
                        )}
                        {relevanceScore !== null && relevanceScore >= 65 && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-amber-400 bg-amber-400/10">
                                {relevanceScore}% match
                            </span>
                        )}
                    </div>
                </div>

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
                        <span>{new Date(strain.discoveredAt).toLocaleDateString()}</span>
                        {strain.source === 'ai-lookup' && (
                            <span className="text-primary-400">AI</span>
                        )}
                        {strain.source === 'local-catalog' && (
                            <span className="text-emerald-400">Catalog</span>
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
                        <Button size="sm" onClick={() => onAddToLibrary(strain)}>
                            <PhosphorIcons.Plus className="w-4 h-4 mr-1" />
                            {t('strainsView.dailyStrains.addToLibrary')}
                        </Button>
                    </div>
                </div>
            </Card>
        )
    },
)
DiscoveryCard.displayName = 'DiscoveryCard'

// ---------------------------------------------------------------------------
// DailyStrains view
// ---------------------------------------------------------------------------

export const DailyStrains: React.FC = () => {
    const { t } = useTranslation()
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

    // Load feed on mount
    useEffect(() => {
        setStatus('loading')
        dailyStrainsService
            .loadFeed()
            .then((loadedFeed) => {
                setFeed(loadedFeed)
                setStatus('loaded')
            })
            .catch(() => {
                setStatus('error')
            })
    }, [])

    // Load non-dismissed discoveries
    useEffect(() => {
        if (status !== 'loaded') return
        dailyStrainsService
            .getNewDiscoveries()
            .then(setDiscoveries)
            .catch(() => {
                // fallback to empty
            })
    }, [status])

    const handleDismiss = useCallback((id: string) => {
        dailyStrainsService.dismiss(id)
        setDiscoveries((prev) => prev.filter((d) => d.id !== id))
    }, [])

    const handleAddToLibrary = useCallback(
        (strain: DiscoveredStrain) => {
            const { addNotification } = getUISnapshot()
            addNotification({
                message: t('strainsView.dailyStrains.addedHint', { name: strain.name }),
                type: 'info',
            })
            dailyStrainsService.dismiss(strain.id)
            setDiscoveries((prev) => prev.filter((d) => d.id !== strain.id))
        },
        [t],
    )

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
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-100">
                    {t('strainsView.dailyStrains.title')}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                    {t('strainsView.dailyStrains.subtitle')}
                </p>
            </div>

            {/* Stats bar */}
            {feed && (
                <div className="flex justify-center gap-6 text-sm">
                    <span className="text-emerald-400">
                        {t('strainsView.dailyStrains.newCount', { count: feed.stats.newStrains })}
                    </span>
                    <span className="text-blue-400">
                        {t('strainsView.dailyStrains.updatedCount', {
                            count: feed.stats.updatedStrains,
                        })}
                    </span>
                    <span className="text-slate-500">
                        {t('strainsView.dailyStrains.catalogSize', {
                            count: feed.stats.existingCatalogSize,
                        })}
                    </span>
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
                            : t('strainsView.dailyStrains.noDiscoveries')}
                    </p>
                </Card>
            )}

            <div className="space-y-3">
                {allItems.map((strain) => (
                    <DiscoveryCard
                        key={strain.id}
                        strain={strain}
                        onDismiss={handleDismiss}
                        onAddToLibrary={handleAddToLibrary}
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
