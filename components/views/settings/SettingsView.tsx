import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectSettings } from '@/stores/selectors';
import { setSetting, exportAllData, resetAllData } from '@/stores/slices/settingsSlice';
import { resetPlants } from '@/stores/slices/simulationSlice';
import { clearArchives } from '@/stores/slices/archivesSlice';
import { setOnboardingStep } from '@/stores/slices/uiSlice';
import { Language, Theme, AppSettings } from '@/types';
import { Select } from '@/components/ui/ThemePrimitives';
import { Switch } from '@/components/common/Switch';
import { useAvailableVoices } from '@/hooks/useAvailableVoices';
import { useStorageEstimate } from '@/hooks/useStorageEstimate';
import { FlagDE, FlagEN } from '@/components/icons/Flags';

// --- Internal Components to Match Screenshot Style ---

const SettingsSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => (
    <details open={defaultOpen} className="bg-slate-800/30 rounded-xl border border-slate-700/50 group">
        <summary className="list-none flex justify-between items-center p-4 cursor-pointer font-bold text-slate-100">
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-lg">{title}</span>
            </div>
            <PhosphorIcons.ChevronDown className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-2 border-t border-slate-700/50">
            {children}
        </div>
    </details>
);

const SettingsRow: React.FC<{ label: string; description?: string; children: React.ReactNode; className?: string }> = ({ label, description, children, className = '' }) => (
    <div className={`flex justify-between items-center py-3 border-b border-slate-700/50 last:border-b-0 ${className}`}>
        <div>
            <p className="font-semibold text-slate-200">{label}</p>
            {description && <p className="text-sm text-slate-400 max-w-md">{description}</p>}
        </div>
        <div className="flex-shrink-0 ml-4">{children}</div>
    </div>
);

