import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import { Strain, GrowSetup } from '@/types';
import { usePlants } from '@/hooks/usePlants';
import { useNotifications } from '@/context/NotificationContext';
import { useTranslations } from '@/hooks/useTranslations';

interface StrainViewContextType {
    state: {
        selectedStrain: Strain | null;
        strainToEdit: Strain | null;
        strainForSetup: Strain | null;
        isAddModalOpen: boolean;
        isExportModalOpen: boolean;
        isSetupModalOpen: boolean;
    };
    actions: {
        selectStrain: (strain: Strain) => void;
        closeDetailModal: () => void;
        openAddModal: (strain?: Strain) => void;
        closeAddModal: () => void;
        openExportModal: () => void;
        closeExportModal: () => void;
        initiateGrow: (strain: Strain) => void;
        confirmGrow: (setup: GrowSetup, strain: Strain) => boolean;
        closeGrowModal: () => void;
    };
}

export const StrainViewContext = createContext<StrainViewContextType | undefined>(undefined);

export const StrainViewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { plants } = usePlants();
    const { addNotification } = useNotifications();
    const { t } = useTranslations();

    const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);
    const [strainToEdit, setStrainToEdit] = useState<Strain | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    
    // Grow setup flow state
    const [strainForSetup, setStrainForSetup] = useState<Strain | null>(null);
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    
    const hasAvailableSlots = useMemo(() => plants.some(p => p === null), [plants]);

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
        confirmGrow: (setup: GrowSetup, strain: Strain): boolean => {
             // The actual plant creation logic remains in PlantContext.
             // This method just orchestrates the UI flow.
             setIsSetupModalOpen(false);
             setStrainForSetup(null);
             setSelectedStrain(null); // Close detail modal if open
             return true; // Let the caller know it can proceed
        },
        closeGrowModal: () => {
            setStrainForSetup(null);
            setIsSetupModalOpen(false);
        }
    }), [hasAvailableSlots, addNotification, t]);

    const value = {
        state: {
            selectedStrain,
            strainToEdit,
            strainForSetup,
            isAddModalOpen,
            isExportModalOpen,
            isSetupModalOpen,
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
