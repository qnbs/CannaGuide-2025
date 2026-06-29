import React, { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Button } from '@/components/ui/button'
import { getUISnapshot } from '@/stores/useUIStore'
import { opfsStorage } from '@/utils/opfsStorage'
import { formatBytes } from './formatBytes'

export const OpfsCacheSection: React.FC<{ refreshTick: number }> = memo(({ refreshTick }) => {
    const { t } = useTranslation()
    const [models, setModels] = useState<string[]>([])
    const [cacheSize, setCacheSize] = useState<number>(0)
    const [isClearing, setIsClearing] = useState(false)
    const available = opfsStorage.isAvailable()

    useEffect(() => {
        if (!available) return
        let cancelled = false
        Promise.all([opfsStorage.list(), opfsStorage.getCacheSize()])
            .then(([keys, size]) => {
                if (cancelled) return
                setModels(keys)
                setCacheSize(size)
            })
            .catch(() => {
                // OPFS read failure -- non-critical
            })
        return () => {
            cancelled = true
        }
    }, [available, refreshTick])

    const handleClear = useCallback(async () => {
        setIsClearing(true)
        try {
            await opfsStorage.clear()
            setModels([])
            setCacheSize(0)
            getUISnapshot().addNotification({ message: 'Model cache cleared.', type: 'success' })
        } catch {
            getUISnapshot().addNotification({
                message: 'Failed to clear model cache.',
                type: 'error',
            })
        } finally {
            setIsClearing(false)
        }
    }, [])

    return (
        <div className="mt-3 p-3 bg-slate-800/50 rounded-md space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-300">
                    {t('settingsView.offlineAi.opfsCacheTitle')}
                </p>
                <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                        available
                            ? 'bg-green-900/40 text-green-300'
                            : 'bg-amber-900/40 text-amber-300'
                    }`}
                >
                    {available
                        ? t('settingsView.offlineAi.opfsAvailable')
                        : t('settingsView.offlineAi.opfsUnavailable')}
                </span>
            </div>
            {available && (
                <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className="text-slate-400">
                            {t('settingsView.offlineAi.opfsCachedModels', {
                                count: String(models.length),
                            })}
                        </span>
                        <span className="text-slate-200 font-mono text-right">
                            {t('settingsView.offlineAi.opfsCacheSize', {
                                size: formatBytes(cacheSize),
                            })}
                        </span>
                    </div>
                    {models.length > 0 && (
                        <div className="space-y-0.5">
                            {models.map((key) => (
                                <div
                                    key={key}
                                    className="text-xs text-slate-400 font-mono truncate"
                                >
                                    {key}
                                </div>
                            ))}
                        </div>
                    )}
                    {models.length > 0 && (
                        <Button
                            onClick={() => void handleClear()}
                            disabled={isClearing}
                            className="text-xs justify-center w-full"
                        >
                            <PhosphorIcons.TrashSimple className="mr-1 w-3 h-3" />
                            {t('settingsView.offlineAi.opfsClearCache')}
                        </Button>
                    )}
                </>
            )}
        </div>
    )
})
OpfsCacheSection.displayName = 'OpfsCacheSection'
