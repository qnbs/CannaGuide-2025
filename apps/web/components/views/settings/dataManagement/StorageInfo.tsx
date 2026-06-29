import React, { memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatBytes } from './formatBytes'

export const StorageInfo: React.FC<{ refreshTick: number }> = memo(({ refreshTick }) => {
    const { t } = useTranslation()
    const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        if (navigator.storage?.estimate) {
            navigator.storage
                .estimate()
                .then((estimate) => {
                    setStorage({
                        usage: estimate.usage ?? 0,
                        quota: estimate.quota ?? 0,
                    })
                    setIsLoading(false)
                })
                .catch((err) => {
                    console.debug('[DataManagementTab] Storage estimate failed:', err)
                    setIsLoading(false)
                })
        } else {
            setIsLoading(false)
        }
    }, [refreshTick])

    if (isLoading) {
        return (
            <p className="text-sm text-center text-slate-400">
                {t('settingsView.data.storageCalculating')}
            </p>
        )
    }

    if (!storage || !storage.quota) {
        return (
            <p className="text-sm text-center text-slate-400">
                {t('settingsView.data.storageUnavailable')}
            </p>
        )
    }

    const usagePercent = ((storage.usage / storage.quota) * 100).toFixed(1)

    const usageRatio = storage.quota > 0 ? storage.usage / storage.quota : 0
    const isWarning = usageRatio >= 0.8 && usageRatio < 0.9
    const isCritical = usageRatio >= 0.9

    return (
        <div className="space-y-3">
            <progress
                className="w-full h-4 overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary-500 [&::-webkit-progress-bar]:bg-slate-700 [&::-webkit-progress-value]:bg-primary-500"
                value={Number.parseFloat(usagePercent)}
                max={100}
                aria-label={t('settingsView.data.storageUsage')}
            />
            <div className="text-center text-sm text-slate-300 font-mono">
                {formatBytes(storage.usage)} / {formatBytes(storage.quota)} ({usagePercent}%)
            </div>
            {isWarning && (
                <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md p-2">
                    <strong>{t('settingsView.data.storageWarningTitle')}</strong>{' '}
                    {t('settingsView.data.storageWarningBody')}
                </p>
            )}
            {isCritical && (
                <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-md p-2">
                    <strong>{t('settingsView.data.storageCriticalTitle')}</strong>{' '}
                    {t('settingsView.data.storageCriticalBody')}
                </p>
            )}
        </div>
    )
})
StorageInfo.displayName = 'StorageInfo'
