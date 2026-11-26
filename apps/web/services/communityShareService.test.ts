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

const sharedPayload = (strains: unknown[]) =>
    new Response(
        JSON.stringify({
            files: {
                'cannaguide-strains.json': { content: JSON.stringify({ version: 1, strains }) },
            },
        }),
    )

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

    it('imports a shared strain whose source reports no THC or CBD, without inventing them', async () => {
        // Sharing stays disabled in the app; only this module sees it enabled, and fetch is mocked.
        vi.doMock('@/constants', async (importOriginal) => ({
            ...(await importOriginal<typeof import('@/constants')>()),
            COMMUNITY_SHARE_DISABLED: false,
        }))
        const unreported = { id: 's-1', name: 'Unreported', type: 'Hybrid' }
        vi.mocked(global.fetch).mockResolvedValue(sharedPayload([unreported]))
        const service = await loadService()
        const [imported] = await service.importStrainsFromGist('a'.repeat(32))
        expect(imported).toEqual(unreported)
        expect(imported).not.toHaveProperty('thc')
        expect(imported).not.toHaveProperty('cbd')
        vi.doUnmock('@/constants')
    })
})
