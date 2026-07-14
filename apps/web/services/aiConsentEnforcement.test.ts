/**
 * Tests for per-provider AI consent enforcement in withLocalFallback.
 *
 * Verifies that cloud AI calls are blocked until per-provider consent is
 * granted, that denial routes to the local fallback, and that granted
 * consent is persisted so subsequent calls pass without re-prompting.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Stable hoisted mock refs
// ---------------------------------------------------------------------------

const mockHasProviderConsent = vi.hoisted(() => vi.fn(() => false))
const mockGrantProviderConsent = vi.hoisted(() => vi.fn())
const mockRequestProviderConsent = vi.hoisted(() => vi.fn(() => Promise.resolve(false)))
const mockGetActiveProviderId = vi.hoisted(() =>
    vi.fn((): import('@cannaguide/ai-core').AiProvider => 'gemini'),
)

vi.mock('@/services/aiConsentService', () => ({
    aiConsentService: {
        hasProviderConsent: mockHasProviderConsent,
        grantProviderConsent: mockGrantProviderConsent,
        getDisplayName: vi.fn((p: string) => p),
        getDpaLink: vi.fn(() => undefined),
    },
}))

vi.mock('@/services/aiProviderService', () => ({
    aiProviderService: {
        getActiveProviderId: mockGetActiveProviderId,
    },
}))

vi.mock('@/stores/useUIStore', () => ({
    useUIStore: {
        getState: () => ({
            requestProviderConsent: mockRequestProviderConsent,
            addNotification: vi.fn(),
        }),
    },
}))

vi.mock('@/services/local-ai', () => ({
    localAiPreloadService: { isReady: () => false },
    setEcoModeExplicit: vi.fn(),
    registerModeAccessors: vi.fn(),
    isEcoMode: vi.fn(() => false),
    isCriticalBattery: vi.fn(() => false),
}))

vi.mock('@/services/localOnlyModeService', () => ({
    isLocalOnlyMode: vi.fn(() => false),
}))

vi.mock('@/services/sentryService', () => ({
    captureLocalAiError: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const importWithLocalFallback = async () => {
    const mod = await import('@/services/localRoutingService')
    return mod.withLocalFallback
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('withLocalFallback — per-provider consent gate', () => {
    const cloudResult = 'cloud-response'
    const localResult = 'local-response'
    const cloudFn = vi.fn(() => Promise.resolve(cloudResult))
    const localFn = vi.fn(() => Promise.resolve(localResult))

    beforeEach(() => {
        vi.resetModules()
        cloudFn.mockClear()
        localFn.mockClear()
        mockHasProviderConsent.mockClear().mockReturnValue(false)
        mockGrantProviderConsent.mockClear()
        mockRequestProviderConsent.mockClear().mockResolvedValue(false)
        mockGetActiveProviderId.mockClear().mockReturnValue('gemini')
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('falls back to local AI when the consent gate itself throws', async () => {
        // The gate does I/O: it dynamically imports two modules and awaits a
        // prompt. If any of that rejects, the documented guarantee -- the user
        // always gets a response -- must still hold.
        mockHasProviderConsent.mockReturnValue(false)
        mockRequestProviderConsent.mockRejectedValue(new Error('store unavailable'))

        const withLocalFallback = await importWithLocalFallback()
        await expect(withLocalFallback(cloudFn, localFn)).resolves.toBe(localResult)

        expect(cloudFn).not.toHaveBeenCalled()
        expect(localFn).toHaveBeenCalledOnce()
    })

    it('falls back to local AI when the provider lookup throws', async () => {
        mockGetActiveProviderId.mockImplementation(() => {
            throw new Error('provider registry unavailable')
        })

        const withLocalFallback = await importWithLocalFallback()
        await expect(withLocalFallback(cloudFn, localFn)).resolves.toBe(localResult)

        expect(cloudFn).not.toHaveBeenCalled()
        expect(localFn).toHaveBeenCalledOnce()
    })

    it('falls back to local AI when user denies consent', async () => {
        mockHasProviderConsent.mockReturnValue(false)
        mockRequestProviderConsent.mockResolvedValue(false)

        const withLocalFallback = await importWithLocalFallback()
        const result = await withLocalFallback(cloudFn, localFn)

        expect(result).toBe(localResult)
        expect(cloudFn).not.toHaveBeenCalled()
        expect(mockGrantProviderConsent).not.toHaveBeenCalled()
    })

    it('calls cloud AI and persists consent when user grants it', async () => {
        mockHasProviderConsent.mockReturnValue(false)
        mockRequestProviderConsent.mockResolvedValue(true)

        const withLocalFallback = await importWithLocalFallback()
        const result = await withLocalFallback(cloudFn, localFn)

        expect(result).toBe(cloudResult)
        expect(cloudFn).toHaveBeenCalledOnce()
        expect(mockGrantProviderConsent).toHaveBeenCalledWith('gemini')
    })

    it('skips consent dialog and calls cloud directly when consent already granted', async () => {
        mockHasProviderConsent.mockReturnValue(true)

        const withLocalFallback = await importWithLocalFallback()
        const result = await withLocalFallback(cloudFn, localFn)

        expect(result).toBe(cloudResult)
        expect(mockRequestProviderConsent).not.toHaveBeenCalled()
        expect(cloudFn).toHaveBeenCalledOnce()
    })

    it('requests consent for the active provider, not a hardcoded one', async () => {
        const openai: import('@cannaguide/ai-core').AiProvider = 'openai'
        mockGetActiveProviderId.mockReturnValue(openai)
        mockHasProviderConsent.mockReturnValue(false)
        mockRequestProviderConsent.mockResolvedValue(true)

        const withLocalFallback = await importWithLocalFallback()
        await withLocalFallback(cloudFn, localFn)

        expect(mockHasProviderConsent).toHaveBeenCalledWith('openai')
        expect(mockGrantProviderConsent).toHaveBeenCalledWith('openai')
    })

    it('falls back to local AI when cloud call throws after consent', async () => {
        mockHasProviderConsent.mockReturnValue(true)
        cloudFn.mockRejectedValueOnce(new Error('network timeout'))

        const withLocalFallback = await importWithLocalFallback()
        const result = await withLocalFallback(cloudFn, localFn)

        expect(result).toBe(localResult)
        expect(localFn).toHaveBeenCalledOnce()
    })
})
