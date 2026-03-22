import { beforeEach, describe, expect, it, vi } from 'vitest'

const getTMock = vi.fn<() => (key: string) => string>(() => (key: string) => key)
const isLocalOnlyModeMock = vi.fn<() => boolean>(() => false)
const encryptSyncPayloadMock = vi.fn<(payload: string, key: string) => Promise<string>>(
    async (payload: string) => payload,
)
const decryptSyncPayloadMock = vi.fn<(payload: string, key: string) => Promise<string>>(
    async (payload: string) => payload,
)
const isEncryptedSyncPayloadMock = vi.fn<(payload: string) => boolean>(() => false)

vi.mock('@/i18n', () => ({
    getT: () => getTMock(),
}))

vi.mock('@/services/localOnlyModeService', () => ({
    isLocalOnlyMode: () => isLocalOnlyModeMock(),
}))

vi.mock('@/services/syncEncryptionService', () => ({
    encryptSyncPayload: (payload: string, key: string) => encryptSyncPayloadMock(payload, key),
    decryptSyncPayload: (payload: string, key: string) => decryptSyncPayloadMock(payload, key),
    isEncryptedSyncPayload: (payload: string) => isEncryptedSyncPayloadMock(payload),
}))

const loadService = async () => (await import('./syncService')).syncService

type FetchOptions = {
    method?: string
    body?: unknown
}

describe('syncService', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        getTMock.mockReturnValue((key: string) => key)
        isLocalOnlyModeMock.mockReturnValue(false)
        encryptSyncPayloadMock.mockImplementation(async (payload: string) => payload)
        decryptSyncPayloadMock.mockImplementation(async (payload: string) => payload)
        isEncryptedSyncPayloadMock.mockReturnValue(false)
        global.fetch = vi.fn()
    })

    it('creates a gist when no existing id is provided', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'gist-1', html_url: 'https://gist.github.com/x/gist-1' }),
        } as Response)

        const syncService = await loadService()
        const result = await syncService.pushToGist('{"hello":"world"}', null)

        expect(result.gistId).toBe('gist-1')
        expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)
        const [url, options] = vi.mocked(global.fetch).mock.calls[0] ?? []
        expect(url).toBe('https://api.github.com/gists')
        expect((options as FetchOptions)?.method).toBe('POST')
    })

    it('updates existing gist and encrypts payload when key is provided', async () => {
        encryptSyncPayloadMock.mockResolvedValueOnce('encrypted-content')
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'gist-2', html_url: 'https://gist.github.com/x/gist-2' }),
        } as Response)

        const syncService = await loadService()
        await syncService.pushToGist('{"hello":"world"}', 'gist-2', 'base64-key')

        expect(encryptSyncPayloadMock).toHaveBeenCalledTimes(1)
        const [url, options] = vi.mocked(global.fetch).mock.calls[0] ?? []
        expect(url).toBe('https://api.github.com/gists/gist-2')
        expect((options as FetchOptions)?.method).toBe('PATCH')
        const parsedBody = JSON.parse(String((options as FetchOptions).body)) as {
            files: Record<string, { content: string }>
        }
        expect(parsedBody.files['cannaguide-sync.json']?.content).toBe('encrypted-content')
    })

    it('pulls and decrypts encrypted gist payload', async () => {
        isEncryptedSyncPayloadMock.mockReturnValueOnce(true)
        decryptSyncPayloadMock.mockResolvedValueOnce(
            JSON.stringify({ version: 1, syncedAt: 1234, state: { a: 1 } }),
        )

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                files: {
                    'cannaguide-sync.json': {
                        content: '{"v":2,"iv":"x","data":"y"}',
                    },
                },
            }),
        } as Response)

        const syncService = await loadService()
        const result = await syncService.pullFromGist(
            'https://gist.github.com/user/1234567890abcdef1234',
            'base64-key',
        )

        expect(decryptSyncPayloadMock).toHaveBeenCalledTimes(1)
        expect(result.state).toBe('{"a":1}')
        expect(result.syncedAt).toBe(1234)
    })

    it('blocks push in local-only mode', async () => {
        isLocalOnlyModeMock.mockReturnValueOnce(true)
        const syncService = await loadService()

        await expect(syncService.pushToGist('{"x":1}', null)).rejects.toThrow(
            'settingsView.data.sync.blockedByLocalOnly',
        )
    })
})
