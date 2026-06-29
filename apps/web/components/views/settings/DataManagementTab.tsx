import React, { lazy, memo, Suspense } from 'react'
import { CommunitySharePanel } from './CommunitySharePanel'
import { useDataManagementActions } from './dataManagement/useDataManagementActions'
import { DataManagementDialogs } from './dataManagement/DataManagementDialogs'
import { PersistenceSettingsPanel } from './dataManagement/PersistenceSettingsPanel'
import { BackupRestorePanel } from './dataManagement/BackupRestorePanel'
import { ZipBackupPanel } from './dataManagement/ZipBackupPanel'
import { CsvExportPanel } from './dataManagement/CsvExportPanel'
import { GrowExportPanel } from './dataManagement/GrowExportPanel'
import { StorageInsightsPanel } from './dataManagement/StorageInsightsPanel'
import { SliceResetPanel } from './dataManagement/SliceResetPanel'
import { DangerZonePanel } from './dataManagement/DangerZonePanel'
import { GdprPrivacyPanel } from './dataManagement/GdprPrivacyPanel'

const CloudSyncPanel = lazy(() => import('./CloudSyncPanel'))
const OfflineActionQueuePanel = lazy(() => import('./OfflineActionQueuePanel'))

const DataManagementTab: React.FC = () => {
    const actions = useDataManagementActions()

    return (
        <div className="space-y-6">
            <DataManagementDialogs
                isClearArchivesConfirmOpen={actions.isClearArchivesConfirmOpen}
                setIsClearArchivesConfirmOpen={actions.setIsClearArchivesConfirmOpen}
                isExportConfirmOpen={actions.isExportConfirmOpen}
                setIsExportConfirmOpen={actions.setIsExportConfirmOpen}
                isImportConfirmOpen={actions.isImportConfirmOpen}
                setIsImportConfirmOpen={actions.setIsImportConfirmOpen}
                isResetConfirmOpen={actions.isResetConfirmOpen}
                setIsResetConfirmOpen={actions.setIsResetConfirmOpen}
                resetConfirmText={actions.resetConfirmText}
                setResetConfirmText={actions.setResetConfirmText}
                resetPhrase={actions.resetPhrase}
                isResetDisabled={actions.isResetDisabled}
                sliceToReset={actions.sliceToReset}
                setSliceToReset={actions.setSliceToReset}
                isEraseConfirmOpen={actions.isEraseConfirmOpen}
                setIsEraseConfirmOpen={actions.setIsEraseConfirmOpen}
                eraseConfirmText={actions.eraseConfirmText}
                setEraseConfirmText={actions.setEraseConfirmText}
                erasePhrase={actions.erasePhrase}
                isEraseDisabled={actions.isEraseDisabled}
                isErasing={actions.isErasing}
                onClearArchives={actions.handleClearArchives}
                onConfirmExportAll={actions.handleConfirmExportAll}
                onConfirmImport={actions.confirmImport}
                onResetAll={actions.handleResetAll}
                onConfirmSliceReset={actions.handleConfirmSliceReset}
                onEraseAll={actions.handleEraseAll}
            />

            <PersistenceSettingsPanel />

            <BackupRestorePanel
                onExportClick={() => actions.setIsExportConfirmOpen(true)}
                onImportClick={actions.handleImportClick}
                onFileChange={actions.handleFileChange}
            />

            <ZipBackupPanel />
            <CsvExportPanel />

            {actions.activeGrow ? (
                <GrowExportPanel
                    activeGrow={actions.activeGrow}
                    activeGrowPlants={actions.activeGrowPlants}
                    onExportGrow={actions.handleExportGrow}
                    onImportGrow={actions.handleImportGrow}
                    onGrowFileChange={actions.handleGrowFileChange}
                />
            ) : null}

            <StorageInsightsPanel
                refreshTick={actions.storageRefreshTick}
                isCleanupRunning={actions.isCleanupRunning}
                onRunCleanup={actions.handleRunStorageCleanup}
            />

            <Suspense fallback={null}>
                <OfflineActionQueuePanel />
            </Suspense>

            <Suspense fallback={null}>
                <CloudSyncPanel />
            </Suspense>

            <CommunitySharePanel />

            <SliceResetPanel onSelectSlice={actions.setSliceToReset} />

            <DangerZonePanel
                onClearArchivesClick={() => actions.setIsClearArchivesConfirmOpen(true)}
                onResetAllClick={() => actions.setIsResetConfirmOpen(true)}
            />

            <GdprPrivacyPanel
                knownDatabases={actions.knownDatabases}
                isExportingAll={actions.isExportingAll}
                onExportAllUserData={actions.handleExportAllUserData}
                onEraseSingleDb={actions.handleEraseSingleDb}
                onEraseAllClick={() => actions.setIsEraseConfirmOpen(true)}
            />
        </div>
    )
}

const DataManagementTabMemo = memo(DataManagementTab)
DataManagementTabMemo.displayName = 'DataManagementTab'
export default DataManagementTabMemo
