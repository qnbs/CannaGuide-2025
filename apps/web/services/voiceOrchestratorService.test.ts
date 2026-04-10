/**
 * voiceOrchestratorService.test.ts
 *
 * Tests for the VoiceOrchestratorService state machine:
 * init/dispose lifecycle, processTranscript routing, confirmation loops,
 * error recovery, assistant query parsing, readContent, getBestVoice.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VoiceMode } from '@/types'
import { useVoiceStore, getInitialVoiceState } from '@/stores/useVoiceStore'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSetVoiceStatusMessage = vi.fn()
const mockSetActiveView = vi.fn()
const mockAddNotification = vi.fn()
let lastTranscriptSubscriber: ((transcript: string | null) => void) | null = null

vi.mock('@/i18n', () => ({
    getT: () => (key: string, opts?: Record<string, string>) => {
        if (opts) {
            return Object.entries(opts).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, v), key)
        }
        return key
    },
}))

vi.mock('@/stores/useUIStore', () => ({
    getUISnapshot: () => ({
        setVoiceStatusMessage: mockSetVoiceStatusMessage,
        setActiveView: mockSetActiveView,
        addNotification: mockAddNotification,
    }),
    useUIStore: {
        subscribe: (_selector: unknown, cb: (val: string | null) => void) => {
            lastTranscriptSubscriber = cb
            return () => {
                lastTranscriptSubscriber = null
            }
        },
    },
}))

vi.mock('@/stores/useTtsStore', () => ({
    useTtsStore: {
        getState: () => ({
            addToTtsQueue: vi.fn(),
            isTtsSpeaking: false,
            play: vi.fn(),
        }),
    },
}))

 
const mockSpeak = vi.fn()
const mockGetVoices = vi.fn(() => [] as SpeechSynthesisVoice[])

vi.mock('@/services/ttsService', () => ({
    ttsService: {
        speak: (...args: unknown[]) => (mockSpeak as (...a: unknown[]) => void)(...args),
        getVoices: (...args: unknown[]) =>
            (mockGetVoices as (...a: unknown[]) => SpeechSynthesisVoice[])(...args),
    },
}))

const mockMatchVoiceCommand = vi.fn()
const mockBuildVoiceCommands = vi.fn(() => [] as unknown[])

vi.mock('@/services/voiceCommandRegistry', () => ({
    buildVoiceCommands: (...args: unknown[]) =>
        (mockBuildVoiceCommands as (...a: unknown[]) => unknown[])(...args),
    matchVoiceCommand: (...args: unknown[]) =>
        (mockMatchVoiceCommand as (...a: unknown[]) => unknown)(...args),
}))
 

// ---------------------------------------------------------------------------
// Mock voice helper
// ---------------------------------------------------------------------------

function mockVoice(
    overrides: Partial<SpeechSynthesisVoice> & { name: string; lang: string },
): SpeechSynthesisVoice {
    return {
        default: false,
        localService: true,
        voiceURI: overrides.name,
        ...overrides,
    } as SpeechSynthesisVoice
}

// ---------------------------------------------------------------------------
// Mock store
// ---------------------------------------------------------------------------

function createMockAppStore() {
    return {
        getState: () => ({
            settings: {
                settings: {
                    general: { language: 'en' },
                    voiceControl: { confirmationSound: false, continuousListening: false },
                    tts: { enabled: true, voiceName: null },
                },
            },
            simulation: {
                selectedPlantId: 'plant-1',
                plantSlots: ['plant-1'],
                plants: {
                    entities: {
                        'plant-1': { id: 'plant-1', name: 'Test Plant' },
                    },
                },
            },
        }),
        dispatch: vi.fn(),
        subscribe: vi.fn(() => vi.fn()),
    } as unknown
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('voiceOrchestratorService', () => {
    let service: typeof import('@/services/voiceOrchestratorService').voiceOrchestratorService

    beforeEach(async () => {
        useVoiceStore.setState(getInitialVoiceState())
        mockMatchVoiceCommand.mockReset()
        mockBuildVoiceCommands.mockReset().mockReturnValue([])
        mockSpeak.mockReset()
        mockGetVoices.mockReset().mockReturnValue([])
        mockSetVoiceStatusMessage.mockReset()
        lastTranscriptSubscriber = null

        const mod = await import('@/services/voiceOrchestratorService')
        service = mod.voiceOrchestratorService
        // Ensure previous state is fully cleared
        service.dispose()
    })

    afterEach(() => {
        service.dispose()
    })

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    describe('lifecycle', () => {
        it('init subscribes to transcript changes', () => {
            const store = createMockAppStore()
            service.init(store as never)
            expect(lastTranscriptSubscriber).not.toBeNull()
        })

        it('init is idempotent (double init does not double-subscribe)', () => {
            const store = createMockAppStore()
            service.init(store as never)
            const first = lastTranscriptSubscriber
            service.init(store as never)
            expect(lastTranscriptSubscriber).toBe(first)
        })

        it('dispose clears the subscription', () => {
            const store = createMockAppStore()
            service.init(store as never)
            service.dispose()
            expect(lastTranscriptSubscriber).toBeNull()
        })
    })

    // -----------------------------------------------------------------------
    // processTranscript -- command matching
    // -----------------------------------------------------------------------

    describe('processTranscript', () => {
        it('adds transcript to history', async () => {
            service.init(createMockAppStore() as never)
            mockMatchVoiceCommand.mockReturnValue(null)

            await service.processTranscript('hello world')
            expect(useVoiceStore.getState().transcriptHistory).toContain('hello world')
        })

        it('executes matched command', async () => {
            const actionFn = vi.fn()
            const matched = {
                id: 'nav_plants',
                label: 'Plants',
                action: actionFn,
                requiresConfirmation: false,
            }
            mockMatchVoiceCommand.mockReturnValue(matched)
            service.init(createMockAppStore() as never)

            await service.processTranscript('go to plants')
            expect(actionFn).toHaveBeenCalledWith('go to plants')
        })

        it('sets lastMatchedCommand on match', async () => {
            const matched = {
                id: 'nav_strains',
                label: 'Strains',
                action: vi.fn(),
                requiresConfirmation: false,
            }
            mockMatchVoiceCommand.mockReturnValue(matched)
            service.init(createMockAppStore() as never)

            await service.processTranscript('go to strains')
            expect(useVoiceStore.getState().lastMatchedCommand).toBe('nav_strains')
        })

        it('handles no match with error feedback', async () => {
            mockMatchVoiceCommand.mockReturnValue(null)
            service.init(createMockAppStore() as never)

            await service.processTranscript('gibberish xyz')
            expect(useVoiceStore.getState().error).toBe('voiceControl.errors.notUnderstood')
        })

        it('goes IDLE after MAX_ERROR_RETRIES (3) unmatched attempts', async () => {
            mockMatchVoiceCommand.mockReturnValue(null)
            service.init(createMockAppStore() as never)

            await service.processTranscript('bad1')
            await service.processTranscript('bad2')
            await service.processTranscript('bad3')

            expect(useVoiceStore.getState().error).toBe('voiceControl.errors.maxRetries')
            expect(useVoiceStore.getState().mode).toBe(VoiceMode.IDLE)
        })

        it('resets error count on successful match', async () => {
            mockMatchVoiceCommand.mockReturnValueOnce(null)
            service.init(createMockAppStore() as never)
            await service.processTranscript('bad')
            expect(useVoiceStore.getState().error).not.toBeNull()

            const matched = {
                id: 'nav_plants',
                label: 'Plants',
                action: vi.fn(),
                requiresConfirmation: false,
            }
            mockMatchVoiceCommand.mockReturnValue(matched)
            await service.processTranscript('go to plants')
            expect(useVoiceStore.getState().error).toBeNull()
        })
    })

    // -----------------------------------------------------------------------
    // Confirmation loops
    // -----------------------------------------------------------------------

    describe('confirmation loops', () => {
        it('enters CONFIRMATION mode for requiresConfirmation commands', async () => {
            const matched = {
                id: 'plant_water_all',
                label: 'Water all',
                action: vi.fn(),
                requiresConfirmation: true,
            }
            mockMatchVoiceCommand.mockReturnValue(matched)
            service.init(createMockAppStore() as never)

            await service.processTranscript('water all')
            expect(useVoiceStore.getState().mode).toBe(VoiceMode.CONFIRMATION)
            expect(useVoiceStore.getState().confirmationPending).not.toBeNull()
        })

        it('"yes" confirms and executes the command', async () => {
            const actionFn = vi.fn()
            const matched = {
                id: 'plant_water_all',
                label: 'Water all',
                action: actionFn,
                requiresConfirmation: true,
            }
            mockMatchVoiceCommand.mockReturnValue(matched)
            service.init(createMockAppStore() as never)

            await service.processTranscript('water all')
            // Now in CONFIRMATION mode
            await service.processTranscript('yes')
            expect(actionFn).toHaveBeenCalled()
        })

        it('"nein" cancels the confirmation', async () => {
            const matched = {
                id: 'plant_water_all',
                label: 'Water all',
                action: vi.fn(),
                requiresConfirmation: true,
            }
            mockMatchVoiceCommand.mockReturnValue(matched)
            service.init(createMockAppStore() as never)

            await service.processTranscript('water all')
            await service.processTranscript('nein')
            expect(useVoiceStore.getState().mode).toBe(VoiceMode.IDLE)
            expect(useVoiceStore.getState().confirmationPending).toBeNull()
        })

        it('unrecognized answer re-asks yes/no', async () => {
            const matched = {
                id: 'plant_water_all',
                label: 'Water all',
                action: vi.fn(),
                requiresConfirmation: true,
            }
            mockMatchVoiceCommand.mockReturnValue(matched)
            service.init(createMockAppStore() as never)

            await service.processTranscript('water all')
            await service.processTranscript('maybe')
            // Should still be in confirmation mode
            expect(useVoiceStore.getState().mode).toBe(VoiceMode.CONFIRMATION)
            // TTS should have been called with yesOrNo prompt
            expect(mockSpeak).toHaveBeenCalled()
        })
    })

    // -----------------------------------------------------------------------
    // Assistant query
    // -----------------------------------------------------------------------

    describe('assistant query', () => {
        it('routes "gemini" prefixed transcript to assistant handler', async () => {
            service.init(createMockAppStore() as never)
            // No match for the full transcript
            mockMatchVoiceCommand.mockReturnValue(null)

            // Simulate -- processTranscript will try assistant
            await service.processTranscript('gemini what is vpd')
            // Should enter PROCESSING mode (then fail or succeed)
            // We just verify it did NOT go through error path
            expect(useVoiceStore.getState().error).toBeNull()
        })
    })

    // -----------------------------------------------------------------------
    // readContent
    // -----------------------------------------------------------------------

    describe('readContent', () => {
        it('calls readContent without error', () => {
            service.init(createMockAppStore() as never)
            // readContent enqueues into TTS store -- just verify it does not throw
            expect(() => service.readContent('Hello world', 'content-1')).not.toThrow()
        })
    })

    // -----------------------------------------------------------------------
    // getBestVoice
    // -----------------------------------------------------------------------

    describe('getBestVoice', () => {
        it('returns null when no voices available', () => {
            service.init(createMockAppStore() as never)
            mockGetVoices.mockReturnValue([])
            expect(service.getBestVoice('en')).toBeNull()
        })

        it('prefers Google voice', () => {
            service.init(createMockAppStore() as never)
            const googleVoice = mockVoice({ name: 'Google US English', lang: 'en-US' })
            const otherVoice = mockVoice({ name: 'Default', lang: 'en-US', default: true })
            mockGetVoices.mockReturnValue([otherVoice, googleVoice])

            const result = service.getBestVoice('en')
            expect(result?.name).toBe('Google US English')
        })

        it('falls back to Microsoft voice', () => {
            service.init(createMockAppStore() as never)
            const msVoice = mockVoice({ name: 'Microsoft Zira', lang: 'en-US' })
            const otherVoice = mockVoice({ name: 'Other', lang: 'en-US' })
            mockGetVoices.mockReturnValue([otherVoice, msVoice])

            const result = service.getBestVoice('en')
            expect(result?.name).toBe('Microsoft Zira')
        })

        it('falls back to default voice', () => {
            service.init(createMockAppStore() as never)
            const defaultVoice = mockVoice({ name: 'System Default', lang: 'en-US', default: true })
            const otherVoice = mockVoice({ name: 'Other', lang: 'en-US' })
            mockGetVoices.mockReturnValue([otherVoice, defaultVoice])

            const result = service.getBestVoice('en')
            expect(result?.name).toBe('System Default')
        })
    })

    // -----------------------------------------------------------------------
    // speakFeedback
    // -----------------------------------------------------------------------

    describe('speakFeedback', () => {
        it('calls ttsService.speak when TTS enabled', () => {
            service.init(createMockAppStore() as never)
            service.speakFeedback('Test message')
            expect(mockSpeak).toHaveBeenCalledWith(
                'Test message',
                'en',
                expect.any(Function),
                expect.any(Object),
            )
        })

        it('does not call ttsService.speak when TTS disabled', () => {
            const store = createMockAppStore() as { getState: () => Record<string, unknown> }
            const originalGetState = store.getState
            ;(store as { getState: () => unknown }).getState = () => {
                const s = originalGetState() as {
                    settings: {
                        settings: { tts: { enabled: boolean } }
                    }
                }
                s.settings.settings.tts.enabled = false
                return s
            }
            service.init(store as never)
            service.speakFeedback('Test message')
            expect(mockSpeak).not.toHaveBeenCalled()
        })
    })
})
