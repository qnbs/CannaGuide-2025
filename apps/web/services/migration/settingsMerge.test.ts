import { describe, expect, it } from 'vitest'
import type { AppSettings } from '@/types'
import { deepMergeSettings } from '@/services/migration/settingsMerge'
import { defaultSettings } from '@/stores/slices/settingsSlice'

describe('deepMergeSettings', () => {
    it('merges nested general.language from persisted partial settings', () => {
        const merged = deepMergeSettings({
            general: { language: 'de' },
        } as Partial<AppSettings>)
        expect(merged.general.language).toBe('de')
        expect(merged.aiMode).toBe(defaultSettings.aiMode)
    })

    it('ignores unsafe merge keys', () => {
        const hostile = { general: { language: 'en' } } as Record<string, unknown>
        hostile.__proto__ = { polluted: true }
        const merged = deepMergeSettings(hostile as Parameters<typeof deepMergeSettings>[0])
        expect(merged.general.language).toBe('en')
        expect(Object.prototype.hasOwnProperty.call(merged, 'polluted')).toBe(false)
    })

    it('strips simulation.speedMultiplier from persisted state', () => {
        const merged = deepMergeSettings({
            simulation: { speedMultiplier: 99 },
        } as unknown as Partial<AppSettings>)
        expect(merged.simulation).toBeDefined()
        expect(
            Object.prototype.hasOwnProperty.call(merged.simulation, 'speedMultiplier'),
        ).toBe(false)
    })
})
