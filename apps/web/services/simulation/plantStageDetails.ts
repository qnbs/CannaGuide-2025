import { PlantStage } from '@/types'

export type PlantStageDetail = {
    duration: number
    idealVitals: {
        ph: { min: number; max: number }
        ec: { min: number; max: number }
        vpd: { min: number; max: number }
        temp: { min: number; max: number }
    }
    nutrientRatio: { n: number; p: number; k: number }
    biomassPartitioning: { roots: number; stem: number; leaves: number; flowers: number }
}

/** Stage metadata for the mechanistic plant simulation model. */
export const PLANT_STAGE_DETAILS: Record<PlantStage, PlantStageDetail> = {
    [PlantStage.Seed]: {
        duration: 1,
        idealVitals: {
            ph: { min: 6.0, max: 7.0 },
            ec: { min: 0.2, max: 0.4 },
            vpd: { min: 0.4, max: 0.8 },
            temp: { min: 22, max: 26 },
        },
        nutrientRatio: { n: 1, p: 2, k: 1 },
        biomassPartitioning: { roots: 1.0, stem: 0, leaves: 0, flowers: 0 },
    },
    [PlantStage.Germination]: {
        duration: 3,
        idealVitals: {
            ph: { min: 6.0, max: 7.0 },
            ec: { min: 0.2, max: 0.4 },
            vpd: { min: 0.4, max: 0.8 },
            temp: { min: 22, max: 26 },
        },
        nutrientRatio: { n: 1, p: 2, k: 1 },
        biomassPartitioning: { roots: 0.8, stem: 0.1, leaves: 0.1, flowers: 0 },
    },
    [PlantStage.Seedling]: {
        duration: 14,
        idealVitals: {
            ph: { min: 5.8, max: 6.5 },
            ec: { min: 0.4, max: 0.8 },
            vpd: { min: 0.5, max: 0.9 },
            temp: { min: 22, max: 28 },
        },
        nutrientRatio: { n: 2, p: 1, k: 2 },
        biomassPartitioning: { roots: 0.5, stem: 0.25, leaves: 0.25, flowers: 0 },
    },
    [PlantStage.Vegetative]: {
        duration: 28,
        idealVitals: {
            ph: { min: 5.8, max: 6.5 },
            ec: { min: 0.8, max: 1.5 },
            vpd: { min: 0.8, max: 1.2 },
            temp: { min: 22, max: 28 },
        },
        nutrientRatio: { n: 3, p: 1, k: 2 },
        biomassPartitioning: { roots: 0.3, stem: 0.35, leaves: 0.35, flowers: 0 },
    },
    [PlantStage.Flowering]: {
        duration: 56,
        idealVitals: {
            ph: { min: 6.0, max: 6.8 },
            ec: { min: 1.2, max: 2.0 },
            vpd: { min: 1.2, max: 1.6 },
            temp: { min: 20, max: 26 },
        },
        nutrientRatio: { n: 1, p: 2, k: 3 },
        biomassPartitioning: { roots: 0.1, stem: 0.1, leaves: 0.2, flowers: 0.6 },
    },
    [PlantStage.Harvest]: {
        duration: 1,
        idealVitals: {
            ph: { min: 6.0, max: 7.0 },
            ec: { min: 0.0, max: 0.4 },
            vpd: { min: 0.8, max: 1.2 },
            temp: { min: 18, max: 22 },
        },
        nutrientRatio: { n: 0, p: 0, k: 0 },
        biomassPartitioning: { roots: 0.1, stem: 0.1, leaves: 0.2, flowers: 0.6 },
    },
    [PlantStage.Drying]: {
        duration: 10,
        idealVitals: {
            ph: { min: 0, max: 0 },
            ec: { min: 0, max: 0 },
            vpd: { min: 0, max: 0 },
            temp: { min: 0, max: 0 },
        },
        nutrientRatio: { n: 0, p: 0, k: 0 },
        biomassPartitioning: { roots: 0, stem: 0, leaves: 0, flowers: 1 },
    },
    [PlantStage.Curing]: {
        duration: 21,
        idealVitals: {
            ph: { min: 0, max: 0 },
            ec: { min: 0, max: 0 },
            vpd: { min: 0, max: 0 },
            temp: { min: 0, max: 0 },
        },
        nutrientRatio: { n: 0, p: 0, k: 0 },
        biomassPartitioning: { roots: 0, stem: 0, leaves: 0, flowers: 1 },
    },
    [PlantStage.Finished]: {
        duration: Infinity,
        idealVitals: {
            ph: { min: 0, max: 0 },
            ec: { min: 0, max: 0 },
            vpd: { min: 0, max: 0 },
            temp: { min: 0, max: 0 },
        },
        nutrientRatio: { n: 0, p: 0, k: 0 },
        biomassPartitioning: { roots: 0, stem: 0, leaves: 0, flowers: 1 },
    },
}
