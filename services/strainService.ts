import { Strain } from '@/types';
import { allStrainsData } from '@/data/strains/index';
import { dbService } from '@/services/dbService';

// Define the TFunction type locally to avoid circular dependency issues
// and keep the service self-contained.
type TFunction = (key: string, replacements?: Record<string, string | number>) => any;

/**
 * A simple search index for high-performance text searches.
 */
interface StrainSearchIndex {
  id: string;
  searchText: string;
}

/**
 * A sophisticated, stateful service to manage all strain data operations.
 * It handles fetching, translation, caching, and indexed searching.
 * Designed as a singleton to be initialized once and used throughout the app.
 */
class StrainService {
  private strainsCache: Strain[] | null = null;
  private searchIndex: StrainSearchIndex[] = [];
  private isInitialized = false;

  /**
   * Merges raw strain data with translated text content from locale files.
   * Includes graceful fallbacks for missing translations to prevent UI errors.
   * @param t The translation function.
   * @returns An array of fully translated and processed Strain objects.
   */
  private processAndTranslateStrains(t: TFunction): Strain[] {
    const getTranslatedString = (key: string, fallback = ''): string => {
        const result = t(key);
        // If the translation function returns the key itself, it means no translation was found.
        return (typeof result === 'string' && result !== key) ? result : fallback;
    };
    
    const getTranslatedObject = (key: string, fallback: object): object => {
         const result = t(key);
         // Ensure we return an object, not a key path string.
         return (typeof result === 'object' && result !== null) ? result : fallback;
    }

    const getTranslatedArray = (key: string): string[] => {
        const result = t(key);
        // Ensure we return a valid array of strings.
        return Array.isArray(result) && result.every(item => typeof item === 'string') ? result : [];
    };

    return allStrainsData.map(strain => ({
      ...strain,
      description: getTranslatedString(`strainsData.${strain.id}.description`),
      typeDetails: getTranslatedString(`strainsData.${strain.id}.typeDetails`),
      genetics: getTranslatedString(`strainsData.${strain.id}.genetics`),
      aromas: getTranslatedArray(`strainsData.${strain.id}.aromas`),
      dominantTerpenes: getTranslatedArray(`strainsData.${strain.id}.dominantTerpenes`),
      agronomic: {
        ...strain.agronomic,
        yieldDetails: getTranslatedObject(`strainsData.${strain.id}.yieldDetails`, { indoor: 'N/A', outdoor: 'N/A' }) as { indoor: string, outdoor: string },
        heightDetails: getTranslatedObject(`strainsData.${strain.id}.heightDetails`, { indoor: 'N/A', outdoor: 'N/A' }) as { indoor: string, outdoor: string },
      },
    }));
  }
  
  /**
   * Builds a lightweight, in-memory search index for fast text matching.
   * Concatenates key searchable fields into a single string for efficient filtering.
   * @param strains The array of translated strains to index.
   */
  private buildSearchIndex(strains: Strain[]): void {
    this.searchIndex = strains.map(strain => {
      const searchText = [
        strain.name,
        strain.type,
        strain.genetics,
        ...(strain.aromas || []),
        ...(strain.dominantTerpenes || [])
      ].join(' ').toLowerCase();
      
      return { id: strain.id, searchText };
    });
  }

  /**
   * Initializes the service by processing, translating, caching data, and building the search index.
   * Must be called once before any other methods are used.
   * @param t The translation function from the app's context.
   * @param lang The current language code ('en' or 'de').
   */
  public async init(t: TFunction, lang: string): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const metadata = await dbService.getMetadata('strain_cache_metadata');
      const dbCount = await dbService.getStrainsCount();
      
      let strainsToCache: Strain[] = [];

      // If DB is populated and for the correct language, use it.
      if (metadata && metadata.lang === lang && dbCount > 0) {
        strainsToCache = await dbService.getAllStrains();
      } else {
        // Otherwise, process from source, and update DB.
        console.log(`[StrainService] Cache miss or language change. Populating IndexedDB for language: ${lang}.`);
        const translatedStrains = this.processAndTranslateStrains(t);
        await dbService.addStrains(translatedStrains);
        await dbService.setMetadata({ key: 'strain_cache_metadata', lang: lang });
        strainsToCache = translatedStrains;
      }

      strainsToCache.sort((a, b) => a.name.localeCompare(b.name));
      this.strainsCache = strainsToCache;
      this.buildSearchIndex(this.strainsCache);
      this.isInitialized = true;

    } catch (error) {
      console.error("Error initializing StrainService from IndexedDB, falling back to static data:", error);
      // Fallback to in-memory processing if IndexedDB fails
      const translatedStrains = this.processAndTranslateStrains(t);
      translatedStrains.sort((a, b) => a.name.localeCompare(b.name));
      this.strainsCache = translatedStrains;
      this.buildSearchIndex(this.strainsCache);
      this.isInitialized = true;
    }
  }

  /**
   * Retrieves all processed and translated strains from the cache.
   * @returns A promise resolving to an array of all strains.
   */
  public async getAllStrains(): Promise<Strain[]> {
    if (!this.isInitialized || !this.strainsCache) {
      throw new Error("StrainService not initialized. Call init() first.");
    }
    return [...this.strainsCache];
  }
  
  /**
   * Retrieves a single strain by its unique ID from the cache.
   * @param id The ID of the strain to find.
   * @returns A promise resolving to the Strain object or undefined if not found.
   */
  public async getStrainById(id: string): Promise<Strain | undefined> {
    if (!this.isInitialized || !this.strainsCache) return undefined;
    return this.strainsCache.find(s => s.id === id);
  }
  
  /**
   * Finds strains that are similar to a given base strain based on type, THC, and terpenes.
   * @param baseStrain The strain to find similarities for.
   * @param count The maximum number of similar strains to return.
   * @returns An array of similar Strain objects.
   */
  public getSimilarStrains(baseStrain: Strain, count: number = 4): Strain[] {
    if (!this.strainsCache) return [];

    return this.strainsCache
      .filter(s =>
        s.id !== baseStrain.id &&
        s.type === baseStrain.type &&
        Math.abs(s.thc - baseStrain.thc) <= 3 &&
        (s.dominantTerpenes && baseStrain.dominantTerpenes ? s.dominantTerpenes.some(t => baseStrain.dominantTerpenes!.includes(t)) : false)
      )
      .slice(0, count);
  }
}

// Export a singleton instance of the service to ensure a single state.
export const strainService = new StrainService();