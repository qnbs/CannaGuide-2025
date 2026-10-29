import { describe, expect, it } from 'vitest'
import { redactSettingsSecrets, redactSnapshotSecrets } from '@/utils/redactSecrets'

// A synthetic canary, never a real key (#654).
const CANARY = 'sk_canary_0000000000000000000000000000'

const slice = (cloudTtsApiKey: string | null) => ({
    version: 5,
    settings: { tts: { cloudTtsEnabled: true, cloudTtsApiKey }, data: { keep: 1 } },
})

describe('redactSettingsSecrets', () => {
    it('drops the Cloud TTS key and leaves everything else and the input untouched', () => {
        const input = slice(CANARY)
        const out = redactSettingsSecrets(input)
        expect(out.settings.tts.cloudTtsApiKey).toBeNull()
        expect(out.settings.tts.cloudTtsEnabled).toBe(true)
        expect(out.settings.data).toEqual({ keep: 1 })
        expect(input.settings.tts.cloudTtsApiKey).toBe(CANARY)
        expect(JSON.stringify(out)).not.toContain(CANARY)
    })

    it('returns the same object when there is no key', () => {
        const input = slice(null)
        expect(redactSettingsSecrets(input)).toBe(input)
    })
})

describe('redactSnapshotSecrets', () => {
    it('removes the key from a serialized snapshot', () => {
        const snapshot = JSON.stringify({ version: 5, settings: slice(CANARY), notes: { a: 1 } })
        const out = redactSnapshotSecrets(snapshot)
        expect(out).not.toContain(CANARY)
        expect(JSON.parse(out)).toEqual({ version: 5, settings: slice(null), notes: { a: 1 } })
    })

    it('leaves text without a key, and text that is not a snapshot, unchanged', () => {
        const clean = JSON.stringify({ settings: slice(null) })
        expect(redactSnapshotSecrets(clean)).toBe(clean)
        expect(redactSnapshotSecrets('not json "cloudTtsApiKey"')).toBe('not json "cloudTtsApiKey"')
        expect(redactSnapshotSecrets('{"other":{"cloudTtsApiKey":"x"}}')).toBe(
            '{"other":{"cloudTtsApiKey":"x"}}',
        )
    })
})
