import React, { memo, useState, useMemo, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { AppSettings, Language, Theme, View } from '@/types'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { setSetting, exportAllData, resetAllData } from '@/stores/slices/settingsSlice'
import { setOnboardingStep } from '@/stores/slices/uiSlice'
import { clearArchives } from '@/stores/slices/archivesSlice'
import { Switch } from '@/components/common/Switch'
import { Select, Input, FormSection } from '@/components/ui/ThemePrimitives'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { RangeSlider } from '@/components/common/RangeSlider'
import { Button } from '@/components/common/Button'
import { useStorageEstimate } from '@/hooks/useStorageEstimate'
import { Card } from '@/components/common/Card'
import { SettingsSubNav } from './SettingsSubNav'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'

const AboutTab = lazy(() => import('./AboutTab'))
const StrainsSettingsTab = lazy(() => import('./StrainsSettingsTab'))
const VoiceSettingsTab = lazy(() => import('./VoiceSettingsTab'))
const DataManagementTab = lazy(() => import('./DataManagementTab'))

const SettingsRow: React.FC<{
    label: string
    description?: string
    children: React.ReactNode
}> = ({ label, description, children }) => (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 border-b border-slate-700/50 pb-4 last:border-b-0 last:pb-0 last:mb-0">
        <div className="min-w-0">
            <h4 className="font-semibold text-slate-100">{label}</h4>
            {description && <p className="text-sm text-slate-400">{description}</p>}
        </div>
        <div className="w-full flex-shrink-0 sm:w-auto sm:max-w-xs">{children}</div>
    </div>
)

const GeneralSettingsTab: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const settings = useAppSelector(selectSettings);
    const general = settings.general;

    const handleSetSetting = (path: string, value: any) => {
        dispatch(setSetting({ path: `general.${path}`, value }));
    };

    const colorblindModeOptions = Object.keys(t('settingsView.general.colorblindModes', { returnObjects: true })).map(key => ({
        value: key,
        label: t(`settingsView.general.colorblindModes.${key}`)
    }));

    return (
        <div className="space-y-6">
            <Card>
                <FormSection title={t('settingsView.categories.lookAndFeel')} icon={<PhosphorIcons.Cube />} defaultOpen>
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow label={t('settingsView.general.language')}><Select value={general.language} onChange={(e) => handleSetSetting('language', e.target.value as Language)} options={[{ value: 'en', label: t('settingsView.languages.en') }, { value: 'de', label: t('settingsView.languages.de') }]} /></SettingsRow>
                        <SettingsRow label={t('settingsView.general.theme')}><Select value={general.theme} onChange={(e) => handleSetSetting('theme', e.target.value as Theme)} options={Object.keys(t('settingsView.general.themes', { returnObjects: true })).map((key) => ({ value: key, label: t(`settingsView.general.themes.${key}`) }))} /></SettingsRow>
                        <SettingsRow label={t('settingsView.general.fontSize')}><SegmentedControl value={[general.fontSize]} onToggle={(val) => handleSetSetting('fontSize', val)} options={Object.keys(t('settingsView.general.fontSizes', { returnObjects: true })).map(k => ({ value: k, label: t(`settingsView.general.fontSizes.${k}`) }))} /></SettingsRow>
                    </div>
                </FormSection>
            </Card>
            <Card>
                <FormSection title={t('settingsView.categories.interactivity')} icon={<PhosphorIcons.GameController />} defaultOpen>
                     <div className="sm:col-span-2 space-y-6">
                         <SettingsRow label={t('settingsView.general.uiDensity')}><SegmentedControl value={[general.uiDensity]} onToggle={(val) => handleSetSetting('uiDensity', val)} options={[{ value: 'comfortable', label: t('settingsView.general.uiDensities.comfortable') }, { value: 'compact', label: t('settingsView.general.uiDensities.compact') }]} /></SettingsRow>
                        <SettingsRow label={t('settingsView.general.expertModeTitle')} description={t('settingsView.general.expertModeDesc')}><Switch checked={general.expertMode} onChange={(val) => handleSetSetting('expertMode', val)}/></SettingsRow>
                        <SettingsRow label={t('settingsView.general.defaultView')}><Select value={general.defaultView} onChange={(e) => handleSetSetting('defaultView', e.target.value as View)} options={[{ value: View.Plants, label: t('nav.plants') }, { value: View.Strains, label: t('nav.strains') }, { value: View.Equipment, label: t('nav.equipment') }, { value: View.Knowledge, label: t('nav.knowledge') },]} /></SettingsRow>
                    </div>
                </FormSection>
            </Card>
             <Card>
                <FormSection title={t('settingsView.categories.accessibility')} icon={<PhosphorIcons.Person />} defaultOpen>
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow label={t('settingsView.general.dyslexiaFont')} description={t('settingsView.general.dyslexiaFontDesc')}>
                            <Switch checked={general.dyslexiaFont} onChange={val => handleSetSetting('dyslexiaFont', val)} />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.general.reducedMotion')} description={t('settingsView.general.reducedMotionDesc')}>
                            <Switch checked={general.reducedMotion} onChange={val => handleSetSetting('reducedMotion', val)} />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.general.colorblindMode')} description={t('settingsView.general.colorblindModeDesc')}>
                            <Select value={general.colorblindMode} onChange={(e) => handleSetSetting('colorblindMode', e.target.value)} options={colorblindModeOptions} />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
        </div>
    );
};


