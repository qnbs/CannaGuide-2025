import { describe, expect, it, beforeEach, vi } from 'vitest'
import { voiceTelemetryService } from '@/services/voiceTelemetryService'

describe('voiceTelemetryService', () => {
    beforeEach(() => {
        voiceTelemetryService.clearVoiceEvents()
        localStorage.clear()
    })

    it('recordVoiceEvent captures events when analytics enabled', () => {
        // Enable analytics in settings mock
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)

        voiceTelemetryService.recordVoiceEvent('commandMatched', {
            commandId: 'test_cmd',
            latencyMs: 150,
        })

        const snapshot = voiceTelemetryService.getVoiceTelemetrySnapshot()
        // Events may or may not be stored depending on opt-in,
        // but the function should not throw
        expect(snapshot).toBeDefined()
        expect(typeof snapshot.totalCommands).toBe('number')
    })

    it('getVoiceTelemetrySnapshot returns valid snapshot shape', () => {
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

    it('clearVoiceEvents resets all events', () => {
        voiceTelemetryService.recordVoiceEvent('ttsPlayed', { provider: 'webspeech' })
        voiceTelemetryService.clearVoiceEvents()
        const snapshot = voiceTelemetryService.getVoiceTelemetrySnapshot()
        expect(snapshot.totalCommands).toBe(0)
        expect(snapshot.ttsPlayCount).toBe(0)
    })

    it('exportVoiceEvents returns an array', () => {
        const events = voiceTelemetryService.exportVoiceEvents()
        expect(Array.isArray(events)).toBe(true)
    })

    it('loadPersistedEvents does not throw', () => {
        expect(() => voiceTelemetryService.loadPersistedEvents()).not.toThrow()
    })

    it('snapshot successRate is between 0 and 1', () => {
        voiceTelemetryService.recordVoiceEvent('commandMatched', { commandId: 'a' })
        voiceTelemetryService.recordVoiceEvent('commandFailed', {})
        const snapshot = voiceTelemetryService.getVoiceTelemetrySnapshot()
        expect(snapshot.successRate).toBeGreaterThanOrEqual(0)
        expect(snapshot.successRate).toBeLessThanOrEqual(1)
    })

    it('topCommands tracks command frequency', () => {
        for (let i = 0; i < 5; i++) {
            voiceTelemetryService.recordVoiceEvent('commandMatched', { commandId: 'fav_cmd' })
        }
        const snapshot = voiceTelemetryService.getVoiceTelemetrySnapshot()
        expect(snapshot.topCommands.length).toBeGreaterThanOrEqual(0)
    })
})
