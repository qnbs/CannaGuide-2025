import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GrowLogRagPanel } from './GrowLogRagPanel'

const aiMocks = vi.hoisted(() => ({
    getGrowLogRagAnswer: vi.fn(),
}))

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
    aiService: aiMocks,
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

async function ask(query: string) {
    render(<GrowLogRagPanel />)
    fireEvent.change(screen.getByPlaceholderText('knowledgeView.growLog.placeholder'), {
        target: { value: query },
    })
    fireEvent.click(screen.getByText('knowledgeView.growLog.startAnalysis'))
}

describe('GrowLogRagPanel', () => {
    beforeEach(() => {
        aiMocks.getGrowLogRagAnswer.mockReset()
    })

    it('shows the shared disclaimer with an AI answer', async () => {
        aiMocks.getGrowLogRagAnswer.mockResolvedValue({
            title: 'Title',
            content: 'Answer body',
        })
        await ask('why are the leaves pale')
        expect(await screen.findByTestId('ai-disclaimer')).toBeInTheDocument()
        expect(screen.getByText(/Answer body/)).toBeInTheDocument()
    })

    it('does not show the disclaimer when analysis fails', async () => {
        aiMocks.getGrowLogRagAnswer.mockRejectedValue(new Error('offline'))
        await ask('fail this analysis')
        expect(await screen.findByRole('alert')).toHaveTextContent('offline')
        expect(screen.queryByTestId('ai-disclaimer')).not.toBeInTheDocument()
        expect(aiMocks.getGrowLogRagAnswer).toHaveBeenCalled()
    })
})
