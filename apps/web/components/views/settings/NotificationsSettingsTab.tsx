import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { setSetting } from '@/stores/slices/settingsSlice'
import { Switch } from '@/components/common/Switch'
import { FormSection } from '@/components/ui/form'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/ui/input'
import { SettingsRow } from './SettingsShared'

const NotificationsSettingsTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const notifications = useAppSelector(selectSettings).notifications

    const [browserPermission, setBrowserPermission] = useState<string>(() =>
        typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
    )

    const handleSetSetting = (path: string, value: unknown) => {
        dispatch(setSetting({ path: `notifications.${path}`, value }))
    }

    const handleEnableToggle = async (value: boolean) => {
        handleSetSetting('enabled', value)
        if (value && browserPermission === 'default') {
            try {
                const { requestNotificationPermission } =
                    await import('@/services/nativeBridgeService')
                const granted = await requestNotificationPermission()
                setBrowserPermission(granted ? 'granted' : 'denied')
            } catch {
                // Best-effort
            }
        }
    }

    const browserBlocked = browserPermission === 'denied'
    const browserUnsupported = browserPermission === 'unsupported'

    return (
        <div className="space-y-6">
            {browserBlocked && (
                <div className="rounded-lg bg-amber-900/30 border border-amber-700/50 p-3 text-sm text-amber-300">
                    {t('settingsView.notifications.browserBlocked')}
                </div>
            )}
            {browserUnsupported && (
                <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 text-sm text-slate-400">
                    {t('settingsView.notifications.browserUnsupported')}
                </div>
            )}
            <Card>
                <FormSection
                    title={t('settingsView.notifications.title')}
                    icon={<PhosphorIcons.Bell />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.notifications.enableAll')}
                            description={t('settingsView.notifications.enableAllDesc')}
                        >
                            <Switch
                                checked={notifications.enabled}
                                onChange={(value) => void handleEnableToggle(value)}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.problemDetected')}>
                            <Switch
                                checked={notifications.problemDetected}
                                onChange={(value) => handleSetSetting('problemDetected', value)}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.lowWaterWarning')}>
                            <Switch
                                checked={notifications.lowWaterWarning}
                                onChange={(value) => handleSetSetting('lowWaterWarning', value)}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.phDriftWarning')}>
                            <Switch
                                checked={notifications.phDriftWarning}
                                onChange={(value) => handleSetSetting('phDriftWarning', value)}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.harvestReady')}>
                            <Switch
                                checked={notifications.harvestReady}
                                onChange={(value) => handleSetSetting('harvestReady', value)}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.newTask')}>
                            <Switch
                                checked={notifications.newTask}
                                onChange={(value) => handleSetSetting('newTask', value)}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.stageChange')}>
                            <Switch
                                checked={notifications.stageChange}
                                onChange={(value) => handleSetSetting('stageChange', value)}
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.notifications.quietHours')}
                    icon={<PhosphorIcons.BellSimple />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.notifications.enableQuietHours')}
                            description={t('settingsView.notifications.quietHoursDesc')}
                        >
                            <Switch
                                checked={notifications.quietHours.enabled}
                                onChange={(value) => handleSetSetting('quietHours.enabled', value)}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.quietHoursStart')}>
                            <Input
                                type="time"
                                value={notifications.quietHours.start}
                                onChange={(event) =>
                                    handleSetSetting('quietHours.start', event.target.value)
                                }
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.notifications.quietHoursEnd')}>
                            <Input
                                type="time"
                                value={notifications.quietHours.end}
                                onChange={(event) =>
                                    handleSetSetting('quietHours.end', event.target.value)
                                }
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
        </div>
    )
}


export default NotificationsSettingsTab
