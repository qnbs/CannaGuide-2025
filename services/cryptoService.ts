// ---------------------------------------------------------------------------
// Consolidated AES-256-GCM Encryption Service (Web Crypto API)
// ---------------------------------------------------------------------------
// Single source of truth for all API key encryption/decryption.
// Uses a single AES-256-GCM key stored in localStorage.
// ---------------------------------------------------------------------------

const CRYPTO_KEY_STORAGE = 'cg.crypto.key.v1'

const bytesToBase64 = (bytes: Uint8Array): string =>
    btoa(String.fromCharCode(...bytes))

const base64ToBytes = (value: string): Uint8Array => {
    const binary = atob(value)
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
    const storedRaw = localStorage.getItem(CRYPTO_KEY_STORAGE)
    if (storedRaw) {
        const raw = base64ToBytes(storedRaw)
        return crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
    }
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
    const exported = await crypto.subtle.exportKey('raw', key)
    localStorage.setItem(CRYPTO_KEY_STORAGE, bytesToBase64(new Uint8Array(exported)))
    return key
}

export async function encrypt(plaintext: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await getOrCreateEncryptionKey()
    const encoded = new TextEncoder().encode(plaintext)
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
    return JSON.stringify({ v: 1, iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(encrypted)) })
}

export async function decrypt(payload: string): Promise<string> {
    const parsed = JSON.parse(payload) as { v: number; iv: string; data: string }
    if (!parsed || parsed.v !== 1 || !parsed.iv || !parsed.data) return payload
    const key = await getOrCreateEncryptionKey()
    const iv = base64ToBytes(parsed.iv)
    const encrypted = base64ToBytes(parsed.data)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, encrypted.buffer as ArrayBuffer)
    return new TextDecoder().decode(decrypted)
}

/** Check if a string looks like an encrypted payload (starts with `{`) */
export function isEncryptedPayload(value: string): boolean {
    return value.trim().startsWith('{')
}
