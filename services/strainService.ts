import { Strain } from '@/types';
import { dbService } from './dbService';
import { STRAIN_DATA_VERSION_KEY, CURRENT_STRAIN_DATA_VERSION } from '@/constants';
import { mergeStrainCatalogForUpdate } from '@/services/migrationLogic';
import { createStrainObject } from '@/services/strainFactory';

type StrainModule = Record<string, unknown>

const DEFAULT_AGRONOMIC = {
    difficulty: 'Medium',
    yield: 'Medium',
    height: 'Medium',
} as const

const normalizeStrainCatalog = (candidates: Partial<Strain>[]): Strain[] => {
    const seenIds = new Set<string>()
    const normalized: Strain[] = []

    for (const candidate of candidates) {
        const strain = createStrainObject(candidate)
        if (seenIds.has(strain.id)) {
            console.warn(`[StrainService] Skipping duplicate strain id "${strain.id}" during catalog normalization.`)
            continue
        }

        seenIds.add(strain.id)
        normalized.push(strain)
    }

    return normalized
}

let strainsDataCache: Strain[] | null = null

const loadAllStrainsData = async (): Promise<Strain[]> => {
    if (strainsDataCache) {
        return strainsDataCache
    }

    const modules = import.meta.glob('../data/strains/*.ts')
    const entries = Object.entries(modules).filter(([filePath]) => !filePath.endsWith('/index.ts'))

    const loadedModules = await Promise.all(entries.map(([, loader]) => loader() as Promise<StrainModule>))

    const allStrains = loadedModules.flatMap((module) =>
        Object.values(module).filter(
            (value): value is Strain[] =>
                Array.isArray(value) &&
                (value.length === 0 || (
                    typeof value[0] === 'object' && value[0] !== null &&
                    'id' in value[0] && 'name' in value[0] && 'type' in value[0]
                )),
        ),
    )

    strainsDataCache = normalizeStrainCatalog(allStrains.flat() as Partial<Strain>[])
    return strainsDataCache
}

class StrainService {
    private allStrains: Strain[] = [];
    private isInitialized = false;

    async init(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            const allStrainsData = await loadAllStrainsData()
            const storedVersion = await dbService.getMetadata(STRAIN_DATA_VERSION_KEY);
            const dbCount = await dbService.getStrainsCount();

            if (dbCount > 0 && storedVersion === CURRENT_STRAIN_DATA_VERSION && dbCount === allStrainsData.length) {
                console.debug('[StrainService] Loading strains from IndexedDB.');
                this.allStrains = await dbService.getAllStrains();
            } else {
                console.debug('[StrainService] Merging and migrating strain catalog into IndexedDB.');
                const existingDbStrains = dbCount > 0 ? await dbService.getAllStrains() : [];
                const mergedStrains = mergeStrainCatalogForUpdate(existingDbStrains, allStrainsData);

                await dbService.addStrains(mergedStrains);
                await dbService.setMetadata(STRAIN_DATA_VERSION_KEY, CURRENT_STRAIN_DATA_VERSION);
                this.allStrains = mergedStrains;
                console.debug(`[StrainService] Initialized with ${mergedStrains.length} strains after migration merge.`);
            }
            this.isInitialized = true;
        } catch (error) {
            console.error('[StrainService] Failed to initialize. Falling back to in-memory data.', error);
            // Fallback to in-memory data if IndexedDB fails
            this.allStrains = await loadAllStrainsData();
            this.isInitialized = true;
        }
    }

    async getAllStrains(): Promise<Strain[]> {
        if (!this.isInitialized) {
            await this.init();
        }
        return this.allStrains;
    }

    async getSimilarStrains(currentStrain: Strain, count: number): Promise<Strain[]> {
        if (!this.isInitialized) {
            await this.init();
        }

        const calculateSimilarity = (s1: Strain, s2: Strain): number => {
            let score = 0;
            if (s1.id === s2.id) return -1; // Exclude self
            const s1Agronomic = s1.agronomic ?? DEFAULT_AGRONOMIC
            const s2Agronomic = s2.agronomic ?? DEFAULT_AGRONOMIC

            // Type
            if (s1.type === s2.type) score += 20;

            // THC/CBD closeness
            score += 15 - Math.abs(s1.thc - s2.thc);
            score += 10 - Math.abs(s1.cbd - s2.cbd);

            // Aroma/Terpene overlap
            const aromaIntersection = (s1.aromas || []).filter(a => (s2.aromas || []).includes(a));
            score += aromaIntersection.length * 5;

            const terpeneIntersection = (s1.dominantTerpenes || []).filter(t => (s2.dominantTerpenes || []).includes(t));
            score += terpeneIntersection.length * 10;

            // Agronomics
            if (s1Agronomic.difficulty === s2Agronomic.difficulty) score += 5;
            if (s1Agronomic.yield === s2Agronomic.yield) score += 3;
            if (s1Agronomic.height === s2Agronomic.height) score += 2;

            return score;
        };

        return this.allStrains
            .map(strain => ({
                strain,
                score: calculateSimilarity(currentStrain, strain),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, count)
            .map(item => item.strain);
    }
}

export const strainService = new StrainService();
