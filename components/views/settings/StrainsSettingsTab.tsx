import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectSettings } from '@/stores/selectors';
import { setSetting } from '@/stores/slices/settingsSlice';
import { Switch } from '@/components/common/Switch';
import { Select, FormSection } from '@/components/ui/ThemePrimitives';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { RangeSlider } from '@/components/common/RangeSlider';
import { SortKey, SortDirection } from '@/types';


const SettingsRow: React.FC<{
    label: string
    description?: string
    children: React.ReactNode
}> = ({ label, description, children }) => (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
            <h4 className="font-semibold text-slate-100">{label}</h4>
            {description && <p className="text-sm text-slate-400">{description}</p>}
        </div>
        <div className="w-full flex-shrink-0 sm:w-auto sm:max-w-xs">{children}</div>
    </div>
)

const StrainsSettingsTab: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const settings = useAppSelector(selectSettings);
    const strainsViewSettings = settings.strainsView;

    const handleSetSetting = (path: string, value: any) => {
        dispatch(setSetting({ path, value }))
    }

    const sortKeyOptions = Object.keys(t('settingsView.strains.sortKeys', { returnObjects: true })).map(key => ({
        value: key as SortKey,
        label: t(`settingsView.strains.sortKeys.${key}`)
    }));
    
    const sortDirectionOptions = Object.keys(t('settingsView.strains.sortDirections', { returnObjects: true })).map(key => ({
        value: key as SortDirection,
        label: t(`settingsView.strains.sortDirections.${key}`)
    }));
    
    const visibleColumns = strainsViewSettings.visibleColumns || [];

    const handleColumnToggle = (column: string) => {
        const newColumns = visibleColumns.includes(column)
            ? visibleColumns.filter(c => c !== column)
            : [...visibleColumns, column];
        handleSetSetting('strainsView.visibleColumns', newColumns);
    };

    return (
        <div className="space-y-6">
            <Card>
                <FormSection title={t('settingsView.strains.defaults.title')} icon={<PhosphorIcons.ListChecks/>} defaultOpen>
                    <div className="sm:col-span-2 space-y-4">
                        <SettingsRow label={t('settingsView.strains.defaultSort')}>
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={strainsViewSettings.defaultSortKey} onChange={(e) => handleSetSetting('strainsView.defaultSortKey', e.target.value)} options={sortKeyOptions} />
                                <Select value={strainsViewSettings.defaultSortDirection} onChange={(e) => handleSetSetting('strainsView.defaultSortDirection', e.target.value)} options={sortDirectionOptions} />
                            </div>
                        </SettingsRow>
                         <SettingsRow label={t('settingsView.strains.defaultViewMode')}>
                            <SegmentedControl
                                value={[strainsViewSettings.defaultViewMode]}
                                onToggle={(val) => handleSetSetting('strainsView.defaultViewMode', val)}
                                options={[{ value: 'list', label: t('strainsView.viewModes.list') }, { value: 'grid', label: t('strainsView.viewModes.grid') }]}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.strains.defaults.prioritizeTitle')} description={t('settingsView.strains.defaults.prioritizeDesc')}>
                            <Switch checked={strainsViewSettings.prioritizeUserStrains} onChange={val => handleSetSetting('strainsView.prioritizeUserStrains', val)} />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            <Card>
                 <FormSection title={t('settingsView.strains.listView.title')} icon={<PhosphorIcons.ListBullets/>} defaultOpen>
                     <div className="sm:col-span-2 space-y-4">
                        <p className="text-sm text-slate-400 -mt-2 mb-2">{t('settingsView.strains.listView.description')}</p>
                        {Object.keys(t('settingsView.strains.columns', { returnObjects: true })).map(col => (
                            <SettingsRow key={col} label={t(`settingsView.strains.columns.${col}`)}>
                                <Switch checked={visibleColumns.includes(col)} onChange={() => handleColumnToggle(col)} />
                            </SettingsRow>
                        ))}
                     </div>
                </FormSection>
            </Card>
            
            <Card>
                <FormSection title={t('settingsView.strains.advanced.title')} icon={<PhosphorIcons.Brain/>}>
                    <div className="sm:col-span-2 space-y-6">
                         <SettingsRow label={t('settingsView.strains.advanced.genealogyLayout')}>
                            <SegmentedControl
                                value={[strainsViewSettings.genealogyDefaultLayout]}
                                onToggle={(val) => handleSetSetting('strainsView.genealogyDefaultLayout', val)}
                                options={[{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }]}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.strains.advanced.genealogyDepth')}>
                             <RangeSlider singleValue value={strainsViewSettings.genealogyDefaultDepth} onChange={val => handleSetSetting('strainsView.genealogyDefaultDepth', val)} min={1} max={5} step={1} label="" unit="" />
                        </SettingsRow>
                         <SettingsRow label={t('settingsView.strains.advanced.aiTipsExperience')}>
                             <Select
                                value={strainsViewSettings.aiTipsDefaultExperience}
                                onChange={(e) => handleSetSetting('strainsView.aiTipsDefaultExperience', e.target.value)}
                                options={Object.keys(t('strainsView.tips.form.experienceOptions', { returnObjects: true })).map(k => ({ value: k, label: t(`strainsView.tips.form.experienceOptions.${k}`) }))}
                            />
                        </SettingsRow>
                         <SettingsRow label={t('settingsView.strains.advanced.aiTipsFocus')}>
                              <Select
                                value={strainsViewSettings.aiTipsDefaultFocus}
                                onChange={(e) => handleSetSetting('strainsView.aiTipsDefaultFocus', e.target.value)}
                                options={Object.keys(t('strainsView.tips.form.focusOptions', { returnObjects: true })).map(k => ({ value: k, label: t(`strainsView.tips.form.focusOptions.${k}`) }))}
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

        </div>
    );
};

export default StrainsSettingsTab;