import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { parsePublicKey, parseSignature, verifyMinisign } from './minisign.mjs'
import { makeSigner } from './test-signer.mjs'

const b64 = (value) => Buffer.from(value).toString('base64')

test('a Tauri-style (prehashed ED) signature verifies against its public key', () => {
    const signer = makeSigner()
    const file = Buffer.from('installer bytes')
    assert.deepEqual(verifyMinisign(file, signer.signFile(file), signer.pubkey), { ok: true })
})

test('a legacy (Ed, not prehashed) signature verifies too', () => {
    const signer = makeSigner()
    const file = Buffer.from('legacy bundle')
    const signature = signer.signFile(file, { algorithm: 'Ed' })
    assert.equal(parseSignature(signature).algorithm, 'Ed')
    assert.deepEqual(verifyMinisign(file, signature, signer.pubkey), { ok: true })
})

test('a changed file, another key, or an edited trusted comment fails', () => {
    const signer = makeSigner()
    const file = Buffer.from('installer bytes')
    const signature = signer.signFile(file)

    assert.equal(verifyMinisign(Buffer.from('installer bytez'), signature, signer.pubkey).ok, false)

    const other = makeSigner()
    assert.match(verifyMinisign(file, signature, other.pubkey).reason, /different key id/)

    const sameIdOtherKey = makeSigner(signer.keyId)
    assert.match(
        verifyMinisign(file, signature, sameIdOtherKey.pubkey).reason,
        /does not match the file/,
    )

    const text = Buffer.from(signature, 'base64').toString('utf8')
    const edited = b64(text.replace('file:bundle', 'file:other'))
    assert.match(verifyMinisign(file, edited, signer.pubkey).reason, /trusted comment/)
})

test('malformed keys and signatures are reported, not thrown', () => {
    const signer = makeSigner()
    const file = Buffer.from('x')
    for (const [signature, pubkey] of [
        ['not base64 minisign', signer.pubkey],
        [signer.signFile(file), 'bm90IGEga2V5'],
        [b64('untrusted comment: x\nAAAA\ntrusted comment: y\nAAAA\n'), signer.pubkey],
    ]) {
        const result = verifyMinisign(file, signature, pubkey)
        assert.equal(result.ok, false)
        assert.equal(typeof result.reason, 'string')
    }
    assert.throws(() => parsePublicKey(b64('untrusted comment: x\nAAAA\n')), /not a minisign/)
})

test('the configured updater key is the one whose private key is the signing secret', () => {
    // Pinned so a key swap is a deliberate, reviewed change: installed apps verify
    // every update against this key, and only its private key (the
    // TAURI_SIGNING_PRIVATE_KEY secret, generated 2026-11-17) can sign for them.
    const config = JSON.parse(
        readFileSync(
            new URL('../../apps/desktop/src-tauri/tauri.conf.json', import.meta.url),
            'utf8',
        ),
    )
    const { keyId } = parsePublicKey(config.plugins.updater.pubkey)
    assert.equal(Buffer.from(keyId).reverse().toString('hex').toUpperCase(), 'F1B0337766BB36BD')
})
