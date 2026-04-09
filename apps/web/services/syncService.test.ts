import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const getTMock = vi.fn<() => (key: string) => string>(() => (key: string) => key)
const isLocalOnlyModeMock = vi.fn<() => boolean>(() => false)
const encryptSyncPayloadMock = vi.fn<(payload: string, key: string) => Promise<string>>(
    async (payload: string) => payload,
)
const decryptSyncPayloadMock = vi.fn<(payload: string, key: string) => Promise<string>>(
    async (payload: string) => payload,
)
const isEncryptedSyncPayloadMock = vi.fn<(payload: string) => boolean>(() => false)

const FAKE_BASE64 = 'AQID' // Uint8Array [1,2,3] base64-encoded
const encodeSyncPayloadMock = vi.fn<() => string>(() => FAKE_BASE64)
const applySyncPayloadMock = vi.fn<(base64: string) => void>()
const detectDivergenceMock = vi.fn()
const isInitializedMock = vi.fn<() => boolean>(() => true)
const isFallbackModeMock = vi.fn<() => boolean>(() => false)
const getDocMock = vi.fn()
const applyUpdateMock = vi.fn()

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

vi.mock('@/services/crdtService', () => ({
    crdtService: {
        encodeSyncPayload: () => encodeSyncPayloadMock(),
        applySyncPayload: (b64: string) => applySyncPayloadMock(b64),
        detectDivergence: (u: Uint8Array) => detectDivergenceMock(u),
        isInitialized: () => isInitializedMock(),
        isFallbackMode: () => isFallbackModeMock(),
        getDoc: () => getDocMock(),
        applyUpdate: (u: Uint8Array) => applyUpdateMock(u),
        setRemoteStateVector: vi.fn(),
    },
    base64ToUint8Array: (b64: string) => {
        const bin = atob(b64)
        const bytes = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
        return bytes
    },
}))

vi.mock('@sentry/react', () => ({
    addBreadcrumb: vi.fn(),
}))

vi.mock('@/services/crdtSyncBridge', () => ({
    reportCrdtTelemetry: vi.fn(),
}))

vi.mock('yjs', () => ({
    encodeStateVector: vi.fn(() => new Uint8Array([0])),
}))

const loadService = async () => (await import('./syncService')).syncService

