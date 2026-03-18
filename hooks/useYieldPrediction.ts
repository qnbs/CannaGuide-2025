import { useEffect, useState } from 'react'
import { Plant, YieldPredictionResult } from '@/types'
import { yieldPredictionService } from '@/services/yieldPredictionService'

export const useYieldPrediction = (historicalPlants: Plant[], activePlants: Plant[]) => {
    const [prediction, setPrediction] = useState<YieldPredictionResult | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isCancelled = false

        const runPrediction = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const nextPrediction = await yieldPredictionService.predictYield(historicalPlants, activePlants)
                if (!isCancelled) {
                    setPrediction(nextPrediction)
                }
            } catch (nextError) {
                if (!isCancelled) {
                    setError(nextError instanceof Error ? nextError.message : 'Prediction failed')
                    setPrediction(null)
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false)
                }
            }
        }

        if (activePlants.length > 0) {
            void runPrediction()
        } else {
            setPrediction(null)
            setError(null)
            setIsLoading(false)
        }

        return () => {
            isCancelled = true
        }
    }, [activePlants, historicalPlants])

    return { prediction, isLoading, error }
}
