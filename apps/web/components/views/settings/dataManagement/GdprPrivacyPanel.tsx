import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { FormSection } from '@/components/ui/form'
import { Button } from '@/components/ui/button'

type GdprPrivacyPanelProps = {
    knownDatabases: readonly string[]
    isExportingAll: boolean
    onExportAllUserData: () => void
    onEraseSingleDb: (dbName: string) => void
    onEraseAllClick: () => void
}

export const GdprPrivacyPanel: React.FC<GdprPrivacyPanelProps> = ({
    knownDatabases,
    isExportingAll,
    onExportAllUserData,
    onEraseSingleDb,
    onEraseAllClick,
}) => {
    const { t } = useTranslation()

    return (
        <Card className="p-4 space-y-4 border-red-700/40">
            <FormSection title={t('settingsView.data.gdprTitle', 'Privacy (GDPR/DSGVO)')}>
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                        <div>
                            <h4 className="font-bold text-slate-100">
                                {t('settingsView.data.gdprExport', 'Export All Personal Data')}
                            </h4>
                            <p className="text-sm text-slate-400">
                                {t(
                                    'settingsView.data.gdprExportDesc',
                                    'Download a complete copy of all data (Art. 20 GDPR).',
                                )}
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={isExportingAll}
                            onClick={onExportAllUserData}
                        >
                            {isExportingAll
                                ? t('common.loading')
                                : t('common.export', 'Export')}
                        </Button>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
                        <h4 className="font-bold text-slate-100">
                            {t(
                                'settingsView.data.gdprSelectiveDelete',
                                'Selective Database Deletion',
                            )}
                        </h4>
                        <p className="text-sm text-slate-400">
                            {t(
                                'settingsView.data.gdprSelectiveDeleteDesc',
                                'Delete individual databases instead of all data at once (Art. 17 GDPR partial erasure).',
                            )}
                        </p>
                        <div className="grid grid-cols-1 gap-1 mt-2">
                            {knownDatabases.map((dbName) => (
                                <div
                                    key={dbName}
                                    className="flex justify-between items-center py-1.5 px-2 rounded bg-slate-900/40"
                                >
                                    <span className="text-xs font-mono text-slate-300">
                                        {dbName}
                                    </span>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => onEraseSingleDb(dbName)}
                                    >
                                        {t('common.delete')}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-900/30 rounded-lg border border-red-800/40">
                        <div>
                            <h4 className="font-bold text-red-300">
                                {t('settingsView.data.gdprErase', 'Erase All Data')}
                            </h4>
                            <p className="text-sm text-red-400/80">
                                {t(
                                    'settingsView.data.gdprEraseDesc',
                                    'Permanently delete ALL data from this device (Art. 17 GDPR). This cannot be undone.',
                                )}
                            </p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={onEraseAllClick}>
                            {t('common.delete')}
                        </Button>
                    </div>
                </div>
            </FormSection>
        </Card>
    )
}
