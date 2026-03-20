import mqtt from 'mqtt'
import type { SensorReading } from './webBluetoothSensorService'
import { getT } from '@/i18n'
import { sensorStore } from '@/stores/sensorStore'

// ---------------------------------------------------------------------------
// MQTT Sensor Service — connects to a local MQTT broker (e.g. Mosquitto)
// via WebSocket and subscribes to ESP32 sensor topics.
//
// Default topic structure:
//   cannaguide/sensors/<deviceId>/temperature  → { value: number }
//   cannaguide/sensors/<deviceId>/humidity     → { value: number }
//   cannaguide/sensors/<deviceId>/ph           → { value: number }
//   cannaguide/sensors/<deviceId>/env          → { temperature, humidity, ph? }
// ---------------------------------------------------------------------------

export interface MqttSensorConfig {
    /** WebSocket URL of the MQTT broker, e.g. "ws://localhost:9001" */
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

const DEFAULT_CONFIG: MqttSensorConfig = {
    brokerUrl: 'ws://localhost:9001',
    topicPrefix: 'cannaguide/sensors',
    deviceId: 'esp32',
}

const RECONNECT_PERIOD_MS = 5000
const CONNECT_TIMEOUT_MS = 10000
/** Maximum allowed MQTT payload size (64 KB) to prevent memory abuse. */
const MAX_PAYLOAD_SIZE = 65_536
/** Sensor value plausibility range. */
const SENSOR_RANGE = { tempMin: -40, tempMax: 80, humMin: 0, humMax: 100, phMin: 0, phMax: 14 }

/** Validate a numeric sensor value falls within a plausible range. */
const clampSensorValue = (value: unknown, min: number, max: number): number | null => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    if (value < min || value > max) return null
    return value
}

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

    // Partial values accumulate until a full reading is assembled
    private partialTemp: number | null = null
    private partialHumidity: number | null = null
    private partialPh: number | null = null

    private connectTimeoutHandle: ReturnType<typeof setTimeout> | null = null

    getConnectionState(): MqttConnectionState {
        return this.connectionState
    }

    getLastReading(): SensorReading | null {
        return this.lastReading
    }

    configure(config: Partial<MqttSensorConfig>): void {
        if (config.brokerUrl !== undefined && !isValidBrokerUrl(config.brokerUrl)) {
            throw new Error('Invalid broker URL — must start with ws:// or wss://')
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

    connect(): void {
        if (this.client) {
            this.disconnect()
        }

        this.setConnectionState('connecting')

        const { brokerUrl, username, password } = this.config

        this.connectTimeoutHandle = setTimeout(() => {
            if (this.connectionState === 'connecting') {
                console.warn('[MQTT] Connection timeout after', CONNECT_TIMEOUT_MS, 'ms')
                this.setConnectionState('error')
                if (this.client) {
                    this.client.end(true)
                    this.client = null
                }
            }
        }, CONNECT_TIMEOUT_MS)

        this.client = mqtt.connect(brokerUrl, {
            username,
            password,
            reconnectPeriod: RECONNECT_PERIOD_MS,
            connectTimeout: CONNECT_TIMEOUT_MS,
            protocolVersion: 5,
            clean: true,
            clientId: `cannaguide_${Date.now().toString(36)}`,
        })

        this.client.on('connect', () => {
            if (this.connectTimeoutHandle) {
                clearTimeout(this.connectTimeoutHandle)
                this.connectTimeoutHandle = null
            }
            this.setConnectionState('connected')
            this.subscribeToTopics()
        })

        this.client.on('message', (_topic: string, payload: Buffer) => {
            this.handleMessage(_topic, payload)
        })

        this.client.on('error', (error: Error) => {
            if (this.connectTimeoutHandle) {
                clearTimeout(this.connectTimeoutHandle)
                this.connectTimeoutHandle = null
            }
            console.warn('[MQTT] Connection error:', error.message)
            this.setConnectionState('error')
        })

        this.client.on('close', () => {
            if (this.connectionState !== 'error') {
                this.setConnectionState('disconnected')
            }
        })

        this.client.on('reconnect', () => {
            this.setConnectionState('connecting')
        })
    }

    disconnect(): void {
        if (this.connectTimeoutHandle) {
            clearTimeout(this.connectTimeoutHandle)
            this.connectTimeoutHandle = null
        }
        if (this.client) {
            this.client.end(true)
            this.client = null
        }
        this.setConnectionState('disconnected')
        this.partialTemp = null
        this.partialHumidity = null
        this.partialPh = null
    }

    /** Fully dispose the service — clears all callbacks and disconnects. */
    dispose(): void {
        this.disconnect()
        this.sensorCallbacks.clear()
        this.stateCallbacks.clear()
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
            throw new Error(
                `Failed to serialize payload: ${error instanceof Error ? error.message : 'Unknown error'}`,
            )
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
                console.warn('[MQTT] Subscribe error:', error.message)
            }
        })
    }

    private handleMessage(topic: string, payload: Buffer): void {
        const data = this.parsePayload(payload)
        if (!data) return

        const suffix = topic.split('/').pop()

        switch (suffix) {
            case 'temperature':
                this.partialTemp = clampSensorValue(
                    data.value,
                    SENSOR_RANGE.tempMin,
                    SENSOR_RANGE.tempMax,
                )
                break
            case 'humidity':
                this.partialHumidity = clampSensorValue(
                    data.value,
                    SENSOR_RANGE.humMin,
                    SENSOR_RANGE.humMax,
                )
                break
            case 'ph':
                this.partialPh = clampSensorValue(
                    data.value,
                    SENSOR_RANGE.phMin,
                    SENSOR_RANGE.phMax,
                )
                break
            case 'env': {
                // Combined payload — validate & emit immediately
                const temp = clampSensorValue(
                    data.temperature,
                    SENSOR_RANGE.tempMin,
                    SENSOR_RANGE.tempMax,
                )
                const hum = clampSensorValue(
                    data.humidity,
                    SENSOR_RANGE.humMin,
                    SENSOR_RANGE.humMax,
                )
                if (temp !== null && hum !== null) {
                    this.emitReading({
                        temperatureC: temp,
                        humidityPercent: hum,
                        ph: clampSensorValue(data.ph, SENSOR_RANGE.phMin, SENSOR_RANGE.phMax),
                        receivedAt: Date.now(),
                    })
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

    private parsePayload(payload: Buffer): Record<string, unknown> | null {
        if (payload.length > MAX_PAYLOAD_SIZE) {
            console.warn('[MQTT] Payload exceeds maximum allowed size, discarding.')
            return null
        }
        try {
            const raw = payload.toString('utf-8')
            // Parse JSON directly — DOMPurify is not appropriate for JSON data
            // as it can corrupt valid payloads. Sensor values are validated
            // downstream via clampSensorValue().
            const parsed = JSON.parse(raw) as Record<string, unknown>
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                console.warn('[MQTT] Payload is not a JSON object, discarding.')
                return null
            }
            return parsed
        } catch (error) {
            console.warn(
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
                console.warn('[MQTT] Sensor callback error:', e)
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
                console.warn('[MQTT] State callback error:', e)
            }
        }
    }
}

export const mqttSensorService = new MqttSensorService()
