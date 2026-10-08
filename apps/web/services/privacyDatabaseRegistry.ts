/**
 * Canonical IndexedDB names created by the app.
 *
 * `eraseAllData` must delete every name here. Adding a database without
 * adding it to this list is a privacy defect: the static scanner test fails.
 *
 * Export omits derived caches (RAG embeddings, downloaded vision-model bytes).
 * Those are erased, but they are not user-authored records. The CRDT database
 * is included in export because it holds plants, journal entries, and settings
 * that are not guaranteed to match the Redux snapshot.
 */

export const APPLICATION_DATABASE_NAMES = [
    'CannaGuideDB',
    'CannaGuideStateDB',
    'CannaGuideSecureDB',
    'CannaGuideTimeSeriesDB',
    'CannaGuideLocalAiCache',
    'CannaGuideImageGenCache',
    'CannaGuideReminderDB',
    'cannaguide-crdt-v1',
    'CannaGuideRagEmbeddingCache',
    'plantDiseaseModel',
] as const

export type ApplicationDatabaseName = (typeof APPLICATION_DATABASE_NAMES)[number]

export const EXPORT_DATABASE_NAMES = [
    'CannaGuideDB',
    'CannaGuideStateDB',
    'CannaGuideSecureDB',
    'CannaGuideTimeSeriesDB',
    'CannaGuideLocalAiCache',
    'CannaGuideImageGenCache',
    'CannaGuideReminderDB',
    'cannaguide-crdt-v1',
] as const satisfies readonly ApplicationDatabaseName[]

/** How long a blocked delete may stay pending before erase reports failure. */
export const DELETE_DATABASE_TIMEOUT_MS = 2000

const NAME_SET = new Set<string>(APPLICATION_DATABASE_NAMES)

export const isApplicationDatabaseName = (name: string): name is ApplicationDatabaseName =>
    NAME_SET.has(name)
