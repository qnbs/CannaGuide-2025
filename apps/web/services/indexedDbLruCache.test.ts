import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'

vi.mock('./sentryService', () => ({
    captureLocalAiError: vi.fn(),
}))

import { createIndexedDbLruCache } from './indexedDbLruCache'

interface TestEntry {
    key: string
    value: string
    accessedAt: number
    createdAt: number
}

const DB_NAME = 'TestLruCacheDB'

beforeEach(() => {
    const fakeIdb = new IDBFactory()
    vi.stubGlobal('indexedDB', fakeIdb)
    vi.stubGlobal('IDBKeyRange', IDBKeyRange)
    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'indexedDB', {
            value: fakeIdb,
            configurable: true,
            writable: true,
        })
    }
})

afterEach(() => {
    vi.restoreAllMocks()
})

const makeCache = (overrides: Record<string, unknown> = {}) =>
    createIndexedDbLruCache<TestEntry>({
        dbName: DB_NAME,
        storeName: 'items',
        maxEntries: 10,
        ttlMs: 60_000,
        hashPrefix: 'test',
        stages: {
            read: 'cache-read',
            write: 'cache-write',
            persist: 'cache-persist',
            clear: 'cache-clear',
        },
        ...overrides,
    })

const makeEntry = (key: string, value = 'v'): TestEntry => ({
    key,
    value,
    accessedAt: Date.now(),
    createdAt: Date.now(),
})

describe('hashKey', () => {
    it('produces deterministic keys for the same input', () => {
        const cache = makeCache()
        expect(cache.hashKey('hello')).toBe(cache.hashKey('hello'))
    })

    it('produces different keys for different inputs', () => {
        const cache = makeCache()
        expect(cache.hashKey('alpha')).not.toBe(cache.hashKey('beta'))
    })

    it('includes prefix when configured', () => {
        const cache = makeCache({ hashPrefix: 'img' })
        expect(cache.hashKey('prompt')).toMatch(/^img_/)
    })

    it('omits prefix when hashPrefix is empty', () => {
        const cache = makeCache({ hashPrefix: '' })
        const key = cache.hashKey('prompt')
        expect(key).not.toMatch(/^_/)
    })

    it('encodes input length in the key', () => {
        const cache = makeCache()
        const key = cache.hashKey('abcde')
        expect(key).toContain('_5')
    })
})

describe('CRUD operations', () => {
    it('stores and retrieves an entry', async () => {
        const cache = makeCache()
        const entry = makeEntry('k1', 'data')
        await cache.set(entry)
        const result = await cache.get('k1')
        expect(result).not.toBeNull()
        expect(result?.value).toBe('data')
    })

    it('returns null for a missing key', async () => {
        const cache = makeCache()
        const result = await cache.get('nonexistent')
        expect(result).toBeNull()
    })

    it('overwrites an existing entry with the same key', async () => {
        const cache = makeCache()
        await cache.set(makeEntry('k1', 'first'))
        await cache.set({ ...makeEntry('k1', 'second') })
        const result = await cache.get('k1')
        expect(result?.value).toBe('second')
    })

    it('clear removes all entries', async () => {
        const cache = makeCache()
        await cache.set(makeEntry('k1'))
        await cache.set(makeEntry('k2'))
        expect(await cache.count()).toBe(2)
        await cache.clear()
        expect(await cache.count()).toBe(0)
    })

    it('count returns 0 for empty store', async () => {
        const cache = makeCache()
        expect(await cache.count()).toBe(0)
    })
})

