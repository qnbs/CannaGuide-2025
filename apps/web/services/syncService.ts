import { getT } from '@/i18n'
import {
    encryptSyncPayload,
    decryptSyncPayload,
    isEncryptedSyncPayload,
} from '@/services/syncEncryptionService'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'

const SYNC_FILE_NAME = 'cannaguide-sync.json'

interface SyncPayload {
    version: number
    syncedAt: number
    state: unknown
}

interface GistResponse {
    id: string
    html_url: string
    files: Record<string, { content: string }>
}

const extractGistId = (value: string): string => {
    const trimmed = value.trim()
    const match = trimmed.match(/(?:gist\.github\.com\/(?:[^/]+\/)?|^)([a-f0-9]{20,})/i)
    if (!match?.[1]) {
        throw new Error(getT()('settingsView.data.sync.invalidGistUrl'))
    }
    return match[1]
}

class SyncService {
    /**
     * Pushes the full Redux state to a GitHub Gist (anonymous, no account needed).
     * If gistId is provided, updates the existing gist; otherwise creates a new one.
     * When an encryption key is provided the payload is E2EE-encrypted (AES-256-GCM)
     * before upload so the Gist content is unreadable without the key.
     */
    public async pushToGist(
        stateJson: string,
        existingGistId: string | null,
        encryptionKeyBase64: string | null = null,
    ): Promise<{ gistId: string; url: string; syncedAt: number }> {
        if (isLocalOnlyMode()) {
            throw new Error(getT()('settingsView.data.sync.blockedByLocalOnly'))
        }
        const syncedAt = Date.now()
        const payload: SyncPayload = {
            version: 1,
            syncedAt,
            state: JSON.parse(stateJson),
        }

        const rawPayload = JSON.stringify(payload, null, 2)
        const fileContent = encryptionKeyBase64
            ? await encryptSyncPayload(rawPayload, encryptionKeyBase64)
            : rawPayload

        const body = {
            description: 'CannaGuide cloud sync backup',
            public: false,
            files: {
                [SYNC_FILE_NAME]: {
                    content: fileContent,
                },
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
            const t = getT()
            throw new Error(
                t('settingsView.data.sync.pushFailed', { status: String(response.status) }),
            )
        }

        const gist = (await response.json()) as GistResponse
        return { gistId: gist.id, url: gist.html_url, syncedAt }
    }

    /**
     * Pulls a full Redux state snapshot from a GitHub Gist.
     * Returns the raw state JSON string for hydration via indexedDBStorage.
     * When an encryption key is provided, the payload is decrypted first.
     */
    public async pullFromGist(
        gistUrlOrId: string,
        encryptionKeyBase64: string | null = null,
    ): Promise<{ state: string; syncedAt: number }> {
        if (isLocalOnlyMode()) {
            throw new Error(getT()('settingsView.data.sync.blockedByLocalOnly'))
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

        // Decrypt if the payload is E2EE-encrypted
        if (isEncryptedSyncPayload(rawContent)) {
            if (!encryptionKeyBase64) {
                throw new Error(t('settingsView.data.sync.encryptionKeyRequired'))
            }
            rawContent = await decryptSyncPayload(rawContent, encryptionKeyBase64)
        }

        const parsed = JSON.parse(rawContent) as SyncPayload

        if (!parsed.state || typeof parsed.version !== 'number') {
            throw new Error(t('settingsView.data.sync.invalidPayload'))
        }

        return {
            state: JSON.stringify(parsed.state),
            syncedAt: parsed.syncedAt,
        }
    }
}

export const syncService = new SyncService()
