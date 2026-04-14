import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('platformService', () => {
    beforeEach(() => {
        vi.resetModules()
    })

    afterEach(() => {
        // Clean up injected globals
        if ('__TAURI_INTERNALS__' in globalThis) {
            delete (globalThis as Record<string, unknown>).__TAURI_INTERNALS__
        }
    })

    it('detects browser environment by default', async () => {
        const { platform } = await import('./platformService')
        expect(platform.isTauri).toBe(false)
        expect(platform.isBrowser).toBe(true)
        expect(platform.isPwa).toBe(false)
    })

    it('detects Tauri environment when __TAURI_INTERNALS__ is present', async () => {
        ;(globalThis as Record<string, unknown>).__TAURI_INTERNALS__ = {
            platform: 'linux',
        }
        const { platform } = await import('./platformService')
        expect(platform.isTauri).toBe(true)
        expect(platform.isBrowser).toBe(false)
        expect(platform.isPwa).toBe(false)
        expect(platform.os).toBe('linux')
    })

    it('detects Windows from Tauri internals', async () => {
        ;(globalThis as Record<string, unknown>).__TAURI_INTERNALS__ = {
            platform: 'win32',
        }
        const { platform } = await import('./platformService')
        expect(platform.os).toBe('windows')
    })

    it('detects macOS from Tauri internals', async () => {
        ;(globalThis as Record<string, unknown>).__TAURI_INTERNALS__ = {
            platform: 'darwin',
        }
        const { platform } = await import('./platformService')
        expect(platform.os).toBe('macos')
    })

    it('returns frozen object', async () => {
        const { platform } = await import('./platformService')
        expect(Object.isFrozen(platform)).toBe(true)
    })
})
