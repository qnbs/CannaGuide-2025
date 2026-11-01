import React, { memo, useCallback } from 'react'
import { Strain, StrainType } from '@/types'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons'
import { Button } from '@/components/ui/button'
import { scoreStrain, getScoreBadgeClass } from '@/services/strainRecommendationService'
import type { RecommendationContext } from '@/services/strainRecommendationService'
import {
    favoriteActionLabel,
    formatFloweringWeeks,
    reportedName,
    reportedNumber,
    reportedStrainType,
} from './reportedStrainFacts'

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

const cardClassName = (isSelected: boolean): string =>
    `flex flex-col h-full text-center relative cursor-pointer !p-3 animate-fade-in-stagger ${isSelected ? 'ring-2 ring-primary-500 bg-primary-900/40' : ''}`

const StrainTypeGlyph: React.FC<{ type: StrainType | undefined }> = ({ type }) => (
    <div
        className={`mx-auto mb-2 w-12 h-12 pointer-events-none ${type ? typeClasses[type] : 'text-slate-400'}`}
    >
        {type ? typeIcons[type] : <PhosphorIcons.Question className="w-full h-full" />}
    </div>
)

const UserStrainMark: React.FC<{ visible: boolean; title: string }> = ({ visible, title }) =>
    visible ? (
        <span className="absolute top-2 left-2 z-20" title={title}>
            <PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400" />
        </span>
    ) : null

const MatchBadge: React.FC<{
    score: { score: number; label: string } | undefined
    title: string
}> = ({ score, title }) =>
    score ? (
        <div className="pointer-events-none mb-1">
            <span
                className={`inline-block px-1.5 py-0.5 rounded text-3xs font-semibold tracking-wide ${getScoreBadgeClass(score.score)}`}
                title={title}
            >
                {score.score}% {score.label}
            </span>
        </div>
    ) : null

const GridStat: React.FC<{ value: string; unknown: string; icon?: boolean }> = ({
    value,
    unknown,
    icon = false,
}) => (
    <div className="bg-slate-800/70 rounded p-1 flex items-center justify-center gap-1">
        {icon ? <PhosphorIcons.ArrowClockwise className="w-3 h-3" /> : null}
        {value === unknown ? unknown : icon ? value : `${value}%`}
    </div>
)

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
        const safeType = reportedStrainType(strain.type)
        const unknown = t('common.unknown')
        const safeName = reportedName(strain.name, t('plantsView.unknownStrain'))
        const safeThc = reportedNumber(strain.thc, 1, unknown)
        const safeFloweringTime = formatFloweringWeeks(
            strain.floweringTimeRange,
            strain.floweringTime,
            'w',
            unknown,
        )
        const handleSelect = useCallback(() => {
            onSelect(strain)
        }, [onSelect, strain])
        const handleActionClick = (event: React.MouseEvent, action: () => void) => {
            event.stopPropagation()
            action()
        }
        const matchScore = recommendationContext
            ? scoreStrain(strain, recommendationContext)
            : undefined
        const favoriteLabel = favoriteActionLabel(
            isFavorite,
            t('strainsView.accessibility.removeFromFavorites', { name: safeName }),
            t('strainsView.accessibility.addToFavorites', { name: safeName }),
        )

        return (
            <Card
                className={cardClassName(isSelected)}
                style={{ animationDelay: `${index * 20}ms` }}
            >
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
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        className="custom-checkbox"
                        aria-label={t('strainsView.accessibility.selectStrain', { name: safeName })}
                    />
                </div>
                <UserStrainMark visible={isUserStrain} title={t('strainsView.tabs.myStrains')} />
                <StrainTypeGlyph type={safeType} />
                <h3 className="font-bold text-slate-100 truncate pointer-events-none">
                    {safeName}
                </h3>
                <p className="text-xs text-slate-400 mb-2 pointer-events-none">
                    {safeType ?? unknown}
                </p>
                <MatchBadge
                    score={matchScore}
                    title={t('strainsView.matchScore', {
                        score: matchScore ? matchScore.score : 0,
                    })}
                />
                <div className="mt-auto text-xs grid grid-cols-2 gap-2 font-mono pointer-events-none">
                    <GridStat value={safeThc} unknown={unknown} />
                    <GridStat value={safeFloweringTime} unknown={unknown} icon />
                </div>
                <div className="absolute bottom-2 right-2 flex flex-col gap-1.5 z-20 pointer-events-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`favorite-btn-glow ${isFavorite ? 'is-favorite' : ''}`}
                        onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
                            handleActionClick(event, () => onToggleFavorite(strain.id))
                        }
                        aria-label={favoriteLabel}
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
