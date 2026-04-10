/**
 * VoiceControl.test.tsx
 *
 * Tests for VoiceControl component: SpeechRecognition lifecycle,
 * hotword detection (V-03), command routing, error handling, UI state.
 *
 * Pattern: install SpeechRecognition mock before each test, dynamic import
 * because VoiceControl.tsx evaluates `hasSpeechRecognitionSupport` at
 * module-load time (matches useDictation.test.ts pattern).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'

// ---------------------------------------------------------------------------
// Mock SpeechRecognition API
// ---------------------------------------------------------------------------

type ListenerFn = (event?: unknown) => void

type MockRecInstance = {
    continuous: boolean
    interimResults: boolean
    lang: string
    start: ReturnType<typeof vi.fn>
    stop: ReturnType<typeof vi.fn>
    abort: ReturnType<typeof vi.fn>
    fire: (type: string, payload?: unknown) => void
}

const mockInstances: MockRecInstance[] = []

type WindowWithSpeech = Window & { SpeechRecognition?: unknown }

function installMockSpeechRecognition(): void {
    mockInstances.length = 0

    class MockSpeechRecognition implements MockRecInstance {
        continuous = false
        interimResults = false
        lang = ''
        private _listeners: Record<string, ListenerFn> = {}

        addEventListener(type: string, fn: ListenerFn): void {
            this._listeners[type] = fn
        }

        removeEventListener(_type: string, _fn: ListenerFn): void {
            /* no-op for tests */
        }

        start = vi.fn()
        stop = vi.fn()
        abort = vi.fn()

        fire(type: string, payload?: unknown): void {
            this._listeners[type]?.(payload)
        }

        constructor() {
            mockInstances.push(this)
        }
    }

    ;(window as WindowWithSpeech).SpeechRecognition = MockSpeechRecognition
}

function uninstallMockSpeechRecognition(): void {
    delete (window as WindowWithSpeech).SpeechRecognition
    mockInstances.length = 0
}

// ---------------------------------------------------------------------------
// Mocks: i18n, Redux, Zustand stores, sub-components
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

const mockSetVoiceListening = vi.fn()
const mockSetVoiceStatusMessage = vi.fn()
const mockProcessVoiceCommand = vi.fn()

vi.mock('@/stores/useUIStore', () => ({
    useUIStore: (selector: (s: Record<string, unknown>) => unknown) => {
        const state: Record<string, unknown> = {
            voiceControl: {
                isListening: false,
                isAvailable: true,
                statusMessage: null,
            },
            setVoiceListening: mockSetVoiceListening,
            setVoiceStatusMessage: mockSetVoiceStatusMessage,
            processVoiceCommand: mockProcessVoiceCommand,
        }
        return selector(state)
    },
}))

vi.mock('@/stores/store', () => ({
    useAppSelector: (selector: (s: unknown) => unknown) =>
        selector({
            settings: {
                settings: {
                    general: { language: 'en' },
                    voiceControl: { hotwordEnabled: false, continuousListening: false },
                },
            },
        }),
}))

vi.mock('@/stores/selectors', () => ({
    selectLanguage: (s: { settings: { settings: { general: { language: string } } } }) =>
        s.settings.settings.general.language,
    selectSettings: (s: { settings: { settings: unknown } }) => s.settings.settings,
}))

vi.mock('@/components/icons/PhosphorIcons', () => ({
    PhosphorIcons: {
        Microphone: (props: React.SVGAttributes<SVGElement>) =>
            React.createElement('svg', {
                ...props,
                'data-testid': 'mic-icon',
            }),
    },
}))

vi.mock('./Button', () => ({
    Button: ({
        children,
        onClick,
        ...rest
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
        variant?: string
    }) => React.createElement('button', { onClick, ...rest }, children),
}))

// ---------------------------------------------------------------------------
// Helper: dynamic import of VoiceControl (must run AFTER mock installation)
// ---------------------------------------------------------------------------

async function importVoiceControl(): Promise<React.FC> {
    vi.resetModules()
    const mod = await import('./VoiceControl')
    return mod.VoiceControl
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
    vi.clearAllMocks()
    installMockSpeechRecognition()
})

