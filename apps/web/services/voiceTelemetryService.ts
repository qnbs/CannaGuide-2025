// ---------------------------------------------------------------------------
// Voice Telemetry Service -- Opt-in Anonymous Analytics (v1.8 CannaVoice Pro)
// ---------------------------------------------------------------------------
// Privacy-first voice analytics: no PII, no transcript content, opt-in only.
// In-memory ring buffer with optional IndexedDB persistence.
// Pattern mirrors localAiTelemetryService.ts.
// ---------------------------------------------------------------------------

import type { VoiceAnalyticsEvent, VoiceAnalyticsEventType, VoiceTelemetrySnapshot } from '@/types'
import { VOICE_ANALYTICS_MAX_EVENTS, VOICE_ANALYTICS_RETENTION_DAYS } from '@/constants'

const STORAGE_KEY = 'cg.voice.telemetry'

/** In-memory event ring buffer. */
let events: VoiceAnalyticsEvent[] = []

/** Opt-in guard -- only record events when user has enabled analytics. */
let analyticsEnabled = false

/** Set whether analytics recording is enabled (synced from settings). */
export function setVoiceAnalyticsEnabled(enabled: boolean): void {
    analyticsEnabled = enabled
}

/** Check if analytics is currently enabled. */
export function isVoiceAnalyticsEnabled(): boolean {
    return analyticsEnabled
}

/**
 * Record a voice analytics event.
 * No-op if analytics is disabled. No PII or transcript content stored.
 */
export function recordVoiceEvent(
    eventType: VoiceAnalyticsEventType,
    metadata: Record<string, string | number | boolean> = {},
): void {
    if (!analyticsEnabled) return

    const event: VoiceAnalyticsEvent = {
        eventType,
        timestamp: Date.now(),
        metadata,
    }

    events.push(event)

    // FIFO: cap at max events
    if (events.length > VOICE_ANALYTICS_MAX_EVENTS) {
        events = events.slice(events.length - VOICE_ANALYTICS_MAX_EVENTS)
    }

    // Debounced persist
    debouncedPersist()
}

/** Get aggregated telemetry snapshot. */
export function getVoiceTelemetrySnapshot(): VoiceTelemetrySnapshot {
    const commandEvents = events.filter(
        (e) => e.eventType === 'commandMatched' || e.eventType === 'commandFailed',
    )
    const matched = events.filter((e) => e.eventType === 'commandMatched')
    const failed = events.filter((e) => e.eventType === 'commandFailed')
    const ttsEvents = events.filter((e) => e.eventType === 'ttsPlayed')
    const hotwordEvents = events.filter((e) => e.eventType === 'hotwordDetected')
    const errorEvents = events.filter((e) => e.eventType === 'errorOccurred')

    // Compute average match latency
    let totalLatency = 0
    let latencyCount = 0
    for (const e of matched) {
        const lat = e.metadata.latencyMs
        if (typeof lat === 'number') {
            totalLatency += lat
            latencyCount++
        }
    }

    // Compute top commands
    const commandCounts = new Map<string, number>()
    for (const e of matched) {
        const cmdId = e.metadata.commandId
        if (typeof cmdId === 'string') {
            commandCounts.set(cmdId, (commandCounts.get(cmdId) ?? 0) + 1)
        }
    }
    const topCommands = Array.from(commandCounts.entries())
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

    return {
        totalCommands: commandEvents.length,
        successRate: commandEvents.length > 0 ? matched.length / commandEvents.length : 0,
        avgMatchLatencyMs: latencyCount > 0 ? totalLatency / latencyCount : 0,
        ttsPlayCount: ttsEvents.length,
        hotwordDetections: hotwordEvents.length,
        errorCount: failed.length + errorEvents.length,
        topCommands,
        lastUpdated: Date.now(),
    }
}

/** Export all recorded events (for user download). */
export function exportVoiceEvents(): VoiceAnalyticsEvent[] {
    return [...events]
}

/** Clear all recorded events. */
export function clearVoiceEvents(): void {
    events = []
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch {
        // Ignore storage errors
    }
}

/** Load persisted events from localStorage. */
export function loadPersistedEvents(): void {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return

        const parsed: unknown = JSON.parse(raw)
        if (!Array.isArray(parsed)) return

        // Prune stale events -- validate shape before filtering
        const cutoff = Date.now() - VOICE_ANALYTICS_RETENTION_DAYS * 24 * 60 * 60 * 1000
        const validated: VoiceAnalyticsEvent[] = []
        for (const item of parsed) {
            if (
                typeof item === 'object' &&
                item !== null &&
                'eventType' in item &&
                'timestamp' in item &&
                'metadata' in item
            ) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- runtime-validated via in-checks above
                const ts = (item as { timestamp: unknown }).timestamp
                if (typeof ts === 'number' && ts > cutoff) {
                    // Shape validated: eventType + timestamp + metadata present
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- runtime-validated shape
                    validated.push(item as VoiceAnalyticsEvent)
                }
            }
        }
        events = validated
    } catch {
        events = []
    }
}

/** Persist events to localStorage (debounced). */
let persistTimer: ReturnType<typeof setTimeout> | null = null

function debouncedPersist(): void {
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
        } catch {
            // Storage full or unavailable -- silently degrade
        }
    }, 2000)
}

// ---------------------------------------------------------------------------
// Public API (module singleton)
// ---------------------------------------------------------------------------

export const voiceTelemetryService = {
    setVoiceAnalyticsEnabled,
    isVoiceAnalyticsEnabled,
    recordVoiceEvent,
    getVoiceTelemetrySnapshot,
    exportVoiceEvents,
    clearVoiceEvents,
    loadPersistedEvents,
}
