import React from 'react';
import { Plant, JournalEntry } from '@/types';
import { WateringModal, FeedingModal, ObservationModal, TrainingModal, PhotoModal } from '@/components/views/plants/ActionModals';

export type ModalType = 'watering' | 'feeding' | 'observation' | 'training' | 'photo' | null;

export interface ModalState {
    type: ModalType;
    plantId: string;
}

interface LogActionModalProps {
    plant: Plant;
    modalState: ModalState | null;
    setModalState: (state: ModalState | null) => void;
    onAddJournalEntry: (plantId: string, entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
}

export const LogActionModal: React.FC<LogActionModalProps> = ({ plant, modalState, setModalState, onAddJournalEntry }) => {
    const handleAddJournalAndClose = (details: JournalEntry['details'], notes: string) => {
        if (modalState) {
            const typeMap: Record<string, JournalEntry['type']> = {
                watering: 'WATERING', feeding: 'FEEDING', training: 'TRAINING', photo: 'PHOTO', observation: 'OBSERVATION',
            };
            const entryType = typeMap[modalState.type!];
            if(entryType) {
                onAddJournalEntry(modalState.plantId, { type: entryType, details, notes });
            }
        }
        setModalState(null);
    };

    if (!modalState) return null;

    const modalComponentMap: Record<NonNullable<ModalType>, React.FC<any>> = {
        watering: WateringModal,
        feeding: FeedingModal,
        observation: ObservationModal,
        training: TrainingModal,
        photo: PhotoModal,
    };

    const ModalComponent = modalComponentMap[modalState.type!];

    return ModalComponent ? (
        <ModalComponent 
            plant={plant} 
            onClose={() => setModalState(null)} 
            onConfirm={handleAddJournalAndClose} 
        />
    ) : null;
};