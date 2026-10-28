// S-05: workflow artifacts (reports, traces, builds) are kept at most 14 days.
// They can hold source maps, traces and HTML reports of the app; a longer
// default only widens what a leaked token or a public-repo visitor can pull.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const WORKFLOWS = path.resolve(import.meta.dirname, '../../.github/workflows')
const MAX_DAYS = 14

test(`every artifact retention-days is at most ${MAX_DAYS}`, () => {
    const found = []
    for (const name of readdirSync(WORKFLOWS).filter((file) => file.endsWith('.yml'))) {
        const text = readFileSync(path.join(WORKFLOWS, name), 'utf8')
        for (const m of text.matchAll(/^\s*retention-days:\s*(\S+)\s*$/gm)) {
            const days = Number(m[1].replace(/['"]/g, ''))
            found.push(name)
            assert.ok(
                Number.isInteger(days) && days >= 1 && days <= MAX_DAYS,
                `${name}: retention-days ${m[1]} (allowed 1-${MAX_DAYS})`,
            )
        }
    }
    assert.ok(found.includes('mutation-testing.yml'), 'mutation report retention not found')
})
