import { afterEach, describe, expect, it, vi } from 'vitest'
import { ModelDownloadBlockedError } from '@cannaguide/ai-core/ml'
import {
    reportModelDownloadBlocked,
    resetModelDownloadBlockedNoticeForTests,
} from './modelDownloadBlocked'

const addNotification = vi.hoisted(() => vi.fn())
vi.mock('@/stores/useUIStore', () => ({
    useUIStore: { getState: () => ({ addNotification }) },
}))
vi.mock('@/i18n', () => ({ getT: () => (key: string) => key }))

describe('reportModelDownloadBlocked (GH #700)', () => {
    afterEach(() => {
        resetModelDownloadBlockedNoticeForTests()
        addNotification.mockClear()
    })

    it('tells the user once per session, whichever models were refused', async () => {
        reportModelDownloadBlocked(new ModelDownloadBlockedError('Xenova/a'))
        reportModelDownloadBlocked(new ModelDownloadBlockedError('Xenova/b'))

        await vi.waitFor(() => expect(addNotification).toHaveBeenCalled())
        expect(addNotification).toHaveBeenCalledTimes(1)
        expect(addNotification).toHaveBeenCalledWith({
            message: 'common.egress.modelDownloadBlocked',
            type: 'info',
        })
    })

    it('ignores any other error', async () => {
        reportModelDownloadBlocked(new Error('WebGPU context lost'))
        // The ignored error did not use up the one notice.
        reportModelDownloadBlocked(new ModelDownloadBlockedError('Xenova/a'))

        await vi.waitFor(() => expect(addNotification).toHaveBeenCalled())
        expect(addNotification).toHaveBeenCalledTimes(1)
    })
})
