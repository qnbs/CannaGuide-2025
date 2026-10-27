import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

// CI has no Cargo audit gate; Rust advisories surface only through Scorecard/OSV.
// These floors keep a lockfile refresh from silently moving the desktop crate back
// into an advisory range that was already patched (#618, #594).

const LOCK = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../apps/desktop/src-tauri/Cargo.lock',
)

const FLOORS = [
    // GHSA-vp88-798v-h67f and three further rustls advisories, fixed in 0.23.46.
    { name: 'rustls', min: '0.23.46', below: '0.24.0' },
    // RUSTSEC-2026-0382: distrusted intermediate SPKIs.
    { name: 'rustls-webpki', min: '0.103.16', below: '0.104.0' },
    // RUSTSEC-2026-0386 is fixed on this line in 1.53.3; 1.54.0 itself is named
    // by GHSA-5wjr-9356-4wc8 (fixed in 1.54.1).
    { name: 'tokio', min: '1.53.3', below: '2.0.0', excluded: ['1.54.0'] },
    // RUSTSEC-2026-0383 (emSign ECC G3, fixed in 1.0.10); 1.0.11 also drops the
    // emSign Root CA C1 and ECC C3 roots removed from CCADB.
    { name: 'webpki-root-certs', min: '1.0.11', below: '2.0.0' },
]

function lockedVersions(name) {
    const text = readFileSync(LOCK, 'utf8')
    const pattern = new RegExp(`\\[\\[package\\]\\]\\nname = "${name}"\\nversion = "([^"]+)"`, 'g')
    return [...text.matchAll(pattern)].map((match) => match[1])
}

function compare(a, b) {
    const pa = a.split('.').map(Number)
    const pb = b.split('.').map(Number)
    for (let index = 0; index < 3; index += 1) {
        if (pa[index] !== pb[index]) return pa[index] - pb[index]
    }
    return 0
}

for (const floor of FLOORS) {
    test(`${floor.name} stays at or above ${floor.min} in Cargo.lock`, () => {
        const versions = lockedVersions(floor.name)
        assert.ok(versions.length > 0, `${floor.name} is not in Cargo.lock`)
        for (const version of versions) {
            assert.match(version, /^\d+\.\d+\.\d+$/, `${floor.name} ${version} is not a release`)
            assert.ok(compare(version, floor.min) >= 0, `${floor.name} ${version} < ${floor.min}`)
            assert.ok(
                compare(version, floor.below) < 0,
                `${floor.name} ${version} >= ${floor.below}`,
            )
            assert.ok(!floor.excluded?.includes(version), `${floor.name} ${version} is excluded`)
        }
    })
}
