import React from 'react';
import { LogActionModal } from './LogActionModal';
import { selectPlantById, selectActionModalState } from '@/stores/selectors';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { closeActionModal, openDeepDiveModal } from '@/stores/slices/uiSlice';
import { Plant, ModalType } from '@/types';
import { UIState } from '@/stores/slices/uiSlice';

export const LogActionModalContainer: React.FC = () => {
    const dispatch = useAppDispatch();
    // FIX: Cast the result of `useAppSelector` to the correct type to avoid 'unknown' type errors.
    const { isOpen, plantId, type } = useAppSelector(selectActionModalState) as UIState['actionModal'];
    // FIX: Cast the result of `useAppSelector` to the correct type to avoid 'unknown' type errors.
    const plant = useAppSelector(selectPlantById(plantId)) as Plant | null;

    const handleLearnMore = (topic: string) => {
        if (plant) {
            dispatch(openDeepDiveModal({ plantId: plant.id, topic }));
        }
    };

    if (!isOpen || !plant || !type) return null;

    return (
        <LogActionModal 
            plant={plant} 
            type={type} 
            onClose={() => dispatch(closeActionModal())}
            onLearnMore={handleLearnMore}
        />
    );
};