import { Strain } from '../types';

let cachedStrains: Strain[] | null = null;

// All letters + numeric for strain files
const STRAIN_FILES = [...'abcdefghijklmnopqrstuvwxyz'.split(''), 'numeric'];

export const strainService = {
  async getAllStrains(): Promise<Strain[]> {
    if (cachedStrains) {
      return cachedStrains;
    }

    try {
      const allStrainPromises = STRAIN_FILES.map(file =>
        fetch(`/data/strains/${file}.json`).then(res => {
          if (!res.ok) {
            // It's okay if some files don't exist (e.g., no strains for 'x')
            if (res.status === 404) return []; 
            throw new Error(`Failed to load ${file}.json`);
          }
          return res.json();
        })
      );
      
      const allStrainsArrays = await Promise.all(allStrainPromises);
      const flattenedStrains = allStrainsArrays.flat() as Strain[];
      
      // Sort once after fetching all data
      flattenedStrains.sort((a, b) => a.name.localeCompare(b.name));

      cachedStrains = flattenedStrains;
      return flattenedStrains;
    } catch (error) {
      console.error("Error fetching strain data:", error);
      throw error; // Re-throw to be caught by the component
    }
  },
};
