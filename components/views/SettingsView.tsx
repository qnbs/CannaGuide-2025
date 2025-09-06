import React, { useRef } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Plant, FontSize, Language, SimulationSpeed, SimulationDifficulty, GrowSetup, ExportSource, ExportFormat } from '../../types';
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
  <div className="grid grid-cols-1 gap-4 border-t border-slate-700 py-4 first:border-t-0 first:pt-0 md:grid-cols-3 md:items-start">
    <div className="md:col-span-2">
      <h3 className="text-base font-semibold text-slate-100">{label}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
    <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
      {children}
    </div>
  </div>
);

const DangerZoneItem: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="grid grid-cols-1 gap-4 border-t border-red-500/20 py-4 md:grid-cols-3 md:items-center">
        <div className="md:col-span-2">
            <h4 className="font-semibold text-red-400">{title}</h4>
            <p className="text-sm text-red-400/80">{description}</p>
        </div>
        <div className="flex justify-start md:justify-end">
            {children}
        </div>
    </div>
);


const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; id: string; disabled?: boolean;}> = ({ checked, onChange, id, disabled=false }) => (
    <label htmlFor={id} className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input type="checkbox" id={id} className="sr-only peer" checked={checked} onChange={onChange} disabled={disabled} />
        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
    </label>
);


