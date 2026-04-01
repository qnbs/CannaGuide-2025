import { describe, it, expect, beforeEach } from 'vitest'
import { useAlertsStore, type SmartAlert } from '@/stores/useAlertsStore'

function makeAlert(overrides: Partial<SmartAlert> = {}): SmartAlert {
    return {
        id: `alert_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        triggerValue: 35,
        metric: 'temperature',
        aiAdvice: 'Lower temperature immediately',
        isDismissed: false,
        plantId: 'plant-1',
        plantName: 'Northern Lights',
        ...overrides,
    }
}

describe('useAlertsStore', () => {
    beforeEach(() => {
        useAlertsStore.getState().clearAlerts()
    })

    it('starts with empty alerts', () => {
        expect(useAlertsStore.getState().alerts).toEqual([])
    })

    it('adds an alert', () => {
        const alert = makeAlert({ id: 'a1' })
        useAlertsStore.getState().addAlert(alert)
        expect(useAlertsStore.getState().alerts).toHaveLength(1)
        expect(useAlertsStore.getState().alerts[0]!.id).toBe('a1')
    })

    it('adds multiple alerts in order', () => {
        useAlertsStore.getState().addAlert(makeAlert({ id: 'a1' }))
        useAlertsStore.getState().addAlert(makeAlert({ id: 'a2' }))
        useAlertsStore.getState().addAlert(makeAlert({ id: 'a3' }))

        const ids = useAlertsStore.getState().alerts.map((a) => a.id)
        expect(ids).toEqual(['a1', 'a2', 'a3'])
    })

    it('caps alerts at 50 using FIFO', () => {
        for (let i = 0; i < 55; i++) {
            useAlertsStore.getState().addAlert(makeAlert({ id: `a${i}` }))
        }

        const alerts = useAlertsStore.getState().alerts
        expect(alerts).toHaveLength(50)
        expect(alerts[0]!.id).toBe('a5')
        expect(alerts[49]!.id).toBe('a54')
    })

    it('dismisses an alert by id', () => {
        useAlertsStore.getState().addAlert(makeAlert({ id: 'a1' }))
        useAlertsStore.getState().addAlert(makeAlert({ id: 'a2' }))

        useAlertsStore.getState().dismissAlert('a1')

        const alerts = useAlertsStore.getState().alerts
        expect(alerts[0]!.isDismissed).toBe(true)
        expect(alerts[1]!.isDismissed).toBe(false)
    })

    it('dismissing non-existent id is a no-op', () => {
        useAlertsStore.getState().addAlert(makeAlert({ id: 'a1' }))
        useAlertsStore.getState().dismissAlert('nonexistent')

        expect(useAlertsStore.getState().alerts[0]!.isDismissed).toBe(false)
    })

    it('clears all alerts', () => {
        useAlertsStore.getState().addAlert(makeAlert({ id: 'a1' }))
        useAlertsStore.getState().addAlert(makeAlert({ id: 'a2' }))
        useAlertsStore.getState().clearAlerts()

        expect(useAlertsStore.getState().alerts).toEqual([])
    })

    it('preserves alert data integrity through add/dismiss cycle', () => {
        const alert = makeAlert({
            id: 'integrity-test',
            metric: 'vpd',
            triggerValue: 1.8,
            aiAdvice: 'VPD too high',
            plantId: 'p42',
            plantName: 'White Widow',
        })
        useAlertsStore.getState().addAlert(alert)
        useAlertsStore.getState().dismissAlert('integrity-test')

        const result = useAlertsStore.getState().alerts[0]!
        expect(result.metric).toBe('vpd')
        expect(result.triggerValue).toBe(1.8)
        expect(result.aiAdvice).toBe('VPD too high')
        expect(result.plantId).toBe('p42')
        expect(result.plantName).toBe('White Widow')
        expect(result.isDismissed).toBe(true)
    })
})
