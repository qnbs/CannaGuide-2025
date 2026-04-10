// ---------------------------------------------------------------------------
// nutrientBrands -- Built-in Nutrient Brand Schedules for CannaGuide 2025
//
// Each brand schedule follows the NutrientSchedulePlugin interface from
// pluginService.ts so it can be loaded via applyPluginSchedule() in the
// nutrientPlannerSlice.
//
// Sources: official manufacturer feeding charts (public domain dosage data).
// Values are representative defaults -- users should always verify against
// the packaging of their specific product batch.
// ---------------------------------------------------------------------------

import type { NutrientSchedulePlugin } from '@/services/pluginService'

// ---------------------------------------------------------------------------
// Brand Definitions
// ---------------------------------------------------------------------------

export const NUTRIENT_BRAND_SCHEDULES: NutrientSchedulePlugin[] = [
    // ── Advanced Nutrients (pH Perfect Sensi) ────────────────────────────
    {
        id: 'builtin.advanced-nutrients-sensi',
        name: 'Advanced Nutrients - pH Perfect Sensi',
        version: '1.0.0',
        description: 'pH Perfect Sensi Grow/Bloom A+B for soil and coco',
        author: 'CannaGuide Built-in',
        category: 'nutrient-schedule',
        tags: ['advanced-nutrients', 'ph-perfect', 'sensi'],
        data: {
            brand: 'Advanced Nutrients',
            scheduleName: 'pH Perfect Sensi Grow/Bloom',
            mediumTypes: ['Soil', 'Coco'],
            weeks: [
                {
                    week: 1,
                    stage: 'Seedling',
                    products: [
                        { name: 'Sensi Grow A', dosageMlPerLiter: 0.5 },
                        { name: 'Sensi Grow B', dosageMlPerLiter: 0.5 },
                    ],
                    ecTarget: 0.4,
                    phTarget: [5.8, 6.2],
                    notes: 'Very light feeding for seedlings',
                },
                {
                    week: 2,
                    stage: 'Seedling',
                    products: [
                        { name: 'Sensi Grow A', dosageMlPerLiter: 1.0 },
                        { name: 'Sensi Grow B', dosageMlPerLiter: 1.0 },
                    ],
                    ecTarget: 0.6,
                    phTarget: [5.8, 6.3],
                },
                {
                    week: 3,
                    stage: 'Vegetative',
                    products: [
                        { name: 'Sensi Grow A', dosageMlPerLiter: 2.0 },
                        { name: 'Sensi Grow B', dosageMlPerLiter: 2.0 },
                        { name: 'B-52', dosageMlPerLiter: 1.0 },
                    ],
                    ecTarget: 1.0,
                    phTarget: [5.8, 6.5],
                },
                {
                    week: 4,
                    stage: 'Vegetative',
                    products: [
                        { name: 'Sensi Grow A', dosageMlPerLiter: 3.0 },
                        { name: 'Sensi Grow B', dosageMlPerLiter: 3.0 },
                        { name: 'B-52', dosageMlPerLiter: 2.0 },
                        { name: 'Voodoo Juice', dosageMlPerLiter: 2.0 },
                    ],
                    ecTarget: 1.3,
                    phTarget: [5.8, 6.5],
                },
                {
                    week: 5,
                    stage: 'Vegetative',
                    products: [
                        { name: 'Sensi Grow A', dosageMlPerLiter: 4.0 },
                        { name: 'Sensi Grow B', dosageMlPerLiter: 4.0 },
                        { name: 'B-52', dosageMlPerLiter: 2.0 },
                    ],
                    ecTarget: 1.5,
                    phTarget: [5.8, 6.5],
                },
                {
                    week: 6,
                    stage: 'Flowering',
                    products: [
                        { name: 'Sensi Bloom A', dosageMlPerLiter: 2.0 },
                        { name: 'Sensi Bloom B', dosageMlPerLiter: 2.0 },
                        { name: 'Big Bud', dosageMlPerLiter: 1.0 },
                    ],
                    ecTarget: 1.4,
                    phTarget: [5.8, 6.3],
                    notes: 'Transition to bloom nutrients',
                },
                {
                    week: 7,
                    stage: 'Flowering',
                    products: [
                        { name: 'Sensi Bloom A', dosageMlPerLiter: 3.0 },
                        { name: 'Sensi Bloom B', dosageMlPerLiter: 3.0 },
                        { name: 'Big Bud', dosageMlPerLiter: 2.0 },
                        { name: 'Bud Candy', dosageMlPerLiter: 2.0 },
                    ],
                    ecTarget: 1.6,
                    phTarget: [5.8, 6.3],
                },
                {
                    week: 8,
                    stage: 'Flowering',
                    products: [
                        { name: 'Sensi Bloom A', dosageMlPerLiter: 4.0 },
                        { name: 'Sensi Bloom B', dosageMlPerLiter: 4.0 },
                        { name: 'Big Bud', dosageMlPerLiter: 2.0 },
                        { name: 'Bud Candy', dosageMlPerLiter: 2.0 },
                        { name: 'Overdrive', dosageMlPerLiter: 1.0 },
                    ],
                    ecTarget: 1.8,
                    phTarget: [5.8, 6.3],
                },
                {
                    week: 9,
                    stage: 'Flowering',
                    products: [
                        { name: 'Sensi Bloom A', dosageMlPerLiter: 3.0 },
                        { name: 'Sensi Bloom B', dosageMlPerLiter: 3.0 },
                        { name: 'Overdrive', dosageMlPerLiter: 2.0 },
                    ],
                    ecTarget: 1.5,
                    phTarget: [5.8, 6.3],
                    notes: 'Reduce feeding, prepare for flush',
                },
                {
                    week: 10,
                    stage: 'Flowering',
                    products: [{ name: 'Flawless Finish', dosageMlPerLiter: 2.0 }],
                    ecTarget: 0.2,
                    phTarget: [5.8, 6.3],
                    notes: 'Flush week',
                },
            ],
            flushWeeks: [10],
        },
    },

    // ── BioBizz (Organic) ───────────────────────────────────────────────
    {
        id: 'builtin.biobizz-organic',
        name: 'BioBizz - Organic Grow/Bloom',
        version: '1.0.0',
        description: 'BioBizz organic nutrient line for soil grows',
        author: 'CannaGuide Built-in',
        category: 'nutrient-schedule',
        tags: ['biobizz', 'organic', 'soil'],
        data: {
            brand: 'BioBizz',
            scheduleName: 'BioBizz Organic',
            mediumTypes: ['Soil'],
            weeks: [
                {
                    week: 1,
                    stage: 'Seedling',
                    products: [{ name: 'Root-Juice', dosageMlPerLiter: 1.0 }],
                    ecTarget: 0.3,
                    phTarget: [6.0, 6.5],
                    notes: 'Root development only',
                },
                {
                    week: 2,
                    stage: 'Seedling',
                    products: [
                        { name: 'Bio-Grow', dosageMlPerLiter: 1.0 },
                        { name: 'Root-Juice', dosageMlPerLiter: 2.0 },
                    ],
                    ecTarget: 0.5,
                    phTarget: [6.0, 6.5],
                },
                {
                    week: 3,
                    stage: 'Vegetative',
                    products: [
                        { name: 'Bio-Grow', dosageMlPerLiter: 2.0 },
                        { name: 'Root-Juice', dosageMlPerLiter: 3.0 },
                        { name: 'Alg-A-Mic', dosageMlPerLiter: 1.0 },
                    ],
                    ecTarget: 0.8,
                    phTarget: [6.0, 6.8],
                },
                {
                    week: 4,
                    stage: 'Vegetative',
                    products: [
                        { name: 'Bio-Grow', dosageMlPerLiter: 3.0 },
                        { name: 'Bio-Heaven', dosageMlPerLiter: 2.0 },
                        { name: 'Alg-A-Mic', dosageMlPerLiter: 2.0 },
                    ],
                    ecTarget: 1.0,
                    phTarget: [6.0, 6.8],
                },
                {
                    week: 5,
                    stage: 'Vegetative',
                    products: [
                        { name: 'Bio-Grow', dosageMlPerLiter: 4.0 },
                        { name: 'Bio-Heaven', dosageMlPerLiter: 2.5 },
                        { name: 'Alg-A-Mic', dosageMlPerLiter: 3.0 },
                    ],
                    ecTarget: 1.2,
                    phTarget: [6.0, 6.8],
                },
                {
                    week: 6,
                    stage: 'Flowering',
                    products: [
                        { name: 'Bio-Grow', dosageMlPerLiter: 2.0 },
                        { name: 'Bio-Bloom', dosageMlPerLiter: 2.0 },
                        { name: 'Bio-Heaven', dosageMlPerLiter: 2.0 },
                        { name: 'Top-Max', dosageMlPerLiter: 1.0 },
                    ],
                    ecTarget: 1.2,
                    phTarget: [6.0, 6.5],
                    notes: 'Transition -- both grow and bloom',
                },
                {
                    week: 7,
                    stage: 'Flowering',
                    products: [
                        { name: 'Bio-Bloom', dosageMlPerLiter: 3.0 },
                        { name: 'Bio-Heaven', dosageMlPerLiter: 2.5 },
                        { name: 'Top-Max', dosageMlPerLiter: 2.0 },
                    ],
                    ecTarget: 1.4,
                    phTarget: [6.0, 6.5],
                },
                {
                    week: 8,
                    stage: 'Flowering',
                    products: [
                        { name: 'Bio-Bloom', dosageMlPerLiter: 4.0 },
                        { name: 'Bio-Heaven', dosageMlPerLiter: 3.0 },
                        { name: 'Top-Max', dosageMlPerLiter: 3.0 },
                    ],
                    ecTarget: 1.6,
                    phTarget: [6.0, 6.5],
                },
                {
                    week: 9,
                    stage: 'Flowering',
                    products: [
                        { name: 'Bio-Bloom', dosageMlPerLiter: 3.0 },
                        { name: 'Top-Max', dosageMlPerLiter: 2.0 },
                    ],
                    ecTarget: 1.2,
                    phTarget: [6.0, 6.5],
                    notes: 'Reduce nutrients before flush',
                },
                {
                    week: 10,
                    stage: 'Flowering',
                    products: [],
                    ecTarget: 0.1,
                    phTarget: [6.0, 6.5],
                    notes: 'Flush with plain pH water',
                },
            ],
            flushWeeks: [10],
        },
    },

    // ── General Hydroponics (Flora Series) ──────────────────────────────
    {
        id: 'builtin.gh-flora-series',
        name: 'General Hydroponics - Flora Series',
        version: '1.0.0',
        description: 'GH Flora Micro/Grow/Bloom 3-part system for hydro and coco',
        author: 'CannaGuide Built-in',
        category: 'nutrient-schedule',
        tags: ['general-hydroponics', 'flora-series', 'hydro', 'coco'],
        data: {
            brand: 'General Hydroponics',
            scheduleName: 'Flora Series 3-Part',
            mediumTypes: ['Hydro', 'Coco'],
            weeks: [
                {
                    week: 1,
                    stage: 'Seedling',
                    products: [
                        { name: 'FloraMicro', dosageMlPerLiter: 0.5 },
                        { name: 'FloraGro', dosageMlPerLiter: 0.5 },
                        { name: 'FloraBloom', dosageMlPerLiter: 0.5 },
                    ],
                    ecTarget: 0.4,
                    phTarget: [5.5, 6.0],
                },
                {
                    week: 2,
                    stage: 'Seedling',
                    products: [
                        { name: 'FloraMicro', dosageMlPerLiter: 1.0 },
                        { name: 'FloraGro', dosageMlPerLiter: 1.0 },
                        { name: 'FloraBloom', dosageMlPerLiter: 0.5 },
                    ],
                    ecTarget: 0.6,
                    phTarget: [5.5, 6.0],
                },
                {
                    week: 3,
                    stage: 'Vegetative',
                    products: [
                        { name: 'FloraMicro', dosageMlPerLiter: 2.0 },
                        { name: 'FloraGro', dosageMlPerLiter: 2.5 },
                        { name: 'FloraBloom', dosageMlPerLiter: 0.5 },
                    ],
                    ecTarget: 1.0,
                    phTarget: [5.5, 6.0],
                },
                {
                    week: 4,
                    stage: 'Vegetative',
                    products: [
                        { name: 'FloraMicro', dosageMlPerLiter: 2.5 },
                        { name: 'FloraGro', dosageMlPerLiter: 3.0 },
                        { name: 'FloraBloom', dosageMlPerLiter: 1.0 },
                    ],
                    ecTarget: 1.4,
                    phTarget: [5.5, 6.0],
                },
                {
                    week: 5,
                    stage: 'Flowering',
                    products: [
                        { name: 'FloraMicro', dosageMlPerLiter: 2.5 },
                        { name: 'FloraGro', dosageMlPerLiter: 1.0 },
                        { name: 'FloraBloom', dosageMlPerLiter: 2.5 },
                    ],
                    ecTarget: 1.4,
                    phTarget: [5.5, 6.0],
                    notes: 'Shift ratio toward bloom',
                },
                {
                    week: 6,
                    stage: 'Flowering',
                    products: [
                        { name: 'FloraMicro', dosageMlPerLiter: 2.5 },
                        { name: 'FloraGro', dosageMlPerLiter: 0.5 },
                        { name: 'FloraBloom', dosageMlPerLiter: 3.5 },
                    ],
                    ecTarget: 1.6,
                    phTarget: [5.5, 6.0],
                },
                {
                    week: 7,
                    stage: 'Flowering',
                    products: [
                        { name: 'FloraMicro', dosageMlPerLiter: 2.5 },
                        { name: 'FloraBloom', dosageMlPerLiter: 4.0 },
                    ],
                    ecTarget: 1.8,
                    phTarget: [5.5, 6.0],
                },
                {
                    week: 8,
                    stage: 'Flowering',
                    products: [
                        { name: 'FloraMicro', dosageMlPerLiter: 2.0 },
                        { name: 'FloraBloom', dosageMlPerLiter: 3.5 },
                    ],
                    ecTarget: 1.5,
                    phTarget: [5.5, 6.0],
                    notes: 'Reduce feeding for ripening',
                },
                {
                    week: 9,
                    stage: 'Flowering',
                    products: [],
                    ecTarget: 0.1,
                    phTarget: [5.5, 6.0],
                    notes: 'Flush -- plain pH water only',
                },
            ],
            flushWeeks: [9],
        },
    },

    // ── CANNA (Coco A+B) ────────────────────────────────────────────────
    {
        id: 'builtin.canna-coco',
        name: 'CANNA - Coco A+B',
        version: '1.0.0',
        description: 'CANNA Coco A+B optimized for coco coir medium',
        author: 'CannaGuide Built-in',
        category: 'nutrient-schedule',
        tags: ['canna', 'coco', 'a+b'],
        data: {
            brand: 'CANNA',
            scheduleName: 'CANNA Coco A+B',
            mediumTypes: ['Coco'],
            weeks: [
                {
                    week: 1,
                    stage: 'Seedling',
                    products: [
                        { name: 'CANNA Coco A', dosageMlPerLiter: 1.0 },
                        { name: 'CANNA Coco B', dosageMlPerLiter: 1.0 },
                        { name: 'Rhizotonic', dosageMlPerLiter: 2.5 },
                    ],
                    ecTarget: 0.5,
                    phTarget: [5.6, 6.0],
                },
                {
                    week: 2,
                    stage: 'Seedling',
                    products: [
                        { name: 'CANNA Coco A', dosageMlPerLiter: 1.5 },
                        { name: 'CANNA Coco B', dosageMlPerLiter: 1.5 },
                        { name: 'Rhizotonic', dosageMlPerLiter: 2.5 },
                    ],
                    ecTarget: 0.7,
                    phTarget: [5.6, 6.0],
                },
                {
                    week: 3,
                    stage: 'Vegetative',
                    products: [
                        { name: 'CANNA Coco A', dosageMlPerLiter: 2.5 },
                        { name: 'CANNA Coco B', dosageMlPerLiter: 2.5 },
                        { name: 'CANNAZYM', dosageMlPerLiter: 2.5 },
                    ],
                    ecTarget: 1.1,
                    phTarget: [5.6, 6.2],
                },
                {
                    week: 4,
                    stage: 'Vegetative',
                    products: [
                        { name: 'CANNA Coco A', dosageMlPerLiter: 3.5 },
                        { name: 'CANNA Coco B', dosageMlPerLiter: 3.5 },
                        { name: 'CANNAZYM', dosageMlPerLiter: 2.5 },
                    ],
                    ecTarget: 1.4,
                    phTarget: [5.6, 6.2],
                },
                {
                    week: 5,
                    stage: 'Flowering',
                    products: [
                        { name: 'CANNA Coco A', dosageMlPerLiter: 3.0 },
                        { name: 'CANNA Coco B', dosageMlPerLiter: 3.0 },
                        { name: 'CANNABOOST', dosageMlPerLiter: 1.0 },
                        { name: 'PK 13/14', dosageMlPerLiter: 0.5 },
                    ],
                    ecTarget: 1.5,
                    phTarget: [5.6, 6.0],
                    notes: 'Start bloom boosters',
                },
                {
                    week: 6,
                    stage: 'Flowering',
                    products: [
                        { name: 'CANNA Coco A', dosageMlPerLiter: 3.5 },
                        { name: 'CANNA Coco B', dosageMlPerLiter: 3.5 },
                        { name: 'CANNABOOST', dosageMlPerLiter: 2.0 },
                        { name: 'PK 13/14', dosageMlPerLiter: 1.0 },
                    ],
                    ecTarget: 1.8,
                    phTarget: [5.6, 6.0],
                },
                {
                    week: 7,
                    stage: 'Flowering',
                    products: [
                        { name: 'CANNA Coco A', dosageMlPerLiter: 4.0 },
                        { name: 'CANNA Coco B', dosageMlPerLiter: 4.0 },
                        { name: 'CANNABOOST', dosageMlPerLiter: 2.0 },
                        { name: 'PK 13/14', dosageMlPerLiter: 1.5 },
                    ],
                    ecTarget: 2.0,
                    phTarget: [5.6, 6.0],
                    notes: 'Peak bloom feeding',
                },
                {
                    week: 8,
                    stage: 'Flowering',
                    products: [
                        { name: 'CANNA Coco A', dosageMlPerLiter: 2.5 },
                        { name: 'CANNA Coco B', dosageMlPerLiter: 2.5 },
                        { name: 'CANNAZYM', dosageMlPerLiter: 2.5 },
                    ],
                    ecTarget: 1.3,
                    phTarget: [5.6, 6.0],
                    notes: 'Reduce nutrients before flush',
                },
                {
                    week: 9,
                    stage: 'Flowering',
                    products: [{ name: 'CANNA Flush', dosageMlPerLiter: 4.0 }],
                    ecTarget: 0.2,
                    phTarget: [5.6, 6.0],
                    notes: 'Final flush',
                },
            ],
            flushWeeks: [9],
        },
    },

    // ── FoxFarm (Trio) ──────────────────────────────────────────────────
    {
        id: 'builtin.foxfarm-trio',
        name: 'FoxFarm - Liquid Nutrient Trio',
        version: '1.0.0',
        description: 'FoxFarm Grow Big / Big Bloom / Tiger Bloom soil trio',
        author: 'CannaGuide Built-in',
        category: 'nutrient-schedule',
        tags: ['foxfarm', 'trio', 'soil', 'organic'],
        data: {
            brand: 'FoxFarm',
            scheduleName: 'Liquid Nutrient Trio',
            mediumTypes: ['Soil'],
            weeks: [
                {
                    week: 1,
                    stage: 'Seedling',
                    products: [{ name: 'Big Bloom', dosageMlPerLiter: 2.5 }],
                    ecTarget: 0.3,
                    phTarget: [6.0, 6.5],
                    notes: 'Big Bloom only for seedlings -- gentle microbes',
                },
                {
                    week: 2,
                    stage: 'Seedling',
                    products: [
                        { name: 'Big Bloom', dosageMlPerLiter: 5.0 },
                        { name: 'Grow Big', dosageMlPerLiter: 1.0 },
                    ],
                    ecTarget: 0.5,
                    phTarget: [6.0, 6.5],
                },
                {
                    week: 3,
                    stage: 'Vegetative',
                    products: [
                        { name: 'Big Bloom', dosageMlPerLiter: 5.0 },
                        { name: 'Grow Big', dosageMlPerLiter: 2.0 },
                    ],
                    ecTarget: 0.8,
                    phTarget: [6.0, 6.8],
                },
                {
                    week: 4,
                    stage: 'Vegetative',
                    products: [
                        { name: 'Big Bloom', dosageMlPerLiter: 7.5 },
                        { name: 'Grow Big', dosageMlPerLiter: 3.0 },
                    ],
                    ecTarget: 1.2,
                    phTarget: [6.0, 6.8],
                },
                {
                    week: 5,
                    stage: 'Flowering',
                    products: [
                        { name: 'Big Bloom', dosageMlPerLiter: 7.5 },
                        { name: 'Grow Big', dosageMlPerLiter: 1.0 },
                        { name: 'Tiger Bloom', dosageMlPerLiter: 2.0 },
                    ],
                    ecTarget: 1.3,
                    phTarget: [6.0, 6.5],
                    notes: 'Transition to bloom',
                },
                {
                    week: 6,
                    stage: 'Flowering',
                    products: [
                        { name: 'Big Bloom', dosageMlPerLiter: 7.5 },
                        { name: 'Tiger Bloom', dosageMlPerLiter: 3.0 },
                    ],
                    ecTarget: 1.5,
                    phTarget: [6.0, 6.5],
                },
                {
                    week: 7,
                    stage: 'Flowering',
                    products: [
                        { name: 'Big Bloom', dosageMlPerLiter: 10.0 },
                        { name: 'Tiger Bloom', dosageMlPerLiter: 4.0 },
                    ],
                    ecTarget: 1.7,
                    phTarget: [6.0, 6.5],
                },
                {
                    week: 8,
                    stage: 'Flowering',
                    products: [
                        { name: 'Big Bloom', dosageMlPerLiter: 7.5 },
                        { name: 'Tiger Bloom', dosageMlPerLiter: 2.0 },
                    ],
                    ecTarget: 1.2,
                    phTarget: [6.0, 6.5],
                    notes: 'Taper down before flush',
                },
                {
                    week: 9,
                    stage: 'Flowering',
                    products: [{ name: 'Sledgehammer', dosageMlPerLiter: 5.0 }],
                    ecTarget: 0.1,
                    phTarget: [6.0, 6.5],
                    notes: 'Flush with Sledgehammer',
                },
            ],
            flushWeeks: [9],
        },
    },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a built-in brand schedule by its plugin ID. */
export function findBrandSchedule(scheduleId: string): NutrientSchedulePlugin | undefined {
    return NUTRIENT_BRAND_SCHEDULES.find((s) => s.id === scheduleId)
}

/** Get built-in brand schedules compatible with a given grow medium. */
export function findSchedulesForMedium(
    medium: 'Soil' | 'Coco' | 'Hydro',
): NutrientSchedulePlugin[] {
    return NUTRIENT_BRAND_SCHEDULES.filter((s) => s.data.mediumTypes.includes(medium))
}
