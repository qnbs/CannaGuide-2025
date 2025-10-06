import React from 'react';
import { AiDiagnosticsModal } from './AiDiagnosticsModal';
import { selectPlantById } from '@/stores/selectors';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { closeDiagnosticsModal } from '@/stores/slices/uiSlice';
import { useDiagnosePlantMutation } from '@/stores/api';
import { Plant } from '@/types';

export const AiDiagnosticsModalContainer: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isDiagnosticsModalOpen, diagnosticsPlantId } = useAppSelector(state => state.ui);
    const plant = useAppSelector(selectPlantById(diagnosticsPlantId));

    // The mutation hook is now in the container that controls its lifecycle.
    const [diagnosePlant, { isLoading, data, error, reset }] = useDiagnosePlantMutation(
        diagnosticsPlantId ? { fixedCacheKey: `plant-diagnosis-${diagnosticsPlantId}` } : {}
    );

    const handleClose = () => {
        dispatch(closeDiagnosticsModal());
        reset(); // Explicitly reset the mutation state when the user closes the modal.
    };

    if (!isDiagnosticsModalOpen || !plant) {
        return null;
    }

    return (
        <AiDiagnosticsModal 
            plant={plant} 
            onClose={handleClose}
            diagnosePlant={diagnosePlant}
            isLoading={isLoading}
            response={data}
            error={error}
            resetDiagnosis={reset}
        />
    );
};