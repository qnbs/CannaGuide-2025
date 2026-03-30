import mqtt from 'mqtt'
import type { MqttClient, IClientOptions } from 'mqtt'
import { useIotStore } from '@/stores/useIotStore'
import { addJournalEntry } from '@/stores/slices/simulationSlice'
import { JournalEntryType } from '@/types'
import type { AppStore } from '@/stores/store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SensorPayload {
    temperature?: number
    humidity?: number
    ec?: number
    ph?: number
    lightPpfd?: number
    waterVolumeMl?: number
    plantId?: string
    timestamp?: number
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

const isValidBrokerUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url)
        return parsed.protocol === 'ws:' || parsed.protocol === 'wss:'
    } catch {
        return false
    }
}

const sanitizePayload = (raw: unknown): SensorPayload | null => {
    if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
    const obj = raw as Record<string, unknown>

    // At least one sensor value must be present
    const hasValue =
        isFiniteNumber(obj['temperature']) ||
        isFiniteNumber(obj['humidity']) ||
        isFiniteNumber(obj['ec']) ||
        isFiniteNumber(obj['ph']) ||
        isFiniteNumber(obj['lightPpfd']) ||
        isFiniteNumber(obj['waterVolumeMl'])

    if (!hasValue) return null

    return {
        temperature: isFiniteNumber(obj['temperature']) ? obj['temperature'] : undefined,
        humidity: isFiniteNumber(obj['humidity']) ? obj['humidity'] : undefined,
        ec: isFiniteNumber(obj['ec']) ? obj['ec'] : undefined,
        ph: isFiniteNumber(obj['ph']) ? obj['ph'] : undefined,
        lightPpfd: isFiniteNumber(obj['lightPpfd']) ? obj['lightPpfd'] : undefined,
        waterVolumeMl: isFiniteNumber(obj['waterVolumeMl']) ? obj['waterVolumeMl'] : undefined,
        plantId: typeof obj['plantId'] === 'string' ? obj['plantId'] : undefined,
        timestamp: isFiniteNumber(obj['timestamp']) ? obj['timestamp'] : undefined,
    }
}

// ---------------------------------------------------------------------------
// Singleton Service
// ---------------------------------------------------------------------------

class MqttClientService {
    private client: MqttClient | null = null
    private store: AppStore | null = null
    private unsubscribeStore: (() => void) | null = null
    private currentTopic: string | null = null

    /** Bootstrap the service. Call once after store creation. */
    init(store: AppStore): void {
        if (this.store) return // already initialised
        this.store = store

        // React to isEnabled / brokerUrl / topicPrefix changes
        this.unsubscribeStore = useIotStore.subscribe(
            (s) => ({ isEnabled: s.isEnabled, brokerUrl: s.brokerUrl, topicPrefix: s.topicPrefix }),
            (cur, prev) => {
                if (
                    cur.isEnabled !== prev.isEnabled ||
                    cur.brokerUrl !== prev.brokerUrl ||
                    cur.topicPrefix !== prev.topicPrefix
                ) {
                    if (cur.isEnabled && cur.brokerUrl) {
                        this.connect()
                    } else {
                        this.disconnect()
                    }
                }
            },
            { fireImmediately: true },
        )

        // Clean up on page unload
        window.addEventListener('pagehide', () => this.dispose(), { once: true })
    }

    // -----------------------------------------------------------------------
    // Connection lifecycle
    // -----------------------------------------------------------------------

    private connect(): void {
        // Tear down any existing connection first
        this.disconnectClient()

        const { brokerUrl, username, password, topicPrefix } = useIotStore.getState()
        if (!isValidBrokerUrl(brokerUrl)) {
            useIotStore.getState().setConnectionStatus('error', 'Invalid broker URL')
            return
        }

        useIotStore.getState().setConnectionStatus('connecting')

        const opts: IClientOptions = {
            reconnectPeriod: 5000,
            connectTimeout: 10_000,
        }
        if (username) opts.username = username
        if (password) opts.password = password

        try {
            this.client = mqtt.connect(brokerUrl, opts)
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Connection failed'
            useIotStore.getState().setConnectionStatus('error', msg)
            return
        }

        const topic = `${topicPrefix}/#`
        this.currentTopic = topic

        this.client.on('connect', () => {
            useIotStore.getState().setConnectionStatus('connected')
            this.client?.subscribe(topic, { qos: 0 }, (err) => {
                if (err) {
                    console.debug('[MQTT] Subscribe error:', err.message)
                }
            })
        })

        this.client.on('error', (err) => {
            useIotStore.getState().setConnectionStatus('error', err.message)
        })

        this.client.on('close', () => {
            // Only set disconnected if we still have a client (not during intentional teardown)
            if (this.client) {
                useIotStore.getState().setConnectionStatus('disconnected')
            }
        })

        this.client.on('message', (_topic: string, message: Buffer) => {
            this.handleMessage(message)
        })
    }

    private disconnect(): void {
        this.disconnectClient()
        useIotStore.getState().setConnectionStatus('disconnected')
    }

    private disconnectClient(): void {
        if (this.client) {
            if (this.currentTopic) {
                this.client.unsubscribe(this.currentTopic)
                this.currentTopic = null
            }
            this.client.end(true)
            this.client = null
        }
    }

    // -----------------------------------------------------------------------
    // Message handling -> Redux dispatch
    // -----------------------------------------------------------------------

    private handleMessage(message: Buffer): void {
        if (!this.store) return

        let raw: unknown
        try {
            raw = JSON.parse(message.toString('utf-8'))
        } catch {
            console.debug('[MQTT] Non-JSON payload ignored')
            return
        }

        const payload = sanitizePayload(raw)
        if (!payload) return

        // Determine target plant -- fall back to first active plant
        let plantId = payload.plantId
        if (!plantId) {
            const sim = this.store.getState().simulation
            const firstSlot = sim.plantSlots.find((id): id is string => id !== null)
            if (!firstSlot) return // no plants to log to
            plantId = firstSlot
        }

        this.store.dispatch(
            addJournalEntry({
                plantId,
                entry: {
                    type: JournalEntryType.Environment,
                    notes: 'IoT sensor reading',
                    details: {
                        temp: payload.temperature,
                        humidity: payload.humidity,
                        ec: payload.ec,
                        ph: payload.ph,
                        lightPpfd: payload.lightPpfd,
                        waterVolumeMl: payload.waterVolumeMl,
                        source: 'iot_sensor' as const,
                    },
                },
            }),
        )
    }

    // -----------------------------------------------------------------------
    // Teardown
    // -----------------------------------------------------------------------

    dispose(): void {
        this.disconnectClient()
        this.unsubscribeStore?.()
        this.unsubscribeStore = null
        this.store = null
    }
}

export const mqttClientService = new MqttClientService()
