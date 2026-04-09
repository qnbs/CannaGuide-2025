import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LlmModelSelector } from './LlmModelSelector'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: Record<string, unknown>) => {
            if (opts && 'model' in opts) return `${key} ${opts.model}`
            if (opts && 'size' in opts) return `${key} ${opts.size}`
            return key
        },
    }),
}))

vi.mock('@/hooks/useWebLlmLoadProgress', () => ({
    useWebLlmLoadProgress: () => ({ status: 'idle' }),
}))

describe('LlmModelSelector', () => {
    const defaultProps = {
        selectedModelId: 'auto',
        onSelect: vi.fn(),
        gpuTier: 'high' as const,
    }

    it('renders auto card and all catalog model cards', () => {
        render(<LlmModelSelector {...defaultProps} />)
        // Auto card
        expect(
            screen.getByText('settingsView.offlineAi.modelSelector.autoLabel'),
        ).toBeInTheDocument()
        // 4 model cards by their labels
        expect(screen.getByText('Qwen 2.5 0.5B')).toBeInTheDocument()
        expect(screen.getByText('Qwen 2.5 1.5B')).toBeInTheDocument()
        expect(screen.getByText('Llama 3.2 3B')).toBeInTheDocument()
        expect(screen.getByText('Phi 3.5 Mini')).toBeInTheDocument()
    })

    it('highlights auto card when selectedModelId is auto', () => {
        render(<LlmModelSelector {...defaultProps} selectedModelId="auto" />)
        const autoButton = screen
            .getByText('settingsView.offlineAi.modelSelector.autoLabel')
            .closest('button')
        expect(autoButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('highlights specific model card when selected by ID', () => {
        render(
            <LlmModelSelector
                {...defaultProps}
                selectedModelId="Llama-3.2-3B-Instruct-q4f16_1-MLC"
            />,
        )
        const llamaButton = screen.getByText('Llama 3.2 3B').closest('button')
        expect(llamaButton).toHaveAttribute('aria-pressed', 'true')
        // Auto should not be pressed
        const autoButton = screen
            .getByText('settingsView.offlineAi.modelSelector.autoLabel')
            .closest('button')
        expect(autoButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('shows download size warning for large models', () => {
        render(<LlmModelSelector {...defaultProps} />)
        // Models > 1GB should show large download warning
        const warnings = screen.getAllByText('settingsView.offlineAi.modelSelector.largeDownload')
        // Llama (1.8GB) and Phi (2.2GB) are > 1GB
        expect(warnings.length).toBeGreaterThanOrEqual(2)
    })

    it('calls onSelect with model ID when card is clicked', () => {
        const onSelect = vi.fn()
        render(<LlmModelSelector {...defaultProps} onSelect={onSelect} />)
        fireEvent.click(screen.getByText('Llama 3.2 3B'))
        expect(onSelect).toHaveBeenCalledWith('Llama-3.2-3B-Instruct-q4f16_1-MLC')
    })

    it('calls onSelect with auto when auto card is clicked', () => {
        const onSelect = vi.fn()
        render(
            <LlmModelSelector
                {...defaultProps}
                onSelect={onSelect}
                selectedModelId="Llama-3.2-3B-Instruct-q4f16_1-MLC"
            />,
        )
        fireEvent.click(screen.getByText('settingsView.offlineAi.modelSelector.autoLabel'))
        expect(onSelect).toHaveBeenCalledWith('auto')
    })
})
