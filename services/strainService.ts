import { Strain } from '../types';
import { allStrainsData } from '../data/strains/index';

/**
 * Provides access to the strain data.
 * The data is imported directly from the source files to ensure it's always available
 * and to avoid network issues in different deployment environments.
 */
export const strainService = {
  async getAllStrains(): Promise<Strain[]> {
    // The data is now part of the JS bundle. We can just return it.
    // We keep it async to avoid changing the function signature in components.
    return Promise.resolve(allStrainsData);
  },
};
