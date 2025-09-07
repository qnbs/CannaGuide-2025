import { Strain } from '../types';
// FIX: The import path was ambiguous and resolved to an empty, non-module file.
// Corrected path to explicitly point to the index file within the 'strains' directory.
import { allStrainsData } from '../data/strains/index';

/**
 * Provides access to the strain data.
 * The data is bundled with the application to ensure availability and reliability in any deployment environment,
 * resolving potential issues with static file fetching.
 */
export const strainService = {
  async getAllStrains(): Promise<Strain[]> {
    // The data is imported directly. We return it in a resolved promise
    // to maintain an async interface, which is consistent with a fetching strategy.
    return Promise.resolve(allStrainsData);
  },
};
