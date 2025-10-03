import { useState, useEffect } from 'react'
import { useAppSelector } from '@/stores/store'
import { dbService } from '@/services/dbService'
import {
    selectSimulation,
    selectArchives,
    selectUserStrains,
    selectSavedItems,
} from '@/stores/selectors'

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const getObjectSize = (obj: any) => {
    try {
        return new TextEncoder().encode(JSON.stringify(obj)).length
    } catch (e) {
        return 0
    }
}

export const useStorageEstimate = () => {
    const [estimates, setEstimates] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(true)

    const simulationState = useAppSelector(selectSimulation)
    const archivesState = useAppSelector(selectArchives)
    const userStrainsState = useAppSelector(selectUserStrains)
    const savedItemsState = useAppSelector(selectSavedItems)

    useEffect(() => {
        const calculateSizes = async () => {
            setIsLoading(true)
            const newEstimates: Record<string, number> = {}

            newEstimates.plants = getObjectSize(simulationState.plants)
            newEstimates.archives = getObjectSize(archivesState)
            newEstimates.customStrains = getObjectSize(userStrainsState)
            newEstimates.savedItems = getObjectSize(savedItemsState)

            try {
                const images = await dbService.getAllImages()
                newEstimates.images = images.reduce((acc, img) => acc + img.data.length * 0.75, 0) // Base64 approx size
            } catch (error) {
                console.error('Could not estimate image size:', error)
                newEstimates.images = 0
            }

            const formattedEstimates = Object.entries(newEstimates).reduce(
                (acc, [key, value]) => {
                    acc[key] = formatBytes(value)
                    return acc
                },
                {} as Record<string, string>
            )

            setEstimates(formattedEstimates)
            setIsLoading(false)
        }

        calculateSizes()
    }, [simulationState, archivesState, userStrainsState, savedItemsState])

    return { estimates, isLoading }
}
