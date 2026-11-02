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
const SLICES_SAFE_TO_RESET: ReadonlySet<VersionedSliceName> = new Set<VersionedSliceName>(['ui'])

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
    if (SLICES_SAFE_TO_RESET.has(name)) {
        console.debug(
            `[MigrationLogic] Slice "${name}" version mismatch (${versions}) - resetting to initial state.`,
        )
        delete (state as Record<string, unknown>)[name]
        report.reset.push(name)
        return
    }
    console.warn(
        `[MigrationLogic] Slice "${name}" version mismatch (${versions}) - keeping the stored data for the shape guards.`,
    )
    report.retained.push(name)
}

const validateSliceVersions = (state: PersistedState): SliceVersionReport => {
    const persistedVersions = state._sliceVersions ?? {}
    const report: SliceVersionReport = { reset: [], retained: [] }

    for (const [sliceName, expectedVersion] of Object.entries(SLICE_SCHEMA_VERSIONS)) {
        const name = sliceName as VersionedSliceName
        const stored = persistedVersions[name]
        if (isVersionMismatch(stored, expectedVersion)) {
            handleSliceMismatch(state, name, `stored: ${stored}, expected: ${expectedVersion}`, report)
        }
    }

    state._sliceVersions = { ...SLICE_SCHEMA_VERSIONS }

    return report
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
