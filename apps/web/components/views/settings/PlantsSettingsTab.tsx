import React from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { setSetting } from '@/stores/slices/settingsSlice'
import { Switch } from '@/components/common/Switch'
import { FormSection } from '@/components/ui/form'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { RangeSlider } from '@/components/common/RangeSlider'
import { Card } from '@/components/common/Card'
import { SettingsRow } from './SettingsShared'

const PlantsSettingsTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const simSettings = settings.simulation
    const plantViewSettings = settings.plantsView

    const handleSetSetting = (path: string, value: unknown) => {
        dispatch(setSetting({ path, value }))
    }

    return (
        <div className="space-y-6">
            <Card>
                <FormSection
                    title={t('settingsView.plants.realtimeEngine')}
                    icon={<PhosphorIcons.ArrowClockwise />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-4">
                        <div className="rounded-xl border border-primary-500/20 bg-primary-500/10 p-4 text-sm text-slate-300">
                            <p className="font-semibold text-primary-300">
                                {t('settingsView.plants.realtimeSimulation')}
                            </p>
                            <p className="mt-1 text-slate-300">
                                {t('settingsView.plants.realtimeSimulationDesc')}
                            </p>
                        </div>
                        <SettingsRow
                            label={t('settingsView.plants.simulationProfile')}
                            description={t('settingsView.plants.simulationProfileDesc')}
                        >
                            <SegmentedControl
                                value={[simSettings.simulationProfile]}
                                onToggle={(val) =>
                                    handleSetSetting('simulation.simulationProfile', val)
                                }
                                options={[
                                    {
                                        value: 'beginner',
                                        label: t('settingsView.plants.simulationProfiles.beginner'),
                                    },
                                    {
                                        value: 'intermediate',
                                        label: t(
                                            'settingsView.plants.simulationProfiles.intermediate',
                                        ),
                                    },
                                    {
                                        value: 'expert',
                                        label: t('settingsView.plants.simulationProfiles.expert'),
                                    },
                                ]}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.plants.showArchived')}
                            description={t('settingsView.plants.showArchivedDesc')}
                        >
                            <Switch
                                checked={plantViewSettings.showArchived}
                                onChange={(val) => handleSetSetting('plantsView.showArchived', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.plants.autoGenerateTasks')}
                            description={t('settingsView.plants.autoGenerateTasksDesc')}
                        >
                            <Switch
                                checked={plantViewSettings.autoGenerateTasks}
                                onChange={(val) =>
                                    handleSetSetting('plantsView.autoGenerateTasks', val)
                                }
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.plants.behavior')}
                    icon={<PhosphorIcons.GameController />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.plants.pestPressure')}
                            description={t('settingsView.plants.pestPressureDesc')}
                        >
                            <RangeSlider
                                singleValue
                                value={simSettings.pestPressure}
                                onChange={(v) => handleSetSetting('simulation.pestPressure', v)}
                                min={0}
                                max={1}
                                step={0.05}
                                label=""
                                unit=""
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.plants.nutrientSensitivity')}
                            description={t('settingsView.plants.nutrientSensitivityDesc')}
                        >
                            <RangeSlider
                                singleValue
                                value={simSettings.nutrientSensitivity}
                                onChange={(v) =>
                                    handleSetSetting('simulation.nutrientSensitivity', v)
                                }
                                min={0.5}
                                max={1.5}
                                step={0.05}
                                label=""
                                unit="x"
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.plants.environmentalStability')}
                            description={t('settingsView.plants.environmentalStabilityDesc')}
                        >
                            <RangeSlider
                                singleValue
                                value={simSettings.environmentalStability}
                                onChange={(v) =>
                                    handleSetSetting('simulation.environmentalStability', v)
                                }
                                min={0.5}
                                max={1}
                                step={0.05}
                                label=""
                                unit=""
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.plants.calibration')}
                    icon={<PhosphorIcons.Globe />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.plants.altitudeM')}
                            description={t('settingsView.plants.altitudeMDesc')}
                        >
                            <RangeSlider
                                singleValue
                                value={simSettings.altitudeM}
                                onChange={(v) => handleSetSetting('simulation.altitudeM', v)}
                                min={0}
                                max={3000}
                                step={50}
                                label=""
                                unit="m"
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.plants.leafTemperatureOffset')}
                            description={t('settingsView.plants.leafTemperatureOffsetDesc')}
                        >
                            <RangeSlider
                                singleValue
                                value={simSettings.leafTemperatureOffset}
                                onChange={(v) =>
                                    handleSetSetting('simulation.leafTemperatureOffset', v)
                                }
                                min={-5}
                                max={5}
                                step={0.5}
                                label=""
                                unit="°C"
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            {simSettings.simulationProfile === 'expert' && (
                <Card>
                    <FormSection
                        title={t('settingsView.plants.physics')}
                        icon={<PhosphorIcons.Flask />}
                        defaultOpen
                    >
                        <div className="sm:col-span-2 space-y-6">
                            <SettingsRow
                                label={t('settingsView.plants.lightExtinctionCoefficient')}
                                description={t(
                                    'settingsView.plants.lightExtinctionCoefficientDesc',
                                )}
                            >
                                <RangeSlider
                                    singleValue
                                    value={simSettings.lightExtinctionCoefficient}
                                    onChange={(v) =>
                                        handleSetSetting('simulation.lightExtinctionCoefficient', v)
                                    }
                                    min={0.4}
                                    max={1.0}
                                    step={0.05}
                                    label=""
                                    unit="k"
                                />
                            </SettingsRow>
                            <SettingsRow
                                label={t('settingsView.plants.nutrientConversionEfficiency')}
                                description={t(
                                    'settingsView.plants.nutrientConversionEfficiencyDesc',
                                )}
                            >
                                <RangeSlider
                                    singleValue
                                    value={simSettings.nutrientConversionEfficiency}
                                    onChange={(v) =>
                                        handleSetSetting(
                                            'simulation.nutrientConversionEfficiency',
                                            v,
                                        )
                                    }
                                    min={0.2}
                                    max={0.8}
                                    step={0.05}
                                    label=""
                                    unit=""
                                />
                            </SettingsRow>
                            <SettingsRow
                                label={t('settingsView.plants.stomataSensitivity')}
                                description={t('settingsView.plants.stomataSensitivityDesc')}
                            >
                                <RangeSlider
                                    singleValue
                                    value={simSettings.stomataSensitivity}
                                    onChange={(v) =>
                                        handleSetSetting('simulation.stomataSensitivity', v)
                                    }
                                    min={0.5}
                                    max={1.5}
                                    step={0.05}
                                    label=""
                                    unit="x"
                                />
                            </SettingsRow>
                        </div>
                    </FormSection>
                </Card>
            )}

            <Card>
                <FormSection
                    title={t('settingsView.plants.autoJournaling')}
                    icon={<PhosphorIcons.BookBookmark />}
                >
                    <div className="sm:col-span-2 space-y-4">
                        <SettingsRow label={t('settingsView.plants.logStageChanges')}>
                            <Switch
                                checked={simSettings.autoJournaling.logStageChanges}
                                onChange={(val) =>
                                    handleSetSetting(
                                        'simulation.autoJournaling.logStageChanges',
                                        val,
                                    )
                                }
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.plants.logProblems')}>
                            <Switch
                                checked={simSettings.autoJournaling.logProblems}
                                onChange={(val) =>
                                    handleSetSetting('simulation.autoJournaling.logProblems', val)
                                }
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.plants.logTasks')}>
                            <Switch
                                checked={simSettings.autoJournaling.logTasks}
                                onChange={(val) =>
                                    handleSetSetting('simulation.autoJournaling.logTasks', val)
                                }
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
        </div>
    )
}


export default PlantsSettingsTab
