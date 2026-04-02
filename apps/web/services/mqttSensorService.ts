import mqtt from 'mqtt'
import type { SensorReading } from './webBluetoothSensorService'
import { getT } from '@/i18n'
import { sensorStore } from '@/stores/sensorStore'
import {
    singleValuePayloadSchema,
    envPayloadSchema,
    temperatureSchema,
    humiditySchema,
    phSchema,
    INITIAL_TELEMETRY,
    type MqttTelemetryMetrics,
} from '@/types/iotSchemas'

// ---------------------------------------------------------------------------
// MQTT Sensor Service -- connects to a local MQTT broker (e.g. Mosquitto)
// via WebSocket and subscribes to ESP32 sensor topics.
//
// Features:
//   - Exponential backoff reconnect (1s -> 2s -> 4s ... 60s cap)
//   - WSS-force: warns when using unencrypted ws:// with credentials
//   - Zod-validated payloads (replaces inline validation)
//   - Ping/pong keepalive (30s interval)
//   - Telemetry metrics (latency, uptime, errors, reconnects)
//
// Topic structure:
//   cannaguide/sensors/<deviceId>/temperature  -> { value: number }
//   cannaguide/sensors/<deviceId>/humidity     -> { value: number }
//   cannaguide/sensors/<deviceId>/ph           -> { value: number }
//   cannaguide/sensors/<deviceId>/env          -> { temperature, humidity, ph? }
// ---------------------------------------------------------------------------

export interface MqttSensorConfig {
    /** WebSocket URL of the MQTT broker, e.g. "wss://localhost:9001" */
    brokerUrl: string
    /** Base topic prefix. Default: "cannaguide/sensors" */
    topicPrefix: string
    /** Device ID to subscribe to. Default: "esp32" */
    deviceId: string
    /** Username for broker authentication (optional) */
    username?: string
    /** Password for broker authentication (optional) */
    password?: string
}

export type MqttConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export type SensorUpdateCallback = (reading: SensorReading) => void
export type ConnectionStateCallback = (state: MqttConnectionState) => void

/** Callback for IoT toast/error events surfaced to the UI. */
export type IoTEventCallback = (event: IoTEvent) => void

export interface IoTEvent {
    type: 'connection_lost' | 'connection_restored' | 'validation_error' | 'wss_warning'
    message: string
    timestamp: number
}

const DEFAULT_CONFIG: MqttSensorConfig = {
    brokerUrl: 'wss://localhost:9001',
    topicPrefix: 'cannaguide/sensors',
    deviceId: 'esp32',
}

// --- Reconnect with exponential backoff ---
const INITIAL_RECONNECT_MS = 1000
const MAX_RECONNECT_MS = 60_000
const BACKOFF_MULTIPLIER = 2
const CONNECT_TIMEOUT_MS = 10_000
const KEEPALIVE_SECONDS = 30
/** Maximum allowed MQTT payload size (64 KB) to prevent memory abuse. */
const MAX_PAYLOAD_SIZE = 65_536
/** Only allow WebSocket URLs to prevent SSRF / protocol confusion. */
const isValidBrokerUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url)
        return parsed.protocol === 'ws:' || parsed.protocol === 'wss:'
    } catch {
        return false
    }
}

/** Only alphanumeric, hyphen, underscore — prevents path traversal & wildcard injection. */
const isValidSubtopic = (subtopic: string): boolean => /^[a-zA-Z0-9_-]+$/.test(subtopic)

class MqttSensorService {
    private client: mqtt.MqttClient | null = null
    private config: MqttSensorConfig = { ...DEFAULT_CONFIG }
    private connectionState: MqttConnectionState = 'disconnected'
    private lastReading: SensorReading | null = null

    private readonly sensorCallbacks: Set<SensorUpdateCallback> = new Set()
    private readonly stateCallbacks: Set<ConnectionStateCallback> = new Set()
    private readonly eventCallbacks: Set<IoTEventCallback> = new Set()

    // Partial values accumulate until a full reading is assembled
    private partialTemp: number | null = null
    private partialHumidity: number | null = null
    private partialPh: number | null = null

    private connectTimeoutHandle: ReturnType<typeof setTimeout> | null = null

    // --- Exponential backoff state ---
    private currentReconnectMs = INITIAL_RECONNECT_MS
    private reconnectHandle: ReturnType<typeof setTimeout> | null = null
    private intentionalDisconnect = false

    // --- Telemetry ---
    private telemetry: MqttTelemetryMetrics = { ...INITIAL_TELEMETRY }
    private connectedSince: number | null = null
    private latencySum = 0
    private latencyCount = 0

