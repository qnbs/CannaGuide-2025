import React, { useState, useId, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { AppSettings, Language, Theme, View, UiDensity } from '@/types';
import { Switch } from '@/components/common/Switch';
import { useAppDispatch, useAppSelector, RootState } from '@/stores/store';
import {
    setSetting,
    exportAllData,
    resetAllData,
    setSimulationProfile,
    toggleSetting,
    updateAccessibilitySettings,
    updateTtsSettings,
} from '@/stores/slices/settingsSlice';
import { addNotification, setOnboardingStep } from '@/stores/slices/uiSlice';
import { resetPlants as resetPlantsAction } from '@/stores/slices/simulationSlice';
import { FlagDE, FlagEN } from '@/components/icons/Flags';
import { Select } from '@/components/ui/ThemePrimitives';
import { useStorageEstimate } from '@/hooks/useStorageEstimate';
import { clearArchives } from '@/stores/slices/archivesSlice';
import { useAvailableVoices } from '@/hooks/useAvailableVoices';
import { i18nInstance } from '@/i18n';
import { APP_VERSION } from '@/services/migrationLogic';
import { selectSettings } from '@/stores/selectors';

// --- SUB-COMPONENTS ---

const SettingsSection: React.FC<{
    title: string;
    children: React.ReactNode;
    icon: React.ReactNode;
    defaultOpen?: boolean;
}> = memo(({ title, children, icon, defaultOpen = false }) => (
    <details open={defaultOpen} className="group">
        <summary className="list-none flex items-center justify-between w-full p-4 cursor-pointer bg-slate-800/50 rounded-t-lg group-open:rounded-b-none border border-slate-700/80">
            <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-3">
                {icon} {title}
            </h3>
            <PhosphorIcons.ChevronDown
                className={`w-6 h-6 text-slate-400 transition-transform duration-300 group-open:rotate-180`}
            />
        </summary>
        <div className="px-4 py-4 border border-t-0 border-slate-700/80 rounded-b-lg">
            <div className="space-y-4 divide-y divide-slate-700/50">{children}</div>
        </div>
    </details>
));


const SettingRow: React.FC<{
    label: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}> = memo(({ label, description, children, className }) => (
    <div
        className={`flex flex-col sm:flex-row justify-between sm:items-center gap-4 py-3 first:pt-0 last:pb-0 ${className}`}
    >
        <div className='flex-grow max-w-2xl'>
            <p className='font-semibold text-slate-200'>{label}</p>
            {description && <p className='text-sm text-slate-400'>{description}</p>}
        </div>
        <div className='flex-shrink-0 flex items-center justify-end gap-2 w-full sm:w-auto'>{children}</div>
    </div>
));

const GeneralSettings: React.FC<{ settings: AppSettings, t: (key: string) => string, dispatch: any }> = memo(({ settings, t, dispatch }) => (
    <SettingsSection title={t('settingsView.categories.general')} icon={<PhosphorIcons.Gear />} defaultOpen>
         <SettingRow label={t('settingsView.general.language')}>
            <div className="flex gap-2">
                <Button variant={settings.language === 'de' ? 'primary' : 'secondary'} onClick={() => dispatch(setSetting({ path: 'language', value: 'de' }))} className="flex-1"><FlagDE className="w-5 h-5 mr-2" /> Deutsch</Button>
                <Button variant={settings.language === 'en' ? 'primary' : 'secondary'} onClick={() => dispatch(setSetting({ path: 'language', value: 'en' }))} className="flex-1"><FlagEN className="w-5 h-5 mr-2" /> English</Button>
            </div>
        </SettingRow>
        <SettingRow label={t('settingsView.general.theme')}>
            <Select value={settings.theme} onChange={e => dispatch(setSetting({path: 'theme', value: e.target.value as Theme}))} options={Object.keys(t('settingsView.general.themes', { returnObjects: true })).map(key => ({ value: key, label: t(`settingsView.general.themes.${key}`) }))} />
        </SettingRow>
         <SettingRow label={t('settingsView.general.fontSize')}>
            <div className="flex gap-1 bg-slate-800 rounded-lg p-0.5">
                {(['sm', 'base', 'lg'] as const).map(size => (
                    <Button key={size} variant={settings.fontSize === size ? 'secondary' : 'ghost'} onClick={() => dispatch(setSetting({path: 'fontSize', value: size}))}>{t(`settingsView.general.fontSizes.${size}`)}</Button>
                ))}
            </div>
        </SettingRow>
         <SettingRow label={t('settingsView.general.expertModeTitle')} description={t('settingsView.general.expertModeDesc')}>
            <Switch checked={settings.isExpertMode} onChange={checked => dispatch(setSetting({ path: 'isExpertMode', value: checked }))} />
        </SettingRow>
    </SettingsSection>
));

const AccessibilitySettings: React.FC<{ settings: AppSettings, t: (key: string) => string, dispatch: any }> = memo(({ settings, t, dispatch }) => (
     <SettingsSection title={t('settingsView.categories.accessibility')} icon={<PhosphorIcons.Person />}>
        <SettingRow label={t('settingsView.accessibility.dyslexiaFont')} description={t('settingsView.accessibility.dyslexiaFontDesc')}>
            <Switch checked={settings.accessibility.dyslexiaFont} onChange={checked => dispatch(updateAccessibilitySettings({ dyslexiaFont: checked }))} />
        </SettingRow>
        <SettingRow label={t('settingsView.accessibility.reducedMotion')} description={t('settingsView.accessibility.reducedMotionDesc')}>
            <Switch checked={settings.accessibility.reducedMotion} onChange={checked => dispatch(updateAccessibilitySettings({ reducedMotion: checked }))} />
        </SettingRow>
        <SettingRow label={t('settingsView.accessibility.uiDensity')}>
            <div className="flex gap-1 bg-slate-800 rounded-lg p-0.5">
                 {(['comfortable', 'compact'] as const).map(density => (
                    <Button key={density} variant={settings.uiDensity === density ? 'secondary' : 'ghost'} onClick={() => dispatch(setSetting({path: 'uiDensity', value: density as UiDensity}))}>{t(`settingsView.accessibility.uiDensities.${density}`)}</Button>
                ))}
            </div>
        </SettingRow>
    </SettingsSection>
));

const TtsSettings: React.FC<{ settings: AppSettings, t: (key: string) => string, dispatch: any }> = memo(({ settings, t, dispatch }) => {
    const availableVoices = useAvailableVoices();
    return (
        <SettingsSection title={t('settingsView.categories.tts')} icon={<PhosphorIcons.SpeakerHigh />}>
            <SettingRow label={t('settingsView.tts.enabled')} description={t('settingsView.tts.enabledDesc')}>
                <Switch checked={settings.tts.enabled} onChange={checked => dispatch(updateTtsSettings({ enabled: checked }))} />
            </SettingRow>
            <SettingRow label={t('settingsView.tts.voice')}>
                <Select
                    value={settings.tts.voiceName || ''}
                    onChange={e => dispatch(updateTtsSettings({ voiceName: e.target.value }))}
                    disabled={!settings.tts.enabled || availableVoices.length === 0}
                    options={availableVoices.length > 0 ? availableVoices.map(v => ({ value: v.name, label: v.name })) : [{ value: '', label: t('settingsView.tts.noVoices') }]}
                />
            </SettingRow>
            <SettingRow label={t('settingsView.tts.rate')}>
                <input type="range" min="0.5" max="2" step="0.1" value={settings.tts.rate} onChange={e => dispatch(updateTtsSettings({ rate: parseFloat(e.target.value) }))} disabled={!settings.tts.enabled} className="w-32 accent-primary-500" />
            </SettingRow>
            <SettingRow label={t('settingsView.tts.pitch')}>
                <input type="range" min="0" max="2" step="0.1" value={settings.tts.pitch} onChange={e => dispatch(updateTtsSettings({ pitch: parseFloat(e.target.value) }))} disabled={!settings.tts.enabled} className="w-32 accent-primary-500" />
            </SettingRow>
        </SettingsSection>
    );
});

// FIX: Added the missing PlantsAndSimulationSettings component.
const PlantsAndSimulationSettings: React.FC<{
    settings: AppSettings;
    t: (key: string, options?: any) => any;
    dispatch: any;
}> = memo(({ settings, t, dispatch }) => (
    <SettingsSection title={t('settingsView.categories.plants')} icon={<PhosphorIcons.GameController />}>
        <SettingRow
            label={t('settingsView.plants.simulationProfile.title')}
            description={t('settingsView.plants.simulationProfile.description')}
        >
            <Select
                value={settings.simulationProfile}
                onChange={(e) =>
                    dispatch(
                        setSimulationProfile(e.target.value as 'beginner' | 'expert' | 'experimental' | 'custom')
                    )
                }
                options={Object.keys(
                    t('settingsView.plants.simulationProfile.profiles', { returnObjects: true })
                ).map((key) => ({
                    value: key,
                    label: t(`settingsView.plants.simulationProfile.profiles.${key}`),
                }))}
            />
        </SettingRow>
        <SettingRow
            label={t('settingsView.plants.autoAdvance')}
            description={t('settingsView.plants.autoAdvanceDesc')}
        >
            <Switch
                checked={settings.simulationSettings.autoAdvance}
                onChange={(checked) =>
                    dispatch(setSetting({ path: 'simulationSettings.autoAdvance', value: checked }))
                }
            />
        </SettingRow>
        <SettingRow
            label={t('settingsView.plants.autoJournaling')}
            description={t('settingsView.plants.autoJournalingDesc')}
        >
            <div className="flex flex-col gap-2 items-start sm:items-end">
                <Switch
                    label={t('settingsView.plants.logStageChanges')}
                    checked={settings.simulationSettings.autoJournaling.stageChanges}
                    onChange={(checked) =>
                        dispatch(setSetting({ path: 'simulationSettings.autoJournaling.stageChanges', value: checked }))
                    }
                />
                <Switch
                    label={t('settingsView.plants.logProblems')}
                    checked={settings.simulationSettings.autoJournaling.problems}
                    onChange={(checked) =>
                        dispatch(setSetting({ path: 'simulationSettings.autoJournaling.problems', value: checked }))
                    }
                />
                <Switch
                    label={t('settingsView.plants.logTasks')}
                    checked={settings.simulationSettings.autoJournaling.tasks}
                    onChange={(checked) =>
                        dispatch(setSetting({ path: 'simulationSettings.autoJournaling.tasks', value: checked }))
                    }
                />
            </div>
        </SettingRow>
         <SettingRow
            label={t('settingsView.plants.pestPressure')}
            description={t('settingsView.plants.pestPressureDesc')}
        >
            <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={settings.simulationSettings.customDifficultyModifiers.pestPressure}
                onChange={(e) =>
                    dispatch(
                        setSetting({
                            path: 'simulationSettings.customDifficultyModifiers.pestPressure',
                            value: parseFloat(e.target.value),
                        })
                    )
                }
                className="w-32 accent-primary-500"
            />
        </SettingRow>
         <SettingRow
            label={t('settingsView.plants.nutrientSensitivity')}
            description={t('settingsView.plants.nutrientSensitivityDesc')}
        >
            <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={settings.simulationSettings.customDifficultyModifiers.nutrientSensitivity}
                onChange={(e) =>
                    dispatch(
                        setSetting({
                            path: 'simulationSettings.customDifficultyModifiers.nutrientSensitivity',
                            value: parseFloat(e.target.value),
                        })
                    )
                }
                className="w-32 accent-primary-500"
            />
        </SettingRow>
         <SettingRow
            label={t('settingsView.plants.environmentalStability')}
            description={t('settingsView.plants.environmentalStabilityDesc')}
        >
            <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={settings.simulationSettings.customDifficultyModifiers.environmentalStability}
                onChange={(e) =>
                    dispatch(
                        setSetting({
                            path: 'simulationSettings.customDifficultyModifiers.environmentalStability',
                            value: parseFloat(e.target.value),
                        })
                    )
                }
                className="w-32 accent-primary-500"
            />
        </SettingRow>
    </SettingsSection>
));

const DataSettings: React.FC<{ settings: AppSettings, t: (key: string) => string, dispatch: any }> = memo(({ settings, t, dispatch }) => {
    const { estimates, isLoading } = useStorageEstimate();
    const handleReplayOnboarding = () => {
        if(window.confirm(t('settingsView.data.replayOnboardingConfirm'))) {
            dispatch(setSetting({path: 'onboardingCompleted', value: false}));
            dispatch(setOnboardingStep(0));
            dispatch(addNotification({message: t('settingsView.data.replayOnboardingSuccess'), type: 'success'}));
        }
    }
    const handleClearArchives = () => {
        if(window.confirm(t('settingsView.data.clearArchivesConfirm'))) {
            dispatch(clearArchives());
            dispatch(addNotification({message: t('settingsView.data.clearArchivesSuccess'), type: 'success'}));
        }
    }
    const handleResetPlants = () => {
         if (window.confirm(t('settingsView.data.resetPlantsConfirm'))) {
            dispatch(resetPlantsAction());
            dispatch(addNotification({ message: t('settingsView.data.resetPlantsSuccess'), type: 'success' }));
        }
    }

    return (
         <SettingsSection title={t('settingsView.categories.data')} icon={<PhosphorIcons.Archive />}>
            <div className="p-3 bg-slate-800/50 rounded-lg">
                <h4 className='text-md font-semibold text-slate-300 mb-2'>{t('settingsView.data.storageUsage')}</h4>
                 <ul className="text-sm space-y-1">
                    {Object.entries(t('settingsView.data.storageBreakdown', { returnObjects: true })).map(([key, label]) => (
                        <li key={key} className="flex justify-between items-center">
                            <span className="text-slate-400">{label}:</span>
                            <span className="font-mono text-slate-200">{isLoading ? '...' : (estimates[key] || '0 Bytes')}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <SettingRow label={t('settingsView.data.exportAll')} description={`${t('settingsView.data.lastBackup')}: ${settings.lastBackupTimestamp ? new Date(settings.lastBackupTimestamp).toLocaleString() : t('settingsView.data.noBackup')}`}>
                <Button onClick={() => dispatch(exportAllData())} variant="secondary">{t('common.export')}</Button>
            </SettingRow>
            <SettingRow label={t('settingsView.data.clearArchives')} description={t('settingsView.data.clearArchivesDesc')}>
                <Button onClick={handleClearArchives} variant="danger">{t('common.delete')}</Button>
            </SettingRow>
            <SettingRow label={t('settingsView.data.replayOnboarding')}>
                <Button onClick={handleReplayOnboarding} variant="secondary">{t('settingsView.data.replayOnboarding')}</Button>
            </SettingRow>
            <SettingRow label={t('settingsView.data.resetPlants')}>
                <Button onClick={handleResetPlants} variant="danger">{t('settingsView.data.resetPlants')}</Button>
            </SettingRow>
             <SettingRow label={t('settingsView.data.resetAll')}>
                <Button onClick={() => dispatch(resetAllData())} variant="danger">{t('settingsView.data.resetAll')}</Button>
            </SettingRow>
        </SettingsSection>
    );
});


export const SettingsView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const settings = useAppSelector(selectSettings);
   
    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold font-display text-slate-100">{t('settingsView.title')}</h2>
            
            <GeneralSettings settings={settings} t={t} dispatch={dispatch} />
            <AccessibilitySettings settings={settings} t={t} dispatch={dispatch} />
            <TtsSettings settings={settings} t={t} dispatch={dispatch} />
            <PlantsAndSimulationSettings settings={settings} t={t} dispatch={dispatch} />
            <DataSettings settings={settings} t={t} dispatch={dispatch} />
            
            <SettingsSection title={t('settingsView.categories.about')} icon={<PhosphorIcons.Info />}>
                <p className="text-sm text-slate-400">{t('metadata.description')}</p>
                 <SettingRow label={t('settingsView.about.version')}>
                    <span className="font-mono text-sm">{APP_VERSION}.0</span>
                </SettingRow>
                <SettingRow label={t('settingsView.about.devWithAIStudio')}>
                    <Button as="a" href="https://ai.studio.google.com/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-" target="_blank" rel="noopener noreferrer" variant="secondary">{t('settingsView.about.getTheAppHere')}</Button>
                </SettingRow>
                 <SettingRow label={t('settingsView.about.github')}>
                    <Button as="a" href="https://github.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer" variant="secondary">{t('settingsView.about.githubLinkText')}</Button>
                </SettingRow>
            </SettingsSection>
        </div>
    );
};