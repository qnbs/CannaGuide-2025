import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppStore } from '@/stores/store'
import { applyLocalOnlyPrivacy } from './localOnlyPrivacy'

const mocks = vi.hoisted(() => ({
    setLocalOnlyMode: vi.fn(),
}))

vi.mock('@/services/localOnlyModeService', () => ({ setLocalOnlyMode: mocks.setLocalOnlyMode }))

const storeWith = (localOnlyMode: boolean | undefined): AppStore =>
    ({
        getState: () => ({ settings: { settings: { privacy: { localOnlyMode } } } }),
    }) as unknown as AppStore

describe('applyLocalOnlyPrivacy', () => {
    beforeEach(() => vi.clearAllMocks())

    it('tells the service when the saved setting is local-only', async () => {
        await applyLocalOnlyPrivacy(storeWith(true))

        expect(mocks.setLocalOnlyMode).toHaveBeenCalledExactlyOnceWith(true)
    })

    it.each([false, undefined])(
        'tells the service it is off when the setting is %s',
        async (value) => {
            await applyLocalOnlyPrivacy(storeWith(value))

            expect(mocks.setLocalOnlyMode).toHaveBeenCalledExactlyOnceWith(false)
        },
    )
})
