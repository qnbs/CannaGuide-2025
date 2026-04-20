import { describe, expect, it, beforeEach } from 'vitest'
import { sensorStore, type SensorReading } from './sensorStore'

describe('sensorStore', () => {
    beforeEach(() => {
        sensorStore.getState().reset()
    })

    const reading: SensorReading = {
        temperatureC: 24.5,
        humidityPercent: 60,
        receivedAt: Date.now(),
    }

    describe('pushReading', () => {
        it('sets current reading and source', () => {
            sensorStore.getState().pushReading(reading, 'mqtt')
            const state = sensorStore.getState()
            expect(state.currentReading).toEqual(reading)
            expect(state.activeSource).toBe('mqtt')
        })

        it('adds reading to history', () => {
            sensorStore.getState().pushReading(reading, 'mqtt')
            expect(sensorStore.getState().history).toHaveLength(1)
        })

        it('caps history at 120 entries', () => {
            for (let i = 0; i < 130; i++) {
                sensorStore.getState().pushReading(
                    { temperatureC: 20 + i * 0.1, humidityPercent: 50, receivedAt: Date.now() + i },
                    'mqtt',
                )
            }
            expect(sensorStore.getState().history).toHaveLength(120)
        })
    })

    describe('setConnectionState', () => {
        it('updates connection state', () => {
            sensorStore.getState().setConnectionState('connected')
            expect(sensorStore.getState().connectionState).toBe('connected')
        })
    })

    describe('pushToastEvent', () => {
        it('adds a toast event with auto-generated id', () => {
            sensorStore.getState().pushToastEvent({
                type: 'connection_lost',
                message: 'Sensor offline',
                timestamp: Date.now(),
            })
            const toasts = sensorStore.getState().toastEvents
            expect(toasts).toHaveLength(1)
            expect(toasts[0]?.id).toMatch(/^iot_toast_/)
        })

        it('caps toast events at 10', () => {
            for (let i = 0; i < 15; i++) {
                sensorStore.getState().pushToastEvent({
                    type: 'connection_lost',
                    message: `event ${i}`,
                    timestamp: Date.now() + i,
                })
            }
            expect(sensorStore.getState().toastEvents).toHaveLength(10)
        })
    })

    describe('dismissToast', () => {
        it('removes toast by id', () => {
            sensorStore.getState().pushToastEvent({
                type: 'wss_warning',
                message: 'test',
                timestamp: Date.now(),
            })
            const id = sensorStore.getState().toastEvents[0]!.id
            sensorStore.getState().dismissToast(id)
            expect(sensorStore.getState().toastEvents).toHaveLength(0)
        })
    })

    describe('reset', () => {
        it('clears all state', () => {
            sensorStore.getState().pushReading(reading, 'mqtt')
            sensorStore.getState().setConnectionState('connected')
            sensorStore.getState().reset()
            const state = sensorStore.getState()
            expect(state.currentReading).toBeNull()
            expect(state.history).toHaveLength(0)
            expect(state.connectionState).toBe('disconnected')
            expect(state.activeSource).toBeNull()
        })
    })
})