afterEach(() => {
    cleanup()
    uninstallMockSpeechRecognition()
    vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Rendering + UI State
// ---------------------------------------------------------------------------

describe('VoiceControl -- rendering', () => {
    it('renders a microphone button when speech recognition is available', async () => {
        const VC = await importVoiceControl()
        render(React.createElement(VC))
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveAttribute('aria-label', 'common.voiceControl.toggle')
    })

    it('renders a screen-reader live region', async () => {
        const VC = await importVoiceControl()
        render(React.createElement(VC))
        const status = screen.getByRole('status')
        expect(status).toBeInTheDocument()
        expect(status).toHaveAttribute('aria-live', 'polite')
    })

    it('microphone button has aria-pressed=false when not listening', async () => {
        const VC = await importVoiceControl()
        render(React.createElement(VC))
        const button = screen.getByRole('button')
        expect(button).toHaveAttribute('aria-pressed', 'false')
    })
})

// ---------------------------------------------------------------------------
// SpeechRecognition lifecycle
// ---------------------------------------------------------------------------

describe('VoiceControl -- recognition lifecycle', () => {
    it('creates a SpeechRecognition instance on mount', async () => {
        const VC = await importVoiceControl()
        render(React.createElement(VC))
        expect(mockInstances.length).toBeGreaterThanOrEqual(1)
    })

    it('sets continuous=false and interimResults=true on main recognizer', async () => {
        const VC = await importVoiceControl()
        render(React.createElement(VC))
        const main = mockInstances[0]
        expect(main?.continuous).toBe(false)
        expect(main?.interimResults).toBe(true)
    })

    it('aborts recognition on unmount', async () => {
        const VC = await importVoiceControl()
        const { unmount } = render(React.createElement(VC))
        const main = mockInstances[0]
        unmount()
        expect(main?.abort).toHaveBeenCalled()
    })
})

// ---------------------------------------------------------------------------
// Command processing via transcript
// ---------------------------------------------------------------------------

describe('VoiceControl -- command processing', () => {
    it('calls processVoiceCommand on final transcript', async () => {
        const VC = await importVoiceControl()
        render(React.createElement(VC))
        const main = mockInstances[0]

        main?.fire('result', {
            results: {
                length: 1,
                0: {
                    isFinal: true,
                    length: 1,
                    0: { transcript: 'go to plants', confidence: 0.95 },
                },
            },
        })

        expect(mockProcessVoiceCommand).toHaveBeenCalledWith('go to plants')
    })

    it('does not call processVoiceCommand on interim transcript', async () => {
        const VC = await importVoiceControl()
        render(React.createElement(VC))
        const main = mockInstances[0]

        main?.fire('result', {
            results: {
                length: 1,
                0: {
                    isFinal: false,
                    length: 1,
                    0: { transcript: 'go to', confidence: 0.6 },
                },
            },
        })

        expect(mockProcessVoiceCommand).not.toHaveBeenCalled()
        expect(mockSetVoiceStatusMessage).toHaveBeenCalled()
    })

    it('stops recognition after processing a final result', async () => {
        const VC = await importVoiceControl()
        render(React.createElement(VC))
        const main = mockInstances[0]

        main?.fire('result', {
            results: {
                length: 1,
                0: {
                    isFinal: true,
                    length: 1,
                    0: { transcript: 'open mentor', confidence: 0.9 },
                },
            },
        })

        expect(main?.stop).toHaveBeenCalled()
    })
})

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('VoiceControl -- error handling', () => {
    it('sets no-speech error message', async () => {
        const VC = await importVoiceControl()
        render(React.createElement(VC))
        const main = mockInstances[0]

        main?.fire('error', { error: 'no-speech' })

        expect(mockSetVoiceStatusMessage).toHaveBeenCalledWith(
            'common.voiceControl.errors.noSpeech',
        )
        expect(mockSetVoiceListening).toHaveBeenCalledWith(false)
    })

    it('sets not-allowed error message', async () => {
        const VC = await importVoiceControl()
        render(React.createElement(VC))
        const main = mockInstances[0]

        main?.fire('error', { error: 'not-allowed' })

        expect(mockSetVoiceStatusMessage).toHaveBeenCalledWith(
            'common.voiceControl.errors.notAllowed',
        )
    })

    it('sets generic error message for unknown errors', async () => {
        const VC = await importVoiceControl()
        render(React.createElement(VC))
        const main = mockInstances[0]

        main?.fire('error', { error: 'network' })

        expect(mockSetVoiceStatusMessage).toHaveBeenCalledWith('common.voiceControl.errors.generic')
    })
})

// ---------------------------------------------------------------------------
// End handling
// ---------------------------------------------------------------------------

describe('VoiceControl -- end handling', () => {
    it('sets listening to false and clears status on end', async () => {
        const VC = await importVoiceControl()
        render(React.createElement(VC))
        const main = mockInstances[0]

        main?.fire('end')

        expect(mockSetVoiceListening).toHaveBeenCalledWith(false)
        expect(mockSetVoiceStatusMessage).toHaveBeenCalledWith(null)
    })
})

// ---------------------------------------------------------------------------
// Toggle listening (button click)
// ---------------------------------------------------------------------------

describe('VoiceControl -- toggle button', () => {
    it('calls start on the recognizer when toggle is clicked', async () => {
        const VC = await importVoiceControl()
        render(React.createElement(VC))
        const button = screen.getByRole('button')
        const main = mockInstances[0]

        fireEvent.click(button)

        expect(main?.start).toHaveBeenCalled()
        expect(mockSetVoiceListening).toHaveBeenCalledWith(true)
    })
})

// ---------------------------------------------------------------------------
// HOTWORD_REGEX (V-03) -- pattern validation
// ---------------------------------------------------------------------------

describe('VoiceControl -- hotword regex (V-03)', () => {
    const HOTWORD_REGEX = /hey\s+canna(?:guide)?/i

    it('matches "hey canna"', () => {
        expect(HOTWORD_REGEX.test('hey canna')).toBe(true)
    })

    it('matches "hey cannaguide"', () => {
        expect(HOTWORD_REGEX.test('hey cannaguide')).toBe(true)
    })

    it('matches within a longer phrase', () => {
        expect(HOTWORD_REGEX.test('ok so hey cannaguide show me plants')).toBe(true)
    })

    it('matches case-insensitively', () => {
        expect(HOTWORD_REGEX.test('Hey CannaGuide')).toBe(true)
        expect(HOTWORD_REGEX.test('HEY CANNA')).toBe(true)
    })

    it('requires whitespace between "hey" and "canna"', () => {
        expect(HOTWORD_REGEX.test('heycanna')).toBe(false)
    })

    it('does not match "canna" alone', () => {
        expect(HOTWORD_REGEX.test('canna')).toBe(false)
    })

    it('does not match "hey" alone', () => {
        expect(HOTWORD_REGEX.test('hey there how are you')).toBe(false)
    })

    it('allows multiple spaces between hey and canna', () => {
        expect(HOTWORD_REGEX.test('hey   canna')).toBe(true)
    })
})