    getConnectionState(): MqttConnectionState {
        return this.connectionState
    }

    getLastReading(): SensorReading | null {
        return this.lastReading
    }

    getTelemetry(): MqttTelemetryMetrics {
        return {
            ...this.telemetry,
            uptimeMs: this.connectedSince ? Date.now() - this.connectedSince : 0,
            avgLatencyMs:
                this.latencyCount > 0 ? Math.round(this.latencySum / this.latencyCount) : 0,
        }
    }

    /** Check if broker URL uses unencrypted ws:// with credentials configured. */
    isInsecureWithCredentials(): boolean {
        try {
            const parsed = new URL(this.config.brokerUrl)
            return parsed.protocol === 'ws:' && (!!this.config.username || !!this.config.password)
        } catch {
            return false
        }
    }

    configure(config: Partial<MqttSensorConfig>): void {
        if (config.brokerUrl !== undefined && !isValidBrokerUrl(config.brokerUrl)) {
            throw new Error('Invalid broker URL -- must start with ws:// or wss://')
        }
        this.config = { ...this.config, ...config }
    }

    onSensorUpdate(callback: SensorUpdateCallback): () => void {
        this.sensorCallbacks.add(callback)
        return () => {
            this.sensorCallbacks.delete(callback)
        }
    }

    onConnectionStateChange(callback: ConnectionStateCallback): () => void {
        this.stateCallbacks.add(callback)
        return () => {
            this.stateCallbacks.delete(callback)
        }
    }

    /** Subscribe to IoT events (connection loss, restore, validation errors, WSS warnings). */
    onIoTEvent(callback: IoTEventCallback): () => void {
        this.eventCallbacks.add(callback)
        return () => {
            this.eventCallbacks.delete(callback)
        }
    }

    connect(): void {
        if (this.client) {
            this.disconnect()
        }

        this.intentionalDisconnect = false
        this.currentReconnectMs = INITIAL_RECONNECT_MS
        this.setConnectionState('connecting')

        // WSS warning
        if (this.isInsecureWithCredentials()) {
            this.emitEvent({
                type: 'wss_warning',
                message: 'Credentials sent over unencrypted ws:// -- use wss:// for security',
                timestamp: Date.now(),
            })
        }

        const { brokerUrl, username, password } = this.config

        this.connectTimeoutHandle = setTimeout(() => {
            if (this.connectionState === 'connecting') {
                console.debug('[MQTT] Connection timeout after', CONNECT_TIMEOUT_MS, 'ms')
                this.setConnectionState('error')
                if (this.client) {
                    this.client.end(true)
                    this.client = null
                }
                this.scheduleReconnect()
            }
        }, CONNECT_TIMEOUT_MS)

        this.client = mqtt.connect(brokerUrl, {
            ...(username != null ? { username } : {}),
            ...(password != null ? { password } : {}),
            reconnectPeriod: 0, // We handle reconnect ourselves with backoff
            connectTimeout: CONNECT_TIMEOUT_MS,
            keepalive: KEEPALIVE_SECONDS,
            protocolVersion: 5,
            clean: true,
            clientId: `cannaguide_${Date.now().toString(36)}`,
        })

        this.client.on('connect', () => {
            if (this.connectTimeoutHandle) {
                clearTimeout(this.connectTimeoutHandle)
                this.connectTimeoutHandle = null
            }
            // Reset backoff on successful connect
            this.currentReconnectMs = INITIAL_RECONNECT_MS
            this.connectedSince = Date.now()
            this.setConnectionState('connected')
            this.subscribeToTopics()

            // Emit restore event if this was a reconnect
            if (this.telemetry.reconnectAttempts > 0) {
                this.emitEvent({
                    type: 'connection_restored',
                    message: 'MQTT connection restored',
                    timestamp: Date.now(),
                })
            }
        })

        this.client.on('message', (_topic: string, payload: Buffer) => {
            this.handleMessage(_topic, payload)
        })

        this.client.on('error', (error: Error) => {
            if (this.connectTimeoutHandle) {
                clearTimeout(this.connectTimeoutHandle)
                this.connectTimeoutHandle = null
            }
            console.debug('[MQTT] Connection error:', error.message)
            this.setConnectionState('error')
        })

        this.client.on('close', () => {
            if (this.connectionState === 'connected') {
                this.emitEvent({
                    type: 'connection_lost',
                    message: 'MQTT connection lost',
                    timestamp: Date.now(),
                })
            }
            if (!this.intentionalDisconnect) {
                this.setConnectionState('disconnected')
                this.scheduleReconnect()
            }
        })
    }

