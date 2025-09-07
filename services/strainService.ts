import { Strain } from '../types';

let cachedStrains: Strain[] | null = null;

const STRAIN_FILES = 'abcdefghijklmnopqrstuvwxyz'.split('').concat(['numeric']);

/**
 * Provides an efficient way to access the strain data.
 * This service fetches strain data from individual JSON files on demand,
 * preventing the large dataset from being bundled with the initial app download.
 * This significantly improves the initial load time.
 */
export const strainService = {
  async getAllStrains(): Promise<Strain[]> {
    if (cachedStrains) {
      return cachedStrains;
    }

    try {
      const fetchPromises = STRAIN_FILES.map(file => 
        fetch(`/data/strains/${file}.json`).then(res => {
          if (!res.ok) {
            // Silently fail for files that might not exist
            if (res.status === 404) return []; 
            throw new Error(`Failed to fetch ${file}.json`);
          }
          return res.json();
        })
      );

      const strainArrays = await Promise.all(fetchPromises);
      const allStrains: Strain[] = strainArrays.flat();
      
      const sortedStrains = [...allStrains].sort((a, b) => a.name.localeCompare(b.name));
      
      cachedStrains = sortedStrains;
      return cachedStrains;
    } catch (error) {
      console.error("Error fetching or processing strain data:", error);
      // Return empty array on failure to prevent app crash
      return [];
    }
  },
};