const SegmentedButtons: React.FC<{ options: { value: string; label: string, icon?: React.ReactNode }[]; value: string; onChange: (value: string) => void; }> = ({ options, value, onChange }) => (
    <div className="flex items-center bg-slate-900 rounded-lg p-1 space-x-1">
        {options.map(opt => (
            <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${value === opt.value ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-800/50'}`}
            >
                {opt.icon}
                {opt.label}
            </button>
        ))}
    </div>
);

// --- Main Settings Component ---

const SettingsView: React.FC = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useAppDispatch();
    // FIX: Cast the result of `useAppSelector` to the correct type to avoid 'unknown' type errors.
    const settings = useAppSelector(selectSettings) as AppSettings;
    const availableVoices = useAvailableVoices();
    const { estimates, isLoading: isEstimating } = useStorageEstimate();

    const handleSettingChange = (path: string, value: any) => {
        dispatch(setSetting({ path, value }));
        if (path === 'language') {
            i18n.changeLanguage(value);
        }
    };
    
    const handleReplayOnboarding = () => {
        if(window.confirm(t('settingsView.data.replayOnboardingConfirm'))){
            dispatch(setSetting({path: 'onboardingCompleted', value: false}));
            dispatch(setOnboardingStep(0));
        }
    }

    const handleExportData = () => {
        if (window.confirm(t('settingsView.data.exportConfirm'))) {
            dispatch(exportAllData());
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6 animate-fade-in">
                <PhosphorIcons.Gear className="w-16 h-16 mx-auto text-primary-400" />
                <h2 className="text-3xl font-bold font-display text-primary-400 mt-2">{t('settingsView.title')}</h2>
            </div>

            <SettingsSection title={t('settingsView.categories.general')} icon={<PhosphorIcons.Gear className="text-primary-400" />} defaultOpen>
                <SettingsRow label={t('settingsView.general.language')}>
                    <SegmentedButtons
                        value={settings.language}
                        onChange={(val) => handleSettingChange('language', val as Language)}
                        options={[
                            { value: 'de', label: t('settingsView.languages.de'), icon: <FlagDE className="w-5 h-5 rounded-sm" /> },
                            { value: 'en', label: t('settingsView.languages.en'), icon: <FlagEN className="w-5 h-5 rounded-sm" /> },
                        ]}
                    />
                </SettingsRow>
                 <SettingsRow label={t('settingsView.general.theme')}>
                    <Select
                        value={settings.theme}
                        onChange={(e) => handleSettingChange('theme', e.target.value as Theme)}
                        options={Object.keys(t('settingsView.general.themes', { returnObjects: true })).map(key => ({ value: key, label: t(`settingsView.general.themes.${key}`) }))}
                        className="w-40"
                    />
                </SettingsRow>
                <SettingsRow label={t('settingsView.general.fontSize')}>
                    <SegmentedButtons
                        value={settings.fontSize}
                        onChange={(val) => handleSettingChange('fontSize', val)}
                        options={[
                            { value: 'sm', label: t('settingsView.general.fontSizes.sm') },
                            { value: 'base', label: t('settingsView.general.fontSizes.base') },
                            { value: 'lg', label: t('settingsView.general.fontSizes.lg') },
                        ]}
                    />
                </SettingsRow>
                <SettingsRow label={t('settingsView.general.expertModeTitle')} description={t('settingsView.general.expertModeDesc')}>
                     <Switch
                        checked={settings.isExpertMode}
                        onChange={(val) => handleSettingChange('isExpertMode', val)}
                    />
                </SettingsRow>
            </SettingsSection>

            <SettingsSection title={t('settingsView.categories.accessibility')} icon={<PhosphorIcons.Person className="text-accent-400" />}>
                 <SettingsRow label={t('settingsView.accessibility.dyslexiaFont')} description={t('settingsView.accessibility.dyslexiaFontDesc')}>
                    <Switch
                        checked={settings.accessibility.dyslexiaFont}
                        onChange={(val) => handleSettingChange('accessibility.dyslexiaFont', val)}
                    />
                </SettingsRow>
                <SettingsRow label={t('settingsView.accessibility.reducedMotion')} description={t('settingsView.accessibility.reducedMotionDesc')}>
                    <Switch
                        checked={settings.accessibility.reducedMotion}
                        onChange={(val) => handleSettingChange('accessibility.reducedMotion', val)}
                    />
                </SettingsRow>
                 <SettingsRow label={t('settingsView.accessibility.uiDensity')}>
                     <SegmentedButtons
                        value={settings.uiDensity}
                        onChange={(val) => handleSettingChange('uiDensity', val)}
                        options={[
                            { value: 'comfortable', label: t('settingsView.accessibility.uiDensities.comfortable') },
                            { value: 'compact', label: t('settingsView.accessibility.uiDensities.compact') },
                        ]}
                    />
                </SettingsRow>
            </SettingsSection>
            
             <SettingsSection title={t('settingsView.categories.tts')} icon={<PhosphorIcons.SpeakerHigh className="text-secondary-400" />}>
                <SettingsRow label={t('settingsView.tts.enabled')} description={t('settingsView.tts.enabledDesc')}>
                    <Switch
                        checked={settings.tts.enabled}
                        onChange={(val) => handleSettingChange('tts.enabled', val)}
                    />
                </SettingsRow>
                <SettingsRow label={t('settingsView.tts.voice')}>
                     <Select
                        value={settings.tts.voiceName || ''}
                        onChange={(e) => handleSettingChange('tts.voiceName', e.target.value as string)}
                        options={availableVoices.length > 0 ? availableVoices.map(v => ({ value: v.name, label: v.name })) : [{ value: '', label: t('settingsView.tts.noVoices') }]}
                        disabled={!settings.tts.enabled || availableVoices.length === 0}
                        className="w-48"
                    />
                </SettingsRow>
                 <SettingsRow label={t('settingsView.tts.rate')}>
                    <input
                        type="range" min="0.5" max="2" step="0.1"
                        value={settings.tts.rate}
                        onChange={(e) => handleSettingChange('tts.rate', parseFloat(e.target.value))}
                        disabled={!settings.tts.enabled}
                        className="w-40"
                    />
                </SettingsRow>
                 <SettingsRow label={t('settingsView.tts.pitch')}>
                    <input
                        type="range" min="0" max="2" step="0.1"
                        value={settings.tts.pitch}
                        onChange={(e) => handleSettingChange('tts.pitch', parseFloat(e.target.value))}
                        disabled={!settings.tts.enabled}
                        className="w-40"
                    />
                </SettingsRow>
            </SettingsSection>

            <SettingsSection title={t('settingsView.categories.data')} icon={<PhosphorIcons.ArchiveBox className="text-orange-400" />}>
                 <div className="py-3 border-b border-slate-700/50">
                    <p className="font-semibold text-slate-200">{t('settingsView.data.storageUsage')}</p>
                    {isEstimating ? <p className="text-sm text-slate-400 mt-2">Calculating...</p> : (
                        <ul className="text-sm space-y-1 text-slate-400 mt-2">
                            {Object.entries(estimates).map(([key, value]) => (
                                <li key={key} className="flex justify-between">
                                    <span>{t(`settingsView.data.storageBreakdown.${key}`)}:</span>
                                    <span className="font-mono">{value}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                 <SettingsRow label={t('settingsView.data.exportAll')} description={t('settingsView.data.noBackup')}>
                    <Button onClick={handleExportData} variant="secondary">{t('common.export')}</Button>
                </SettingsRow>
                <SettingsRow label={t('settingsView.data.clearArchives')} description={t('settingsView.data.clearArchivesDesc')}>
                    <Button onClick={() => { if(window.confirm(t('settingsView.data.clearArchivesConfirm'))) dispatch(clearArchives())}} variant="danger">{t('settingsView.data.clearArchives')}</Button>
                </SettingsRow>
                <SettingsRow label={t('settingsView.data.replayOnboarding')}>
                     <Button onClick={handleReplayOnboarding} variant="secondary">{t('settingsView.data.replayOnboarding')}</Button>
                </SettingsRow>
                <SettingsRow label={t('settingsView.data.resetPlants')}>
                    <Button onClick={() => { if(window.confirm(t('settingsView.data.resetPlantsConfirm'))) dispatch(resetPlants())}} variant="danger">{t('settingsView.data.resetPlants')}</Button>
                </SettingsRow>
                 <SettingsRow label={t('settingsView.data.resetAll')}>
                    <Button onClick={() => { if(window.confirm(t('settingsView.data.resetAllConfirm'))) dispatch(resetAllData())}} variant="danger">{t('settingsView.data.resetAll')}</Button>
                </SettingsRow>
            </SettingsSection>

             <SettingsSection title={t('settingsView.about.title')} icon={<PhosphorIcons.Info className="text-sky-400" />}>
                <SettingsRow label="" className="!items-start">
                     <div className="text-sm text-slate-300 prose prose-sm dark:prose-invert max-w-none prose-ul:mt-2 prose-ul:mb-0" dangerouslySetInnerHTML={{ __html: t('common.metadataDescription') }} />
                </SettingsRow>
                <SettingsRow label={t('settingsView.about.version')}>
                    <span className="font-semibold text-slate-200">2.0</span>
                </SettingsRow>
                <SettingsRow label={t('settingsView.about.devWithAIStudio')}>
                    <Button as="a" href="https://aistudio.google.com/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-" target="_blank" rel="noopener noreferrer" variant="secondary">{t('settingsView.about.getTheAppHere')}</Button>
                </SettingsRow>
                <SettingsRow label={t('settingsView.about.github')}>
                    <Button as="a" href="https://github.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer" variant="secondary">{t('settingsView.about.githubLinkText')}</Button>
                </SettingsRow>
            </SettingsSection>
        </div>
    );
};

export default SettingsView;