import React, { useState, useId, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { AppSettings, Language, Theme, View, UiDensity } from '@/types';
import { Switch } from '@/components/common/Switch';
import { useAppDispatch, useAppSelector, RootState, AppDispatch } from '@/stores/store';
import { setSetting, exportAllData, resetAllData, setSimulationProfile } from '@/stores/slices/settingsSlice';
import { addNotification, setOnboardingStep } from '@/stores/slices/uiSlice';
import { resetPlants as resetPlantsAction } from '@/stores/slices/simulationSlice';
import { FlagDE, FlagEN } from '@/components/icons/Flags';
import { Select } from '@/components/ui/ThemePrimitives';
import { useStorageEstimate } from '@/hooks/useStorageEstimate';
import { clearArchives } from '@/stores/slices/archivesSlice';
import { TFunction } from 'i18next';

// --- SUB-COMPONENTS ---

const SettingsSection: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; defaultOpen?: boolean }> = memo(({ title, children, icon, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const sectionId = useId();

    return (
        <Card className="!p-0 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full p-4 cursor-pointer"
                aria-expanded={isOpen}
                aria-controls={sectionId}
            >
                <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2">
                    {icon} {title}
                </h3>
                <PhosphorIcons.ChevronDown className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div id={sectionId} className="px-4 pb-4 border-t border-slate-700/50 animate-fade-in">
                    <div className="space-y-4 divide-y divide-slate-700/50">{children}</div>
                </div>
            )}
        </Card>
    );
});