    /** Schedule a reconnect with exponential backoff. */
    private scheduleReconnect(): void {
        if (this.intentionalDisconnect || this.reconnectHandle) return
        this.telemetry.reconnectAttempts += 1
        const delay = this.currentReconnectMs
        console.debug(
            `[MQTT] Reconnecting in ${delay}ms (attempt ${this.telemetry.reconnectAttempts})`,
        )
        this.reconnectHandle = setTimeout(() => {
            this.reconnectHandle = null
            if (!this.intentionalDisconnect) {
                this.connect()
            }
        }, delay)
        // Exponential backoff with cap
        this.currentReconnectMs = Math.min(
            this.currentReconnectMs * BACKOFF_MULTIPLIER,
            MAX_RECONNECT_MS,
        )
    }

    disconnect(): void {
        this.intentionalDisconnect = true
        if (this.connectTimeoutHandle) {
            clearTimeout(this.connectTimeoutHandle)
            this.connectTimeoutHandle = null
        }
        if (this.reconnectHandle) {
            clearTimeout(this.reconnectHandle)
            this.reconnectHandle = null
        }
        if (this.client) {
            this.client.end(true)
            this.client = null
        }
        this.connectedSince = null
        this.setConnectionState('disconnected')
        this.partialTemp = null
        this.partialHumidity = null
        this.partialPh = null
    }

    /** Fully dispose the service -- clears all callbacks and disconnects. */
    dispose(): void {
        this.disconnect()
        this.sensorCallbacks.clear()
        this.stateCallbacks.clear()
        this.eventCallbacks.clear()
        this.telemetry = { ...INITIAL_TELEMETRY }
        this.latencySum = 0
        this.latencyCount = 0
    }