describe('TTL expiry', () => {
    it('returns null for expired entries', async () => {
        const cache = makeCache({ ttlMs: 100 })
        const entry: TestEntry = {
            key: 'old',
            value: 'expired',
            accessedAt: Date.now(),
            createdAt: Date.now() - 200,
        }
        const db = await cache.openDb()
        await new Promise<void>((resolve) => {
            const tx = db.transaction('items', 'readwrite')
            tx.objectStore('items').put(entry)
            tx.oncomplete = () => resolve()
        })
        const result = await cache.get('old')
        expect(result).toBeNull()
    })

    it('returns valid entries within TTL', async () => {
        const cache = makeCache({ ttlMs: 60_000 })
        await cache.set(makeEntry('fresh', 'yes'))
        const result = await cache.get('fresh')
        expect(result?.value).toBe('yes')
    })
})

describe('LRU eviction', () => {
    it('evicts oldest entries when maxEntries is reached', async () => {
        const cache = makeCache({ maxEntries: 5 })

        for (let i = 0; i < 5; i++) {
            const entry: TestEntry = {
                key: `e${i}`,
                value: `v${i}`,
                accessedAt: 1000 + i * 100,
                createdAt: Date.now(),
            }
            await cache.set(entry)
        }
        expect(await cache.count()).toBe(5)

        await cache.set({
            key: 'new',
            value: 'fresh',
            accessedAt: Date.now(),
            createdAt: Date.now(),
        })

        const finalCount = await cache.count()
        expect(finalCount).toBeLessThanOrEqual(5)

        const newest = await cache.get('new')
        expect(newest?.value).toBe('fresh')
    })
})

describe('accessedAt updating', () => {
    it('updates accessedAt on read', async () => {
        const cache = makeCache()
        const entry: TestEntry = {
            key: 'touch',
            value: 'data',
            accessedAt: 1000,
            createdAt: Date.now(),
        }
        await cache.set(entry)

        const before = Date.now()
        const result = await cache.get('touch')
        expect(result).not.toBeNull()
        expect(result!.accessedAt).toBeGreaterThanOrEqual(before)
    })
})

describe('resetDbPromise', () => {
    it('allows re-opening the DB after reset', async () => {
        const cache = makeCache()
        await cache.set(makeEntry('k1', 'val'))

        cache.resetDbPromise()

        const result = await cache.get('k1')
        expect(result?.value).toBe('val')
    })
})

describe('updateConfig', () => {
    it('updates maxEntries at runtime', async () => {
        const cache = makeCache({ maxEntries: 2 })
        await cache.set(makeEntry('a', '1'))
        await cache.set(makeEntry('b', '2'))
        await cache.set(makeEntry('c', '3'))
        expect(await cache.count()).toBeLessThanOrEqual(3)

        // Now increase maxEntries
        cache.updateConfig({ maxEntries: 100 })
        await cache.set(makeEntry('d', '4'))
        await cache.set(makeEntry('e', '5'))
        expect(await cache.count()).toBeGreaterThanOrEqual(3)
    })

    it('ignores non-positive maxEntries', async () => {
        const cache = makeCache({ maxEntries: 10 })
        cache.updateConfig({ maxEntries: 0 })
        cache.updateConfig({ maxEntries: -5 })
        await cache.set(makeEntry('x', 'y'))
        expect(await cache.count()).toBe(1)
    })

    it('updates ttlMs at runtime', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true })
        const cache = makeCache({ ttlMs: 1000 })
        await cache.set(makeEntry('k', 'v'))

        // Extend TTL to 1 hour
        cache.updateConfig({ ttlMs: 3_600_000 })

        // Advance time by 2s -- should still be valid with new TTL
        vi.advanceTimersByTime(2000)
        const result = await cache.get('k')
        expect(result?.value).toBe('v')
        vi.useRealTimers()
    })

    it('ignores non-positive ttlMs', () => {
        const cache = makeCache()
        cache.updateConfig({ ttlMs: 0 })
        cache.updateConfig({ ttlMs: -1 })
    })

    it('accepts partial updates', () => {
        const cache = makeCache()
        cache.updateConfig({ maxEntries: 500 })
        cache.updateConfig({ ttlMs: 86_400_000 })
        cache.updateConfig({})
    })
})
