import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

// Each Tauri npm package must sit on the same major and minor release as the Rust crate
// the desktop build compiles. Dependabot tracks npm but not Cargo here, so #927 moved
// @tauri-apps/plugin-shell to 2.6.0 while Cargo.lock kept tauri-plugin-shell 2.3.5; a
// frontend call into an API only the newer package has is then refused natively.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const IMPORTERS = ['apps/desktop', 'apps/web']

/** The npm versions the lockfile resolves for each importer's @tauri-apps/* dependencies. */
function lockedTauriPackages(lockfile) {
    const lines = lockfile.split(/\r?\n/u)
    const found = []
    let importer
    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]
        if (line === 'packages:') break
        const header = /^ {2}(\S.*):$/u.exec(line)
        if (header) importer = header[1]
        const key = /^ {6}'?(@tauri-apps\/[a-z-]+)'?:$/u.exec(line)
        if (!key || !IMPORTERS.includes(importer)) continue
        const version = /^ {8}version: ([^\s(]+)/u.exec(lines[index + 2] ?? '')?.[1]
        if (version) found.push({ importer, name: key[1], version })
    }
    return found
}

/** The crate an npm package is built against; the CLI has none. */
function crateFor(name) {
    if (name === '@tauri-apps/api') return 'tauri'
    const plugin = /^@tauri-apps\/plugin-([a-z-]+)$/u.exec(name)?.[1]
    return plugin === undefined ? undefined : `tauri-plugin-${plugin}`
}

function lockedCrates(cargoLock) {
    const crates = new Map()
    const entry = /\[\[package\]\]\r?\nname = "([^"]+)"\r?\nversion = "([^"]+)"/gu
    for (const [, name, version] of cargoLock.matchAll(entry)) crates.set(name, version)
    return crates
}

const minor = (version) => version.split('.').slice(0, 2).join('.')

/** One line per npm package whose crate is missing or on another major.minor. */
function parityProblems(packages, crates) {
    const problems = []
    for (const { importer, name, version } of packages) {
        const crate = crateFor(name)
        if (crate === undefined) continue
        const crateVersion = crates.get(crate)
        if (crateVersion === undefined) {
            problems.push(`${importer}: ${name} ${version} has no ${crate} in Cargo.lock`)
        } else if (minor(crateVersion) !== minor(version)) {
            problems.push(`${importer}: ${name} ${version} but ${crate} ${crateVersion}`)
        }
    }
    return problems
}

test('every Tauri npm package matches its Rust crate on major and minor', () => {
    const packages = lockedTauriPackages(readFileSync(resolve(REPO_ROOT, 'pnpm-lock.yaml'), 'utf8'))
    const crates = lockedCrates(
        readFileSync(resolve(REPO_ROOT, 'apps/desktop/src-tauri/Cargo.lock'), 'utf8'),
    )
    assert.ok(
        packages.some(({ name }) => name === '@tauri-apps/plugin-shell'),
        'the lockfile parser found no Tauri plugin',
    )
    assert.deepEqual(parityProblems(packages, crates), [])
})

test('an npm-only plugin bump is reported, as in #927', () => {
    const lockfile = [
        'importers:',
        '',
        '  apps/desktop:',
        '    dependencies:',
        "      '@tauri-apps/cli':",
        '        specifier: ^2.11.4',
        '        version: 2.11.4',
        "      '@tauri-apps/plugin-shell':",
        '        specifier: ^2.6.0',
        '        version: 2.6.0',
        "      '@tauri-apps/plugin-store':",
        '        specifier: ^2.2.0',
        '        version: 2.4.2',
        '',
        'packages:',
    ].join('\r\n')
    const cargoLock = ['[[package]]', 'name = "tauri-plugin-shell"', 'version = "2.3.5"', ''].join(
        '\n',
    )
    assert.deepEqual(parityProblems(lockedTauriPackages(lockfile), lockedCrates(cargoLock)), [
        'apps/desktop: @tauri-apps/plugin-shell 2.6.0 but tauri-plugin-shell 2.3.5',
        'apps/desktop: @tauri-apps/plugin-store 2.4.2 has no tauri-plugin-store in Cargo.lock',
    ])
})
