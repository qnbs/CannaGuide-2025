import React from 'react';
import { AiDiagnosticsModal } from './AiDiagnosticsModal';
import { selectPlantById, selectActionModalState } from '@/stores/selectors';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { closeDiagnosticsModal } from '@/stores/slices/uiSlice';
import { Plant } from '@/types';

export const AiDiagnosticsModalContainer: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isDiagnosticsModalOpen, diagnosticsPlantId } = useAppSelector(state => state.ui);
    const plant = useAppSelector(selectPlantById(diagnosticsPlantId));

    const handleClose = () => {
        dispatch(closeDiagnosticsModal());
        // The RTK Query state will automatically reset when the component unmounts or a new mutation is triggered.
    };

    if (!isDiagnosticsModalOpen || !plant) {
        return null;
    }

    return <AiDiagnosticsModal plant={plant} onClose={handleClose} />;
};