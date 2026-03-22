import React, { useMemo, useRef, useEffect, useState, useCallback, memo } from 'react'
import { Strain } from '@/types'
import StrainGridItem from './StrainGridItem'
import { useVirtualizer } from '@/hooks/useVirtualizer'
import { MOBILE_BOTTOM_NAV_SAFE_OFFSET } from '@/constants'

interface StrainGridProps {
    strains: Strain[]
    onSelect: (strain: Strain) => void
    selectedIds: Set<string>
    onToggleSelection: (id: string) => void
    isUserStrain: (id: string) => boolean
    isPending?: boolean
    favorites: Set<string>
    onToggleFavorite: (id: string) => void
}

const StrainGridComponent: React.FC<StrainGridProps> = ({
    strains,
    onSelect,
    selectedIds,
    onToggleSelection,
    isUserStrain,
    isPending,
    favorites,
    onToggleFavorite,
}) => {
    const scrollElementRef = useRef<HTMLElement | null>(null)
    const [columns, setColumns] = useState(2)
    const rowHeight = 260
    const gapSize = 16
    useEffect(() => {
        scrollElementRef.current = document.querySelector('main')

        const updateColumns = () => {
            const width = window.innerWidth
            if (width >= 1280) {
                setColumns(5)
            } else if (width >= 1024) {
                setColumns(4)
            } else if (width >= 768) {
                setColumns(3)
            } else {
                setColumns(2)
            }
        }

        updateColumns()
        window.addEventListener('resize', updateColumns)
        return () => window.removeEventListener('resize', updateColumns)
    }, [])

    const getScrollElement = useCallback(() => scrollElementRef.current, [])
    const contentOpacityClass = isPending ? 'opacity-50' : 'opacity-100'

    const rowCount = useMemo(() => Math.ceil(strains.length / columns), [strains.length, columns])

    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement,
        estimateSize: rowHeight + gapSize,
        overscan: 4,
    })

    return (
        <div
            className={`transition-opacity duration-300 ${contentOpacityClass}`}
            style={{
                height: `${rowVirtualizer.totalSize + MOBILE_BOTTOM_NAV_SAFE_OFFSET}px`,
                position: 'relative',
                width: '100%',
            }}
        >
            {rowVirtualizer.virtualItems.map((virtualRow) => {
                const startIndex = virtualRow.index * columns
                const items = strains.slice(startIndex, startIndex + columns)

                return (
                    <div
                        key={`row-${virtualRow.index}`}
                        ref={rowVirtualizer.measureElement(virtualRow.index)}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            transform: `translateY(${virtualRow.offsetTop}px)`,
                        }}
                    >
                        <div
                            className="grid gap-4"
                            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                        >
                            {items.map((strain, localIndex) => {
                                const index = startIndex + localIndex
                                return (
                                    <StrainGridItem
                                        key={strain.id}
                                        strain={strain}
                                        onSelect={onSelect}
                                        isSelected={selectedIds.has(strain.id)}
                                        onToggleSelection={onToggleSelection}
                                        isUserStrain={isUserStrain(strain.id)}
                                        index={index}
                                        isFavorite={favorites.has(strain.id)}
                                        onToggleFavorite={onToggleFavorite}
                                    />
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
export const StrainGrid = memo(StrainGridComponent)
