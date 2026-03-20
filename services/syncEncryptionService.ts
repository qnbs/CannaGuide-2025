// ---------------------------------------------------------------------------
// End-to-End Encryption for Gist Cloud Sync (AES-256-GCM, Web Crypto API)
// ---------------------------------------------------------------------------
// Generates a per-user encryption key that stays on the device.
// The key is stored as Base64 in the Redux settings and can be exported
// as a QR code or copied manually for cross-device restore.
// ---------------------------------------------------------------------------

const ALGO = 'AES-GCM'
const KEY_LENGTH = 256
const IV_BYTES = 12

const bytesToBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes))

const base64ToBytes = (value: string): Uint8Array => {
    const binary = atob(value)
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

/**
 * Generates a new AES-256-GCM key and returns it as a Base64 string
 * suitable for persisting in Redux / localStorage.
 */
export async function generateSyncEncryptionKey(): Promise<string> {
    const key = await crypto.subtle.generateKey({ name: ALGO, length: KEY_LENGTH }, true, [
        'encrypt',
        'decrypt',
    ])
    const raw = await crypto.subtle.exportKey('raw', key)
    return bytesToBase64(new Uint8Array(raw))
}

async function importKey(base64Key: string): Promise<CryptoKey> {
    const raw = base64ToBytes(base64Key)
    return crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, { name: ALGO }, false, [
        'encrypt',
        'decrypt',
    ])
}

/**
 * Encrypts a plaintext string with the given Base64-encoded AES-256-GCM key.
 * Returns a JSON envelope: `{ v: 2, iv, data }` (Base64-encoded).
 */
export async function encryptSyncPayload(plaintext: string, base64Key: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
    const key = await importKey(base64Key)
    const encoded = new TextEncoder().encode(plaintext)
    const encrypted = await crypto.subtle.encrypt({ name: ALGO, iv }, key, encoded)
    return JSON.stringify({
        v: 2,
        iv: bytesToBase64(iv),
        data: bytesToBase64(new Uint8Array(encrypted)),
    })
}

/**
 * Decrypts a payload encrypted by `encryptSyncPayload`.
 * Throws if the key is wrong or the payload is tampered with.
 */
export async function decryptSyncPayload(payload: string, base64Key: string): Promise<string> {
    const parsed = JSON.parse(payload) as { v: number; iv: string; data: string }
    if (parsed.v !== 2 || !parsed.iv || !parsed.data) {
        throw new Error('Invalid encrypted sync payload')
    }
    const key = await importKey(base64Key)
    const iv = base64ToBytes(parsed.iv)
    const encrypted = base64ToBytes(parsed.data)
    const decrypted = await crypto.subtle.decrypt(
        { name: ALGO, iv: iv.buffer as ArrayBuffer },
        key,
        encrypted.buffer as ArrayBuffer,
    )
    return new TextDecoder().decode(decrypted)
}

/**
 * Checks if a payload looks like an E2EE-encrypted envelope (v: 2).
 */
export function isEncryptedSyncPayload(content: string): boolean {
    try {
        const parsed = JSON.parse(content) as { v?: number }
        return parsed.v === 2
    } catch {
        return false
    }
}
