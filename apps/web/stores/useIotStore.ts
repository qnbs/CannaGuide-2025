import { create } from 'zustand'
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware'

export type IotConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface IotSettings {
    brokerUrl: string
    username: string
    password: string
    topicPrefix: string
    isEnabled: boolean
    connectionStatus: IotConnectionStatus
    lastError: string | null
}

interface IotActions {
    setBrokerUrl: (url: string) => void
    setUsername: (username: string) => void
    setPassword: (password: string) => void
    setTopicPrefix: (prefix: string) => void
    setEnabled: (enabled: boolean) => void
    setConnectionStatus: (status: IotConnectionStatus, error?: string) => void
    testConnection: () => Promise<boolean>
}

export type IotState = IotSettings & IotActions

const DEFAULT_BROKER_URL = 'wss://test.mosquitto.org:8081'
const DEFAULT_TOPIC_PREFIX = 'cannaguide/sensors'
const TEST_CONNECTION_TIMEOUT_MS = 3000

export const useIotStore = create<IotState>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                // Settings
                brokerUrl: DEFAULT_BROKER_URL,
                username: '',
                password: '',
                topicPrefix: DEFAULT_TOPIC_PREFIX,
                isEnabled: false,
                connectionStatus: 'disconnected' as IotConnectionStatus,
                lastError: null,

                // Actions
                setBrokerUrl: (url: string) => set({ brokerUrl: url }),
                setUsername: (username: string) => set({ username }),
                setPassword: (password: string) => set({ password }),
                setTopicPrefix: (prefix: string) => set({ topicPrefix: prefix }),
                setEnabled: (enabled: boolean) => {
                    if (!enabled) {
                        set({ isEnabled: false, connectionStatus: 'disconnected', lastError: null })
                    } else {
                        set({ isEnabled: true })
                    }
                },
                setConnectionStatus: (status: IotConnectionStatus, error?: string) =>
                    set({ connectionStatus: status, lastError: error ?? null }),

                testConnection: async (): Promise<boolean> => {
                    const { brokerUrl } = get()
                    if (!brokerUrl) {
                        set({ connectionStatus: 'error', lastError: 'No broker URL configured' })
                        return false
                    }
                    set({ connectionStatus: 'connecting', lastError: null })
                    try {
                        // Validate URL format
                        const url = new URL(brokerUrl)
                        if (url.protocol !== 'wss:' && url.protocol !== 'ws:') {
                            throw new Error('Broker URL must use ws:// or wss:// protocol')
                        }
                        // Simulated connection test with timeout
                        await new Promise<void>((resolve, reject) => {
                            const timer = setTimeout(
                                () => reject(new Error('Connection timeout')),
                                TEST_CONNECTION_TIMEOUT_MS,
                            )
                            // In production this would attempt a real MQTT connect/disconnect.
                            // For now we resolve after a short delay to simulate the handshake.
                            setTimeout(() => {
                                clearTimeout(timer)
                                resolve()
                            }, 800)
                        })
                        set({ connectionStatus: 'connected' })
                        return true
                    } catch (err) {
                        const message = err instanceof Error ? err.message : 'Unknown error'
                        set({ connectionStatus: 'error', lastError: message })
                        return false
                    }
                },
            }),
            {
                name: 'cannaguide-iot-settings',
                storage: createJSONStorage(() => localStorage),
                partialize: (state) => ({
                    brokerUrl: state.brokerUrl,
                    username: state.username,
                    password: state.password,
                    topicPrefix: state.topicPrefix,
                    isEnabled: state.isEnabled,
                }),
            },
        ),
    ),
)
