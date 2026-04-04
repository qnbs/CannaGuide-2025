import React, { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { setSetting } from '@/stores/slices/settingsSlice'
import { useAvailableVoices } from '@/hooks/useAvailableVoices'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import { Card } from '@/components/common/Card'
import { FormSection } from '@/components/ui/form'
import { Switch } from '@/components/common/Switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { RangeSlider } from '@/components/common/RangeSlider'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SearchBar } from '@/components/common/SearchBar'
import { SettingsRow } from './SettingsShared'

const CommandItem: React.FC<{
    icon: React.ReactNode
    title: string
    group: string
    onTry: () => void
}> = ({ icon, title, group, onTry }) => (
    <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-md">
        <div className="w-5 h-5 text-primary-300 flex-shrink-0">{icon}</div>
        <code className="text-sm text-slate-300 flex-grow">{title}</code>
        <span className="text-xs text-slate-500 shrink-0">{group}</span>
        <Button size="sm" variant="ghost" onClick={onTry} className="shrink-0 h-6 px-2 text-xs">
            <PhosphorIcons.Play className="w-3 h-3" />
        </Button>
    </div>
)

const VoiceSelect: React.FC<{
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    options: { value: string; label: string }[]
}> = ({ value, onChange, disabled, options }) => (
    <Select value={value} onValueChange={onChange} {...(disabled != null ? { disabled } : {})}>
        <SelectTrigger>
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            {options.map((option) => (
                <SelectItem key={option.value || '__empty'} value={option.value || '__empty'}>
                    {option.label}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
)

const VoiceSettingsTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const availableVoices = useAvailableVoices()
    const [commandSearch, setCommandSearch] = useState('')

    const handleSetSetting = (path: string, value: unknown) => {
        dispatch(setSetting({ path, value }))
    }

    const handleTestVoice = () => {
        if (!settings.tts.enabled) return
        if (
            typeof window === 'undefined' ||
            !('speechSynthesis' in window) ||
            typeof SpeechSynthesisUtterance === 'undefined'
        )
            return

        const utterance = new SpeechSynthesisUtterance(t('settingsView.tts.testVoiceSentence'))
        const langCode = settings.general.language === 'de' ? 'de-DE' : 'en-US'

        let selectedVoice = availableVoices.find((voice) => voice.name === settings.tts.voiceName)
        if (!selectedVoice)
            selectedVoice = availableVoices.find(
                (voice) => voice.lang === langCode && voice.default,
            )
        if (!selectedVoice)
            selectedVoice = availableVoices.find((voice) =>
                voice.lang.startsWith(settings.general.language),
            )

        utterance.voice = selectedVoice || null
        utterance.lang = selectedVoice?.lang || langCode
        utterance.rate = settings.tts.rate
        utterance.pitch = settings.tts.pitch
        utterance.volume = settings.tts.volume

        const synth = globalThis.speechSynthesis
        synth.cancel()
        synth.speak(utterance)
    }

    const { allCommands: paletteCommands } = useCommandPalette()

    // Exclude theme commands (9 items, too many for voice reference) and section headers
    const voiceCommands = useMemo(
        () => paletteCommands.filter((cmd) => !cmd.id.startsWith('theme_') && !cmd.isHeader),
        [paletteCommands],
    )

    const filteredCommands = useMemo(() => {
        if (!commandSearch) return voiceCommands
        const lowerCaseSearch = commandSearch.toLowerCase()
        return voiceCommands.filter(
            (cmd) =>
                cmd.title.toLowerCase().includes(lowerCaseSearch) ||
                cmd.group.toLowerCase().includes(lowerCaseSearch) ||
                (cmd.keywords ?? '').toLowerCase().includes(lowerCaseSearch),
        )
    }, [voiceCommands, commandSearch])

    return (
        <div className="space-y-6">
            <Card>
                <FormSection
                    title={t('settingsView.tts.ttsOutput')}
                    icon={<PhosphorIcons.SpeakerHigh />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.tts.ttsEnabled')}
                            description={t('settingsView.tts.ttsEnabledDesc')}
                        >
                            <Switch
                                checked={settings.tts.enabled}
                                onChange={(val) => handleSetSetting('tts.enabled', val)}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.tts.voice')}>
                            <div className="flex flex-col gap-2">
                                <VoiceSelect
                                    value={settings.tts.voiceName || '__empty'}
                                    onChange={(value) =>
                                        handleSetSetting(
                                            'tts.voiceName',
                                            value === '__empty' ? '' : value,
                                        )
                                    }
                                    options={
                                        availableVoices.length > 0
                                            ? availableVoices.map((v) => ({
                                                  value: v.name,
                                                  label: `${v.name} (${v.lang})`,
                                              }))
                                            : [
                                                  {
                                                      value: '__empty',
                                                      label: t('settingsView.tts.noVoices'),
                                                  },
                                              ]
                                    }
                                    disabled={!settings.tts.enabled || availableVoices.length === 0}
                                />
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={handleTestVoice}
                                    disabled={!settings.tts.enabled}
                                >
                                    {t('settingsView.tts.testVoice')}
                                </Button>
                            </div>
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.tts.rate')}>
                            <RangeSlider
                                singleValue
                                value={settings.tts.rate}
                                onChange={(v) => handleSetSetting('tts.rate', v)}
                                min={0.5}
                                max={2}
                                step={0.1}
                                label=""
                                unit="x"
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.tts.pitch')}>
                            <RangeSlider
                                singleValue
                                value={settings.tts.pitch}
                                onChange={(v) => handleSetSetting('tts.pitch', v)}
                                min={0.5}
                                max={2}
                                step={0.1}
                                label=""
                                unit="x"
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.tts.volume')}>
                            <RangeSlider
                                singleValue
                                value={settings.tts.volume}
                                onChange={(v) => handleSetSetting('tts.volume', v)}
                                min={0}
                                max={1}
                                step={0.05}
                                label=""
                                unit=""
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.tts.highlightSpeakingText')}
                            description={t('settingsView.tts.highlightSpeakingTextDesc')}
                        >
                            <Switch
                                checked={settings.tts.highlightSpeakingText}
                                onChange={(val) =>
                                    handleSetSetting('tts.highlightSpeakingText', val)
                                }
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
            <Card>
                <FormSection
                    title={t('settingsView.tts.voiceControlInput')}
                    icon={<PhosphorIcons.Microphone />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.tts.voiceControl.enabled')}
                            description={t('settingsView.tts.voiceControl.enabledDesc')}
                        >
                            <Switch
                                checked={settings.voiceControl.enabled}
                                onChange={(val) => handleSetSetting('voiceControl.enabled', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.tts.voiceControl.hotwordEnabled')}
                            description={t('settingsView.tts.voiceControl.hotwordEnabledDesc')}
                        >
                            <Switch
                                checked={settings.voiceControl.hotwordEnabled}
                                onChange={(val) =>
                                    handleSetSetting('voiceControl.hotwordEnabled', val)
                                }
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.tts.voiceControl.confirmationSound')}
                            description={t('settingsView.tts.voiceControl.confirmationSoundDesc')}
                        >
                            <Switch
                                checked={settings.voiceControl.confirmationSound}
                                onChange={(val) =>
                                    handleSetSetting('voiceControl.confirmationSound', val)
                                }
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
            <Card>
                <FormSection
                    title={t('settingsView.tts.commands.title')}
                    icon={<PhosphorIcons.CommandLine />}
                >
                    <div className="sm:col-span-2 space-y-4">
                        <p className="text-sm text-slate-400 -mt-2">
                            {t('settingsView.tts.commands.description')}
                        </p>
                        <SearchBar
                            placeholder={t('settingsView.tts.commands.searchPlaceholder')}
                            value={commandSearch}
                            onChange={(e) => setCommandSearch(e.target.value)}
                            onClear={() => setCommandSearch('')}
                        />
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {filteredCommands.map((cmd) => (
                                <CommandItem
                                    key={cmd.id}
                                    icon={<cmd.icon />}
                                    title={cmd.title}
                                    group={cmd.group}
                                    onTry={cmd.action}
                                />
                            ))}
                        </div>
                    </div>
                </FormSection>
            </Card>
        </div>
    )
}

const VoiceSettingsTabMemo = memo(VoiceSettingsTab)
VoiceSettingsTabMemo.displayName = 'VoiceSettingsTab'
export default VoiceSettingsTabMemo
