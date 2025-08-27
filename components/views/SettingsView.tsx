import React, { useRef } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Plant, FontSize, Theme as LightDarkTheme, Language } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import { useNotifications } from '../../context/NotificationContext';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { useTranslations } from '../../hooks/useTranslations';

interface SettingsViewProps {
  setPlants: React.Dispatch<React.SetStateAction<(Plant | null)[]>>;
}

const SettingItem: React.FC<{
  label: string;
  description: string;
  children: React.ReactNode;
}> = ({ label, description, children }) => (
  <div className="grid grid-cols-1 gap-4 border-t border-slate-200 dark:border-slate-700 py-4 first:border-t-0 first:pt-0 md:grid-cols-3 md:items-center">
    <div className="md:col-span-2">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-200">{label}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
    <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
      {children}
    </div>
  </div>
);

const DangerZoneItem: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="grid grid-cols-1 gap-4 border-t border-red-500/20 py-4 md:grid-cols-3 md:items-center">
        <div className="md:col-span-2">
            <h4 className="font-semibold text-red-800 dark:text-red-300">{title}</h4>
            <p className="text-sm text-red-600 dark:text-red-400">{description}</p>
        </div>
        <div className="flex justify-start md:justify-end">
            {children}
        </div>
    </div>
);


const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; id: string; disabled?: boolean;}> = ({ checked, onChange, id, disabled=false }) => (
    <label htmlFor={id} className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input type="checkbox" id={id} className="sr-only peer" checked={checked} onChange={onChange} disabled={disabled} />
        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
    </label>
);


