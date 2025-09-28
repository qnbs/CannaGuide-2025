import { allStrainsData } from '@/data/strains';
import { Strain } from '@/types';
import { dbService } from './dbService';

const METADATA_KEY = 'strain_data_meta';
const CURRENT_VERSION = '1.0.0';

class StrainService {
    private allStrains: Strain[] = [];

    async init(): Promise<void> {
        const metadata = await dbService.getMetadata(METADATA_KEY);
        const count = await dbService.getStrainsCount();
        
        if (!metadata || metadata.version !== CURRENT_VERSION || count !== allStrainsData.length) {
            console.log('Strain data is outdated or missing. Initializing...');
            await dbService.addStrains(allStrainsData);
            await this.buildSearchIndex(allStrainsData);
            await dbService.setMetadata({ key: METADATA_KEY, version: CURRENT_VERSION, timestamp: Date.now() });
            console.log('Strain data initialized.');
        } else {
            console.log('Strain data is up to date.');
        }

        this.allStrains = await this.getAllStrains();
    }
    
    async getAllStrains(): Promise<Strain[]> {
        if (this.allStrains.length > 0) return this.allStrains;
        this.allStrains = await dbService.getAllStrains();
        return this.allStrains;
    }

    async getSimilarStrains(currentStrain: Strain, count: number): Promise<Strain[]> {
        const strains = await this.getAllStrains();
        if (strains.length === 0) return [];
        
        return strains
            .filter(s => s.id !== currentStrain.id)
            .map(s => ({ strain: s, score: this.calculateSimilarity(currentStrain, s) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, count)
            .map(s => s.strain);
    }
    
    private calculateSimilarity(s1: Strain, s2: Strain): number {
        let score = 0;
        if (s1.type === s2.type) score += 3;
        const sharedAromas = (s1.aromas || []).filter(a => (s2.aromas || []).includes(a));
        score += sharedAromas.length * 2;
        const sharedTerpenes = (s1.dominantTerpenes || []).filter(t => (s2.dominantTerpenes || []).includes(t));
        score += sharedTerpenes.length;
        if (Math.abs(s1.thc - s2.thc) < 2) score += 1;
        return score;
    }
    
    private async buildSearchIndex(strains: Strain[]): Promise<void> {
        const index: Record<string, Set<string>> = {};

        const tokenize = (text: string | undefined): string[] => {
            if (!text) return [];
            return text
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 2);
        };
        
        strains.forEach(strain => {
            const tokens = new Set([
                ...tokenize(strain.name),
                ...tokenize(strain.type),
                ...tokenize(strain.genetics),
                ...(strain.aromas || []).map(a => a.toLowerCase()),
                ...(strain.dominantTerpenes || []).map(t => t.toLowerCase()),
            ]);

            tokens.forEach(token => {
                if (!index[token]) index[token] = new Set();
                index[token].add(strain.id);
            });
        });

        const serializedIndex = Object.fromEntries(
            Object.entries(index).map(([key, value]) => [key, Array.from(value)])
        );
        
        await dbService.updateSearchIndex(serializedIndex);
        console.log("Search index built.");
    }
}

export const strainService = new StrainService();
