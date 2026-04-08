#!/usr/bin/env node
// ---------------------------------------------------------------------------
// check-strain-integrity.mjs -- Strain Database Integrity Guard
//
// Validates the strain catalog for:
//   1. No duplicate IDs
//   2. No fuzzy-duplicate names (normalized comparison)
//   3. Every entry has required fields (id, name, type)
//   4. Total count matches expected value (if EXPECTED_COUNT env var set)
//
// Usage:
//   node scripts/check-strain-integrity.mjs
//   EXPECTED_COUNT=776 node scripts/check-strain-integrity.mjs
// ---------------------------------------------------------------------------

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const jsonPath = join(__dirname, '..', 'apps', 'web', 'data', 'strains', 'strains.json')

const normalizeName = (name) =>
    name
        .toLowerCase()
        .replace(/\s+(auto|autoflower|autoflowering|feminized|fem|reg|regular|fast)\s*$/i, '')
        .replace(/[^a-z0-9]/g, '')
        .trim()

const run = async () => {
    const raw = await readFile(jsonPath, 'utf8')
    const strains = JSON.parse(raw)
    let errors = 0

    // 1. Check for duplicate IDs
    const idMap = new Map()
    for (let i = 0; i < strains.length; i++) {
        const id = strains[i].id
        if (idMap.has(id)) {
            console.error(`[FAIL] Duplicate ID: "${id}" at index ${idMap.get(id)} and ${i}`)
            errors++
        } else {
            idMap.set(id, i)
        }
    }

    // 2. Check for fuzzy-duplicate names
    const nameMap = new Map()
    for (let i = 0; i < strains.length; i++) {
        const norm = normalizeName(strains[i].name)
        if (norm.length < 3) continue
        if (nameMap.has(norm)) {
            const prev = nameMap.get(norm)
            console.error(
                `[FAIL] Fuzzy-duplicate names: "${strains[prev].name}" (id: ${strains[prev].id}) and "${strains[i].name}" (id: ${strains[i].id})`,
            )
            errors++
        } else {
            nameMap.set(norm, i)
        }
    }

    // 3. Check required fields
    for (let i = 0; i < strains.length; i++) {
        const s = strains[i]
        if (!s.id || !s.name || !s.type) {
            console.error(
                `[FAIL] Missing required field at index ${i}: id="${s.id}" name="${s.name}" type="${s.type}"`,
            )
            errors++
        }
    }

    // 4. Optional count assertion
    const expectedCount = process.env.EXPECTED_COUNT
        ? parseInt(process.env.EXPECTED_COUNT, 10)
        : undefined
    if (expectedCount !== undefined && strains.length !== expectedCount) {
        console.error(`[FAIL] Expected ${expectedCount} strains, found ${strains.length}`)
        errors++
    }

    // Summary
    if (errors > 0) {
        console.error(`\n[check-strain-integrity] ${errors} error(s) found.`)
        process.exit(1)
    }

    console.log(
        `[check-strain-integrity] OK: ${strains.length} strains, 0 duplicates, all fields valid.`,
    )
}

run().catch((err) => {
    console.error('[check-strain-integrity] Fatal:', err)
    process.exit(1)
})
