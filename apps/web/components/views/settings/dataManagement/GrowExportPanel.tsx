import React from 'react'
import { useTranslation } from 'react-i18next'
import type { Grow, Plant } from '@/types'
import { Card } from '@/components/common/Card'
import { FormSection } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

type GrowExportPanelProps = {
    activeGrow: Grow
    activeGrowPlants: Plant[]
    onExportGrow: () => void
    onImportGrow: () => void
    onGrowFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const GrowExportPanel: React.FC<GrowExportPanelProps> = ({
    activeGrow,
    activeGrowPlants,
    onExportGrow,
    onImportGrow,
    onGrowFileChange,
}) => {
    const { t } = useTranslation()

    return (
        <Card>
            <FormSection
                title={t('settingsView.data.growExportTitle')}
                icon={<PhosphorIcons.Plant />}
                defaultOpen
            >
                <div className="sm:col-span-2 space-y-4">
                    <p className="text-sm text-slate-300">
                        {t('settingsView.data.growExportDesc', {
                            name: activeGrow.name,
                            count: activeGrowPlants.length,
                        })}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={onExportGrow} className="flex-1 justify-center">
                            <PhosphorIcons.DownloadSimple className="mr-2" />
                            {t('settingsView.data.exportGrow')}
                        </Button>
                        <Button
                            onClick={onImportGrow}
                            variant="secondary"
                            className="flex-1 justify-center"
                        >
                            <PhosphorIcons.UploadSimple className="mr-2" />
                            {t('settingsView.data.importGrow')}
                        </Button>
                    </div>
                    <p className="text-xs text-slate-400">{t('settingsView.data.growImportDesc')}</p>
                    <input
                        type="file"
                        id="import-grow-file-input"
                        accept=".json"
                        className="hidden"
                        onChange={onGrowFileChange}
                    />
                </div>
            </FormSection>
        </Card>
    )
}
