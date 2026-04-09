import type { GrowAction } from '@/types'

// ---------------------------------------------------------------------------
// Grow Schedule Templates
// ---------------------------------------------------------------------------
// Each template defines a sequence of tasks relative to the start of a stage.
// dayOffset is relative to the stage start date.
// Templates are matched by strainType + floweringType combination.

export interface ScheduleStep {
    dayOffset: number
    action: GrowAction
    notes: string
}

export interface GrowScheduleTemplate {
    id: string
    name: string
    strainType: 'Sativa' | 'Indica' | 'Hybrid'
    floweringType: 'Photoperiod' | 'Autoflower'
    seedlingSteps: ScheduleStep[]
    vegetativeSteps: ScheduleStep[]
    floweringSteps: ScheduleStep[]
}

export const GROW_SCHEDULE_TEMPLATES: GrowScheduleTemplate[] = [
    // -----------------------------------------------------------------------
    // Autoflower Templates
    // -----------------------------------------------------------------------
    {
        id: 'auto-indica',
        name: 'Autoflower Indica (Fast)',
        strainType: 'Indica',
        floweringType: 'Autoflower',
        seedlingSteps: [
            { dayOffset: 0, action: 'water', notes: 'Light misting, keep soil moist' },
            { dayOffset: 3, action: 'water', notes: 'First light watering' },
            { dayOffset: 5, action: 'photo', notes: 'Document seedling emergence' },
        ],
        vegetativeSteps: [
            { dayOffset: 0, action: 'feed', notes: 'Start light nutrients (1/4 strength)' },
            { dayOffset: 3, action: 'water', notes: 'Water when top inch dry' },
            { dayOffset: 5, action: 'train', notes: 'Begin LST if plant is strong' },
            { dayOffset: 7, action: 'feed', notes: 'Increase to 1/2 strength nutrients' },
            { dayOffset: 10, action: 'photo', notes: 'Document vegetative growth' },
            { dayOffset: 14, action: 'defoliate', notes: 'Light defoliation of lower leaves' },
        ],
        floweringSteps: [
            { dayOffset: 0, action: 'feed', notes: 'Switch to bloom nutrients' },
            { dayOffset: 7, action: 'water', notes: 'Increase watering frequency' },
            { dayOffset: 14, action: 'photo', notes: 'Document flower development' },
            { dayOffset: 21, action: 'defoliate', notes: 'Remove leaves blocking bud sites' },
            { dayOffset: 35, action: 'harvest_check', notes: 'Check trichomes with loupe' },
            { dayOffset: 42, action: 'flush', notes: 'Begin flush (2 weeks before harvest)' },
            { dayOffset: 49, action: 'harvest_check', notes: 'Final trichome check' },
            { dayOffset: 56, action: 'photo', notes: 'Pre-harvest documentation' },
        ],
    },
    {
        id: 'auto-sativa',
        name: 'Autoflower Sativa (Medium)',
        strainType: 'Sativa',
        floweringType: 'Autoflower',
        seedlingSteps: [
            { dayOffset: 0, action: 'water', notes: 'Gentle misting' },
            { dayOffset: 3, action: 'water', notes: 'Light watering' },
            { dayOffset: 7, action: 'photo', notes: 'Seedling documentation' },
        ],
        vegetativeSteps: [
            { dayOffset: 0, action: 'feed', notes: '1/4 strength veg nutrients' },
            { dayOffset: 5, action: 'train', notes: 'Begin LST early' },
            { dayOffset: 7, action: 'feed', notes: '1/2 strength nutrients' },
            { dayOffset: 10, action: 'water', notes: 'Increase water volume' },
            { dayOffset: 14, action: 'feed', notes: 'Full strength veg nutrients' },
            { dayOffset: 18, action: 'photo', notes: 'Vegetative growth documentation' },
        ],
        floweringSteps: [
            { dayOffset: 0, action: 'feed', notes: 'Transition to bloom nutrients' },
            { dayOffset: 7, action: 'defoliate', notes: 'Strategic defoliation' },
            { dayOffset: 14, action: 'photo', notes: 'Early flower documentation' },
            { dayOffset: 28, action: 'photo', notes: 'Mid-flower documentation' },
            { dayOffset: 42, action: 'harvest_check', notes: 'Begin trichome checks' },
            { dayOffset: 49, action: 'flush', notes: 'Start flush' },
            { dayOffset: 56, action: 'harvest_check', notes: 'Weekly trichome check' },
            { dayOffset: 63, action: 'harvest_check', notes: 'Final harvest window' },
            { dayOffset: 70, action: 'photo', notes: 'Pre-harvest documentation' },
        ],
    },
    {
        id: 'auto-hybrid',
        name: 'Autoflower Hybrid (Balanced)',
        strainType: 'Hybrid',
        floweringType: 'Autoflower',
        seedlingSteps: [
            { dayOffset: 0, action: 'water', notes: 'Light misting' },
            { dayOffset: 4, action: 'water', notes: 'First watering' },
        ],
        vegetativeSteps: [
            { dayOffset: 0, action: 'feed', notes: '1/4 strength nutrients' },
            { dayOffset: 5, action: 'train', notes: 'LST if vigorous' },
            { dayOffset: 7, action: 'feed', notes: '1/2 strength' },
            { dayOffset: 14, action: 'photo', notes: 'Growth documentation' },
        ],
        floweringSteps: [
            { dayOffset: 0, action: 'feed', notes: 'Bloom nutrients' },
            { dayOffset: 14, action: 'defoliate', notes: 'Light defoliation' },
            { dayOffset: 21, action: 'photo', notes: 'Flower documentation' },
            { dayOffset: 42, action: 'harvest_check', notes: 'Trichome check' },
            { dayOffset: 49, action: 'flush', notes: 'Begin flush' },
            { dayOffset: 56, action: 'harvest_check', notes: 'Final check' },
        ],
    },

    // -----------------------------------------------------------------------
    // Photoperiod Templates
    // -----------------------------------------------------------------------
    {
        id: 'photo-indica',
        name: 'Photoperiod Indica (Classic)',
        strainType: 'Indica',
        floweringType: 'Photoperiod',
        seedlingSteps: [
            { dayOffset: 0, action: 'water', notes: 'Mist dome, high humidity' },
            { dayOffset: 3, action: 'water', notes: 'First gentle watering' },
            { dayOffset: 7, action: 'photo', notes: 'Seedling emergence' },
        ],
        vegetativeSteps: [
            { dayOffset: 0, action: 'feed', notes: '1/4 strength veg nutrients' },
            { dayOffset: 7, action: 'feed', notes: '1/2 strength nutrients' },
            { dayOffset: 10, action: 'train', notes: 'Start topping or LST' },
            { dayOffset: 14, action: 'feed', notes: 'Full strength veg' },
            { dayOffset: 21, action: 'defoliate', notes: 'Remove lower growth' },
            { dayOffset: 28, action: 'photo', notes: 'Pre-flip documentation' },
            { dayOffset: 28, action: 'train', notes: 'Final training before flip' },
        ],
        floweringSteps: [
            { dayOffset: 0, action: 'feed', notes: 'Switch to bloom nutrients, 12/12 light' },
            { dayOffset: 7, action: 'defoliate', notes: 'Remove fan leaves blocking buds' },
            { dayOffset: 14, action: 'photo', notes: 'Early flower development' },
            { dayOffset: 21, action: 'feed', notes: 'Peak bloom feeding' },
            { dayOffset: 35, action: 'photo', notes: 'Mid-flower documentation' },
            { dayOffset: 42, action: 'harvest_check', notes: 'Start trichome monitoring' },
            { dayOffset: 49, action: 'flush', notes: 'Begin flush (2 weeks to harvest)' },
            { dayOffset: 56, action: 'harvest_check', notes: 'Final trichome assessment' },
        ],
    },
    {
        id: 'photo-sativa',
        name: 'Photoperiod Sativa (Extended)',
        strainType: 'Sativa',
        floweringType: 'Photoperiod',
        seedlingSteps: [
            { dayOffset: 0, action: 'water', notes: 'Light misting under dome' },
            { dayOffset: 5, action: 'water', notes: 'First watering' },
            { dayOffset: 7, action: 'photo', notes: 'Seedling documentation' },
        ],
        vegetativeSteps: [
            { dayOffset: 0, action: 'feed', notes: 'Light veg nutrients' },
            { dayOffset: 7, action: 'train', notes: 'Begin LST early -- sativas stretch' },
            { dayOffset: 14, action: 'feed', notes: '1/2 strength' },
            { dayOffset: 21, action: 'train', notes: 'Continue LST training' },
            { dayOffset: 28, action: 'defoliate', notes: 'Strategic defoliation' },
            { dayOffset: 35, action: 'photo', notes: 'Pre-flip documentation' },
        ],
        floweringSteps: [
            { dayOffset: 0, action: 'feed', notes: 'Bloom nutrients, expect 2-3 week stretch' },
            { dayOffset: 7, action: 'train', notes: 'Manage stretch with supercrop/LST' },
            {
                dayOffset: 14,
                action: 'defoliate',
                notes: 'Heavy defoliation for light penetration',
            },
            { dayOffset: 21, action: 'photo', notes: 'Post-stretch documentation' },
            { dayOffset: 35, action: 'feed', notes: 'Peak bloom nutrients' },
            { dayOffset: 49, action: 'photo', notes: 'Mid-flower documentation' },
            { dayOffset: 56, action: 'harvest_check', notes: 'Begin trichome monitoring' },
            { dayOffset: 63, action: 'flush', notes: 'Start flush' },
            { dayOffset: 70, action: 'harvest_check', notes: 'Weekly check' },
            { dayOffset: 77, action: 'harvest_check', notes: 'Final harvest window assessment' },
        ],
    },
    {
        id: 'photo-hybrid',
        name: 'Photoperiod Hybrid (Versatile)',
        strainType: 'Hybrid',
        floweringType: 'Photoperiod',
        seedlingSteps: [
            { dayOffset: 0, action: 'water', notes: 'Gentle misting' },
            { dayOffset: 4, action: 'water', notes: 'First watering' },
            { dayOffset: 7, action: 'photo', notes: 'Documentation' },
        ],
        vegetativeSteps: [
            { dayOffset: 0, action: 'feed', notes: '1/4 strength veg' },
            { dayOffset: 7, action: 'train', notes: 'Top or LST' },
            { dayOffset: 14, action: 'feed', notes: 'Full strength' },
            { dayOffset: 21, action: 'defoliate', notes: 'Clean up lower canopy' },
            { dayOffset: 28, action: 'photo', notes: 'Pre-flip documentation' },
        ],
        floweringSteps: [
            { dayOffset: 0, action: 'feed', notes: 'Bloom nutrients' },
            { dayOffset: 14, action: 'defoliate', notes: 'Defoliation' },
            { dayOffset: 21, action: 'photo', notes: 'Flower documentation' },
            { dayOffset: 42, action: 'harvest_check', notes: 'Trichome check' },
            { dayOffset: 49, action: 'flush', notes: 'Begin flush' },
            { dayOffset: 56, action: 'harvest_check', notes: 'Final check' },
        ],
    },
]

export function findBestTemplate(
    strainType: 'Sativa' | 'Indica' | 'Hybrid',
    floweringType: 'Photoperiod' | 'Autoflower',
): GrowScheduleTemplate | undefined {
    // Exact match first
    const exact = GROW_SCHEDULE_TEMPLATES.find(
        (t) => t.strainType === strainType && t.floweringType === floweringType,
    )
    if (exact) return exact

    // Fallback to same flowering type, hybrid strain
    const hybridFallback = GROW_SCHEDULE_TEMPLATES.find(
        (t) => t.strainType === 'Hybrid' && t.floweringType === floweringType,
    )
    return hybridFallback
}
