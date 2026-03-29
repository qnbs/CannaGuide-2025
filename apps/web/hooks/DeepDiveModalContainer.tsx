import React, { useEffect } from 'react'
import { Scenario } from '@/types'
import { useAppSelector, useAppDispatch } from '@/stores/store'
import { useUIStore } from '@/stores/useUIStore'
import { useGetDeepDiveMutation } from '@/stores/api'
import { selectPlantById, selectLanguage } from '@/stores/selectors'
import { runComparisonScenario } from '@/stores/slices/sandboxSlice'
import { DeepDiveModal } from '@/components/views/plants/deepDive/DeepDiveModal'

export const DeepDiveModalContainer: React.FC = () => {
    const dispatch = useAppDispatch()
    const lang = useAppSelector(selectLanguage)
    const isOpen = useUIStore((s) => s.deepDiveModal.isOpen)
    const plantId = useUIStore((s) => s.deepDiveModal.plantId)
    const topic = useUIStore((s) => s.deepDiveModal.topic)
    const closeDeepDiveModal = useUIStore((s) => s.closeDeepDiveModal)
    const plant = useAppSelector(selectPlantById(plantId))

    const [getDeepDive, { reset, ...mutationState }] = useGetDeepDiveMutation(
        plantId && topic ? { fixedCacheKey: `deep-dive-${plantId}-${topic}` } : {},
    )

    useEffect(() => {
        if (
            isOpen &&
            plant &&
            topic &&
            !mutationState.data &&
            !mutationState.isLoading &&
            !mutationState.error
        ) {
            getDeepDive({ topic, plant, lang })
        }
    }, [isOpen, plant, topic, mutationState, getDeepDive, lang])

    const handleClose = () => {
        closeDeepDiveModal()
        reset()
    }

    const handleRunScenario = (scenario: Scenario) => {
        if (plantId) {
            dispatch(runComparisonScenario({ plantId, scenario }))
            handleClose()
        }
    }

    if (!isOpen || !plant || !topic) return null

    return (
        <DeepDiveModal
            plant={plant}
            topic={topic}
            onClose={handleClose}
            onRunScenario={handleRunScenario}
            {...mutationState}
        />
    )
}