export const SettingsView: React.FC<SettingsViewProps> = ({ setPlants }) => {
  const { settings, setSetting } = useSettings();
  const { addNotification } = useNotifications();
  // FIX: Added useTranslations hook to enable internationalization for this component.
  const { t } = useTranslations();
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleFullReset = () => {
      // FIX: Replaced hardcoded string with translation key.
      if (window.confirm(t('settingsView.notifications.fullResetConfirm'))) {
        localStorage.clear();
        // FIX: Replaced hardcoded string with translation key.
        addNotification(t('settingsView.notifications.fullResetSuccess'), 'success');
        setTimeout(() => window.location.reload(), 1000);
    }
  }

  const handleResetUserStrains = () => {
    // FIX: Replaced hardcoded string with translation key.
    if (window.confirm(t('settingsView.notifications.userStrainsResetConfirm'))) {
        localStorage.removeItem('user_added_strains');
        // FIX: Replaced hardcoded string with translation key.
        addNotification(t('settingsView.notifications.userStrainsResetSuccess'), 'success');
        setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleResetExportsHistory = () => {
    // FIX: Replaced hardcoded string with translation key.
    if (window.confirm(t('settingsView.notifications.exportsResetConfirm'))) {
        localStorage.removeItem('cannabis-grow-guide-exports');
        // FIX: Replaced hardcoded string with translation key.
        addNotification(t('settingsView.notifications.exportsResetSuccess'), 'success');
        setTimeout(() => window.location.reload(), 1000);
    }
  };


  const handleExport = () => {
    try {
      const plants = localStorage.getItem('cannabis-grow-guide-plants');
      const settingsData = localStorage.getItem('cannabis-grow-guide-settings');
      const favorites = localStorage.getItem('cannabis-grow-guide-favorites');
      const userStrains = localStorage.getItem('user_added_strains');
      const exportsHistory = localStorage.getItem('cannabis-grow-guide-exports');
      
      const dataToExport = {
        plants: plants ? JSON.parse(plants) : [null, null, null],
        settings: settingsData ? JSON.parse(settingsData) : {},
        favorites: favorites ? JSON.parse(favorites) : [],
        userStrains: userStrains ? JSON.parse(userStrains) : [],
        exportsHistory: exportsHistory ? JSON.parse(exportsHistory) : [],
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(dataToExport, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `grow-guide-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      // FIX: Replaced hardcoded string with translation key.
      addNotification(t('settingsView.notifications.exportSuccess'), 'success');
    } catch (error) {
      console.error("Failed to export data", error);
      // FIX: Replaced hardcoded string with translation key.
      addNotification(t('settingsView.notifications.exportError'), 'error');
    }
  };

  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File is not readable");
        
        const data = JSON.parse(text);

        if ('plants' in data && 'settings' in data) {
          localStorage.setItem('cannabis-grow-guide-plants', JSON.stringify(data.plants));
          localStorage.setItem('cannabis-grow-guide-settings', JSON.stringify(data.settings));
          
          if ('favorites' in data) {
             localStorage.setItem('cannabis-grow-guide-favorites', JSON.stringify(data.favorites));
          }
           if ('userStrains' in data) {
             localStorage.setItem('user_added_strains', JSON.stringify(data.userStrains));
          }
           if ('exportsHistory' in data) {
             localStorage.setItem('cannabis-grow-guide-exports', JSON.stringify(data.exportsHistory));
          }

          // FIX: Replaced hardcoded string with translation key.
          addNotification(t('settingsView.notifications.importSuccess'), 'success');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          throw new Error("Invalid backup file format");
        }
      } catch (error) {
        console.error("Failed to import data", error);
        // FIX: Replaced hardcoded string with translation key.
        addNotification(t('settingsView.notifications.importError'), 'error');
      } finally {
        if(event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-primary-600 dark:text-primary-400">{t('settingsView.title')}</h1>
      <div className="space-y-6">
        
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-primary-500 dark:text-primary-300">{t('settingsView.display')}</h2>
          <div className="flex flex-col">
            <SettingItem label={t('settingsView.theme')} description={t('settingsView.themeDescription')}>
                {(['light', 'dark', 'system'] as LightDarkTheme[]).map(theme => (
                  <Button key={theme} variant={settings.theme === theme ? 'primary' : 'secondary'} onClick={() => setSetting('theme', theme)}>{t(`settingsView.themes.${theme}`)}</Button>
                ))}
            </SettingItem>

            <SettingItem label={t('settingsView.fontSize')} description={t('settingsView.fontSizeDescription')}>
                <div className="flex rounded-md shadow-sm" role="group">
                 {(['sm', 'base', 'lg'] as FontSize[]).map((size, idx) => (
                  <button key={size} type="button" onClick={() => setSetting('fontSize', size)} className={`px-4 py-2 text-sm font-medium transition-colors ${settings.fontSize === size ? 'bg-primary-600 text-white' : 'bg-slate-600 text-slate-50 hover:bg-slate-700'} ${idx === 0 ? 'rounded-l-lg' : ''} ${idx === 2 ? 'rounded-r-lg' : ''} border-y border-l border-slate-800 last:border-r`}>
                      {t(`settingsView.fontSizes.${size}`)}
                  </button>
                ))}
                </div>
            </SettingItem>
            
            {/* FIX: Added missing language selector UI. */}
            <SettingItem label={t('settingsView.language')} description={t('settingsView.languageDescription')}>
                {(['de', 'en'] as Language[]).map(lang => (
                  <Button key={lang} variant={settings.language === lang ? 'primary' : 'secondary'} onClick={() => setSetting('language', lang)}>{t(`settingsView.languages.${lang}`)}</Button>
                ))}
            </SettingItem>
          </div>
        </Card>

        <Card>
          {/* FIX: Changed key to 'notificationsTitle' to match the fix in locale files. */}
          <h2 className="text-xl font-semibold mb-4 text-primary-500 dark:text-primary-300">{t('settingsView.notificationsTitle')}</h2>
          <div className="flex flex-col">
            <SettingItem label={t('settingsView.notificationsEnable')} description={t('settingsView.notificationsEnableDescription')}>
                <ToggleSwitch id="notifications-toggle" checked={settings.notificationsEnabled} onChange={() => setSetting('notificationsEnabled', !settings.notificationsEnabled)} />
            </SettingItem>

            <fieldset disabled={!settings.notificationsEnabled} className="contents">
              <SettingItem label={t('settingsView.stageChange')} description={t('settingsView.stageChangeDescription')}>
                <ToggleSwitch id="notifications-stage-toggle" checked={settings.notificationSettings.stageChange} onChange={() => setSetting('notificationSettings', { ...settings.notificationSettings, stageChange: !settings.notificationSettings.stageChange })} disabled={!settings.notificationsEnabled} />
              </SettingItem>
              <SettingItem label={t('settingsView.problemDetected')} description={t('settingsView.problemDetectedDescription')}>
                <ToggleSwitch id="notifications-problem-toggle" checked={settings.notificationSettings.problemDetected} onChange={() => setSetting('notificationSettings', { ...settings.notificationSettings, problemDetected: !settings.notificationSettings.problemDetected })} disabled={!settings.notificationsEnabled}/>
              </SettingItem>
              <SettingItem label={t('settingsView.harvestReady')} description={t('settingsView.harvestReadyDescription')}>
                <ToggleSwitch id="notifications-harvest-toggle" checked={settings.notificationSettings.harvestReady} onChange={() => setSetting('notificationSettings', { ...settings.notificationSettings, harvestReady: !settings.notificationSettings.harvestReady })} disabled={!settings.notificationsEnabled}/>
              </SettingItem>
            </fieldset>

          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4 text-primary-500 dark:text-primary-300">{t('settingsView.dataManagement')}</h2>
           <div className="flex flex-col">
              <SettingItem label={t('settingsView.exportBackup')} description={t('settingsView.exportBackupDescription')}>
                  <Button variant="secondary" onClick={handleExport}>{t('settingsView.exportButton')}</Button>
              </SettingItem>

              <SettingItem label={t('settingsView.importBackup')} description={t('settingsView.importBackupDescription')}>
                   <input type="file" ref={importFileRef} onChange={handleImport} accept=".json" className="hidden" />
                  <Button variant="secondary" onClick={handleImportClick}>{t('settingsView.importButton')}</Button>
              </SettingItem>
              
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                    <PhosphorIcons.WarningCircle className="w-5 h-5" />
                    {t('settingsView.dangerZone')}
                  </h3>
                  <DangerZoneItem title={t('settingsView.resetUserStrainsTitle')} description={t('settingsView.resetUserStrainsDescription')}>
                      <Button variant="danger" size="sm" onClick={handleResetUserStrains}>{t('settingsView.resetUserStrainsButton')}</Button>
                  </DangerZoneItem>
                   <DangerZoneItem title={t('settingsView.resetExportsHistoryTitle')} description={t('settingsView.resetExportsHistoryDescription')}>
                      <Button variant="danger" size="sm" onClick={handleResetExportsHistory}>{t('settingsView.resetExportsHistoryButton')}</Button>
                  </DangerZoneItem>
                   <DangerZoneItem title={t('settingsView.fullResetTitle')} description={t('settingsView.fullResetDescription')}>
                      <Button variant="danger" onClick={handleFullReset}>{t('settingsView.fullResetButton')}</Button>
                  </DangerZoneItem>
              </div>
          </div>
        </Card>
      </div>
    </div>
  );
};