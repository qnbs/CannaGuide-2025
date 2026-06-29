import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SliceResetPanel } from './SliceResetPanel'
import { DangerZonePanel } from './DangerZonePanel'
import { StorageInsightsPanel } from './StorageInsightsPanel'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('./StorageInfo', () => ({ StorageInfo: () => <div>StorageInfoMock</div> }))
vi.mock('./CrdtStorageInfo', () => ({ CrdtStorageInfo: () => <div>CrdtMock</div> }))
vi.mock('./DbStoreBreakdown', () => ({ DbStoreBreakdown: () => <div>DbBreakdownMock</div> }))
vi.mock('./OpfsCacheSection', () => ({ OpfsCacheSection: () => <div>OpfsMock</div> }))

describe('dataManagement panels', () => {
    it('SliceResetPanel invokes onSelectSlice', () => {
        const onSelect = vi.fn()
        render(<SliceResetPanel onSelectSlice={onSelect} />)
        fireEvent.click(screen.getByText('settingsView.data.sliceReset.slices.simulation'))
        expect(onSelect).toHaveBeenCalledWith('simulation')
    })

    it('DangerZonePanel wires archive and reset callbacks', () => {
        const onArchives = vi.fn()
        const onReset = vi.fn()
        render(
            <DangerZonePanel onClearArchivesClick={onArchives} onResetAllClick={onReset} />,
        )
        const deleteButtons = screen.getAllByText('common.delete')
        expect(deleteButtons.length).toBeGreaterThanOrEqual(2)
        fireEvent.click(deleteButtons[0]!)
        fireEvent.click(deleteButtons[1]!)
        expect(onArchives).toHaveBeenCalled()
        expect(onReset).toHaveBeenCalled()
    })

    it('StorageInsightsPanel shows cleanup button', () => {
        const onCleanup = vi.fn()
        render(
            <StorageInsightsPanel
                refreshTick={0}
                isCleanupRunning={false}
                onRunCleanup={onCleanup}
            />,
        )
        expect(screen.getByText('StorageInfoMock')).toBeTruthy()
        fireEvent.click(screen.getByText('settingsView.data.runCleanup'))
        expect(onCleanup).toHaveBeenCalled()
    })
})
