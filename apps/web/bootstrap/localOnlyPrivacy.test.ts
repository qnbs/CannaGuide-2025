import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppStore } from '@/stores/store'
import { applyLocalOnlyPrivacy } from './localOnlyPrivacy'

const mocks = vi.hoisted(() => ({ setLocalOnlyMode: vi.fn(), disableSentry: vi.fn() }))

vi.mock('@/services/localOnlyModeService', () => ({ setLocalOnlyMode: mocks.setLocalOnlyMode }))
vi.mock('@/services/sentryService', () => ({ disableSentry: mocks.disableSentry }))

const storeWith = (localOnlyMode: boolean | undefined): AppStore =>
    ({
        getState: () => ({ settings: { settings: { privacy: { localOnlyMode } } } }),
    }) as unknown as AppStore

describe('applyLocalOnlyPrivacy', () => {
    beforeEach(() => vi.clearAllMocks())

    it('tells the service and switches Sentry off for a local-only user', async () => {
        await applyLocalOnlyPrivacy(storeWith(true))

        expect(mocks.setLocalOnlyMode).toHaveBeenCalledWith(true)
        expect(mocks.disableSentry).toHaveBeenCalledOnce()
    })

    it.each([false, undefined])('leaves Sentry alone when local-only is %s', async (value) => {
        await applyLocalOnlyPrivacy(storeWith(value))

        expect(mocks.setLocalOnlyMode).toHaveBeenCalledWith(false)
        expect(mocks.disableSentry).not.toHaveBeenCalled()
    })
})
