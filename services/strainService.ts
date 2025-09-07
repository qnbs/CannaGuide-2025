import { Strain } from '../types';
// FIX: Corrected import path to point to the index file within the strains directory. The original path was resolving to an empty `data/strains.ts` file.
import { allStrainsData } from '../data/strains/index';

let cachedStrains: Strain[] | null = null;

export const strainService = {
  async getAllStrains(): Promise<Strain[]> {
    if (cachedStrains) {
      return cachedStrains;
    }

    try {
      // Data is now bundled, no need to fetch.
      // Sort once after fetching all data for consistency.
      const sortedStrains = [...allStrainsData].sort((a, b) => a.name.localeCompare(b.name));
      
      cachedStrains = sortedStrains;
      return cachedStrains;
    } catch (error) {
      console.error("Error processing strain data:", error);
      throw error; // Re-throw to be caught by the component
    }
  },
};