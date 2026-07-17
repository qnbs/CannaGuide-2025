import React, { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { cn } from '@/lib/utils'
import { useAppSelector, useAppDispatch } from '@/stores/store'
import { selectUserStrains } from '@/stores/selectors'
import { addUserStrainWithValidation } from '@/stores/slices/userStrainsSlice'
import { toggleFavorite } from '@/stores/slices/favoritesSlice'
import { resolveDiscoveredToStrain } from '@/services/dailyStrainsService'
import {
    lookupStrain,
    getFuzzySuggestions,
    type LookupStrainResult,
    type ConfidenceSource,
} from '@/services/strainLookupService'
import { ResultCard } from './strainLookup/ResultCard'

export const StrainLookupSection: React.FC = memo(() => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()

    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<LookupStrainResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    const userStrains = useAppSelector(selectUserStrains)
    const favoriteIds = useAppSelector((s) => s.favorites.favoriteIds)

    const userStrainIds = useMemo(
        () => new Set((userStrains ?? []).map((s) => s.id)),
        [userStrains],
    )

    const isInLibrary = result !== null && userStrainIds.has(result.id)
    const isFavorited = result !== null && favoriteIds.includes(result.id)

    // Compute match score from user library
    const matchScore = useMemo(() => {
        if (!result || !userStrains || userStrains.length === 0) return 0
        let score = 40
        const typeCounts: Record<string, number> = {}
        let thcSum = 0
        let cbdSum = 0
        for (const s of userStrains) {
            if (s.type) typeCounts[s.type] = (typeCounts[s.type] ?? 0) + 1
            thcSum += s.thc ?? 0
            cbdSum += s.cbd ?? 0
        }
        const total = userStrains.length
        const avgThc = thcSum / total
        const avgCbd = cbdSum / total
        const typeRatio = (typeCounts[result.type] ?? 0) / total
        score += typeRatio * 30
        if (result.thc > 0) score += Math.max(0, 20 - Math.abs(result.thc - avgThc))
        if (result.cbd > 0) score += Math.max(0, 10 - Math.abs(result.cbd - avgCbd) * 5)
        return Math.min(100, Math.max(0, Math.round(score)))
    }, [result, userStrains])

    // Real-time suggestions
    useEffect(() => {
        if (query.length < 2) {
            setSuggestions([])
            return
        }
        setSuggestions(getFuzzySuggestions(query, 8))
    }, [query])

    // Close suggestions on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                suggestionsRef.current &&
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                !suggestionsRef.current.contains(e.target as Node) &&
                inputRef.current &&
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                !inputRef.current.contains(e.target as Node)
            ) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleSearch = useCallback(
        async (searchQuery: string) => {
            const q = searchQuery.trim()
            if (q.length < 2) return
            setIsLoading(true)
            setError(null)
            setResult(null)
            setShowSuggestions(false)
            try {
                const found = await lookupStrain(q)
                if (found) {
                    setResult(found)
                } else {
                    setError(
                        t(
                            'strainLookup.notFound',
                            'No data found for "{{name}}". Try a different spelling.',
                            { name: q },
                        ),
                    )
                }
            } catch {
                setError(t('strainLookup.lookupError', 'Lookup failed. Please try again.'))
            } finally {
                setIsLoading(false)
            }
        },
        [t],
    )

    const handleSubmit = useCallback(() => {
        void handleSearch(query)
    }, [handleSearch, query])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') void handleSearch(query)
            if (e.key === 'Escape') {
                setShowSuggestions(false)
                inputRef.current?.blur()
            }
        },
        [handleSearch, query],
    )

    const handleSuggestionClick = useCallback(
        (name: string) => {
            setQuery(name)
            void handleSearch(name)
        },
        [handleSearch],
    )

    const handleAddToLibrary = useCallback(
        (r: LookupStrainResult) => {
            const discovered = {
                id: r.id,
                name: r.name,
                breeder: r.breeder,
                type: r.type,
                floweringType: r.floweringType,
                thc: r.thc,
                cbd: r.cbd,
                description: r.description,
                genetics: r.genetics,
                source: 'ai-lookup' as const,
                sourceUrl: r.sourceUrl,
                discoveredAt: r.discoveredAt,
            }
            const fullStrain = r.fullStrain ?? resolveDiscoveredToStrain(discovered)
            void dispatch(addUserStrainWithValidation(fullStrain))
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, t],
    )

    const handleToggleFavorite = useCallback(
        (r: LookupStrainResult) => {
            dispatch(toggleFavorite(r.id))
        },
        [dispatch],
    )

    // Stub navigation callbacks (wired to existing UI patterns)
    const handleFindSimilar = useCallback(
        (r: LookupStrainResult) => {
            // Pre-fill the existing search field with the strain name to find similar
            setQuery(r.name)
            void handleSearch(r.name)
        },
        [handleSearch],
    )

    const handleOpenBreeding = useCallback((r: LookupStrainResult) => {
        if (r.fullStrain) {
            void import('@/stores/useUIStore').then(({ getUISnapshot }) => {
                getUISnapshot().openAddModal(r.fullStrain)
            })
        }
    }, [])

    const handleShare = useCallback((r: LookupStrainResult) => {
        const lines: string[] = [
            r.name,
            r.type !== 'Unknown' ? r.type : '',
            r.thc > 0 ? `THC ${r.thc.toFixed(1)}%` : '',
            r.cbd > 0 ? `CBD ${r.cbd.toFixed(1)}%` : '',
            r.description ?? '',
        ].filter(Boolean)
        void navigator
            .share({
                title: r.name,
                text: lines.join(' | '),
                url: r.sourceUrl ?? window.location.href,
            })
            .catch(() => {
                // user cancelled or share not supported -- silently ignore
            })
    }, [])

    const handleClear = useCallback(() => {
        setQuery('')
        setResult(null)
        setError(null)
        inputRef.current?.focus()
    }, [])

    return (
        <div className="space-y-4">
            {/* Hero search card */}
            <Card className="relative overflow-hidden border border-primary-500/20">
                {/* Background decoration */}
                <div
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(ellipse at 80% 50%, #10b981 0%, transparent 60%)',
                    }}
                />

                <div className="relative p-4 md:p-6 space-y-3">
                    {/* Section label */}
                    <div className="flex items-center gap-2">
                        <PhosphorIcons.MagnifyingGlass className="w-5 h-5 text-primary-400" />
                        <span className="text-sm font-semibold text-primary-400 uppercase tracking-wide">
                            {t('strainLookup.sectionLabel', 'Strain Intelligence Lookup')}
                        </span>
                    </div>
                    <p className="text-xs text-muted">
                        {t(
                            'strainLookup.sectionHint',
                            'Local catalog + Cannlytics lab data + Open Cannabis APIs + AI -- multi-layer lookup',
                        )}
                    </p>

                    {/* Search input + button */}
                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value)
                                    setShowSuggestions(true)
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder={t(
                                    'strainLookup.placeholder',
                                    'New strain discovered? Enter name (e.g. Gorilla Pie, Lemon Cherry Gelato...)',
                                )}
                                className={cn(
                                    'w-full pl-11 pr-10 py-3 rounded-xl text-slate-100',
                                    'bg-slate-800/80 border border-white/10',
                                    'placeholder-slate-500 text-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/40',
                                    'transition-all duration-200',
                                )}
                                aria-label={t('strainLookup.placeholder', 'Search strain')}
                                aria-autocomplete="list"
                                aria-expanded={showSuggestions && suggestions.length > 0}
                            />
                            {query && (
                                <button
                                    onClick={handleClear}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-slate-300 transition-colors"
                                    aria-label={t('strainLookup.clear', 'Clear')}
                                >
                                    <PhosphorIcons.X className="w-4 h-4" />
                                </button>
                            )}

                            {/* Suggestions dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className={cn(
                                        'absolute left-0 right-0 top-full mt-1 z-50',
                                        'bg-slate-800 border border-white/10 rounded-xl shadow-2xl',
                                        'overflow-hidden',
                                    )}
                                    role="listbox"
                                >
                                    {suggestions.map((s) => (
                                        <button
                                            key={s}
                                            role="option"
                                            aria-selected={false}
                                            onClick={() => handleSuggestionClick(s)}
                                            className={cn(
                                                'w-full text-left px-4 py-2.5 text-sm text-slate-200',
                                                'hover:bg-primary-500/10 hover:text-primary-300',
                                                'flex items-center gap-2 transition-colors',
                                            )}
                                        >
                                            <PhosphorIcons.Leafy className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || query.trim().length < 2}
                            className="px-5 py-3 rounded-xl font-semibold whitespace-nowrap"
                        >
                            {isLoading ? (
                                <PhosphorIcons.ArrowClockwise className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <PhosphorIcons.Sparkle className="w-4 h-4 mr-1.5" />
                                    {t('strainLookup.analyze', 'Analyze')}
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Loading state */}
                    {isLoading && (
                        <div className="flex items-center gap-3 py-2">
                            <div className="flex gap-1">
                                {(
                                    [
                                        'local',
                                        'cannlytics',
                                        'otreeba',
                                        'cannabis-api',
                                        'ai',
                                    ] as ConfidenceSource[]
                                ).map((src, i) => (
                                    <span
                                        key={src}
                                        className={cn(
                                            'text-xs px-2 py-0.5 rounded-full animate-pulse border',
                                            i === 0
                                                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
                                                : i === 1
                                                  ? 'text-blue-400 border-blue-500/30 bg-blue-500/5'
                                                  : i === 2
                                                    ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5'
                                                    : i === 3
                                                      ? 'text-violet-400 border-violet-500/30 bg-violet-500/5'
                                                      : 'text-amber-400 border-amber-500/30 bg-amber-500/5',
                                        )}
                                        style={{ animationDelay: `${i * 0.15}s` }}
                                    >
                                        {src}
                                    </span>
                                ))}
                            </div>
                            <span className="text-xs text-muted">
                                {t('strainLookup.searching', 'Searching all sources...')}
                            </span>
                        </div>
                    )}

                    {/* Error state */}
                    {error && !isLoading && (
                        <div className="flex items-center gap-2 text-amber-400 text-sm py-1">
                            <PhosphorIcons.Warning className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </div>
            </Card>

            {/* Result card */}
            {result && !isLoading && (
                <ResultCard
                    result={result}
                    matchScore={matchScore}
                    onAddToLibrary={handleAddToLibrary}
                    onToggleFavorite={handleToggleFavorite}
                    onFindSimilar={handleFindSimilar}
                    onOpenBreeding={handleOpenBreeding}
                    onShare={handleShare}
                    isInLibrary={isInLibrary}
                    isFavorited={isFavorited}
                />
            )}
        </div>
    )
})

StrainLookupSection.displayName = 'StrainLookupSection'
