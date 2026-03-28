import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { setSetting } from '@/stores/slices/settingsSlice'
import { Switch } from '@/components/common/Switch'
import { FormSection } from '@/components/ui/form'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { RangeSlider } from '@/components/common/RangeSlider'
import { SortKey, SortDirection } from '@/types'
import { SettingsRow, SettingsSelect } from './SettingsShared'

const StrainsSettingsTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const strainsViewSettings = settings.strainsView

    const handleSetSetting = (path: string, value: unknown) => {
        dispatch(setSetting({ path, value }))
    }

    const sortKeyOptions = Object.keys(
        t('settingsView.strains.sortKeys', { returnObjects: true }),
    ).map((key) => ({
        value: key as SortKey,
        label: t(`settingsView.strains.sortKeys.${key}`),
    }))

    const sortDirectionOptions = Object.keys(
        t('settingsView.strains.sortDirections', { returnObjects: true }),
    ).map((key) => ({
        value: key as SortDirection,
        label: t(`settingsView.strains.sortDirections.${key}`),
    }))

    const visibleColumns = strainsViewSettings.visibleColumns || []

    const handleColumnToggle = (column: string) => {
        const newColumns = visibleColumns.includes(column)
            ? visibleColumns.filter((c) => c !== column)
            : [...visibleColumns, column]
        handleSetSetting('strainsView.visibleColumns', newColumns)
    }

    return (
        <div className="space-y-6">
            <Card>
                <FormSection
                    title={t('settingsView.strains.defaults.title')}
                    icon={<PhosphorIcons.ListChecks />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-4">
                        <SettingsRow label={t('settingsView.strains.defaultSort')}>
                            <div className="grid grid-cols-2 gap-2">
                                <SettingsSelect
                                    value={strainsViewSettings.defaultSortKey}
                                    onChange={(value) =>
                                        handleSetSetting('strainsView.defaultSortKey', value)
                                    }
                                    options={sortKeyOptions as { value: string; label: string }[]}
                                />
                                <SettingsSelect
                                    value={strainsViewSettings.defaultSortDirection}
                                    onChange={(value) =>
                                        handleSetSetting('strainsView.defaultSortDirection', value)
                                    }
                                    options={
                                        sortDirectionOptions as { value: string; label: string }[]
                                    }
                                />
                            </div>
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.strains.defaultViewMode')}>
                            <SegmentedControl
                                value={[strainsViewSettings.defaultViewMode]}
                                onToggle={(val) =>
                                    handleSetSetting('strainsView.defaultViewMode', val)
                                }
                                options={[
                                    { value: 'list', label: t('strainsView.viewModes.list') },
                                    { value: 'grid', label: t('strainsView.viewModes.grid') },
                                ]}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.strains.defaults.prioritizeTitle')}
                            description={t('settingsView.strains.defaults.prioritizeDesc')}
                        >
                            <Switch
                                checked={strainsViewSettings.prioritizeUserStrains}
                                onChange={(val) =>
                                    handleSetSetting('strainsView.prioritizeUserStrains', val)
                                }
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.strains.listView.title')}
                    icon={<PhosphorIcons.ListBullets />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-4">
                        <p className="text-sm text-slate-400 -mt-2 mb-2">
                            {t('settingsView.strains.listView.description')}
                        </p>
                        {Object.keys(
                            t('settingsView.strains.columns', { returnObjects: true }),
                        ).map((col) => (
                            <SettingsRow key={col} label={t(`settingsView.strains.columns.${col}`)}>
                                <Switch
                                    checked={visibleColumns.includes(col)}
                                    onChange={() => handleColumnToggle(col)}
                                />
                            </SettingsRow>
                        ))}
                    </div>
                </FormSection>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.strains.advanced.title')}
                    icon={<PhosphorIcons.Brain />}
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow label={t('settingsView.strains.advanced.genealogyLayout')}>
                            <SegmentedControl
                                value={[strainsViewSettings.genealogyDefaultLayout]}
                                onToggle={(val) =>
                                    handleSetSetting('strainsView.genealogyDefaultLayout', val)
                                }
                                options={[
                                    { value: 'horizontal', label: 'Horizontal' },
                                    { value: 'vertical', label: 'Vertical' },
                                ]}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.strains.advanced.genealogyDepth')}>
                            <RangeSlider
                                singleValue
                                value={strainsViewSettings.genealogyDefaultDepth}
                                onChange={(val) =>
                                    handleSetSetting('strainsView.genealogyDefaultDepth', val)
                                }
                                min={1}
                                max={5}
                                step={1}
                                label=""
                                unit=""
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.strains.advanced.aiTipsExperience')}>
                            <SettingsSelect
                                value={strainsViewSettings.aiTipsDefaultExperience}
                                onChange={(value) =>
                                    handleSetSetting('strainsView.aiTipsDefaultExperience', value)
                                }
                                options={Object.keys(
                                    t('strainsView.tips.form.experienceOptions', {
                                        returnObjects: true,
                                    }),
                                ).map((k) => ({
                                    value: k,
                                    label: t(`strainsView.tips.form.experienceOptions.${k}`),
                                }))}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.strains.advanced.aiTipsFocus')}>
                            <SettingsSelect
                                value={strainsViewSettings.aiTipsDefaultFocus}
                                onChange={(value) =>
                                    handleSetSetting('strainsView.aiTipsDefaultFocus', value)
                                }
                                options={Object.keys(
                                    t('strainsView.tips.form.focusOptions', {
                                        returnObjects: true,
                                    }),
                                ).map((k) => ({
                                    value: k,
                                    label: t(`strainsView.tips.form.focusOptions.${k}`),
                                }))}
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
        </div>
    )
}

export default StrainsSettingsTab
