import React from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from '@/hooks/useTranslations';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { AppSettings, Language, Theme, View } from '@/types';
import { useAvailableVoices } from '@/hooks/useAvailableVoices';
import { storageService } from '@/services/storageService';
import { defaultSettings } from '@/stores/slices/settingsSlice';

interface SettingsViewProps {
    deferredPrompt: any;
    onInstallClick: () => void;
}

const SettingsSection: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
    <Card>
        <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2 mb-4">
            {icon} {title}
        </h3>
        <div className="space-y-4">{children}</div>
    </Card>
);

const SettingRow: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 py-2 border-b border-slate-700/50 last:border-b-0">
        <div>
            <p className="font-semibold text-slate-200">{label}</p>
            {description && <p className="text-sm text-slate-400">{description}</p>}
        </div>
        <div className="flex-shrink-0">{children}</div>
    </div>
);

export const SettingsView: React.FC<SettingsViewProps> = ({ deferredPrompt, onInstallClick }) => {
    const { t } = useTranslations();
    const settings = useAppStore(state => state.settings);
    const setSetting = useAppStore(state => state.setSetting);
    const resetPlants = useAppStore(state => state.resetPlants);
    const voices = useAvailableVoices();
    const isInstalled = !deferredPrompt;

    const handleExportData = () => {
        const state = useAppStore.getState();
        const dataToExport = {
            settings: state.settings,
            plants: state.plants,
            plantSlots: state.plantSlots,
            userStrains: state.userStrains,
            favoriteIds: Array.from(state.favoriteIds),
            strainNotes: state.strainNotes,
            savedExports: state.savedExports,
            savedSetups: state.savedSetups,
            archivedMentorResponses: state.archivedMentorResponses,
            archivedAdvisorResponses: state.archivedAdvisorResponses,
            savedStrainTips: state.savedStrainTips,
            knowledgeProgress: state.knowledgeProgress,
        };
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cannaguide-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setSetting('lastBackupTimestamp', Date.now());
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedState = JSON.parse(e.target?.result as string);
                    if (importedState.settings && importedState.userStrains) {
                        storageService.clearAll();
                        // This approach is simplified; a robust solution would use zustand's persistance API
                        localStorage.setItem('cannaguide-2025-storage', JSON.stringify({ version: 0, state: importedState }));
                        window.location.reload();
                    } else {
                       throw new Error("Invalid file format");
                    }
                } catch (error) {
                    console.error("Import failed:", error);
                }
            };
            reader.readAsText(file);
        }
    };

    const handleResetAll = () => {
        if(window.confirm(t('settingsView.data.resetAllConfirm'))) {
            storageService.clearAll();
            window.location.reload();
        }
    }
    
    return (
        <div className="space-y-6">
            <SettingsSection title={t('settingsView.categories.general')} icon={<PhosphorIcons.Gear />}>
                <SettingRow label={t('settingsView.general.language')}>
                    <select value={settings.language} onChange={e => setSetting('language', e.target.value as Language)} className="select-input">
                        <option value="en">English</option>
                        <option value="de">Deutsch</option>
                    </select>
                </SettingRow>
                <SettingRow label={t('settingsView.general.theme')}>
                    <select value={settings.theme} onChange={e => setSetting('theme', e.target.value as Theme)} className="select-input">
                        {Object.keys(t('settingsView.general.themes')).map(key => <option key={key} value={key}>{t(`settingsView.general.themes.${key}`)}</option>)}
                    </select>
                </SettingRow>
                <SettingRow label={t('settingsView.general.installApp')} description={t('settingsView.general.installAppDesc')}>
                    <Button onClick={onInstallClick} disabled={isInstalled}>
                        {isInstalled ? t('common.installed') : t('common.installPwa')}
                    </Button>
                </SettingRow>
            </SettingsSection>
             <SettingsSection title={t('settingsView.categories.data')} icon={<PhosphorIcons.Archive />}>
                 <SettingRow label={t('settingsView.data.exportAll')} description={t('settingsView.data.lastBackup') + ': ' + (settings.lastBackupTimestamp ? new Date(settings.lastBackupTimestamp).toLocaleString() : t('settingsView.data.noBackup'))}>
                    <Button onClick={handleExportData}>{t('common.export')}</Button>
                </SettingRow>
                <SettingRow label={t('settingsView.data.importAll')}>
                    <Button as="label" htmlFor="import-file" variant="secondary">{t('settingsView.data.importAll')}</Button>
                    <input type="file" id="import-file" accept=".json" className="hidden" onChange={handleImportData} />
                </SettingRow>
                 <SettingRow label={t('settingsView.data.resetPlants')}>
                    <Button onClick={resetPlants} variant="danger">{t('settingsView.data.resetPlants')}</Button>
                </SettingRow>
                <SettingRow label={t('settingsView.data.resetAll')}>
                    <Button onClick={handleResetAll} variant="danger">{t('settingsView.data.resetAll')}</Button>
                </SettingRow>
            </SettingsSection>
        </div>
    );
};
