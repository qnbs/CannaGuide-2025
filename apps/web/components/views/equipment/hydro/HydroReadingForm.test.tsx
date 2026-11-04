import { describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/tests/test-utils'
import { DEFAULT_THRESHOLDS } from '@/stores/slices/hydroSlice'
import type { HydroAlert, HydroReading, HydroState } from '@/types'
import { HydroReadingForm } from './HydroReadingForm'

const reading = (index: number): HydroReading => ({
    id: `r${String(index)}`,
    timestamp: index,
    ph: 6,
    ec: 1.4,
    waterTemp: 21,
})

const alert = (index: number): HydroAlert => ({
    id: `a${String(index)}`,
    metric: 'ph',
    direction: 'high',
    value: 7,
    threshold: 6.5,
    timestamp: index,
    dismissed: index === 1,
})

/** Three readings, two alerts (one dismissed), and non-default settings. */
const hydro: HydroState = {
    readings: [reading(0), reading(1), reading(2)],
    alerts: [alert(0), alert(1)],
    systemType: 'NFT',
    thresholds: { ...DEFAULT_THRESHOLDS, phMax: 6.2 },
}

const renderForm = () => renderWithProviders(<HydroReadingForm />, { preloadedState: { hydro } })

const openConfirm = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }))
    return screen.getByRole('dialog')
}

describe('HydroReadingForm Clear All (GH #685)', () => {
    it('asks first and names both lists with their counts, deleting nothing yet', () => {
        const { store } = renderForm()

        const dialog = openConfirm()

        expect(dialog).toHaveTextContent('all hydro readings (3) and all hydro alerts (2)')
        expect(dialog).toHaveTextContent('This cannot be undone.')
        expect(store.getState().hydro).toEqual(hydro)
    })

    it('keeps both histories when the grower cancels', async () => {
        const { store } = renderForm()
        openConfirm()

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(store.getState().hydro).toEqual(hydro)
    })

    it('keeps both histories when the dialog is closed with Escape', async () => {
        const { store } = renderForm()
        const dialog = openConfirm()

        fireEvent.keyDown(dialog, { key: 'Escape' })

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(store.getState().hydro).toEqual(hydro)
    })

    it('moves focus into the dialog', () => {
        renderForm()

        const dialog = openConfirm()

        expect(dialog.contains(document.activeElement)).toBe(true)
    })

    it('on confirm deletes exactly the readings and alerts, and keeps the settings', async () => {
        const { store } = renderForm()
        openConfirm()

        fireEvent.click(screen.getByRole('button', { name: 'Delete readings and alerts' }))

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        const after = JSON.parse(JSON.stringify(store.getState().hydro)) as HydroState
        expect(after).toEqual({ ...hydro, readings: [], alerts: [] })
    })
})
