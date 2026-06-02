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

const validateSliceVersions = (state: PersistedState): VersionedSliceName[] => {
    const persistedVersions = state._sliceVersions ?? {}
    const resetSlices: VersionedSliceName[] = []

    for (const [sliceName, expectedVersion] of Object.entries(SLICE_SCHEMA_VERSIONS)) {
        const name = sliceName as VersionedSliceName
        const persistedVersion = persistedVersions[name]

        if (persistedVersion !== undefined && persistedVersion !== expectedVersion) {
            console.debug(
                `[MigrationLogic] Slice "${name}" version mismatch (stored: ${persistedVersion}, expected: ${expectedVersion}) – resetting to initial state.`,
            )
            delete (state as Record<string, unknown>)[name]
            resetSlices.push(name)
        }
    }

    state._sliceVersions = { ...SLICE_SCHEMA_VERSIONS }

    return resetSlices
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

    const resetSlices = validateSliceVersions(migratedState)
    if (resetSlices.length > 0) {
        console.debug(`[MigrationLogic] Auto-reset slices: ${resetSlices.join(', ')}`)
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
