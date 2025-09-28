import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from './stores/store';
import { useTranslations } from './hooks/useTranslations';
import { Card } from './components/common/Card';
import { Button } from './components/common/Button';
import { PhosphorIcons } from './components/icons/PhosphorIcons';
import { AppSettings, Language, Theme, View, SortKey, SortDirection, UiDensity } from './types';
import { useAvailableVoices } from './hooks/useAvailableVoices';
import { Switch } from './components/common/Switch';
import { setSetting, exportAllData, resetAllData } from './stores/slices/settingsSlice';
import { setOnboardingStep, addNotification } from './stores/slices/uiSlice';
import { resetPlants as resetPlantsAction } from './stores/slices/simulationSlice';

interface SettingsViewProps {
    deferredPrompt: any;
    onInstallClick: () => void;
}

const SettingsSection: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
    <Card>
        <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2 mb-4">
            {icon} {title}
        </h3>
        <div className="space-y-4 divide-y divide-slate-700/50">{children}</div>
    </Card>
);

const SettingRow: React.FC<{ label: string; description?: string; children: React.ReactNode; className?: string }> = ({ label, description, children, className }) => (
    <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-2 py-3 first:pt-0 last:pb-0 ${className}`}>
        <div className="flex-grow">
            <p className="font-semibold text-slate-200">{label}</p>
            {description && <p className="text-sm text-slate-400 max-w-md">{description}</p>}
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">{children}</div>
    </div>
);

export const SettingsView: React.FC<SettingsViewProps> = ({ deferredPrompt, onInstallClick }) => {
    const { t } = useTranslations();
    const settings = useAppSelector(state => state.settings.settings);
    const dispatch = useAppDispatch();
    
    const voices = useAvailableVoices();
    const isInstalled = !deferredPrompt;

    const handleSetSetting = (path: string, value: any) => {
        dispatch(setSetting({ path, value }));
    };
    
    const handleReplayOnboarding = () => {
        if (window.confirm(t('settingsView.data.replayOnboardingConfirm'))) {
            handleSetSetting('onboardingCompleted', false);
            dispatch(setOnboardingStep(0));
            dispatch(addNotification({ message: t('settingsView.data.replayOnboardingSuccess'), type: 'success' }));
        }
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(addNotification({ message: 'Import currently not supported in Redux version.', type: 'info' }));
    };
    
    const handleResetPlants = () => {
        if (window.confirm(t('settingsView.data.resetPlantsConfirm'))) {
            dispatch(resetPlantsAction());
            dispatch(addNotification({ message: t('settingsView.data.resetPlantsSuccess'), type: 'success' }));
        }
    };

    const handleExportAll = () => {
        dispatch(exportAllData());
    };

    const handleResetAll = () => {
        dispatch(resetAllData());
    };
    
    return (
        <div className="space-y-6">
            <SettingsSection title={t('settingsView.categories.general')} icon={<PhosphorIcons.Gear />}>
                <SettingRow label={t('settingsView.general.language')}>
                    <select value={settings.language} onChange={e => handleSetSetting('language', e.target.value as Language)} className="select-input">
                        <option value="en">{t('settingsView.languages.en')}</option>
                        <option value="de">{t('settingsView.languages.de')}</option>
                    </select>
                </SettingRow>
                <SettingRow label={t('settingsView.general.theme')}>
                    <select value={settings.theme} onChange={e => handleSetSetting('theme', e.target.value as Theme)} className="select-input">
                        {Object.keys(t('settingsView.general.themes', {returnObjects: true})).map(key => <option key={key} value={key}>{t(`settingsView.general.themes.${key}`)}</option>)}
                    </select>
                </SettingRow>
                 <SettingRow label={t('settingsView.general.defaultView')}>
                    <select value={settings.defaultView} onChange={e => handleSetSetting('defaultView', e.target.value as View)} className="select-input">
                        {Object.values(View).map(v => <option key={v} value={v}>{t(`nav.${(v as string).toLowerCase()}`)}</option>)}
                    </select>
                </SettingRow>
                <SettingRow label={t('settingsView.general.installApp')} description={t('settingsView.general.installAppDesc')}>
                    <Button onClick={onInstallClick} disabled={isInstalled}>
                        {isInstalled ? t('common.installed') : t('common.installPwa')}
                    </Button>
                </SettingRow>
            </SettingsSection>
            
            <SettingsSection title={t('settingsView.categories.accessibility')} icon={<PhosphorIcons.Person />}>
                 <SettingRow label={t('settingsView.accessibility.uiDensity')}>
                    <select value={settings.uiDensity} onChange={e => handleSetSetting('uiDensity', e.target.value as UiDensity)} className="select-input">
                        {Object.keys(t('settingsView.accessibility.uiDensities', { returnObjects: true })).map(key => <option key={key} value={key}>{t(`settingsView.accessibility.uiDensities.${key}`)}</option>)}
                    </select>
                </SettingRow>
                 <SettingRow label={t('settingsView.general.fontSize')}>
                    <select value={settings.fontSize} onChange={e => handleSetSetting('fontSize', e.target.value as 'sm' | 'base' | 'lg')} className="select-input">
                        {Object.keys(t('settingsView.general.fontSizes', { returnObjects: true })).map(key => <option key={key} value={key}>{t(`settingsView.general.fontSizes.${key}`)}</option>)}
                    </select>
                </SettingRow>
                <SettingRow label={t('settingsView.accessibility.dyslexiaFont')} description={t('settingsView.accessibility.dyslexiaFontDesc')}>
                    <Switch checked={settings.accessibility.dyslexiaFont} onChange={val => handleSetSetting('accessibility.dyslexiaFont', val)} />
                </SettingRow>
                <SettingRow label={t('settingsView.accessibility.reducedMotion')} description={t('settingsView.accessibility.reducedMotionDesc')}>
                    <Switch checked={settings.accessibility.reducedMotion} onChange={val => handleSetSetting('accessibility.reducedMotion', val)} />
                </SettingRow>
            </SettingsSection>

            <SettingsSection title={t('settingsView.categories.data')} icon={<PhosphorIcons.Archive />}>
                <SettingRow label={t('settingsView.data.exportAll')} description={t('settingsView.data.lastBackup') + ': ' + (settings.lastBackupTimestamp ? new Date(settings.lastBackupTimestamp).toLocaleString() : t('settingsView.data.noBackup'))}>
                    <Button onClick={handleExportAll} variant="secondary">{t('common.export')}</Button>
                </SettingRow>
                <SettingRow label={t('settingsView.data.importAll')}>
                    <Button as="label" htmlFor="import-file" variant="secondary">{t('common.import')}</Button>
                    <input type="file" id="import-file" accept=".json" className="hidden" onChange={handleImportData} />
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

            <SettingsSection title={t('settingsView.categories.about')} icon={<PhosphorIcons.Info />}>
                <SettingRow label={t('settingsView.about.version')}><span className="font-mono text-slate-300">2.1.0</span></SettingRow>
                <SettingRow label={t('settingsView.about.devWithAIStudio')}>
                    <Button as="a" href="https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-" target="_blank" rel="noopener noreferrer" variant="secondary">
                        {t('settingsView.about.getTheAppHere')} <PhosphorIcons.ArrowSquareOut className="w-4 h-4 ml-1.5"/>
                    </Button>
                </SettingRow>
                <SettingRow label={t('settingsView.about.github')}>
                     <Button as="a" href="https://github.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer" variant="secondary">
                        {t('settingsView.about.githubLinkText')} <PhosphorIcons.ArrowSquareOut className="w-4 h-4 ml-1.5"/>
                    </Button>
                </SettingRow>
            </SettingsSection>
        </div>
    );
};
