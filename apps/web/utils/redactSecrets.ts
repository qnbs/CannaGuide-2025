/**
 * Removes credentials from settings before they leave memory: the persisted
 * Redux snapshot, the JSON export, the ZIP backup and the GDPR export (#654).
 * Only `settings.tts.cloudTtsApiKey` is a secret in the settings slice; BYOK AI
 * keys never enter Redux.
 */

interface SettingsSliceShape {
    settings: { tts: { cloudTtsApiKey: string | null } }
}

/** A copy of the settings slice without the Cloud TTS key; the input is untouched. */
export function redactSettingsSecrets<S extends SettingsSliceShape>(slice: S): S {
    if (slice.settings.tts.cloudTtsApiKey === null) return slice
    return {
        ...slice,
        settings: { ...slice.settings, tts: { ...slice.settings.tts, cloudTtsApiKey: null } },
    }
}

type JsonRecord = Record<string, unknown>

const isRecord = (value: unknown): value is JsonRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

/** A copy of a parsed `{ settings: <slice> }` snapshot without the key, or null. */
function redactParsedSnapshot(snapshot: unknown): JsonRecord | null {
    if (!isRecord(snapshot)) return null
    const slice = snapshot['settings']
    if (!isRecord(slice)) return null
    const settings = slice['settings']
    if (!isRecord(settings)) return null
    const tts = settings['tts']
    if (!isRecord(tts) || tts['cloudTtsApiKey'] == null) return null
    return {
        ...snapshot,
        settings: { ...slice, settings: { ...settings, tts: { ...tts, cloudTtsApiKey: null } } },
    }
}

/**
 * The same for a serialized snapshot. Text that is not such a snapshot, or has
 * no key in it, is returned unchanged.
 */
export function redactSnapshotSecrets(serialized: string): string {
    if (!serialized.includes('"cloudTtsApiKey"')) return serialized
    let parsed: unknown
    try {
        parsed = JSON.parse(serialized)
    } catch {
        return serialized
    }
    const redacted = redactParsedSnapshot(parsed)
    return redacted ? JSON.stringify(redacted) : serialized
}
