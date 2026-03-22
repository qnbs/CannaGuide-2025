import React, { memo, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppSelector } from '@/stores/store'
import { selectActivePlants, selectSettings } from '@/stores/selectors'
import { growReminderService } from '@/services/growReminderService'
import { QRCodeSVG } from 'qrcode.react'

const browserWindow = globalThis.window

const GrowReminderPanelComponent: React.FC = () => {
    const { t } = useTranslation()
    const activePlants = useAppSelector(selectActivePlants)
    const settings = useAppSelector(selectSettings)
    const [permission, setPermission] = useState<NotificationPermission>(() =>
        'Notification' in globalThis ? Notification.permission : 'denied',
    )
    const [isEnabling, setIsEnabling] = useState(false)
    const [batchTriggerPlantId, setBatchTriggerPlantId] = useState<string | null>(() => {
        if (!browserWindow) return null
        return new URLSearchParams(browserWindow.location.search).get('reminderBatch')
    })

    const reminders = useMemo(
        () => growReminderService.buildReminders(activePlants),
        [activePlants],
    )
    const batches = useMemo(() => growReminderService.buildReminderBatches(reminders), [reminders])

    useEffect(() => {
        if (!batchTriggerPlantId || permission !== 'granted') return

        void growReminderService.notifyDueReminders(reminders, settings, batchTriggerPlantId)
        void growReminderService.triggerWorkerReminderCheck()

        const currentUrl = browserWindow?.location.href
        if (!currentUrl) {
            setBatchTriggerPlantId(null)
            return
        }

        const url = new URL(currentUrl)
        url.searchParams.delete('reminderBatch')
        browserWindow.history.replaceState({}, document.title, url.toString())
        setBatchTriggerPlantId(null)
    }, [batchTriggerPlantId, permission, reminders, settings])

    useEffect(() => {
        void growReminderService.syncRemindersToWorker(reminders)
    }, [reminders])

    useEffect(() => {
        if (permission === 'granted' && reminders.length > 0) {
            void growReminderService.notifyDueReminders(reminders, settings)
        }
    }, [permission, reminders, settings])

    const handleEnable = async () => {
        setIsEnabling(true)
        try {
            const nextPermission = await growReminderService.requestPermission()
            setPermission(nextPermission)
            if (nextPermission === 'granted') {
                await growReminderService.registerPeriodicSync()
                await growReminderService.notifyDueReminders(reminders, settings)
            }
        } finally {
            setIsEnabling(false)
        }
    }

    const handleCheckNow = async () => {
        await growReminderService.notifyDueReminders(reminders, settings)
        await growReminderService.triggerWorkerReminderCheck()
    }

    const handleCopyBatchLink = async (plantId: string) => {
        const batchUrl = growReminderService.getBatchTriggerUrl(plantId)
        await navigator.clipboard.writeText(batchUrl)
    }

    return (
        <Card>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold font-display text-primary-300">
                        {t('plantsView.growReminderPanel.title')}
                    </h3>
                    <p className="text-sm text-slate-300 mt-1">
                        {t('plantsView.growReminderPanel.description')}
                    </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-800 ring-1 ring-inset ring-white/20 text-slate-200">
                    {t('plantsView.growReminderPanel.due', { count: reminders.length })}
                </span>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Button
                    onClick={handleEnable}
                    disabled={isEnabling}
                    variant={permission === 'granted' ? 'secondary' : 'primary'}
                    className="w-full"
                >
                    <PhosphorIcons.Bell className="w-5 h-5 mr-2" />
                    {permission === 'granted'
                        ? t('plantsView.growReminderPanel.enabledBtn')
                        : t('plantsView.growReminderPanel.enableBtn')}
                </Button>
                <Button
                    onClick={handleCheckNow}
                    variant="secondary"
                    className="w-full"
                    disabled={permission !== 'granted'}
                >
                    <PhosphorIcons.Lightning className="w-5 h-5 mr-2" />
                    {t('plantsView.growReminderPanel.checkNowBtn')}
                </Button>
            </div>

            <p className="text-xs text-slate-400 mt-3">
                {t('plantsView.growReminderPanel.statusLabel', { permission })}
            </p>

            {batches.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-100">
                                {t('plantsView.growReminderPanel.batchTitle')}
                            </h4>
                            <p className="text-xs text-slate-400">
                                {t('plantsView.growReminderPanel.batchDescription')}
                            </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary-500/15 text-primary-200 ring-1 ring-inset ring-primary-400/30">
                            {t('plantsView.growReminderPanel.batchCount', {
                                count: batches.length,
                            })}
                        </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {batches.map((batch) => {
                            const triggerUrl = growReminderService.getBatchTriggerUrl(batch.plantId)
                            const isActiveTrigger = batchTriggerPlantId === batch.plantId

                            return (
                                <div
                                    key={batch.id}
                                    className={`rounded-xl border p-3 bg-slate-950/50 ${isActiveTrigger ? 'border-primary-400/60 ring-1 ring-primary-400/30' : 'border-white/10'}`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-100">
                                                {batch.plantName}
                                            </p>
                                            <p className="text-xs text-slate-400">{batch.body}</p>
                                        </div>
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                                            {batch.severity}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg shrink-0">
                                            <QRCodeSVG
                                                value={triggerUrl}
                                                size={96}
                                                level="M"
                                                marginSize={4}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-slate-300">
                                                {t('plantsView.growReminderPanel.batchQrLabel')}
                                            </p>
                                            <p className="text-[11px] text-slate-500 break-all mt-1">
                                                {triggerUrl}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <Button
                                                    variant="secondary"
                                                    className="h-9 px-3 text-xs"
                                                    onClick={() =>
                                                        void handleCopyBatchLink(batch.plantId)
                                                    }
                                                >
                                                    <PhosphorIcons.ShareNetwork className="w-4 h-4 mr-2" />
                                                    {t(
                                                        'plantsView.growReminderPanel.copyBatchLink',
                                                    )}
                                                </Button>
                                                <Button
                                                    variant={
                                                        isActiveTrigger ? 'primary' : 'secondary'
                                                    }
                                                    className="h-9 px-3 text-xs"
                                                    onClick={async () => {
                                                        await growReminderService.notifyDueReminders(
                                                            reminders,
                                                            settings,
                                                            batch.plantId,
                                                        )
                                                        await growReminderService.triggerWorkerReminderCheck()
                                                    }}
                                                >
                                                    <PhosphorIcons.BellSimple className="w-4 h-4 mr-2" />
                                                    {t(
                                                        'plantsView.growReminderPanel.triggerBatchBtn',
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </Card>
    )
}

export const GrowReminderPanel = memo(GrowReminderPanelComponent)
GrowReminderPanel.displayName = 'GrowReminderPanel'
