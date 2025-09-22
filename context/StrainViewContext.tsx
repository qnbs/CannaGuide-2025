import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback } from 'react';
import { Strain, GrowSetup, View } from '@/types';
import { usePlants } from '@/hooks/usePlants';
import { useNotifications } from '@/context/NotificationContext';
import { useTranslations } from '@/hooks/useTranslations';
import { useFavorites } from '@/hooks/useFavorites';

interface StrainViewContextType {
    state: {
        selectedStrain: Strain | null;
        strainToEdit: Strain | null;
        strainForSetup: Strain | null;
        isAddModalOpen: boolean;
        isExportModalOpen: boolean;
        isSetupModalOpen: boolean;
        favoriteIds: Set<string>;
        isFavorite: (id: string) => boolean;
    };
    actions: {
        selectStrain: (strain: Strain) => void;
        closeDetailModal: () => void;
        openAddModal: (strain?: Strain) => void;
        closeAddModal: () => void;
        openExportModal: () => void;
        closeExportModal: () => void;
        initiateGrow: (strain: Strain) => void;
        confirmGrow: (setup: GrowSetup, strain: Strain) => void;
        closeGrowModal: () => void;
        toggleFavorite: (id: string) => void;
    };
}

export const StrainViewContext = createContext<StrainViewContextType | undefined>(undefined);

export const StrainViewProvider: React.FC<{ children: ReactNode, setActiveView: (view: View) => void }> = ({ children, setActiveView }) => {
    const { hasAvailableSlots, startNewPlant } = usePlants();
    const { addNotification } = useNotifications();
    const { t } = useTranslations();
    const { favoriteIds, toggleFavorite } = useFavorites();

    const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);
    const [strainToEdit, setStrainToEdit] = useState<Strain | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    
    // Grow setup flow state
    const [strainForSetup, setStrainForSetup] = useState<Strain | null>(null);
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    
    const actions = useMemo(() => ({
        selectStrain: (strain: Strain) => setSelectedStrain(strain),
        closeDetailModal: () => setSelectedStrain(null),
        openAddModal: (strainToEdit?: Strain) => {
            setStrainToEdit(strainToEdit || null);
            setIsAddModalOpen(true);
        },
        closeAddModal: () => {
            setStrainToEdit(null);
            setIsAddModalOpen(false);
        },
        openExportModal: () => setIsExportModalOpen(true),
        closeExportModal: () => setIsExportModalOpen(false),
        initiateGrow: (strain: Strain) => {
            if (hasAvailableSlots) {
                setStrainForSetup(strain);
                setIsSetupModalOpen(true);
            } else {
                addNotification(t('plantsView.notifications.allSlotsFull'), 'error');
            }
        },
        confirmGrow: (setup: GrowSetup, strain: Strain) => {
             const success = startNewPlant(strain, setup);
             if (success) {
                setIsSetupModalOpen(false);
                setStrainForSetup(null);
                setSelectedStrain(null);
                setActiveView(View.Plants);
             }
        },
        closeGrowModal: () => {
            setStrainForSetup(null);
            setIsSetupModalOpen(false);
        },
        toggleFavorite,
    }), [hasAvailableSlots, addNotification, t, startNewPlant, setActiveView, toggleFavorite]);

    const isFavorite = useCallback((id: string) => favoriteIds.has(id), [favoriteIds]);

    const value = {
        state: {
            selectedStrain,
            strainToEdit,
            strainForSetup,
            isAddModalOpen,
            isExportModalOpen,
            isSetupModalOpen,
            favoriteIds,
            isFavorite,
        },
        actions,
    };

    return (
        <StrainViewContext.Provider value={value}>
            {children}
        </StrainViewContext.Provider>
    );
};

export const useStrainView = () => {
    const context = useContext(StrainViewContext);
    if (!context) {
        throw new Error('useStrainView must be used within a StrainViewProvider');
    }
    return context;
};
