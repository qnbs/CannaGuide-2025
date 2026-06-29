import React, { memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getDbStats, type DbStoreStats } from '@/services/indexedDbMonitorService'

export const DbStoreBreakdown: React.FC<{ refreshTick: number }> = memo(({ refreshTick }) => {
    const { t } = useTranslation()
    const [stats, setStats] = useState<DbStoreStats[] | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        getDbStats()
            .then((s) => {
                setStats(s)
                setIsLoading(false)
            })
            .catch((err) => {
                console.debug('[DbStoreBreakdown] failed:', err)
                setIsLoading(false)
            })
    }, [refreshTick])

    if (isLoading) {
        return <p className="text-xs text-slate-400">{t('settingsView.data.dbStore.loading')}</p>
    }

    if (!stats || stats.length === 0) {
        return <p className="text-xs text-slate-400">{t('settingsView.data.dbStore.empty')}</p>
    }

    const grouped: Record<string, DbStoreStats[]> = {}
    for (const row of stats) {
        const group = grouped[row.db]
        if (group) {
            group.push(row)
        } else {
            grouped[row.db] = [row]
        }
    }

    return (
        <div className="mt-3 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                {t('settingsView.data.dbStore.title')}
            </h4>
            {Object.entries(grouped).map(([db, rows]) => (
                <div key={db} className="bg-slate-800/50 rounded-md px-3 py-2">
                    <p className="text-xs font-mono text-slate-400 mb-1">{db}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                        {rows.map((row) => (
                            <div key={row.store} className="flex justify-between text-xs">
                                <span className="text-slate-400 truncate">{row.store}</span>
                                <span className="text-slate-200 font-mono ml-2">{row.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
})
DbStoreBreakdown.displayName = 'DbStoreBreakdown'
