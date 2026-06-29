import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { FormSection } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

type DangerZonePanelProps = {
    onClearArchivesClick: () => void
    onResetAllClick: () => void
}

export const DangerZonePanel: React.FC<DangerZonePanelProps> = ({
    onClearArchivesClick,
    onResetAllClick,
}) => {
    const { t } = useTranslation()

    return (
        <Card className="border border-red-500/30 bg-red-900/10">
            <FormSection
                title={t('settingsView.data.dangerZone')}
                icon={<PhosphorIcons.WarningCircle />}
                defaultOpen
            >
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                        <div>
                            <h4 className="font-bold text-slate-100">
                                {t('settingsView.data.clearArchives')}
                            </h4>
                            <p className="text-sm text-slate-400">
                                {t('settingsView.data.clearArchivesDesc')}
                            </p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={onClearArchivesClick}>
                            {t('common.delete')}
                        </Button>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                        <div>
                            <h4 className="font-bold text-slate-100">
                                {t('settingsView.data.resetAll')}
                            </h4>
                            <p className="text-sm text-slate-400">
                                {t('settingsView.data.resetAllConfirm')}
                            </p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={onResetAllClick}>
                            {t('common.delete')}
                        </Button>
                    </div>
                </div>
            </FormSection>
        </Card>
    )
}
