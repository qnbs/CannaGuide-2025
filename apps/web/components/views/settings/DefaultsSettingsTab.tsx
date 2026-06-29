import React from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { LightType, PotType, VentilationPower } from '@/types'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { setSetting } from '@/stores/slices/settingsSlice'
import { Switch } from '@/components/common/Switch'
import { FormSection } from '@/components/ui/form'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { RangeSlider } from '@/components/common/RangeSlider'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/common/Card'
import { SettingsRow } from './SettingsShared'
import { timeOptions } from './settingsConstants'

const DefaultsSettingsTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const defaults = useAppSelector(selectSettings).defaults

    const handleSetSetting = (path: string, value: unknown) => {
        dispatch(setSetting({ path: `defaults.${path}`, value }))
    }

    return (
        <div className="space-y-6">
            <Card>
                <FormSection
                    title={t('settingsView.defaults.growSetup')}
                    icon={<PhosphorIcons.Plant />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow label={t('plantsView.setupModal.lightingTitle')}>
                            <SegmentedControl
                                value={[defaults.growSetup.lightType]}
                                onToggle={(value) =>
                                    handleSetSetting('growSetup.lightType', value as LightType)
                                }
                                options={[
                                    {
                                        value: 'LED',
                                        label: t('plantsView.setupModal.lightTypes.led'),
                                    },
                                    {
                                        value: 'HPS',
                                        label: t('plantsView.setupModal.lightTypes.hps'),
                                    },
                                ]}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('plantsView.setupModal.wattage')}>
                            <RangeSlider
                                singleValue
                                value={defaults.growSetup.lightWattage}
                                onChange={(value) =>
                                    handleSetSetting('growSetup.lightWattage', value)
                                }
                                min={50}
                                max={1000}
                                step={10}
                                label=""
                                unit="W"
                            />
                        </SettingsRow>
                        <SettingsRow label={t('plantsView.setupModal.lightCycle')}>
                            <SegmentedControl
                                value={[String(defaults.growSetup.lightHours)]}
                                onToggle={(value) =>
                                    handleSetSetting('growSetup.lightHours', Number(value))
                                }
                                options={timeOptions}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('plantsView.setupModal.exhaustFanPower')}>
                            <SegmentedControl
                                value={[defaults.growSetup.ventilation]}
                                onToggle={(value) =>
                                    handleSetSetting(
                                        'growSetup.ventilation',
                                        value as VentilationPower,
                                    )
                                }
                                options={[
                                    {
                                        value: 'low',
                                        label: t('plantsView.setupModal.ventilationLevels.low'),
                                    },
                                    {
                                        value: 'medium',
                                        label: t('plantsView.setupModal.ventilationLevels.medium'),
                                    },
                                    {
                                        value: 'high',
                                        label: t('plantsView.setupModal.ventilationLevels.high'),
                                    },
                                ]}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('plantsView.setupModal.circulationFan')}>
                            <Switch
                                checked={defaults.growSetup.hasCirculationFan}
                                onChange={(value) =>
                                    handleSetSetting('growSetup.hasCirculationFan', value)
                                }
                            />
                        </SettingsRow>
                        <SettingsRow label={t('plantsView.setupModal.potSize')}>
                            <RangeSlider
                                singleValue
                                value={defaults.growSetup.potSize}
                                onChange={(value) => handleSetSetting('growSetup.potSize', value)}
                                min={3}
                                max={50}
                                step={1}
                                label=""
                                unit="L"
                            />
                        </SettingsRow>
                        <SettingsRow label={t('plantsView.setupModal.potType')}>
                            <SegmentedControl
                                value={[defaults.growSetup.potType]}
                                onToggle={(value) =>
                                    handleSetSetting('growSetup.potType', value as PotType)
                                }
                                options={[
                                    {
                                        value: 'Plastic',
                                        label: t('plantsView.setupModal.potTypes.plastic'),
                                    },
                                    {
                                        value: 'Fabric',
                                        label: t('plantsView.setupModal.potTypes.fabric'),
                                    },
                                ]}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('plantsView.setupModal.medium')}>
                            <SegmentedControl
                                value={[defaults.growSetup.medium]}
                                onToggle={(value) => handleSetSetting('growSetup.medium', value)}
                                options={[
                                    { value: 'Soil', label: t('plantsView.mediums.Soil') },
                                    { value: 'Coco', label: t('plantsView.mediums.Coco') },
                                    { value: 'Hydro', label: t('plantsView.mediums.Hydro') },
                                ]}
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.defaults.journalNotesTitle')}
                    icon={<PhosphorIcons.PencilSimple />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow label={t('settingsView.defaults.wateringNoteLabel')}>
                            <Input
                                value={defaults.journalNotes.watering}
                                placeholder={t('plantsView.actionModals.defaultNotes.watering')}
                                onChange={(event) =>
                                    handleSetSetting('journalNotes.watering', event.target.value)
                                }
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.defaults.feedingNoteLabel')}>
                            <Input
                                value={defaults.journalNotes.feeding}
                                placeholder={t('plantsView.actionModals.defaultNotes.feeding')}
                                onChange={(event) =>
                                    handleSetSetting('journalNotes.feeding', event.target.value)
                                }
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
        </div>
    )
}


export default DefaultsSettingsTab
