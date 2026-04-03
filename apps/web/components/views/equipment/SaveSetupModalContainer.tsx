import React from 'react'
import { useAppDispatch } from '@/stores/store'
import { useUIStore } from '@/stores/useUIStore'
import { addSetup } from '@/stores/slices/savedItemsSlice'
import { SaveSetupModal } from './SaveSetupModal'
import { EquipmentViewTab } from '@/types'

export const SaveSetupModalContainer: React.FC = () => {
    const dispatch = useAppDispatch()
    const isSaveSetupModalOpen = useUIStore((s) => s.isSaveSetupModalOpen)
    const setupToSave = useUIStore((s) => s.setupToSave)

    const handleSave = (name: string) => {
        if (setupToSave) {
            dispatch(addSetup({ ...setupToSave, name }))
                .unwrap()
                .then(() => {
                    useUIStore.getState().closeSaveSetupModal()
                    useUIStore.getState().setEquipmentViewTab(EquipmentViewTab.Setups)
                })
                .catch((err) => {
                    console.debug('[SaveSetupModal] Failed to save setup:', err)
                })
        }
    }

    if (!isSaveSetupModalOpen || !setupToSave) {
        return null
    }

    return (
        <SaveSetupModal
            isOpen={true}
            onClose={() => useUIStore.getState().closeSaveSetupModal()}
            onSave={handleSave}
            setupToSave={setupToSave}
        />
    )
}
