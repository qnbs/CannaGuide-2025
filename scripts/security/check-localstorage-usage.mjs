#!/usr/bin/env node
/**
 * Ensures localStorage/sessionStorage usage stays within the allowlist
 * (see .cursor/rules/203-state-persistence.mdc).
 *
 * Exits 1 on unknown storage keys in production source.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'apps/web'

/** Prefixes or exact keys permitted without an ADR exception. */
const ALLOWED_PATTERNS = [
    /^cg\.onboarding\./,
    /^cg\.theme$/,
    /^cg\.locale$/,
    /^cg\.consent/,
    /^cannaguide\.iot\./i,
    /^cg_iot_/,
    /^cg\.ai\.provider\./,
    /^gemini_key_/,
    /^openai_key_/,
    /^xai_key_/,
    /^anthropic_key_/,
    /^cg\.voice\./,
    /^cg\.localai\./,
    /^cg\.plugins/,
    /^cg\.ageVerified/,
    /^cg\.geoLegal/,
    /^cg\.pwa\./,
    /^cg\.storage/,
    /^cg_clear_ai_history/,
    /^cg_image_consent/,
    /^cg\.filters\./,
    /^cg\.strains-view\./,
    /^cg\.ui\./,
    /^redux-persist:/,
    /^debug:/,
    /^sentry/,
]

const SCAN_DIRS = ['services', 'stores', 'components', 'hooks', 'bootstrap', 'utils']

const STORAGE_CALL =
    /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*['"`]([^'"`$]+)['"`]/g

function walk(dir, acc = []) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        const st = statSync(p)
        if (st.isDirectory()) {
            if (name === 'node_modules' || name === 'dist' || name === 'coverage') continue
            walk(p, acc)
        } else if (/\.(ts|tsx|mjs)$/.test(name) && !/\.test\./.test(name)) {
            acc.push(p)
        }
    }
    return acc
}

function isAllowed(key) {
    return ALLOWED_PATTERNS.some((re) => re.test(key))
}

function main() {
    const files = SCAN_DIRS.flatMap((d) => {
        const full = join(ROOT, d)
        try {
            return walk(full)
        } catch {
            return []
        }
    })

    const violations = []

    for (const file of files) {
        const content = readFileSync(file, 'utf8')
        let match
        STORAGE_CALL.lastIndex = 0
        while ((match = STORAGE_CALL.exec(content)) !== null) {
            const key = match[1]
            if (!isAllowed(key)) {
                violations.push({ file, key, line: content.slice(0, match.index).split('\n').length })
            }
        }
    }

    console.log('\nLOCAL STORAGE ALLOWLIST CHECK')
    console.log('=============================')
    console.log(`Scanned ${files.length} files`)

    if (violations.length === 0) {
        console.log('[OK] No unknown storage keys')
        process.exit(0)
    }

    for (const v of violations) {
        console.log(`[FAIL] ${v.file}:${v.line} — key "${v.key}" not in allowlist`)
    }
    console.log(`\n[FAIL] ${violations.length} violation(s). Add to allowlist in this script + 203-state-persistence.mdc`)
    process.exit(1)
}

main()
