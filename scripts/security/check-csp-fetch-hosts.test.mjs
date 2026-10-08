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
