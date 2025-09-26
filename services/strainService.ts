import { Strain } from '@/types';
import { dbService } from '@/services/dbService';

type TFunction = (key: string, replacements?: Record<string, string | number>) => any;

const DATA_VERSION = '1.4.0'; // Version bump to trigger re-caching with new method

const STRAIN_FILE_KEYS = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'numeric'
];


const stopWords = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with', 'i', 'you']);

const tokenize = (text: string): string[] => {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));
};

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
  private strainsCache: Strain[] | null = null;
  private initializationPromise: Promise<void> | null = null;
  private currentLang: string | null = null;

  private processAndTranslateStrains(strains: Strain[], t: TFunction): Strain[] {
    const getTranslatedString = (key: string, fallback: string | undefined): string | undefined => {
        const result = t(key);
        return (typeof result === 'string' && result !== key) ? result : fallback;
    };
    
    const getTranslatedObject = (key: string, fallback: object | undefined): object | undefined => {
         const result = t(key);
         return (typeof result === 'object' && result !== null) ? result : fallback;
    }

    return strains.map(strain => {
        const translatedTerpenes = (strain.dominantTerpenes || []).map(terp => {
            const translationKey = `common.terpenes.${terp.replace(/\s/g, '')}`;
            const translated = t(translationKey);
            return translated === translationKey ? terp : translated;
        });
        const translatedAromas = (strain.aromas || []).map(aroma => {
            const translationKey = `common.aromas.${aroma.replace(/\s/g, '')}`;
            const translated = t(translationKey);
            return translated === translationKey ? aroma : translated;
        });

        return {
          ...strain,
          description: getTranslatedString(`strainsData.${strain.id}.description`, strain.description),
          typeDetails: getTranslatedString(`strainsData.${strain.id}.typeDetails`, strain.typeDetails),
          genetics: getTranslatedString(`strainsData.${strain.id}.genetics`, strain.genetics),
          aromas: translatedAromas,
          dominantTerpenes: translatedTerpenes,
          agronomic: {
            ...strain.agronomic,
            yieldDetails: getTranslatedObject(`strainsData.${strain.id}.yieldDetails`, strain.agronomic.yieldDetails || { indoor: 'N/A', outdoor: 'N/A' }) as { indoor: string, outdoor: string },
            heightDetails: getTranslatedObject(`strainsData.${strain.id}.heightDetails`, strain.agronomic.heightDetails || { indoor: 'N/A', outdoor: 'N/A' }) as { indoor: string, outdoor: string },
          },
        };
    });
  }

  private async _initialize(t: TFunction, lang: string): Promise<void> {
    try {
        const metadata = await dbService.getMetadata('strain_cache_metadata');
        const dbCount = await dbService.getStrainsCount();
        
        let strainsToCache: Strain[] = [];

        if (!metadata || metadata.lang !== lang || metadata.version !== DATA_VERSION || dbCount === 0) {
            console.log(`[StrainService] Cache miss or version mismatch. Fetching and caching data for lang: ${lang}, version: ${DATA_VERSION}.`);
            
            const fetchPromises = STRAIN_FILE_KEYS.map(key => 
                fetch(`data/strains/${key}.json`)
                    .then(res => {
                        if (!res.ok) {
                            throw new Error(`Failed to fetch data/strains/${key}.json: ${res.statusText}`);
                        }
                        return res.json();
                    })
            );
            
            const results = await Promise.all(fetchPromises);
            const allStrainsData: Strain[] = results.flat();

            const translatedStrains = this.processAndTranslateStrains(allStrainsData, t);
            const searchIndex = buildSearchIndex(translatedStrains);
            
            await dbService.addStrains(translatedStrains);
            await dbService.updateSearchIndex(searchIndex);
            await dbService.setMetadata({ key: 'strain_cache_metadata', lang: lang, version: DATA_VERSION, count: translatedStrains.length });
            
            strainsToCache = translatedStrains;
        } else {
             strainsToCache = await dbService.getAllStrains();
        }

        strainsToCache.sort((a, b) => a.name.localeCompare(b.name));
        this.strainsCache = strainsToCache;
    } catch (error) {
        console.error("Error initializing StrainService from network/IndexedDB, using fallback:", error);
        this.strainsCache = [];
    }
  }

  public init(t: TFunction, lang: string): Promise<void> {
    if (this.initializationPromise && this.currentLang === lang) {
      return this.initializationPromise;
    }
    
    this.currentLang = lang;
    this.initializationPromise = this._initialize(t, lang);
    return this.initializationPromise;
  }

  public async getAllStrains(): Promise<Strain[]> {
    if (!this.initializationPromise) {
        throw new Error("StrainService not initialized. Call init() first.");
    }
    await this.initializationPromise;
    return [...(this.strainsCache || [])];
  }

  public async getStrainById(id: string): Promise<Strain | undefined> {
    await this.getAllStrains();
    return this.strainsCache?.find(s => s.id === id);
  }

  public async getSimilarStrains(baseStrain: Strain, count: number = 4): Promise<Strain[]> {
    await this.getAllStrains();
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

export const strainService = new StrainService();