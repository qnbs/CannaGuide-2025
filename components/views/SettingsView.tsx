import React, { useId, useState, useMemo } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useNotifications } from '@/context/NotificationContext';
import { useTranslations } from '@/hooks/useTranslations';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { AppSettings, Language, Theme, View, SortKey, SortDirection, UiDensity, ExportSource, ExportFormat, NotificationSettings } from '@/types';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { usePlants } from '@/hooks/usePlants';
import { storageService } from '@/services/storageService';
import { RangeSlider } from '@/components/common/RangeSlider';

type SettingsCategory = 'general' | 'accessibility' | 'strains' | 'plants' | 'notifications' | 'defaults' | 'data' | 'about';

// Reusable UI Components for Settings
const SettingsSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <Card className="!p-6">
        <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{title}</h3>
        <div className="space-y-6">{children}</div>
    </Card>
);

const SelectRow: React.FC<{ label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode, description?: string }> = ({ label, value, onChange, children, description }) => {
    const id = useId();
    return (
        <div className="flex items-center justify-between">
            <div>
                 <label htmlFor={id} className="text-slate-200">{label}</label>
                 {description && <p className="text-xs text-slate-400 max-w-sm">{description}</p>}
            </div>
            <select id={id} value={value} onChange={onChange} className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                {children}
            </select>
        </div>
    );
};

