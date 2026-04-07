import { getT } from '@/i18n'
import {
    encryptSyncPayload,
    decryptSyncPayload,
    isEncryptedSyncPayload,
} from '@/services/syncEncryptionService'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import { crdtService, base64ToUint8Array } from '@/services/crdtService'
import type { CrdtSyncResult, DivergenceInfo } from '@/services/crdtService'
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
    ): Promise<{ gistId: string; url: string; syncedAt: number }> {
        if (isLocalOnlyMode()) {
            throw new Error(getT()('settingsView.data.sync.blockedByLocalOnly'))
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

        const gist = (await response.json()) as GistResponse
        logSyncDecision('push', { gistId: gist.id, format: CRDT_FORMAT_VERSION })
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

            logSyncDecision('pull-crdt', {
                localOnly: divergenceInfo.localOnlyChanges,
                remoteOnly: divergenceInfo.remoteOnlyChanges,
                conflicting: divergenceInfo.conflictingKeys.length,
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
     */
    public async forceLocalToGist(
        existingGistId: string,
        encryptionKeyBase64: string | null = null,
    ): Promise<{ syncedAt: number }> {
        logSyncDecision('resolve-keep-local', { gistId: existingGistId })
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
                if (value instanceof Map || (value as { clear?: () => void }).clear) {
                    ;(value as unknown as { clear: () => void }).clear()
                }
            }
        })

        // Apply the remote state as the sole source of truth
        crdtService.applyUpdate(remoteUpdate)
    }
}

export const syncService = new SyncService()
