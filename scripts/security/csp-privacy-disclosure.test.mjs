// Every third-party host the app may contact (production connect-src, web and
// desktop) must be named in the privacy policy of every locale, and Hugging
// Face's model download CDN must be allowed wherever the CSP is delivered
// (GH #634: huggingface.co now 302-redirects model binaries to it).
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const ROOT = path.resolve(import.meta.dirname, '../..')
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8')
// Every locale directory, so a newly added locale is checked without anyone
// having to remember this list. A locale without legal.ts fails below instead
// of being skipped.
const LOCALES = readdirSync(path.join(ROOT, 'apps/web/locales'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
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
    const file = `apps/web/locales/${locale}/legal.ts`
    assert.ok(existsSync(path.join(ROOT, file)), `${locale}: ${file} is missing`)
    const source = read(file)
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
    // Union over every delivery path, not only the canonical one: a host added to
    // a single platform's CSP must be disclosed too.
    const hosts = new Set(Object.keys(CSP_SOURCES).flatMap((file) => connectSrcHosts(read(file))))
    assert.ok(hosts.size > 5, 'expected the full third-party host list')
    assert.ok(LOCALES.length >= 5 && LOCALES.includes('en'), `unexpected locale set: ${LOCALES}`)
    for (const locale of LOCALES) {
        const text = thirdPartyText(locale)
        const missing = [...hosts].filter((host) => !text.includes(host))
        assert.deepEqual(missing, [], `${locale} privacy text does not name: ${missing.join(', ')}`)
    }
})
