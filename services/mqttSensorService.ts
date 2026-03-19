import mqtt from 'mqtt'
import type { SensorReading } from './webBluetoothSensorService'
import { getT } from '@/i18n'

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
                this.partialTemp = typeof data.value === 'number' ? data.value : null
                break
            case 'humidity':
                this.partialHumidity = typeof data.value === 'number' ? data.value : null
                break
            case 'ph':
                this.partialPh = typeof data.value === 'number' ? data.value : null
                break
            case 'env':
                // Combined payload — emit immediately
                if (typeof data.temperature === 'number' && typeof data.humidity === 'number') {
                    this.emitReading({
                        temperatureC: data.temperature,
                        humidityPercent: data.humidity,
                        ph: typeof data.ph === 'number' ? data.ph : null,
                        receivedAt: Date.now(),
                    })
                }
                return
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
        try {
            return JSON.parse(payload.toString()) as Record<string, unknown>
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
