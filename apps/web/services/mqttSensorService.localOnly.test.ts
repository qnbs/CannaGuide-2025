import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLocalOnlyMode } from '@/services/localOnlyModeService'

const mockClient = { on: vi.fn(), end: vi.fn(), subscribe: vi.fn(), publish: vi.fn() }

vi.mock('mqtt', () => ({ default: { connect: vi.fn(() => mockClient) } }))
vi.mock('@/i18n', () => ({
    getT: () => (key: string, options?: { destination?: string }) =>
        `${key}:${options?.destination ?? ''}`,
}))

import mqtt from 'mqtt'
import { mqttSensorService, type IoTEvent } from './mqttSensorService'

describe('mqttSensorService in Local-Only Mode (GH #683)', () => {
    const events: IoTEvent[] = []
    let unsubscribe: () => void = () => undefined

    beforeEach(() => {
        mqttSensorService.disconnect()
        vi.clearAllMocks()
        events.length = 0
        unsubscribe = mqttSensorService.onIoTEvent((event) => events.push(event))
    })

    afterEach(() => {
        unsubscribe()
        mqttSensorService.disconnect()
        setLocalOnlyMode(false)
    })

    it('does not connect to a broker on the internet and reports it', () => {
        setLocalOnlyMode(true)
        mqttSensorService.configure({
            brokerUrl: 'wss://alice:s3cret@broker.hivemq.cloud:8884/mqtt?token=abc',
        })

        mqttSensorService.connect()

        expect(mqtt.connect).not.toHaveBeenCalled()
        expect(mqttSensorService.getConnectionState()).toBe('error')
        expect(events.map((event) => event.type)).toEqual(['egress_blocked'])
        // Only the origin: no credentials, path or query in the message.
        expect(events[0]?.message).toBe(
            'common.egress.blockedByLocalOnly:wss://broker.hivemq.cloud:8884',
        )
    })

    it('still connects to a broker on the local network', () => {
        setLocalOnlyMode(true)
        mqttSensorService.configure({ brokerUrl: 'ws://192.168.1.20:9001' })

        mqttSensorService.connect()

        expect(mqtt.connect).toHaveBeenCalledOnce()
    })

    it('closes an open connection to an internet broker when the mode is switched on', () => {
        mqttSensorService.configure({ brokerUrl: 'wss://broker.hivemq.cloud:8884/mqtt' })
        mqttSensorService.connect()

        setLocalOnlyMode(true)
        mqttSensorService.enforceLocalOnlyMode()

        expect(mockClient.end).toHaveBeenCalledWith(true)
        expect(mqttSensorService.getConnectionState()).toBe('error')
        expect(events.at(-1)?.type).toBe('egress_blocked')
    })

    it('checks the broker the open client uses, not a later configured one', () => {
        mqttSensorService.configure({ brokerUrl: 'wss://broker.hivemq.cloud:8884/mqtt' })
        mqttSensorService.connect()
        mqttSensorService.configure({ brokerUrl: 'ws://192.168.1.20:9001' })

        setLocalOnlyMode(true)
        mqttSensorService.enforceLocalOnlyMode()

        expect(mockClient.end).toHaveBeenCalledWith(true)
    })

    it('reconnects when the mode is switched off again', () => {
        mqttSensorService.configure({ brokerUrl: 'wss://broker.hivemq.cloud:8884/mqtt' })
        mqttSensorService.connect()
        setLocalOnlyMode(true)
        mqttSensorService.enforceLocalOnlyMode()
        vi.mocked(mqtt.connect).mockClear()

        setLocalOnlyMode(false)
        mqttSensorService.resumeAfterLocalOnlyMode()

        expect(mqtt.connect).toHaveBeenCalledOnce()
    })

    it('does not connect on switch-off when the mode never refused it', () => {
        // A normal connection the mode never touched, set up in this test itself.
        mqttSensorService.configure({ brokerUrl: 'ws://192.168.1.20:9001' })
        mqttSensorService.connect()
        mqttSensorService.disconnect()
        vi.mocked(mqtt.connect).mockClear()

        mqttSensorService.resumeAfterLocalOnlyMode()

        expect(mqtt.connect).not.toHaveBeenCalled()
    })
})
