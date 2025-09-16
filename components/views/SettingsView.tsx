import React, { useId, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useNotifications } from '../../context/NotificationContext';
import { useTranslations } from '../../hooks/useTranslations';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { AppSettings, ExportFormat, ExportSource, GrowSetup, Language, NotificationSettings, Plant, Theme } from '../../types';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { usePlants } from '../../hooks/usePlants';
import { storageService } from '../../services/storageService';

type SettingsCategory = 'display' | 'notifications' | 'simulation' | 'defaults' | 'data';

const SettingsSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <Card className="!p-6">
        <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
    </Card>
);

const SelectRow: React.FC<{ label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode }> = ({ label, value, onChange, children }) => {
    const id = useId();
    return (
        <div className="flex items-center justify-between">
            <label htmlFor={id} className="text-slate-200">{label}</label>
            <select id={id} value={value} onChange={onChange} className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                {children}
            </select>
        </div>
    );
};

const ToggleRow: React.FC<{ label: string; isEnabled: boolean; onToggle: (enabled: boolean) => void; }> = ({ label, isEnabled, onToggle }) => {
    const id = useId();
    return (
        <div className="flex items-center justify-between">
            <label htmlFor={id} className="text-slate-200">{label}</label>
            <button
                id={id}
                type="button"
                className={`${isEnabled ? 'bg-primary-600' : 'bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-800`}
                role="switch"
                aria-checked={isEnabled}
                onClick={() => onToggle(!isEnabled)}
            >
                <span className={`${isEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}/>
            </button>
        </div>
    );
};

const InputRow: React.FC<{ label: string, type: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, step?: string, min?: number, max?: number, unit?: string }> = ({ label, unit, ...props }) => {
    const id = useId();
    return (
        <div className="flex items-center justify-between">
            <label htmlFor={id} className="text-slate-200">{label}</label>
            <div className="relative">
                <input id={id} {...props} className="w-32 bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                {unit && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{unit}</span>}
            </div>
        </div>
    );
};


export const SettingsView: React.FC = () => {
    const { settings, setSetting } = useSettings();
    const { resetPlants } = usePlants();
    const { addNotification } = useNotifications();
    const { t } = useTranslations();
    const importId = useId();
    const [activeCategory, setActiveCategory] = useState<SettingsCategory>('display');

    const handleResetPlants = () => {
        if (window.confirm(t('settingsView.data.resetPlantsConfirm'))) {
            resetPlants();
            addNotification(t('settingsView.data.resetPlantsSuccess'), 'success');
        }
    };

    const handleResetAllData = () => {
        if (window.confirm(t('settingsView.data.resetAllConfirm'))) {
            storageService.clearAll();
            addNotification(t('settingsView.data.resetAllSuccess'), 'info');
            window.location.reload();
        }
    };
    
    const handleExportAllData = () => {
        if (!window.confirm(t('settingsView.data.exportConfirm'))) return;
        
        try {
            const dataToExport: Record<string, any> = {
                app_id: 'cannabis-grow-guide-2025',
                export_date: new Date().toISOString(),
                version: '2.5.0'
            };
            const keysToExport = [
                'settings', 'plants', 'favorites',
                'user_added_strains', 'exports', 'setups',
                'knowledge-archive', 'plant-advisor-archive'
            ];

            keysToExport.forEach(key => {
                const item = storageService.getItem(key, null);
                if (item) {
                    dataToExport[`cannabis-grow-guide-${key}`] = item;
                }
            });

            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `canna-guide-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            addNotification(t('settingsView.data.exportSuccess'), 'success');
        } catch(e) {
            addNotification(t('settingsView.data.exportError'), 'error');
            console.error("Export failed:", e);
        }
    };

    const handleImportAllData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("Invalid file content");
                const data = JSON.parse(text);

                if (data.app_id !== 'cannabis-grow-guide-2025') {
                    throw new Error(t('settingsView.data.importInvalidFile'));
                }
                
                if (!window.confirm(t('settingsView.data.importConfirm'))) {
                    if (event.target) event.target.value = '';
                    return;
                }

                Object.keys(data).forEach(key => {
                    if (key.startsWith('cannabis-grow-guide-')) {
                         storageService.setItem(key.replace('cannabis-grow-guide-', ''), data[key]);
                    }
                });

                addNotification(t('settingsView.data.importSuccess'), 'success');
                setTimeout(() => window.location.reload(), 2000);

            } catch (error) {
                addNotification(`${t('settingsView.data.importError')}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleNotificationSettingChange = (key: keyof NotificationSettings, value: boolean) => {
        setSetting('notificationSettings', { ...settings.notificationSettings, [key]: value });
    };

    const handleDefaultGrowSetupChange = (key: keyof GrowSetup, value: any) => {
        setSetting('defaultGrowSetup', { ...settings.defaultGrowSetup, [key]: value });
    };
    
    const categories: {id: SettingsCategory, label: string, icon: React.ReactNode}[] = [
        { id: 'display', label: t('settingsView.display.title'), icon: <PhosphorIcons.PaintBrush/> },
        { id: 'notifications', label: t('settingsView.notifications.title'), icon: <PhosphorIcons.BellSimple/> },
        { id: 'simulation', label: t('settingsView.simulation.title'), icon: <PhosphorIcons.GameController/> },
        { id: 'defaults', label: t('settingsView.defaults.title'), icon: <PhosphorIcons.Gear/> },
        { id: 'data', label: t('settingsView.data.title'), icon: <PhosphorIcons.ArchiveBox/> },
    ];

    const activeCategoryLabel = categories.find(c => c.id === activeCategory)?.label || '';

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <nav className="md:col-span-1">
                <Card className="p-2">
                    <ul className="space-y-1">
                        {categories.map(cat => (
                            <li key={cat.id}>
                                <button
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${activeCategory === cat.id ? 'bg-primary-500/20 text-primary-300' : 'text-slate-300 hover:bg-slate-700'}`}
                                >
                                    <div className="w-5 h-5">{cat.icon}</div>
                                    <span className="font-semibold">{cat.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </Card>
            </nav>
            <main className="md:col-span-3">
                <h2 className="text-2xl font-bold font-display text-primary-300 mb-4">{activeCategoryLabel}</h2>
                <div className="space-y-6">
                    {activeCategory === 'display' && (
                        <SettingsSection title={t('settingsView.display.title')}>
                            <SelectRow label={t('settingsView.display.language')} value={settings.language} onChange={e => setSetting('language', e.target.value as Language)}>
                                <option value="en">English</option>
                                <option value="de">Deutsch</option>
                            </SelectRow>
                            <SelectRow label={t('settingsView.display.theme')} value={settings.theme} onChange={e => setSetting('theme', e.target.value as Theme)}>
                                <option value="midnight">{t('settingsView.display.themes.midnight')}</option>
                                <option value="forest">{t('settingsView.display.themes.forest')}</option>
                                <option value="purple-haze">{t('settingsView.display.themes.purpleHaze')}</option>
                            </SelectRow>
                            <SelectRow label={t('settingsView.display.fontSize')} value={settings.fontSize} onChange={e => setSetting('fontSize', e.target.value as any)}>
                                <option value="sm">{t('settingsView.display.fontSizes.sm')}</option>
                                <option value="base">{t('settingsView.display.fontSizes.base')}</option>
                                <option value="lg">{t('settingsView.display.fontSizes.lg')}</option>
                            </SelectRow>
                        </SettingsSection>
                    )}
                    {activeCategory === 'notifications' && (
                         <SettingsSection title={t('settingsView.notifications.title')}>
                            <ToggleRow label={t('settingsView.notifications.enableAll')} isEnabled={settings.notificationsEnabled} onToggle={(val) => setSetting('notificationsEnabled', val)} />
                            {settings.notificationsEnabled && (
                                <div className="pl-4 border-l-2 border-slate-700 space-y-3">
                                    <ToggleRow label={t('settingsView.notifications.stageChange')} isEnabled={settings.notificationSettings.stageChange} onToggle={(val) => handleNotificationSettingChange('stageChange', val)} />
                                    <ToggleRow label={t('settingsView.notifications.problemDetected')} isEnabled={settings.notificationSettings.problemDetected} onToggle={(val) => handleNotificationSettingChange('problemDetected', val)} />
                                    <ToggleRow label={t('settingsView.notifications.harvestReady')} isEnabled={settings.notificationSettings.harvestReady} onToggle={(val) => handleNotificationSettingChange('harvestReady', val)} />
                                    <ToggleRow label={t('settingsView.notifications.newTask')} isEnabled={settings.notificationSettings.newTask} onToggle={(val) => handleNotificationSettingChange('newTask', val)} />
                                </div>
                            )}
                        </SettingsSection>
                    )}
                    {activeCategory === 'simulation' && (
                        <SettingsSection title={t('settingsView.simulation.title')}>
                             <SelectRow label={t('settingsView.simulation.speed')} value={settings.simulationSettings.speed} onChange={e => setSetting('simulationSettings', {...settings.simulationSettings, speed: e.target.value as any})}>
                                <option value="1x">1x</option>
                                <option value="2x">2x</option>
                                <option value="5x">5x</option>
                                <option value="10x">10x</option>
                                <option value="20x">20x</option>
                            </SelectRow>
                             <SelectRow label={t('settingsView.simulation.difficulty')} value={settings.simulationSettings.difficulty} onChange={e => setSetting('simulationSettings', {...settings.simulationSettings, difficulty: e.target.value as any})}>
                                <option value="easy">{t('settingsView.simulation.difficulties.easy')}</option>
                                <option value="normal">{t('settingsView.simulation.difficulties.normal')}</option>
                                <option value="hard">{t('settingsView.simulation.difficulties.hard')}</option>
                            </SelectRow>
                        </SettingsSection>
                    )}
                    {activeCategory === 'defaults' && (
                        <SettingsSection title={t('settingsView.defaults.title')}>
                            <h4 className="font-semibold text-slate-300">{t('settingsView.defaults.growSetup')}</h4>
                            <div className="pl-4 border-l-2 border-slate-700 space-y-4">
                                <SelectRow label={t('plantsView.setupModal.lightSource')} value={settings.defaultGrowSetup.lightType} onChange={e => handleDefaultGrowSetupChange('lightType', e.target.value as any)}>
                                    <option value="LED">LED</option><option value="HPS">HPS</option><option value="CFL">CFL</option>
                                </SelectRow>
                                <SelectRow label={t('plantsView.setupModal.potSize')} value={String(settings.defaultGrowSetup.potSize)} onChange={e => handleDefaultGrowSetupChange('potSize', Number(e.target.value) as any)}>
                                    <option value="5">5L</option><option value="10">10L</option><option value="15">15L</option>
                                </SelectRow>
                                <SelectRow label={t('plantsView.setupModal.medium')} value={settings.defaultGrowSetup.medium} onChange={e => handleDefaultGrowSetupChange('medium', e.target.value as any)}>
                                     <option value="Soil">{t('plantsView.setupModal.mediums.soil')}</option>
                                     <option value="Coco">{t('plantsView.setupModal.mediums.coco')}</option>
                                     <option value="Hydro">{t('plantsView.setupModal.mediums.hydro')}</option>
                                </SelectRow>
                                <InputRow label={t('plantsView.setupModal.temp')} type="number" value={settings.defaultGrowSetup.temperature} onChange={e => handleDefaultGrowSetupChange('temperature', Number(e.target.value))} unit="°C" />
                                <InputRow label={t('plantsView.setupModal.humidity')} type="number" value={settings.defaultGrowSetup.humidity} onChange={e => handleDefaultGrowSetupChange('humidity', Number(e.target.value))} unit="%" />
                                <InputRow label={t('plantsView.setupModal.lightHours')} type="number" value={settings.defaultGrowSetup.lightHours} onChange={e => handleDefaultGrowSetupChange('lightHours', Number(e.target.value))} unit="h" />
                            </div>
                             <h4 className="font-semibold text-slate-300 pt-4">{t('settingsView.defaults.export')}</h4>
                             <div className="pl-4 border-l-2 border-slate-700 space-y-4">
                                <SelectRow label={t('strainsView.exportModal.source')} value={settings.defaultExportSettings.source} onChange={e => setSetting('defaultExportSettings', {...settings.defaultExportSettings, source: e.target.value as ExportSource})}>
                                    {['selected', 'favorites', 'filtered', 'all'].map(s => <option key={s} value={s}>{t(`strainsView.exportModal.sources.${s}`)}</option>)}
                                </SelectRow>
                                <SelectRow label={t('strainsView.exportModal.format')} value={settings.defaultExportSettings.format} onChange={e => setSetting('defaultExportSettings', {...settings.defaultExportSettings, format: e.target.value as ExportFormat})}>
                                    {['pdf', 'txt', 'csv', 'json'].map(f => <option key={f} value={f}>{t(`strainsView.exportModal.formats.${f}`)}</option>)}
                                </SelectRow>
                            </div>
                        </SettingsSection>
                    )}
                    {activeCategory === 'data' && (
                         <SettingsSection title={t('settingsView.data.title')}>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 <Button variant="secondary" onClick={handleExportAllData}>{t('settingsView.data.exportAll')}</Button>
                                 <Button variant="secondary" as="label" htmlFor={importId} className="cursor-pointer text-center flex justify-center items-center">
                                    {t('settingsView.data.importAll')}
                                    <input type="file" id={importId} accept=".json" className="hidden" onChange={handleImportAllData} />
                                </Button>
                                 <Button variant="danger" onClick={handleResetPlants}>{t('settingsView.data.resetPlants')}</Button>
                                 <Button variant="danger" onClick={handleResetAllData}>{t('settingsView.data.resetAll')}</Button>
                            </div>
                        </SettingsSection>
                    )}
                </div>
            </main>
        </div>
    );
};
