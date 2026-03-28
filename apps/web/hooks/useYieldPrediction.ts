import { Plant, YieldPredictionResult } from '@/types'
import { yieldPredictionService } from '@/services/yieldPredictionService'
import { useAsync } from '@/hooks/useAsync'

export const useYieldPrediction = (historicalPlants: Plant[], activePlants: Plant[]) => {
    const {
        data: prediction,
        isLoading,
        error,
    } = useAsync<YieldPredictionResult>(
        () => yieldPredictionService.predictYield(historicalPlants, activePlants),
        [activePlants, historicalPlants],
        activePlants.length > 0,
    )

    return { prediction, isLoading, error }
}
