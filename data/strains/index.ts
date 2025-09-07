import { Strain } from '../../types';

// This file is modified to prevent bundling all strain data.
// The data is now fetched asynchronously from JSON files by the StrainService.
// User-added strains are loaded from localStorage in StrainsView.
export const allStrainsData: Strain[] = [];