const PlantsSettingsTab: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const settings = useAppSelector(selectSettings);
    const simSettings = settings.simulation;

    const handleSetSetting = (path: string, value: any) => {
        dispatch(setSetting({ path, value }));
    };

    return (
        <div className="space-y-6">
            <Card>
                <FormSection title={t('settingsView.plants.behavior')} icon={<PhosphorIcons.GameController />} defaultOpen>
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow label={t('settingsView.plants.simulationProfile')}><SegmentedControl value={[simSettings.simulationProfile]} onToggle={(val) => handleSetSetting('simulation.simulationProfile', val)} options={Object.keys(t('settingsView.plants.simulationProfiles', { returnObjects: true })).map(k => ({ value: k, label: t(`settingsView.plants.simulationProfiles.${k}`) }))} /></SettingsRow>
                        <SettingsRow label={t('settingsView.plants.pestPressure')} description={t('settingsView.plants.pestPressureDesc')}><RangeSlider singleValue value={simSettings.pestPressure} onChange={v => handleSetSetting('simulation.pestPressure', v)} min={0} max={1} step={0.05} label="" unit="" /></SettingsRow>
                        <SettingsRow label={t('settingsView.plants.nutrientSensitivity')} description={t('settingsView.plants.nutrientSensitivityDesc')}><RangeSlider singleValue value={simSettings.nutrientSensitivity} onChange={v => handleSetSetting('simulation.nutrientSensitivity', v)} min={0.5} max={1.5} step={0.05} label="" unit="x" /></SettingsRow>
                        <SettingsRow label={t('settingsView.plants.environmentalStability')} description={t('settingsView.plants.environmentalStabilityDesc')}><RangeSlider singleValue value={simSettings.environmentalStability} onChange={v => handleSetSetting('simulation.environmentalStability', v)} min={0.5} max={1} step={0.05} label="" unit="" /></SettingsRow>
                    </div>
                </FormSection>
            </Card>

            {simSettings.simulationProfile === 'expert' && (
                <Card>
                    <FormSection title={t('settingsView.plants.physics')} icon={<PhosphorIcons.Flask />} defaultOpen>
                        <div className="sm:col-span-2 space-y-6">
                            <SettingsRow label={t('settingsView.plants.leafTemperatureOffset')} description={t('settingsView.plants.leafTemperatureOffsetDesc')}><RangeSlider singleValue value={simSettings.leafTemperatureOffset} onChange={v => handleSetSetting('simulation.leafTemperatureOffset', v)} min={-5} max={5} step={0.5} label="" unit="°C" /></SettingsRow>
                            <SettingsRow label={t('settingsView.plants.lightExtinctionCoefficient')} description={t('settingsView.plants.lightExtinctionCoefficientDesc')}><RangeSlider singleValue value={simSettings.lightExtinctionCoefficient} onChange={v => handleSetSetting('simulation.lightExtinctionCoefficient', v)} min={0.4} max={1.0} step={0.05} label="" unit="k" /></SettingsRow>
                            <SettingsRow label={t('settingsView.plants.nutrientConversionEfficiency')} description={t('settingsView.plants.nutrientConversionEfficiencyDesc')}><RangeSlider singleValue value={simSettings.nutrientConversionEfficiency} onChange={v => handleSetSetting('simulation.nutrientConversionEfficiency', v)} min={0.2} max={0.8} step={0.05} label="" unit="" /></SettingsRow>
                            <SettingsRow label={t('settingsView.plants.stomataSensitivity')} description={t('settingsView.plants.stomataSensitivityDesc')}><RangeSlider singleValue value={simSettings.stomataSensitivity} onChange={v => handleSetSetting('simulation.stomataSensitivity', v)} min={0.5} max={1.5} step={0.05} label="" unit="x" /></SettingsRow>
                        </div>
                    </FormSection>
                </Card>
            )}

            <Card>
                <FormSection title={t('settingsView.plants.autoJournaling')} icon={<PhosphorIcons.BookBookmark/>}>
                    <div className="sm:col-span-2 space-y-4">
                        <SettingsRow label={t('settingsView.plants.logStageChanges')}><Switch checked={simSettings.autoJournaling.logStageChanges} onChange={(val) => handleSetSetting('simulation.autoJournaling.logStageChanges', val)}/></SettingsRow>
                        <SettingsRow label={t('settingsView.plants.logProblems')}><Switch checked={simSettings.autoJournaling.logProblems} onChange={(val) => handleSetSetting('simulation.autoJournaling.logProblems', val)}/></SettingsRow>
                    </div>
                </FormSection>
            </Card>
        </div>
    );
};