    /** Publish a command to the sensor device (e.g. calibration trigger). */
    publish(subtopic: string, payload: Record<string, unknown>): void {
        if (!this.client || this.connectionState !== 'connected') {
            throw new Error(getT()('common.mqtt.notConnected'))
        }
        if (!isValidSubtopic(subtopic)) {
            throw new Error(`Invalid subtopic: only alphanumeric, hyphen, underscore allowed.`)
        }

        let jsonString: string
        try {
            jsonString = JSON.stringify(payload)
        } catch (error) {
            const reason = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Failed to serialize payload: ${reason}`)
        }

        const topic = `${this.config.topicPrefix}/${this.config.deviceId}/${subtopic}`
        this.client.publish(topic, jsonString, { qos: 1 })
    }

    private subscribeToTopics(): void {
        if (!this.client) return

        const prefix = `${this.config.topicPrefix}/${this.config.deviceId}`
        const topics = [
            `${prefix}/temperature`,
            `${prefix}/humidity`,
            `${prefix}/ph`,
            `${prefix}/env`,
        ]

        this.client.subscribe(topics, { qos: 1 }, (error) => {
            if (error) {
                console.debug('[MQTT] Subscribe error:', error.message)
            }
        })
    }

    private handleMessage(topic: string, payload: Buffer): void {
        const data = this.parsePayload(payload)
        if (!data) return

        this.telemetry.messagesReceived += 1
        this.telemetry.lastMessageAt = Date.now()

        const suffix = topic.split('/').pop()

        switch (suffix) {
            case 'temperature': {
                const parsed = singleValuePayloadSchema.safeParse(data)
                if (!parsed.success) {
                    this.trackValidationError('temperature payload invalid')
                    return
                }
                this.partialTemp = temperatureSchema.safeParse(parsed.data.value).success
                    ? parsed.data.value
                    : null
                break
            }
            case 'humidity': {
                const parsed = singleValuePayloadSchema.safeParse(data)
                if (!parsed.success) {
                    this.trackValidationError('humidity payload invalid')
                    return
                }
                this.partialHumidity = humiditySchema.safeParse(parsed.data.value).success
                    ? parsed.data.value
                    : null
                break
            }
            case 'ph': {
                const parsed = singleValuePayloadSchema.safeParse(data)
                if (!parsed.success) {
                    this.trackValidationError('ph payload invalid')
                    return
                }
                this.partialPh = phSchema.safeParse(parsed.data.value).success
                    ? parsed.data.value
                    : null
                break
            }
            case 'env': {
                // Combined payload -- validate & emit immediately
                const parsed = envPayloadSchema.safeParse(data)
                if (!parsed.success) {
                    this.trackValidationError('env payload invalid')
                    return
                }
                const temp = temperatureSchema.safeParse(parsed.data.temperature).success
                    ? parsed.data.temperature
                    : null
                const hum = humiditySchema.safeParse(parsed.data.humidity).success
                    ? parsed.data.humidity
                    : null
                if (temp !== null && hum !== null) {
                    const ph =
                        parsed.data.ph !== undefined
                            ? phSchema.safeParse(parsed.data.ph).success
                                ? parsed.data.ph
                                : null
                            : null
                    this.emitReading({
                        temperatureC: temp,
                        humidityPercent: hum,
                        ph,
                        receivedAt: Date.now(),
                    })
                }
                // Track latency if device sends a timestamp
                if (
                    'timestamp' in data &&
                    typeof (data as Record<string, unknown>)['timestamp'] === 'number'
                ) {
                    const deviceTs = (data as Record<string, unknown>)['timestamp'] as number
                    this.trackLatency(deviceTs)
                }
                return
            }
        }

        // Assemble from individual topics when we have temp + humidity
        if (this.partialTemp !== null && this.partialHumidity !== null) {
            this.emitReading({
                temperatureC: this.partialTemp,
                humidityPercent: this.partialHumidity,
                ph: this.partialPh,
                receivedAt: Date.now(),
            })
            this.partialTemp = null
            this.partialHumidity = null
            this.partialPh = null
        }
    }

    private trackValidationError(detail: string): void {
        this.telemetry.validationErrors += 1
        this.emitEvent({
            type: 'validation_error',
            message: `Sensor payload validation failed: ${detail}`,
            timestamp: Date.now(),
        })
    }

    private trackLatency(deviceTimestamp: number): void {
        const latency = Date.now() - deviceTimestamp
        if (latency >= 0 && latency < 300_000) {
            this.latencySum += latency
            this.latencyCount += 1
        }
    }

    private parsePayload(payload: Buffer): Record<string, unknown> | null {
        if (payload.length > MAX_PAYLOAD_SIZE) {
            console.debug('[MQTT] Payload exceeds maximum allowed size, discarding.')
            return null
        }
        try {
            const raw = payload.toString('utf-8')
            // Parse JSON directly — DOMPurify is not appropriate for JSON data
            // as it can corrupt valid payloads. Sensor values are validated
            // downstream via clampSensorValue().
            const parsed = JSON.parse(raw) as Record<string, unknown>
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                console.debug('[MQTT] Payload is not a JSON object, discarding.')
                return null
            }
            return parsed
        } catch (error) {
            console.debug(
                '[MQTT] Failed to parse JSON payload:',
                error instanceof Error ? error.message : 'Unknown error',
            )
            return null
        }
    }

    private emitReading(reading: SensorReading): void {
        this.lastReading = reading

        // Push into Zustand sensor store (high-frequency, bypasses Redux)
        sensorStore.getState().pushReading(reading, 'mqtt')

        for (const callback of this.sensorCallbacks) {
            try {
                callback(reading)
            } catch (e) {
                console.debug('[MQTT] Sensor callback error:', e)
            }
        }
    }

    private setConnectionState(state: MqttConnectionState): void {
        this.connectionState = state

        // Sync connection state to Zustand sensor store
        sensorStore.getState().setConnectionState(state)

        for (const callback of this.stateCallbacks) {
            try {
                callback(state)
            } catch (e) {
                console.debug('[MQTT] State callback error:', e)
            }
        }
    }

    private emitEvent(event: IoTEvent): void {
        for (const callback of this.eventCallbacks) {
            try {
                callback(event)
            } catch (e) {
                console.debug('[MQTT] Event callback error:', e)
            }
        }
    }
}

export const mqttSensorService = new MqttSensorService()

// ---------------------------------------------------------------------------
// Bridge: IoT events -> sensorStore toast queue + telemetry sync
// ---------------------------------------------------------------------------

mqttSensorService.onIoTEvent((event) => {
    sensorStore.getState().pushToastEvent({
        type: event.type,
        message: event.message,
        timestamp: event.timestamp,
    })
})

/** Sync telemetry metrics from MQTT service to sensorStore every 5s while connected. */
let telemetrySyncInterval: ReturnType<typeof setInterval> | null = null
mqttSensorService.onConnectionStateChange((state) => {
    if (state === 'connected' && !telemetrySyncInterval) {
        telemetrySyncInterval = setInterval(() => {
            sensorStore.getState().setTelemetry(mqttSensorService.getTelemetry())
        }, 5000)
    } else if (state !== 'connected' && telemetrySyncInterval) {
        clearInterval(telemetrySyncInterval)
        telemetrySyncInterval = null
        // Final sync
        sensorStore.getState().setTelemetry(mqttSensorService.getTelemetry())
    }
})
