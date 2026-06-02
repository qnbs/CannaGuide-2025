/**
 * Redux persist migration — public entry point.
 *
 * Implementation is split under `services/migration/`; imports from this
 * module preserve the existing `@/services/migrationLogic` path.
 */

export type { PersistedState, SnapshotDiff } from '@/services/migration/migrationTypes'

export { createSnapshotDiff } from '@/services/migration/snapshotDiff'
export { mergeStrainCatalogForUpdate } from '@/services/migration/versionMigrations'
export { migrateState } from '@/services/migration/migrateStateOrchestrator'
