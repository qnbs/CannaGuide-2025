import React, { memo, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppSelector } from '@/stores/store'
import { selectActivePlants } from '@/stores/selectors'
import { growReminderService } from '@/services/growReminderService'

const GrowReminderPanelComponent: React.FC = () => {
    const activePlants = useAppSelector(selectActivePlants)
    const [permission, setPermission] = useState<NotificationPermission>(() =>
        'Notification' in window ? Notification.permission : 'denied',
    )
    const [isEnabling, setIsEnabling] = useState(false)

    const reminders = useMemo(() => growReminderService.buildReminders(activePlants), [activePlants])

    useEffect(() => {
        void growReminderService.syncRemindersToWorker(reminders)
    }, [reminders])

    useEffect(() => {
        if (permission === 'granted' && reminders.length > 0) {
            void growReminderService.notifyDueReminders(reminders)
        }
    }, [permission, reminders])

    const handleEnable = async () => {
        setIsEnabling(true)
        try {
            const nextPermission = await growReminderService.requestPermission()
            setPermission(nextPermission)
            if (nextPermission === 'granted') {
                await growReminderService.registerPeriodicSync()
                await growReminderService.notifyDueReminders(reminders)
            }
        } finally {
            setIsEnabling(false)
        }
    }

    const handleCheckNow = async () => {
        await growReminderService.notifyDueReminders(reminders)
        await growReminderService.triggerWorkerReminderCheck()
    }

    return (
        <Card>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold font-display text-primary-300">Grow Reminders</h3>
                    <p className="text-sm text-slate-300 mt-1">
                        Push reminders for VPD alarms, watering and harvest windows.
                    </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-800 ring-1 ring-inset ring-white/20 text-slate-200">
                    {reminders.length} due
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
                    {permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
                </Button>
                <Button
                    onClick={handleCheckNow}
                    variant="secondary"
                    className="w-full"
                    disabled={permission !== 'granted'}
                >
                    <PhosphorIcons.Lightning className="w-5 h-5 mr-2" />
                    Check now
                </Button>
            </div>

            <p className="text-xs text-slate-400 mt-3">
                Status: <span className="font-semibold">{permission}</span>. Periodic Background Sync is used when supported.
            </p>
        </Card>
    )
}

export const GrowReminderPanel = memo(GrowReminderPanelComponent)
