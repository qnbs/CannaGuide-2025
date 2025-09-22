import React, { useId } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppStore } from '@/stores/useAppStore';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { storageService } from '@/services/storageService';
import { Language, Theme, View, SortKey, SortDirection, ExportSource, ExportFormat, UiDensity } from '@/types';

interface SettingsViewProps {
    deferredPrompt: any;
    onInstallClick: () => void;
}

const SettingItem: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center py-4 border-b border-slate-700/50 last:border-b-0 gap-2">
        <div>
            <p className="font-semibold text-slate-100">{label}</p>
            {description && <p className="text-sm text-slate-400 max-w-md">{description}</p>}
        </div>
        <div className="flex-shrink-0">{children}</div>
    </div>
);

const SectionCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
     <Card>
        <h2 className="text-xl font-bold font-display text-primary-400 mb-2 flex items-center gap-2">
            {icon}
            {title}
        </h2>
        <div>{children}</div>
    </Card>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${props.className}`} />
);

const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({label, ...props}) => {
    const id = useId();
    return (
        <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id={id} {...props} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500"/>
            <span className="text-sm text-slate-200">{label}</span>
        </label>
    );
}

export const SettingsView: React.FC<SettingsViewProps> = ({ deferredPrompt, onInstallClick }) => {
    const { t } = useTranslations();
    const { settings, setSetting, resetPlants } = useAppStore(state => ({
        settings: state.settings,
        setSetting: state.setSetting,
        resetPlants: state.resetPlants,
    }));
    const addNotification = useAppStore(state => state.addNotification);
    const isInstalled = !deferredPrompt && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);
    
    const handleExportData = () => {
        if(window.confirm(t('settingsView.data.exportConfirm'))) {
            try {
                // Use the new single storage key from persist middleware
                const appDataString = localStorage.getItem('cannaguide-2025-storage');
                if (!appDataString) throw new Error("No data found in storage");

                const appData = JSON.parse(appDataString);
                
                // We only need the 'state' part of the persisted object
                const jsonString = JSON.stringify(appData.state, null, 2);
                const blob = new Blob([jsonString], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `CannaGuide_Backup_${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setSetting('lastBackupTimestamp', Date.now());
                addNotification(t('settingsView.data.exportSuccess'), 'success');
            } catch (error) {
                 addNotification(t('settingsView.data.exportError'), 'error');
                 console.error("Export error:", error);
            }
        }
    };
    
    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (window.confirm(t('settingsView.data.importConfirm'))) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== 'string') throw new Error("File is not text");
                    const data = JSON.parse(text);

                    if (!data.settings || !data.plants) {
                         addNotification(t('settingsView.data.importInvalidFile'), 'error');
                        return;
                    }
                    
                    // Create the object structure that the persist middleware expects
                    const persistedData = {
                        state: data,
                        version: useAppStore.getState().settings.onboardingCompleted ? 1 : 0 // a simple version check
                    };

                    localStorage.setItem('cannaguide-2025-storage', JSON.stringify(persistedData));

                    addNotification(t('settingsView.data.importSuccess'), 'success');
                    setTimeout(() => window.location.reload(), 1000);
                } catch (error) {
                    addNotification(t('settingsView.data.importInvalidFile'), 'error');
                    console.error("Import error:", error);
                }
            };
            reader.readAsText(file);
        }
        event.target.value = '';
    };

    const handleResetAllData = () => {
        if(window.confirm(t('settingsView.data.resetAllConfirm'))) {
            localStorage.removeItem('cannaguide-2025-storage');
            addNotification(t('settingsView.data.resetAllSuccess'), 'success');
            setTimeout(() => window.location.reload(), 1000);
        }
    };

    const importId = useId();

    return (
        <div className="space-y-6">
             <SectionCard title={t('settingsView.categories.general')} icon={<PhosphorIcons.Gear />}>
                <SettingItem label={t('settingsView.general.language')}>
                    <Select value={settings.language} onChange={e => setSetting('language', e.target.value as Language)}>
                        <option value="en">English</option>
                        <option value="de">Deutsch</option>
                    </Select>
                </SettingItem>
                <SettingItem label={t('settingsView.general.theme')}>
                    <Select value={settings.theme} onChange={e => setSetting('theme', e.target.value as Theme)}>
                        {Object.entries(t('settingsView.general.themes')).map(([key, value]) => <option key={key} value={key}>{value as string}</option>)}
                    </Select>
                </SettingItem>
                <SettingItem label={t('settingsView.general.fontSize')}>
                     <Select value={settings.fontSize} onChange={e => setSetting('fontSize', e.target.value as 'sm'|'base'|'lg')}>
                        {Object.entries(t('settingsView.general.fontSizes')).map(([key, value]) => <option key={key} value={key}>{value as string}</option>)}
                    </Select>
                </SettingItem>
                <SettingItem label={t('settingsView.general.defaultView')}>
                     <Select value={settings.defaultView} onChange={e => setSetting('defaultView', e.target.value as View)}>
                        <option value={View.Plants}>{t('nav.plants')}</option>
                        <option value={View.Strains}>{t('nav.strains')}</option>
                        <option value={View.Equipment}>{t('nav.equipment')}</option>
                        <option value={View.Knowledge}>{t('nav.knowledge')}</option>
                    </Select>
                </SettingItem>
                <SettingItem label={t('settingsView.general.installApp')} description={t('settingsView.general.installAppDesc')}>
                     <Button onClick={onInstallClick} disabled={isInstalled || !deferredPrompt}>{isInstalled ? t('common.installed') : t('common.installPwa')}</Button>
                </SettingItem>
            </SectionCard>
            
             <SectionCard title={t('settingsView.categories.accessibility')} icon={<PhosphorIcons.PaintBrush />}>
                <SettingItem label={t('settingsView.accessibility.dyslexiaFont')} description={t('settingsView.accessibility.dyslexiaFontDesc')}>
                    <Checkbox label="" checked={settings.accessibility.dyslexiaFont} onChange={e => setSetting('accessibility.dyslexiaFont', e.target.checked)}/>
                </SettingItem>
                <SettingItem label={t('settingsView.accessibility.reducedMotion')} description={t('settingsView.accessibility.reducedMotionDesc')}>
                    <Checkbox label="" checked={settings.accessibility.reducedMotion} onChange={e => setSetting('accessibility.reducedMotion', e.target.checked)}/>
                </SettingItem>
                <SettingItem label={t('settingsView.accessibility.uiDensity')}>
                     <Select value={settings.uiDensity} onChange={e => setSetting('uiDensity', e.target.value as UiDensity)}>
                         {Object.entries(t('settingsView.accessibility.uiDensities')).map(([key, value]) => <option key={key} value={key}>{value as string}</option>)}
                     </Select>
                </SettingItem>
             </SectionCard>

            <SectionCard title={t('settingsView.categories.data')} icon={<PhosphorIcons.ArchiveBox />}>
                 <SettingItem label={t('settingsView.data.resetPlants')} description={t('settingsView.data.resetPlantsConfirm')}>
                    <Button onClick={resetPlants} variant="secondary">{t('settingsView.data.resetPlants')}</Button>
                </SettingItem>
                <SettingItem label={t('settingsView.data.exportAll')} description={t('settingsView.data.exportConfirm')}>
                    <Button onClick={handleExportData} variant="secondary">{t('common.export')}</Button>
                </SettingItem>
                <SettingItem label={t('settingsView.data.importAll')} description={t('settingsView.data.importConfirm')}>
                    <Button as="label" htmlFor={importId} variant="secondary" className="cursor-pointer">{t('settingsView.data.importAll')}</Button>
                    <input type="file" id={importId} accept=".json" onChange={handleImportData} className="hidden" />
                </SettingItem>
                <SettingItem label={t('settingsView.data.resetAll')} description={t('settingsView.data.resetAllConfirm')}>
                    <Button onClick={handleResetAllData} variant="danger">{t('settingsView.data.resetAll')}</Button>
                </SettingItem>
            </SectionCard>
        </div>
    );
};
