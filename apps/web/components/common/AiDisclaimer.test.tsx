/**
 * AiDisclaimer.test.tsx
 *
 * Tests for the shared AiDisclaimer component: default rendering, the optional
 * medical disclaimer, custom className passthrough, and displayName.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React from 'react'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

import { AiDisclaimer } from './AiDisclaimer'

afterEach(() => {
    cleanup()
})

describe('AiDisclaimer', () => {
    it('renders the generic AI disclaimer by default', () => {
        render(React.createElement(AiDisclaimer))
        expect(screen.getByText('ai.disclaimer')).toBeDefined()
        expect(screen.queryByText('legal.medicalDisclaimer')).toBeNull()
    })

    it('renders the medical disclaimer when medical is true', () => {
        render(React.createElement(AiDisclaimer, { medical: true }))
        expect(screen.getByText('ai.disclaimer')).toBeDefined()
        expect(screen.getByText('legal.medicalDisclaimer')).toBeDefined()
    })

    it('exposes a note role for assistive technology', () => {
        render(React.createElement(AiDisclaimer))
        expect(screen.getByRole('note')).toBeDefined()
    })

    it('applies a custom className', () => {
        render(React.createElement(AiDisclaimer, { className: 'my-custom-class' }))
        expect(screen.getByTestId('ai-disclaimer').className).toContain('my-custom-class')
    })

    it('has displayName', () => {
        expect(AiDisclaimer.displayName).toBe('AiDisclaimer')
    })
})
