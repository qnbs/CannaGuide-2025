import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/tests/test-utils'
import { GrowCreateModal } from './GrowCreateModal'

describe('GrowCreateModal', () => {
    it('renders the modal when open', () => {
        renderWithProviders(<GrowCreateModal isOpen onClose={vi.fn()} />)
        expect(screen.getAllByText('New Grow').length).toBeGreaterThan(0)
    })

    it('renders the name input field', () => {
        renderWithProviders(<GrowCreateModal isOpen onClose={vi.fn()} />)
        expect(screen.getByLabelText('Name')).toBeTruthy()
    })

    it('calls onClose when cancel is clicked', () => {
        const onClose = vi.fn()
        renderWithProviders(<GrowCreateModal isOpen onClose={onClose} />)
        fireEvent.click(screen.getByText('Cancel'))
        expect(onClose).toHaveBeenCalled()
    })
})
