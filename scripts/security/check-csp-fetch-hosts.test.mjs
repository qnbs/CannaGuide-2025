import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

import {
    connectSrcHosts,
    fetchTargetHosts,
    flagEnabled,
    violationsInSource,
    violationsInTree,
} from './check-csp-fetch-hosts.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const constantsSource = readFileSync(join(ROOT, 'apps/web/constants.ts'), 'utf8')
const allowed = connectSrcHosts(readFileSync(join(ROOT, 'apps/web/securityHeaders.ts'), 'utf8'))

describe('CSP fetch host gate', () => {
    it('accepts the live tree', () => {
        assert.deepEqual(violationsInTree(ROOT), [])
    })

    it('parses the production connect-src hosts', () => {
        assert.equal(allowed.has('api.openai.com'), true)
        assert.equal(allowed.has('api.github.com'), false)
        assert.equal(allowed.has('api.otreeba.com'), false)
    })

    it('keeps the gated feature flags on', () => {
        assert.equal(flagEnabled(constantsSource, 'CLOUD_SYNC_DISABLED'), true)
        assert.equal(flagEnabled(constantsSource, 'COMMUNITY_SHARE_DISABLED'), true)
        assert.equal(flagEnabled(constantsSource, 'EXTERNAL_STRAIN_LOOKUPS_DISABLED'), true)
        assert.equal(flagEnabled(constantsSource, 'CANSATIVA_LOOKUP_DISABLED'), true)
    })

    it('does not treat a longer token as the flag', () => {
        const name = 'EXTERNAL_STRAIN_LOOKUPS_DISABLED'
        assert.equal(flagEnabled(`export const ${name} = trueish\n`, name), false)
        assert.equal(flagEnabled(`export const ${name} = true$\n`, name), false)
        assert.equal(flagEnabled(`export const ${name} = true\n`, name), true)
    })

    it('ignores a commented true beside an active false', () => {
        const name = 'EXTERNAL_STRAIN_LOOKUPS_DISABLED'
        const source = `// export const ${name} = true\nexport const ${name} = false\n`
        assert.equal(flagEnabled(source, name), false)
    })

    it('ignores a true declaration written inside a string', () => {
        const name = 'EXTERNAL_STRAIN_LOOKUPS_DISABLED'
        const source = `const note = "export const ${name} = true"\nexport const ${name} = false\n`
        assert.equal(flagEnabled(source, name), false)
        const active = `const note = "export const ${name} = false"\nexport const ${name} = true\n`
        assert.equal(flagEnabled(active, name), true)
        const nested = `const note = \`x \${"export const ${name} = true"}\`\nexport const ${name} = false\n`
        assert.equal(flagEnabled(nested, name), false)
    })

    it('rejects a non-default port, another scheme, and a protocol-relative host', () => {
        const allowedHost = 'await fetch("https://api.openai.com/v1")'
        const explicitDefault = 'await fetch("https://api.openai.com:443/v1")'
        assert.deepEqual(violationsInSource(allowedHost, allowed, constantsSource, 'probe.ts'), [])
        assert.deepEqual(
            violationsInSource(explicitDefault, allowed, constantsSource, 'probe.ts'),
            [],
        )
        for (const source of [
            'await fetch("https://api.openai.com:4443/v1")',
            'await fetch("http://api.openai.com/v1")',
            'await fetch("//evil.example/v1")',
        ]) {
            const violations = violationsInSource(source, allowed, constantsSource, 'probe.ts')
            assert.equal(violations.length, 1, source)
        }
    })

    it('uses the host after userinfo, not the text before @', () => {
        const spoofed = 'await fetch("https://api.openai.com@evil.example/v1")'
        const violations = violationsInSource(spoofed, allowed, constantsSource, 'probe.ts')
        assert.equal(violations.length, 1)
        assert.match(violations[0], /evil\.example/)
        const credentialed = 'await fetch("https://user:secret@api.openai.com/v1")'
        assert.deepEqual(
            violationsInSource(credentialed, allowed, constantsSource, 'probe.ts'),
            [],
        )
        const escaped = 'await fetch("https://api.openai.com\\u0040evil.example/v1")'
        const escapedViolations = violationsInSource(escaped, allowed, constantsSource, 'probe.ts')
        assert.equal(escapedViolations.length, 1)
        assert.match(escapedViolations[0], /evil\.example/)
        const upperScheme = 'await fetch("HTTPS://evil.example/v1")'
        const upperViolations = violationsInSource(
            upperScheme,
            allowed,
            constantsSource,
            'probe.ts',
        )
        assert.equal(upperViolations.length, 1)
        assert.match(upperViolations[0], /evil\.example/)
    })

    it('fails a fetch host that is neither allowlisted nor gated', () => {
        const source = 'export async function probe() { await fetch("https://evil.example/x") }'
        const violations = violationsInSource(source, allowed, constantsSource, 'probe.ts')
        assert.equal(violations.length, 1)
        assert.match(violations[0], /evil\.example/)
    })

    it('accepts an allowlisted fetch host', () => {
        const source = 'export async function probe() { await fetch("https://api.openai.com/v1") }'
        assert.deepEqual(violationsInSource(source, allowed, constantsSource, 'probe.ts'), [])
    })

    it('accepts a gated host only while its flag is true', () => {
        const source = 'const url = "https://api.otreeba.com/v1"; await fetch(url)'
        assert.deepEqual(violationsInSource(source, allowed, constantsSource, 'probe.ts'), [])
        const flipped = constantsSource.replace(
            'export const EXTERNAL_STRAIN_LOOKUPS_DISABLED = true',
            'export const EXTERNAL_STRAIN_LOOKUPS_DISABLED = false',
        )
        const violations = violationsInSource(source, allowed, flipped, 'probe.ts')
        assert.equal(violations.length, 1)
        assert.match(violations[0], /EXTERNAL_STRAIN_LOOKUPS_DISABLED/)
    })

    it('ignores https links in files that do not call fetch', () => {
        assert.deepEqual(fetchTargetHosts('const docs = "https://evil.example/docs"'), [])
    })

    it('ignores commented fetch urls', () => {
        const source = '// await fetch("https://evil.example/x")\nexport const n = 1\nfetch'
        assert.deepEqual(fetchTargetHosts(source), [])
    })
})
