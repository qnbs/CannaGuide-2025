import React, { createContext, useState, useEffect, ReactNode, useMemo, useContext } from 'react';
import { Plant, JournalEntry } from '@/types';
import { usePlantManager } from '@/hooks/usePlantManager';
import { storageService } from '@/services/storageService';

interface PlantContextType {
    plants: (Plant | null)[];
    setPlants: React.Dispatch<React.SetStateAction<(Plant | null)[]>>;
    addJournalEntry: (plantId: string, entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
    completeTask: (plantId: string, taskId: string) => void;
    waterAllPlants: () => void;
    advanceDay: () => void;
    resetPlants: () => void;
    updatePlantState: (plantIdToUpdate?: string) => void;
}

export const PlantContext = createContext<PlantContextType | undefined>(undefined);

export const PlantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [plants, setPlants] = useState<(Plant | null)[]>(() =>
        storageService.getItem('plants', [null, null, null])
    );

    const plantManager = usePlantManager(plants, setPlants);

    useEffect(() => {
        storageService.setItem('plants', plants);
    }, [plants]);

    const resetPlants = () => {
        setPlants([null, null, null]);
        storageService.removeItem('plants');
    };

    const contextValue = useMemo(() => ({
        plants,
        setPlants,
        ...plantManager,
        resetPlants,
    }), [plants, setPlants, plantManager]);

    return (
        <PlantContext.Provider value={contextValue}>
            {children}
        </PlantContext.Provider>
    );
};

export const usePlants = () => {
    const context = useContext(PlantContext);
    if (context === undefined) {
        throw new Error('usePlants must be used within a PlantProvider');
    }
    return context;
};