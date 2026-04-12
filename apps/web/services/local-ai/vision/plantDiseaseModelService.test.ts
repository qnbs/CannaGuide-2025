import { describe, expect, it, vi, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks (before imports)
// ---------------------------------------------------------------------------

vi.mock('@/services/sentryService', () => ({
    captureLocalAiError: vi.fn(),
}))

vi.mock('@/services/localOnlyModeService', () => ({
    isLocalOnlyMode: vi.fn(() => false),
}))

vi.mock('@/services/workerBus', () => ({
    workerBus: { register: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { getModelStatus, isModelCached, downloadModel } from './plantDiseaseModelService'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('plantDiseaseModelService', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    describe('getModelStatus', () => {
        it('returns not-cached as the initial module status', () => {
            // _status is module-level and starts as 'not-cached' on fresh import
            expect(getModelStatus()).toBe('not-cached')
        })
    })

    describe('isModelCached', () => {
        it('resolves to false when IndexedDB.open throws', async () => {
            // openDb() wraps indexedDB.open() in a Promise constructor.
            // A synchronous throw inside a Promise constructor causes the
            // promise to reject, which the catch handler in isModelCached
            // then handles by returning false.
            vi.stubGlobal('indexedDB', {
                open: () => {
                    throw new Error('Test: IDB unavailable')
                },
            })
            const result = await isModelCached()
            expect(result).toBe(false)
        })
    })

    describe('downloadModel', () => {
        it('resolves to false when the HEAD request returns 404', async () => {
            // downloadModel performs a HEAD check before streaming the body.
            // A non-ok response (404) causes an early return of false.
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
            const result = await downloadModel()
            expect(result).toBe(false)
        })
    })
})
