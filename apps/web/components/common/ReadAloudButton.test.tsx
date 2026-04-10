/**
 * ReadAloudButton.test.tsx
 *
 * Tests for the ReadAloudButton component: conditional rendering,
 * click behavior, accessibility attributes.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

let mockTtsEnabled = true

vi.mock('@/stores/store', () => ({
    useAppSelector: (selector: (s: unknown) => unknown) =>
        selector({
            settings: {
                settings: {
                    tts: { enabled: mockTtsEnabled },
                },
            },
        }),
}))

vi.mock('@/stores/selectors', () => ({
    selectTtsEnabled: (s: { settings: { settings: { tts: { enabled: boolean } } } }) =>
        s.settings.settings.tts.enabled,
}))

const mockReadContent = vi.fn()

vi.mock('@/services/voiceOrchestratorService', () => ({
    voiceOrchestratorService: {
        readContent: (...args: unknown[]) => mockReadContent(...args),
    },
}))

vi.mock('@/components/icons/PhosphorIcons', () => ({
    PhosphorIcons: {
        SpeakerHigh: (props: React.SVGAttributes<SVGElement>) =>
            React.createElement('svg', { ...props, 'data-testid': 'speaker-icon' }),
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

import { ReadAloudButton } from './ReadAloudButton'

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
    vi.clearAllMocks()
    mockTtsEnabled = true
})

afterEach(() => {
    cleanup()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReadAloudButton', () => {
    it('renders when TTS is enabled and text is provided', () => {
        render(
            React.createElement(ReadAloudButton, {
                text: 'Hello world',
                contentId: 'test-1',
            }),
        )
        expect(screen.getByLabelText('voiceControl.readAloud')).toBeDefined()
    })

    it('does not render when TTS is disabled', () => {
        mockTtsEnabled = false
        const { container } = render(
            React.createElement(ReadAloudButton, {
                text: 'Hello world',
                contentId: 'test-1',
            }),
        )
        expect(container.innerHTML).toBe('')
    })

    it('does not render when text is empty', () => {
        const { container } = render(
            React.createElement(ReadAloudButton, {
                text: '',
                contentId: 'test-1',
            }),
        )
        expect(container.innerHTML).toBe('')
    })

    it('calls readContent on click', () => {
        render(
            React.createElement(ReadAloudButton, {
                text: 'Some content',
                contentId: 'lexikon-42',
            }),
        )
        fireEvent.click(screen.getByLabelText('voiceControl.readAloud'))
        expect(mockReadContent).toHaveBeenCalledWith('Some content', 'lexikon-42')
    })

    it('applies custom className', () => {
        render(
            React.createElement(ReadAloudButton, {
                text: 'Text',
                contentId: 'c1',
                className: 'my-custom-class',
            }),
        )
        const btn = screen.getByLabelText('voiceControl.readAloud')
        expect(btn.className).toContain('my-custom-class')
    })

    it('has displayName', () => {
        expect(ReadAloudButton.displayName).toBe('ReadAloudButton')
    })
})
