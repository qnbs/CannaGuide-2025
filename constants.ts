import { PlantStage, AdvancedFilterState } from '@/types';

// --- APP ---
export const APP_VERSION = 2;
export const CURRENT_STRAIN_DATA_VERSION = 2;
export const APP_METADATA = {
  "name": "CannaGuide 2025 - Cannabis Grow Guide with Gemini",
  "description": "Your AI-powered digital companion for the entire cannabis cultivation cycle. Track plants, explore 700+ strains, get AI equipment advice, and master your grow with an interactive guide.",
  "prompt": "",
  "requestFramePermissions": [
    "camera",
    "microphone"
  ]
};

// --- STORAGE KEYS ---
export const STORAGE_PREFIX = 'cannaguide-2025-';
export const PWA_INSTALLED_KEY = 'cannaGuidePwaInstalled';
export const REDUX_STATE_KEY = 'cannaguide-redux-storage';
export const STRAIN_DATA_VERSION_KEY = 'strainDataVersion';

// --- DATABASE ---
export const DB_NAME = 'CannaGuideDB';
export const DB_VERSION = 3;

// DB Store Names
export const STRAINS_STORE = 'strains';
export const IMAGES_STORE = 'images';
export const METADATA_STORE = 'metadata';
export const STRAIN_SEARCH_INDEX_STORE = 'strain_search_index';

// DB Index Names for STRAINS_STORE
export const STRAIN_INDEX_TYPE = 'by_type';
export const STRAIN_INDEX_THC = 'by_thc';
export const STRAIN_INDEX_CBD = 'by_cbd';
export const STRAIN_INDEX_FLOWERING = 'by_floweringTime';


// --- UI ---
export const ITEMS_PER_PAGE = 25;


// --- FILTERS ---
export const INITIAL_ADVANCED_FILTERS: AdvancedFilterState = {
    thcRange: [0, 35],
    cbdRange: [0, 20],
    floweringRange: [4, 20],
    selectedDifficulties: [],
    selectedYields: [],
    selectedHeights: [],
    selectedAromas: [],
    selectedTerpenes: [],
};


// --- SIMULATION ---
export const SIM_PAR_PER_WATT_LED = 2.5; // µmol/s/W (Photosynthetically Active Radiation)
export const SIM_LIGHT_EXTINCTION_COEFFICIENT_K = 0.7; // For Beer-Lambert law
export const SIM_BIOMASS_CONVERSION_EFFICIENCY = 0.5; // g biomass per g nutrients (abstract)
export const SIM_SECONDS_PER_DAY = 86400;

export const STAGES_ORDER: PlantStage[] = [
    PlantStage.Seed,
    PlantStage.Germination,
    PlantStage.Seedling,
    PlantStage.Vegetative,
    PlantStage.Flowering,
    PlantStage.Harvest,
    PlantStage.Drying,
    PlantStage.Curing,
    PlantStage.Finished
];