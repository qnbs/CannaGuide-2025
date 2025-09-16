import { Strain } from '../types';

let cachedStrains: Strain[] | null = null;
const strainDataFiles = 'abcdefghijklmnopqrstuvwxyz'.split('').concat(['numeric']);

/**
 * Provides access to the strain data.
 * The data is fetched from static JSON files to ensure availability and reliability,
 * and to drastically improve initial load performance by avoiding a large JS bundle.
 */
export const strainService = {
  async getAllStrains(): Promise<Strain[]> {
    if (cachedStrains) {
      return Promise.resolve(cachedStrains);
    }
    
    // The files are in public/data/strains/, so the fetch path is /data/strains/
    const fetchPromises = strainDataFiles.map(char =>
      fetch(`/data/strains/${char}.json`).then(res => {
        if (!res.ok) {
          if (res.status === 404) return [];
          console.error(`Failed to fetch strains for letter: ${char}`);
          return [];
        }
        return res.json();
      }).catch(err => {
        console.error(`Network error fetching strains for letter: ${char}`, err);
        return [];
      })
    );

    try {
        const allStrainArrays = await Promise.all(fetchPromises);
        const flattenedStrains: Strain[] = allStrainArrays.flat();
        
        if (flattenedStrains.length > 0) {
          cachedStrains = flattenedStrains;
        }
        
        return flattenedStrains;
    } catch (error) {
        console.error("Error fetching or processing strain data:", error);
        return []; // Return empty array on failure
    }
  },
};