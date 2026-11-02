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
    titleFor: (score: number) => string
}> = ({ score, titleFor }) =>
    score ? (
        <div className="pointer-events-none mb-1">
            <span
                className={`inline-block px-1.5 py-0.5 rounded text-3xs font-semibold tracking-wide ${getScoreBadgeClass(score.score)}`}
                title={titleFor(score.score)}
            >
                {score.score}% {score.label}
            </span>
        </div>
    ) : null

const FavoriteButton: React.FC<{
    isFavorite: boolean
    label: string
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}> = ({ isFavorite, label, onClick }) => (
    <Button
        variant="ghost"
        size="icon"
        className={`favorite-btn-glow ${isFavorite ? 'is-favorite' : ''}`}
        onClick={onClick}
        aria-label={label}
    >
        <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-4 h-4" />
    </Button>
)

const matchFor = (
    strain: Strain,
    context: RecommendationContext | undefined,
): ReturnType<typeof scoreStrain> | undefined =>
    context === undefined ? undefined : scoreStrain(strain, context)

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
            t('common.units.weeks'),
            unknown,
        )
        const handleSelect = useCallback(() => {
            onSelect(strain)
        }, [onSelect, strain])
        const matchScore = matchFor(strain, recommendationContext)
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
                    titleFor={(score) => t('strainsView.matchScore', { score })}
                />
                <div className="mt-auto text-xs grid grid-cols-2 gap-2 font-mono pointer-events-none">
                    <GridStat value={safeThc} unknown={unknown} />
                    <GridStat value={safeFloweringTime} unknown={unknown} icon />
                </div>
                <div className="absolute bottom-2 right-2 flex flex-col gap-1.5 z-20 pointer-events-auto">
                    <FavoriteButton
                        isFavorite={isFavorite}
                        label={favoriteLabel}
                        onClick={(event) => {
                            event.stopPropagation()
                            onToggleFavorite(strain.id)
                        }}
                    />
                </div>
            </Card>
        )
    },
)

StrainGridItem.displayName = 'StrainGridItem'

export default StrainGridItem
