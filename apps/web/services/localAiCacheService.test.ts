import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'

vi.mock('./sentryService', () => ({
    captureLocalAiError: vi.fn(),
}))

import {
    getCachedInference,
    setCachedInference,
    clearPersistentCache,
    getCacheSize,
    getCacheBreakdown,
    resetCacheDb,
} from '@/services/localAiCacheService'

beforeEach(() => {
    vi.stubGlobal('indexedDB', new IDBFactory())
    vi.stubGlobal('IDBKeyRange', IDBKeyRange)
    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'indexedDB', {
            value: globalThis.indexedDB,
            configurable: true,
            writable: true,
        })
    }
    resetCacheDb()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('localAiCacheService', () => {
    it('exports the expected API surface', () => {
        expect(typeof getCachedInference).toBe('function')
        expect(typeof setCachedInference).toBe('function')
        expect(typeof clearPersistentCache).toBe('function')
        expect(typeof getCacheSize).toBe('function')
        expect(typeof getCacheBreakdown).toBe('function')
        expect(typeof resetCacheDb).toBe('function')
    })

    it('set + get roundtrip', async () => {
        await setCachedInference('my prompt', 'result text', { model: 'onnx', task: 'summarize' })
        const result = await getCachedInference('my prompt')
        expect(result).toBe('result text')
    })

    it('returns null for unknown prompts', async () => {
        expect(await getCachedInference('never-stored')).toBeNull()
    })

    it('getCacheSize reflects stored entries', async () => {
        expect(await getCacheSize()).toBe(0)
        await setCachedInference('p1', 'v1', { model: 'm', task: 't' })
        await setCachedInference('p2', 'v2', { model: 'm', task: 't' })
        expect(await getCacheSize()).toBe(2)
    })

    it('clearPersistentCache removes all entries', async () => {
        await setCachedInference('p', 'v', { model: 'm', task: 't' })
        await clearPersistentCache()
        expect(await getCacheSize()).toBe(0)
    })

    it('getCacheBreakdown groups entries by model', async () => {
        await setCachedInference('a', '1', { model: 'onnx', task: 't' })
        await setCachedInference('b', '2', { model: 'onnx', task: 't' })
        await setCachedInference('c', '3', { model: 'webllm', task: 't' })
        const breakdown = await getCacheBreakdown()
        expect(breakdown['onnx']).toBe(2)
        expect(breakdown['webllm']).toBe(1)
    })

    it('rejects values exceeding MAX_VALUE_SIZE', async () => {
        const huge = 'x'.repeat(60_000)
        await setCachedInference('big', huge, { model: 'm', task: 't' })
        expect(await getCachedInference('big')).toBeNull()
    })

    it('resetCacheDb forces re-open on next operation', async () => {
        await setCachedInference('p', 'v', { model: 'm', task: 't' })
        resetCacheDb()
        const result = await getCachedInference('p')
        expect(result).toBe('v')
    })
})
