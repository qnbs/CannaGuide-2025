#!/usr/bin/env node
/**
 * Fails when the desktop app does not carry the release version: the root package.json
 * version must equal apps/desktop/package.json, the Tauri config (bundle and installer
 * version), Cargo.toml and the crate's Cargo.lock entry. The desktop app shipped as
 * 0.1.0 while the release was 1.11.0, so installers and the updater disagreed.
 * Optional `--tag vX.Y.Z` also requires the tag to match. Exit 1 on drift or an
 * unreadable or malformed file, 2 on usage. LF and CRLF line endings are both accepted.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

export const readDesktopVersions = (root) => {
    // CRLF checkouts (core.autocrlf on Windows) must compare the same as LF ones.
    const read = (file) => readFileSync(path.join(root, file), 'utf8').replaceAll('\r\n', '\n')
    const cargoToml = read('apps/desktop/src-tauri/Cargo.toml')
    const cargoLock = read('apps/desktop/src-tauri/Cargo.lock')
    return {
        'package.json': JSON.parse(read('package.json')).version,
        'apps/desktop/package.json': JSON.parse(read('apps/desktop/package.json')).version,
        'apps/desktop/src-tauri/tauri.conf.json': JSON.parse(
            read('apps/desktop/src-tauri/tauri.conf.json'),
        ).version,
        'apps/desktop/src-tauri/Cargo.toml': /^\[package\][\s\S]*?^version = "([^"]+)"/m.exec(
            cargoToml,
        )?.[1],
        'apps/desktop/src-tauri/Cargo.lock':
            /^name = "cannaguide-desktop"\nversion = "([^"]+)"/m.exec(cargoLock)?.[1],
    }
}

export const desktopVersionProblems = (versions, tag) => {
    const expected = versions['package.json']
    const problems = Object.entries(versions)
        .filter(([, version]) => version !== expected)
        .map(([file, version]) => `${file}: ${version ?? 'no version'} (expected ${expected})`)
    if (tag !== undefined && tag !== `v${expected}`)
        problems.push(`tag ${tag} does not match v${expected}`)
    return problems
}

export function main(argv = process.argv.slice(2), root = process.cwd()) {
    let tag
    if (argv.length > 0) {
        if (argv[0] !== '--tag' || !argv[1] || argv.length > 2) {
            console.error('[check-desktop-version] usage: [--tag vX.Y.Z]')
            return 2
        }
        tag = argv[1]
    }
    let versions
    try {
        versions = readDesktopVersions(root)
    } catch (error) {
        console.error(`[FAIL] cannot read the desktop versions: ${error.message}`)
        return 1
    }
    const problems = desktopVersionProblems(versions, tag)
    for (const problem of problems) console.error(`[FAIL] ${problem}`)
    if (problems.length === 0)
        console.log(`[OK] desktop version ${versions['package.json']} everywhere`)
    return problems.length === 0 ? 0 : 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    process.exitCode = main()
}
