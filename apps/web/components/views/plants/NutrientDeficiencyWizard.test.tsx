import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/tests/test-utils'
import { NutrientDeficiencyWizard } from '@/components/views/plants/NutrientDeficiencyWizard'

describe('NutrientDeficiencyWizard', () => {
    it('renders the first question on mount', () => {
        renderWithProviders(<NutrientDeficiencyWizard />)
        expect(screen.getByTestId('wizard-question')).toBeInTheDocument()
        expect(screen.getByTestId('question-text')).toBeInTheDocument()
    })

    it('navigates to the next node when "Yes" is clicked', () => {
        renderWithProviders(<NutrientDeficiencyWizard />)
        const yesBtn = screen.getByTestId('btn-yes')
        fireEvent.click(yesBtn)
        // After first yes, we are at "mobile-general" -- still a question
        expect(screen.getByTestId('wizard-question')).toBeInTheDocument()
        // Back button should now be visible (history > 0)
        expect(screen.getByTestId('btn-back')).toBeInTheDocument()
    })

    it('navigates to the alternate node when "No" is clicked', () => {
        renderWithProviders(<NutrientDeficiencyWizard />)
        const noBtn = screen.getByTestId('btn-no')
        fireEvent.click(noBtn)
        // After first no, we are at "immobile-chlorosis" -- still a question
        expect(screen.getByTestId('wizard-question')).toBeInTheDocument()
        expect(screen.getByTestId('btn-back')).toBeInTheDocument()
    })

    it('goes back one step when the back button is clicked', () => {
        renderWithProviders(<NutrientDeficiencyWizard />)
        // Navigate forward once
        fireEvent.click(screen.getByTestId('btn-yes'))
        expect(screen.getByTestId('btn-back')).toBeInTheDocument()

        // Go back
        fireEvent.click(screen.getByTestId('btn-back'))
        // Back at root -- no more back button
        expect(screen.queryByTestId('btn-back')).not.toBeInTheDocument()
    })

    it('shows the result card after traversing to a leaf node', () => {
        renderWithProviders(<NutrientDeficiencyWizard />)
        // Path to nitrogen: root(yes) -> mobile-general(yes) -> mobile-yellow-detail(no) -> mobile-pale-green(yes)
        fireEvent.click(screen.getByTestId('btn-yes')) // root -> mobile-general
        fireEvent.click(screen.getByTestId('btn-yes')) // mobile-general -> mobile-yellow-detail
        fireEvent.click(screen.getByTestId('btn-no')) // mobile-yellow-detail -> mobile-pale-green
        fireEvent.click(screen.getByTestId('btn-yes')) // mobile-pale-green -> result-nitrogen

        expect(screen.getByTestId('wizard-result')).toBeInTheDocument()
        expect(screen.getByTestId('result-name')).toBeInTheDocument()
        expect(screen.getByTestId('result-severity')).toBeInTheDocument()
    })
})
