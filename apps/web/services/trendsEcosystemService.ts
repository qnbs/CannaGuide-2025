import type {
    GeneticTrendCategory,
    GrowSetup,
    GrowTechCategory,
    Plant,
    TrendMatchScore,
} from '@/types'

// ---------------------------------------------------------------------------
// Static cross-hub relation maps
// ---------------------------------------------------------------------------

const GENETIC_TO_GROWTECH: Record<GeneticTrendCategory, GrowTechCategory[]> = {
    terpeneDiversity: ['sustainability', 'sensorsIoT'],
    ultraPotency: ['dynamicLighting', 'sensorsIoT'],
    balancedHybrids: ['aiAutomation', 'sensorsIoT'],
    autofloweringRevolution: ['dynamicLighting', 'smartGrowBoxes'],
    advancedBreeding: ['tissueCulture', 'digitalTwin'],
    landraceRevival: ['sustainability', 'hydroAero'],
}

const GROWTECH_TO_GENETIC: Record<GrowTechCategory, GeneticTrendCategory[]> = Object.entries(
    GENETIC_TO_GROWTECH,
).reduce<Record<string, GeneticTrendCategory[]>>((acc, [genetic, techs]) => {
    techs.forEach((tech) => {
        acc[tech] = [...(acc[tech] ?? []), genetic as GeneticTrendCategory]
    })
    return acc
}, {}) as Record<GrowTechCategory, GeneticTrendCategory[]>

// ---------------------------------------------------------------------------
// Match score helpers
// ---------------------------------------------------------------------------

function scoreOf(score: number, reason: string): { score: number; reason: string } {
    return { score, reason }
}

function calcGeneticScore(
    category: GeneticTrendCategory,
    plant: Plant,
): { score: number; reason: string } {
    switch (category) {
        case 'terpeneDiversity':
            if (plant.mediumType === 'Soil' || plant.mediumType === 'Coco') {
                return scoreOf(90, 'Soil and Coco substrates maximise terpene expression')
            }
            return scoreOf(65, 'Hydroponic setups can still express terpene diversity with DWC')

        case 'ultraPotency': {
            const stage = plant.stage
            if (stage === 'FLOWERING') {
                return scoreOf(95, 'Flowering stage: potency focus is most relevant now')
            }
            if (stage === 'VEGETATIVE') {
                return scoreOf(70, 'Vegetative stage: prepare for high-potency genetics now')
            }
            return scoreOf(45, 'Potency trends are most actionable during Flowering')
        }

        case 'balancedHybrids':
            return scoreOf(80, 'Balanced hybrids suit all setups -- consistent performance')

        case 'autofloweringRevolution':
            if (plant.strain.floweringType === 'Autoflower') {
                return scoreOf(95, 'You are already growing autoflowering genetics')
            }
            return scoreOf(60, 'Autoflower strains could complement your photoperiod grow')

        case 'advancedBreeding': {
            const earlyStage =
                plant.stage === 'SEED' ||
                plant.stage === 'GERMINATION' ||
                plant.stage === 'SEEDLING' ||
                plant.stage === 'VEGETATIVE'
            return earlyStage
                ? scoreOf(75, 'Early growth stage: ideal time to explore breeding potential')
                : scoreOf(50, 'Advanced breeding is most relevant in vegetative or earlier stages')
        }

        case 'landraceRevival':
            if (plant.mediumType === 'Soil') {
                return scoreOf(
                    88,
                    'Soil medium respects landrace genetics and traditional phenotype expression',
                )
            }
            return scoreOf(55, 'Soil grows best preserve authentic landrace characteristics')

        default:
            return scoreOf(50, 'General trend relevance')
    }
}

