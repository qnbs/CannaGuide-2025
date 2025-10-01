

import { Strain } from '@/types';
import { dbService } from './dbService';
import { allStrainsData } from '@/data/strains';

const STRAIN_DATA_VERSION_KEY = 'strainDataVersion';
const CURRENT_STRAIN_DATA_VERSION = 2; // Increment this when strain data changes significantly

class StrainService {
    private allStrains: Strain[] = [];
    private isInitialized = false;

    async init(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            const storedVersion = await dbService.getMetadata(STRAIN_DATA_VERSION_KEY);
            const dbCount = await dbService.getStrainsCount();

            if (dbCount > 0 && storedVersion === CURRENT_STRAIN_DATA_VERSION) {
                console.log('[StrainService] Loading strains from IndexedDB.');
                this.allStrains = await dbService.getAllStrains();
            } else {
                console.log('[StrainService] Populating IndexedDB with fresh strain data.');
                await dbService.addStrains(allStrainsData);
                await dbService.setMetadata({ key: STRAIN_DATA_VERSION_KEY, value: CURRENT_STRAIN_DATA_VERSION });
                this.allStrains = allStrainsData;
            }
            this.isInitialized = true;
        } catch (error) {
            console.error('[StrainService] Failed to initialize. Falling back to in-memory data.', error);
            // Fallback to in-memory data if IndexedDB fails
            this.allStrains = allStrainsData;
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
            if (s1.agronomic.difficulty === s2.agronomic.difficulty) score += 5;
            if (s1.agronomic.yield === s2.agronomic.yield) score += 3;
            if (s1.agronomic.height === s2.agronomic.height) score += 2;

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
