import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'

vi.mock('./sentryService', () => ({
    captureLocalAiError: vi.fn(),
}))

// Stub once before module loads — the module-level factory captures a lazy
// openDb() that looks up globalThis.indexedDB at call time.
beforeAll(() => {
    vi.stubGlobal('indexedDB', new IDBFactory())
    vi.stubGlobal('IDBKeyRange', IDBKeyRange)
    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'indexedDB', {
            value: globalThis.indexedDB,
            configurable: true,
            writable: true,
        })
    }
})

import {
    getCachedGeneratedImage,
    setCachedGeneratedImage,
    clearImageGenCache,
    getImageGenCacheCount,
} from './imageGenerationCacheService'

beforeEach(async () => {
    await clearImageGenCache()
})

describe('imageGenerationCacheService', () => {
    it('set + get roundtrip', async () => {
        await setCachedGeneratedImage('prompt-a', 'data:image/png;base64,abc')
        const result = await getCachedGeneratedImage('prompt-a')
        expect(result).not.toBeNull()
        expect(result?.dataUrl).toBe('data:image/png;base64,abc')
    })

    it('returns null for unknown prompts', async () => {
        expect(await getCachedGeneratedImage('never-stored')).toBeNull()
    })

    it('getImageGenCacheCount tracks entries', async () => {
        expect(await getImageGenCacheCount()).toBe(0)
        await setCachedGeneratedImage('p1', 'data:image/png;base64,1')
        await setCachedGeneratedImage('p2', 'data:image/png;base64,2')
        expect(await getImageGenCacheCount()).toBe(2)
    })

    it('clearImageGenCache removes all entries', async () => {
        await setCachedGeneratedImage('p', 'data:image/png;base64,x')
        await clearImageGenCache()
        expect(await getImageGenCacheCount()).toBe(0)
    })

    it('overwrites entry with same prompt', async () => {
        await setCachedGeneratedImage('same', 'data:old')
        await setCachedGeneratedImage('same', 'data:new')
        const result = await getCachedGeneratedImage('same')
        expect(result?.dataUrl).toBe('data:new')
    })

    it('generates keys with img_ prefix', async () => {
        await setCachedGeneratedImage('test-prompt', 'data:test')
        expect(await getImageGenCacheCount()).toBe(1)
    })
})