function calcGrowTechScore(
    category: GrowTechCategory,
    setup: GrowSetup,
): { score: number; reason: string } {
    switch (category) {
        case 'dynamicLighting':
            if (setup.lightType === 'LED' && setup.dynamicLighting) {
                return scoreOf(
                    95,
                    'LED with dynamic lighting already enabled -- maximise spectrum control',
                )
            }
            if (setup.lightType === 'LED') {
                return scoreOf(80, 'LED setup is compatible -- enable dynamic spectrum scheduling')
            }
            return scoreOf(
                55,
                'HPS can benefit from smart timers; LED upgrade unlocks full potential',
            )

        case 'sensorsIoT':
            return scoreOf(88, 'IoT sensors add value to every grow setup regardless of size')

        case 'aiAutomation':
            return scoreOf(82, 'AI-assisted automation improves all grow environments')

        case 'digitalTwin':
            if (setup.dynamicLighting) {
                return scoreOf(
                    85,
                    'Dynamic lighting data feeds directly into digital twin simulations',
                )
            }
            return scoreOf(70, 'Digital twin modelling works best with sensor-rich setups')

        case 'hydroAero':
            if (setup.medium === 'Hydro' || setup.medium === 'Aeroponics') {
                return scoreOf(
                    95,
                    'Direct relevance: your current medium is hydroponic or aeroponic',
                )
            }
            if (setup.medium === 'Coco') {
                return scoreOf(
                    65,
                    'Coco is a stepping stone -- DWC/NFT upgrades are straightforward',
                )
            }
            return scoreOf(40, 'Soil growers can switch to hydro for faster growth cycles')

        case 'tissueCulture':
            return scoreOf(
                60,
                'Tissue culture is an advanced technique for all growers to consider',
            )

        case 'smartGrowBoxes':
            return scoreOf(68, 'Smart grow boxes benefit any setup size from micro to full-scale')

        case 'sustainability':
            if (setup.lightType === 'LED') {
                return scoreOf(90, 'LED lighting already reduces energy footprint -- build on that')
            }
            return scoreOf(
                65,
                'Switching to LED and water recycling are key sustainability upgrades',
            )

        default:
            return scoreOf(50, 'General tech relevance')
    }
}

// ---------------------------------------------------------------------------
// Simple 5-minute in-memory cache
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
    value: T
    expiry: number
}

const CACHE_TTL_MS = 5 * 60 * 1_000

const geneticCache = new Map<string, CacheEntry<TrendMatchScore>>()
const growTechCache = new Map<string, CacheEntry<TrendMatchScore>>()

function cacheGet<T>(map: Map<string, CacheEntry<T>>, key: string): T | null {
    const entry = map.get(key)
    if (entry === undefined || Date.now() > entry.expiry) {
        map.delete(key)
        return null
    }
    return entry.value
}

function cacheSet<T>(map: Map<string, CacheEntry<T>>, key: string, value: T): void {
    map.set(key, { value, expiry: Date.now() + CACHE_TTL_MS })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function calculateGeneticTrendMatchScore(
    category: GeneticTrendCategory,
    plant: Plant,
): TrendMatchScore {
    const key = `${category}:${plant.id}:${plant.stage}:${plant.mediumType}`
    const cached = cacheGet(geneticCache, key)
    if (cached !== null) return cached

    const { score, reason } = calcGeneticScore(category, plant)
    const result: TrendMatchScore = { category, score, reason }
    cacheSet(geneticCache, key, result)
    return result
}

export function calculateGrowTechMatchScore(
    category: GrowTechCategory,
    setup: GrowSetup,
): TrendMatchScore {
    const key = `${category}:${setup.medium}:${setup.lightType}:${String(setup.dynamicLighting)}`
    const cached = cacheGet(growTechCache, key)
    if (cached !== null) return cached

    const { score, reason } = calcGrowTechScore(category, setup)
    const result: TrendMatchScore = { category, score, reason }
    cacheSet(growTechCache, key, result)
    return result
}

export function getRelatedGrowTechForGenetic(genetic: GeneticTrendCategory): GrowTechCategory[] {
    return GENETIC_TO_GROWTECH[genetic] ?? []
}

export function getRelatedGeneticForGrowTech(tech: GrowTechCategory): GeneticTrendCategory[] {
    return GROWTECH_TO_GENETIC[tech] ?? []
}
