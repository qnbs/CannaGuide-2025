import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { setSetting } from '@/stores/slices/settingsSlice'
import { Card } from '@/components/common/Card'
import { FormSection } from '@/components/ui/form'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export const PersistenceSettingsPanel: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)

    return (
        <Card>
            <FormSection
                title={t('settingsView.data.persistenceTitle')}
                icon={<PhosphorIcons.Database />}
                defaultOpen
            >
                <div className="sm:col-span-2 space-y-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-100">
                            {t('settingsView.data.autoBackup')}
                        </label>
                        <Select
                            value={settings.data.autoBackup}
                            onValueChange={(value) =>
                                dispatch(setSetting({ path: 'data.autoBackup', value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="off">
                                    {t('settingsView.data.backupOptions.off')}
                                </SelectItem>
                                <SelectItem value="daily">
                                    {t('settingsView.data.backupOptions.daily')}
                                </SelectItem>
                                <SelectItem value="weekly">
                                    {t('settingsView.data.backupOptions.weekly')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-100">
                            {t('settingsView.data.persistenceInterval')}
                        </label>
                        <Select
                            value={String(settings.data.persistenceIntervalMs)}
                            onValueChange={(value) =>
                                dispatch(
                                    setSetting({
                                        path: 'data.persistenceIntervalMs',
                                        value: Number(value),
                                    }),
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="500">
                                    {t('settingsView.data.persistenceOptions.fast')}
                                </SelectItem>
                                <SelectItem value="1500">
                                    {t('settingsView.data.persistenceOptions.balanced')}
                                </SelectItem>
                                <SelectItem value="5000">
                                    {t('settingsView.data.persistenceOptions.batterySaver')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </FormSection>
        </Card>
    )
}
