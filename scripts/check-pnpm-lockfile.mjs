#!/usr/bin/env node
/**
 * Fail fast when pnpm-lock.yaml has duplicate package keys in packages:/snapshots:.
 * Catches merge/rebase corruption before pnpm install --frozen-lockfile.
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const TAG = '[check:lockfile]'
const LOCKFILE_SECTIONS = ['packages', 'snapshots']
const LOCKFILE_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'pnpm-lock.yaml')

function fail(message) {
    console.error(`${TAG} ${message}`)
    process.exit(1)
}

function readLockfile(path) {
    try {
        return readFileSync(path, 'utf8')
    } catch (error) {
        if (error && typeof error === 'object' && error.code === 'ENOENT') {
            fail(`pnpm-lock.yaml not found at ${path}`)
        }
        throw error
    }
}

function findDuplicateKeys(lockfileText) {
    const lines = lockfileText.split('\n')
    let currentSection = null
    const keysBySection = Object.fromEntries(
        LOCKFILE_SECTIONS.map((section) => [section, new Map()]),
    )

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]
        const lineNo = index + 1

        if (/^[a-zA-Z][\w-]*:$/.test(line)) {
            const section = line.slice(0, -1)
            currentSection = LOCKFILE_SECTIONS.includes(section) ? section : null
            continue
        }

        if (!currentSection) continue

        const match = line.match(/^  ([^:\s][^:]*):/)
        if (!match) continue

        const key = match[1]
        const sectionKeys = keysBySection[currentSection]
        const locations = sectionKeys.get(key) ?? []
        locations.push(lineNo)
        sectionKeys.set(key, locations)
    }

    const duplicates = []
    for (const section of LOCKFILE_SECTIONS) {
        for (const [key, locations] of keysBySection[section]) {
            if (locations.length > 1) {
                duplicates.push({ section, key, locations })
            }
        }
    }

    return duplicates
}

const duplicates = findDuplicateKeys(readLockfile(LOCKFILE_PATH))
if (duplicates.length === 0) {
    console.log(`${TAG} OK — no duplicate keys in packages:/snapshots:`)
    process.exit(0)
}

console.error(`${TAG} pnpm-lock.yaml has duplicate mapping keys:`)
for (const { section, key, locations } of duplicates) {
    console.error(`${TAG}   ${section}: ${key} at lines ${locations.join(', ')}`)
}
console.error(`${TAG} Remove duplicate entries or regenerate the lockfile with pnpm install.`)
process.exit(1)
