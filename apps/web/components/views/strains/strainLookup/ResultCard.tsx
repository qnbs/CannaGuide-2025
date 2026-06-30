import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { cn } from '@/lib/utils'
import type { LookupStrainResult } from '@/services/strainLookupService'
import {
    ConfidenceBadge,
    CannabinoidPie,
    TerpeneRadar,
    CannabinoidBar,
    EntourageScore,
    FlavonoidBar,
    TerpeneDetailList,
    GeneticsTree,
} from './charts'

interface ResultCardProps {
    result: LookupStrainResult
    matchScore: number
    onAddToLibrary: (result: LookupStrainResult) => void
    onToggleFavorite: (result: LookupStrainResult) => void
    onFindSimilar: (result: LookupStrainResult) => void
    onOpenBreeding: (result: LookupStrainResult) => void
    onShare: (result: LookupStrainResult) => void
    isInLibrary: boolean
    isFavorited: boolean
}

export const ResultCard: React.FC<ResultCardProps> = memo(
    ({
        result,
        matchScore,
        onAddToLibrary,
        onToggleFavorite,
        onFindSimilar,
        onOpenBreeding,
        onShare,
        isInLibrary,
        isFavorited,
    }) => {
        const { t } = useTranslation()

        const typeColor =
            result.type === 'Indica'
                ? 'text-purple-400 bg-purple-400/10'
                : result.type === 'Sativa'
                  ? 'text-orange-400 bg-orange-400/10'
                  : 'text-emerald-400 bg-emerald-400/10'

        const hasTerpenes = result.terpenes.length > 0
        const hasCannabinoids = result.cannabinoids.length > 1

        return (
            <Card className="overflow-hidden border border-primary-500/20 bg-gradient-to-b from-slate-800/80 to-slate-900/80">
                {/* Header gradient bar */}
                <div className="h-1 bg-gradient-to-r from-emerald-500 via-primary-500 to-purple-500" />

                <div className="p-4 md:p-6 space-y-5">
                    {/* Top row: name + badges */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                            <h3 className="text-xl md:text-2xl font-extrabold text-slate-100 leading-tight">
                                {result.name}
                            </h3>
                            {result.breeder &&
                                result.breeder !== 'Community' &&
                                result.breeder !== 'Unknown' && (
                                    <p className="text-sm text-slate-400 mt-0.5">
                                        {result.breeder}
                                    </p>
                                )}
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0 items-center">
                            <span
                                className={cn(
                                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                                    typeColor,
                                )}
                            >
                                {result.type}
                            </span>
                            {result.floweringType === 'Autoflower' && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-cyan-400 bg-cyan-400/10">
                                    Auto
                                </span>
                            )}
                            {matchScore >= 60 && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-amber-400 bg-amber-400/10">
                                    {matchScore}% {t('strainLookup.match', 'match')}
                                </span>
                            )}
                            <ConfidenceBadge
                                source={result.confidenceSource}
                                score={result.confidenceScore}
                            />
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="flex gap-4 text-sm flex-wrap">
                        {result.thc > 0 && (
                            <span className="text-emerald-400 font-semibold">
                                THC {result.thc.toFixed(1)}%
                            </span>
                        )}
                        {result.cbd > 0 && (
                            <span className="text-blue-400 font-semibold">
                                CBD {result.cbd.toFixed(1)}%
                            </span>
                        )}
                        {result.cbg > 0 && (
                            <span className="text-purple-400 font-semibold">
                                CBG {result.cbg.toFixed(1)}%
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    {result.description && (
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {result.description}
                        </p>
                    )}

                    {/* AI insight */}
                    {result.aiSummary && (
                        <div className="rounded-lg bg-primary-500/5 border border-primary-500/15 p-3">
                            <p className="text-xs font-semibold text-primary-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                <PhosphorIcons.Sparkle className="w-3.5 h-3.5" />
                                {t('strainLookup.whyMatters', 'Why this strain matters')}
                            </p>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {result.aiSummary}
                            </p>
                        </div>
                    )}

                    {/* Charts grid */}
                    {(result.thc > 0 || hasTerpenes || hasCannabinoids) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                            {result.thc > 0 && <CannabinoidPie thc={result.thc} cbd={result.cbd} />}
                            {hasTerpenes && <TerpeneRadar terpenes={result.terpenes} />}
                            {hasCannabinoids && (
                                <CannabinoidBar cannabinoids={result.cannabinoids} />
                            )}
                        </div>
                    )}

                    {/* Entourage score + flavonoid row */}
                    {(result.totalEntourageScore !== undefined ||
                        (result.flavonoids && result.flavonoids.length > 0)) && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4 items-start">
                            {result.totalEntourageScore !== undefined && (
                                <div className="flex justify-center sm:justify-start">
                                    <EntourageScore
                                        score={result.totalEntourageScore}
                                        {...(result.terpeneDiversity !== undefined && {
                                            diversity: result.terpeneDiversity,
                                        })}
                                    />
                                </div>
                            )}
                            {result.flavonoids && result.flavonoids.length > 0 && (
                                <div className="sm:col-span-2">
                                    <FlavonoidBar flavonoids={result.flavonoids} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Terpene detail insights */}
                    {hasTerpenes &&
                        result.terpenes.some((tp) => tp.aromaNotes && tp.aromaNotes.length > 0) && (
                            <TerpeneDetailList terpenes={result.terpenes} />
                        )}

                    {/* Genetics */}
                    {result.genetics && <GeneticsTree genetics={result.genetics} />}

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                        {isInLibrary ? (
                            <span className="text-sm text-emerald-400 flex items-center gap-1.5 px-3">
                                <PhosphorIcons.CheckCircle className="w-4 h-4" />
                                {t('strainLookup.inLibrary', 'In Library')}
                            </span>
                        ) : (
                            <Button
                                onClick={() => onAddToLibrary(result)}
                                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-primary-600 hover:from-emerald-500 hover:to-primary-500"
                            >
                                <PhosphorIcons.Database className="w-4 h-4" />
                                {t('strainLookup.addToDB', 'Add to Library')}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={() => onToggleFavorite(result)}
                            className={cn(
                                'flex items-center gap-1.5',
                                isFavorited && 'text-amber-400',
                            )}
                            title={
                                isFavorited
                                    ? t('strainLookup.unfavorite', 'Remove from Favorites')
                                    : t('strainLookup.favorite', 'Add to Favorites')
                            }
                        >
                            <PhosphorIcons.Heart
                                className={cn('w-4 h-4', isFavorited && 'fill-amber-400')}
                            />
                            {t('strainLookup.favorite', 'Favorites')}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => onOpenBreeding(result)}
                            className="flex items-center gap-1.5"
                            title={t('strainLookup.breedingLab', 'Open in Breeding Lab')}
                        >
                            <PhosphorIcons.Flask className="w-4 h-4" />
                            {t('strainLookup.breedingLab', 'Breeding Lab')}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => onFindSimilar(result)}
                            className="flex items-center gap-1.5"
                            title={t('strainLookup.findSimilar', 'Find Similar Strains')}
                        >
                            <PhosphorIcons.GridFour className="w-4 h-4" />
                            {t('strainLookup.findSimilar', 'Similar')}
                        </Button>
                        {'share' in navigator && (
                            <Button
                                variant="ghost"
                                onClick={() => onShare(result)}
                                className="flex items-center gap-1.5"
                                title={t('strainLookup.share', 'Share Strain')}
                            >
                                <PhosphorIcons.ShareNetwork className="w-4 h-4" />
                                {t('strainLookup.share', 'Share')}
                            </Button>
                        )}
                        {result.sourceUrl && (
                            <a
                                href={result.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <PhosphorIcons.ArrowSquareOut className="w-4 h-4" />
                                {t('strainLookup.source', 'Source')}
                            </a>
                        )}
                    </div>
                </div>
            </Card>
        )
    },
)
ResultCard.displayName = 'ResultCard'