const SettingRow: React.FC<{ label: string; description?: string; children: React.ReactNode; className?: string }> = memo(({ label, description, children, className }) => (
    <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-2 py-3 first:pt-0 last:pb-0 ${className}`}>
        <div className="flex-grow">
            <p className="font-semibold text-slate-200">{label}</p>
            {description && <p className="text-sm text-slate-400 max-w-md">{description}</p>}
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">{children}</div>
    </div>
));

const StorageBreakdown: React.FC = memo(() => {
    const { t } = useTranslation();
    const { estimates, isLoading } = useStorageEstimate();
    const labels: Record<string, string> = {
        plants: t('settingsView.data.storageBreakdown.plants'),
        images: t('settingsView.data.storageBreakdown.images'),
        archives: t('settingsView.data.storageBreakdown.archives'),
        customStrains: t('settingsView.data.storageBreakdown.customStrains'),
        savedItems: t('settingsView.data.storageBreakdown.savedItems'),
    };
    return (
        <div className="p-3 bg-slate-800/50 rounded-lg">
            <h4 className="text-md font-semibold text-slate-300 mb-2">{t('settingsView.data.storageUsage')}</h4>
            {isLoading ? <p className="text-sm text-slate-400">{t('common.loading')}...</p> : (
                <ul className="text-sm space-y-1">
                    {Object.entries(labels).map(([key, label]) => (
                        <li key={key} className="flex justify-between items-center">
                            <span className="text-slate-400">{label}:</span>
                            <span className="font-mono text-slate-200">{estimates[key] || '0 Bytes'}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
});

interface SectionProps {
    settings: AppSettings;
    dispatch: AppDispatch;
    handleSetSetting: (path: string, value: any) => void;
    t: TFunction;
}

const LanguageSelectionCard: React.FC<{ handleLanguageSelect: (lang: Language) => void }> = memo(({ handleLanguageSelect }) => (
    <Card>
        <h2 className="text-2xl font-bold font-display text-primary-300 mb-2">Choose your language / Sprache wählen</h2>
        <p className="text-slate-400 mb-4">Select your preferred language / Wähle deine bevorzugte Sprache</p>
        <div className="flex gap-4">
            <Button onClick={() => handleLanguageSelect('de')} className="flex-1 flex items-center justify-center">
                <FlagDE className="w-6 h-6 mr-2" />
                Deutsch
            </Button>
            <Button onClick={() => handleLanguageSelect('en')} className="flex-1 flex items-center justify-center">
                <FlagEN className="w-6 h-6 mr-2" />
                English
            </Button>
        </div>
    </Card>
));

const GeneralSettingsSection: React.FC<SectionProps> = memo(({ settings, handleSetSetting, t }) => (
    <SettingsSection title={t('settingsView.categories.general')} icon={<PhosphorIcons.Gear />} defaultOpen>
        <SettingRow label={t('settingsView.general.theme')}>
            <Select
                value={settings.theme}
                onChange={e => handleSetSetting('theme', e.target.value as Theme)}
                options={Object.keys(t('settingsView.general.themes', {returnObjects: true})).map(key => ({value: key, label: t(`settingsView.general.themes.${key}`)}))}
            />
        </SettingRow>
        <SettingRow label={t('settingsView.general.defaultView')}>
            <Select
                value={settings.defaultView}
                onChange={e => handleSetSetting('defaultView', e.target.value as View)}
                options={Object.values(View).map(v => ({value: v, label: t(`nav.${(v as string).toLowerCase()}`)}))}
            />
        </SettingRow>
    </SettingsSection>
));

const PlantsAndSimulationSettings: React.FC<SectionProps> = memo(({ settings, dispatch, handleSetSetting, t }) => (
    <SettingsSection title={t('settingsView.categories.plants')} icon={<PhosphorIcons.Plant />}>
        <SettingRow label={t('settingsView.plants.simulationProfile.title')} description={t('settingsView.plants.simulationProfile.description')}>
            <Select
                value={settings.simulationProfile}
                onChange={e => dispatch(setSimulationProfile(e.target.value as any))}
                options={Object.keys(t('settingsView.plants.simulationProfile.profiles', {returnObjects: true})).map(key => ({value: key, label: t(`settingsView.plants.simulationProfile.profiles.${key}`)}))}
            />
        </SettingRow>
        <SettingRow label={t('settingsView.plants.pestPressure')} description={t('settingsView.plants.pestPressureDesc')}>
            <input type="range" min="0.5" max="2" step="0.1" value={settings.simulationSettings.customDifficultyModifiers.pestPressure} onChange={e => handleSetSetting('simulationSettings.customDifficultyModifiers.pestPressure', parseFloat(e.target.value))} className="w-32 accent-primary-500" />
            <span className="font-mono text-sm">{settings.simulationSettings.customDifficultyModifiers.pestPressure.toFixed(1)}x</span>
        </SettingRow>
        <SettingRow label={t('settingsView.plants.nutrientSensitivity')} description={t('settingsView.plants.nutrientSensitivityDesc')}>
            <input type="range" min="0.5" max="2" step="0.1" value={settings.simulationSettings.customDifficultyModifiers.nutrientSensitivity} onChange={e => handleSetSetting('simulationSettings.customDifficultyModifiers.nutrientSensitivity', parseFloat(e.target.value))} className="w-32 accent-primary-500" />
            <span className="font-mono text-sm">{settings.simulationSettings.customDifficultyModifiers.nutrientSensitivity.toFixed(1)}x</span>
        </SettingRow>
        <SettingRow label={t('settingsView.plants.environmentalStability')} description={t('settingsView.plants.environmentalStabilityDesc')}>
            <input type="range" min="0.5" max="2" step="0.1" value={settings.simulationSettings.customDifficultyModifiers.environmentalStability} onChange={e => handleSetSetting('simulationSettings.customDifficultyModifiers.environmentalStability', parseFloat(e.target.value))} className="w-32 accent-primary-500" />
            <span className="font-mono text-sm">{settings.simulationSettings.customDifficultyModifiers.environmentalStability.toFixed(1)}x</span>
        </SettingRow>
    </SettingsSection>
));

const DataManagementSettings: React.FC<SectionProps & {
    handleExportAll: () => void;
    handleImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleClearArchives: () => void;
    handleReplayOnboarding: () => void;
    handleResetPlants: () => void;
    handleResetAll: () => void;
}> = memo(({ settings, handleExportAll, handleImportData, handleClearArchives, handleReplayOnboarding, handleResetPlants, handleResetAll, t }) => (
    <SettingsSection title={t('settingsView.categories.data')} icon={<PhosphorIcons.Archive />}>
        <StorageBreakdown />
        <SettingRow label={t('settingsView.data.exportAll')} description={t('settingsView.data.lastBackup') + ': ' + (settings.lastBackupTimestamp ? new Date(settings.lastBackupTimestamp).toLocaleString() : t('settingsView.data.noBackup'))}>
            <Button onClick={handleExportAll} variant="secondary">{t('common.export')}</Button>
        </SettingRow>
        <SettingRow label={t('settingsView.data.importAll')}>
            <Button as="label" htmlFor="import-file" variant="secondary">{t('common.import')}</Button>
            <input type="file" id="import-file" accept=".json" className="hidden" onChange={handleImportData} />
        </SettingRow>
        <SettingRow label={t('settingsView.data.clearArchives')} description={t('settingsView.data.clearArchivesDesc')}>
            <Button onClick={handleClearArchives} variant="danger">{t('settingsView.data.clearArchives')}</Button>
        </SettingRow>
        <SettingRow label={t('settingsView.data.replayOnboarding')}>
            <Button onClick={handleReplayOnboarding} variant="secondary">{t('settingsView.data.replayOnboarding')}</Button>
        </SettingRow>
        <SettingRow label={t('settingsView.data.resetPlants')}>
            <Button onClick={handleResetPlants} variant="danger">{t('settingsView.data.resetPlants')}</Button>
        </SettingRow>
        <SettingRow label={t('settingsView.data.resetAll')}>
            <Button onClick={handleResetAll} variant="danger">{t('settingsView.data.resetAll')}</Button>
        </SettingRow>
    </SettingsSection>
));


// --- MAIN COMPONENT ---

export const SettingsView: React.FC = () => {
    const { t } = useTranslation();
    const settings = useAppSelector((state: RootState) => state.settings.settings);
    const dispatch = useAppDispatch();
    
    const handleSetSetting = (path: string, value: any) => {
        dispatch(setSetting({ path, value }));
    };
    
    const handleLanguageSelect = (lang: Language) => {
        handleSetSetting('language', lang);
    };

    const handleReplayOnboarding = () => {
        if (window.confirm(t('settingsView.data.replayOnboardingConfirm'))) {
            handleSetSetting('onboardingCompleted', false);
            dispatch(setOnboardingStep(0));
            dispatch(addNotification({ message: t('settingsView.data.replayOnboardingSuccess'), type: 'success' }));
        }
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log("Import functionality would need a Redux Persist setup to work correctly.");
        dispatch(addNotification({ message: 'Import currently not supported in Redux version.', type: 'info' }));
    };
    
    const handleResetPlants = () => {
        if (window.confirm(t('settingsView.data.resetPlantsConfirm'))) {
            dispatch(resetPlantsAction());
            dispatch(addNotification({ message: t('settingsView.data.resetPlantsSuccess'), type: 'success' }));
        }
    };
    
    const handleClearArchives = () => {
        if (window.confirm(t('settingsView.data.clearArchivesConfirm'))) {
            dispatch(clearArchives());
            dispatch(addNotification({ message: t('settingsView.data.clearArchivesSuccess'), type: 'success' }));
        }
    };
    
    const handleResetAll = () => {
        dispatch(resetAllData());
    };

    const handleExportAll = () => {
        dispatch(exportAllData());
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <LanguageSelectionCard handleLanguageSelect={handleLanguageSelect} />

            <GeneralSettingsSection settings={settings} dispatch={dispatch} handleSetSetting={handleSetSetting} t={t} />
            
            <PlantsAndSimulationSettings settings={settings} dispatch={dispatch} handleSetSetting={handleSetSetting} t={t} />

            <DataManagementSettings 
                settings={settings} 
                dispatch={dispatch} 
                handleSetSetting={handleSetSetting} 
                t={t}
                handleExportAll={handleExportAll}
                handleImportData={handleImportData}
                handleClearArchives={handleClearArchives}
                handleReplayOnboarding={handleReplayOnboarding}
                handleResetPlants={handleResetPlants}
                handleResetAll={handleResetAll}
            />
        </div>
    );
};
