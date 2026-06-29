import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { FormSection } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { backupService } from '@/services/backupService'

export const ZipBackupPanel: React.FC = () => {
    const { t } = useTranslation()

    return (
        <Card>
            <FormSection
                title={t('settingsView.zipBackup.title')}
                icon={<PhosphorIcons.Archive />}
                defaultOpen
            >
                <div className="sm:col-span-2 space-y-4">
                    <p className="text-xs text-slate-400">
                        {t('settingsView.zipBackup.description')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            onClick={async () => {
                                const result = await backupService.exportBackup()
                                if (result.success && result.blob) {
                                    backupService.downloadBlob(result.blob, result.filename)
                                }
                            }}
                            className="flex-1 justify-center"
                        >
                            <PhosphorIcons.DownloadSimple className="mr-2" />
                            {t('settingsView.zipBackup.exportZip')}
                        </Button>
                        <Button
                            onClick={() => {
                                const input = document.getElementById('import-zip-file-input')
                                if (input instanceof HTMLInputElement) {
                                    input.click()
                                }
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
                        onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const result = await backupService.importBackup(file)
                            if (result.success) {
                                window.location.reload()
                            }
                            e.target.value = ''
                        }}
                    />
                </div>
            </FormSection>
        </Card>
    )
}
