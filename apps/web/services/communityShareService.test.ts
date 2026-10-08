import { beforeEach, describe, expect, it, vi } from 'vitest'

const getTMock = vi.fn(() => (key: string) => key)
const isLocalOnlyModeMock = vi.fn(() => false)

vi.mock('@/i18n', () => ({
    getT: () => getTMock(),
}))

vi.mock('@/services/localOnlyModeService', () => ({
    isLocalOnlyMode: () => isLocalOnlyModeMock(),
}))

const loadService = async () => (await import('./communityShareService')).communityShareService

describe('communityShareService', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        getTMock.mockReturnValue((key: string) => key)
        isLocalOnlyModeMock.mockReturnValue(false)
        global.fetch = vi.fn()
    })

    it('does not export while community share is disabled', async () => {
        const service = await loadService()
        await expect(service.exportStrainsToAnonymousGist([] as never)).rejects.toThrow(
            'common.communityShare.unavailable',
        )
        expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
    })

    it('does not import while community share is disabled', async () => {
        const service = await loadService()
        await expect(
            service.importStrainsFromGist('https://gist.github.com/user/1234567890abcdef1234'),
        ).rejects.toThrow('common.communityShare.unavailable')
        expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
    })

    it('refuses an invalid gist before any request while share is disabled', async () => {
        const service = await loadService()
        await expect(service.importStrainsFromGist('not-a-valid-gist-url')).rejects.toThrow(
            'common.communityShare.unavailable',
        )
        expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
    })

    it('does not reach local-only handling while share is disabled', async () => {
        isLocalOnlyModeMock.mockReturnValue(true)
        const service = await loadService()

        await expect(service.exportStrainsToAnonymousGist([] as never)).rejects.toThrow(
            'common.communityShare.unavailable',
        )
        await expect(service.importStrainsFromGist('1234567890abcdef1234')).rejects.toThrow(
            'common.communityShare.unavailable',
        )
        expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
    })
})
