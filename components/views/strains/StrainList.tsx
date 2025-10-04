import React, { memo } from 'react';
import { Strain } from '@/types';
import { StrainListItem } from './StrainListItem';

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

    return (
        <div className={`space-y-2 transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
            {strains.map((strain, index) => (
                <StrainListItem
                    key={strain.id}
                    strain={strain}
                    onSelect={onSelect}
                    isSelected={selectedIds.has(strain.id)}
                    onToggleSelection={onToggleSelection}
                    isUserStrain={isUserStrain(strain.id)}
                    onDelete={onDelete}
                    style={{ animationDelay: `${index * 15}ms` }}
                    isFavorite={favorites.has(strain.id)}
                    onToggleFavorite={() => onToggleFavorite(strain.id)}
                />
            ))}
        </div>
    );
});
