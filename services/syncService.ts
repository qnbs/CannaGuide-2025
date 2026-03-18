import { getT } from '@/i18n'

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
        throw new Error(getT()('settingsView.sync.invalidGistUrl'))
    }
    return match[1]
}

class SyncService {
    /**
     * Pushes the full Redux state to a GitHub Gist (anonymous, no account needed).
     * If gistId is provided, updates the existing gist; otherwise creates a new one.
     */
    public async pushToGist(
        stateJson: string,
        existingGistId: string | null,
    ): Promise<{ gistId: string; url: string; syncedAt: number }> {
        const syncedAt = Date.now()
        const payload: SyncPayload = {
            version: 1,
            syncedAt,
            state: JSON.parse(stateJson),
        }

        const body = {
            description: 'CannaGuide cloud sync backup',
            public: false,
            files: {
                [SYNC_FILE_NAME]: {
                    content: JSON.stringify(payload, null, 2),
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
            throw new Error(t('settingsView.sync.pushFailed', { status: String(response.status) }))
        }

        const gist = (await response.json()) as GistResponse
        return { gistId: gist.id, url: gist.html_url, syncedAt }
    }

    /**
     * Pulls a full Redux state snapshot from a GitHub Gist.
     * Returns the raw state JSON string for hydration via indexedDBStorage.
     */
    public async pullFromGist(gistUrlOrId: string): Promise<{ state: string; syncedAt: number }> {
        const gistId = extractGistId(gistUrlOrId)
        const t = getT()

        const response = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
            headers: { Accept: 'application/json' },
        })

        if (!response.ok) {
            throw new Error(t('settingsView.sync.pullFailed', { status: String(response.status) }))
        }

        const gist = (await response.json()) as GistResponse
        const file = gist.files[SYNC_FILE_NAME]
        if (!file?.content) {
            throw new Error(t('settingsView.sync.noSyncFile'))
        }

        const parsed = JSON.parse(file.content) as SyncPayload

        if (!parsed.state || typeof parsed.version !== 'number') {
            throw new Error(t('settingsView.sync.invalidPayload'))
        }

        return {
            state: JSON.stringify(parsed.state),
            syncedAt: parsed.syncedAt,
        }
    }
}

export const syncService = new SyncService()
