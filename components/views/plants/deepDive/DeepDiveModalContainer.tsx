import React from 'react';
import { DeepDiveModal } from './DeepDiveModal';
import { selectPlantById, selectDeepDiveModalState } from '@/stores/selectors';
import { Scenario } from '@/types';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { closeDeepDiveModal } from '@/stores/slices/uiSlice';

export const DeepDiveModalContainer: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isOpen, plantId, topic } = useAppSelector(selectDeepDiveModalState);
    const plant = useAppSelector(selectPlantById(plantId));
    
    const handleRunScenario = (scenario: Scenario) => {
        console.log("Running scenario from global context:", scenario);
        // This would eventually trigger a scenario view.
        dispatch(closeDeepDiveModal());
    };

    if (!isOpen || !plant || !topic) return null;

    return (
        <DeepDiveModal
            plant={plant}
            topic={topic}
            onClose={() => dispatch(closeDeepDiveModal())}
            onRunScenario={handleRunScenario}
        />
    );
};
