import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppStore } from '@/stores/store'

const mockClient = { on: vi.fn(), end: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn() }
const connect = vi.fn(() => mockClient)

vi.mock('mqtt', () => ({ default: { connect } }))
vi.mock('@/i18n', () => ({
    getT: () => (key: string, options?: { destination?: string }) =>
        `${key}:${options?.destination ?? ''}`,
}))

/** A fresh service and IoT store, as after a page load. */
const load = async () => {
    vi.resetModules()
    const { setLocalOnlyMode } = await import('@/services/localOnlyModeService')
    const { useIotStore } = await import('@/stores/useIotStore')
    const { mqttClientService } = await import('./mqttClientService')
    mqttClientService.init({} as AppStore)
    return { setLocalOnlyMode, useIotStore, mqttClientService }
}

const start = (store: Awaited<ReturnType<typeof load>>['useIotStore'], brokerUrl: string) => {
    store.getState().setBrokerUrl(brokerUrl)
    store.getState().setEnabled(true)
}

describe('mqttClientService in Local-Only Mode (GH #683)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
    })

    afterEach(async () => {
        const { setLocalOnlyMode } = await import('@/services/localOnlyModeService')
        setLocalOnlyMode(false)
    })

    it('does not connect to a broker on the internet and says why', async () => {
        const { setLocalOnlyMode, useIotStore } = await load()
        setLocalOnlyMode(true)

        start(useIotStore, 'wss://user:pw@broker.hivemq.cloud:8884/mqtt')

        expect(connect).not.toHaveBeenCalled()
        expect(useIotStore.getState().connectionStatus).toBe('error')
        expect(useIotStore.getState().lastError).toBe(
            'common.egress.blockedByLocalOnly:wss://broker.hivemq.cloud:8884',
        )
    })

    it('still connects to a broker on the local network', async () => {
        const { setLocalOnlyMode, useIotStore } = await load()
        setLocalOnlyMode(true)

        start(useIotStore, 'wss://192.168.1.20:9001')

        expect(connect).toHaveBeenCalledOnce()
    })

    it('closes an open connection to an internet broker when the mode is switched on', async () => {
        const { setLocalOnlyMode, useIotStore, mqttClientService } = await load()
        start(useIotStore, 'wss://broker.hivemq.cloud:8884/mqtt')
        expect(connect).toHaveBeenCalledOnce()

        setLocalOnlyMode(true)
        mqttClientService.enforceLocalOnlyMode()

        expect(mockClient.end).toHaveBeenCalledWith(true)
        expect(useIotStore.getState().connectionStatus).toBe('error')
    })

    it('keeps an open connection to a LAN broker when the mode is switched on', async () => {
        const { setLocalOnlyMode, useIotStore, mqttClientService } = await load()
        start(useIotStore, 'wss://broker.local:9001')

        setLocalOnlyMode(true)
        mqttClientService.enforceLocalOnlyMode()

        expect(mockClient.end).not.toHaveBeenCalled()
    })
})
