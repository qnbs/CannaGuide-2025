import React from 'react'
import { AiDiagnosticsModal } from './AiDiagnosticsModal'
import { selectPlantById } from '@/stores/selectors'
import { useAppSelector } from '@/stores/store'
import { useUIStore } from '@/stores/useUIStore'
import { useDiagnosePlantMutation } from '@/stores/api'

export const AiDiagnosticsModalContainer: React.FC = () => {
    const isDiagnosticsModalOpen = useUIStore((s) => s.isDiagnosticsModalOpen)
    const diagnosticsPlantId = useUIStore((s) => s.diagnosticsPlantId)
    const plant = useAppSelector(selectPlantById(diagnosticsPlantId))

    // The mutation hook is now in the container that controls its lifecycle.
    const [diagnosePlant, { isLoading, data, error, reset }] = useDiagnosePlantMutation(
        diagnosticsPlantId ? { fixedCacheKey: `plant-diagnosis-${diagnosticsPlantId}` } : {},
    )

    const handleClose = () => {
        useUIStore.getState().closeDiagnosticsModal()
        reset() // Explicitly reset the mutation state when the user closes the modal.
    }

    if (!isDiagnosticsModalOpen || !plant) {
        return null
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
    )
}
