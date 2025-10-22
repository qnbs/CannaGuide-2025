import React, { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectSettings } from '@/stores/selectors';
import { setSetting } from '@/stores/slices/settingsSlice';
import { useAvailableVoices } from '@/hooks/useAvailableVoices';
import { Card } from '@/components/common/Card';
import { FormSection } from '@/components/ui/ThemePrimitives';
import { Switch } from '@/components/common/Switch';
import { Select } from '@/components/ui/ThemePrimitives';
import { RangeSlider } from '@/components/common/RangeSlider';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SearchBar } from '@/components/common/SearchBar';

const SettingsRow: React.FC<{
    label: string
    description?: string
    children: React.ReactNode
}> = ({ label, description, children }) => (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
            <h4 className="font-semibold text-slate-100">{label}</h4>
            {description && <p className="text-sm text-slate-400">{description}</p>}
        </div>
        <div className="w-full flex-shrink-0 sm:w-auto sm:max-w-xs">{children}</div>
    </div>
);

const CommandItem: React.FC<{ icon: React.ReactNode, text: string }> = ({ icon, text }) => (
    <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-md">
        <div className="w-5 h-5 text-primary-300 flex-shrink-0">{icon}</div>
        <code className="text-sm text-slate-300">{text}</code>
    </div>
);

const VoiceSettingsTab: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const settings = useAppSelector(selectSettings);
    const availableVoices = useAvailableVoices();
    const [commandSearch, setCommandSearch] = useState('');

    const handleSetSetting = (path: string, value: any) => {
        dispatch(setSetting({ path, value }));
    };

    const handleTestVoice = () => {
        if (!settings.tts.enabled) return;
        const utterance = new SpeechSynthesisUtterance(t('settingsView.tts.testVoiceSentence'));
        const langCode = settings.general.language === 'de' ? 'de-DE' : 'en-US';
        
        let selectedVoice = availableVoices.find(voice => voice.name === settings.tts.voiceName);
        if (!selectedVoice) selectedVoice = availableVoices.find(voice => voice.lang === langCode && voice.default);
        if (!selectedVoice) selectedVoice = availableVoices.find(voice => voice.lang.startsWith(settings.general.language));

        utterance.voice = selectedVoice || null;
        utterance.lang = selectedVoice?.lang || langCode;
        utterance.rate = settings.tts.rate;
        utterance.pitch = settings.tts.pitch;
        utterance.volume = settings.tts.volume;

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    const allCommands = useMemo(() => ([
        { group: 'navigation', icon: <PhosphorIcons.Plant/>, text: t('settingsView.tts.commands.goTo', { view: t('nav.plants')}) },
        { group: 'navigation', icon: <PhosphorIcons.Leafy/>, text: t('settingsView.tts.commands.goTo', { view: t('nav.strains')}) },
        { group: 'strains', icon: <PhosphorIcons.MagnifyingGlass/>, text: t('settingsView.tts.commands.searchFor')},
        { group: 'strains', icon: <PhosphorIcons.FunnelSimple/>, text: t('settingsView.tts.commands.resetFilters')},
        { group: 'strains', icon: <PhosphorIcons.Heart/>, text: t('settingsView.tts.commands.showFavorites')},
        { group: 'plants', icon: <PhosphorIcons.Drop/>, text: t('settingsView.tts.commands.waterAll')},
    ]), [t]);

    const filteredCommands = useMemo(() => {
        if (!commandSearch) return allCommands;
        const lowerCaseSearch = commandSearch.toLowerCase();
        return allCommands.filter(cmd => cmd.text.toLowerCase().includes(lowerCaseSearch) || cmd.group.toLowerCase().includes(lowerCaseSearch));
    }, [allCommands, commandSearch]);

    return (
        <div className="space-y-6">
            <Card>
                <FormSection title={t('settingsView.tts.ttsOutput')} icon={<PhosphorIcons.SpeakerHigh/>} defaultOpen>
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow label={t('settingsView.tts.ttsEnabled')} description={t('settingsView.tts.ttsEnabledDesc')}><Switch checked={settings.tts.enabled} onChange={(val) => handleSetSetting('tts.enabled', val)}/></SettingsRow>
                        <SettingsRow label={t('settingsView.tts.voice')}>
                            <div className="flex flex-col gap-2">
                                <Select value={settings.tts.voiceName || ''} onChange={(e) => handleSetSetting('tts.voiceName', e.target.value)} options={ availableVoices.length > 0 ? availableVoices.map((v) => ({ value: v.name, label: `${v.name} (${v.lang})` })) : [{ value: '', label: t('settingsView.tts.noVoices') }] } disabled={!settings.tts.enabled || availableVoices.length === 0}/>
                                <Button size="sm" variant="secondary" onClick={handleTestVoice} disabled={!settings.tts.enabled}>{t('settingsView.tts.testVoice')}</Button>
                            </div>
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.tts.rate')}><RangeSlider singleValue value={settings.tts.rate} onChange={v => handleSetSetting('tts.rate', v)} min={0.5} max={2} step={0.1} label="" unit="x" /></SettingsRow>
                        <SettingsRow label={t('settingsView.tts.pitch')}><RangeSlider singleValue value={settings.tts.pitch} onChange={v => handleSetSetting('tts.pitch', v)} min={0.5} max={2} step={0.1} label="" unit="x" /></SettingsRow>
                        <SettingsRow label={t('settingsView.tts.highlightSpeakingText')} description={t('settingsView.tts.highlightSpeakingTextDesc')}><Switch checked={settings.tts.highlightSpeakingText} onChange={(val) => handleSetSetting('tts.highlightSpeakingText', val)}/></SettingsRow>
                    </div>
                </FormSection>
            </Card>
            <Card>
                <FormSection title={t('settingsView.tts.voiceControlInput')} icon={<PhosphorIcons.Microphone/>} defaultOpen>
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow label={t('settingsView.tts.voiceControl.enabled')} description={t('settingsView.tts.voiceControl.enabledDesc')}><Switch checked={settings.voiceControl.enabled} onChange={(val) => handleSetSetting('voiceControl.enabled', val)}/></SettingsRow>
                        <SettingsRow label={t('settingsView.tts.voiceControl.confirmationSound')} description={t('settingsView.tts.voiceControl.confirmationSoundDesc')}><Switch checked={settings.voiceControl.confirmationSound} onChange={(val) => handleSetSetting('voiceControl.confirmationSound', val)}/></SettingsRow>
                    </div>
                </FormSection>
            </Card>
            <Card>
                <FormSection title={t('settingsView.tts.commands.title')} icon={<PhosphorIcons.CommandLine/>}>
                    <div className="sm:col-span-2 space-y-4">
                        <p className="text-sm text-slate-400 -mt-2">{t('settingsView.tts.commands.description')}</p>
                        <SearchBar placeholder={t('settingsView.tts.commands.searchPlaceholder')} value={commandSearch} onChange={e => setCommandSearch(e.target.value)} onClear={() => setCommandSearch('')} />
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {filteredCommands.map(cmd => <CommandItem key={cmd.text} icon={cmd.icon} text={cmd.text} />)}
                        </div>
                    </div>
                </FormSection>
            </Card>
        </div>
    );
};

export default memo(VoiceSettingsTab);