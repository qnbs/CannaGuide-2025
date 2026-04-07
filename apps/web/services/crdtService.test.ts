import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock y-indexeddb (no real IndexedDB in test env)
// ---------------------------------------------------------------------------
vi.mock('y-indexeddb', () => ({
    IndexeddbPersistence: class MockIndexeddbPersistence {
        whenSynced = Promise.resolve()
        destroy(): void {
            // noop
        }
    },
}))

vi.mock('@sentry/react', () => ({
    captureException: vi.fn(),
    addBreadcrumb: vi.fn(),
}))

// Import AFTER mocks
const { crdtService, CrdtError, CrdtErrorCode } = await import('./crdtService')

describe('CrdtError', () => {
    it('creates error with code and metadata', () => {
        const err = new CrdtError('test error', CrdtErrorCode.INIT_FAILED, 1024, 5)
        expect(err.name).toBe('CrdtError')
        expect(err.code).toBe(CrdtErrorCode.INIT_FAILED)
        expect(err.docSizeBytes).toBe(1024)
        expect(err.pendingOps).toBe(5)
        expect(err.message).toBe('test error')
    })

    it('defaults docSizeBytes and pendingOps to 0', () => {
        const err = new CrdtError('test', CrdtErrorCode.SYNC_ENCODE_FAILED)
        expect(err.docSizeBytes).toBe(0)
        expect(err.pendingOps).toBe(0)
    })
})

describe('CrdtErrorCode', () => {
    it('has all expected codes', () => {
        expect(CrdtErrorCode.INIT_FAILED).toBe('CRDT_INIT_FAILED')
        expect(CrdtErrorCode.SYNC_ENCODE_FAILED).toBe('CRDT_SYNC_ENCODE_FAILED')
        expect(CrdtErrorCode.SYNC_APPLY_FAILED).toBe('CRDT_SYNC_APPLY_FAILED')
        expect(CrdtErrorCode.STORAGE_QUOTA_EXCEEDED).toBe('CRDT_STORAGE_QUOTA_EXCEEDED')
        expect(CrdtErrorCode.BRIDGE_LOOP_DETECTED).toBe('CRDT_BRIDGE_LOOP_DETECTED')
    })
})

describe('crdtService', () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        // Reset internal state by destroying
        await crdtService.destroy()
    })

    it('starts uninitialized and not in fallback mode', () => {
        expect(crdtService.isInitialized()).toBe(false)
        expect(crdtService.isFallbackMode()).toBe(false)
    })

    it('initializes successfully with mocked y-indexeddb', async () => {
        await crdtService.initialize()
        expect(crdtService.isInitialized()).toBe(true)
        expect(crdtService.isFallbackMode()).toBe(false)
    })

    it('provides Y.Doc and map accessors after init', async () => {
        await crdtService.initialize()
        const doc = crdtService.getDoc()
        expect(doc).toBeDefined()

        const plantsMap = crdtService.getPlantsMap()
        expect(plantsMap).toBeDefined()

        const scheduleMap = crdtService.getNutrientScheduleMap()
        expect(scheduleMap).toBeDefined()

        const readingsMap = crdtService.getNutrientReadingsMap()
        expect(readingsMap).toBeDefined()
    })

    it('encodes and applies sync payloads (round-trip)', async () => {
        await crdtService.initialize()

        // Add some data
        const plantsMap = crdtService.getPlantsMap()
        const yMap = new (await import('yjs')).Map<unknown>()
        yMap.set('name', 'Test Plant')
        plantsMap.set('p1', yMap as never)

        const payload = crdtService.encodeSyncPayload()
        expect(typeof payload).toBe('string')
        expect(payload.length).toBeGreaterThan(0)

        // Apply to self should not throw
        expect(() => crdtService.applySyncPayload(payload)).not.toThrow()
    })

    it('getDocSizeBytes returns a number', async () => {
        await crdtService.initialize()
        const size = crdtService.getDocSizeBytes()
        expect(typeof size).toBe('number')
        expect(size).toBeGreaterThan(0)
    })

    it('getDocSizeBytes returns 0 when not initialized', () => {
        expect(crdtService.getDocSizeBytes()).toBe(0)
    })

    it('benchmarkSync returns timing information', async () => {
        await crdtService.initialize()
        const result = crdtService.benchmarkSync()
        expect(result.encodeMs).toBeGreaterThanOrEqual(0)
        expect(result.applyMs).toBeGreaterThanOrEqual(0)
        expect(typeof result.docSizeBytes).toBe('number')
    })

    it('detectDivergence returns no-change for identical state', async () => {
        await crdtService.initialize()
        const Y = await import('yjs')
        const update = Y.encodeStateAsUpdate(crdtService.getDoc())
        const info = crdtService.detectDivergence(update)
        expect(info.localOnlyChanges).toBe(0)
        expect(info.remoteOnlyChanges).toBe(0)
        expect(info.conflictingKeys).toHaveLength(0)
    })

    it('base64 round-trip produces equivalent data', async () => {
        const { uint8ArrayToBase64, base64ToUint8Array } = await import('./crdtService')
        const original = new Uint8Array([0, 1, 2, 127, 128, 255])
        const encoded = uint8ArrayToBase64(original)
        const decoded = base64ToUint8Array(encoded)
        expect(decoded).toEqual(original)
    })

    it('getStorageUsage returns storage info', async () => {
        await crdtService.initialize()

        const usage = await crdtService.getStorageUsage()
        expect(usage).toBeDefined()
        expect(typeof usage.crdtBytes).toBe('number')
    })

    it('pruneOldHistory does not throw', async () => {
        await crdtService.initialize()
        // Should not throw even on empty doc
        expect(() => crdtService.pruneOldHistory()).not.toThrow()
    })

    it('destroy cleans up and allows re-initialization', async () => {
        await crdtService.initialize()
        expect(crdtService.isInitialized()).toBe(true)

        await crdtService.destroy()
        expect(crdtService.isInitialized()).toBe(false)

        // Can re-initialize
        await crdtService.initialize()
        expect(crdtService.isInitialized()).toBe(true)
    })
})
