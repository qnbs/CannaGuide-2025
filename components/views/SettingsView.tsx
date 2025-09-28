import React, { useState, useId } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { AppSettings, Language, Theme, View, SortKey, SortDirection, UiDensity } from '@/types';
import { useAvailableVoices } from '@/hooks/useAvailableVoices';
import { Switch } from '@/components/common/Switch';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectSettings } from '@/stores/selectors';
import { setSetting, exportAllData, resetAllData } from '@/stores/slices/settingsSlice';
import { setOnboardingStep, addNotification } from '@/stores/slices/uiSlice';
import { resetPlants } from '@/stores/slices/simulationSlice';
import { FlagDE, FlagEN } from '@/components/icons/Flags';

interface SettingsViewProps {
    deferredPrompt: any;
    onInstallClick: () => void;
}

const SettingsSection: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, icon, defaultOpen = false }) => {
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
};

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
    const dispatch = useAppDispatch();
    const settings = useAppSelector(selectSettings);
    
    const voices = useAvailableVoices();
    const isInstalled = !deferredPrompt;
    
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
            dispatch(resetPlants());
            dispatch(addNotification({ message: t('settingsView.data.resetPlantsSuccess'), type: 'success' }));
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

            <SettingsSection title={t('settingsView.categories.general')} icon={<PhosphorIcons.Gear />} defaultOpen>
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
                    <select value={settings.fontSize} onChange={e => handleSetSetting('fontSize', e.target.value as 'sm'|'base'|'lg')} className="select-input">
                        {Object.keys(t('settingsView.general.fontSizes', { returnObjects: true })).map(key => <option key={key} value={key}>{t(`settingsView.general.fontSizes.${key}`)}</option>)}
                    </select>
                </SettingRow>
                <SettingRow label={t('settingsView.accessibility.dyslexiaFont')} description={t('settingsView.accessibility.dyslexiaFontDesc')}>
                    <Switch checked={settings.accessibility.dyslexiaFont} onChange={val => handleSetSetting('accessibility.dyslexiaFont', val)} aria-label={t('settingsView.accessibility.dyslexiaFont')} />
                </SettingRow>
                <SettingRow label={t('settingsView.accessibility.reducedMotion')} description={t('settingsView.accessibility.reducedMotionDesc')}>
                    <Switch checked={settings.accessibility.reducedMotion} onChange={val => handleSetSetting('accessibility.reducedMotion', val)} aria-label={t('settingsView.accessibility.reducedMotion')} />
                </SettingRow>
            </SettingsSection>

            <SettingsSection title={t('settingsView.categories.tts')} icon={<PhosphorIcons.SpeakerHigh />}>
                <SettingRow label={t('settingsView.tts.enabled')} description={t('settingsView.tts.enabledDesc')}>
                    <Switch checked={settings.tts.enabled} onChange={val => handleSetSetting('tts.enabled', val)} aria-label={t('settingsView.tts.enabled')} />
                </SettingRow>
                <SettingRow label={t('settingsView.tts.voice')}>
                    <select value={settings.tts.voiceName || ''} onChange={e => handleSetSetting('tts.voiceName', e.target.value)} className="select-input max-w-xs" disabled={!settings.tts.enabled || voices.length === 0}>
                        {voices.length > 0 ? voices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>) : <option>{t('settingsView.tts.noVoices')}</option>}
                    </select>
                </SettingRow>
                 <SettingRow label={t('settingsView.tts.rate')}>
                    <span className="font-mono text-sm">{settings.tts.rate.toFixed(1)}x</span>
                    <input type="range" min="0.5" max="2" step="0.1" value={settings.tts.rate} onChange={e => handleSetSetting('tts.rate', parseFloat(e.target.value))} disabled={!settings.tts.enabled} className="w-32 accent-primary-500" />
                </SettingRow>
                 <SettingRow label={t('settingsView.tts.pitch')}>
                    <span className="font-mono text-sm">{settings.tts.pitch.toFixed(1)}</span>
                    <input type="range" min="0.5" max="2" step="0.1" value={settings.tts.pitch} onChange={e => handleSetSetting('tts.pitch', parseFloat(e.target.value))} disabled={!settings.tts.enabled} className="w-32 accent-primary-500" />
                </SettingRow>
            </SettingsSection>
            
            <SettingsSection title={t('settingsView.categories.strains')} icon={<PhosphorIcons.Leafy />}>
                <SettingRow label={t('settingsView.strains.defaultViewMode')}>
                     <select value={settings.strainsViewSettings.defaultViewMode} onChange={e => handleSetSetting('strainsViewSettings.defaultViewMode', e.target.value as 'list'|'grid')} className="select-input">
                        {Object.keys(t('settingsView.strains.viewModes', {returnObjects: true})).map(key => <option key={key} value={key}>{t(`settingsView.strains.viewModes.${key}`)}</option>)}
                    </select>
                </SettingRow>
                <SettingRow label={t('settingsView.strains.defaultSort')}>
                    <select value={settings.strainsViewSettings.defaultSortKey} onChange={e => handleSetSetting('strainsViewSettings.defaultSortKey', e.target.value as SortKey)} className="select-input">
                       {/* FIX: Cast key to SortKey to resolve TypeScript error */}
                       {Object.keys(t('settingsView.strains.sortKeys', {returnObjects: true})).map(key => <option key={key} value={key}>{t(`settingsView.strains.sortKeys.${key as SortKey}`)}</option>)}
                    </select>
                    <select value={settings.strainsViewSettings.defaultSortDirection} onChange={e => handleSetSetting('strainsViewSettings.defaultSortDirection', e.target.value as SortDirection)} className="select-input">
                       {Object.keys(t('settingsView.strains.sortDirections', {returnObjects: true})).map(key => <option key={key} value={key}>{t(`settingsView.strains.sortDirections.${key}`)}</option>)}
                    </select>
                </SettingRow>
                 <SettingRow label={t('settingsView.strains.visibleColumns')} description={t('settingsView.strains.visibleColumnsDesc')} className="!flex-col sm:!flex-col !items-start">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                        {Object.keys(settings.strainsViewSettings.visibleColumns).map(col => (
                            <div key={col} className="flex items-center gap-2">
                                <input
                                    id={`col-${col}`} type="checkbox"
                                    checked={settings.strainsViewSettings.visibleColumns[col as keyof typeof settings.strainsViewSettings.visibleColumns]}
                                    onChange={e => handleSetSetting(`strainsViewSettings.visibleColumns.${col}`, e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500"
                                />
                                <label htmlFor={`col-${col}`}>{t(`settingsView.strains.columns.${col}`)}</label>
                            </div>
                        ))}
                    </div>
                </SettingRow>
            </SettingsSection>
            
            <SettingsSection title={t('settingsView.categories.plants')} icon={<PhosphorIcons.Plant />}>
                <SettingRow label={t('settingsView.plants.autoAdvance')} description={t('settingsView.plants.autoAdvanceDesc')}>
                    <Switch checked={settings.simulationSettings.autoAdvance} onChange={val => handleSetSetting('simulationSettings.autoAdvance', val)} aria-label={t('settingsView.plants.autoAdvance')} />
                </SettingRow>
                <SettingRow label={t('settingsView.plants.speed')}>
                     <select value={settings.simulationSettings.speed} onChange={e => handleSetSetting('simulationSettings.speed', e.target.value as '1x'|'2x'|'4x')} className="select-input" disabled={!settings.simulationSettings.autoAdvance}>
                        <option value="1x">1x</option><option value="2x">2x</option><option value="4x">4x</option>
                    </select>
                </SettingRow>
            </SettingsSection>

            <SettingsSection title={t('settingsView.categories.notifications')} icon={<PhosphorIcons.BellSimple />}>
                 <SettingRow label={t('settingsView.notifications.enableAll')}>
                    <Switch checked={settings.notificationsEnabled} onChange={val => handleSetSetting('notificationsEnabled', val)} aria-label={t('settingsView.notifications.enableAll')} />
                </SettingRow>
                 <SettingRow label={t('settingsView.notifications.stageChange')}><Switch checked={settings.notificationSettings.stageChange} onChange={val => handleSetSetting('notificationSettings.stageChange', val)}/></SettingRow>
                 <SettingRow label={t('settingsView.notifications.problemDetected')}><Switch checked={settings.notificationSettings.problemDetected} onChange={val => handleSetSetting('notificationSettings.problemDetected', val)}/></SettingRow>
                 <SettingRow label={t('settingsView.notifications.harvestReady')}><Switch checked={settings.notificationSettings.harvestReady} onChange={val => handleSetSetting('notificationSettings.harvestReady', val)}/></SettingRow>
                 <SettingRow label={t('settingsView.notifications.newTask')}><Switch checked={settings.notificationSettings.newTask} onChange={val => handleSetSetting('notificationSettings.newTask', val)}/></SettingRow>
                 <SettingRow label={t('settingsView.notifications.quietHours')} description={t('settingsView.notifications.quietHoursDesc')}>
                    <input type="time" value={settings.quietHours.start} onChange={e => handleSetSetting('quietHours.start', e.target.value)} className="input-base w-28" />
                    <input type="time" value={settings.quietHours.end} onChange={e => handleSetSetting('quietHours.end', e.target.value)} className="input-base w-28" />
                    <Switch checked={settings.quietHours.enabled} onChange={val => handleSetSetting('quietHours.enabled', val)} aria-label={t('settingsView.notifications.enableQuietHours')} />
                </SettingRow>
            </SettingsSection>
            
             <SettingsSection title={t('settingsView.categories.defaults')} icon={<PhosphorIcons.BracketsCurly />}>
                <SettingRow label={t('settingsView.defaults.growSetup')} className="!items-start !flex-col">
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mt-2">
                        <select value={settings.defaultGrowSetup.light.type} onChange={e => handleSetSetting('defaultGrowSetup.light.type', e.target.value)} className="select-input">
                            <option>LED</option><option>HPS</option><option>CFL</option>
                        </select>
                         <input type="number" value={settings.defaultGrowSetup.light.wattage} onChange={e => handleSetSetting('defaultGrowSetup.light.wattage', Number(e.target.value))} className="input-base" />
                         <input type="number" value={settings.defaultGrowSetup.potSize} onChange={e => handleSetSetting('defaultGrowSetup.potSize', Number(e.target.value))} className="input-base" />
                        <select value={settings.defaultGrowSetup.medium} onChange={e => handleSetSetting('defaultGrowSetup.medium', e.target.value)} className="select-input">
                            <option>Soil</option><option>Coco</option><option>Hydro</option>
                        </select>
                    </div>
                </SettingRow>
                <SettingRow label={t('settingsView.defaults.journalNotesTitle')} className="!items-start !flex-col">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-2">
                        <input type="text" value={settings.defaultJournalNotes.watering} onChange={e => handleSetSetting('defaultJournalNotes.watering', e.target.value)} className="input-base" aria-label={t('settingsView.defaults.wateringNoteLabel')} />
                        <input type="text" value={settings.defaultJournalNotes.feeding} onChange={e => handleSetSetting('defaultJournalNotes.feeding', e.target.value)} className="input-base" aria-label={t('settingsView.defaults.feedingNoteLabel')} />
                    </div>
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
                 <SettingRow label={t('settingsView.about.disclaimer')} className="!items-start">
                    <p className="text-sm text-slate-400 max-w-md">{t('common.disclaimer.text')}</p>
                 </SettingRow>
            </SettingsSection>
        </div>
    );
};
