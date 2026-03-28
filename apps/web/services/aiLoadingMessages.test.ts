import { describe, it, expect, vi, beforeEach } from 'vitest'

const getTMock = vi.fn()

vi.mock('@/i18n', () => ({
    getT: () => getTMock,
}))

const loadService = async () => (await import('./aiLoadingMessages')).getDynamicLoadingMessages

describe('aiLoadingMessages', () => {
    beforeEach(() => {
        vi.resetModules()
        getTMock.mockReset()
    })

    it('maps object results to string array', async () => {
        getTMock.mockReturnValue({ first: 'alpha', second: 2 })
        const getDynamicLoadingMessages = await loadService()

        const result = getDynamicLoadingMessages({ useCase: 'advisor' })
        expect(result).toEqual(['alpha', '2'])
        expect(getTMock).toHaveBeenCalledWith('ai.loading.advisor', {
            returnObjects: true,
        })
    })

    it('maps array results to string array', async () => {
        getTMock.mockReturnValue(['ready', 123])
        const getDynamicLoadingMessages = await loadService()

        const result = getDynamicLoadingMessages({ useCase: 'proactiveDiagnosis' })
        expect(result).toEqual(['ready', '123'])
    })

    it('returns single fallback string for scalar result', async () => {
        getTMock.mockReturnValue('loading')
        const getDynamicLoadingMessages = await loadService()

        const result = getDynamicLoadingMessages({
            useCase: 'advisor',
            data: { plantName: 'Nova' },
        })

        expect(result).toEqual(['loading'])
        expect(getTMock).toHaveBeenCalledWith('ai.loading.advisor', {
            plantName: 'Nova',
            returnObjects: true,
        })
    })
})
