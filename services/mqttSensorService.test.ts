import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock mqtt module before imports
const mockEnd = vi.fn()
const mockPublish = vi.fn()
const mockSubscribe = vi.fn(
    (_topics: string[], _opts: unknown, cb?: (err: Error | null) => void) => {
        cb?.(null)
    },
)
const mockOn = vi.fn()
const mockClient = {
    on: mockOn,
    end: mockEnd,
    publish: mockPublish,
    subscribe: mockSubscribe,
}

vi.mock('mqtt', () => ({
    default: {
        connect: vi.fn(() => mockClient),
    },
}))

vi.mock('@/i18n', () => ({
    getT: () => (key: string) => key,
}))

import { mqttSensorService, type MqttConnectionState } from './mqttSensorService'

describe('MqttSensorService', () => {
    beforeEach(() => {
        mqttSensorService.disconnect()
        vi.clearAllMocks()
    })

    afterEach(() => {
        mqttSensorService.disconnect()
    })

    it('starts in disconnected state', () => {
        expect(mqttSensorService.getConnectionState()).toBe('disconnected')
    })

    it('getLastReading returns null initially', () => {
        expect(mqttSensorService.getLastReading()).toBeNull()
    })

    it('configure rejects invalid broker URL', () => {
        expect(() => mqttSensorService.configure({ brokerUrl: 'http://evil.com' })).toThrow(
            /Invalid broker URL/,
        )
        expect(() => mqttSensorService.configure({ brokerUrl: 'ftp://bad' })).toThrow()
    })

    it('configure accepts valid ws:// and wss:// URLs', () => {
        expect(() =>
            mqttSensorService.configure({ brokerUrl: 'ws://localhost:9001' }),
        ).not.toThrow()
        expect(() =>
            mqttSensorService.configure({ brokerUrl: 'wss://broker.example.com' }),
        ).not.toThrow()
    })

    it('configure accepts partial config without brokerUrl', () => {
        expect(() => mqttSensorService.configure({ deviceId: 'mydevice' })).not.toThrow()
    })

    it('connect sets state to connecting', () => {
        const states: MqttConnectionState[] = []
        const unsub = mqttSensorService.onConnectionStateChange((s) => states.push(s))

        mqttSensorService.connect()
        expect(states).toContain('connecting')

        unsub()
    })

    it('onSensorUpdate returns unsubscribe function', () => {
        const cb = vi.fn()
        const unsub = mqttSensorService.onSensorUpdate(cb)
        expect(typeof unsub).toBe('function')
        unsub()
    })

    it('onConnectionStateChange returns unsubscribe function', () => {
        const cb = vi.fn()
        const unsub = mqttSensorService.onConnectionStateChange(cb)
        expect(typeof unsub).toBe('function')
        unsub()
    })

    it('disconnect resets state to disconnected', () => {
        mqttSensorService.connect()

        const states: MqttConnectionState[] = []
        const unsub = mqttSensorService.onConnectionStateChange((s) => states.push(s))

        mqttSensorService.disconnect()
        expect(states).toContain('disconnected')
        expect(mockEnd).toHaveBeenCalled()

        unsub()
    })

    it('publish throws when not connected', () => {
        expect(() => mqttSensorService.publish('test', { value: 1 })).toThrow()
    })

    it('handles combined env message via connect callback', () => {
        const readings: Array<{ temperatureC: number; humidityPercent: number }> = []
        const unsub = mqttSensorService.onSensorUpdate((r) => readings.push(r))

        mqttSensorService.connect()

        // Simulate 'connect' event
        const connectHandler = mockOn.mock.calls.find(([event]: string[]) => event === 'connect')
        if (connectHandler) connectHandler[1]()

        // Simulate 'message' with combined env payload
        const messageHandler = mockOn.mock.calls.find(([event]: string[]) => event === 'message')
        if (messageHandler) {
            const payload = Buffer.from(
                JSON.stringify({ temperature: 24.5, humidity: 62.1, ph: 6.2 }),
            )
            messageHandler[1]('cannaguide/sensors/esp32/env', payload)
        }

        expect(readings).toHaveLength(1)
        expect(readings[0].temperatureC).toBe(24.5)
        expect(readings[0].humidityPercent).toBe(62.1)

        unsub()
    })

    it('handles individual topic messages and assembles reading', () => {
        const readings: Array<{ temperatureC: number; humidityPercent: number }> = []
        const unsub = mqttSensorService.onSensorUpdate((r) => readings.push(r))

        mqttSensorService.connect()

        const messageHandler = mockOn.mock.calls.find(([event]: string[]) => event === 'message')
        if (messageHandler) {
            // Send temperature only — no reading yet
            messageHandler[1](
                'cannaguide/sensors/esp32/temperature',
                Buffer.from(JSON.stringify({ value: 23.0 })),
            )
            expect(readings).toHaveLength(0)

            // Send humidity — now temp+humidity available → reading emitted
            messageHandler[1](
                'cannaguide/sensors/esp32/humidity',
                Buffer.from(JSON.stringify({ value: 55.0 })),
            )
            expect(readings).toHaveLength(1)
            expect(readings[0].temperatureC).toBe(23.0)
            expect(readings[0].humidityPercent).toBe(55.0)
        }

        unsub()
    })

    it('ignores malformed JSON payloads', () => {
        const readings: Array<unknown> = []
        const unsub = mqttSensorService.onSensorUpdate((r) => readings.push(r))

        mqttSensorService.connect()

        const messageHandler = mockOn.mock.calls.find(([event]: string[]) => event === 'message')
        if (messageHandler) {
            messageHandler[1]('cannaguide/sensors/esp32/env', Buffer.from('not-json'))
        }

        expect(readings).toHaveLength(0)
        unsub()
    })

    it('handles error event', () => {
        const states: MqttConnectionState[] = []
        const unsub = mqttSensorService.onConnectionStateChange((s) => states.push(s))

        mqttSensorService.connect()

        const errorHandler = mockOn.mock.calls.find(([event]: string[]) => event === 'error')
        if (errorHandler) errorHandler[1](new Error('test error'))

        expect(states).toContain('error')
        unsub()
    })

    it('callback errors do not break service', () => {
        const throwingCb = () => {
            throw new Error('bad callback')
        }
        const goodReadings: Array<unknown> = []
        const unsub1 = mqttSensorService.onSensorUpdate(throwingCb)
        const unsub2 = mqttSensorService.onSensorUpdate((r) => goodReadings.push(r))

        mqttSensorService.connect()

        const messageHandler = mockOn.mock.calls.find(([event]: string[]) => event === 'message')
        if (messageHandler) {
            const payload = Buffer.from(JSON.stringify({ temperature: 24, humidity: 60 }))
            messageHandler[1]('cannaguide/sensors/esp32/env', payload)
        }

        // Good callback still receives reading despite first callback throwing
        expect(goodReadings).toHaveLength(1)

        unsub1()
        unsub2()
    })
})
