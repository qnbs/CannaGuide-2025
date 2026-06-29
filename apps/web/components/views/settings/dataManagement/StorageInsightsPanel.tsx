import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { FormSection } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { DbStoreBreakdown } from './DbStoreBreakdown'
import { StorageInfo } from './StorageInfo'
import { CrdtStorageInfo } from './CrdtStorageInfo'
import { OpfsCacheSection } from './OpfsCacheSection'

type StorageInsightsPanelProps = {
    refreshTick: number
    isCleanupRunning: boolean
    onRunCleanup: () => void
}

export const StorageInsightsPanel: React.FC<StorageInsightsPanelProps> = ({
    refreshTick,
    isCleanupRunning,
    onRunCleanup,
}) => {
    const { t } = useTranslation()

    return (
        <Card>
            <FormSection
                title={t('settingsView.data.storageInsights')}
                icon={<PhosphorIcons.ChartPieSlice />}
                defaultOpen
            >
                <StorageInfo refreshTick={refreshTick} />
                <CrdtStorageInfo />
                <DbStoreBreakdown refreshTick={refreshTick} />
                <OpfsCacheSection refreshTick={refreshTick} />
                <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-col gap-2">
                    <p className="text-sm text-slate-400">
                        {t('settingsView.data.runCleanupDesc')}
                    </p>
                    <Button
                        onClick={onRunCleanup}
                        disabled={isCleanupRunning}
                        className="justify-center"
                    >
                        <PhosphorIcons.Broom className="mr-2" />
                        {isCleanupRunning
                            ? t('settingsView.data.cleanupRunning')
                            : t('settingsView.data.runCleanup')}
                    </Button>
                </div>
            </FormSection>
        </Card>
    )
}
