import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppStore } from '@/stores/store'
import { setSetting } from '@/stores/slices/settingsSlice'
import { cloudTtsKeyService } from '@/services/cloudTtsKeyService'
import { migrateLegacySecrets } from './secrets'

// A synthetic canary, never a real key (#654).
const CANARY = 'sk_canary_0000000000000000000000000000'

vi.mock('@/services/cloudTtsKeyService', () => ({
    cloudTtsKeyService: { migrateLegacyKey: vi.fn() },
}))

const storeWith = (cloudTtsApiKey: string | null) => {
    const dispatch = vi.fn()
    const store = {
        getState: () => ({ settings: { settings: { tts: { cloudTtsApiKey } } } }),
        dispatch,
    } as unknown as AppStore
    return { store, dispatch }
}

describe('migrateLegacySecrets (#654)', () => {
    beforeEach(() => vi.clearAllMocks())

    it('clears the plaintext from settings once the encrypted copy is verified', async () => {
        vi.mocked(cloudTtsKeyService.migrateLegacyKey).mockResolvedValue(true)
        const { store, dispatch } = storeWith(CANARY)
        await migrateLegacySecrets(store)
        expect(cloudTtsKeyService.migrateLegacyKey).toHaveBeenCalledWith(CANARY)
        expect(dispatch).toHaveBeenCalledWith(
            setSetting({ path: 'tts.cloudTtsApiKey', value: null }),
        )
    })

    it('leaves the settings untouched when the migration fails', async () => {
        vi.mocked(cloudTtsKeyService.migrateLegacyKey).mockResolvedValue(false)
        const { store, dispatch } = storeWith(CANARY)
        await migrateLegacySecrets(store)
        expect(dispatch).not.toHaveBeenCalled()
    })

    it('does nothing without a legacy key', async () => {
        const { store, dispatch } = storeWith(null)
        await migrateLegacySecrets(store)
        expect(cloudTtsKeyService.migrateLegacyKey).not.toHaveBeenCalled()
        expect(dispatch).not.toHaveBeenCalled()
    })
})
