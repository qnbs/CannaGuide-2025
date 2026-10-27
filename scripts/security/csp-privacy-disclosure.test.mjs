// Every third-party host the app may contact (production connect-src, web and
// desktop) must be named in the privacy policy of every locale, and Hugging
// Face's model download CDN must be allowed wherever the CSP is delivered
// (GH #634: huggingface.co now 302-redirects model binaries to it).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const ROOT = path.resolve(import.meta.dirname, '../..')
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8')
const LOCALES = ['en', 'de', 'es', 'fr', 'nl']

/** Where Hugging Face sends model binaries (observed for every model the app uses). */
const HF_MODEL_CDN = 'https://us.aws.cdn.hf.co'

const CSP_SOURCES = {
    'apps/web/securityHeaders.ts': (s) => s,
    'apps/web/index.html': (s) => s,
    'apps/web/public/_headers': (s) => s,
    'vercel.json': (s) => s,
    'netlify.toml': (s) => s,
    'apps/desktop/src-tauri/tauri.conf.json': (s) => s,
}

/** https origins listed in the first connect-src directive of `source`. */
function connectSrcHosts(source) {
    const directive = /connect-src ([^;"]+)/.exec(source)?.[1]
    assert.ok(directive, 'connect-src not found')
    return (
        directive
            .split(/\s+/)
            .filter((token) => token.startsWith('https://'))
            .map((token) => new URL(token).host)
            // Tauri's IPC / asset protocols are local to the device, not third parties.
            .filter((host) => host !== 'localhost' && !host.endsWith('.localhost'))
    )
}

/** The privacy.thirdParty.content string of a locale's legal.ts. */
function thirdPartyText(locale) {
    const source = read(`apps/web/locales/${locale}/legal.ts`)
    const block = /thirdParty:\s*\{[\s\S]*?content:\s*\n?\s*(['"`])([\s\S]*?)\1,/.exec(source)
    assert.ok(block, `${locale}: privacy.thirdParty.content not found`)
    return block[2]
}

test('every CSP delivery path allows the Hugging Face model CDN', () => {
    for (const [file, extract] of Object.entries(CSP_SOURCES)) {
        const hosts = connectSrcHosts(extract(read(file)))
        assert.ok(
            hosts.includes(new URL(HF_MODEL_CDN).host),
            `${file} connect-src lacks ${HF_MODEL_CDN}`,
        )
    }
})

test('every third-party connect-src host is disclosed in every locale privacy text', () => {
    const hosts = new Set([
        ...connectSrcHosts(read('apps/web/securityHeaders.ts')),
        ...connectSrcHosts(read('apps/desktop/src-tauri/tauri.conf.json')),
    ])
    assert.ok(hosts.size > 5, 'expected the full third-party host list')
    for (const locale of LOCALES) {
        const text = thirdPartyText(locale)
        const missing = [...hosts].filter((host) => !text.includes(host))
        assert.deepEqual(missing, [], `${locale} privacy text does not name: ${missing.join(', ')}`)
    }
})
