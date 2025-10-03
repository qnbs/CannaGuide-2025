import React from 'react';
import { Strain } from '@/types';
import StrainGridItem from './StrainGridItem';

interface StrainGridProps {
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

export const StrainGrid: React.FC<StrainGridProps> = ({ strains, onSelect, selectedIds, onToggleSelection, isUserStrain, onDelete, isPending, favorites, onToggleFavorite }) => {
    return (
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
            {strains.map((strain, index) => (
                <StrainGridItem
                    key={strain.id}
                    strain={strain}
                    onSelect={onSelect}
                    isSelected={selectedIds.has(strain.id)}
                    onToggleSelection={onToggleSelection}
                    isUserStrain={isUserStrain(strain.id)}
                    onDelete={onDelete}
                    index={index}
                    isFavorite={favorites.has(strain.id)}
                    onToggleFavorite={() => onToggleFavorite(strain.id)}
                />
            ))}
        </div>
    );
};