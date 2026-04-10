/**
 * VoiceHUD.test.tsx
 *
 * Tests for the VoiceHUD component: conditional rendering based on
 * voice mode, collapse/expand, confirmation UI, error display, transcript.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import { VoiceMode } from '@/types'
import { useVoiceStore, getInitialVoiceState } from '@/stores/useVoiceStore'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

vi.mock('@/stores/store', () => ({
    useAppSelector: (selector: (s: unknown) => unknown) =>
        selector({
            settings: {
                settings: {
                    voiceControl: { enabled: true },
                },
            },
        }),
}))

vi.mock('@/stores/selectors', () => ({
    selectSettings: (s: { settings: { settings: unknown } }) => s.settings.settings,
}))

let mockIsListening = false

vi.mock('@/stores/useUIStore', () => ({
    useUIStore: (selector: (s: Record<string, unknown>) => unknown) => {
        const state: Record<string, unknown> = {
            voiceControl: {
                isListening: mockIsListening,
            },
        }
        return selector(state)
    },
}))

vi.mock('@/services/voiceOrchestratorService', () => ({
    voiceOrchestratorService: {
        processTranscript: vi.fn(),
        readContent: vi.fn(),
    },
}))

vi.mock('@/components/icons/PhosphorIcons', () => ({
    PhosphorIcons: {
        Microphone: (props: React.SVGAttributes<SVGElement>) =>
            React.createElement('svg', { ...props, 'data-testid': 'mic-icon' }),
        SpeakerHigh: (props: React.SVGAttributes<SVGElement>) =>
            React.createElement('svg', { ...props, 'data-testid': 'speaker-icon' }),
        X: (props: React.SVGAttributes<SVGElement>) =>
            React.createElement('svg', { ...props, 'data-testid': 'x-icon' }),
    },
}))

vi.mock('./Button', () => ({
    Button: ({
        children,
        onClick,
        ...rest
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
        variant?: string
        size?: string
    }) => React.createElement('button', { onClick, ...rest }, children),
}))

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

import { VoiceHUD } from './VoiceHUD'

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
    vi.clearAllMocks()
    useVoiceStore.setState(getInitialVoiceState())
    mockIsListening = false
})

afterEach(() => {
    cleanup()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VoiceHUD', () => {
    it('does not render when voice is not active', () => {
        const { container } = render(React.createElement(VoiceHUD))
        expect(container.innerHTML).toBe('')
    })

    it('renders when mode is LISTENING', () => {
        useVoiceStore.setState({ mode: VoiceMode.LISTENING })
        render(React.createElement(VoiceHUD))
        expect(screen.getByRole('status')).toBeDefined()
    })

    it('renders when isListening is true', () => {
        mockIsListening = true
        render(React.createElement(VoiceHUD))
        expect(screen.getByRole('status')).toBeDefined()
    })

    it('renders mode label', () => {
        useVoiceStore.setState({ mode: VoiceMode.PROCESSING })
        render(React.createElement(VoiceHUD))
        expect(screen.getByText('voiceControl.mode.processing')).toBeDefined()
    })

    it('shows waveform bars when LISTENING', () => {
        useVoiceStore.setState({ mode: VoiceMode.LISTENING })
        const { container } = render(React.createElement(VoiceHUD))
        const bars = container.querySelectorAll('[aria-hidden]')
        expect(bars.length).toBeGreaterThan(0)
    })

    it('shows confirmation controls in CONFIRMATION mode', () => {
        useVoiceStore.setState({
            mode: VoiceMode.CONFIRMATION,
            confirmationPending: {
                commandId: 'test',
                question: 'Are you sure?',
                onConfirm: () => {},
                onCancel: () => {},
            },
        })
        render(React.createElement(VoiceHUD))
        expect(screen.getByText('voiceControl.confirmation.yes')).toBeDefined()
        expect(screen.getByText('voiceControl.confirmation.no')).toBeDefined()
        expect(screen.getByText('Are you sure?')).toBeDefined()
    })

    it('shows error message', () => {
        useVoiceStore.setState({
            mode: VoiceMode.LISTENING,
            error: 'Something failed',
        })
        render(React.createElement(VoiceHUD))
        expect(screen.getByText('Something failed')).toBeDefined()
    })

    it('shows last transcripts', () => {
        useVoiceStore.setState({
            mode: VoiceMode.LISTENING,
            transcriptHistory: ['hello', 'world'],
        })
        render(React.createElement(VoiceHUD))
        expect(screen.getByText('"hello"')).toBeDefined()
        expect(screen.getByText('"world"')).toBeDefined()
    })

    it('collapses to a small button', () => {
        useVoiceStore.setState({ mode: VoiceMode.LISTENING })
        render(React.createElement(VoiceHUD))

        // Click collapse
        const collapseBtn = screen.getByLabelText('voiceControl.hud.collapse')
        fireEvent.click(collapseBtn)

        // Should show expand button
        expect(screen.getByLabelText('voiceControl.hud.expand')).toBeDefined()
    })

    it('expands back from collapsed state', () => {
        useVoiceStore.setState({ mode: VoiceMode.LISTENING })
        render(React.createElement(VoiceHUD))

        fireEvent.click(screen.getByLabelText('voiceControl.hud.collapse'))
        fireEvent.click(screen.getByLabelText('voiceControl.hud.expand'))

        expect(screen.getByRole('status')).toBeDefined()
    })

    it('has displayName', () => {
        expect(VoiceHUD.displayName).toBe('VoiceHUD')
    })
})
