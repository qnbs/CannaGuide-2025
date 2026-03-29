import React, { memo, useCallback } from 'react'
import { Strain, StrainType } from '@/types'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons'
import { Button } from '@/components/ui/button'

interface StrainGridItemProps {
    strain: Strain
    onSelect: (strain: Strain) => void
    isSelected: boolean
    onToggleSelection: (id: string) => void
    isUserStrain: boolean
    index: number
    isFavorite: boolean
    onToggleFavorite: (id: string) => void
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

const getSafeStrainType = (type: string | undefined): StrainType => {
    if (type === StrainType.Sativa || type === StrainType.Indica || type === StrainType.Hybrid) {
        return type
    }

    return StrainType.Hybrid
}

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
    }) => {
        const { t } = useTranslation()

        const handleActionClick = (e: React.MouseEvent, action: () => void) => {
            e.stopPropagation()
            action()
        }

        const safeType = getSafeStrainType(strain.type)
        const safeName =
            typeof strain.name === 'string' && strain.name.trim() !== ''
                ? strain.name
                : t('strainsView.unknownStrain')
        const safeThc =
            typeof strain.thc === 'number' && Number.isFinite(strain.thc) ? strain.thc : 0
        const safeFloweringTime =
            typeof strain.floweringTime === 'number' && Number.isFinite(strain.floweringTime)
                ? strain.floweringTime
                : 0
        const handleSelect = useCallback(() => {
            onSelect(strain)
        }, [onSelect, strain])
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
                    className={`mx-auto mb-2 w-12 h-12 pointer-events-none ${typeClasses[safeType]}`}
                >
                    {typeIcons[safeType]}
                </div>

                <h3 className="font-bold text-slate-100 truncate pointer-events-none">
                    {safeName}
                </h3>
                <p className="text-xs text-slate-400 mb-2 pointer-events-none">{safeType}</p>

                <div className="mt-auto text-xs grid grid-cols-2 gap-2 font-mono pointer-events-none">
                    <div className="bg-slate-800/70 rounded p-1 flex items-center justify-center gap-1">
                        {safeThc.toFixed(1)}%
                    </div>
                    <div className="bg-slate-800/70 rounded p-1 flex items-center justify-center gap-1">
                        <PhosphorIcons.ArrowClockwise className="w-3 h-3" />
                        {strain.floweringTimeRange || safeFloweringTime} w
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
