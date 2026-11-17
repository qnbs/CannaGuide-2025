/**
 * Minimal minisign verification for Tauri updater signatures.
 *
 * Tauri signs every updater bundle with minisign and stores, base64-encoded, the text
 * of the `.sig` file. The `pubkey` in tauri.conf.json is the base64-encoded text of the
 * minisign public key file. The updater plugin rejects a bundle whose signature does
 * not verify, so a release must never ship one: this checks it before publication.
 *
 * Format (https://jedisct1.github.io/minisign/):
 *   public key line: base64("Ed" | key id (8) | Ed25519 public key (32))
 *   signature line:  base64(alg (2) | key id (8) | Ed25519 signature (64))
 *     alg "ED": the signed message is BLAKE2b-512(file) (Tauri uses this)
 *     alg "Ed": the signed message is the file itself (legacy)
 *   trusted comment line: "trusted comment: <text>"
 *   global signature line: base64(Ed25519 signature over signature (64) | <text>)
 */
import { createHash, createPublicKey, verify } from 'node:crypto'

const SPKI_ED25519_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

const decodeBase64Text = (value, what) => {
    const text = Buffer.from(String(value).trim(), 'base64').toString('utf8')
    if (!text.includes('\n')) throw new Error(`${what} is not a base64-encoded minisign file`)
    return text
}

const linesOf = (text) =>
    text
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter((line) => line !== '')

/** Parses the base64 `pubkey` value from tauri.conf.json. */
export const parsePublicKey = (pubkeyBase64) => {
    const lines = linesOf(decodeBase64Text(pubkeyBase64, 'Public key'))
    const keyLine = lines.find((line) => !line.startsWith('untrusted comment:'))
    const raw = Buffer.from(keyLine ?? '', 'base64')
    if (raw.length !== 42 || raw.subarray(0, 2).toString('latin1') !== 'Ed') {
        throw new Error('Public key is not a minisign Ed25519 key')
    }
    return {
        keyId: raw.subarray(2, 10),
        key: createPublicKey({
            key: Buffer.concat([SPKI_ED25519_PREFIX, raw.subarray(10)]),
            format: 'der',
            type: 'spki',
        }),
    }
}

/** Parses the base64 content of a Tauri `.sig` file. */
export const parseSignature = (signatureBase64) => {
    const lines = linesOf(decodeBase64Text(signatureBase64, 'Signature'))
    const body = lines.filter((line) => !line.startsWith('untrusted comment:'))
    if (body.length !== 3 || !body[1].startsWith('trusted comment: ')) {
        throw new Error('Signature does not have the minisign layout')
    }
    const raw = Buffer.from(body[0], 'base64')
    const algorithm = raw.subarray(0, 2).toString('latin1')
    if (raw.length !== 74 || (algorithm !== 'ED' && algorithm !== 'Ed')) {
        throw new Error('Signature is not a minisign Ed25519 signature')
    }
    const globalSignature = Buffer.from(body[2], 'base64')
    if (globalSignature.length !== 64) throw new Error('Global signature has the wrong length')
    return {
        algorithm,
        keyId: raw.subarray(2, 10),
        signature: raw.subarray(10),
        trustedComment: body[1].slice('trusted comment: '.length),
        globalSignature,
    }
}

/**
 * Verifies `fileBytes` against a Tauri `.sig` content and the tauri.conf.json pubkey.
 * Returns { ok: true } or { ok: false, reason }. Never throws.
 */
export const verifyMinisign = (fileBytes, signatureBase64, pubkeyBase64) => {
    try {
        const publicKey = parsePublicKey(pubkeyBase64)
        const parsed = parseSignature(signatureBase64)
        if (!parsed.keyId.equals(publicKey.keyId)) {
            return { ok: false, reason: 'signed with a different key id' }
        }
        const message =
            parsed.algorithm === 'ED'
                ? createHash('blake2b512').update(fileBytes).digest()
                : Buffer.from(fileBytes)
        if (!verify(null, message, publicKey.key, parsed.signature)) {
            return { ok: false, reason: 'signature does not match the file' }
        }
        const globalMessage = Buffer.concat([
            parsed.signature,
            Buffer.from(parsed.trustedComment, 'utf8'),
        ])
        if (!verify(null, globalMessage, publicKey.key, parsed.globalSignature)) {
            return { ok: false, reason: 'trusted comment signature does not match' }
        }
        return { ok: true }
    } catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : String(error) }
    }
}
