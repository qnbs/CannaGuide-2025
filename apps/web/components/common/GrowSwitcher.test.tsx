import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/tests/test-utils'
import { GrowSwitcher } from './GrowSwitcher'

describe('GrowSwitcher', () => {
    it('renders nothing when only one grow exists', () => {
        const { container } = renderWithProviders(<GrowSwitcher />)
        expect(container.innerHTML).toBe('')
    })

    it('renders the switcher when multiple grows exist', () => {
        renderWithProviders(<GrowSwitcher />, {
            preloadedState: {
                grows: {
                    grows: {
                        ids: ['grow-1', 'grow-2'],
                        entities: {
                            'grow-1': {
                                id: 'grow-1',
                                name: 'Indoor',
                                createdAt: 1000,
                                updatedAt: 2000,
                                isActive: true,
                                color: '#22c55e',
                            },
                            'grow-2': {
                                id: 'grow-2',
                                name: 'Outdoor',
                                createdAt: 1000,
                                updatedAt: 2000,
                                isActive: true,
                                color: '#a855f7',
                            },
                        },
                    },
                    activeGrowId: 'grow-1',
                },
            },
        })
        expect(screen.getByText('Indoor')).toBeTruthy()
    })
})
