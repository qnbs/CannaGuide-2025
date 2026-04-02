// ---------------------------------------------------------------------------
// Zod Schemas for IoT Sensor Payloads
//
// Centralised validation for all incoming MQTT/BLE/HTTP sensor data.
// Replaces inline validation in mqttClientService + mqttSensorService.
// ---------------------------------------------------------------------------

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Primitive validators
// ---------------------------------------------------------------------------

/** Finite number within a plausible sensor range. */
const finiteInRange = (min: number, max: number) =>
    z
        .number()
        .finite()
        .refine((v) => v >= min && v <= max, { message: `Value must be between ${min} and ${max}` })

// ---------------------------------------------------------------------------
// Sensor value schemas
// ---------------------------------------------------------------------------

export const temperatureSchema = finiteInRange(-40, 80)
export const humiditySchema = finiteInRange(0, 100)
export const phSchema = finiteInRange(0, 14)
export const ecSchema = finiteInRange(0, 20)
export const lightPpfdSchema = finiteInRange(0, 3000)
export const waterVolumeMlSchema = finiteInRange(0, 100_000)

// ---------------------------------------------------------------------------
// MQTT Client Service payload (Redux journal entries)
// ---------------------------------------------------------------------------

/** Payload from mqttClientService -- dispatched to Redux addJournalEntry. */
export const mqttJournalPayloadSchema = z
    .object({
        temperature: temperatureSchema.optional(),
        humidity: humiditySchema.optional(),
        ec: ecSchema.optional(),
        ph: phSchema.optional(),
        lightPpfd: lightPpfdSchema.optional(),
        waterVolumeMl: waterVolumeMlSchema.optional(),
        plantId: z.string().min(1).max(128).optional(),
        timestamp: z.number().finite().optional(),
    })
    .refine(
        (data) =>
            data.temperature !== undefined ||
            data.humidity !== undefined ||
            data.ec !== undefined ||
            data.ph !== undefined ||
            data.lightPpfd !== undefined ||
            data.waterVolumeMl !== undefined,
        { message: 'At least one sensor value must be present' },
    )

export type MqttJournalPayload = z.infer<typeof mqttJournalPayloadSchema>

// ---------------------------------------------------------------------------
// MQTT Sensor Service payloads (Zustand high-frequency)
// ---------------------------------------------------------------------------

/** Single-value topic payload (temperature, humidity, ph). */
export const singleValuePayloadSchema = z.object({
    value: z.number().finite(),
})

/** Combined /env topic payload. */
export const envPayloadSchema = z.object({
    temperature: z.number().finite(),
    humidity: z.number().finite(),
    ph: z.number().finite().optional(),
})

export type SingleValuePayload = z.infer<typeof singleValuePayloadSchema>
export type EnvPayload = z.infer<typeof envPayloadSchema>

// ---------------------------------------------------------------------------
// Telemetry metrics
// ---------------------------------------------------------------------------

export interface MqttTelemetryMetrics {
    /** Total messages received since connection. */
    messagesReceived: number
    /** Messages that failed Zod validation. */
    validationErrors: number
    /** Average message latency in ms (device timestamp to receivedAt). */
    avgLatencyMs: number
    /** Connection uptime in ms. */
    uptimeMs: number
    /** Total reconnect attempts. */
    reconnectAttempts: number
    /** Last successful message timestamp. */
    lastMessageAt: number | null
}

export const INITIAL_TELEMETRY: MqttTelemetryMetrics = {
    messagesReceived: 0,
    validationErrors: 0,
    avgLatencyMs: 0,
    uptimeMs: 0,
    reconnectAttempts: 0,
    lastMessageAt: null,
}
