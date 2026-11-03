import { APP_VERSION, SLICE_SCHEMA_VERSIONS, type VersionedSliceName } from '@/constants'
import type { PersistedState } from '@/services/migration/migrationTypes'
import { createSnapshotDiff } from '@/services/migration/snapshotDiff'
import { ensureSimulationShape } from '@/services/migration/simulationShapeGuard'
import { ensureGenealogyShape } from '@/services/migration/genealogyShapeGuard'
import {
    ensureUserStrainsShape,
    ensureSavedItemsShape,
    normalizeSavedStrainTipImages,
    ensureFavoritesShape,
    ensureArchivesShape,
    ensureNotesShape,
    ensureKnowledgeShape,
    ensureBreedingShape,
    ensureSandboxShape,
    ensureGrowsShape,
    ensureProblemTrackerShape,
    ensureDiagnosisHistoryShape,
    ensureStrainsViewShape,
    ensureNutrientPlannerShape,
    ensureHydroShape,
    ensureMetricsShape,
    ensureGrowPlannerShape,
} from '@/services/migration/sliceShapeGuards'
import { applyVersionMigrations } from '@/services/migration/versionMigrations'

/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

const stripTransientState = (state: PersistedState): void => {
    if (state.sandbox) {
        const sb = state.sandbox as unknown as Record<string, unknown>
        if (sb.status === 'running') {
            sb.status = 'idle'
            sb.currentExperiment = null
        }
    }

    if (state.genealogy) {
        const g = state.genealogy as unknown as Record<string, unknown>
        if (g.status === 'loading') {
            g.status = 'idle'
        }
    }

    if (state.ui) {
        const ui = state.ui as unknown as Record<string, unknown>
        ui.isAppReady = false
        ui.notifications = []
        ui.isCommandPaletteOpen = false
        ui.isAddModalOpen = false
        ui.isExportModalOpen = false
        ui.strainToEdit = null
        ui.actionModal = { isOpen: false, plantId: null, type: null }
        ui.deepDiveModal = { isOpen: false, plantId: null, topic: null }
        ui.isDiagnosticsModalOpen = false
        ui.diagnosticsPlantId = null
        ui.isSaveSetupModalOpen = false
        ui.setupToSave = null
        ui.highlightedElement = null
        if (ui.newGrowFlow && typeof ui.newGrowFlow === 'object') {
            const flow = ui.newGrowFlow as Record<string, unknown>
            flow.status = 'idle'
            flow.slotIndex = null
            flow.strain = null
            flow.setup = null
        }
    }
}

/**
 * Slices that hold no user data, so a schema-version mismatch may drop them and
 * let the initial state take over. Every other slice carries user data and is
 * kept: the shape guards that run after this step repair what they can, and a
 * snapshot they cannot repair fails hydration loudly (so the backup path runs)
 * instead of being silently emptied and then saved over the original.
 */
const TRANSIENT_SLICE: VersionedSliceName = 'ui'

interface SliceVersionReport {
    /** Dropped on mismatch (transient slices only). */
    reset: VersionedSliceName[]
    /** Version differed, data kept for the shape guards to repair. */
    retained: VersionedSliceName[]
}

const isVersionMismatch = (stored: number | undefined, expected: number): boolean =>
    stored !== undefined && stored !== expected

/** Resets a transient slice or keeps a user-data slice, and records which. */
const handleSliceMismatch = (
    state: PersistedState,
    name: VersionedSliceName,
    versions: string,
    report: SliceVersionReport,
): void => {
    if (name === TRANSIENT_SLICE) {
        console.debug(
            `[MigrationLogic] Slice "${name}" version mismatch (${versions}) - resetting to initial state.`,
        )
        delete state.ui
        report.reset.push(name)
        return
    }
    console.warn(
        `[MigrationLogic] Slice "${name}" version mismatch (${versions}) - keeping the stored data for the shape guards.`,
    )
    report.retained.push(name)
}

