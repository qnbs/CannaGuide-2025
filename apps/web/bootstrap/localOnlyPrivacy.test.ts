import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppStore } from '@/stores/store'
import { applyLocalOnlyPrivacy } from './localOnlyPrivacy'

const mocks = vi.hoisted(() => ({
    setLocalOnlyMode: vi.fn(),
    resolveSentryAfterHydration: vi.fn(),
}))

vi.mock('@/services/localOnlyModeService', () => ({ setLocalOnlyMode: mocks.setLocalOnlyMode }))
vi.mock('@/services/sentryService', () => ({
    resolveSentryAfterHydration: mocks.resolveSentryAfterHydration,
}))

const storeWith = (localOnlyMode: boolean | undefined): AppStore =>
    ({
        getState: () => ({ settings: { settings: { privacy: { localOnlyMode } } } }),
    }) as unknown as AppStore

describe('applyLocalOnlyPrivacy', () => {
    beforeEach(() => vi.clearAllMocks())

    it('tells the service and settles Sentry as off for a local-only user', async () => {
        await applyLocalOnlyPrivacy(storeWith(true))

        expect(mocks.setLocalOnlyMode).toHaveBeenCalledWith(true)
        expect(mocks.resolveSentryAfterHydration).toHaveBeenCalledExactlyOnceWith(true)
    })

    it.each([false, undefined])('leaves Sentry alone when local-only is %s', async (value) => {
        await applyLocalOnlyPrivacy(storeWith(value))

        expect(mocks.setLocalOnlyMode).toHaveBeenCalledWith(false)
        // A stale page is only a notice until the reload: Sentry is not started for it.
        expect(mocks.resolveSentryAfterHydration).not.toHaveBeenCalled()
    })
})
