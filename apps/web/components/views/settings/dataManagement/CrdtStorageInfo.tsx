import React, { memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatBytes } from './formatBytes'

export const CrdtStorageInfo: React.FC = memo(() => {
    const { t } = useTranslation()
    const [crdtSize, setCrdtSize] = useState<number | null>(null)

    useEffect(() => {
        let cancelled = false
        import('@/services/crdtService')
            .then(({ crdtService }) => {
                if (cancelled) return
                if (crdtService.isInitialized()) {
                    setCrdtSize(crdtService.getDocSizeBytes())
                } else if (crdtService.isFallbackMode()) {
                    setCrdtSize(-1) // sentinel for fallback
                }
            })
            .catch(() => {
                // CRDT not available
            })
        return () => {
            cancelled = true
        }
    }, [])

    if (crdtSize === null) return null

    if (crdtSize === -1) {
        return (
            <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-md">
                <p className="text-xs text-amber-300">
                    {t(
                        'settingsView.data.crdtFallback',
                        'CRDT sync in fallback mode (LWW). Offline merge disabled.',
                    )}
                </p>
            </div>
        )
    }

    return (
        <div className="mt-3 p-2 bg-slate-800/50 rounded-md">
            <div className="flex justify-between text-xs">
                <span className="text-slate-400">
                    {t('settingsView.data.crdtDocSize', 'CRDT Document')}
                </span>
                <span className="text-slate-200 font-mono">{formatBytes(crdtSize)}</span>
            </div>
            {crdtSize > 1_048_576 && (
                <p className="text-xs text-amber-300 mt-1">
                    {t(
                        'settingsView.data.crdtSizeWarning',
                        'CRDT document exceeds 1 MB. Consider running storage cleanup.',
                    )}
                </p>
            )}
        </div>
    )
})
CrdtStorageInfo.displayName = 'CrdtStorageInfo'
