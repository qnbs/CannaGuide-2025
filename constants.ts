
import { PlantStage } from '@/types'

export const STAGES_ORDER: PlantStage[] = [
    PlantStage.Seed,
    PlantStage.Germination,
    PlantStage.Seedling,
    PlantStage.Vegetative,
    PlantStage.Flowering,
    PlantStage.Harvest,
    PlantStage.Drying,
    PlantStage.Curing,
    PlantStage.Finished,
]

export const FLOWERING_STAGES: PlantStage[] = [PlantStage.Flowering, PlantStage.Harvest]

// FIX: Add missing PLANT_STAGE_DETAILS constant.
export const PLANT_STAGE_DETAILS: Record<
    PlantStage,
    { duration: number; idealVitals: { ph: { min: number; max: number }; ec: { min: number; max: number } } }
> = {
    [PlantStage.Seed]: { duration: 1, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.2, max: 0.6 } } },
    [PlantStage.Germination]: { duration: 3, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.2, max: 0.6 } } },
    [PlantStage.Seedling]: { duration: 14, idealVitals: { ph: { min: 5.8, max: 6.5 }, ec: { min: 0.4, max: 0.8 } } },
    [PlantStage.Vegetative]: { duration: 28, idealVitals: { ph: { min: 5.8, max: 6.5 }, ec: { min: 0.8, max: 1.5 } } },
    [PlantStage.Flowering]: { duration: 56, idealVitals: { ph: { min: 6.0, max: 6.8 }, ec: { min: 1.2, max: 2.0 } } },
    [PlantStage.Harvest]: { duration: 1, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.0, max: 0.4 } } },
    [PlantStage.Drying]: { duration: 10, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.0, max: 0.4 } } },
    [PlantStage.Curing]: { duration: 21, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.0, max: 0.4 } } },
    [PlantStage.Finished]: { duration: Infinity, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.0, max: 0.4 } } },
};
