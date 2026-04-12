import mqtt from 'mqtt'
import type { MqttClient, IClientOptions } from 'mqtt'
import { useIotStore } from '@/stores/useIotStore'
import { addJournalEntry } from '@/stores/slices/simulationSlice'
import { JournalEntryType } from '@/types'
import type { AppStore } from '@/stores/store'
import { mqttJournalPayloadSchema, type MqttJournalPayload } from '@/types/iotSchemas'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// (SensorPayload replaced by Zod schema: mqttJournalPayloadSchema)

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const isValidBrokerUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url)
        return parsed.protocol === 'ws:' || parsed.protocol === 'wss:'
    } catch {
        return false
    }
}

/** Validate sensor payload via Zod schema (replaces inline sanitizePayload). */
const validatePayload = (raw: unknown): MqttJournalPayload | null => {
    const result = mqttJournalPayloadSchema.safeParse(raw)
    if (!result.success) {
        console.debug('[MQTT] Payload validation failed:', result.error.issues[0]?.message)
        return null
    }
    return result.data
}

// --- Reconnect with exponential backoff ---
const INITIAL_RECONNECT_MS = 1000
const MAX_RECONNECT_MS = 60_000
const BACKOFF_MULTIPLIER = 2
const KEEPALIVE_SECONDS = 30

// ---------------------------------------------------------------------------
// Singleton Service
// ---------------------------------------------------------------------------

class MqttClientService {
    private client: MqttClient | null = null
    private store: AppStore | null = null
    private unsubscribeStore: (() => void) | null = null
    private currentTopic: string | null = null
    private currentReconnectMs = INITIAL_RECONNECT_MS
    private reconnectHandle: ReturnType<typeof setTimeout> | null = null
    private intentionalDisconnect = false

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
        this.intentionalDisconnect = false
        this.currentReconnectMs = INITIAL_RECONNECT_MS

        const { brokerUrl, username, password, topicPrefix } = useIotStore.getState()
        if (!isValidBrokerUrl(brokerUrl)) {
            useIotStore.getState().setConnectionStatus('error', 'Invalid broker URL')
            return
        }

        // WSS enforcement: block credentials over unencrypted ws://
        try {
            const parsed = new URL(brokerUrl)
            if (parsed.protocol === 'ws:' && (username || password)) {
                useIotStore
                    .getState()
                    .setConnectionStatus(
                        'error',
                        'Credentials require wss:// (encrypted). Plain ws:// with credentials is blocked for security.',
                    )
                console.debug('[MQTT] BLOCKED: credentials over unencrypted ws:// -- use wss://')
                return
            }
        } catch {
            // URL validation already handled above
        }

        useIotStore.getState().setConnectionStatus('connecting')

        const opts: IClientOptions = {
            reconnectPeriod: 0, // We handle reconnect ourselves with exponential backoff
            connectTimeout: 10_000,
            keepalive: KEEPALIVE_SECONDS,
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
            if (this.client && !this.intentionalDisconnect) {
                useIotStore.getState().setConnectionStatus('disconnected')
                this.scheduleReconnect()
            }
        })

        this.client.on('message', (_topic: string, message: Buffer) => {
            this.handleMessage(message)
        })
    }

    /** Schedule a reconnect with exponential backoff. */
    private scheduleReconnect(): void {
        if (this.intentionalDisconnect || this.reconnectHandle) return
        const delay = this.currentReconnectMs
        console.debug(`[MQTT-Client] Reconnecting in ${delay}ms`)
        this.reconnectHandle = setTimeout(() => {
            this.reconnectHandle = null
            if (!this.intentionalDisconnect && useIotStore.getState().isEnabled) {
                this.connect()
            }
        }, delay)
        this.currentReconnectMs = Math.min(
            this.currentReconnectMs * BACKOFF_MULTIPLIER,
            MAX_RECONNECT_MS,
        )
    }

    private disconnect(): void {
        this.intentionalDisconnect = true
        if (this.reconnectHandle) {
            clearTimeout(this.reconnectHandle)
            this.reconnectHandle = null
        }
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

        const payload = validatePayload(raw)
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
        this.intentionalDisconnect = true
        if (this.reconnectHandle) {
            clearTimeout(this.reconnectHandle)
            this.reconnectHandle = null
        }
        this.disconnectClient()
        this.unsubscribeStore?.()
        this.unsubscribeStore = null
        this.store = null
    }
}

export const mqttClientService = new MqttClientService()
