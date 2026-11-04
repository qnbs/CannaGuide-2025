import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/tests/test-utils'
import { DEFAULT_THRESHOLDS } from '@/stores/slices/hydroSlice'
import type { HydroAlert, HydroReading, HydroState } from '@/types'
import { HydroReadingForm } from './HydroReadingForm'
import { HYDRO_UNDO_WINDOW_MS } from './useHydroClear'

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

const openConfirm = (name = 'Clear All') => {
    fireEvent.click(screen.getByRole('button', { name }))
    return screen.getByRole('dialog')
}

const confirmIn = async (label: string) => {
    fireEvent.click(screen.getByRole('button', { name: label }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

describe('HydroReadingForm Clear All (GH #685)', () => {
    it('asks first and names both lists with their counts, deleting nothing yet', () => {
        const { store } = renderForm()

        const dialog = openConfirm()

        expect(dialog).toHaveTextContent('all hydro readings (3) and all hydro alerts (2)')
        expect(dialog).toHaveTextContent('You can undo this on this page for 10 seconds.')
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

    it('clears only the readings, and keeps the alerts and settings', async () => {
        const { store } = renderForm()
        expect(openConfirm('Clear readings')).toHaveTextContent('all hydro readings (3)')

        await confirmIn('Delete readings')

        expect(store.getState().hydro).toEqual({ ...hydro, readings: [] })
    })

    it('clears only the alerts, dismissed ones included, and keeps the readings', async () => {
        const { store } = renderForm()
        expect(openConfirm('Clear alerts')).toHaveTextContent('all hydro alerts (2)')

        await confirmIn('Delete alerts')

        expect(store.getState().hydro).toEqual({ ...hydro, alerts: [] })
    })

    it('undo puts back exactly what was deleted, with the same ids', async () => {
        const { store } = renderForm()
        openConfirm()
        await confirmIn('Delete readings and alerts')
        expect(screen.getByRole('status')).toHaveTextContent('readings 3, alerts 2')

        fireEvent.click(screen.getByRole('button', { name: 'Undo' }))

        expect(store.getState().hydro).toEqual(hydro)
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
})

describe('HydroReadingForm undo window', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('offers the undo only for the stated window', async () => {
        // Fake timers before the undo timer starts; real time still passes for the dialog.
        vi.useFakeTimers({ shouldAdvanceTime: true })
        const { store } = renderForm()
        openConfirm('Clear readings')
        await confirmIn('Delete readings')
        expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()

        act(() => {
            vi.advanceTimersByTime(HYDRO_UNDO_WINDOW_MS)
        })

        expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
        expect(store.getState().hydro.readings).toEqual([])
    })
})
