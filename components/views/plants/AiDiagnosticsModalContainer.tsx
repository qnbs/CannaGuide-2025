import React from 'react';
import { AiDiagnosticsModal } from './AiDiagnosticsModal';
import { selectPlantById } from '@/stores/selectors';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { closeDiagnosticsModal } from '@/stores/slices/uiSlice';
import { resetDiagnosticsState } from '@/stores/slices/aiSlice';

export const AiDiagnosticsModalContainer: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isDiagnosticsModalOpen, diagnosticsPlantId } = useAppSelector(state => state.ui);
    const plant = useAppSelector(selectPlantById(diagnosticsPlantId));

    const handleClose = () => {
        dispatch(closeDiagnosticsModal());
        dispatch(resetDiagnosticsState());
    };

    if (!isDiagnosticsModalOpen || !plant) {
        return null;
    }

    return <AiDiagnosticsModal plant={plant} onClose={handleClose} />;
};
