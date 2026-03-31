import React, { memo, useMemo } from 'react'
import { useAlertsStore, type AlertMetric } from '@/stores/useAlertsStore'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useTranslation } from 'react-i18next'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function metricUnit(metric: AlertMetric): string {
    switch (metric) {
        case 'temperature':
            return ' C'
        case 'humidity':
            return '%'
        case 'vpd':
            return ' kPa'
        case 'ph':
            return ''
        case 'ec':
            return ' mS/cm'
    }
}

function metricLabel(metric: AlertMetric): string {
    switch (metric) {
        case 'temperature':
            return 'Temp'
        case 'humidity':
            return 'Humidity'
        case 'vpd':
            return 'VPD'
        case 'ph':
            return 'pH'
        case 'ec':
            return 'EC'
    }
}

function formatValue(metric: AlertMetric, value: number): string {
    const decimals = metric === 'vpd' || metric === 'ec' ? 2 : 1
    return `${value.toFixed(decimals)}${metricUnit(metric)}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProactiveAlertBannerProps {
    plantId: string
}

export const ProactiveAlertBanner: React.FC<ProactiveAlertBannerProps> = memo(({ plantId }) => {
    const { t } = useTranslation()
    const alerts = useAlertsStore((s) => s.alerts)
    const dismissAlert = useAlertsStore((s) => s.dismissAlert)

    const activeAlerts = useMemo(
        () => alerts.filter((a) => a.plantId === plantId && !a.isDismissed),
        [alerts, plantId],
    )

    if (activeAlerts.length === 0) return null

    return (
        <div className="space-y-2">
            {activeAlerts.map((alert) => (
                <div
                    key={alert.id}
                    className="relative flex items-start gap-3 rounded-xl bg-amber-500/10 p-3 ring-1 ring-inset ring-amber-400/30 animate-fade-in"
                    role="alert"
                >
                    <PhosphorIcons.Sparkle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                    <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-semibold text-amber-300">
                            {metricLabel(alert.metric)} {t('common.critical', 'critical')}:{' '}
                            {formatValue(alert.metric, alert.triggerValue)}
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">{alert.aiAdvice}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => dismissAlert(alert.id)}
                        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-700/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                        aria-label={t('common.dismiss', 'Dismiss')}
                    >
                        <PhosphorIcons.X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    )
})

ProactiveAlertBanner.displayName = 'ProactiveAlertBanner'
