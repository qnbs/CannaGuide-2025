import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SliceResetPanel } from './SliceResetPanel'
import { DangerZonePanel } from './DangerZonePanel'
import { StorageInsightsPanel } from './StorageInsightsPanel'
import { GdprPrivacyPanel } from './GdprPrivacyPanel'
import { BackupRestorePanel } from './BackupRestorePanel'
import { DataManagementDialogs } from './DataManagementDialogs'

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

    it('GdprPrivacyPanel lists databases and triggers actions', () => {
        const onExport = vi.fn()
        const onEraseDb = vi.fn()
        const onEraseAll = vi.fn()
        render(
            <GdprPrivacyPanel
                knownDatabases={['CannaGuideDB']}
                isExportingAll={false}
                onExportAllUserData={onExport}
                onEraseSingleDb={onEraseDb}
                onEraseAllClick={onEraseAll}
            />,
        )
        fireEvent.click(screen.getByText('common.export'))
        fireEvent.click(screen.getAllByText('common.delete')[0]!)
        fireEvent.click(screen.getAllByText('common.delete')[1]!)
        expect(onExport).toHaveBeenCalled()
        expect(onEraseDb).toHaveBeenCalledWith('CannaGuideDB')
        expect(onEraseAll).toHaveBeenCalled()
    })

    it('BackupRestorePanel wires export and import handlers', () => {
        const onExport = vi.fn()
        const onImport = vi.fn()
        render(
            <BackupRestorePanel
                onExportClick={onExport}
                onImportClick={onImport}
                onFileChange={vi.fn()}
            />,
        )
        fireEvent.click(screen.getByText('settingsView.data.exportAll'))
        fireEvent.click(screen.getByText('settingsView.data.importData'))
        expect(onExport).toHaveBeenCalled()
        expect(onImport).toHaveBeenCalled()
    })

    it('DataManagementDialogs renders erase dialog when open', () => {
        render(
            <DataManagementDialogs
                isClearArchivesConfirmOpen={false}
                setIsClearArchivesConfirmOpen={vi.fn()}
                isExportConfirmOpen={false}
                setIsExportConfirmOpen={vi.fn()}
                isImportConfirmOpen={false}
                setIsImportConfirmOpen={vi.fn()}
                isResetConfirmOpen={false}
                setIsResetConfirmOpen={vi.fn()}
                resetConfirmText=""
                setResetConfirmText={vi.fn()}
                resetPhrase="reset"
                isResetDisabled
                sliceToReset={null}
                setSliceToReset={vi.fn()}
                isEraseConfirmOpen
                setIsEraseConfirmOpen={vi.fn()}
                eraseConfirmText=""
                setEraseConfirmText={vi.fn()}
                erasePhrase="DELETE ALL"
                isEraseDisabled
                isErasing={false}
                onClearArchives={vi.fn()}
                onConfirmExportAll={vi.fn()}
                onConfirmImport={vi.fn()}
                onResetAll={vi.fn()}
                onConfirmSliceReset={vi.fn()}
                onEraseAll={vi.fn()}
            />,
        )
        expect(screen.getAllByText('settingsView.data.gdprErase').length).toBeGreaterThan(0)
    })
})
