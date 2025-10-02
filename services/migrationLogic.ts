import { AppSettings } from '@/types';
import { defaultSettings } from '@/stores/slices/settingsSlice';
import { RootState } from '@/stores/store';

export const APP_VERSION = 2;

// This represents the shape of the persisted state object.
export type PersistedState = Partial<RootState> & { version?: number };


/**
 * Merges persisted settings with default settings to ensure new properties are added.
 * This is a recursive deep merge.
 */
const deepMergeSettings = (persisted: Partial<AppSettings>): AppSettings => {
    const isObject = (item: unknown): item is Record<string, unknown> => {
        return !!item && typeof item === 'object' && !Array.isArray(item);
    };

    const output = JSON.parse(JSON.stringify(defaultSettings)); // Deep clone defaults

    function merge(target: Record<string, any>, source: Record<string, any>) {
        for (const key of Object.keys(source)) {
            const sourceValue = source[key];
            if (isObject(sourceValue)) {
                if (!target[key] || !isObject(target[key])) {
                    target[key] = {};
                }
                merge(target[key], sourceValue);
            } else if (sourceValue !== undefined) {
                target[key] = sourceValue;
            }
        }
    }
    if (isObject(persisted)) {
        merge(output, persisted);
    }
    return output;
};


/**
 * Migration from V1 to V2.
 * - Merges new default settings into persisted settings to prevent crashes on new features.
 * - Adds a new setting property `showArchivedInPlantsView`.
 * - Adds `lastUpdated` property to plant objects if missing.
 */
const migrateV1ToV2 = (state: PersistedState): PersistedState => {
    console.log('[MigrationLogic] Migrating state from v1 to v2...');
    
    // Note: 'state' is a plain JS object here, it's safe to mutate before it's loaded into Redux.
    const migratedState: PersistedState = state;
    
    if (migratedState.settings?.settings) {
        migratedState.settings.settings = deepMergeSettings(migratedState.settings.settings);
    } else {
        migratedState.settings = { settings: defaultSettings, version: 1 };
    }

    if (typeof migratedState.settings.settings.showArchivedInPlantsView === 'undefined') {
         migratedState.settings.settings.showArchivedInPlantsView = true;
    }
    
    // FIX: Add migration for plant objects to ensure `lastUpdated` exists.
    if (migratedState.simulation?.plants?.entities) {
        for (const id in migratedState.simulation.plants.entities) {
            const plant = migratedState.simulation.plants.entities[id];
            if (plant && !plant.lastUpdated) {
                // Use createdAt as a sensible default for the first lastUpdated value
                plant.lastUpdated = plant.createdAt || Date.now();
            }
        }
    }

    return migratedState;
};

/**
 * Orchestrates the migration of a persisted state object to the current app version.
 * @param persistedState The raw state object loaded from storage.
 * @returns The migrated state object, ready to be hydrated into the store.
 */
export const migrateState = (persistedState: any): PersistedState => {
    const stateVersion = persistedState.version || 1;

    if (stateVersion >= APP_VERSION) {
        console.log('[MigrationLogic] Persisted state is up to date.');
        // Even if up to date, merge settings to catch any new properties added in minor versions
        if (persistedState.settings?.settings) {
            persistedState.settings.settings = deepMergeSettings(persistedState.settings.settings);
        }
        return persistedState;
    }
    
    let migratedState: PersistedState = persistedState;
    console.log(`[MigrationLogic] Migrating from version ${stateVersion} to ${APP_VERSION}...`);

    if (stateVersion < 2) {
        migratedState = migrateV1ToV2(migratedState);
    }
    // Future migrations would be chained here, e.g.:
    // if (stateVersion < 3) { migratedState = migrateV2ToV3(migratedState); }

    migratedState.version = APP_VERSION;
    
    // Also update the version inside the settings slice for consistency
    if (migratedState.settings) {
        migratedState.settings.version = APP_VERSION;
    }
    
    return migratedState;
};