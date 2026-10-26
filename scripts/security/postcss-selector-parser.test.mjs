import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { performance } from 'node:perf_hooks'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

// Resolve the parser through its real consumer (apps/web -> @tailwindcss/typography),
// without relying on hoisting, so the test sees exactly what the CSS build loads.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const requireWeb = createRequire(resolve(repoRoot, 'apps/web/package.json'))
const typographyEntry = requireWeb.resolve('@tailwindcss/typography')
const requireTypography = createRequire(typographyEntry)
const manifest = JSON.parse(
    readFileSync(requireTypography.resolve('postcss-selector-parser/package.json'), 'utf8'),
)
const parser = requireTypography('postcss-selector-parser')

const roundTrip = (selector) => parser().processSync(selector)

test('typography resolves the patched 6.x selector parser (GHSA-rj75-hqrm-r3gf)', () => {
    const [major, minor, patch] = manifest.version.split('.').map(Number)
    // 6.1.5 is the 6.x backport; a 7.x major here would mean the override escaped its bound.
    assert.equal(major, 6, `expected the 6.x API family, got ${manifest.version}`)
    assert.ok(
        minor > 1 || (minor === 1 && patch >= 5),
        `postcss-selector-parser ${manifest.version} is in the advisory range <6.1.5`,
    )
})

test('flat class/id selectors parse in linear, not quadratic, time', () => {
    // 80k indexes (~160 KB). Measured on a dual-core laptop: 6.0.10 needs ~36 s,
    // 6.1.5 ~0.6 s. The bound sits far from both, so a fast runner cannot hide the
    // quadratic parser and a slow one does not flake -- the version contract above
    // remains the primary signal.
    const flat = '.a'.repeat(40_000) + '#b'.repeat(40_000)
    const started = performance.now()
    const output = roundTrip(flat)
    const elapsed = performance.now() - started
    assert.equal(output, flat)
    assert.ok(elapsed < 5_000, `flat selector took ${Math.round(elapsed)} ms`)
})

test('selectors shaped like the typography plugin output round-trip byte-identically', () => {
    for (const selector of [
        ':where(p):not(:where([class~="not-prose"],[class~="not-prose"] *))',
        ':where(ol[type="A" s]):not(:where([class~="not-prose"] *))',
        ':where(a strong):not(:where([class~="not-prose"] *))::marker',
        '.prose :where(h2 + *):not(:where([class~="not-prose"] *))',
        '.a.b#c > .d ~ .e, [data-x="1"]::before',
    ]) {
        assert.equal(roundTrip(selector), selector)
    }
})

test('the typography plugin loads against the resolved parser', () => {
    const typography = requireWeb('@tailwindcss/typography')
    assert.equal(typeof typography, 'function')
})
