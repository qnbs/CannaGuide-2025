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
import { useAvailableVoices } from '@/hooks/useAvailableVoices'
import { useStorageEstimate } from '@/hooks/useStorageEstimate'
import { Card } from '@/components/common/Card'
import { SettingsSubNav } from './SettingsSubNav'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'

const AboutTab = lazy(() => import('./AboutTab'))
const StrainsSettingsTab = lazy(() => import('./StrainsSettingsTab'))

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

const parseSize = (sizeStr: string): number => {
    if (!sizeStr) return 0
    const parts = sizeStr.split(' ')
    if (parts.length < 2) return 0
    const value = parseFloat(parts[0])
    const unit = parts[1].toUpperCase()
    switch (unit) {
        case 'GB':
            return value * 1024 * 1024 * 1024
        case 'MB':
            return value * 1024 * 1024
        case 'KB':
            return value * 1024
        case 'BYTES':
            return value
        default:
            return 0
    }
}

const StorageBar: React.FC<{ labelKey: string; size: string; percentage: number; color: string }> =
    ({ labelKey, size, percentage, color }) => {
        const { t } = useTranslation()
        return (
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-300">
                        {t(`settingsView.data.storageBreakdown.${labelKey}`)}
                    </span>
                    <span className="font-mono text-slate-400">{size}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                        className={`${color} h-2 rounded-full`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        )
    }

const CommandItem: React.FC<{ icon: React.ReactNode, text: string }> = ({ icon, text }) => (
    <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-md">
        <div className="w-5 h-5 text-primary-300 flex-shrink-0">{icon}</div>
        <code className="text-sm text-slate-300">{text}</code>
    </div>
);

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
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const availableVoices = useAvailableVoices()
    const { estimates, isLoading: isStorageLoading } = useStorageEstimate()
    const [activeTab, setActiveTab] = useState('general');

    const handleSetSetting = (path: string, value: any) => {
        dispatch(setSetting({ path, value }))
    }
    
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

    const totalBytes = useMemo(
        () =>
            Object.values(estimates).reduce((sum: number, sizeStr) => sum + parseSize(sizeStr as string), 0),
        [estimates],
    )
    const storageColors = [ 'bg-primary-500', 'bg-accent-500', 'bg-secondary-500', 'bg-yellow-500', 'bg-cyan-500', ];
    
    const COMMANDS = {
        navigation: [
            { icon: <PhosphorIcons.Plant/>, text: t('settingsView.tts.commands.goTo', { view: t('nav.plants')}) },
            { icon: <PhosphorIcons.Leafy/>, text: t('settingsView.tts.commands.goTo', { view: t('nav.strains')}) },
            { icon: <PhosphorIcons.Wrench/>, text: t('settingsView.tts.commands.goTo', { view: t('nav.equipment')}) },
        ],
        strains: [
            { icon: <PhosphorIcons.MagnifyingGlass/>, text: t('settingsView.tts.commands.searchFor')},
            { icon: <PhosphorIcons.FunnelSimple/>, text: t('settingsView.tts.commands.resetFilters')},
            { icon: <PhosphorIcons.Heart/>, text: t('settingsView.tts.commands.showFavorites')},
        ],
        plants: [
             { icon: <PhosphorIcons.Drop/>, text: t('settingsView.tts.commands.waterAll')},
        ]
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'general': return (
                <Card><div className="space-y-6">
                    <SettingsRow label={t('settingsView.general.language')}>
                        <Select value={settings.general.language} onChange={(e) => handleSetSetting('general.language', e.target.value as Language)} options={[{ value: 'en', label: t('settingsView.languages.en') }, { value: 'de', label: t('settingsView.languages.de') }]}/>
                    </SettingsRow>
                    <SettingsRow label={t('settingsView.general.theme')}>
                        <Select value={settings.general.theme} onChange={(e) => handleSetSetting('general.theme', e.target.value as Theme)} options={Object.keys(t('settingsView.general.themes', { returnObjects: true })).map((key) => ({ value: key, label: t(`settingsView.general.themes.${key}`) }))}/>
                    </SettingsRow>
                    <SettingsRow label={t('settingsView.general.defaultView')}>
                        <Select
                            value={settings.general.defaultView}
                            onChange={(e) => handleSetSetting('general.defaultView', e.target.value as View)}
                            options={[
                                { value: View.Plants, label: t('nav.plants') },
                                { value: View.Strains, label: t('nav.strains') },
                                { value: View.Equipment, label: t('nav.equipment') },
                                { value: View.Knowledge, label: t('nav.knowledge') },
                            ]}
                        />
                    </SettingsRow>
                    <SettingsRow label={t('settingsView.general.uiDensity')}>
                        <SegmentedControl
                            value={[settings.general.uiDensity]}
                            onToggle={(val) => handleSetSetting('general.uiDensity', val)}
                            options={[
                                { value: 'comfortable', label: t('settingsView.general.uiDensities.comfortable') },
                                { value: 'compact', label: t('settingsView.general.uiDensities.compact') }
                            ]}
                        />
                    </SettingsRow>
                </div></Card>
            );
            case 'tts': return (
                 <div className="space-y-6">
                    <Card>
                        <FormSection title={t('settingsView.tts.ttsOutput')} icon={<PhosphorIcons.SpeakerHigh/>} defaultOpen>
                            <div className="sm:col-span-2 space-y-6">
                                <SettingsRow label={t('settingsView.tts.ttsEnabled')} description={t('settingsView.tts.ttsEnabledDesc')}><Switch checked={settings.tts.enabled} onChange={(val) => handleSetSetting('tts.enabled', val)}/></SettingsRow>
                                <SettingsRow label={t('settingsView.tts.voice')}><Select value={settings.tts.voiceName || ''} onChange={(e) => handleSetSetting('tts.voiceName', e.target.value)} options={ availableVoices.length > 0 ? availableVoices.map((v) => ({ value: v.name, label: v.name })) : [{ value: '', label: t('settingsView.tts.noVoices') }] } disabled={!settings.tts.enabled || availableVoices.length === 0}/></SettingsRow>
                                <SettingsRow label={t('settingsView.tts.rate')}><RangeSlider singleValue value={settings.tts.rate} onChange={v => handleSetSetting('tts.rate', v)} min={0.5} max={2} step={0.1} label="" unit="x" /></SettingsRow>
                                <SettingsRow label={t('settingsView.tts.pitch')}><RangeSlider singleValue value={settings.tts.pitch} onChange={v => handleSetSetting('tts.pitch', v)} min={0.5} max={2} step={0.1} label="" unit="x" /></SettingsRow>
                                <SettingsRow label={t('settingsView.tts.volume')}><RangeSlider singleValue value={settings.tts.volume} onChange={v => handleSetSetting('tts.volume', v)} min={0} max={1} step={0.1} label="" unit="" /></SettingsRow>
                                <SettingsRow label={t('settingsView.tts.highlightSpeakingText')} description={t('settingsView.tts.highlightSpeakingTextDesc')}><Switch checked={settings.tts.highlightSpeakingText} onChange={(val) => handleSetSetting('tts.highlightSpeakingText', val)}/></SettingsRow>
                            </div>
                        </FormSection>
                    </Card>
                     <Card>
                        <FormSection title={t('settingsView.tts.voiceControlInput')} icon={<PhosphorIcons.Microphone/>} defaultOpen>
                            <div className="sm:col-span-2 space-y-6">
                                <SettingsRow label={t('settingsView.tts.voiceControl.enabled')} description={t('settingsView.tts.voiceControl.enabledDesc')}><Switch checked={settings.voiceControl.enabled} onChange={(val) => handleSetSetting('voiceControl.enabled', val)}/></SettingsRow>
                            </div>
                        </FormSection>
                    </Card>
                    <Card>
                        <FormSection title={t('settingsView.tts.commands.title')} icon={<PhosphorIcons.CommandLine/>}>
                            <div className="sm:col-span-2 space-y-4">
                                <p className="text-sm text-slate-400 -mt-2">{t('settingsView.tts.commands.description')}</p>
                                {Object.entries(COMMANDS).map(([group, commands]) => (
                                    <div key={group}>
                                        <h5 className="font-semibold text-slate-200 capitalize mb-2">{t(`settingsView.tts.commands.groups.${group}`)}</h5>
                                        <div className="space-y-2">
                                            {commands.map(cmd => <CommandItem key={cmd.text} icon={cmd.icon} text={cmd.text} />)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FormSection>
                    </Card>
                </div>
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
                <Card><div className="space-y-6">
                    <SettingsRow label={t('settingsView.data.storageUsage')}>
                        <div className="w-full space-y-2">{isStorageLoading ? 'Calculating...' : Object.entries(estimates).map(([key, sizeStr], index) => { const bytes = parseSize(sizeStr as string); const percentage = totalBytes > 0 ? (bytes / totalBytes) * 100 : 0; return ( <StorageBar key={key} labelKey={key} size={sizeStr as string} percentage={percentage} color={storageColors[index % storageColors.length]}/> ) })}</div>
                    </SettingsRow>
                    <SettingsRow label={t('settingsView.data.exportAll')}><Button className="w-full sm:w-auto justify-center" onClick={() => dispatch(exportAllData())}>{t('settingsView.data.exportAsJson')}</Button></SettingsRow>
                    <SettingsRow label={t('settingsView.data.clearArchives')} description={t('settingsView.data.clearArchivesDesc')}><Button className="w-full sm:w-auto justify-center" variant="danger" onClick={() => { if (window.confirm(t('settingsView.data.clearArchivesConfirm') as string)) { dispatch(clearArchives()) } }}>{t('settingsView.data.clearArchives')}</Button></SettingsRow>
                    <SettingsRow label={t('settingsView.data.resetAll')}><Button className="w-full sm:w-auto justify-center" variant="danger" onClick={() => { if (window.confirm(t('settingsView.data.resetAllConfirm') as string)) { dispatch(resetAllData()) } }}>{t('settingsView.data.resetAll')}</Button></SettingsRow>
                </div></Card>
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