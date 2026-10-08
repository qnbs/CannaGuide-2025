import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { APPLICATION_DATABASE_NAMES } from './privacyDatabaseRegistry'

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs'])

const NAME_PATTERN =
    /(?:indexedDB\.open\(\s*|dbName:\s*|const\s+(?:DB_NAME|TS_DB_NAME|SECURE_DB_NAME|REMINDER_DB_NAME|DOC_NAME)\s*=\s*)['"]([^'"]+)['"]/g

const walk = (dir: string): string[] => {
    const files: string[] = []
    for (const entry of readdirSync(dir)) {
        if (entry === 'node_modules' || entry === 'dist' || entry === 'coverage') continue
        const full = path.join(dir, entry)
        const info = statSync(full)
        if (info.isDirectory()) {
            if (entry === 'tests') continue
            files.push(...walk(full))
            continue
        }
        if (entry.includes('.test.') || entry.includes('.spec.')) continue
        if (SOURCE_EXTENSIONS.has(path.extname(entry))) files.push(full)
    }
    return files
}

const discoveredDatabaseNames = (): string[] => {
    const names = new Set<string>()
    for (const file of walk(webRoot)) {
        const source = readFileSync(file, 'utf8')
        for (const match of source.matchAll(NAME_PATTERN)) {
            const name = match[1]
            if (name) names.add(name)
        }
    }
    return [...names]
}

describe('privacy database registry', () => {
    it('includes every IndexedDB name literal in application source', () => {
        const discovered = discoveredDatabaseNames()
        const registered = new Set<string>(APPLICATION_DATABASE_NAMES)
        const missing = discovered.filter((name) => !registered.has(name))
        expect(missing).toEqual([])
    })

    it('registers the persistence databases erase previously skipped', () => {
        expect(APPLICATION_DATABASE_NAMES).toEqual(
            expect.arrayContaining([
                'cannaguide-crdt-v1',
                'CannaGuideRagEmbeddingCache',
                'plantDiseaseModel',
            ]),
        )
    })
})
