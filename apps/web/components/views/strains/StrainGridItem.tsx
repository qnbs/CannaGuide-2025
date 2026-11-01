import React, { memo, useCallback } from 'react'
import { Strain, StrainType } from '@/types'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons'
import { Button } from '@/components/ui/button'
import { scoreStrain, getScoreBadgeClass } from '@/services/strainRecommendationService'
import type { RecommendationContext } from '@/services/strainRecommendationService'

interface StrainGridItemProps {
    strain: Strain
    onSelect: (strain: Strain) => void
    isSelected: boolean
    onToggleSelection: (id: string) => void
    isUserStrain: boolean
    index: number
    isFavorite: boolean
    onToggleFavorite: (id: string) => void
    /** Optional recommendation context -- if provided, a match-score badge is shown */
    recommendationContext?: RecommendationContext | undefined
}

const typeIcons: Record<StrainType, React.ReactNode> = {
    [StrainType.Sativa]: <SativaIcon />,
    [StrainType.Indica]: <IndicaIcon />,
    [StrainType.Hybrid]: <HybridIcon />,
}

const typeClasses: Record<StrainType, string> = {
    [StrainType.Sativa]: 'text-accent-400',
    [StrainType.Indica]: 'text-secondary-400',
    [StrainType.Hybrid]: 'text-primary-400',
}

const reportedStrainType = (type: string | undefined): StrainType | undefined => {
    if (type === StrainType.Sativa || type === StrainType.Indica || type === StrainType.Hybrid) {
        return type
    }
    return undefined
}

const reportedNumber = (value: unknown, digits: number, unknownLabel: string): string =>
    typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : unknownLabel

const StrainGridItem: React.FC<StrainGridItemProps> = memo(
    ({
        strain,
        onSelect,
        isSelected,
        onToggleSelection,
        isUserStrain,
        index,
        isFavorite,
        onToggleFavorite,
        recommendationContext,
    }) => {
        const { t } = useTranslation()

        const handleActionClick = (e: React.MouseEvent, action: () => void) => {
            e.stopPropagation()
            action()
        }

        const safeType = reportedStrainType(strain.type)
        const unknown = t('common.unknown')
        const safeName =
            typeof strain.name === 'string' && strain.name.trim() !== ''
                ? strain.name
                : t('plantsView.unknownStrain')
        const safeThc = reportedNumber(strain.thc, 1, unknown)
        const safeFloweringTime =
            strain.floweringTimeRange || reportedNumber(strain.floweringTime, 0, unknown)
        const handleSelect = useCallback(() => {
            onSelect(strain)
        }, [onSelect, strain])

        const matchScore =
            recommendationContext !== undefined
                ? scoreStrain(strain, recommendationContext)
                : undefined
        const cardClassName = `flex flex-col h-full text-center relative cursor-pointer !p-3 animate-fade-in-stagger ${isSelected ? 'ring-2 ring-primary-500 bg-primary-900/40' : ''}`
        const favoriteButtonClassName = `favorite-btn-glow ${isFavorite ? 'is-favorite' : ''}`

        return (
            <Card className={cardClassName} style={{ animationDelay: `${index * 20}ms` }}>
                <button
                    type="button"
                    onClick={handleSelect}
                    className="absolute inset-0 z-10 rounded-[1.35rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                    aria-label={safeName}
                    aria-pressed={isSelected}
                />

                <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20 pointer-events-auto">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(strain.id)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="custom-checkbox"
                        aria-label={t('strainsView.accessibility.selectStrain', { name: safeName })}
                    />
                </div>

                {isUserStrain && (
                    <span
                        className="absolute top-2 left-2 z-20"
                        title={t('strainsView.tabs.myStrains')}
                    >
                        <PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400" />
                    </span>
                )}

                <div
                    className={`mx-auto mb-2 w-12 h-12 pointer-events-none ${safeType ? typeClasses[safeType] : 'text-slate-400'}`}
                >
                    {safeType ? (
                        typeIcons[safeType]
                    ) : (
                        <PhosphorIcons.Question className="w-full h-full" />
                    )}
                </div>

                <h3 className="font-bold text-slate-100 truncate pointer-events-none">
                    {safeName}
                </h3>
                <p className="text-xs text-slate-400 mb-2 pointer-events-none">
                    {safeType ?? unknown}
                </p>

                {matchScore !== undefined && (
                    <div className="pointer-events-none mb-1">
                        <span
                            className={`inline-block px-1.5 py-0.5 rounded text-3xs font-semibold tracking-wide ${getScoreBadgeClass(matchScore.score)}`}
                            title={t('strainsView.matchScore', { score: matchScore.score })}
                        >
                            {matchScore.score}% {matchScore.label}
                        </span>
                    </div>
                )}

                <div className="mt-auto text-xs grid grid-cols-2 gap-2 font-mono pointer-events-none">
                    <div className="bg-slate-800/70 rounded p-1 flex items-center justify-center gap-1">
                        {safeThc === unknown ? unknown : `${safeThc}%`}
                    </div>
                    <div className="bg-slate-800/70 rounded p-1 flex items-center justify-center gap-1">
                        <PhosphorIcons.ArrowClockwise className="w-3 h-3" />
                        {safeFloweringTime === unknown ? unknown : `${safeFloweringTime} w`}
                    </div>
                </div>

                <div className="absolute bottom-2 right-2 flex flex-col gap-1.5 z-20 pointer-events-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={favoriteButtonClassName}
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                            handleActionClick(e, () => onToggleFavorite(strain.id))
                        }
                        aria-label={
                            isFavorite
                                ? t('strainsView.accessibility.removeFromFavorites', {
                                      name: safeName,
                                  })
                                : t('strainsView.accessibility.addToFavorites', { name: safeName })
                        }
                    >
                        <PhosphorIcons.Heart
                            weight={isFavorite ? 'fill' : 'regular'}
                            className="w-4 h-4"
                        />
                    </Button>
                </div>
            </Card>
        )
    },
)

StrainGridItem.displayName = 'StrainGridItem'

export default StrainGridItem
