import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { voiceTelemetryService } from '@/services/voiceTelemetryService'

describe('voiceTelemetryService', () => {
    beforeEach(() => {
        voiceTelemetryService.clearVoiceEvents()
        voiceTelemetryService.setVoiceAnalyticsEnabled(false)
    })

    afterEach(() => {
        voiceTelemetryService.setVoiceAnalyticsEnabled(false)
    })

    describe('setVoiceAnalyticsEnabled / isVoiceAnalyticsEnabled', () => {
        it('defaults to disabled', () => {
            expect(voiceTelemetryService.isVoiceAnalyticsEnabled()).toBe(false)
        })

        it('can be enabled and disabled', () => {
            voiceTelemetryService.setVoiceAnalyticsEnabled(true)
            expect(voiceTelemetryService.isVoiceAnalyticsEnabled()).toBe(true)
            voiceTelemetryService.setVoiceAnalyticsEnabled(false)
            expect(voiceTelemetryService.isVoiceAnalyticsEnabled()).toBe(false)
        })
    })

    describe('recordVoiceEvent', () => {
        it('does not record when analytics is disabled', () => {
            voiceTelemetryService.recordVoiceEvent('commandMatched', { commandId: 'test' })
            expect(voiceTelemetryService.exportVoiceEvents()).toHaveLength(0)
        })

        it('records events when analytics is enabled', () => {
            voiceTelemetryService.setVoiceAnalyticsEnabled(true)
            voiceTelemetryService.recordVoiceEvent('commandMatched', {
                commandId: 'test_cmd',
                latencyMs: 150,
            })
            const events = voiceTelemetryService.exportVoiceEvents()
            expect(events).toHaveLength(1)
            expect(events[0]?.eventType).toBe('commandMatched')
            expect(events[0]?.metadata.commandId).toBe('test_cmd')
        })

        it('records multiple event types', () => {
            voiceTelemetryService.setVoiceAnalyticsEnabled(true)
            voiceTelemetryService.recordVoiceEvent('commandMatched', { commandId: 'a' })
            voiceTelemetryService.recordVoiceEvent('commandFailed', {})
            voiceTelemetryService.recordVoiceEvent('ttsPlayed', {})
            voiceTelemetryService.recordVoiceEvent('hotwordDetected', {})
            voiceTelemetryService.recordVoiceEvent('errorOccurred', {})
            expect(voiceTelemetryService.exportVoiceEvents()).toHaveLength(5)
        })
    })

    describe('getVoiceTelemetrySnapshot', () => {
        it('returns valid snapshot shape', () => {
            const snapshot = voiceTelemetryService.getVoiceTelemetrySnapshot()
            expect(snapshot).toHaveProperty('totalCommands')
            expect(snapshot).toHaveProperty('successRate')
            expect(snapshot).toHaveProperty('avgMatchLatencyMs')
            expect(snapshot).toHaveProperty('ttsPlayCount')
            expect(snapshot).toHaveProperty('hotwordDetections')
            expect(snapshot).toHaveProperty('errorCount')
            expect(snapshot).toHaveProperty('topCommands')
            expect(snapshot).toHaveProperty('lastUpdated')
        })

        it('returns zeros when no events', () => {
            const snapshot = voiceTelemetryService.getVoiceTelemetrySnapshot()
            expect(snapshot.totalCommands).toBe(0)
            expect(snapshot.successRate).toBe(0)
            expect(snapshot.avgMatchLatencyMs).toBe(0)
        })

        it('computes correct success rate', () => {
            voiceTelemetryService.setVoiceAnalyticsEnabled(true)
            voiceTelemetryService.recordVoiceEvent('commandMatched', { commandId: 'a' })
            voiceTelemetryService.recordVoiceEvent('commandMatched', { commandId: 'b' })
            voiceTelemetryService.recordVoiceEvent('commandFailed', {})
            const snapshot = voiceTelemetryService.getVoiceTelemetrySnapshot()
            expect(snapshot.totalCommands).toBe(3)
            expect(snapshot.successRate).toBeCloseTo(2 / 3)
        })

        it('computes average match latency', () => {
            voiceTelemetryService.setVoiceAnalyticsEnabled(true)
            voiceTelemetryService.recordVoiceEvent('commandMatched', {
                commandId: 'a',
                latencyMs: 100,
            })
            voiceTelemetryService.recordVoiceEvent('commandMatched', {
                commandId: 'b',
                latencyMs: 200,
            })
            const snapshot = voiceTelemetryService.getVoiceTelemetrySnapshot()
            expect(snapshot.avgMatchLatencyMs).toBe(150)
        })

        it('tracks top commands sorted by frequency', () => {
            voiceTelemetryService.setVoiceAnalyticsEnabled(true)
            for (let i = 0; i < 5; i++) {
                voiceTelemetryService.recordVoiceEvent('commandMatched', {
                    commandId: 'navigate',
                })
            }
            voiceTelemetryService.recordVoiceEvent('commandMatched', { commandId: 'add-plant' })
            const snapshot = voiceTelemetryService.getVoiceTelemetrySnapshot()
            expect(snapshot.topCommands).toHaveLength(2)
            expect(snapshot.topCommands[0]?.id).toBe('navigate')
            expect(snapshot.topCommands[0]?.count).toBe(5)
        })

        it('counts TTS plays and hotword detections', () => {
            voiceTelemetryService.setVoiceAnalyticsEnabled(true)
            voiceTelemetryService.recordVoiceEvent('ttsPlayed', {})
            voiceTelemetryService.recordVoiceEvent('ttsPlayed', {})
            voiceTelemetryService.recordVoiceEvent('hotwordDetected', {})
            const snapshot = voiceTelemetryService.getVoiceTelemetrySnapshot()
            expect(snapshot.ttsPlayCount).toBe(2)
            expect(snapshot.hotwordDetections).toBe(1)
        })

        it('counts errors from both commandFailed and errorOccurred', () => {
            voiceTelemetryService.setVoiceAnalyticsEnabled(true)
            voiceTelemetryService.recordVoiceEvent('commandFailed', {})
            voiceTelemetryService.recordVoiceEvent('errorOccurred', {})
            const snapshot = voiceTelemetryService.getVoiceTelemetrySnapshot()
            expect(snapshot.errorCount).toBe(2)
        })
    })

    describe('clearVoiceEvents', () => {
        it('clears all events', () => {
            voiceTelemetryService.setVoiceAnalyticsEnabled(true)
            voiceTelemetryService.recordVoiceEvent('ttsPlayed', { provider: 'webspeech' })
            expect(voiceTelemetryService.exportVoiceEvents()).toHaveLength(1)
            voiceTelemetryService.clearVoiceEvents()
            expect(voiceTelemetryService.exportVoiceEvents()).toHaveLength(0)
        })
    })

    describe('exportVoiceEvents', () => {
        it('returns a copy of events', () => {
            voiceTelemetryService.setVoiceAnalyticsEnabled(true)
            voiceTelemetryService.recordVoiceEvent('commandMatched', { commandId: 'test' })
            const a = voiceTelemetryService.exportVoiceEvents()
            const b = voiceTelemetryService.exportVoiceEvents()
            expect(a).toEqual(b)
            expect(a).not.toBe(b)
        })
    })

    describe('loadPersistedEvents', () => {
        it('does not throw on empty localStorage', () => {
            expect(() => voiceTelemetryService.loadPersistedEvents()).not.toThrow()
        })

        it('loads valid events from localStorage', () => {
            const events = [
                {
                    eventType: 'commandMatched',
                    timestamp: Date.now(),
                    metadata: { commandId: 'test' },
                },
            ]
            localStorage.setItem('cg.voice.telemetry', JSON.stringify(events))
            voiceTelemetryService.loadPersistedEvents()
            expect(voiceTelemetryService.exportVoiceEvents()).toHaveLength(1)
        })

        it('prunes stale events beyond retention window', () => {
            const oldTs = Date.now() - 400 * 24 * 60 * 60 * 1000
            const events = [
                { eventType: 'commandMatched', timestamp: oldTs, metadata: {} },
                { eventType: 'commandFailed', timestamp: Date.now(), metadata: {} },
            ]
            localStorage.setItem('cg.voice.telemetry', JSON.stringify(events))
            voiceTelemetryService.loadPersistedEvents()
            expect(voiceTelemetryService.exportVoiceEvents()).toHaveLength(1)
        })

        it('handles corrupt JSON gracefully', () => {
            localStorage.setItem('cg.voice.telemetry', 'not-json')
            expect(() => voiceTelemetryService.loadPersistedEvents()).not.toThrow()
            expect(voiceTelemetryService.exportVoiceEvents()).toHaveLength(0)
        })

        it('discards entries with invalid shape', () => {
            localStorage.setItem('cg.voice.telemetry', JSON.stringify([{ bad: true }]))
            voiceTelemetryService.loadPersistedEvents()
            expect(voiceTelemetryService.exportVoiceEvents()).toHaveLength(0)
        })
    })
})
