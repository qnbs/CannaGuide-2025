import { Strain } from '@/types'
import { dbService } from './dbService'
import { STRAIN_DATA_VERSION_KEY, CURRENT_STRAIN_DATA_VERSION } from '@/constants'
import { mergeStrainCatalogForUpdate } from '@/services/migrationLogic'
import { createStrainObject } from '@/services/strainFactory'
import { getCatalogVersion } from '@/data/strainCatalogVersion'

export { getCatalogVersion }
export type { StrainCatalogVersion } from '@/data/strainCatalogVersion'

type StrainModule = Record<string, unknown>

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null

const hasStrainIdentity = (value: Record<string, unknown>): boolean =>
    'id' in value && 'name' in value

const isStrainList = (value: unknown): value is Strain[] => {
    if (!Array.isArray(value) || value.length === 0) return false
    const first: unknown = value[0]
    return isRecord(first) && hasStrainIdentity(first)
}

const normalizeStrainCatalog = (candidates: Partial<Strain>[]): Strain[] => {
    const seenIds = new Set<string>()
    const normalized: Strain[] = []

    for (const candidate of candidates) {
        try {
            const strain = createStrainObject(candidate)
            if (seenIds.has(strain.id)) {
                continue
            }

            seenIds.add(strain.id)
            normalized.push(strain)
        } catch {
            console.debug('[StrainService] Failed to normalize strain:', candidate)
        }
    }

    return normalized
}

let strainsDataCache: Strain[] | null = null
let loadPromise: Promise<Strain[]> | null = null

const loadAllStrainsData = (): Promise<Strain[]> => {
    if (strainsDataCache) {
        return Promise.resolve(strainsDataCache)
    }

    // Prevent concurrent loads
    if (loadPromise) {
        return loadPromise
    }

    loadPromise = (async (): Promise<Strain[]> => {
        const modules = import.meta.glob('../data/strains/*.ts')
        const entries = Object.entries(modules).filter(
            ([filePath]) => !filePath.endsWith('/index.ts'),
        )

        const loadedModules = await Promise.allSettled(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            entries.map(([, loader]) => loader() as Promise<StrainModule>),
        )

        const allStrains = loadedModules
            .filter(
                (result): result is PromiseFulfilledResult<StrainModule> =>
                    result.status === 'fulfilled',
            )
            .flatMap((result) => Object.values(result.value).filter(isStrainList))

        strainsDataCache = normalizeStrainCatalog(allStrains.flat() as Partial<Strain>[])
        loadPromise = null
        return strainsDataCache
    })()

    return loadPromise
}

const sharedNames = (left: string[] | undefined, right: string[] | undefined): number =>
    (left ?? []).filter((name) => (right ?? []).includes(name)).length

const bothNumbers = (left: unknown, right: unknown): boolean =>
    typeof left === 'number' && typeof right === 'number'

const sameReportedLevel = (left: string | undefined, right: string | undefined): boolean =>
    left !== undefined && left === right

const typeSimilarity = (left: Strain, right: Strain): number =>
    left.type !== undefined && left.type === right.type ? 20 : 0

const measurementGap = (left: number, right: number, weight: number): number =>
    weight - Math.abs(left - right)

const chemistrySimilarity = (left: Strain, right: Strain): number => {
    const thc = bothNumbers(left.thc, right.thc) ? measurementGap(left.thc, right.thc, 15) : 0
    const cbd = bothNumbers(left.cbd, right.cbd) ? measurementGap(left.cbd, right.cbd, 10) : 0
    return thc + cbd
}

const listSimilarity = (left: Strain, right: Strain): number =>
    sharedNames(left.aromas, right.aromas) * 5 +
    sharedNames(left.dominantTerpenes, right.dominantTerpenes) * 10

const difficultyOf = (strain: Strain): string | undefined => strain.agronomic?.difficulty

const yieldOf = (strain: Strain): string | undefined => strain.agronomic?.yield

const heightOf = (strain: Strain): string | undefined => strain.agronomic?.height

const agronomySimilarity = (left: Strain, right: Strain): number => {
    const difficulty = sameReportedLevel(difficultyOf(left), difficultyOf(right)) ? 5 : 0
    const yieldLevel = sameReportedLevel(yieldOf(left), yieldOf(right)) ? 3 : 0
    const height = sameReportedLevel(heightOf(left), heightOf(right)) ? 2 : 0
    return difficulty + yieldLevel + height
}

export const scoreStrainSimilarity = (left: Strain, right: Strain): number => {
    if (left.id === right.id) return -1
    return (
        typeSimilarity(left, right) +
        chemistrySimilarity(left, right) +
        listSimilarity(left, right) +
        agronomySimilarity(left, right)
    )
}

class StrainService {
    private allStrains: Strain[] = []
    private isInitialized = false

    async init(): Promise<void> {
        if (this.isInitialized) {
            return
        }

        try {
            const allStrainsData = await loadAllStrainsData()
            const storedVersion = await dbService.getMetadata(STRAIN_DATA_VERSION_KEY)
            const dbCount = await dbService.getStrainsCount()

            if (
                dbCount > 0 &&
                storedVersion === CURRENT_STRAIN_DATA_VERSION &&
                dbCount === allStrainsData.length
            ) {
                console.debug('[StrainService] Loading strains from IndexedDB.')
                this.allStrains = await dbService.getAllStrains()
            } else {
                console.debug(
                    '[StrainService] Merging and migrating strain catalog into IndexedDB.',
                )
                const existingDbStrains = dbCount > 0 ? await dbService.getAllStrains() : []
                const mergedStrains = mergeStrainCatalogForUpdate(existingDbStrains, allStrainsData)

                await dbService.addStrains(mergedStrains)
                await dbService.setMetadata(STRAIN_DATA_VERSION_KEY, CURRENT_STRAIN_DATA_VERSION)
                this.allStrains = mergedStrains
                console.debug(
                    `[StrainService] Initialized with ${mergedStrains.length} strains after migration merge.`,
                )
            }
            this.isInitialized = true
        } catch (error) {
            console.debug(
                '[StrainService] Failed to initialize. Falling back to in-memory data.',
                error,
            )
            // Fallback to in-memory data if IndexedDB fails
            this.allStrains = await loadAllStrainsData()
            this.isInitialized = true
        }
    }

    async getAllStrains(): Promise<Strain[]> {
        if (!this.isInitialized) {
            await this.init()
        }
        return this.allStrains
    }

    async getSimilarStrains(currentStrain: Strain, count: number): Promise<Strain[]> {
        if (!this.isInitialized) {
            await this.init()
        }

        return this.allStrains
            .map((strain) => ({
                strain,
                score: scoreStrainSimilarity(currentStrain, strain),
            }))
            .toSorted((a, b) => b.score - a.score)
            .slice(0, count)
            .map((item) => item.strain)
    }
}

export const strainService = new StrainService()
