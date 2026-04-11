import { PlantStage, AdvancedFilterState } from '@/types'

// --- APP ---
export const APP_VERSION = 6
export const CURRENT_STRAIN_DATA_VERSION = 7

/**
 * Per-slice schema versions. Bump a slice version whenever its persisted shape
 * changes so the migration system can detect stale data and auto-reset that
 * specific slice without nuking the entire store.
 */
// --- MULTI-GROW ---
/** Legal limit: max 3 concurrent grows (CanG -- German Cannabis Act) */
export const MAX_GROWS = 3
/**
 * Legal limit: max 3 simultaneous living plants across ALL grows.
 * KCanG Section 9 (1) Nr. 1 -- NEVER increase without legal review.
 */
export const MAX_PLANTS_CANG = 3
export const DEFAULT_GROW_ID = 'default-grow'
export const DEFAULT_GROW_NAME = 'Mein Grow'

export const GROW_COLORS = [
    '#22c55e', // green
    '#a855f7', // purple
    '#3b82f6', // blue
    '#f97316', // orange
    '#ef4444', // red
    '#14b8a6', // teal
] as const

export const SLICE_SCHEMA_VERSIONS = {
    settings: 2,
    simulation: 3,
    grows: 1,
    genealogy: 3, // kept in sync with GENEALOGY_STATE_VERSION
    sandbox: 1,
    userStrains: 1,
    favorites: 1,
    notes: 1,
    archives: 1,
    savedItems: 1,
    knowledge: 1,
    breeding: 1,
    ui: 1,
} as const

export type VersionedSliceName = keyof typeof SLICE_SCHEMA_VERSIONS
export const APP_METADATA = {
    name: 'CannaGuide 2025 - Cannabis Grow Guide with Gemini',
    description:
        'Your AI-powered digital companion for the entire cannabis cultivation cycle. Track plants, explore 776+ strains, get AI equipment advice, and master your grow with an interactive guide.',
    prompt: '',
    requestFramePermissions: ['camera', 'microphone'],
}

// --- STORAGE KEYS ---
export const STORAGE_PREFIX = 'cannaguide-2025-'
export const PWA_INSTALLED_KEY = 'cannaGuidePwaInstalled'
export const REDUX_STATE_KEY = 'cannaguide-redux-storage'
export const STRAIN_DATA_VERSION_KEY = 'strainDataVersion'
export const GEMINI_API_KEY_STORAGE_KEY = 'geminiApiKey'

// --- DATABASE ---
export const DB_NAME = 'CannaGuideDB'
export const DB_VERSION = 5

// DB Store Names
export const STRAINS_STORE = 'strains'
export const IMAGES_STORE = 'images'
export const METADATA_STORE = 'metadata'
export const STRAIN_SEARCH_INDEX_STORE = 'strain_search_index'
export const OFFLINE_ACTIONS_STORE = 'offline_actions'
export const CALCULATOR_HISTORY_STORE = 'calculator_history'

// DB Index Names for STRAINS_STORE
export const STRAIN_INDEX_TYPE = 'by_type'
export const STRAIN_INDEX_THC = 'by_thc'
export const STRAIN_INDEX_CBD = 'by_cbd'
export const STRAIN_INDEX_FLOWERING = 'by_floweringTime'

// --- UI ---
export const ITEMS_PER_PAGE = 25
export const MOBILE_BOTTOM_NAV_SAFE_OFFSET = 112

// --- GENEALOGY ---
/** Bump whenever GenealogyState shape changes. Shared by slice + migrationLogic. */
export const GENEALOGY_STATE_VERSION = 3
export const GENEALOGY_NODE_SIZE = { width: 220, height: 100 }
export const GENEALOGY_NODE_SEPARATION = { x: 40, y: 20 }

// --- IMAGES ---
export const IMAGE_MAX_WIDTH = 1280
export const IMAGE_MAX_HEIGHT = 1280
export const IMAGE_JPEG_QUALITY = 0.8

// --- VOICE (v1.8 CannaVoice Pro) ---
/** Safe built-in Porcupine wake-word keywords (no brand names). */
export const PORCUPINE_BUILTIN_KEYWORDS = [
    'ALEXA',
    'AMERICANO',
    'BLUEBERRY',
    'BUMBLEBEE',
    'COMPUTER',
    'GRAPEFRUIT',
    'GRASSHOPPER',
    'JARVIS',
    'PICOVOICE',
    'PORCUPINE',
    'TERMINATOR',
] as const

/** Max voice analytics events in ring buffer. */
export const VOICE_ANALYTICS_MAX_EVENTS = 500
/** Auto-prune voice analytics events older than N days. */
export const VOICE_ANALYTICS_RETENTION_DAYS = 30
/** Max characters per Cloud TTS request. */
export const CLOUD_TTS_MAX_CHARS = 5000
/** Cloud TTS fetch timeout (ms). */
export const CLOUD_TTS_TIMEOUT_MS = 10000
/** Cloud TTS rate limit (requests per minute). */
export const CLOUD_TTS_RATE_LIMIT = 5
/** speakNatural pause insertion hints (ms). */
export const SPEAK_NATURAL_PAUSE_MS = {
    sentence: 400,
    comma: 200,
    list: 150,
} as const

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
}

// --- SIMULATION ---
export const SIM_PAR_PER_WATT_LED = 2.5 // µmol/s/W (Photosynthetically Active Radiation)
export const SIM_LIGHT_EXTINCTION_COEFFICIENT_K = 0.7 // For Beer-Lambert law
export const SIM_BIOMASS_CONVERSION_EFFICIENCY = 0.5 // g biomass per g nutrients (abstract)
export const SIM_SECONDS_PER_DAY = 86400

export const STAGES_ORDER: PlantStage[] = [
    PlantStage.Seed,
    PlantStage.Germination,
    PlantStage.Seedling,
    PlantStage.Vegetative,
    PlantStage.Flowering,
    PlantStage.Harvest,
    PlantStage.Drying,
    PlantStage.Curing,
    PlantStage.Finished,
]
