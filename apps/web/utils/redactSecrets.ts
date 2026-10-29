/**
 * Removes credentials from settings before they leave memory: the persisted
 * Redux snapshot, the JSON export, the ZIP backup and the GDPR export (#654,
 * #709). Only these settings fields are secrets; BYOK AI keys never enter Redux.
 */
export type SecretSettingPath = 'tts.cloudTtsApiKey' | 'voiceControl.porcupineAccessKey'

const SECRET_FIELDS = [
    ['tts', 'cloudTtsApiKey', 'tts.cloudTtsApiKey'],
    ['voiceControl', 'porcupineAccessKey', 'voiceControl.porcupineAccessKey'],
] as const satisfies readonly (readonly [string, string, SecretSettingPath])[]

interface SettingsSliceShape {
    settings: {
        tts: { cloudTtsApiKey: string | null }
        voiceControl?: { porcupineAccessKey: string | null }
    }
}

/**
 * A copy of the settings slice without the credentials; the input is
 * untouched. `keep` names fields whose legacy value must survive for now
 * (a migration still pending, so dropping it would lose the credential).
 */
export function redactSettingsSecrets<S extends SettingsSliceShape>(
    slice: S,
    keep: readonly SecretSettingPath[] = [],
): S {
    const { tts, voiceControl } = slice.settings
    const dropTts = tts.cloudTtsApiKey !== null && !keep.includes('tts.cloudTtsApiKey')
    const dropPorcupine =
        voiceControl !== undefined &&
        voiceControl.porcupineAccessKey !== null &&
        !keep.includes('voiceControl.porcupineAccessKey')
    if (!dropTts && !dropPorcupine) return slice
    return {
        ...slice,
        settings: {
            ...slice.settings,
            ...(dropTts ? { tts: { ...tts, cloudTtsApiKey: null } } : {}),
            ...(dropPorcupine
                ? { voiceControl: { ...voiceControl, porcupineAccessKey: null } }
                : {}),
        },
    }
}

type JsonRecord = Record<string, unknown>

const isRecord = (value: unknown): value is JsonRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

/** A copy of a parsed `{ settings: <slice> }` snapshot without the keys, or null. */
function redactParsedSnapshot(
    snapshot: unknown,
    keep: readonly SecretSettingPath[],
): JsonRecord | null {
    if (!isRecord(snapshot)) return null
    const slice = snapshot['settings']
    if (!isRecord(slice)) return null
    const settings = slice['settings']
    if (!isRecord(settings)) return null
    const redacted: JsonRecord = { ...settings }
    let changed = false
    for (const [group, field, path] of SECRET_FIELDS) {
        if (keep.includes(path)) continue
        const section = settings[group]
        if (isRecord(section) && section[field] != null) {
            redacted[group] = { ...section, [field]: null }
            changed = true
        }
    }
    return changed ? { ...snapshot, settings: { ...slice, settings: redacted } } : null
}

/**
 * The same for a serialized snapshot, with the same `keep` list. Text that is
 * not such a snapshot, or has no key in it, is returned unchanged.
 */
export function redactSnapshotSecrets(
    serialized: string,
    keep: readonly SecretSettingPath[] = [],
): string {
    if (!SECRET_FIELDS.some(([, field]) => serialized.includes(`"${field}"`))) return serialized
    let parsed: unknown
    try {
        parsed = JSON.parse(serialized)
    } catch {
        return serialized
    }
    const redacted = redactParsedSnapshot(parsed, keep)
    return redacted ? JSON.stringify(redacted) : serialized
}
