import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import type { Plant } from '@/types'

const mocks = vi.hoisted(() => ({
    dispatch: vi.fn(),
    addImage: vi.fn(),
    addNotification: vi.fn(),
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    }),
}))
vi.mock('@/stores/store', () => ({ useAppDispatch: () => mocks.dispatch }))
vi.mock('@/stores/slices/simulationSlice', () => ({
    addJournalEntry: (payload: unknown) => ({ type: 'addJournalEntry', payload }),
    applyWateringAction: (payload: unknown) => ({ type: 'applyWateringAction', payload }),
    applyTrainingAction: (payload: unknown) => ({ type: 'applyTrainingAction', payload }),
    applyPestControlAction: (payload: unknown) => ({ type: 'applyPestControlAction', payload }),
    applyAmendmentAction: (payload: unknown) => ({ type: 'applyAmendmentAction', payload }),
}))
vi.mock('@/services/dbService', () => ({ dbService: { addImage: mocks.addImage } }))
vi.mock('@/stores/useUIStore', () => ({
    getUISnapshot: () => ({ addNotification: mocks.addNotification }),
}))
vi.mock('@/services/imageService', () => ({
    resizeImage: vi.fn(async () => 'data:image/png;base64,UkVTSVpFRA=='),
}))
vi.mock('@/services/photoTimelineService', () => ({
    photoTimelineService: {
        readCaptureTimestamp: vi.fn(async () => 1000),
        buildPhotoTimelineMetadata: vi.fn(() => ({ capturedAt: 1000, timelineLabel: 'Week 1' })),
    },
}))
vi.mock('@/hooks/useDictation', () => ({
    useDictation: () => ({ isListening: false, transcript: '', start: vi.fn(), stop: vi.fn() }),
    isDictationSupported: false,
}))
vi.mock('@/components/common/Modal', () => ({
    Modal: ({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) => (
        <div>
            {children}
            {footer}
        </div>
    ),
}))
vi.mock('@/components/common/CameraModal', () => ({ CameraModal: () => null }))

import { LogActionModal } from './LogActionModal'

const plant = { id: 'plant-1', name: 'Test plant' } as unknown as Plant

const renderPhotoModal = () => {
    const onClose = vi.fn()
    const view = render(
        <LogActionModal plant={plant} type="photo" onClose={onClose} onLearnMore={vi.fn()} />,
    )
    return { onClose, view }
}

const choosePhoto = async (container: HTMLElement) => {
    const input = container.querySelector<HTMLInputElement>('#photo-upload')
    expect(input).not.toBeNull()
    await act(async () => {
        fireEvent.change(input!, {
            target: { files: [new File(['photo'], 'photo.png', { type: 'image/png' })] },
        })
    })
    await waitFor(() =>
        expect(screen.getByText('common.save').closest('button')).not.toBeDisabled(),
    )
}

const saveButton = () => screen.getByText('common.save').closest('button')!

describe('LogActionModal photo entries (#724)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.addImage.mockResolvedValue(undefined)
    })

    it('a failed photo write logs nothing and keeps the draft for a retry', async () => {
        mocks.addImage.mockRejectedValueOnce(
            new DOMException('Quota exceeded', 'QuotaExceededError'),
        )
        const { onClose, view } = renderPhotoModal()
        await choosePhoto(view.container)
        fireEvent.change(screen.getByLabelText('common.notes'), { target: { value: 'Day 12' } })

        await act(async () => fireEvent.click(saveButton()))

        expect(mocks.dispatch).not.toHaveBeenCalled()
        expect(onClose).not.toHaveBeenCalled()
        expect(mocks.addNotification).toHaveBeenCalledWith({
            message: 'plantsView.actionModals.photo.saveError',
            type: 'error',
        })
        expect(screen.getByLabelText('common.notes')).toHaveValue('Day 12')
        expect(saveButton()).not.toBeDisabled()

        // Retry once storage works again: the same draft is logged.
        await act(async () => fireEvent.click(saveButton()))
        expect(mocks.addImage).toHaveBeenCalledTimes(2)
        expect(mocks.dispatch).toHaveBeenCalledTimes(1)
        const action = mocks.dispatch.mock.calls[0]![0] as {
            payload: { entry: { notes: string; details: { imageId?: string } } }
        }
        expect(action.payload.entry.notes).toBe('Day 12')
        expect(action.payload.entry.details.imageId).toMatch(/^photo-plant-1-/)
        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('a photo entry cannot be saved without a photo', async () => {
        const { onClose } = renderPhotoModal()
        expect(saveButton()).toBeDisabled()
        await act(async () => fireEvent.click(saveButton()))
        expect(mocks.dispatch).not.toHaveBeenCalled()
        expect(onClose).not.toHaveBeenCalled()
    })

    it('a double click stores the photo once', async () => {
        let finishWrite: () => void = () => undefined
        mocks.addImage.mockImplementationOnce(
            () =>
                new Promise<void>((resolve) => {
                    finishWrite = resolve
                }),
        )
        const { onClose, view } = renderPhotoModal()
        await choosePhoto(view.container)
        await act(async () => {
            fireEvent.click(saveButton())
            fireEvent.click(saveButton())
        })
        await act(async () => finishWrite())
        expect(mocks.addImage).toHaveBeenCalledTimes(1)
        expect(mocks.dispatch).toHaveBeenCalledTimes(1)
        expect(onClose).toHaveBeenCalledTimes(1)
    })
})
