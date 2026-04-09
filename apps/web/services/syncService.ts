import { getT } from '@/i18n'
import {
    encryptSyncPayload,
    decryptSyncPayload,
    isEncryptedSyncPayload,
} from '@/services/syncEncryptionService'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import { crdtService, base64ToUint8Array } from '@/services/crdtService'
import type { CrdtSyncResult, DivergenceInfo } from '@/services/crdtService'
import { reportCrdtTelemetry } from '@/services/crdtSyncBridge'
import * as Y from 'yjs'
import * as Sentry from '@sentry/react'

const SYNC_FILE_NAME = 'cannaguide-sync.json'
const CRDT_FORMAT_VERSION = 'crdt-v1'

// ---------------------------------------------------------------------------
// Gist payload types
// ---------------------------------------------------------------------------

interface CrdtGistPayload {
    version: typeof CRDT_FORMAT_VERSION
    payload: string // base64 Y.Doc state
    timestamp: number
}

interface LegacyGistPayload {
    version: number
    syncedAt: number
    state: unknown
}

interface GistResponse {
    id: string
    html_url: string
    files: Record<string, { content: string }>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const extractGistId = (value: string): string => {
    const trimmed = value.trim()
    const match = trimmed.match(/(?:gist\.github\.com\/(?:[^/]+\/)?|^)([a-f0-9]{20,})/i)
    if (!match?.[1]) {
        throw new Error(getT()('settingsView.data.sync.invalidGistUrl'))
    }
    return match[1]
}

function isCrdtPayload(parsed: unknown): parsed is CrdtGistPayload {
    return (
        typeof parsed === 'object' &&
        parsed !== null &&
        (parsed as { version?: unknown }).version === CRDT_FORMAT_VERSION
    )
}

function logSyncDecision(action: string, details?: Record<string, unknown>): void {
    Sentry.addBreadcrumb({
        category: 'sync',
        message: action,
        data: details ?? {},
        level: 'info',
    })
}

// ---------------------------------------------------------------------------
// Sync Service (CRDT-aware)
// ---------------------------------------------------------------------------

class SyncService {
    /**
     * Push the current Y.Doc state to a GitHub Gist.
     * Payload is a CRDT state update (base64), not raw JSON.
     * E2EE encryption applied when an encryption key is provided.
     */
    public async pushToGist(
        existingGistId: string | null,
        encryptionKeyBase64: string | null = null,
        reduxStateJson?: string | undefined,
    ): Promise<{ gistId: string; url: string; syncedAt: number }> {
        if (isLocalOnlyMode()) {
            throw new Error(getT()('settingsView.data.sync.blockedByLocalOnly'))
        }

        // Fallback: CRDT failed to init -- push raw Redux JSON as LWW
        if (crdtService.isFallbackMode()) {
            if (!reduxStateJson) {
                throw new Error('[SyncService] CRDT fallback requires reduxStateJson')
            }
            logSyncDecision('push-lww-fallback')
            return this._pushRawJson(existingGistId, encryptionKeyBase64, reduxStateJson)
        }

        if (!crdtService.isInitialized()) {
            throw new Error('[SyncService] CRDT not initialized')
        }

        const syncedAt = Date.now()
        const crdtPayload: CrdtGistPayload = {
            version: CRDT_FORMAT_VERSION,
            payload: crdtService.encodeSyncPayload(),
            timestamp: syncedAt,
        }

        const rawJson = JSON.stringify(crdtPayload)
        const fileContent = encryptionKeyBase64
            ? await encryptSyncPayload(rawJson, encryptionKeyBase64)
            : rawJson

        const body = {
            description: 'CannaGuide cloud sync backup',
            public: false,
            files: {
                [SYNC_FILE_NAME]: { content: fileContent },
            },
        }

        const url = existingGistId
            ? `https://api.github.com/gists/${encodeURIComponent(existingGistId)}`
            : 'https://api.github.com/gists'

        const response = await fetch(url, {
            method: existingGistId ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            throw new Error(
                getT()('settingsView.data.sync.pushFailed', {
                    status: String(response.status),
                }),
            )
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const gist = (await response.json()) as GistResponse
        logSyncDecision('push', { gistId: gist.id, format: CRDT_FORMAT_VERSION })

        // CRDT telemetry: track payload size
        reportCrdtTelemetry({
            syncPayloadBytes: fileContent.length,
            lastSyncMs: Date.now(),
        })

        return { gistId: gist.id, url: gist.html_url, syncedAt }
    }

    /**
     * Pull from a GitHub Gist and merge via CRDT.
     *
     * Format detection:
     * - `version: 'crdt-v1'` -> CRDT merge path (auto-merge via Yjs)
     * - `version: <number>` -> Legacy JSON path (one-time migration)
     *
     * Returns a CrdtSyncResult indicating the outcome:
     * - `merged`: changes applied, no semantic conflicts
     * - `conflict`: divergent changes detected, UI should prompt user
     * - `no-change`: local state already up-to-date
     * - `migrated`: old JSON format imported and converted to CRDT
     * - `error`: something went wrong
     */
    public async pullFromGist(
        gistUrlOrId: string,
        encryptionKeyBase64: string | null = null,
    ): Promise<{
        result: CrdtSyncResult
        syncedAt: number
        divergenceInfo?: DivergenceInfo | undefined
        legacyState?: string | undefined
    }> {
        if (isLocalOnlyMode()) {
            throw new Error(getT()('settingsView.data.sync.blockedByLocalOnly'))
        }

        // Fallback: CRDT unavailable -- treat as legacy pull
        if (crdtService.isFallbackMode()) {
            logSyncDecision('pull-lww-fallback')
            return this._pullLwwFallback(gistUrlOrId, encryptionKeyBase64)
        }

        if (!crdtService.isInitialized()) {
            throw new Error('[SyncService] CRDT not initialized')
        }

        const gistId = extractGistId(gistUrlOrId)
        const t = getT()

        const response = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
            headers: { Accept: 'application/json' },
        })

        if (!response.ok) {
            throw new Error(
                t('settingsView.data.sync.pullFailed', { status: String(response.status) }),
            )
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const gist = (await response.json()) as GistResponse
        const file = gist.files[SYNC_FILE_NAME]
        if (!file?.content) {
            throw new Error(t('settingsView.data.sync.noSyncFile'))
        }

        let rawContent = file.content

        // Decrypt if E2EE-encrypted
        if (isEncryptedSyncPayload(rawContent)) {
            if (!encryptionKeyBase64) {
                throw new Error(t('settingsView.data.sync.encryptionKeyRequired'))
            }
            rawContent = await decryptSyncPayload(rawContent, encryptionKeyBase64)
        }

        const parsed: unknown = JSON.parse(rawContent)

        // -- CRDT format path --
        if (isCrdtPayload(parsed)) {
            const remoteUpdate = base64ToUint8Array(parsed.payload)

            // Detect divergence BEFORE applying the merge
            const divergenceInfo = crdtService.detectDivergence(remoteUpdate)

            // Apply CRDT merge (always lossless)
            crdtService.applySyncPayload(parsed.payload)

            // Store remote state vector for differential encoding on next push
            crdtService.setRemoteStateVector(
                 
                Y.encodeStateVector(crdtService.getDoc()),
            )

            logSyncDecision('pull-crdt', {
                localOnly: divergenceInfo.localOnlyChanges,
                remoteOnly: divergenceInfo.remoteOnlyChanges,
                conflicting: divergenceInfo.conflictingKeys.length,
            })

            // CRDT telemetry: track divergence and conflicts
            reportCrdtTelemetry({
                syncPayloadBytes: remoteUpdate.byteLength,
                lastSyncMs: Date.now(),
                divergenceCount:
                    divergenceInfo.localOnlyChanges > 0 || divergenceInfo.remoteOnlyChanges > 0
                        ? 1
                        : 0,
                conflictsResolved:
                    divergenceInfo.conflictingKeys.length > 0
                        ? divergenceInfo.conflictingKeys.length
                        : 0,
            })

            if (divergenceInfo.localOnlyChanges === 0 && divergenceInfo.remoteOnlyChanges === 0) {
                return { result: { status: 'no-change' }, syncedAt: parsed.timestamp }
            }

            if (divergenceInfo.conflictingKeys.length > 0) {
                return {
                    result: { status: 'conflict', info: divergenceInfo },
                    syncedAt: parsed.timestamp,
                    divergenceInfo,
                }
            }

            return { result: { status: 'merged' }, syncedAt: parsed.timestamp }
        }

        // -- Legacy JSON format path (one-time migration) --
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const legacy = parsed as LegacyGistPayload
        if (legacy.state && typeof legacy.version === 'number') {
            logSyncDecision('pull-legacy-migration', { version: legacy.version })
            return {
                result: { status: 'migrated' },
                syncedAt: legacy.syncedAt ?? Date.now(),
                legacyState: JSON.stringify(legacy.state),
            }
        }

        throw new Error(t('settingsView.data.sync.invalidPayload'))
    }

    /**
     * Force push local CRDT state to Gist (for "Keep Local" resolution).
     * Overwrites whatever is in the Gist with the current local Y.Doc state.
     * Always sends full state (not differential) to ensure completeness.
     */
    public async forceLocalToGist(
        existingGistId: string,
        encryptionKeyBase64: string | null = null,
    ): Promise<{ syncedAt: number }> {
        logSyncDecision('resolve-keep-local', { gistId: existingGistId })
        // Reset remote state vector to force full-state encoding
        crdtService.setRemoteStateVector(null)
        const result = await this.pushToGist(existingGistId, encryptionKeyBase64)
        return { syncedAt: result.syncedAt }
    }

    /**
     * Force apply remote CRDT state, discarding local-only changes
     * (for "Use Cloud" resolution).
     *
     * Creates a fresh Y.Doc from the remote update and replaces the
     * local doc content entirely.
     */
    public async forceRemoteToLocal(remoteBase64: string): Promise<void> {
        if (!crdtService.isInitialized()) {
            throw new Error('[SyncService] CRDT not initialized')
        }
        logSyncDecision('resolve-use-cloud')

        const remoteUpdate = base64ToUint8Array(remoteBase64)
        const doc = crdtService.getDoc()

        // Clear all shared types in the current doc
        doc.transact(() => {
            for (const [, value] of doc.share) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                if (value instanceof Map || (value as { clear?: () => void }).clear) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    ;(value as unknown as { clear: () => void }).clear()
                }
            }
        })

