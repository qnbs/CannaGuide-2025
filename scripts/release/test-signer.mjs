/** Test helper: minisign keys and signatures in the encoding Tauri uses. */
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto'

const b64 = (value) => Buffer.from(value).toString('base64')

/** A minisign key pair in the encoding Tauri uses (base64 of the minisign file text). */
export function makeSigner(keyId = randomBytes(8)) {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519')
    const rawPublic = publicKey.export({ format: 'der', type: 'spki' }).subarray(12)
    const pubkey = b64(
        `untrusted comment: minisign public key: ${keyId.toString('hex').toUpperCase()}\n` +
            `${Buffer.concat([Buffer.from('Ed'), keyId, rawPublic]).toString('base64')}\n`,
    )
    const signFile = (bytes, { algorithm = 'ED', trusted = 'timestamp:1\tfile:bundle' } = {}) => {
        const message =
            algorithm === 'ED'
                ? createHash('blake2b512').update(bytes).digest()
                : Buffer.from(bytes)
        const signature = sign(null, message, privateKey)
        const global = sign(null, Buffer.concat([signature, Buffer.from(trusted)]), privateKey)
        return b64(
            'untrusted comment: signature from tauri secret key\n' +
                `${Buffer.concat([Buffer.from(algorithm), keyId, signature]).toString('base64')}\n` +
                `trusted comment: ${trusted}\n${global.toString('base64')}\n`,
        )
    }
    return { pubkey, signFile, keyId }
}
