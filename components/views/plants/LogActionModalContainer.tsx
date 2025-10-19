import React from 'react';
import { LogActionModal } from './LogActionModal';
import { selectPlantById, selectActionModalState } from '@/stores/selectors';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { closeActionModal, openDeepDiveModal } from '@/stores/slices/uiSlice';
import { Plant, ModalType } from '@/types';
import { UIState } from '@/stores/slices/uiSlice';

export const LogActionModalContainer: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isOpen, plantId, type } = useAppSelector(selectActionModalState);
    const plant = useAppSelector(selectPlantById(plantId));

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