import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { FormSection } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import {
    backupService,
    type BackupExportResult,
    type BackupImportResult,
} from '@/services/backupService'
import { getUISnapshot } from '@/stores/useUIStore'

type Translate = ReturnType<typeof useTranslation>['t']

const notify = (type: 'error' | 'info', message: string): void => {
    getUISnapshot().addNotification({ type, message })
}

const reloadSoon = (): void => {
    window.setTimeout(() => window.location.reload(), 3500)
}

const exportZip = async (t: Translate): Promise<void> => {
    const result = await backupService.exportBackup()
    if (result.success && result.blob) {
        backupService.downloadBlob(result.blob, result.filename)
        return
    }
    notify('error', exportFailureMessage(result, t))
}

const exportFailureMessage = (result: BackupExportResult, t: Translate): string =>
    result.errorCode === 'imagesUnreadable'
        ? String(t('settingsView.zipBackup.exportImagesError'))
        : String(t('settingsView.zipBackup.exportError'))

const finishSuccessfulImport = (result: BackupImportResult, t: Translate): void => {
    if (result.rejectedImageCount <= 0) {
        window.location.reload()
        return
    }
    notify(
        'info',
        String(
            t('settingsView.zipBackup.importPartialSuccess', {
                count: result.rejectedImageCount,
            }),
        ),
    )
    reloadSoon()
}

const finishFailedImport = (result: BackupImportResult, t: Translate): void => {
    const message =
        result.errorCode === 'limitExceeded'
            ? String(t('settingsView.zipBackup.importTooLarge'))
            : String(t('settingsView.zipBackup.importError'))
    notify('error', message)
    if (result.reloadRequired) reloadSoon()
}

const importZip = async (file: File, t: Translate): Promise<void> => {
    const result = await backupService.importBackup(file)
    if (result.success) {
        finishSuccessfulImport(result, t)
        return
    }
    finishFailedImport(result, t)
}

const ZipBackupControls: React.FC<{ t: Translate }> = ({ t }) => (
    <div className="sm:col-span-2 space-y-4">
        <p className="text-xs text-slate-400">{t('settingsView.zipBackup.description')}</p>
        <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => exportZip(t)} className="flex-1 justify-center">
                <PhosphorIcons.DownloadSimple className="mr-2" />
                {t('settingsView.zipBackup.exportZip')}
            </Button>
            <Button
                onClick={() => {
                    const input = document.getElementById('import-zip-file-input')
                    if (input instanceof HTMLInputElement) input.click()
                }}
                variant="secondary"
                className="flex-1 justify-center"
            >
                <PhosphorIcons.UploadSimple className="mr-2" />
                {t('settingsView.zipBackup.importZip')}
            </Button>
        </div>
        <input
            type="file"
            id="import-zip-file-input"
            accept=".zip"
            className="hidden"
            onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return undefined
                return importZip(file, t).then(() => {
                    event.target.value = ''
                })
            }}
        />
    </div>
)

export const ZipBackupPanel: React.FC = () => {
    const { t } = useTranslation()

    return (
        <Card>
            <FormSection
                title={t('settingsView.zipBackup.title')}
                icon={<PhosphorIcons.Archive />}
                defaultOpen
            >
                <ZipBackupControls t={t} />
            </FormSection>
        </Card>
    )
}
