import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../stores/store';

/**
 * @deprecated The `runDataMigrations` thunk is now obsolete. State hydration and migration
 * are handled centrally and asynchronously within the `createAppStore` function in `stores/store.ts`.
 * This new approach ensures the store is fully hydrated and migrated before the application renders,
 * providing a more robust and streamlined initialization process. This thunk is empty and should not be used.
 */
export const runDataMigrations = createAsyncThunk<void, void, { state: RootState }>(
    'data/runMigrations',
    async () => {
        console.warn('`runDataMigrations` thunk is deprecated. State hydration is now handled by `createAppStore`.');
        // This thunk is now empty as its logic has been moved to the store creation process.
    }
);
