import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import type { PlantDiagnosisResponse } from '@/types'

const mocks = vi.hoisted(() => ({
    dispatch: vi.fn(),
    addImage: vi.fn(),
    addNotification: vi.fn(),
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('@/stores/store', () => ({
    useAppDispatch: () => mocks.dispatch,
    useAppSelector: () => 'en',
}))
vi.mock('@/stores/selectors', () => ({ selectLanguage: () => 'en' }))
vi.mock('@/stores/slices/simulationSlice', () => ({
    addJournalEntry: (payload: unknown) => ({ type: 'addJournalEntry', payload }),
}))
vi.mock('@/services/dbService', () => ({ dbService: { addImage: mocks.addImage } }))
vi.mock('@/stores/useUIStore', () => ({
    getUISnapshot: () => ({ addNotification: mocks.addNotification }),
}))
vi.mock('@/services/imageService', () => ({
    resizeImage: vi.fn(),
    validateImageFile: vi.fn(),
    base64ToMimeType: () => 'image/png',
}))
vi.mock('@/services/aiLoadingMessages', () => ({ getDynamicLoadingMessages: () => [] }))
vi.mock('@/components/common/CameraModal', () => ({ CameraModal: () => null }))
vi.mock('@/components/common/Modal', () => ({
    Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import { DiagnosisResult } from './AiDiagnosticsModal'

const response = {
    title: 'Nitrogen deficiency',
    confidence: 0.8,
    diagnosis: 'Lower leaves are yellowing.',
    immediateActions: 'Feed nitrogen.',
    longTermSolution: 'Adjust the schedule.',
    prevention: 'Check the pH.',
} as unknown as PlantDiagnosisResponse
const IMAGE = 'data:image/png;base64,UkVTSVpFRA=='

const clickSave = () =>
    act(async () => {
        fireEvent.click(screen.getByText('common.saveToJournal').closest('button')!)
    })

describe('DiagnosisResult journal save (#724)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.addImage.mockResolvedValue(undefined)
    })

    it('does not log a text-only diagnosis behind the user when the photo fails', async () => {
        mocks.addImage.mockRejectedValueOnce(
            new DOMException('Quota exceeded', 'QuotaExceededError'),
        )
        render(<DiagnosisResult response={response} plantId="plant-1" image={IMAGE} />)
        await clickSave()
        expect(mocks.dispatch).not.toHaveBeenCalled()
        expect(mocks.addNotification).toHaveBeenCalledWith({
            message: 'plantsView.aiDiagnostics.saveImageErrorNotLogged',
            type: 'error',
        })
        // The result stays and Save works again once storage does.
        await clickSave()
        expect(mocks.dispatch).toHaveBeenCalledTimes(1)
        const action = mocks.dispatch.mock.calls[0]![0] as {
            payload: { entry: { details: { imageId?: string } } }
        }
        expect(action.payload.entry.details.imageId).toMatch(/^diag-plant-1-/)
    })

    it('a diagnosis without a photo is logged as before', async () => {
        render(<DiagnosisResult response={response} plantId="plant-1" image={null} />)
        await clickSave()
        expect(mocks.addImage).not.toHaveBeenCalled()
        expect(mocks.dispatch).toHaveBeenCalledTimes(1)
        const action = mocks.dispatch.mock.calls[0]![0] as {
            payload: { entry: { details: { imageId?: string } } }
        }
        expect(action.payload.entry.details.imageId).toBeUndefined()
    })

    it('a double click logs the diagnosis once', async () => {
        let finishWrite: () => void = () => undefined
        mocks.addImage.mockImplementationOnce(
            () =>
                new Promise<void>((resolve) => {
                    finishWrite = resolve
                }),
        )
        render(<DiagnosisResult response={response} plantId="plant-1" image={IMAGE} />)
        const button = screen.getByText('common.saveToJournal').closest('button')!
        await act(async () => {
            fireEvent.click(button)
            fireEvent.click(button)
        })
        await act(async () => finishWrite())
        expect(mocks.addImage).toHaveBeenCalledTimes(1)
        expect(mocks.dispatch).toHaveBeenCalledTimes(1)
    })

    it('a saved diagnosis is not logged a second time; a new one can be (#747 review)', async () => {
        const { rerender } = render(
            <DiagnosisResult response={response} plantId="plant-1" image={null} />,
        )
        await clickSave()
        await clickSave()
        expect(mocks.dispatch).toHaveBeenCalledTimes(1)
        expect(screen.getByText('common.saveToJournal').closest('button')).toBeDisabled()

        rerender(
            <DiagnosisResult
                response={{ ...response, title: 'Overwatering' } as PlantDiagnosisResponse}
                plantId="plant-1"
                image={null}
            />,
        )
        expect(screen.getByText('common.saveToJournal').closest('button')).not.toBeDisabled()
        await clickSave()
        expect(mocks.dispatch).toHaveBeenCalledTimes(2)
    })
})
