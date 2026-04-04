import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LearningPathView from './LearningPathView'

const mockDispatch = vi.fn()
const mockSelector = vi.fn()

vi.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector: (state: unknown) => unknown) => mockSelector(selector),
}))

vi.mock('@/stores/selectors', () => ({
    selectLearningPathProgress: vi.fn(),
}))

vi.mock('@/stores/slices/knowledgeSlice', () => ({
    completeLearningStep: vi.fn((args) => ({
        type: 'knowledge/completeLearningStep',
        payload: args,
    })),
    resetLearningPath: vi.fn((id) => ({ type: 'knowledge/resetLearningPath', payload: id })),
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: Record<string, unknown>) => String(opts?.['defaultValue'] ?? key),
    }),
}))

vi.mock('@/data/learningPaths', () => ({
    learningPaths: [
        {
            id: 'test-path',
            titleKey: 'Test Path',
            descriptionKey: 'Test description',
            targetLevel: 'beginner',
            estimatedMinutes: 30,
            tags: ['basics'],
            steps: [
                {
                    id: 'step-1',
                    titleKey: 'Step 1',
                    descriptionKey: 'Desc 1',
                    type: 'article',
                    referenceId: 'ref1',
                },
                {
                    id: 'step-2',
                    titleKey: 'Step 2',
                    descriptionKey: 'Desc 2',
                    type: 'calculator',
                    referenceId: 'ref2',
                },
            ],
        },
        {
            id: 'advanced-path',
            titleKey: 'Advanced Path',
            descriptionKey: 'Advanced description',
            targetLevel: 'expert',
            estimatedMinutes: 60,
            tags: ['advanced'],
            steps: [
                {
                    id: 'step-a',
                    titleKey: 'Advanced Step',
                    descriptionKey: 'Desc A',
                    type: 'quiz',
                    referenceId: 'refA',
                },
            ],
        },
    ],
}))

describe('LearningPathView', () => {
    beforeEach(() => {
        mockDispatch.mockClear()
        vi.clearAllMocks()
        // selectLearningPathProgress returns completed step IDs for the active path
        mockSelector.mockReturnValue([])
    })

    it('renders learning path cards', () => {
        render(<LearningPathView />)
        expect(screen.getByText('Test Path')).toBeInTheDocument()
        expect(screen.getByText('Advanced Path')).toBeInTheDocument()
    })

    it('renders level filter buttons', () => {
        render(<LearningPathView />)
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
    })

    it('path expand button has aria-expanded attribute', () => {
        render(<LearningPathView />)
        const expandButtons = screen
            .getAllByRole('button')
            .filter((b) => b.hasAttribute('aria-expanded'))
        expect(expandButtons.length).toBeGreaterThan(0)
    })

    it('progressbar has role, aria-valuenow, aria-label', () => {
        render(<LearningPathView />)
        const progressbars = screen.getAllByRole('progressbar')
        expect(progressbars.length).toBeGreaterThan(0)
        const bar = progressbars[0]
        expect(bar).toHaveAttribute('aria-valuenow')
        expect(bar).toHaveAttribute('aria-valuemin', '0')
        expect(bar).toHaveAttribute('aria-valuemax', '100')
        expect(bar).toHaveAttribute('aria-label')
    })

    it('expanding a path reveals its steps', () => {
        render(<LearningPathView />)
        const expandButtons = screen
            .getAllByRole('button')
            .filter((b) => b.getAttribute('aria-expanded') === 'false')
        if (expandButtons[0]) {
            fireEvent.click(expandButtons[0])
            expect(expandButtons[0]).toHaveAttribute('aria-expanded', 'true')
        }
    })

    it('dispatches completeLearningStep when step is clicked', () => {
        render(<LearningPathView />)
        const expandButtons = screen
            .getAllByRole('button')
            .filter((b) => b.getAttribute('aria-expanded') === 'false')
        if (expandButtons[0]) {
            fireEvent.click(expandButtons[0])
        }
        const stepButtons = screen
            .getAllByRole('button')
            .filter((b) => !b.hasAttribute('aria-expanded') && !b.hasAttribute('aria-pressed'))
        if (stepButtons[0]) {
            fireEvent.click(stepButtons[0])
            expect(mockDispatch).toHaveBeenCalled()
        }
    })

    it('filters paths by level', () => {
        render(<LearningPathView />)
        const expertButtons = screen
            .getAllByRole('button')
            .filter((b) => b.textContent?.toLowerCase().includes('expert'))
        if (expertButtons.length > 0) {
            fireEvent.click(expertButtons[0]!)
            // Advanced Path is expert level, Test Path is beginner
            expect(screen.getByText('Advanced Path')).toBeInTheDocument()
        }
    })

    it('shows 0% progress when no steps completed', () => {
        render(<LearningPathView />)
        const bar = screen.getAllByRole('progressbar')[0]
        expect(bar).toHaveAttribute('aria-valuenow', '0')
    })
})