export const SettingsView: React.FC<SettingsViewProps> = ({ setPlants }) => {
  const { settings, setSetting } = useSettings();
  const { addNotification } = useNotifications();
  const { t } = useTranslations();
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleFullReset = () => {
      if (window.confirm(t('settingsView.notifications.fullResetConfirm'))) {
        localStorage.clear();
        addNotification(t('settingsView.notifications.fullResetSuccess'), 'success');
        setTimeout(() => window.location.reload(), 1000);
    }
  }

  const handleResetUserStrains = () => {
    if (window.confirm(t('settingsView.notifications.userStrainsResetConfirm'))) {
        localStorage.removeItem('user_added_strains');
        addNotification(t('settingsView.notifications.userStrainsResetSuccess'), 'success');
        setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleResetExportsHistory = () => {
    if (window.confirm(t('settingsView.notifications.exportsResetConfirm'))) {
        localStorage.removeItem('cannabis-grow-guide-exports');
        addNotification(t('settingsView.notifications.exportsResetSuccess'), 'success');
        setTimeout(() => window.location.reload(), 1000);
    }
  };


  const handleExport = () => {
    if (!window.confirm(t('settingsView.notifications.exportConfirm'))) {
      return;
    }
    try {
      const plants = localStorage.getItem('cannabis-grow-guide-plants');
      const settingsData = localStorage.getItem('cannabis-grow-guide-settings');
      const favorites = localStorage.getItem('cannabis-grow-guide-favorites');
      const userStrains = localStorage.getItem('user_added_strains');
      const exportsHistory = localStorage.getItem('cannabis-grow-guide-exports');
      const savedSetups = localStorage.getItem('cannabis-grow-guide-setups');

      setSetting('lastBackupTimestamp', Date.now());
      
      const dataToExport = {
        plants: plants ? JSON.parse(plants) : [null, null, null],
        settings: settingsData ? JSON.parse(settingsData) : {},
        favorites: favorites ? JSON.parse(favorites) : [],
        userStrains: userStrains ? JSON.parse(userStrains) : [],
        exportsHistory: exportsHistory ? JSON.parse(exportsHistory) : [],
        savedSetups: savedSetups ? JSON.parse(savedSetups) : [],
      };
       
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(dataToExport, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `grow-guide-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      addNotification(t('settingsView.notifications.exportSuccess'), 'success');
    } catch (error) {
      console.error("Failed to export data", error);
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
      if (!window.confirm(t('settingsView.notifications.importConfirm'))) {
        if(event.target) event.target.value = '';
        return;
      }
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File is not readable");
        
        const data = JSON.parse(text);

        if ('plants' in data && 'settings' in data) {
          localStorage.setItem('cannabis-grow-guide-plants', JSON.stringify(data.plants));
          localStorage.setItem('cannabis-grow-guide-settings', JSON.stringify(data.settings));
          
          if ('favorites' in data) localStorage.setItem('cannabis-grow-guide-favorites', JSON.stringify(data.favorites));
          if ('userStrains' in data) localStorage.setItem('user_added_strains', JSON.stringify(data.userStrains));
          if ('exportsHistory' in data) localStorage.setItem('cannabis-grow-guide-exports', JSON.stringify(data.exportsHistory));
          if ('savedSetups' in data) localStorage.setItem('cannabis-grow-guide-setups', JSON.stringify(data.savedSetups));

          addNotification(t('settingsView.notifications.importSuccess'), 'success');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          throw new Error("Invalid backup file format");
        }
      } catch (error) {
        console.error("Failed to import data", error);
        addNotification(t('settingsView.notifications.importError'), 'error');
      } finally {
        if(event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <div>
      <div className="space-y-6">

        <Card>
          <h2 className="text-xl font-semibold font-display mb-4 text-primary-400">{t('settingsView.display')}</h2>
          <div className="flex flex-col">
            <SettingItem label={t('settingsView.fontSize')} description={t('settingsView.fontSizeDescription')}>
                <div className="flex rounded-lg shadow-sm" role="group">
                 {(['sm', 'base', 'lg'] as FontSize[]).map((size, idx) => (
                  <button key={size} type="button" onClick={() => setSetting('fontSize', size)} className={`px-4 py-2 text-sm font-medium transition-colors ${settings.fontSize === size ? 'bg-primary-600 text-on-accent' : 'bg-slate-800 text-slate-100 hover:bg-slate-700'} ${idx === 0 ? 'rounded-l-lg' : ''} ${idx === 2 ? 'rounded-r-lg' : ''} border-y border-l border-slate-700 last:border-r`}>
                      {t(`settingsView.fontSizes.${size}`)}
                  </button>
                ))}
                </div>
            </SettingItem>
            
            <SettingItem label={t('settingsView.language')} description={t('settingsView.languageDescription')}>
                {(['de', 'en'] as Language[]).map(lang => (
                  <Button key={lang} variant={settings.language === lang ? 'primary' : 'secondary'} onClick={() => setSetting('language', lang)}>{t(`settingsView.languages.${lang}`)}</Button>
                ))}
            </SettingItem>
          </div>
        </Card>
        
        <Card>
            <h2 className="text-xl font-semibold font-display mb-2 text-primary-400">{t('settingsView.presetsTitle')}</h2>
            <p className="text-sm text-slate-400 mb-4">{t('settingsView.presetsDescription')}</p>
            <div className="flex flex-col">
                <SettingItem label={t('settingsView.defaultGrowSetup')} description={t('settingsView.defaultGrowSetupDescription')}>
                    <div className='w-full grid grid-cols-2 md:grid-cols-3 gap-3'>
                        <div className="col-span-full">
                           <label className="text-xs font-medium text-slate-400">{t('plantsView.setupModal.lightSource')}</label>
                           <select value={settings.defaultGrowSetup.lightType} onChange={e => setSetting('defaultGrowSetup', {...settings.defaultGrowSetup, lightType: e.target.value as GrowSetup['lightType']})} className="w-full bg-slate-800 border-slate-700 border rounded-md p-1 text-sm">
                               <option>LED</option><option>HPS</option><option>CFL</option>
                           </select>
                        </div>
                         <div className="col-span-1">
                           <label className="text-xs font-medium text-slate-400">{t('plantsView.setupModal.potSize')}</label>
                           <select value={settings.defaultGrowSetup.potSize} onChange={e => setSetting('defaultGrowSetup', {...settings.defaultGrowSetup, potSize: Number(e.target.value) as GrowSetup['potSize']})} className="w-full bg-slate-800 border-slate-700 border rounded-md p-1 text-sm">
                               <option value={5}>5L</option><option value={10}>10L</option><option value={15}>15L</option>
                           </select>
                        </div>
                        <div className="col-span-2">
                           <label className="text-xs font-medium text-slate-400">{t('plantsView.setupModal.medium')}</label>
                           <select value={settings.defaultGrowSetup.medium} onChange={e => setSetting('defaultGrowSetup', {...settings.defaultGrowSetup, medium: e.target.value as GrowSetup['medium']})} className="w-full bg-slate-800 border-slate-700 border rounded-md p-1 text-sm">
                               <option value="Soil">{t('plantsView.setupModal.mediums.soil')}</option><option value="Coco">{t('plantsView.setupModal.mediums.coco')}</option><option value="Hydro">{t('plantsView.setupModal.mediums.hydro')}</option>
                           </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-400">{t('plantsView.setupModal.temp')}</label>
                            <input type="number" value={settings.defaultGrowSetup.temperature} onChange={e => setSetting('defaultGrowSetup', {...settings.defaultGrowSetup, temperature: Number(e.target.value)})} className="w-full bg-slate-800 border-slate-700 border rounded-md p-1 text-sm"/>
                        </div>
                         <div>
                            <label className="text-xs font-medium text-slate-400">{t('plantsView.setupModal.humidity')}</label>
                            <input type="number" value={settings.defaultGrowSetup.humidity} onChange={e => setSetting('defaultGrowSetup', {...settings.defaultGrowSetup, humidity: Number(e.target.value)})} className="w-full bg-slate-800 border-slate-700 border rounded-md p-1 text-sm"/>
                        </div>
                         <div>
                            <label className="text-xs font-medium text-slate-400">{t('plantsView.setupModal.lightHours')}</label>
                            <input type="number" value={settings.defaultGrowSetup.lightHours} onChange={e => setSetting('defaultGrowSetup', {...settings.defaultGrowSetup, lightHours: Number(e.target.value)})} className="w-full bg-slate-800 border-slate-700 border rounded-md p-1 text-sm"/>
                        </div>
                    </div>
                </SettingItem>
                 <SettingItem label={t('settingsView.defaultJournalNotes')} description={t('settingsView.defaultJournalNotesDescription')}>
                    <div className='w-full space-y-3'>
                         <div>
                            <label className="text-xs font-medium text-slate-400">{t('settingsView.defaultWateringNote')}</label>
                            <input type="text" value={settings.defaultJournalNotes.watering} onChange={e => setSetting('defaultJournalNotes', {...settings.defaultJournalNotes, watering: e.target.value})} className="w-full bg-slate-800 border-slate-700 border rounded-md p-1 text-sm"/>
                        </div>
                          <div>
                            <label className="text-xs font-medium text-slate-400">{t('settingsView.defaultFeedingNote')}</label>
                            <input type="text" value={settings.defaultJournalNotes.feeding} onChange={e => setSetting('defaultJournalNotes', {...settings.defaultJournalNotes, feeding: e.target.value})} className="w-full bg-slate-800 border-slate-700 border rounded-md p-1 text-sm"/>
                        </div>
                    </div>
                 </SettingItem>
                  <SettingItem label={t('settingsView.defaultExportSettings')} description={t('settingsView.defaultExportSettingsDescription')}>
                    <div className='w-full space-y-3'>
                        <div>
                           <label className="text-xs font-medium text-slate-400">{t('strainsView.exportModal.source')}</label>
                           <select value={settings.defaultExportSettings.source} onChange={e => setSetting('defaultExportSettings', {...settings.defaultExportSettings, source: e.target.value as ExportSource})} className="w-full bg-slate-800 border-slate-700 border rounded-md p-1 text-sm">
                               <option value="selected">{t('strainsView.exportModal.sources.selected')}</option>
                               <option value="favorites">{t('strainsView.exportModal.sources.favorites')}</option>
                               <option value="filtered">{t('strainsView.exportModal.sources.filtered')}</option>
                               <option value="all">{t('strainsView.exportModal.sources.all')}</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-xs font-medium text-slate-400">{t('strainsView.exportModal.format')}</label>
                           <select value={settings.defaultExportSettings.format} onChange={e => setSetting('defaultExportSettings', {...settings.defaultExportSettings, format: e.target.value as ExportFormat})} className="w-full bg-slate-800 border-slate-700 border rounded-md p-1 text-sm">
                               <option value="pdf">PDF</option><option value="txt">TXT</option>
                               <option value="csv">CSV</option><option value="json">JSON</option>
                           </select>
                        </div>
                    </div>
                </SettingItem>
            </div>
        </Card>

        <Card>
            <h2 className="text-xl font-semibold font-display mb-2 text-primary-400">{t('settingsView.simulation')}</h2>
             <p className="text-sm text-slate-400 mb-4">{t('settingsView.simulationDescription')}</p>
            <div className="flex flex-col">
                <SettingItem label={t('settingsView.simulationSpeed')} description={t('settingsView.simulationSpeedDescription')}>
                    <div className="flex rounded-lg shadow-sm" role="group">
                    {(['1x', '2x', '5x', '10x', '20x'] as SimulationSpeed[]).map((speed, idx, arr) => (
                        <button key={speed} type="button" onClick={() => setSetting('simulationSettings', { ...settings.simulationSettings, speed })} className={`px-4 py-2 text-sm font-medium transition-colors ${settings.simulationSettings.speed === speed ? 'bg-primary-600 text-on-accent' : 'bg-slate-800 text-slate-100 hover:bg-slate-700'} ${idx === 0 ? 'rounded-l-lg' : ''} ${idx === arr.length - 1 ? 'rounded-r-lg' : ''} border-y border-l border-slate-700 last:border-r`}>
                            {speed}
                        </button>
                    ))}
                    </div>
                </SettingItem>
                <SettingItem label={t('settingsView.simulationDifficulty')} description={t('settingsView.simulationDifficultyDescription')}>
                    <div className="flex rounded-lg shadow-sm" role="group">
                    {(['easy', 'normal', 'hard'] as SimulationDifficulty[]).map((difficulty, idx) => (
                        <button key={difficulty} type="button" onClick={() => setSetting('simulationSettings', { ...settings.simulationSettings, difficulty })} className={`px-4 py-2 text-sm font-medium transition-colors ${settings.simulationSettings.difficulty === difficulty ? 'bg-primary-600 text-on-accent' : 'bg-slate-800 text-slate-100 hover:bg-slate-700'} ${idx === 0 ? 'rounded-l-lg' : ''} ${idx === 2 ? 'rounded-r-lg' : ''} border-y border-l border-slate-700 last:border-r`}>
                            {t(`settingsView.difficulties.${difficulty}`)}
                        </button>
                    ))}
                    </div>
                </SettingItem>
            </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold font-display mb-2 text-primary-400">{t('settingsView.notificationsTitle')}</h2>
          <p className="text-sm text-slate-400 mb-4">{t('settingsView.notificationsDescription')}</p>
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
              <SettingItem label={t('settingsView.newTask')} description={t('settingsView.newTaskDescription')}>
                <ToggleSwitch id="notifications-task-toggle" checked={settings.notificationSettings.newTask} onChange={() => setSetting('notificationSettings', { ...settings.notificationSettings, newTask: !settings.notificationSettings.newTask })} disabled={!settings.notificationsEnabled}/>
              </SettingItem>
            </fieldset>

          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold font-display mb-2 text-primary-400">{t('settingsView.dataManagement')}</h2>
          <p className="text-sm text-slate-400 mb-4">{t('settingsView.dataManagementDescription')}</p>
           <div className="flex flex-col">
                <SettingItem label={t('settingsView.lastBackup')} description={settings.lastBackupTimestamp ? new Date(settings.lastBackupTimestamp).toLocaleString() : t('settingsView.noBackup')}>
                    <div></div>
                </SettingItem>
              <SettingItem label={t('settingsView.exportBackup')} description={t('settingsView.exportBackupDescription')}>
                  <Button variant="secondary" onClick={handleExport}>{t('settingsView.exportButton')}</Button>
              </SettingItem>
              <SettingItem label={t('settingsView.importBackup')} description={t('settingsView.importBackupDescription')}>
                   <input type="file" ref={importFileRef} onChange={handleImport} accept=".json" className="hidden" />
                  <Button variant="secondary" onClick={handleImportClick}>{t('settingsView.importButton')}</Button>
              </SettingItem>
              
              <div className="mt-4 pt-4 border-t border-slate-700">
                  <h3 className="text-lg font-semibold text-red-500 flex items-center gap-2">
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