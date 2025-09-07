import { Strain } from '../types';
// FIX: Corrected the import path to point to the index file inside the 'strains' directory, as '../data/strains' was resolving to an empty 'strains.ts' file.
import { allStrainsData } from '../data/strains/index';

let cachedStrains: Strain[] | null = null;

/**
 * Provides an efficient way to access the strain data.
 * Previously, this service fetched many individual JSON files, which could fail on
 * some browsers or slow networks. Now, it uses the pre-bundled data from the
 * TypeScript modules, eliminating runtime network requests for strains.
 */
export const strainService = {
  async getAllStrains(): Promise<Strain[]> {
    if (cachedStrains) {
      return cachedStrains;
    }

    try {
      // Data is imported from the JS bundle, no fetching needed.
      // We sort it here once to ensure consistent order.
      const sortedStrains = [...allStrainsData].sort((a, b) => a.name.localeCompare(b.name));
      
      cachedStrains = sortedStrains;
      return cachedStrains;
    } catch (error) {
      console.error("Error processing bundled strain data:", error);
      throw error;
    }
  },
};