const SettingsViewComponent: React.FC = () => {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState('general');
    
    const viewIcons = useMemo(() => ({
        general: <PhosphorIcons.GearSix className="w-16 h-16 mx-auto text-primary-400" />,
        tts: <PhosphorIcons.SpeakerHigh className="w-16 h-16 mx-auto text-accent-400" />,
        strains: <PhosphorIcons.Leafy className="w-16 h-16 mx-auto text-green-400" />,
        plants: <PhosphorIcons.Plant className="w-16 h-16 mx-auto text-green-400" />,
        data: <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-orange-400" />,
        about: <PhosphorIcons.Info className="w-16 h-16 mx-auto text-cyan-400" />,
    }), []);

    const viewTitles = useMemo(() => ({
        general: t('settingsView.categories.general'),
        tts: t('settingsView.categories.tts'),
        strains: t('settingsView.categories.strains'),
        plants: t('settingsView.categories.plants'),
        data: t('settingsView.categories.data'),
        about: t('settingsView.categories.about'),
    }), [t]);


    const renderContent = () => {
        switch (activeTab) {
            case 'general': return <GeneralSettingsTab />;
            case 'tts': return (
                <Suspense fallback={<Card><SkeletonLoader count={3} /></Card>}>
                    <VoiceSettingsTab />
                </Suspense>
            );
            case 'strains': return (
                <Suspense fallback={<Card><SkeletonLoader count={3} /></Card>}>
                    <StrainsSettingsTab />
                </Suspense>
            );
            case 'plants': return (
                <PlantsSettingsTab />
            );
            case 'data': return (
                <Suspense fallback={<Card><SkeletonLoader count={3} /></Card>}>
                    <DataManagementTab />
                </Suspense>
            );
            case 'about': return (
                 <Suspense fallback={<Card><SkeletonLoader count={3} /></Card>}>
                    <AboutTab />
                </Suspense>
            );
            default: return null;
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="text-center mb-6 animate-fade-in">
                {viewIcons[activeTab as keyof typeof viewIcons]}
                <h2 className="text-3xl font-bold font-display text-slate-100 mt-2">{viewTitles[activeTab as keyof typeof viewTitles]}</h2>
            </div>
            
            <SettingsSubNav activeTab={activeTab} onTabChange={setActiveTab} />
            
            <main className="animate-fade-in">
                {renderContent()}
            </main>
        </div>
    )
}

export const SettingsView = memo(SettingsViewComponent)
export default SettingsView
