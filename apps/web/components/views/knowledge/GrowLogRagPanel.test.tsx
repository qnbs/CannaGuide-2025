import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GrowLogRagPanel } from './GrowLogRagPanel'

vi.mock('@/hooks/useSimulationBridge', () => ({
    useActivePlants: () => [],
}))

vi.mock('@/stores/store', () => ({
    useAppSelector: () => 'en',
}))

vi.mock('@/stores/selectors', () => ({
    selectLanguage: vi.fn(),
}))

vi.mock('@/services/aiFacade', () => ({
    aiService: {
        getGrowLogRagAnswer: vi.fn().mockResolvedValue({ title: 'Title', content: 'Answer body' }),
    },
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

describe('GrowLogRagPanel', () => {
    it('shows the shared disclaimer with an AI answer', async () => {
        render(<GrowLogRagPanel />)
        fireEvent.change(screen.getByPlaceholderText('knowledgeView.growLog.placeholder'), {
            target: { value: 'why are the leaves pale' },
        })
        fireEvent.click(screen.getByText('knowledgeView.growLog.startAnalysis'))
        expect(await screen.findByTestId('ai-disclaimer')).toBeInTheDocument()
        expect(screen.getByText(/Answer body/)).toBeInTheDocument()
    })
})
