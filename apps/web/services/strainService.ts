import { Strain } from '@/types'
import { dbService } from './dbService'
import { STRAIN_DATA_VERSION_KEY, CURRENT_STRAIN_DATA_VERSION } from '@/constants'
import { mergeStrainCatalogForUpdate } from '@/services/migrationLogic'
import { createStrainObject } from '@/services/strainFactory'
import { getCatalogVersion } from '@/data/strainCatalogVersion'

export { getCatalogVersion }
export type { StrainCatalogVersion } from '@/data/strainCatalogVersion'

type StrainModule = Record<string, unknown>

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
            .flatMap((result) =>
                Object.values(result.value).filter(
                    (value): value is Strain[] =>
                        Array.isArray(value) &&
                        value.length > 0 &&
                        typeof value[0] === 'object' &&
                        value[0] !== null &&
                        'id' in value[0] &&
                        'name' in value[0],
                ),
            )

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

export const scoreStrainSimilarity = (left: Strain, right: Strain): number => {
    if (left.id === right.id) return -1
    let score = 0
    if (left.type && left.type === right.type) score += 20
    if (bothNumbers(left.thc, right.thc)) score += 15 - Math.abs(left.thc - right.thc)
    if (bothNumbers(left.cbd, right.cbd)) score += 10 - Math.abs(left.cbd - right.cbd)
    score += sharedNames(left.aromas, right.aromas) * 5
    score += sharedNames(left.dominantTerpenes, right.dominantTerpenes) * 10
    if (sameReportedLevel(left.agronomic?.difficulty, right.agronomic?.difficulty)) score += 5
    if (sameReportedLevel(left.agronomic?.yield, right.agronomic?.yield)) score += 3
    if (sameReportedLevel(left.agronomic?.height, right.agronomic?.height)) score += 2
    return score
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
