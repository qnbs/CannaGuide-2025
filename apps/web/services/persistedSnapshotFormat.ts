import type { RootState } from '@/stores/store'
import type { PersistedState } from '@/services/migration/migrationTypes'
import { SLICE_SCHEMA_VERSIONS } from '@/constants'
import { getUISnapshot } from '@/stores/useUIStore'
import {
    redactSettingsSecrets,
    scrubSecretsInText,
    type SecretSettingPath,
} from '@/utils/redactSecrets'

/**
 * The persisted snapshot: what the app saves to IndexedDB
 * (bootstrap/persistence.ts) and what a JSON import restores
 * (services/persistedStateService.ts). The JSON export writes the same shape,
 * so an exported file can be imported again. It used to write the whole Redux
 * state, which has no top-level `version`, and the import refused every export.
 *
 * Transient fields are left out or reset, as the save always did.
 */
export const buildPersistedSnapshot = (
    state: RootState,
    simulation: RootState['simulation'],
    keepSecretPaths: readonly SecretSettingPath[] = [],
): PersistedState => ({
    version: state.settings.version,
    _sliceVersions: SLICE_SCHEMA_VERSIONS,
    // Credentials live encrypted outside Redux; only a legacy key whose
    // migration failed is kept until the next start retries it (#654, #709).
    settings: redactSettingsSecrets(state.settings, keepSecretPaths),
    simulation,
    userStrains: state.userStrains,
    favorites: state.favorites,
    notes: state.notes,
    archives: state.archives,
    savedItems: state.savedItems,
    knowledge: state.knowledge,
    breeding: state.breeding,
    genealogy: state.genealogy,
    nutrientPlanner: {
        schedule: state.nutrientPlanner.schedule,
        readings: state.nutrientPlanner.readings,
        alerts: state.nutrientPlanner.alerts,
        autoAdjustEnabled: state.nutrientPlanner.autoAdjustEnabled,
        medium: state.nutrientPlanner.medium,
        activePluginId: state.nutrientPlanner.activePluginId,
        activeBrandId: state.nutrientPlanner.activeBrandId,
        isAiLoading: false,
        lastAiRecommendation: state.nutrientPlanner.lastAiRecommendation,
        autoAdjustRecommendation: state.nutrientPlanner.autoAdjustRecommendation,
    },
    sandbox: {
        savedExperiments: state.sandbox.savedExperiments,
        currentExperiment: null,
        status: 'idle' as const,
    },
    hydro: state.hydro,
    grows: state.grows,
    metrics: state.metrics,
    growPlanner: state.growPlanner,
    diagnosisHistory: state.diagnosisHistory,
    problemTracker: state.problemTracker,
    ui: {
        lastActiveView: getUISnapshot().lastActiveView,
        onboardingStep: getUISnapshot().onboardingStep,
        equipmentViewTab: getUISnapshot().equipmentViewTab,
        knowledgeViewTab: getUISnapshot().knowledgeViewTab,
    },
})

/**
 * The check the JSON import applies before it restores a file: an object with a
 * numeric top-level `version`, as `buildPersistedSnapshot` writes it.
 */
export const isImportableSnapshot = (value: unknown): boolean =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { version?: unknown }).version === 'number'

/**
 * A downloaded file leaves the device, so it carries neither the app PIN nor the
 * cloud-sync encryption key, which both sit in plain text in the settings. A
 * restored file therefore has no PIN lock and no sync key; both are set again.
 */
export const redactForExport = (snapshot: PersistedState): PersistedState => {
    const settingsSlice = snapshot.settings
    if (!settingsSlice) return snapshot
    const { settings } = settingsSlice
    return {
        ...snapshot,
        settings: {
            ...settingsSlice,
            settings: {
                ...settings,
                privacy: { ...settings.privacy, pin: null },
                data: {
                    ...settings.data,
                    cloudSync: { ...settings.data.cloudSync, encryptionKeyBase64: null },
                },
            },
        },
    }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

/** Fields that never leave the device, in addition to the redacted credentials. */
const DOWNLOAD_ONLY_REDACTED_FIELDS = ['pin', 'encryptionKeyBase64'] as const

const nullField = (holder: unknown, field: string): void => {
    if (isRecord(holder) && field in holder) holder[field] = null
}

/**
 * Prepares a set-aside snapshot (#666) for a download, which leaves the device: the
 * app PIN and the sync key are removed like `redactForExport` does for the JSON export
 * (#872 review). The copy may be partial or not even JSON, which is why it was set
 * aside, so this neither assumes the settings shape nor fails: text that does not
 * parse is scrubbed field by field instead.
 */
export const redactSnapshotTextForDownload = (text: string): string => {
    try {
        const parsed: unknown = JSON.parse(text)
        if (isRecord(parsed)) {
            const settings = isRecord(parsed.settings) ? parsed.settings.settings : undefined
            if (isRecord(settings)) {
                nullField(settings.privacy, 'pin')
                nullField(
                    isRecord(settings.data) ? settings.data.cloudSync : undefined,
                    'encryptionKeyBase64',
                )
            }
            return JSON.stringify(parsed)
        }
    } catch {
        // Not JSON: scrub the text below.
    }
    return DOWNLOAD_ONLY_REDACTED_FIELDS.reduce(
        (scrubbed, field) =>
            scrubbed.replace(
                new RegExp(`("${field}"\\s*:\\s*)"(?:[^"\\\\]|\\\\.)*\\\\?(?:"|$)`, 'g'),
                '$1null',
            ),
        scrubSecretsInText(text),
    )
}
