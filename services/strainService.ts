import { Strain } from '@/types';
import { dbService } from '@/services/dbService';
import { allStrainsData } from '@/data/strains/index';

const DATA_VERSION = '2.2.0'; // Updated version for new indexing strategy

const stopWords = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with', 'i', 'you']);

const tokenize = (text: string): string[] => {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word)); // Same logic as indexer
};

// Builds index from raw, untranslated data
const buildSearchIndex = (strains: Strain[]): Record<string, string[]> => {
    const index: Record<string, string[]> = {};
    strains.forEach(strain => {
        const strainId = strain.id;
        const textToTokenize = [
            strain.name,
            strain.type,
            strain.typeDetails,
            strain.genetics,
            strain.description,
            ...(strain.aromas || []),
            ...(strain.dominantTerpenes || []),
        ].join(' ');
        const uniqueTokens = new Set(tokenize(textToTokenize));
        uniqueTokens.forEach(token => {
            if (!index[token]) {
                index[token] = [];
            }
            index[token].push(strainId);
        });
    });
    return index;
};

class StrainService {
  private baseStrainsCache: Strain[] | null = null;
  private initializationPromise: Promise<void> | null = null;

  private async rebuildCache(strains: Strain[]): Promise<void> {
      console.log('[StrainService] Rebuilding strain cache and search index in IndexedDB.');
      const searchIndex = buildSearchIndex(strains);
      await dbService.addStrains(strains);
      await dbService.updateSearchIndex(searchIndex);
      await dbService.setMetadata({ key: 'strain_cache_metadata', version: DATA_VERSION });
      console.log(`[StrainService] Successfully rebuilt cache with ${strains.length} strains.`);
  }

  private async _initialize(): Promise<void> {
    try {
        const metadata = await dbService.getMetadata('strain_cache_metadata');
        let strainsToCache: Strain[];

        // Check if a valid, populated cache exists in IndexedDB
        if (metadata?.version === DATA_VERSION) {
            const cachedStrains = await dbService.getAllStrains();
            if (cachedStrains.length > 0) {
                console.log(`[StrainService] Cache hit for version ${DATA_VERSION}. Loading ${cachedStrains.length} strains from IndexedDB.`);
                strainsToCache = cachedStrains;
            } else {
                 // Version matches but DB is empty, this is a cache miss scenario
                 console.log('[StrainService] Cache version match but DB is empty. Repopulating from source.');
                 strainsToCache = allStrainsData;
                 await this.rebuildCache(strainsToCache);
            }
        } else {
            // Cache is old, missing, or invalid. Rebuild from source.
            console.log(`[StrainService] Cache miss or version mismatch (found ${metadata?.version}, need ${DATA_VERSION}). Populating cache from imported data.`);
            strainsToCache = allStrainsData;
            await this.rebuildCache(strainsToCache);
        }
        
        // Always sort the cache after loading, ensuring consistent order.
        strainsToCache.sort((a, b) => a.name.localeCompare(b.name));
        this.baseStrainsCache = strainsToCache;

    } catch (error) {
        console.error('[StrainService] Critical error during IndexedDB initialization:', error);
        // Fallback to in-memory data if DB fails
        const fallbackData = [...allStrainsData].sort((a, b) => a.name.localeCompare(b.name));
        this.baseStrainsCache = fallbackData;
        console.warn('[StrainService] Using in-memory fallback data due to an error.');
    }
  }

  public init(): Promise<void> {
    if (!this.initializationPromise) {
        this.initializationPromise = this._initialize();
    }
    return this.initializationPromise;
  }

  public async getAllStrains(): Promise<Strain[]> {
    if (this.initializationPromise) {
        await this.initializationPromise;
    }
    return [...(this.baseStrainsCache || [])];
  }

  public async getStrainById(id: string): Promise<Strain | undefined> {
    if (this.initializationPromise) {
        await this.initializationPromise;
    }
    return this.baseStrainsCache?.find(s => s.id === id);
  }

  public async getSimilarStrains(baseStrain: Strain, count: number = 4): Promise<Strain[]> {
    if (this.initializationPromise) {
        await this.initializationPromise;
    }
    if (!this.baseStrainsCache) return [];

    return this.baseStrainsCache
      .filter(s =>
        s.id !== baseStrain.id &&
        s.type === baseStrain.type &&
        Math.abs(s.thc - baseStrain.thc) <= 3 &&
        (s.dominantTerpenes && baseStrain.dominantTerpenes ? s.dominantTerpenes.some(t => baseStrain.dominantTerpenes!.includes(t)) : false)
      )
      .slice(0, count);
  }
}

export const strainService = new StrainService();