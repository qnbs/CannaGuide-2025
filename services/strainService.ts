import { Strain } from '../types';

let cachedStrains: Strain[] | null = null;

const strainFiles = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'numeric', 'new_strains'];

export const strainService = {
  async getAllStrains(): Promise<Strain[]> {
    if (cachedStrains) {
      return cachedStrains;
    }

    try {
      const allStrainPromises = strainFiles.map(file => 
        fetch(`/data/strains/${file}.json`).then(res => {
          if (!res.ok) {
            console.warn(`Could not load strain file: ${file}.json. It may be empty or missing.`);
            return [];
          }
          return res.json();
        }).catch(err => {
            console.warn(`Failed to fetch or parse strain file ${file}.json:`, err);
            return []; // Return empty array on fetch/parse error to not break the whole app
        })
      );
      
      const strainArrays: Strain[][] = await Promise.all(allStrainPromises);
      const allStrainsData = strainArrays.flat();

      const sortedStrains = allStrainsData.sort((a, b) => a.name.localeCompare(b.name));
      
      cachedStrains = sortedStrains;
      return cachedStrains;
    } catch (error) {
      console.error("Error fetching or processing strain data:", error);
      throw error;
    }
  },
};