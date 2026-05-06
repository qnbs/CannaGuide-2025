import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/platformService', () => ({
    platform: { isTauri: false },
}))

import {
    getNativeCapabilities,
    openLogDir,
    clearNativeCache,
    _resetNativeCapabilitiesCache,
} from './nativeCapabilitiesService'

beforeEach(() => {
    _resetNativeCapabilitiesCache()
})

describe('nativeCapabilitiesService (PWA fallback)', () => {
    it('returns the all-false PWA stub when not in Tauri', async () => {
        const caps = await getNativeCapabilities()
        expect(caps.updater).toBe(false)
        expect(caps.fs).toBe(false)
        expect(caps.tray).toBe(false)
        expect(caps.logDir).toBeNull()
    })

    it('caches the result across multiple calls', async () => {
        const a = await getNativeCapabilities()
        const b = await getNativeCapabilities()
        // Frozen object identity is preserved between calls.
        expect(a).toBe(b)
    })

    it('openLogDir returns null on PWA', async () => {
        await expect(openLogDir()).resolves.toBeNull()
    })

    it('clearNativeCache returns 0 on PWA', async () => {
        await expect(clearNativeCache()).resolves.toBe(0)
    })
})
