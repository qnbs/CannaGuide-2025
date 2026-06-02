import type { VersionedSliceName } from '@/constants'
import type { RootState } from '@/stores/store'

/** Persisted Redux snapshot loaded from IndexedDB (may include legacy keys). */
export type PersistedState = Partial<RootState> & {
    version?: number
    _sliceVersions?: Partial<Record<VersionedSliceName, number>>
    /** Legacy UI state from pre-Zustand migration (may exist in old persisted data). */
    ui?: Record<string, unknown>
}

export type SnapshotDiff = {
    added: string[]
    removed: string[]
    changed: string[]
}

/** Untyped plant entity from legacy persisted simulation data. */
export type LegacyPlant = Record<string, unknown>