const checkSliceVersion = (
    state: PersistedState,
    name: VersionedSliceName,
    expected: number,
    report: SliceVersionReport,
): void => {
    const stored = state._sliceVersions?.[name]
    if (isVersionMismatch(stored, expected)) {
        handleSliceMismatch(state, name, `stored: ${stored}, expected: ${expected}`, report)
    }
}

const validateSliceVersions = (state: PersistedState): SliceVersionReport => {
    const report: SliceVersionReport = { reset: [], retained: [] }

    for (const [sliceName, expectedVersion] of Object.entries(SLICE_SCHEMA_VERSIONS)) {
        checkSliceVersion(state, sliceName as VersionedSliceName, expectedVersion, report)
    }

    state._sliceVersions = { ...SLICE_SCHEMA_VERSIONS }

    return report
}

/** True when the value holds anything beyond empty containers, '', 0, false and null. */
const hasContent = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(hasContent)
    if (typeof value === 'object' && value !== null) return Object.values(value).some(hasContent)
    return typeof value === 'string' ? value.trim() !== '' : Boolean(value)
}

/**
 * The shape guards replace anything that is not the shape they expect with an
 * empty one. For a slice kept across a version mismatch that would be the same
 * silent loss as the old delete, with the validator satisfied, so a slice that
 * held data and holds none afterwards fails hydration instead. createAppStore
 * catches the error, tries the backup and quarantines the original bytes.
 */
const assertRetainedSlicesKeptData = (
    before: PersistedState,
    after: PersistedState,
    retained: readonly VersionedSliceName[],
): void => {
    for (const name of retained) {
        const original = (before as Record<string, unknown>)[name]
        if (hasContent(original) && !hasContent((after as Record<string, unknown>)[name])) {
            throw new TypeError(
                `Persisted ${name} held data under another schema version that no shape guard could keep; refusing to replace it with an empty slice.`,
            )
        }
    }
}

/**
 * Orchestrates the migration of a persisted state object to the current app version.
 */
export const migrateState = (persistedState: PersistedState): PersistedState => {
    const stateVersion = persistedState.version || 1
    const snapshotBeforeMigration = JSON.parse(JSON.stringify(persistedState)) as PersistedState

    let migratedState = applyVersionMigrations(persistedState, stateVersion)

    migratedState.version = APP_VERSION
    if (migratedState.settings) {
        migratedState.settings.version = APP_VERSION
    }

    const sliceVersionReport = validateSliceVersions(migratedState)
    if (sliceVersionReport.reset.length > 0) {
        console.debug(`[MigrationLogic] Auto-reset slices: ${sliceVersionReport.reset.join(', ')}`)
    }

    const shapeValidators = [
        ensureSimulationShape,
        ensureGenealogyShape,
        ensureUserStrainsShape,
        ensureSavedItemsShape,
        normalizeSavedStrainTipImages,
        ensureFavoritesShape,
        ensureArchivesShape,
        ensureNotesShape,
        ensureKnowledgeShape,
        ensureBreedingShape,
        ensureSandboxShape,
        ensureGrowsShape,
        ensureProblemTrackerShape,
        ensureDiagnosisHistoryShape,
        ensureNutrientPlannerShape,
        ensureHydroShape,
        ensureMetricsShape,
        ensureGrowPlannerShape,
        ensureStrainsViewShape,
    ] as const
    for (const validate of shapeValidators) {
        validate(migratedState)
    }
    assertRetainedSlicesKeptData(
        snapshotBeforeMigration,
        migratedState,
        sliceVersionReport.retained,
    )

    stripTransientState(migratedState)

    const snapshotDiff = createSnapshotDiff(snapshotBeforeMigration, migratedState)
    if (
        snapshotDiff.added.length > 0 ||
        snapshotDiff.removed.length > 0 ||
        snapshotDiff.changed.length > 0
    ) {
        console.debug('[MigrationLogic] Snapshot diff summary:', snapshotDiff)
    }

    return migratedState
}
