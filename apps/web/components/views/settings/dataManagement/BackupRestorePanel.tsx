import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { FormSection } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

type BackupRestorePanelProps = {
    onExportClick: () => void
    onImportClick: () => void
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const BackupRestorePanel: React.FC<BackupRestorePanelProps> = ({
    onExportClick,
    onImportClick,
    onFileChange,
}) => {
    const { t } = useTranslation()

    return (
        <>
            <Card>
                <FormSection
                    title={t('settingsView.data.backupAndRestore')}
                    icon={<PhosphorIcons.ArchiveBox />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button onClick={onExportClick} className="flex-1 justify-center">
                                <PhosphorIcons.DownloadSimple className="mr-2" />
                                {t('settingsView.data.exportAll')}
                            </Button>
                            <Button
                                onClick={onImportClick}
                                variant="secondary"
                                className="flex-1 justify-center"
                            >
                                <PhosphorIcons.UploadSimple className="mr-2" />
                                {t('settingsView.data.importData')}
                            </Button>
                        </div>
                        <p className="text-xs text-slate-400">
                            {t('settingsView.data.importDataDesc')}
                        </p>
                    </div>
                </FormSection>
            </Card>
            <input
                type="file"
                id="import-file-input"
                accept=".json"
                className="hidden"
                onChange={onFileChange}
            />
        </>
    )
}
