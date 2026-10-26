import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OfflineActionQueuePanel from './OfflineActionQueuePanel'

const { list, describeAction } = vi.hoisted(() => ({
    list: vi.fn(),
    describeAction: vi.fn(),
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/services/offlineActionQueueService', () => ({
    offlineActionQueueService: {
        list,
        describeAction,
        requestBackgroundSync: vi.fn(),
        clear: vi.fn(),
    },
}))

describe('OfflineActionQueuePanel', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        list.mockResolvedValue([
            {
                id: 1,
                idempotencyKey: 'blocked-action',
                type: 'journal/add',
                replayBlocked: true,
            },
        ])
        describeAction.mockReturnValue('journalEntry')
    })

    it('retains permanently rejected actions for review without offering a futile retry', async () => {
        render(<OfflineActionQueuePanel />)

        expect(
            await screen.findByText('settingsView.data.offlineQueue.blocked'),
        ).toBeInTheDocument()
        await waitFor(() => expect(list).toHaveBeenCalledTimes(1))
        expect(
            screen.getByRole('button', {
                name: 'settingsView.data.offlineQueue.retrySync',
            }),
        ).toBeDisabled()
        expect(screen.getByText('settingsView.data.offlineQueue.count')).toBeInTheDocument()
    })
})