type FetchOptions = {
    method?: string
    body?: unknown
    headers?: Record<string, string>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeCrdtGistResponse(payload: string, timestamp = 1000): Response {
    return {
        ok: true,
        json: async () => ({
            files: {
                'cannaguide-sync.json': {
                    content: JSON.stringify({
                        version: 'crdt-v1',
                        payload,
                        timestamp,
                    }),
                },
            },
        }),
    } as Response
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('syncService', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        getTMock.mockReturnValue((key: string) => key)
        isLocalOnlyModeMock.mockReturnValue(false)
        isInitializedMock.mockReturnValue(true)
        encryptSyncPayloadMock.mockImplementation(async (payload: string) => payload)
        decryptSyncPayloadMock.mockImplementation(async (payload: string) => payload)
        isEncryptedSyncPayloadMock.mockReturnValue(false)
        encodeSyncPayloadMock.mockReturnValue(FAKE_BASE64)
        detectDivergenceMock.mockReturnValue({
            localOnlyChanges: 0,
            remoteOnlyChanges: 0,
            conflictingKeys: [],
        })
        global.fetch = vi.fn()
    })

    // -- pushToGist --

    it('creates a gist when no existing id is provided', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'gist-1', html_url: 'https://gist.github.com/x/gist-1' }),
        } as Response)

        const svc = await loadService()
        const result = await svc.pushToGist(null)

        expect(result.gistId).toBe('gist-1')
        expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)
        const [url, options] = vi.mocked(global.fetch).mock.calls[0] ?? []
        expect(url).toBe('https://api.github.com/gists')
        expect((options as FetchOptions)?.method).toBe('POST')

        // Verify CRDT payload format
        const body = JSON.parse(String((options as FetchOptions).body)) as {
            files: Record<string, { content: string }>
        }
        const content = JSON.parse(body.files['cannaguide-sync.json']?.content ?? '{}') as {
            version: string
            payload: string
        }
        expect(content.version).toBe('crdt-v1')
        expect(content.payload).toBe(FAKE_BASE64)
    })

    it('updates existing gist via PATCH', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'gist-2', html_url: 'https://gist.github.com/x/gist-2' }),
        } as Response)

        const svc = await loadService()
        await svc.pushToGist('gist-2')

        const [url, options] = vi.mocked(global.fetch).mock.calls[0] ?? []
        expect(url).toBe('https://api.github.com/gists/gist-2')
        expect((options as FetchOptions)?.method).toBe('PATCH')
    })

    it('encrypts payload when encryption key is provided', async () => {
        encryptSyncPayloadMock.mockResolvedValueOnce('encrypted-crdt')
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'gist-3', html_url: 'https://gist.github.com/x/gist-3' }),
        } as Response)

        const svc = await loadService()
        await svc.pushToGist('gist-3', 'my-aes-key')

        expect(encryptSyncPayloadMock).toHaveBeenCalledTimes(1)
        const [, options] = vi.mocked(global.fetch).mock.calls[0] ?? []
        const body = JSON.parse(String((options as FetchOptions).body)) as {
            files: Record<string, { content: string }>
        }
        expect(body.files['cannaguide-sync.json']?.content).toBe('encrypted-crdt')
    })

    it('blocks push in local-only mode', async () => {
        isLocalOnlyModeMock.mockReturnValueOnce(true)
        const svc = await loadService()

        await expect(svc.pushToGist(null)).rejects.toThrow(
            'settingsView.data.sync.blockedByLocalOnly',
        )
    })

    it('throws when CRDT is not initialized on push', async () => {
        isInitializedMock.mockReturnValueOnce(false)
        const svc = await loadService()

        await expect(svc.pushToGist(null)).rejects.toThrow('CRDT not initialized')
    })

    // -- pullFromGist (CRDT format) --

    it('returns no-change when local and remote are identical', async () => {
        detectDivergenceMock.mockReturnValueOnce({
            localOnlyChanges: 0,
            remoteOnlyChanges: 0,
            conflictingKeys: [],
        })

        vi.mocked(global.fetch).mockResolvedValueOnce(makeCrdtGistResponse(FAKE_BASE64, 5000))

        const svc = await loadService()
        const pull = await svc.pullFromGist('abcdef01234567890123')

        expect(pull.result.status).toBe('no-change')
        expect(pull.syncedAt).toBe(5000)
        expect(applySyncPayloadMock).toHaveBeenCalledWith(FAKE_BASE64)
    })

    it('returns merged when there are non-conflicting changes', async () => {
        detectDivergenceMock.mockReturnValueOnce({
            localOnlyChanges: 2,
            remoteOnlyChanges: 3,
            conflictingKeys: [],
        })

        vi.mocked(global.fetch).mockResolvedValueOnce(makeCrdtGistResponse(FAKE_BASE64))

        const svc = await loadService()
        const pull = await svc.pullFromGist('abcdef01234567890123')

        expect(pull.result.status).toBe('merged')
    })

    it('returns conflict when divergent keys are detected', async () => {
        detectDivergenceMock.mockReturnValueOnce({
            localOnlyChanges: 1,
            remoteOnlyChanges: 1,
            conflictingKeys: ['plants.plant-1'],
        })

        vi.mocked(global.fetch).mockResolvedValueOnce(makeCrdtGistResponse(FAKE_BASE64, 7777))

        const svc = await loadService()
        const pull = await svc.pullFromGist('abcdef01234567890123')

        expect(pull.result.status).toBe('conflict')
        expect(pull.divergenceInfo?.conflictingKeys).toEqual(['plants.plant-1'])
    })

    it('decrypts encrypted CRDT payload on pull', async () => {
        isEncryptedSyncPayloadMock.mockReturnValueOnce(true)
        decryptSyncPayloadMock.mockResolvedValueOnce(
            JSON.stringify({ version: 'crdt-v1', payload: FAKE_BASE64, timestamp: 2000 }),
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

        const svc = await loadService()
        const pull = await svc.pullFromGist('abcdef01234567890123', 'my-key')

        expect(decryptSyncPayloadMock).toHaveBeenCalledTimes(1)
        expect(pull.result.status).toBe('no-change')
    })

    // -- pullFromGist (legacy format) --

    it('returns migrated for legacy JSON format', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                files: {
                    'cannaguide-sync.json': {
                        content: JSON.stringify({
                            version: 1,
                            syncedAt: 1234,
                            state: { plants: [{ id: 'p1' }] },
                        }),
                    },
                },
            }),
        } as Response)

        const svc = await loadService()
        const pull = await svc.pullFromGist('abcdef01234567890123')

        expect(pull.result.status).toBe('migrated')
        expect(pull.legacyState).toBeDefined()
        expect(JSON.parse(pull.legacyState ?? '{}')).toEqual({ plants: [{ id: 'p1' }] })
    })

    it('blocks pull in local-only mode', async () => {
        isLocalOnlyModeMock.mockReturnValueOnce(true)
        const svc = await loadService()

        await expect(svc.pullFromGist('abcdef01234567890123')).rejects.toThrow(
            'settingsView.data.sync.blockedByLocalOnly',
        )
    })

    // -- forceLocalToGist / forceRemoteToLocal --

    it('forceLocalToGist delegates to pushToGist', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'gist-f', html_url: 'https://gist.github.com/x/gist-f' }),
        } as Response)

        const svc = await loadService()
        const result = await svc.forceLocalToGist('gist-f')

        expect(result.syncedAt).toBeGreaterThan(0)
        const [url] = vi.mocked(global.fetch).mock.calls[0] ?? []
        expect(url).toBe('https://api.github.com/gists/gist-f')
    })

    it('forceRemoteToLocal applies remote update to doc', async () => {
        const mockDoc = {
            share: new Map(),
            transact: (fn: () => void) => fn(),
        }
        getDocMock.mockReturnValue(mockDoc)

        const svc = await loadService()
        await svc.forceRemoteToLocal(FAKE_BASE64)

        expect(applyUpdateMock).toHaveBeenCalledTimes(1)
    })

    it('forceRemoteToLocal throws when CRDT not initialized', async () => {
        isInitializedMock.mockReturnValue(false)
        const svc = await loadService()

        await expect(svc.forceRemoteToLocal(FAKE_BASE64)).rejects.toThrow('CRDT not initialized')
    })

    // -- Fallback mode (CRDT init failed) ------------------------------------

    describe('LWW fallback mode', () => {
        it('pushToGist in fallback mode sends raw JSON', async () => {
            isFallbackModeMock.mockReturnValue(true)
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 'gist-fallback',
                    html_url: 'https://gist.github.com/x/gist-fallback',
                }),
            } as Response)

            const svc = await loadService()
            const reduxState = JSON.stringify({ plants: [{ id: 'p1' }] })
            const result = await svc.pushToGist(null, null, reduxState)

            expect(result.gistId).toBe('gist-fallback')
            const [, options] = vi.mocked(global.fetch).mock.calls[0] ?? []
            const body = JSON.parse(String((options as FetchOptions).body)) as {
                files: Record<string, { content: string }>
            }
            const content = JSON.parse(body.files['cannaguide-sync.json']?.content ?? '{}') as {
                version: number
                state: unknown
            }
            expect(content.version).toBe(1)
            expect(content.state).toEqual({ plants: [{ id: 'p1' }] })
        })

        it('pushToGist in fallback mode throws when no reduxStateJson', async () => {
            isFallbackModeMock.mockReturnValue(true)
            const svc = await loadService()

            await expect(svc.pushToGist(null)).rejects.toThrow(
                'CRDT fallback requires reduxStateJson',
            )
        })

        it('pushToGist in fallback mode encrypts when key provided', async () => {
            isFallbackModeMock.mockReturnValue(true)
            encryptSyncPayloadMock.mockResolvedValueOnce('encrypted-lww')
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 'gist-enc-fb',
                    html_url: 'https://gist.github.com/x/gist-enc-fb',
                }),
            } as Response)

            const svc = await loadService()
            await svc.pushToGist(null, 'my-key', '{"a":1}')

            expect(encryptSyncPayloadMock).toHaveBeenCalledTimes(1)
            const [, options] = vi.mocked(global.fetch).mock.calls[0] ?? []
            const body = JSON.parse(String((options as FetchOptions).body)) as {
                files: Record<string, { content: string }>
            }
            expect(body.files['cannaguide-sync.json']?.content).toBe('encrypted-lww')
        })

        it('pushToGist in fallback mode throws on fetch error', async () => {
            isFallbackModeMock.mockReturnValue(true)
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: false,
                status: 500,
            } as Response)

            const svc = await loadService()
            await expect(svc.pushToGist(null, null, '{"a":1}')).rejects.toThrow(
                'settingsView.data.sync.pushFailed',
            )
        })

        it('pullFromGist in fallback mode returns legacy state', async () => {
            isFallbackModeMock.mockReturnValue(true)
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    files: {
                        'cannaguide-sync.json': {
                            content: JSON.stringify({
                                version: 1,
                                syncedAt: 9999,
                                state: { plants: [] },
                            }),
                        },
                    },
                }),
            } as Response)

            const svc = await loadService()
            const pull = await svc.pullFromGist('abcdef01234567890123')

            expect(pull.result.status).toBe('migrated')
            expect(pull.legacyState).toBeDefined()
        })

        it('pullFromGist in fallback mode returns error for crdt-v1 payload', async () => {
            isFallbackModeMock.mockReturnValue(true)
            vi.mocked(global.fetch).mockResolvedValueOnce(makeCrdtGistResponse(FAKE_BASE64))

            const svc = await loadService()
            const pull = await svc.pullFromGist('abcdef01234567890123')

            expect(pull.result.status).toBe('error')
        })

        it('pullFromGist in fallback mode throws on invalid payload', async () => {
            isFallbackModeMock.mockReturnValue(true)
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    files: {
                        'cannaguide-sync.json': {
                            content: JSON.stringify({ unknown: true }),
                        },
                    },
                }),
            } as Response)

            const svc = await loadService()
            await expect(svc.pullFromGist('abcdef01234567890123')).rejects.toThrow(
                'settingsView.data.sync.invalidPayload',
            )
        })

        it('pullFromGist in fallback mode throws on fetch failure', async () => {
            isFallbackModeMock.mockReturnValue(true)
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: false,
                status: 403,
            } as Response)

            const svc = await loadService()
            await expect(svc.pullFromGist('abcdef01234567890123')).rejects.toThrow(
                'settingsView.data.sync.pullFailed',
            )
        })

        it('pullFromGist in fallback mode decrypts encrypted payload', async () => {
            isFallbackModeMock.mockReturnValue(true)
            isEncryptedSyncPayloadMock.mockReturnValueOnce(true)
            decryptSyncPayloadMock.mockResolvedValueOnce(
                JSON.stringify({ version: 1, syncedAt: 5555, state: { x: 1 } }),
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

            const svc = await loadService()
            const pull = await svc.pullFromGist('abcdef01234567890123', 'my-key')

            expect(decryptSyncPayloadMock).toHaveBeenCalledTimes(1)
            expect(pull.result.status).toBe('migrated')
        })
    })

    // -- Push error handling -------------------------------------------------

    it('throws on push fetch failure', async () => {
        isFallbackModeMock.mockReturnValue(false)
        isInitializedMock.mockReturnValue(true)
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: false,
            status: 403,
        } as Response)

        const svc = await loadService()
        await expect(svc.pushToGist('gist-err')).rejects.toThrow(
            'settingsView.data.sync.pushFailed',
        )
    })

    // -- Pull edge cases -----------------------------------------------------

    it('throws when pull response has no sync file', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                files: {},
            }),
        } as Response)

        const svc = await loadService()
        await expect(svc.pullFromGist('abcdef01234567890123')).rejects.toThrow(
            'settingsView.data.sync.noSyncFile',
        )
    })

    it('throws when pull response has invalid payload', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                files: {
                    'cannaguide-sync.json': {
                        content: JSON.stringify({ unknown: 'format' }),
                    },
                },
            }),
        } as Response)

        const svc = await loadService()
        await expect(svc.pullFromGist('abcdef01234567890123')).rejects.toThrow(
            'settingsView.data.sync.invalidPayload',
        )
    })

    it('throws when encrypted pull has no encryption key', async () => {
        isEncryptedSyncPayloadMock.mockReturnValueOnce(true)

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

        const svc = await loadService()
        await expect(svc.pullFromGist('abcdef01234567890123')).rejects.toThrow(
            'settingsView.data.sync.encryptionKeyRequired',
        )
    })

    it('throws when CRDT not initialized on pull', async () => {
        isInitializedMock.mockReturnValue(false)
        isFallbackModeMock.mockReturnValue(false)
        const svc = await loadService()

        await expect(svc.pullFromGist('abcdef01234567890123')).rejects.toThrow(
            'CRDT not initialized',
        )
    })

    it('extracts gist id from full URL', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce(makeCrdtGistResponse(FAKE_BASE64))

        const svc = await loadService()
        await svc.pullFromGist('https://gist.github.com/user/abcdef01234567890123')

        const [url] = vi.mocked(global.fetch).mock.calls[0] ?? []
        expect(url).toContain('abcdef01234567890123')
    })

    it('pull fetch failure throws', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: false,
            status: 404,
        } as Response)

        const svc = await loadService()
        await expect(svc.pullFromGist('abcdef01234567890123')).rejects.toThrow(
            'settingsView.data.sync.pullFailed',
        )
    })

    it('forceRemoteToLocal clears shared types before applying update', async () => {
        const clearFn = vi.fn()
        const mockDoc = {
            share: new Map([['plants', { clear: clearFn }]]),
            transact: (fn: () => void) => fn(),
        }
        getDocMock.mockReturnValue(mockDoc)

        const svc = await loadService()
        await svc.forceRemoteToLocal(FAKE_BASE64)

        expect(clearFn).toHaveBeenCalledTimes(1)
        expect(applyUpdateMock).toHaveBeenCalledTimes(1)
    })
})