        // Apply the remote state as the sole source of truth
        crdtService.applyUpdate(remoteUpdate)
    }

    // -----------------------------------------------------------------------
    // LWW fallback helpers (CRDT init failed)
    // -----------------------------------------------------------------------

    private async _pushRawJson(
        existingGistId: string | null,
        encryptionKeyBase64: string | null,
        reduxStateJson: string,
    ): Promise<{ gistId: string; url: string; syncedAt: number }> {
        const syncedAt = Date.now()
        const lwwPayload = JSON.stringify({
            version: 1,
            syncedAt,
            state: JSON.parse(reduxStateJson) as unknown,
        })

        const fileContent = encryptionKeyBase64
            ? await encryptSyncPayload(lwwPayload, encryptionKeyBase64)
            : lwwPayload

        const body = {
            description: 'CannaGuide cloud sync backup',
            public: false,
            files: { [SYNC_FILE_NAME]: { content: fileContent } },
        }

        const url = existingGistId
            ? `https://api.github.com/gists/${encodeURIComponent(existingGistId)}`
            : 'https://api.github.com/gists'

        const response = await fetch(url, {
            method: existingGistId ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            throw new Error(
                getT()('settingsView.data.sync.pushFailed', {
                    status: String(response.status),
                }),
            )
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const gist = (await response.json()) as GistResponse
        logSyncDecision('push-lww', { gistId: gist.id })
        return { gistId: gist.id, url: gist.html_url, syncedAt }
    }

    private async _pullLwwFallback(
        gistUrlOrId: string,
        encryptionKeyBase64: string | null,
    ): Promise<{
        result: CrdtSyncResult
        syncedAt: number
        legacyState?: string | undefined
    }> {
        const gistId = extractGistId(gistUrlOrId)
        const t = getT()

        const response = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
            headers: { Accept: 'application/json' },
        })

        if (!response.ok) {
            throw new Error(
                t('settingsView.data.sync.pullFailed', { status: String(response.status) }),
            )
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const gist = (await response.json()) as GistResponse
        const file = gist.files[SYNC_FILE_NAME]
        if (!file?.content) {
            throw new Error(t('settingsView.data.sync.noSyncFile'))
        }

        let rawContent = file.content
        if (isEncryptedSyncPayload(rawContent)) {
            if (!encryptionKeyBase64) {
                throw new Error(t('settingsView.data.sync.encryptionKeyRequired'))
            }
            rawContent = await decryptSyncPayload(rawContent, encryptionKeyBase64)
        }

        const parsed: unknown = JSON.parse(rawContent)

        // LWW fallback always returns the state as legacy for the caller to apply
        if (isCrdtPayload(parsed)) {
            // Remote is CRDT but local CRDT is broken -- cannot merge, return as-is
            return {
                result: { status: 'error', error: 'CRDT fallback cannot merge crdt-v1 payload' },
                syncedAt: parsed.timestamp,
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const legacy = parsed as LegacyGistPayload
        if (legacy.state && typeof legacy.version === 'number') {
            return {
                result: { status: 'migrated' },
                syncedAt: legacy.syncedAt ?? Date.now(),
                legacyState: JSON.stringify(legacy.state),
            }
        }

        throw new Error(t('settingsView.data.sync.invalidPayload'))
    }
}

export const syncService = new SyncService()
