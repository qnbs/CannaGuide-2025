import mqtt from 'mqtt'
import type { MqttClient, IClientOptions } from 'mqtt'
import { getT } from '@/i18n'
import { EgressBlockedError, isEgressAllowed } from '@/services/net/egress'
import { permanentConnackRefusal } from '@/services/mqttConnackRefusal'
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
/**
 * How long credentials must stay unchanged before a reconnect applies them. Settings stores
 * the username and password on every keystroke; without this wait each character would open
 * a new connection, and against a refusing broker, a new refusal.
 */
export const CREDENTIAL_SETTLE_MS = 1500
const KEEPALIVE_SECONDS = 30

// ---------------------------------------------------------------------------
// Singleton Service
// ---------------------------------------------------------------------------

class MqttClientService {
    private client: MqttClient | null = null
    private store: AppStore | null = null
    private unsubscribeStore: (() => void) | null = null
    private unsubscribeCredentials: (() => void) | null = null
    private credentialHandle: ReturnType<typeof setTimeout> | null = null
    /** The username and password the last CONNECT used; a settled change is compared to it. */
    private appliedCredentials: { username: string; password: string } | null = null
    private currentTopic: string | null = null
    private currentReconnectMs = INITIAL_RECONNECT_MS
    private reconnectHandle: ReturnType<typeof setTimeout> | null = null
    private intentionalDisconnect = false
    /** The broker refused the CONNECT for good (see mqttConnackRefusal); do not retry. */
    private refusedByBroker = false
    /** The broker URL the open client was created with (it can differ from the store). */
    private connectedBrokerUrl: string | null = null
    /** True while Local-Only Mode refused or closed this connection (resumeAfterLocalOnlyMode). */
    private pausedByLocalOnly = false

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

        // Changed credentials reconnect once they settle: that is how a refused CONNECT, which
        // is not retried, recovers. Unchanged credentials never reconnect, so a refusal cannot
        // loop. The saved password is loaded before init, so its arrival is no change here.
        this.unsubscribeCredentials = useIotStore.subscribe(
            (s) => ({ username: s.username, password: s.password }),
            (cur, prev) => {
                if (cur.username === prev.username && cur.password === prev.password) return
                this.clearCredentialTimer()
                this.credentialHandle = setTimeout(() => {
                    this.credentialHandle = null
                    const { isEnabled, brokerUrl, username, password } = useIotStore.getState()
                    const applied = this.appliedCredentials
                    const changed =
                        applied === null ||
                        applied.username !== username ||
                        applied.password !== password
                    if (isEnabled && brokerUrl && changed) this.connect()
                }, CREDENTIAL_SETTLE_MS)
            },
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
        this.refusedByBroker = false
        this.currentReconnectMs = INITIAL_RECONNECT_MS

        const { brokerUrl, username, password, topicPrefix } = useIotStore.getState()
        this.appliedCredentials = { username, password }
        if (!isValidBrokerUrl(brokerUrl)) {
            useIotStore
                .getState()
                .setConnectionStatus('error', String(getT()('common.mqtt.invalidBrokerUrl')))
            return
        }

        if (this.refuseBlockedBroker(brokerUrl)) return
        this.pausedByLocalOnly = false

        // WSS enforcement: block credentials over unencrypted ws://
        try {
            const parsed = new URL(brokerUrl)
            if (parsed.protocol === 'ws:' && (username || password)) {
                useIotStore
                    .getState()
                    .setConnectionStatus('error', String(getT()('common.mqtt.credentialsNeedWss')))
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

        let client: MqttClient
        try {
            client = mqtt.connect(brokerUrl, opts)
            this.client = client
            this.connectedBrokerUrl = brokerUrl
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : String(getT()('common.mqtt.connectionFailed'))
            useIotStore.getState().setConnectionStatus('error', msg)
            return
        }

        const topic = `${topicPrefix}/#`
        this.currentTopic = topic
        // A client this one replaced (a reconnect for new credentials or a new broker) still
        // closes asynchronously; its events must not touch the state of its successor, or its
        // close would schedule a reconnect that ends the successor, over and over.
        const current = (): boolean => this.client === client

        client.on('connect', () => {
            if (!current()) return
            useIotStore.getState().setConnectionStatus('connected')
            client.subscribe(topic, { qos: 0 }, (err) => {
                if (err) {
                    console.debug('[MQTT] Subscribe error:', err.message)
                }
            })
        })

        client.on('error', (err) => {
            if (!current()) return
            if (permanentConnackRefusal(err) !== null) this.refusedByBroker = true
            useIotStore.getState().setConnectionStatus('error', err.message)
        })

        client.on('close', () => {
            if (!current()) return
            // A refused CONNECT keeps its error and is not retried: since mqtt 5.16 the socket
            // closes after it, which would otherwise replace the error and retry bad credentials.
            if (this.refusedByBroker) return
            if (!this.intentionalDisconnect) {
                useIotStore.getState().setConnectionStatus('disconnected')
                this.scheduleReconnect()
            }
        })

        client.on('message', (_topic: string, message: Buffer) => {
            if (!current()) return
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

    /**
     * Local-Only Mode: a broker on the user's LAN is fine, one on the internet is
     * not (services/net/egress.ts). Reports the refusal and returns true when the
     * broker is blocked.
     */
    private refuseBlockedBroker(brokerUrl: string): boolean {
        if (isEgressAllowed(brokerUrl, { allowPrivateNetwork: true })) return false
        this.pausedByLocalOnly = true
        const { destination } = new EgressBlockedError(brokerUrl)
        useIotStore
            .getState()
            .setConnectionStatus(
                'error',
                String(getT()('common.egress.blockedByLocalOnly', { destination })),
            )
        return true
    }

    /** The broker the open client was created for, when the gate now refuses it. */
    private blockedConnectionUrl(): string | null {
        const url = this.client ? this.connectedBrokerUrl : null
        return url !== null && !isEgressAllowed(url, { allowPrivateNetwork: true }) ? url : null
    }

    /** Local-Only Mode was switched on: close a connection to a broker it blocks. */
    enforceLocalOnlyMode(): void {
        const blocked = this.blockedConnectionUrl()
        if (blocked === null) return
        this.disconnect()
        this.refuseBlockedBroker(blocked)
    }

    /** Local-Only Mode was switched off: reopen a connection it refused or closed. */
    resumeAfterLocalOnlyMode(): void {
        if (!this.pausedByLocalOnly) return
        this.pausedByLocalOnly = false
        const { isEnabled, brokerUrl } = useIotStore.getState()
        if (isEnabled && brokerUrl) this.connect()
    }

    private clearCredentialTimer(): void {
        if (this.credentialHandle) {
            clearTimeout(this.credentialHandle)
            this.credentialHandle = null
        }
    }

    private disconnect(): void {
        this.clearCredentialTimer()
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
            this.connectedBrokerUrl = null
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
        this.clearCredentialTimer()
        this.disconnectClient()
        this.unsubscribeStore?.()
        this.unsubscribeStore = null
        this.unsubscribeCredentials?.()
        this.unsubscribeCredentials = null
        this.store = null
    }
}

export const mqttClientService = new MqttClientService()
