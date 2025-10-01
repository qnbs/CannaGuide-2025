import React from 'react';
import { AiDiagnosticsModal } from './AiDiagnosticsModal';
import { selectPlantById } from '@/stores/selectors';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { closeDiagnosticsModal } from '@/stores/slices/uiSlice';
// FIX: Removed import from obsolete aiSlice. RTK Query manages its own state and provides a reset function on the mutation hook if needed.
// import { resetDiagnosticsState } from '@/stores/slices/aiSlice';

export const AiDiagnosticsModalContainer: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isDiagnosticsModalOpen, diagnosticsPlantId } = useAppSelector(state => state.ui);
    const plant = useAppSelector(selectPlantById(diagnosticsPlantId));

    const handleClose = () => {
        dispatch(closeDiagnosticsModal());
        // FIX: The `resetDiagnosticsState` action is obsolete as RTK Query manages the state.
        // The state will automatically reset when the component unmounts or a new mutation is triggered.
        // dispatch(resetDiagnosticsState());
    };

    if (!isDiagnosticsModalOpen || !plant) {
        return null;
    }

    return <AiDiagnosticsModal plant={plant} onClose={handleClose} />;
};