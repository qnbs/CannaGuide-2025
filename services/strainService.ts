

import { Strain } from '@/types';
import { allStrainsData } from '@/data/strains/index';
import { dbService } from '@/services/dbService';

type TFunction = (key: string, replacements?: Record<string, string | number>) => any;

class StrainService {
  private strainsCache: Strain[] | null = null;
  private initializationPromise: Promise<void>;
  private resolveInitialization: (() => void) | null = null;
  private isInitializing: boolean = false;
  private currentLang: string | null = null;

  constructor() {
    this.initializationPromise = new Promise(resolve => {
      this.resolveInitialization = resolve;
    });
  }

  private processAndTranslateStrains(t: TFunction): Strain[] {
    const getTranslatedString = (key: string, fallback: string | undefined): string | undefined => {
        const result = t(key);
        return (typeof result === 'string' && result !== key) ? result : fallback;
    };
    
    const getTranslatedObject = (key: string, fallback: object): object => {
         const result = t(key);
         return (typeof result === 'object' && result !== null) ? result : fallback;
    }

    return allStrainsData.map(strain => {
        // Translate terpenes and aromas centrally
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

        if (metadata && metadata.lang === lang && dbCount > 0) {
            strainsToCache = await dbService.getAllStrains();
        } else {
            console.log(`[StrainService] Cache miss or language change. Populating IndexedDB for language: ${lang}.`);
            const translatedStrains = this.processAndTranslateStrains(t);
            await dbService.addStrains(translatedStrains);
            await dbService.setMetadata({ key: 'strain_cache_metadata', lang: lang });
            strainsToCache = translatedStrains;
        }

        strainsToCache.sort((a, b) => a.name.localeCompare(b.name));
        this.strainsCache = strainsToCache;
    } catch (error) {
        console.error("Error initializing StrainService from IndexedDB, falling back to static data:", error);
        const translatedStrains = this.processAndTranslateStrains(t);
        translatedStrains.sort((a, b) => a.name.localeCompare(b.name));
        this.strainsCache = translatedStrains;
    }
  }

  public init(t: TFunction, lang: string): void {
    if (this.currentLang === lang) return;

    if (this.isInitializing) {
        this.initializationPromise.then(() => this.init(t, lang));
        return;
    }

    this.isInitializing = true;
    this.currentLang = lang;

    this.initializationPromise = new Promise(resolve => {
        this.resolveInitialization = resolve;
    });

    this._initialize(t, lang).then(() => {
        if (this.resolveInitialization) {
            this.resolveInitialization();
            this.resolveInitialization = null;
        }
        this.isInitializing = false;
    });
  }

  public async getAllStrains(): Promise<Strain[]> {
    await this.initializationPromise;
    return [...(this.strainsCache || [])];
  }

  public async getStrainById(id: string): Promise<Strain | undefined> {
    await this.initializationPromise;
    return this.strainsCache?.find(s => s.id === id);
  }

  public async getSimilarStrains(baseStrain: Strain, count: number = 4): Promise<Strain[]> {
    await this.initializationPromise;
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