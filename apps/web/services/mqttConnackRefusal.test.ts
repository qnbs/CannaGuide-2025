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
        // The broker cannot parse our CONNECT, or it breaks the protocol for this broker.
        expect(permanentConnackRefusal(refusal('Malformed Packet', 0x81))).toBe(0x81)
        expect(permanentConnackRefusal(refusal('Protocol Error', 0x82))).toBe(0x82)
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

type Handler = (...args: unknown[]) => void
type MockClient = {
    handlers: Map<string, Handler>
    on: (event: string, handler: Handler) => MockClient
    end: () => void
    subscribe: () => void
    unsubscribe: () => void
    publish: () => void
}
/** One mock client per CONNECT, so a replaced client's late events can be replayed. */
const clients: MockClient[] = []
const makeClient = (): MockClient => {
    const handlers = new Map<string, Handler>()
    const client: MockClient = {
        handlers,
        on: (event, handler) => {
            handlers.set(event, handler)
            return client
        },
        end: vi.fn(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        publish: vi.fn(),
    }
    clients.push(client)
    return client
}
const connect = vi.fn((_url: string, _options?: Record<string, unknown>) => makeClient())
vi.mock('mqtt', () => ({ default: { connect } }))
vi.mock('@/i18n', () => ({ getT: () => (key: string) => key }))

const latest = (): MockClient => {
    const client = clients.at(-1)
    if (!client) throw new Error('no client was created')
    return client
}

/** A refusal then the close that 5.16 sends after it. */
const refuseAndClose = (error: Error, client: MockClient = latest()) => {
    client.handlers.get('error')?.(error)
    client.handlers.get('close')?.()
}

describe('the IoT journal client after a refused CONNECT', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.clearAllMocks()
        clients.length = 0
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

describe('the IoT journal client at start', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.clearAllMocks()
        clients.length = 0
        localStorage.clear()
    })
    afterEach(() => {
        vi.useRealTimers()
    })

    const startWith = async (enabled: boolean, brokerUrl: string) => {
        vi.resetModules()
        const { useIotStore } = await import('@/stores/useIotStore')
        // Saved settings are in the store before the service starts, as after a page load.
        useIotStore.setState({ isEnabled: enabled, brokerUrl, username: 'grower' })
        const { mqttClientService } = await import('./mqttClientService')
        mqttClientService.init({} as AppStore)
        await vi.advanceTimersByTimeAsync(5000)
        return useIotStore
    }

    it('connects once when IoT is already enabled in the saved settings', async () => {
        await startWith(true, 'wss://192.168.1.20:9001')
        expect(connect).toHaveBeenCalledOnce()
        expect(connect).toHaveBeenLastCalledWith(
            'wss://192.168.1.20:9001',
            expect.objectContaining({ username: 'grower' }),
        )
    })

    it('does not connect at start when IoT is off or has no broker', async () => {
        await startWith(false, 'wss://192.168.1.20:9001')
        await startWith(true, '')
        expect(connect).not.toHaveBeenCalled()
    })
})

