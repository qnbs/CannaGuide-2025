import React, { memo, useCallback } from 'react'
import { Strain, StrainType } from '@/types'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons'
import { Button } from '@/components/common/Button'
import { useAppDispatch } from '@/stores/store'
// FIX: Switched to using the exported `initiateGrowFromStrainList` thunk as suggested by the error.
import { initiateGrowFromStrainList } from '@/stores/slices/uiSlice'

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

const getSafeStrainType = (type: string | undefined): StrainType => {
    if (type === StrainType.Sativa || type === StrainType.Indica || type === StrainType.Hybrid) {
        return type
    }

    return StrainType.Hybrid
}

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
        const dispatch = useAppDispatch()

        const safeType = getSafeStrainType(strain.type)
        const TypeIcon = typeIcons[safeType]
        const safeName =
            typeof strain.name === 'string' && strain.name.trim() !== ''
                ? strain.name
                : t('strainsView.unknownStrain')
        const safeThc =
            typeof strain.thc === 'number' && Number.isFinite(strain.thc) ? strain.thc : 0
        const safeCbd =
            typeof strain.cbd === 'number' && Number.isFinite(strain.cbd) ? strain.cbd : 0
        const safeFloweringTime =
            typeof strain.floweringTime === 'number' && Number.isFinite(strain.floweringTime)
                ? strain.floweringTime
                : 0

        const handleActionClick = (e: React.MouseEvent, action: () => void) => {
            e.stopPropagation()
            action()
        }

        const handleSelect = useCallback(() => {
            onSelect(strain)
        }, [onSelect, strain])
        const cardClassName = `relative bg-slate-800/60 rounded-lg transition-all duration-200 ring-1 ring-inset ring-white/20 ${isSelected ? 'bg-primary-900/30 ring-2 !ring-primary-500' : 'hover:bg-slate-700/50'}`
        const favoriteButtonClassName = `!p-2 transition-colors favorite-btn-glow ${isFavorite ? 'is-favorite' : 'text-slate-400 hover:text-white'}`

        return (
            <div style={style} className={cardClassName}>
                <button
                    type="button"
                    onClick={handleSelect}
                    className="absolute inset-0 z-10 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                    aria-label={safeName}
                    aria-pressed={isSelected}
                />
                <div className="relative z-20 p-3 grid grid-cols-[auto_40px_1fr_auto] sm:grid-cols-[auto_40px_minmax(0,2.5fr)_repeat(3,minmax(0,1fr))_auto] items-center gap-x-4">
                    {/* Checkbox */}
                    <div>
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelection(strain.id)}
                            className="custom-checkbox flex-shrink-0"
                            aria-label={t('strainsView.accessibility.selectStrain', {
                                name: safeName,
                            })}
                        />
                    </div>

                    {/* Type Icon */}
                    <div className={`w-8 h-8 flex-shrink-0 ${typeClasses[safeType]}`}>
                        {TypeIcon}
                    </div>

                    {/* Name & Main Stats */}
                    <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                            {isUserStrain && (
                                <PhosphorIcons.Star
                                    weight="fill"
                                    className="w-4 h-4 text-amber-400 flex-shrink-0"
                                />
                            )}
                            <p className="font-bold text-slate-100 truncate">{safeName}</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 sm:hidden">
                            {safeThc.toFixed(1)}% THC | {safeFloweringTime}{' '}
                            {t('common.units.weeks')}
                        </p>
                    </div>

                    {/* Desktop stats */}
                    <div
                        className="hidden sm:flex items-center justify-center gap-1.5 font-mono text-sm"
                        title="THC"
                    >
                        <span>{safeThc.toFixed(1)}%</span>
                    </div>
                    <div
                        className="hidden sm:flex items-center justify-center gap-1.5 font-mono text-sm"
                        title="CBD"
                    >
                        <span>{safeCbd.toFixed(1)}%</span>
                    </div>
                    <div
                        className="hidden sm:flex items-center justify-center gap-1.5 font-mono text-sm"
                        title={t('strainsView.table.flowering')}
                    >
                        <span>{strain.floweringTimeRange || safeFloweringTime}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 ml-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="!p-2"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                                handleActionClick(e, () =>
                                    dispatch(initiateGrowFromStrainList(strain)),
                                )
                            }
                            title={t('strainsView.startGrowing')}
                            aria-label={t('strainsView.startGrowing')}
                        >
                            <PhosphorIcons.Plant className="w-5 h-5 text-primary-300" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={favoriteButtonClassName}
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                                handleActionClick(e, () => onToggleFavorite(strain.id))
                            }
                            title={
                                isFavorite
                                    ? t('strainsView.accessibility.removeFromFavorites', {
                                          name: safeName,
                                      })
                                    : t('strainsView.accessibility.addToFavorites', {
                                          name: safeName,
                                      })
                            }
                            aria-label={
                                isFavorite
                                    ? t('strainsView.accessibility.removeFromFavorites', {
                                          name: safeName,
                                      })
                                    : t('strainsView.accessibility.addToFavorites', {
                                          name: safeName,
                                      })
                            }
                        >
                            <PhosphorIcons.Heart
                                weight={isFavorite ? 'fill' : 'regular'}
                                className="w-5 h-5"
                            />
                        </Button>
                    </div>
                </div>
            </div>
        )
    },
)

StrainListItem.displayName = 'StrainListItem'
