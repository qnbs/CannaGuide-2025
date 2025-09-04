import React from 'react';
import { JournalEntry } from '../../types';
import { WateringModal, FeedingModal, ObservationModal, TrainingModal, PhotoModal } from '../views/plants/ActionModals';

export type ModalType = 'watering' | 'feeding' | 'observation' | 'training' | 'photo' | null;

export interface ModalState {
    plantId: string;
    type: ModalType;
}

interface ActionModalsContainerProps {
    modalState: ModalState | null;
    setModalState: (state: ModalState | null) => void;
    onAddJournalEntry: (plantId: string, entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
}

export const ActionModalsContainer: React.FC<ActionModalsContainerProps> = ({ modalState, setModalState, onAddJournalEntry }) => {
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

    return (
        <>
            {modalState.type === 'watering' && <WateringModal onClose={() => setModalState(null)} onConfirm={handleAddJournalAndClose} />}
            {modalState.type === 'feeding' && <FeedingModal onClose={() => setModalState(null)} onConfirm={handleAddJournalAndClose} />}
            {modalState.type === 'observation' && <ObservationModal onClose={() => setModalState(null)} onConfirm={handleAddJournalAndClose} />}
            {modalState.type === 'training' && <TrainingModal onClose={() => setModalState(null)} onConfirm={handleAddJournalAndClose} />}
            {modalState.type === 'photo' && <PhotoModal onClose={() => setModalState(null)} onConfirm={handleAddJournalAndClose} />}
        </>
    );
};