import React, { memo, useCallback } from 'react'
import { Strain, StrainType } from '@/types'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons'
import { Button } from '@/components/common/Button'
import { initiateGrowFromStrainList } from '@/stores/useUIStore'
import {
    favoriteActionLabel,
    formatFloweringWeeks,
    reportedName,
    reportedNumber,
    reportedStrainType,
} from './reportedStrainFacts'

interface StrainListItemProps {
    strain: Strain
    onSelect: (strain: Strain) => void
    isSelected: boolean
    onToggleSelection: (id: string) => void
    isUserStrain: boolean
    onDelete: (id: string) => void
    style?: React.CSSProperties
    isFavorite: boolean
    onToggleFavorite: (id: string) => void
}

const typeIcons: Record<StrainType, React.ReactNode> = {
    [StrainType.Sativa]: <SativaIcon className="w-full h-full" />,
    [StrainType.Indica]: <IndicaIcon className="w-full h-full" />,
    [StrainType.Hybrid]: <HybridIcon className="w-full h-full" />,
}

const typeClasses: Record<StrainType, string> = {
    [StrainType.Sativa]: 'text-accent-400',
    [StrainType.Indica]: 'text-secondary-400',
    [StrainType.Hybrid]: 'text-primary-400',
}

const cardClassName = (isSelected: boolean): string =>
    `relative bg-slate-800/60 rounded-lg transition-all duration-200 ring-1 ring-inset ring-white/20 ${isSelected ? 'bg-primary-900/30 ring-2 !ring-primary-500' : 'hover:bg-slate-700/50'}`

const favoriteClassName = (isFavorite: boolean): string =>
    `transition-colors favorite-btn-glow ${isFavorite ? 'is-favorite' : 'text-slate-400 hover:text-white'}`

const UserStrainMark: React.FC<{ visible: boolean }> = ({ visible }) =>
    visible ? (
        <PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" />
    ) : null

const percentText = (value: string, unknown: string): string =>
    value === unknown ? unknown : `${value}%`

const PercentCell: React.FC<{ value: string; unknown: string; title: string }> = ({
    value,
    unknown,
    title,
}) => (
    <div
        className="hidden sm:flex items-center justify-center gap-1.5 font-mono text-sm"
        title={title}
    >
        <span>{percentText(value, unknown)}</span>
    </div>
)

const TypeGlyph: React.FC<{ type: StrainType | undefined }> = ({ type }) => (
    <div className={`w-8 h-8 flex-shrink-0 ${type ? typeClasses[type] : 'text-slate-400'}`}>
        {type ? typeIcons[type] : <PhosphorIcons.Question className="w-full h-full" />}
    </div>
)

const NameCell: React.FC<{
    visible: boolean
    name: string
    mobileLine: string
}> = ({ visible, name, mobileLine }) => (
    <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
            <UserStrainMark visible={visible} />
            <p className="font-bold text-slate-100 truncate">{name}</p>
        </div>
        <p className="text-xs text-slate-400 mt-1 sm:hidden">{mobileLine}</p>
    </div>
)

const ListActions: React.FC<{
    growLabel: string
    favoriteLabel: string
    isFavorite: boolean
    onGrow: (event: React.MouseEvent<HTMLButtonElement>) => void
    onFavorite: (event: React.MouseEvent<HTMLButtonElement>) => void
}> = ({ growLabel, favoriteLabel, isFavorite, onGrow, onFavorite }) => (
    <div className="flex items-center gap-1.5 ml-auto pointer-events-auto">
        <Button variant="ghost" size="icon" onClick={onGrow} aria-label={growLabel}>
            <PhosphorIcons.Plant className="w-5 h-5 text-primary-300" />
        </Button>
        <Button
            variant="ghost"
            size="icon"
            className={favoriteClassName(isFavorite)}
            onClick={onFavorite}
            title={favoriteLabel}
            aria-label={favoriteLabel}
        >
            <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-5 h-5" />
        </Button>
    </div>
)

export const StrainListItem: React.FC<StrainListItemProps> = memo(
    ({
        strain,
        onSelect,
        isSelected,
        onToggleSelection,
        isUserStrain,
        style,
        isFavorite,
        onToggleFavorite,
    }) => {
        const { t } = useTranslation()
        const safeType = reportedStrainType(strain.type)
        const unknown = t('common.unknown')
        const safeName = reportedName(strain.name, t('plantsView.unknownStrain'))
        const safeThc = reportedNumber(strain.thc, 1, unknown)
        const safeCbd = reportedNumber(strain.cbd, 1, unknown)
        const safeFloweringTime = formatFloweringWeeks(
            strain.floweringTimeRange,
            strain.floweringTime,
            t('common.units.weeks'),
            unknown,
        )
        const handleSelect = useCallback(() => {
            onSelect(strain)
        }, [onSelect, strain])
        const favoriteLabel = favoriteActionLabel(
            isFavorite,
            t('strainsView.accessibility.removeFromFavorites', { name: safeName }),
            t('strainsView.accessibility.addToFavorites', { name: safeName }),
        )

        return (
            <div style={style} className={cardClassName(isSelected)}>
                <button
                    type="button"
                    onClick={handleSelect}
                    className="absolute inset-0 z-10 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                    aria-label={safeName}
                    aria-pressed={isSelected}
                />
                <div className="relative z-20 p-3 grid grid-cols-[auto_40px_1fr_auto] sm:grid-cols-[auto_40px_minmax(0,2.5fr)_repeat(3,minmax(0,1fr))_auto] items-center gap-x-4 rounded-lg pointer-events-none">
                    <div className="pointer-events-auto">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelection(strain.id)}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                            className="custom-checkbox flex-shrink-0"
                            aria-label={t('strainsView.accessibility.selectStrain', {
                                name: safeName,
                            })}
                        />
                    </div>
                    <TypeGlyph type={safeType} />
                    <NameCell
                        visible={isUserStrain}
                        name={safeName}
                        mobileLine={`${percentText(safeThc, unknown)} THC | ${safeFloweringTime}`}
                    />
                    <PercentCell value={safeThc} unknown={unknown} title="THC" />
                    <PercentCell value={safeCbd} unknown={unknown} title="CBD" />
                    <div
                        className="hidden sm:flex items-center justify-center gap-1.5 font-mono text-sm"
                        title={t('strainsView.table.flowering')}
                    >
                        <span>{safeFloweringTime}</span>
                    </div>
                    <ListActions
                        growLabel={t('strainsView.startGrowing')}
                        favoriteLabel={favoriteLabel}
                        isFavorite={isFavorite}
                        onGrow={(event) => {
                            event.stopPropagation()
                            initiateGrowFromStrainList(strain)
                        }}
                        onFavorite={(event) => {
                            event.stopPropagation()
                            onToggleFavorite(strain.id)
                        }}
                    />
                </div>
            </div>
        )
    },
)

StrainListItem.displayName = 'StrainListItem'
