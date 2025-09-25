import React from 'react';
import { Strain } from '@/types';
import StrainGridItem from './StrainGridItem';

interface StrainGridProps {
    strains: Strain[];
    isUserStrain: (id: string) => boolean;
    onDelete: (id: string) => void;
    isPending?: boolean;
}

export const StrainGrid: React.FC<StrainGridProps> = ({ strains, isUserStrain, onDelete, isPending }) => {
    return (
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
            {strains.map((strain, index) => <StrainGridItem key={strain.id} strain={strain} isUserStrain={isUserStrain(strain.id)} onDelete={onDelete} index={index}/>)}
        </div>
    );
};