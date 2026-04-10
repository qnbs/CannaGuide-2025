import React, { memo, useMemo, useState, useCallback } from 'react'
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
import { PORCUPINE_BUILTIN_KEYWORDS } from '@/constants'
import { voiceTelemetryService } from '@/services/voiceTelemetryService'
import type { VoiceTelemetrySnapshot } from '@/types'

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
    const [analyticsSnapshot, setAnalyticsSnapshot] = useState<VoiceTelemetrySnapshot | null>(null)

    const handleSetSetting = (path: string, value: unknown) => {
        dispatch(setSetting({ path, value }))
    }

    const refreshAnalytics = useCallback(() => {
        setAnalyticsSnapshot(voiceTelemetryService.getVoiceTelemetrySnapshot())
    }, [])

    const handleExportAnalytics = useCallback(() => {
        const events = voiceTelemetryService.exportVoiceEvents()
        const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `voice-analytics-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
    }, [])

    const handleClearAnalytics = useCallback(() => {
        voiceTelemetryService.clearVoiceEvents()
        setAnalyticsSnapshot(null)
    }, [])

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
                            label={t('settingsView.tts.voiceControl.continuousListening')}
                            description={t('settingsView.tts.voiceControl.continuousListeningDesc')}
                        >
                            <Switch
                                checked={settings.voiceControl.continuousListening}
                                onChange={(val) =>
                                    handleSetSetting('voiceControl.continuousListening', val)
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
            {/* Wake-Word Engine */}
            <Card>
                <FormSection
                    title={t('settingsView.voice.wakeWord.title')}
                    icon={<PhosphorIcons.Microphone />}
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.voice.wakeWord.engine')}
                            description={t('settingsView.voice.wakeWord.engineDesc')}
                        >
                            <VoiceSelect
                                value={settings.voiceControl.wakeWordEngine}
                                onChange={(val) =>
                                    handleSetSetting('voiceControl.wakeWordEngine', val)
                                }
                                options={[
                                    {
                                        value: 'regex',
                                        label: t('settingsView.voice.wakeWord.regex'),
                                    },
                                    {
                                        value: 'porcupine',
                                        label: t('settingsView.voice.wakeWord.porcupine'),
                                    },
                                ]}
                            />
                        </SettingsRow>
                        {settings.voiceControl.wakeWordEngine === 'porcupine' && (
                            <>
                                <SettingsRow
                                    label={t('settingsView.voice.wakeWord.accessKey')}
                                    description={t('settingsView.voice.wakeWord.accessKeyDesc')}
                                >
                                    <input
                                        type="password"
                                        className="w-full px-3 py-2 rounded-md bg-slate-900/50 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        value={settings.voiceControl.porcupineAccessKey ?? ''}
                                        onChange={(e) =>
                                            handleSetSetting(
                                                'voiceControl.porcupineAccessKey',
                                                e.target.value || null,
                                            )
                                        }
                                        placeholder={t(
                                            'settingsView.voice.wakeWord.accessKeyPlaceholder',
                                        )}
                                        autoComplete="off"
                                    />
                                </SettingsRow>
                                <SettingsRow label={t('settingsView.voice.wakeWord.keyword')}>
                                    <VoiceSelect
                                        value={settings.voiceControl.porcupineKeyword}
                                        onChange={(val) =>
                                            handleSetSetting('voiceControl.porcupineKeyword', val)
                                        }
                                        options={PORCUPINE_BUILTIN_KEYWORDS.map((kw) => ({
                                            value: kw,
                                            label: kw,
                                        }))}
                                    />
                                </SettingsRow>
                            </>
                        )}
                    </div>
                </FormSection>
            </Card>
            {/* Cloud TTS */}
            <Card>
                <FormSection
                    title={t('settingsView.voice.cloudTts.title')}
                    icon={<PhosphorIcons.SpeakerHigh />}
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.voice.cloudTts.enabled')}
                            description={t('settingsView.voice.cloudTts.enabledDesc')}
                        >
                            <Switch
                                checked={settings.tts.cloudTtsEnabled}
                                onChange={(val) => handleSetSetting('tts.cloudTtsEnabled', val)}
                            />
                        </SettingsRow>
                        {settings.tts.cloudTtsEnabled && (
                            <>
                                <SettingsRow label={t('settingsView.voice.cloudTts.provider')}>
                                    <VoiceSelect
                                        value={settings.tts.cloudTtsProvider}
                                        onChange={(val) =>
                                            handleSetSetting('tts.cloudTtsProvider', val)
                                        }
                                        options={[{ value: 'elevenlabs', label: 'ElevenLabs' }]}
                                    />
                                </SettingsRow>
                                <SettingsRow
                                    label={t('settingsView.voice.cloudTts.apiKey')}
                                    description={t('settingsView.voice.cloudTts.apiKeyDesc')}
                                >
                                    <input
                                        type="password"
                                        className="w-full px-3 py-2 rounded-md bg-slate-900/50 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        value={settings.tts.cloudTtsApiKey ?? ''}
                                        onChange={(e) =>
                                            handleSetSetting(
                                                'tts.cloudTtsApiKey',
                                                e.target.value || null,
                                            )
                                        }
                                        placeholder={t(
                                            'settingsView.voice.cloudTts.apiKeyPlaceholder',
                                        )}
                                        autoComplete="off"
                                    />
                                </SettingsRow>
                                <p className="text-xs text-slate-500">
                                    {t('settingsView.voice.cloudTts.privacyNote')}
                                </p>
                            </>
                        )}
                    </div>
                </FormSection>
            </Card>
            {/* Voice Worker + Analytics */}
            <Card>
                <FormSection
                    title={t('settingsView.voice.advanced.title')}
                    icon={<PhosphorIcons.Gear />}
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.voice.advanced.workerEnabled')}
                            description={t('settingsView.voice.advanced.workerEnabledDesc')}
                        >
                            <Switch
                                checked={settings.voiceControl.voiceWorkerEnabled}
                                onChange={(val) =>
                                    handleSetSetting('voiceControl.voiceWorkerEnabled', val)
                                }
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.voice.advanced.analyticsEnabled')}
                            description={t('settingsView.voice.advanced.analyticsEnabledDesc')}
                        >
                            <Switch
                                checked={settings.voiceControl.voiceAnalyticsEnabled}
                                onChange={(val) =>
                                    handleSetSetting('voiceControl.voiceAnalyticsEnabled', val)
                                }
                            />
                        </SettingsRow>
                        {settings.voiceControl.voiceAnalyticsEnabled && (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={refreshAnalytics}
                                    >
                                        {t('settingsView.voice.advanced.refreshStats')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={handleExportAnalytics}
                                    >
                                        {t('settingsView.voice.advanced.export')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={handleClearAnalytics}
                                    >
                                        {t('settingsView.voice.advanced.clear')}
                                    </Button>
                                </div>
                                {analyticsSnapshot && (
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="p-2 bg-slate-900/50 rounded">
                                            <span className="text-slate-500">
                                                {t('settingsView.voice.advanced.totalCommands')}
                                            </span>
                                            <p className="text-lg font-medium">
                                                {analyticsSnapshot.totalCommands}
                                            </p>
                                        </div>
                                        <div className="p-2 bg-slate-900/50 rounded">
                                            <span className="text-slate-500">
                                                {t('settingsView.voice.advanced.successRate')}
                                            </span>
                                            <p className="text-lg font-medium">
                                                {(analyticsSnapshot.successRate * 100).toFixed(0)}%
                                            </p>
                                        </div>
                                        <div className="p-2 bg-slate-900/50 rounded">
                                            <span className="text-slate-500">
                                                {t('settingsView.voice.advanced.avgLatency')}
                                            </span>
                                            <p className="text-lg font-medium">
                                                {analyticsSnapshot.avgMatchLatencyMs.toFixed(0)} ms
                                            </p>
                                        </div>
                                        <div className="p-2 bg-slate-900/50 rounded">
                                            <span className="text-slate-500">
                                                {t('settingsView.voice.advanced.hotwordCount')}
                                            </span>
                                            <p className="text-lg font-medium">
                                                {analyticsSnapshot.hotwordDetections}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
