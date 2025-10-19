import React, { memo, useRef, useEffect } from 'react';
import { Strain } from '@/types';
import { StrainListItem } from './StrainListItem';
import { useVirtualizer } from '@/hooks/useVirtualizer';

interface StrainListProps {
    strains: Strain[];
    onSelect: (strain: Strain) => void;
    selectedIds: Set<string>;
    onToggleSelection: (id: string) => void;
    isUserStrain: (id: string) => boolean;
    onDelete: (id: string) => void;
    isPending?: boolean;
    favorites: Set<string>;
    onToggleFavorite: (id: string) => void;
}

export const StrainList: React.FC<StrainListProps> = memo(({
    strains, onSelect, selectedIds, onToggleSelection, isUserStrain, onDelete,
    isPending, favorites, onToggleFavorite
}) => {
    const scrollElementRef = useRef<HTMLElement | null>(null);

    // On component mount, find the main scrolling element of the app layout.
    useEffect(() => {
        scrollElementRef.current = document.querySelector('main');
    }, []);

    const rowVirtualizer = useVirtualizer({
        count: strains.length,
        getScrollElement: () => scrollElementRef.current,
        estimateSize: 68, // Approximate height of a StrainListItem in px (p-3 = 12px*2, content ~44px)
        overscan: 10,
    });
    
    return (
        <div 
            className={`transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}
            style={{
                height: `${rowVirtualizer.totalSize}px`,
                width: '100%',
                position: 'relative',
            }}
        >
            {rowVirtualizer.virtualItems.map((virtualItem) => {
                 const strain = strains[virtualItem.index];
                 if (!strain) return null;

                 return (
                    <div
                        key={strain.id}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualItem.height}px`,
                            transform: `translateY(${virtualItem.offsetTop}px)`,
                            paddingBottom: '8px' // Simulates space-y-2
                        }}
                    >
                        <StrainListItem
                            strain={strain}
                            onSelect={onSelect}
                            isSelected={selectedIds.has(strain.id)}
                            onToggleSelection={onToggleSelection}
                            isUserStrain={isUserStrain(strain.id)}
                            onDelete={onDelete}
                            isFavorite={favorites.has(strain.id)}
                            onToggleFavorite={() => onToggleFavorite(strain.id)}
                        />
                    </div>
                 )
            })}
        </div>
    );
});
