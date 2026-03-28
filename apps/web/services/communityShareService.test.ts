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

    it('exports strains to anonymous gist', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'share-1', html_url: 'https://gist.github.com/x/share-1' }),
        } as Response)

        const service = await loadService()
        const result = await service.exportStrainsToAnonymousGist([
            {
                id: 's-1',
                name: 'Test',
                type: 'Sativa',
                thc: 18,
                cbd: 1,
            } as never,
        ])

        expect(result.id).toBe('share-1')
        expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)
    })

    it('imports strains from gist payload', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                files: {
                    'cannaguide-strains.json': {
                        content: JSON.stringify({
                            version: 1,
                            strains: [
                                {
                                    id: 's-1',
                                    name: 'Imported',
                                    type: 'Sativa',
                                    thc: 19,
                                    cbd: 0.5,
                                },
                            ],
                        }),
                    },
                },
            }),
        } as Response)

        const service = await loadService()
        const strains = await service.importStrainsFromGist(
            'https://gist.github.com/user/1234567890abcdef1234',
        )

        expect(strains.length).toBe(1)
        expect(strains[0]?.name).toBe('Imported')
    })

    it('rejects invalid gist id/url', async () => {
        const service = await loadService()
        await expect(service.importStrainsFromGist('not-a-valid-gist-url')).rejects.toThrow(
            'common.communityShare.invalidGistUrl',
        )
    })

    it('blocks import/export in local-only mode', async () => {
        isLocalOnlyModeMock.mockReturnValue(true)
        const service = await loadService()

        await expect(service.exportStrainsToAnonymousGist([] as never)).rejects.toThrow(
            'common.communityShare.blockedByLocalOnly',
        )
        await expect(service.importStrainsFromGist('1234567890abcdef1234')).rejects.toThrow(
            'common.communityShare.blockedByLocalOnly',
        )
    })
})
