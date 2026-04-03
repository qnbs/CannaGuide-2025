import { describe, it, expect, beforeEach } from 'vitest'
import { useIotStore, type IotConnectionStatus } from '@/stores/useIotStore'

// ---------------------------------------------------------------------------
// IoT Connection Store -- Unit + Mutation-Resilience Tests
//
// Covers state transitions, validation logic, and edge cases to ensure
// Stryker mutations in this store are caught.
// ---------------------------------------------------------------------------

describe('useIotStore', () => {
    beforeEach(async () => {
        // Reset store to defaults
        const store = useIotStore.getState()
        store.setBrokerUrl('wss://test.mosquitto.org:8081')
        store.setUsername('')
        await store.setPassword('')
        store.setTopicPrefix('cannaguide/sensors')
        store.setEnabled(false)
        store.setConnectionStatus('disconnected')
    })

    describe('setters', () => {
        it('setBrokerUrl updates brokerUrl', () => {
            useIotStore.getState().setBrokerUrl('wss://example.com:8883')
            expect(useIotStore.getState().brokerUrl).toBe('wss://example.com:8883')
        })

        it('setUsername updates username', () => {
            useIotStore.getState().setUsername('admin')
            expect(useIotStore.getState().username).toBe('admin')
        })

        it('setPassword updates password', async () => {
            await useIotStore.getState().setPassword('secret')
            expect(useIotStore.getState().password).toBe('secret')
        })

        it('setTopicPrefix updates topicPrefix', () => {
            useIotStore.getState().setTopicPrefix('home/grow')
            expect(useIotStore.getState().topicPrefix).toBe('home/grow')
        })
    })

    describe('setEnabled', () => {
        it('enabling sets isEnabled to true', () => {
            useIotStore.getState().setEnabled(true)
            expect(useIotStore.getState().isEnabled).toBe(true)
        })

        it('disabling resets connection state', () => {
            // First connect
            useIotStore.getState().setEnabled(true)
            useIotStore.getState().setConnectionStatus('connected')
            // Then disable
            useIotStore.getState().setEnabled(false)
            const state = useIotStore.getState()
            expect(state.isEnabled).toBe(false)
            expect(state.connectionStatus).toBe('disconnected')
            expect(state.lastError).toBeNull()
        })

        it('disabling clears any previous error', () => {
            useIotStore.getState().setConnectionStatus('error', 'timeout')
            expect(useIotStore.getState().lastError).toBe('timeout')
            useIotStore.getState().setEnabled(false)
            expect(useIotStore.getState().lastError).toBeNull()
        })
    })

    describe('setConnectionStatus', () => {
        it.each<[IotConnectionStatus, string | undefined, string | null]>([
            ['connecting', undefined, null],
            ['connected', undefined, null],
            ['error', 'Connection refused', 'Connection refused'],
            ['disconnected', undefined, null],
            ['error', undefined, null],
        ])('status=%s error=%s -> lastError=%s', (status, error, expectedLastError) => {
            useIotStore.getState().setConnectionStatus(status, error)
            const state = useIotStore.getState()
            expect(state.connectionStatus).toBe(status)
            expect(state.lastError).toBe(expectedLastError)
        })
    })

    describe('testConnection', () => {
        it('succeeds with valid wss:// URL', async () => {
            useIotStore.getState().setBrokerUrl('wss://broker.example.com:8883')
            const result = await useIotStore.getState().testConnection()
            expect(result).toBe(true)
            expect(useIotStore.getState().connectionStatus).toBe('connected')
        })

        it('succeeds with valid ws:// URL', async () => {
            useIotStore.getState().setBrokerUrl('ws://localhost:1883')
            const result = await useIotStore.getState().testConnection()
            expect(result).toBe(true)
        })

        it('fails with empty URL', async () => {
            useIotStore.getState().setBrokerUrl('')
            const result = await useIotStore.getState().testConnection()
            expect(result).toBe(false)
            expect(useIotStore.getState().connectionStatus).toBe('error')
            expect(useIotStore.getState().lastError).toBe('No broker URL configured')
        })

        it('fails with non-websocket protocol', async () => {
            useIotStore.getState().setBrokerUrl('https://broker.example.com')
            const result = await useIotStore.getState().testConnection()
            expect(result).toBe(false)
            expect(useIotStore.getState().connectionStatus).toBe('error')
            expect(useIotStore.getState().lastError).toContain('ws://')
        })

        it('fails with invalid URL', async () => {
            useIotStore.getState().setBrokerUrl('not-a-url')
            const result = await useIotStore.getState().testConnection()
            expect(result).toBe(false)
            expect(useIotStore.getState().connectionStatus).toBe('error')
        })

        it('transitions through connecting state', async () => {
            const states: IotConnectionStatus[] = []
            const unsub = useIotStore.subscribe(
                (s) => s.connectionStatus,
                (status) => states.push(status),
            )
            useIotStore.getState().setBrokerUrl('wss://broker.example.com:8883')
            await useIotStore.getState().testConnection()
            unsub()
            expect(states).toContain('connecting')
            expect(states).toContain('connected')
        })
    })
})
