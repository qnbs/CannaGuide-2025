import React from 'react'
import { LogActionModal } from './LogActionModal'
import { selectPlantById } from '@/stores/selectors'
import { useAppSelector } from '@/stores/store'
import { useUIStore } from '@/stores/useUIStore'

export const LogActionModalContainer: React.FC = () => {
    const { isOpen, plantId, type } = useUIStore((s) => s.actionModal)
    const plant = useAppSelector(selectPlantById(plantId))

    const handleLearnMore = (topic: string) => {
        if (plant) {
            useUIStore.getState().openDeepDiveModal({ plantId: plant.id, topic })
        }
    }

    if (!isOpen || !plant || !type) return null

    return (
        <LogActionModal
            plant={plant}
            type={type}
            onClose={() => useUIStore.getState().closeActionModal()}
            onLearnMore={handleLearnMore}
        />
    )
}