const ToggleRow: React.FC<{ label: string; isEnabled: boolean; onToggle: (enabled: boolean) => void; description?: string }> = ({ label, isEnabled, onToggle, description }) => {
    const id = useId();
    return (
        <div className="flex items-center justify-between">
            <div>
                <label htmlFor={id} className="text-slate-200">{label}</label>
                {description && <p className="text-xs text-slate-400 max-w-sm">{description}</p>}
            </div>
            <button
                id={id} type="button" role="switch" aria-checked={isEnabled} onClick={() => onToggle(!isEnabled)}
                className={`${isEnabled ? 'bg-primary-600' : 'bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-800`}
            >
                <span className={`${isEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}/>
            </button>
        </div>
    );
};

const InputRow: React.FC<{ label: string, type: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, step?: string | number, min?: number, max?: number, unit?: string, className?: string }> = ({ label, unit, className = 'w-48', ...props }) => {
    const id = useId();
    return (
        <div className="flex items-center justify-between">
            <label htmlFor={id} className="text-slate-200">{label}</label>
            <div className="relative">
                <input id={id} {...props} className={`${className} bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-primary-500`} />
                {unit && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{unit}</span>}
            </div>
        </div>
    );
};

// Settings Category Components
const GeneralSettingsPanel: React.FC<{ settings: AppSettings; setSetting: (path: string, value: any) => void }> = ({ settings, setSetting }) => {
    const { t } = useTranslations();
    const themes: { id: Theme; colors: string[] }[] = [
        { id: 'midnight', colors: ['#0F172A', '#3B82F6', '#06B6D4'] },
        { id: 'forest', colors: ['#141F19', '#22C55E', '#10B981'] },
        { id: 'purpleHaze', colors: ['#1C192D', '#806DFB', '#C079FF'] },
        { id: 'desertSky', colors: ['#262232', '#8B5CF6', '#F59E0B'] },
        { id: 'roseQuartz', colors: ['#1F1A22', '#EC4899', '#C83FC8'] },
    ];
    return (
        <SettingsSection title={t('settingsView.general.title')}>
            <SelectRow label={t('settingsView.general.language')} value={settings.language} onChange={e => setSetting('language', e.target.value)}>
                <option value="en">English</option><option value="de">Deutsch</option>
            </SelectRow>
            <div>
                <label className="text-slate-200 mb-2 block">{t('settingsView.general.theme')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {themes.map(theme => (
                        <button key={theme.id} onClick={() => setSetting('theme', theme.id)} className={`p-2 rounded-lg border-2 transition-all ${settings.theme === theme.id ? 'border-primary-500 scale-105' : 'border-slate-700 hover:border-slate-500'}`}>
                            <div className="flex h-10 rounded-md overflow-hidden">{theme.colors.map(c => <div key={c} className="flex-1" style={{ backgroundColor: c }}></div>)}</div>
                            <p className="text-sm mt-2 text-center text-slate-200">{t(`settingsView.general.themes.${theme.id}`)}</p>
                        </button>
                    ))}
                </div>
            </div>
            <SelectRow label={t('settingsView.general.defaultView')} value={settings.defaultView} onChange={e => setSetting('defaultView', e.target.value)}>
                {Object.values(View).map((v: string) => <option key={v} value={v}>{t(`nav.${v.toLowerCase()}`)}</option>)}
            </SelectRow>
        </SettingsSection>
    );
};

const AccessibilitySettingsPanel: React.FC<{ settings: AppSettings; setSetting: (path: string, value: any) => void }> = ({ settings, setSetting }) => {
    const { t } = useTranslations();
    const uiDensityOptions: UiDensity[] = ['comfortable', 'compact'];
    return (
        <SettingsSection title={t('settingsView.accessibility.title')}>
            <ToggleRow label={t('settingsView.accessibility.highContrast')} description={t('settingsView.accessibility.highContrastDesc')} isEnabled={settings.accessibility.highContrast} onToggle={val => setSetting('accessibility.highContrast', val)} />
            <ToggleRow label={t('settingsView.accessibility.dyslexiaFont')} description={t('settingsView.accessibility.dyslexiaFontDesc')} isEnabled={settings.accessibility.dyslexiaFont} onToggle={val => setSetting('accessibility.dyslexiaFont', val)} />
            <ToggleRow label={t('settingsView.accessibility.reducedMotion')} description={t('settingsView.accessibility.reducedMotionDesc')} isEnabled={settings.accessibility.reducedMotion} onToggle={val => setSetting('accessibility.reducedMotion', val)} />
            <SelectRow label={t('settingsView.general.fontSize')} value={settings.fontSize} onChange={e => setSetting('fontSize', e.target.value)}>
                {Object.keys(t('settingsView.general.fontSizes')).map(k => <option key={k} value={k}>{t(`settingsView.general.fontSizes.${k}`)}</option>)}
            </SelectRow>
            <div>
                 <label className="text-slate-200 mb-2 block">{t('settingsView.accessibility.uiDensity')}</label>
                 <div className="flex gap-1 bg-slate-800 rounded-lg p-0.5 max-w-sm">{uiDensityOptions.map(opt => <button key={opt} onClick={() => setSetting('uiDensity', opt)} className={`flex-1 px-2 py-1 text-sm font-semibold rounded-md transition-colors ${settings.uiDensity === opt ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-600'}`}>{t(`settingsView.accessibility.uiDensities.${opt}`)}</button>)}</div>
            </div>
        </SettingsSection>
    );
};

const StrainsSettingsPanel: React.FC<{ settings: AppSettings; setSetting: (path: string, value: any) => void }> = ({ settings, setSetting }) => {
    const { t } = useTranslations();
    return (
        <SettingsSection title={t('settingsView.strains.title')}>
            <SelectRow label={t('settingsView.strains.defaultSort')} value={`${settings.strainsViewSettings.defaultSortKey}:${settings.strainsViewSettings.defaultSortDirection}`} onChange={e => { const [key, dir] = e.target.value.split(':'); setSetting('strainsViewSettings.defaultSortKey', key as SortKey); setSetting('strainsViewSettings.defaultSortDirection', dir as SortDirection) }}>
                {Object.keys(t('settingsView.strains.sortKeys')).map(k => (<><option value={`${k}:desc`}>{t(`settingsView.strains.sortKeys.${k}`)} ({t('settingsView.strains.sortDirections.desc')})</option><option value={`${k}:asc`}>{t(`settingsView.strains.sortKeys.${k}`)} ({t('settingsView.strains.sortDirections.asc')})</option></>))}
            </SelectRow>
            <SelectRow label={t('settingsView.strains.defaultViewMode')} value={settings.strainsViewSettings.defaultViewMode} onChange={e => setSetting('strainsViewSettings.defaultViewMode', e.target.value)}>{Object.keys(t('settingsView.strains.viewModes')).map(k => <option key={k} value={k}>{t(`settingsView.strains.viewModes.${k}`)}</option>)}</SelectRow>
            <h4 className="font-semibold text-slate-300 pt-4">{t('settingsView.strains.visibleColumns')}</h4>
            <div className="pl-4 border-l-2 border-slate-700 grid grid-cols-2 gap-4">{Object.keys(settings.strainsViewSettings.visibleColumns).map(key => <ToggleRow key={key} label={t(`settingsView.strains.columns.${key}`)} isEnabled={settings.strainsViewSettings.visibleColumns[key as keyof typeof settings.strainsViewSettings.visibleColumns]} onToggle={val => setSetting(`strainsViewSettings.visibleColumns.${key}`, val)} />)}</div>
        </SettingsSection>
    )
};

const PlantsSettingsPanel: React.FC<{ settings: AppSettings; setSetting: (path: string, value: any) => void }> = ({ settings, setSetting }) => {
    const { t } = useTranslations();
    return (
        <SettingsSection title={t('settingsView.plants.title')}>
            <ToggleRow label={t('settingsView.plants.autoAdvance')} description={t('settingsView.plants.autoAdvanceDesc')} isEnabled={settings.simulationSettings.autoAdvance} onToggle={val => setSetting('simulationSettings.autoAdvance', val)} />
            <SelectRow label={t('settingsView.plants.speed')} value={settings.simulationSettings.speed} onChange={e => setSetting('simulationSettings.speed', e.target.value as any)}>{['1x', '2x', '5x', '10x', '20x'].map(s => <option key={s} value={s}>{s}</option>)}</SelectRow>
            <SelectRow label={t('settingsView.plants.difficulty')} value={settings.simulationSettings.difficulty} onChange={e => setSetting('simulationSettings.difficulty', e.target.value as any)}>{Object.keys(t('settingsView.plants.difficulties')).map(k => <option key={k} value={k}>{t(`settingsView.plants.difficulties.${k}`)}</option>)}</SelectRow>
            {settings.simulationSettings.difficulty === 'custom' && (
                <div className="pl-4 border-l-2 border-slate-700 space-y-4 animate-fade-in">
                    <RangeSlider label={t('settingsView.plants.pestPressure')} min={0.5} max={2.0} step={0.1} value={[settings.simulationSettings.customDifficultyModifiers.pestPressure, settings.simulationSettings.customDifficultyModifiers.pestPressure]} onChange={([val]) => setSetting('simulationSettings.customDifficultyModifiers.pestPressure', val)} unit="x" />
                    <RangeSlider label={t('settingsView.plants.nutrientSensitivity')} min={0.5} max={2.0} step={0.1} value={[settings.simulationSettings.customDifficultyModifiers.nutrientSensitivity, settings.simulationSettings.customDifficultyModifiers.nutrientSensitivity]} onChange={([val]) => setSetting('simulationSettings.customDifficultyModifiers.nutrientSensitivity', val)} unit="x" />
                    <RangeSlider label={t('settingsView.plants.environmentalStability')} min={0.5} max={2.0} step={0.1} value={[settings.simulationSettings.customDifficultyModifiers.environmentalStability, settings.simulationSettings.customDifficultyModifiers.environmentalStability]} onChange={([val]) => setSetting('simulationSettings.customDifficultyModifiers.environmentalStability', val)} unit="x" />
                </div>
            )}
            <h4 className="font-semibold text-slate-300 pt-4">{t('settingsView.plants.autoJournaling')}</h4>
            <div className="pl-4 border-l-2 border-slate-700 space-y-3">{Object.keys(settings.simulationSettings.autoJournaling).map(key => <ToggleRow key={key} label={t(`settingsView.plants.log${key.charAt(0).toUpperCase() + key.slice(1)}`)} isEnabled={settings.simulationSettings.autoJournaling[key as keyof typeof settings.simulationSettings.autoJournaling]} onToggle={val => setSetting(`simulationSettings.autoJournaling.${key}`, val)} />)}</div>
        </SettingsSection>
    );
};

const NotificationsSettingsPanel: React.FC<{ settings: AppSettings; setSetting: (path: string, value: any) => void }> = ({ settings, setSetting }) => {
    const { t } = useTranslations();
    return (
        <SettingsSection title={t('settingsView.notifications.title')}>
            <ToggleRow label={t('settingsView.notifications.enableAll')} isEnabled={settings.notificationsEnabled} onToggle={(val) => setSetting('notificationsEnabled', val)} />
            {settings.notificationsEnabled && (<div className="pl-4 border-l-2 border-slate-700 space-y-3 animate-fade-in">{Object.keys(settings.notificationSettings).map(key => <ToggleRow key={key} label={t(`settingsView.notifications.${key}`)} isEnabled={settings.notificationSettings[key as keyof NotificationSettings]} onToggle={val => setSetting(`notificationSettings.${key}`, val)} />)}</div>)}
             <h4 className="font-semibold text-slate-300 pt-4">{t('settingsView.notifications.quietHours')}</h4>
             <div className="pl-4 border-l-2 border-slate-700 space-y-4">
                <ToggleRow label={t('settingsView.notifications.enableQuietHours')} description={t('settingsView.notifications.quietHoursDesc')} isEnabled={settings.quietHours.enabled} onToggle={val => setSetting('quietHours.enabled', val)} />
                 {settings.quietHours.enabled && (
                    <div className="flex items-center justify-between animate-fade-in">
                        <InputRow label={t('common.start')} type="time" value={settings.quietHours.start} onChange={e => setSetting('quietHours.start', e.target.value)} className="w-32" />
                        <InputRow label={t('common.end')} type="time" value={settings.quietHours.end} onChange={e => setSetting('quietHours.end', e.target.value)} className="w-32" />
                    </div>
                 )}
             </div>
        </SettingsSection>
    );
};

const DefaultsSettingsPanel: React.FC<{ settings: AppSettings; setSetting: (path: string, value: any) => void }> = ({ settings, setSetting }) => {
    const { t } = useTranslations();
    const isDefaultNoteKey = (str: string) => str.startsWith('plantsView.actionModals.defaultNotes.');
    const wateringNoteValue = settings.defaultJournalNotes.watering && isDefaultNoteKey(settings.defaultJournalNotes.watering) ? t(settings.defaultJournalNotes.watering) : settings.defaultJournalNotes.watering;
    const feedingNoteValue = settings.defaultJournalNotes.feeding && isDefaultNoteKey(settings.defaultJournalNotes.feeding) ? t(settings.defaultJournalNotes.feeding) : settings.defaultJournalNotes.feeding;
    return (
        <SettingsSection title={t('settingsView.defaults.title')}>
            <h4 className="font-semibold text-slate-300">{t('settingsView.defaults.growSetup')}</h4>
            <div className="pl-4 border-l-2 border-slate-700 space-y-4">
                <SelectRow label={t('plantsView.setupModal.lightSource')} value={settings.defaultGrowSetup.lightType} onChange={e => setSetting('defaultGrowSetup.lightType', e.target.value)}>{['LED', 'HPS', 'CFL'].map(s=><option key={s} value={s}>{s}</option>)}</SelectRow>
                <SelectRow label={t('plantsView.setupModal.potSize')} value={String(settings.defaultGrowSetup.potSize)} onChange={e => setSetting('defaultGrowSetup.potSize', Number(e.target.value))}>{[5,10,15,30].map(s=><option key={s} value={s}>{s}L</option>)}</SelectRow>
                <SelectRow label={t('plantsView.setupModal.medium')} value={settings.defaultGrowSetup.medium} onChange={e => setSetting('defaultGrowSetup.medium', e.target.value)}>{['Soil','Coco','Hydro'].map(s=><option key={s} value={s}>{t(`plantsView.setupModal.mediums.${s.toLowerCase()}`)}</option>)}</SelectRow>
            </div>
             <h4 className="font-semibold text-slate-300 pt-4">{t('settingsView.defaults.journalNotesTitle')}</h4>
            <div className="pl-4 border-l-2 border-slate-700 space-y-4">
                <InputRow label={t('settingsView.defaults.wateringNoteLabel')} type="text" value={wateringNoteValue} onChange={e => setSetting('defaultJournalNotes.watering', e.target.value)} />
                <InputRow label={t('settingsView.defaults.feedingNoteLabel')} type="text" value={feedingNoteValue} onChange={e => setSetting('defaultJournalNotes.feeding', e.target.value)} />
            </div>
             <h4 className="font-semibold text-slate-300 pt-4">{t('settingsView.defaults.export')}</h4>
            <div className="pl-4 border-l-2 border-slate-700 space-y-4">
                <SelectRow label={t('strainsView.exportModal.source')} value={settings.defaultExportSettings.source} onChange={e => setSetting('defaultExportSettings.source', e.target.value as ExportSource)}>{['selected', 'favorites', 'filtered', 'all'].map(s => <option key={s} value={s}>{t(`strainsView.exportModal.sources.${s}`)}</option>)}</SelectRow>
                <SelectRow label={t('strainsView.exportModal.format')} value={settings.defaultExportSettings.format} onChange={e => setSetting('defaultExportSettings.format', e.target.value as ExportFormat)}>{['pdf', 'txt', 'csv', 'json'].map(f => <option key={f} value={f}>{t(`strainsView.exportModal.formats.${f}`)}</option>)}</SelectRow>
            </div>
        </SettingsSection>
    );
};

const DataManagementPanel: React.FC<{ settings: AppSettings; setSetting: (path: string, value: any) => void; resetPlants: () => void }> = ({ settings, setSetting, resetPlants }) => {
    const { t } = useTranslations();
    const { addNotification } = useNotifications();
    const importId = useId();

    const handleResetPlants = () => { if (window.confirm(t('settingsView.data.resetPlantsConfirm'))) { resetPlants(); addNotification(t('settingsView.data.resetPlantsSuccess'), 'success'); } };
    const handleReplayOnboarding = () => { if(window.confirm(t('settingsView.data.replayOnboardingConfirm'))) { setSetting('onboardingCompleted', false); addNotification(t('settingsView.data.replayOnboardingSuccess'), 'info'); window.location.reload(); } };
    const handleResetAllData = () => { if (window.confirm(t('settingsView.data.resetAllConfirm'))) { storageService.clearAll(); addNotification(t('settingsView.data.resetAllSuccess'), 'info'); window.location.reload(); } };
    const handleExportAllData = () => { if (!window.confirm(t('settingsView.data.exportConfirm'))) return; try { const dataToExport: Record<string, any> = { app_id: 'cannabis-grow-guide-2025', export_date: new Date().toISOString(), version: '2.5.0' }; const keysToExport = ['settings', 'plants', 'favorites', 'user_added_strains', 'exports', 'setups', 'knowledge-archive', 'plant-advisor-archive', 'strain_notes']; keysToExport.forEach(key => { const item = storageService.getItem(key, null); if (item) { dataToExport[`cannabis-grow-guide-${key}`] = item; } }); const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `canna-guide-backup-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url); setSetting('lastBackupTimestamp', Date.now()); addNotification(t('settingsView.data.exportSuccess'), 'success'); } catch(e) { addNotification(t('settingsView.data.exportError'), 'error'); console.error("Export failed:", e); } };
    const handleImportAllData = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const text = e.target?.result; if (typeof text !== 'string') throw new Error("Invalid file content"); const data = JSON.parse(text); if (data.app_id !== 'cannabis-grow-guide-2025') throw new Error(t('settingsView.data.importInvalidFile')); if (!window.confirm(t('settingsView.data.importConfirm'))) { if (event.target) event.target.value = ''; return; } Object.keys(data).forEach(key => { if (key.startsWith('cannabis-grow-guide-')) { storageService.setItem(key.replace('cannabis-grow-guide-', ''), data[key]); } }); addNotification(t('settingsView.data.importSuccess'), 'success'); setTimeout(() => window.location.reload(), 2000); } catch (error) { addNotification(`${t('settingsView.data.importError')}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error'); } finally { if (event.target) event.target.value = ''; } }; reader.readAsText(file); };
    
    return (
        <SettingsSection title={t('settingsView.data.title')}>
            <div className="p-4 bg-slate-800 rounded-lg text-sm text-center">{t('settingsView.data.lastBackup')}: <span className="font-semibold">{settings.lastBackupTimestamp ? new Date(settings.lastBackupTimestamp).toLocaleString() : t('settingsView.data.noBackup')}</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button variant="secondary" onClick={handleExportAllData}><PhosphorIcons.DownloadSimple className="w-5 h-5 mr-2" />{t('settingsView.data.exportAll')}</Button>
                <Button variant="secondary" as="label" htmlFor={importId} className="cursor-pointer text-center flex justify-center items-center"><PhosphorIcons.UploadSimple className="w-5 h-5 mr-2" />{t('settingsView.data.importAll')}<input type="file" id={importId} accept=".json" className="hidden" onChange={handleImportAllData} /></Button>
                <Button variant="secondary" onClick={handleReplayOnboarding}>{t('settingsView.data.replayOnboarding')}</Button>
                <Button variant="danger" onClick={handleResetPlants}>{t('settingsView.data.resetPlants')}</Button>
                <Button variant="danger" className="sm:col-span-2" onClick={handleResetAllData}><PhosphorIcons.WarningCircle className="w-5 h-5 mr-2" />{t('settingsView.data.resetAll')}</Button>
            </div>
        </SettingsSection>
    );
};

const AboutPanel: React.FC = () => {
    const { t } = useTranslations();
    return (
        <SettingsSection title={t('settingsView.about.title')}>
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <div className="flex justify-between items-baseline not-prose">
                    <h2 className="text-2xl font-bold font-display text-primary-300">{t('helpView.sections.about.appName')}</h2>
                    <span className="text-sm text-slate-400">{t('settingsView.about.version')}: {t('helpView.sections.about.version')}</span>
                </div>
                <p>{t('helpView.sections.about.description')}</p>
                <h3 className="!mb-2">{t('helpView.sections.about.devWithAIStudioTitle')}</h3>
                <p dangerouslySetInnerHTML={{ __html: `${t('helpView.sections.about.devWithAIStudioText')} <a href="https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-" target="_blank" rel="noopener noreferrer" class="text-primary-400 hover:underline">${t('settingsView.about.getTheAppHere')}</a>.` }}></p>
                <h3 className="!mb-2">{t('helpView.sections.about.githubTitle')}</h3>
                <p dangerouslySetInnerHTML={{ __html: t('helpView.sections.about.githubText') }}></p>
                <div className="not-prose flex flex-wrap gap-4">
                    <a href="https://github.com/qnbs/Cannabis-Grow-Guide-2025" target="_blank" rel="noopener noreferrer" className="no-underline">
                        <Button variant="secondary" size="sm">{t('helpView.sections.about.githubLinkText')}</Button>
                    </a>
                </div>
                <h3 className="!mb-2">{t('helpView.sections.about.disclaimerTitle')}</h3>
                <p>{t('helpView.sections.about.disclaimerText')}</p>
                <h3 className="!mb-2">{t('helpView.sections.about.privacyTitle')}</h3>
                <p>{t('helpView.sections.about.privacyText')}</p>
            </div>
        </SettingsSection>
    );
};


export const SettingsView: React.FC = () => {
    const { settings, setSetting } = useSettings();
    const { resetPlants } = usePlants();
    const { t } = useTranslations();
    const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');

    const categories: {id: SettingsCategory, label: string, icon: React.ReactNode}[] = [
        { id: 'general', label: t('settingsView.categories.general'), icon: <PhosphorIcons.PaintBrush/> },
        { id: 'accessibility', label: t('settingsView.categories.accessibility'), icon: <PhosphorIcons.Globe/> },
        { id: 'strains', label: t('settingsView.categories.strains'), icon: <PhosphorIcons.Leafy/> },
        { id: 'plants', label: t('settingsView.categories.plants'), icon: <PhosphorIcons.GameController/> },
        { id: 'notifications', label: t('settingsView.categories.notifications'), icon: <PhosphorIcons.BellSimple/> },
        { id: 'defaults', label: t('settingsView.categories.defaults'), icon: <PhosphorIcons.Gear/> },
        { id: 'data', label: t('settingsView.categories.data'), icon: <PhosphorIcons.ArchiveBox/> },
        { id: 'about', label: t('settingsView.categories.about'), icon: <PhosphorIcons.Info/> },
    ];
    
    const activePanel = useMemo(() => {
        switch(activeCategory) {
            case 'general': return <GeneralSettingsPanel settings={settings} setSetting={setSetting} />;
            case 'accessibility': return <AccessibilitySettingsPanel settings={settings} setSetting={setSetting} />;
            case 'strains': return <StrainsSettingsPanel settings={settings} setSetting={setSetting} />;
            case 'plants': return <PlantsSettingsPanel settings={settings} setSetting={setSetting} />;
            case 'notifications': return <NotificationsSettingsPanel settings={settings} setSetting={setSetting} />;
            case 'defaults': return <DefaultsSettingsPanel settings={settings} setSetting={setSetting} />;
            case 'data': return <DataManagementPanel settings={settings} setSetting={setSetting} resetPlants={resetPlants} />;
            case 'about': return <AboutPanel />;
            default: return null;
        }
    }, [activeCategory, settings, setSetting, resetPlants]);

    const activeCategoryData = categories.find(c => c.id === activeCategory);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <nav className="md:col-span-1">
                <Card className="p-2">
                    <ul className="space-y-1">
                        {categories.map(cat => (
                            <li key={cat.id}>
                                <button onClick={() => setActiveCategory(cat.id)} className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${activeCategory === cat.id ? 'bg-primary-500/20 text-primary-300' : 'text-slate-300 hover:bg-slate-700'}`}>
                                    <div className="w-5 h-5">{cat.icon}</div>
                                    <span className="font-semibold">{cat.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </Card>
            </nav>
            <main className="md:col-span-3">
                <div className="flex items-center gap-3 mb-4">
                    {activeCategoryData?.icon && <div className="w-7 h-7 text-primary-300">{activeCategoryData.icon}</div>}
                    <h2 className="text-2xl font-bold font-display text-primary-300">{activeCategoryData?.label || ''}</h2>
                </div>
                {activePanel}
            </main>
        </div>
    );
};