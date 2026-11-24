import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppStore } from '@/stores/store'

import { permanentConnackRefusal } from './mqttConnackRefusal'

// mqtt 5.16 closes the socket after a refused CONNECT (GHSA fixes in 5.16.0). The services
// reconnect on `close` themselves, so a refusal retrying cannot fix must stop that loop.

/** The error mqtt 5.16 emits for a refused CONNECT: `ErrorWithReasonCode`. */
const refusal = (reason: string, code: number) =>
    Object.assign(new Error(`Connection refused: ${reason}`), { code })

describe('permanentConnackRefusal', () => {
    it('names credential, authorization, protocol, ban and redirect refusals', () => {
        expect(permanentConnackRefusal(refusal('Bad username or password', 4))).toBe(4)
        expect(permanentConnackRefusal(refusal('Not authorized', 5))).toBe(5)
        expect(permanentConnackRefusal(refusal('Bad User Name or Password', 0x86))).toBe(0x86)
        expect(permanentConnackRefusal(refusal('Not authorized', 0x87))).toBe(0x87)
        expect(permanentConnackRefusal(refusal('Banned', 0x8a))).toBe(0x8a)
        expect(permanentConnackRefusal(refusal('Server moved', 0x9d))).toBe(0x9d)
    })

    it('leaves busy, unavailable and other errors to the usual backoff', () => {
        expect(permanentConnackRefusal(refusal('Server unavailable', 3))).toBeNull()
        expect(permanentConnackRefusal(refusal('Server busy', 0x89))).toBeNull()
        expect(permanentConnackRefusal(refusal('Quota exceeded', 0x97))).toBeNull()
        // A protocol error the client raised itself is not a refused CONNECT.
        const protocol = Object.assign(new Error('Protocol error: duplicate CONNACK'), {
            code: 0x82,
        })
        expect(permanentConnackRefusal(protocol)).toBeNull()
        expect(permanentConnackRefusal(new Error('connect ECONNREFUSED'))).toBeNull()
        expect(permanentConnackRefusal({ message: 'Connection refused: x', code: 5 })).toBeNull()
    })
})

const handlers = new Map<string, (...args: unknown[]) => void>()
const mockClient = {
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        handlers.set(event, handler)
        return mockClient
    }),
    end: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    publish: vi.fn(),
}
const connect = vi.fn(() => mockClient)
vi.mock('mqtt', () => ({ default: { connect } }))
vi.mock('@/i18n', () => ({ getT: () => (key: string) => key }))

/** A refusal then the close that 5.16 sends after it. */
const refuseAndClose = (error: Error) => {
    handlers.get('error')?.(error)
    handlers.get('close')?.()
}

describe('the IoT journal client after a refused CONNECT', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.clearAllMocks()
        handlers.clear()
        localStorage.clear()
    })
    afterEach(() => {
        vi.useRealTimers()
    })

    const start = async () => {
        vi.resetModules()
        const { useIotStore } = await import('@/stores/useIotStore')
        const { mqttClientService } = await import('./mqttClientService')
        mqttClientService.init({} as AppStore)
        useIotStore.getState().setBrokerUrl('wss://192.168.1.20:9001')
        useIotStore.getState().setEnabled(true)
        expect(connect).toHaveBeenCalledOnce()
        return useIotStore
    }

    it('keeps the refusal as the error and does not retry bad credentials', async () => {
        const store = await start()
        refuseAndClose(refusal('Not authorized', 5))
        await vi.advanceTimersByTimeAsync(120_000)
        expect(connect).toHaveBeenCalledOnce()
        expect(store.getState().connectionStatus).toBe('error')
        expect(store.getState().lastError).toBe('Connection refused: Not authorized')
    })

    it('still reconnects with backoff when the broker is only unavailable', async () => {
        const store = await start()
        refuseAndClose(refusal('Server unavailable', 3))
        expect(store.getState().connectionStatus).toBe('disconnected')
        await vi.advanceTimersByTimeAsync(1000)
        expect(connect).toHaveBeenCalledTimes(2)
    })
})

describe('the sensor client after a refused CONNECT', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.clearAllMocks()
        handlers.clear()
    })
    afterEach(() => {
        vi.useRealTimers()
    })

    const start = async () => {
        vi.resetModules()
        const { mqttSensorService } = await import('./mqttSensorService')
        mqttSensorService.configure({ brokerUrl: 'wss://192.168.1.20:9001' })
        mqttSensorService.connect()
        expect(connect).toHaveBeenCalledOnce()
        return mqttSensorService
    }

    it('stays in error and does not retry a client the broker will not authorize', async () => {
        const service = await start()
        refuseAndClose(refusal('Not authorized', 0x87))
        await vi.advanceTimersByTimeAsync(120_000)
        expect(connect).toHaveBeenCalledOnce()
        expect(service.getConnectionState()).toBe('error')
        service.disconnect()
    })

    it('still reconnects with backoff when the broker is busy', async () => {
        const service = await start()
        refuseAndClose(refusal('Server busy', 0x89))
        expect(service.getConnectionState()).toBe('disconnected')
        await vi.advanceTimersByTimeAsync(1000)
        expect(connect).toHaveBeenCalledTimes(2)
        service.disconnect()
    })
})