describe('the IoT journal client when the credentials change', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.clearAllMocks()
        clients.length = 0
        localStorage.clear()
    })
    afterEach(() => {
        vi.useRealTimers()
    })

    const start = async () => {
        vi.resetModules()
        const { useIotStore } = await import('@/stores/useIotStore')
        const { mqttClientService, CREDENTIAL_SETTLE_MS } = await import('./mqttClientService')
        mqttClientService.init({} as AppStore)
        useIotStore.getState().setBrokerUrl('wss://192.168.1.20:9001')
        useIotStore.getState().setUsername('grower')
        useIotStore.getState().setEnabled(true)
        // Typing the username before enabling: the CONNECT already used it, so no second one.
        await vi.advanceTimersByTimeAsync(CREDENTIAL_SETTLE_MS * 2)
        expect(connect).toHaveBeenCalledOnce()
        return { store: useIotStore, settle: CREDENTIAL_SETTLE_MS }
    }

    it('reconnects once with the corrected password after a refusal, not per keystroke', async () => {
        const { store, settle } = await start()
        refuseAndClose(refusal('Bad username or password', 4))
        // A synthetic value, typed one character at a time as the settings field does.
        const typed = 'grow-room'
        for (let length = 1; length <= typed.length; length += 1) {
            await store.getState().setPassword(typed.slice(0, length))
            await vi.advanceTimersByTimeAsync(200)
        }
        expect(connect).toHaveBeenCalledOnce()
        await vi.advanceTimersByTimeAsync(settle)
        expect(connect).toHaveBeenCalledTimes(2)
        const [, options] = connect.mock.lastCall ?? []
        expect(options).toMatchObject({ username: 'grower' })
        expect(Reflect.get(options ?? {}, 'password')).toBe(typed)
    })

    it('lets the backoff grow across failed retries', async () => {
        await start()
        refuseAndClose(refusal('Server unavailable', 3))
        await vi.advanceTimersByTimeAsync(1000)
        expect(connect).toHaveBeenCalledTimes(2)
        refuseAndClose(refusal('Server unavailable', 3))
        // The second retry waits 2 s, not 1 s again.
        await vi.advanceTimersByTimeAsync(1000)
        expect(connect).toHaveBeenCalledTimes(2)
        await vi.advanceTimersByTimeAsync(1000)
        expect(connect).toHaveBeenCalledTimes(3)
    })

    it('drops a pending backoff retry once corrected credentials connect', async () => {
        const { store, settle } = await start()
        for (let attempt = 0; attempt < 3; attempt += 1) {
            refuseAndClose(refusal('Server unavailable', 3))
            await vi.advanceTimersByTimeAsync(1000 * 2 ** attempt)
        }
        expect(connect).toHaveBeenCalledTimes(4)
        // The next retry is due in 8 s; the corrected credentials connect after 1.5 s.
        refuseAndClose(refusal('Server unavailable', 3))
        store.getState().setUsername('grower-2')
        await vi.advanceTimersByTimeAsync(settle)
        expect(connect).toHaveBeenCalledTimes(5)
        latest().handlers.get('connect')?.()
        await vi.advanceTimersByTimeAsync(60_000)
        expect(connect).toHaveBeenCalledTimes(5)
        expect(store.getState().connectionStatus).toBe('connected')
    })

    it('holds a retry that comes due while credentials settle, and runs it after', async () => {
        const { store, settle } = await start()
        refuseAndClose(refusal('Server unavailable', 3))
        // Typing starts just before the 1 s retry is due, then returns to the old value.
        await vi.advanceTimersByTimeAsync(900)
        store.getState().setUsername('grower-2')
        await vi.advanceTimersByTimeAsync(200)
        expect(connect).toHaveBeenCalledOnce()
        store.getState().setUsername('grower')
        await vi.advanceTimersByTimeAsync(settle)
        // Unchanged credentials, but the held retry still runs: recovery is not lost.
        expect(connect).toHaveBeenCalledTimes(2)
    })

    it('ignores the late close of the client a credential change replaced', async () => {
        const { store, settle } = await start()
        const first = latest()
        first.handlers.get('connect')?.()
        expect(store.getState().connectionStatus).toBe('connected')
        store.getState().setUsername('grower-2')
        await vi.advanceTimersByTimeAsync(settle)
        expect(connect).toHaveBeenCalledTimes(2)
        latest().handlers.get('connect')?.()
        // The retired client closes after its successor connected: nothing may react to it.
        first.handlers.get('close')?.()
        first.handlers.get('error')?.(refusal('Not authorized', 5))
        await vi.advanceTimersByTimeAsync(120_000)
        expect(connect).toHaveBeenCalledTimes(2)
        expect(store.getState().connectionStatus).toBe('connected')
    })

    it('does not reconnect for unchanged credentials or once IoT is turned off', async () => {
        const { store, settle } = await start()
        refuseAndClose(refusal('Not authorized', 5))
        store.getState().setUsername('grower')
        await vi.advanceTimersByTimeAsync(settle * 2)
        expect(connect).toHaveBeenCalledOnce()

        store.getState().setUsername('other')
        store.getState().setEnabled(false)
        await vi.advanceTimersByTimeAsync(settle * 2)
        expect(connect).toHaveBeenCalledOnce()
    })
})

describe('the sensor client after a refused CONNECT', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.clearAllMocks()
        clients.length = 0
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

    it('lets the backoff grow across failed retries', async () => {
        const service = await start()
        refuseAndClose(refusal('Server busy', 0x89))
        await vi.advanceTimersByTimeAsync(1000)
        expect(connect).toHaveBeenCalledTimes(2)
        refuseAndClose(refusal('Server busy', 0x89))
        await vi.advanceTimersByTimeAsync(1000)
        expect(connect).toHaveBeenCalledTimes(2)
        await vi.advanceTimersByTimeAsync(1000)
        expect(connect).toHaveBeenCalledTimes(3)
        service.disconnect()
    })

    it('ignores the late close of a client that a new connect replaced', async () => {
        const service = await start()
        const first = latest()
        first.handlers.get('connect')?.()
        service.connect()
        expect(connect).toHaveBeenCalledTimes(2)
        latest().handlers.get('connect')?.()
        first.handlers.get('close')?.()
        await vi.advanceTimersByTimeAsync(120_000)
        expect(connect).toHaveBeenCalledTimes(2)
        expect(service.getConnectionState()).toBe('connected')
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
