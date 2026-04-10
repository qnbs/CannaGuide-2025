import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useUIStore } from '@/stores/useUIStore'
import { VoiceMode } from '@/types'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Button } from '@/components/common/Button'
import { voiceOrchestratorService } from '@/services/voiceOrchestratorService'

/**
 * VoiceHUD -- Floating overlay showing the current voice orchestrator state.
 * Displays: mode indicator, CSS waveform animation, transcript preview,
 * and confirmation controls. Themed via glass-pane + CSS custom properties.
 */
export const VoiceHUD: React.FC = () => {
    const { t } = useTranslation()
    const settings = useAppSelector(selectSettings)
    const mode = useVoiceStore((s) => s.mode)
    const transcriptHistory = useVoiceStore((s) => s.transcriptHistory)
    const confirmationPending = useVoiceStore((s) => s.confirmationPending)
    const error = useVoiceStore((s) => s.error)
    const isListening = useUIStore((s) => s.voiceControl.isListening)
    const [collapsed, setCollapsed] = useState(false)
    const [waveformAmplitudes, setWaveformAmplitudes] = useState<number[]>([])
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const rafRef = useRef(0)
    const streamRef = useRef<MediaStream | null>(null)

    // Dynamic waveform via AnalyserNode (when voiceWorkerEnabled)
    const voiceWorkerEnabled = settings.voiceControl.voiceWorkerEnabled
    const showDynamicWaveform =
        voiceWorkerEnabled && (mode === VoiceMode.LISTENING || mode === VoiceMode.SPEAKING)

    useEffect(() => {
        if (!showDynamicWaveform) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((tr) => tr.stop())
                streamRef.current = null
            }
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => {})
                audioContextRef.current = null
                analyserRef.current = null
            }
            setWaveformAmplitudes([])
            return
        }

        let cancelled = false

        const startWaveform = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                if (cancelled) {
                    stream.getTracks().forEach((tr) => tr.stop())
                    return
                }
                streamRef.current = stream
                const ctx = new AudioContext()
                audioContextRef.current = ctx
                const source = ctx.createMediaStreamSource(stream)
                const analyser = ctx.createAnalyser()
                analyser.fftSize = 64
                source.connect(analyser)
                analyserRef.current = analyser

                const dataArray = new Float32Array(analyser.fftSize)

                const tick = () => {
                    if (cancelled) return
                    analyser.getFloatTimeDomainData(dataArray)
                    const step = Math.floor(dataArray.length / 5)
                    const amps: number[] = []
                    for (let i = 0; i < 5; i++) {
                        const val = dataArray[i * step]
                        amps.push(Math.min(1, Math.abs(val ?? 0) * 4))
                    }
                    setWaveformAmplitudes(amps)
                    rafRef.current = requestAnimationFrame(tick)
                }
                rafRef.current = requestAnimationFrame(tick)
            } catch {
                // Mic access denied or unavailable -- fall back to CSS animation
            }
        }

        void startWaveform()

        return () => {
            cancelled = true
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((tr) => tr.stop())
                streamRef.current = null
            }
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => {})
                audioContextRef.current = null
                analyserRef.current = null
            }
        }
    }, [showDynamicWaveform])

    // Only show HUD when voice is active
    const isActive =
        isListening ||
        mode === VoiceMode.LISTENING ||
        mode === VoiceMode.PROCESSING ||
        mode === VoiceMode.SPEAKING ||
        mode === VoiceMode.CONFIRMATION

    if (!settings.voiceControl.enabled || !isActive) {
        return null
    }

    if (collapsed) {
        return (
            <button
                type="button"
                className="fixed bottom-[calc(11rem+env(safe-area-inset-bottom))] sm:bottom-20 left-1/2 -translate-x-1/2 z-50 p-3 rounded-full glass-pane shadow-lg animate-fade-in min-h-[44px] min-w-[44px]"
                onClick={() => setCollapsed(false)}
                aria-label={t('voiceControl.hud.expand')}
            >
                <PhosphorIcons.Microphone className="w-5 h-5 text-red-400 animate-pulse" />
            </button>
        )
    }

    const lastTranscripts = transcriptHistory.slice(-2)
    const modeLabel = t(`voiceControl.mode.${mode}`)

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={t('voiceControl.hud.title')}
            className="fixed bottom-[calc(11rem+env(safe-area-inset-bottom))] sm:bottom-20 left-1/2 -translate-x-1/2 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl glass-pane shadow-xl animate-fade-in px-4 py-3"
        >
            {/* Header: mode + collapse */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <ModeIcon mode={mode} />
                    <span className="truncate">{modeLabel}</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="!p-1 rounded-full min-h-[32px] min-w-[32px]"
                    onClick={() => setCollapsed(true)}
                    aria-label={t('voiceControl.hud.collapse')}
                >
                    <PhosphorIcons.X className="w-4 h-4" />
                </Button>
            </div>

            {/* Waveform animation (dynamic from mic or CSS fallback) */}
            {(mode === VoiceMode.LISTENING || mode === VoiceMode.SPEAKING) && (
                <div className="flex items-end justify-center gap-[3px] h-6 mb-2" aria-hidden>
                    {[0, 1, 2, 3, 4].map((i) => {
                        const dynamicAmp = waveformAmplitudes[i]
                        const hasDynamic = showDynamicWaveform && dynamicAmp != null
                        return (
                            <span
                                key={i}
                                className={`w-1 rounded-full ${
                                    mode === VoiceMode.SPEAKING ? 'bg-green-400' : 'bg-red-400'
                                }`}
                                style={
                                    hasDynamic
                                        ? { height: `${Math.max(4, dynamicAmp * 24)}px` }
                                        : {
                                              animation: `voice-bar 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
                                              height: '6px',
                                          }
                                }
                            />
                        )
                    })}
                </div>
            )}

            {/* Confirmation controls */}
            {mode === VoiceMode.CONFIRMATION && confirmationPending && (
                <div className="mb-2 space-y-2">
                    <p className="text-sm text-center">{confirmationPending.question}</p>
                    <div className="flex gap-2 justify-center">
                        <Button
                            variant="primary"
                            size="sm"
                            className="min-h-[44px] min-w-[44px]"
                            onClick={() => {
                                voiceOrchestratorService.processTranscript('yes')
                            }}
                        >
                            {t('voiceControl.confirmation.yes')}
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            className="min-h-[44px] min-w-[44px]"
                            onClick={() => {
                                voiceOrchestratorService.processTranscript('no')
                            }}
                        >
                            {t('voiceControl.confirmation.no')}
                        </Button>
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && <p className="text-xs text-red-400 text-center mb-1">{error}</p>}

            {/* Transcript preview (last 2 lines) */}
            {lastTranscripts.length > 0 && (
                <div className="text-xs opacity-60 text-center truncate">
                    {lastTranscripts.map((tr, i) => (
                        <p key={i} className="truncate">
                            &quot;{tr}&quot;
                        </p>
                    ))}
                </div>
            )}
        </div>
    )
}

VoiceHUD.displayName = 'VoiceHUD'

// ---------------------------------------------------------------------------
// Mode icon helper
// ---------------------------------------------------------------------------

const ModeIcon: React.FC<{ mode: VoiceMode }> = ({ mode }) => {
    switch (mode) {
        case VoiceMode.LISTENING:
            return <PhosphorIcons.Microphone className="w-4 h-4 text-red-400 animate-pulse" />
        case VoiceMode.PROCESSING:
            return <PhosphorIcons.Microphone className="w-4 h-4 text-yellow-400 animate-spin" />
        case VoiceMode.SPEAKING:
            return <PhosphorIcons.SpeakerHigh className="w-4 h-4 text-green-400" />
        case VoiceMode.CONFIRMATION:
            return <PhosphorIcons.Microphone className="w-4 h-4 text-blue-400" />
        default:
            return <PhosphorIcons.Microphone className="w-4 h-4 text-slate-400" />
    }
}
