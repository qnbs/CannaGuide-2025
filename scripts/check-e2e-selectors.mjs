/**
 * check-e2e-selectors.mjs
 *
 * Advisory guard: scans E2E tests for fragile selectors that may break
 * on i18n or markup changes. Prefers data-testid / data-view-id /
 * data-tab-id over text-based or class-based locators.
 *
 * Exit 0 always (advisory). CI step surfaces the report.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const E2E_DIR = new URL('../apps/web/tests/e2e', import.meta.url).pathname

// Patterns that indicate fragile selectors
const FRAGILE_PATTERNS = [
    {
        // getByText('hardcoded string') -- not a regex
        regex: /\.getByText\(\s*['"][^/]/g,
        label: 'getByText with hardcoded string (prefer data-testid)',
    },
    {
        // locator('.class-name') without data- attribute
        regex: /\.locator\(\s*['"]\.[\w-]+['"]\s*\)/g,
        label: 'CSS class selector (prefer data-testid)',
    },
]

function scanFile(filePath) {
    const content = readFileSync(filePath, 'utf8')
    const lines = content.split('\n')
    const findings = []

    for (const pattern of FRAGILE_PATTERNS) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (line === undefined) continue
            // Reset regex state
            pattern.regex.lastIndex = 0
            if (pattern.regex.test(line)) {
                findings.push({
                    line: i + 1,
                    text: line.trim(),
                    label: pattern.label,
                })
            }
        }
    }

    return findings
}

function main() {
    let files
    try {
        files = readdirSync(E2E_DIR)
            .filter((f) => f.endsWith('.e2e.ts'))
            .map((f) => join(E2E_DIR, f))
    } catch {
        console.log('[e2e-selectors] No E2E test directory found. Skipping.')
        process.exit(0)
    }

    if (files.length === 0) {
        console.log('[e2e-selectors] No E2E test files found. Skipping.')
        process.exit(0)
    }

    let totalFindings = 0

    for (const file of files) {
        const findings = scanFile(file)
        if (findings.length > 0) {
            const relativePath = file.replace(process.cwd() + '/', '')
            for (const f of findings) {
                console.log(`  [WARN] ${relativePath}:${f.line} -- ${f.label}`)
                console.log(`         ${f.text}`)
            }
            totalFindings += findings.length
        }
    }

    if (totalFindings === 0) {
        console.log(
            `[e2e-selectors] [OK] ${files.length} files scanned, 0 fragile selectors found.`,
        )
    } else {
        console.log(
            `\n[e2e-selectors] [FAIL] ${totalFindings} fragile selector(s) in ${files.length} files.`,
        )
        console.log('[e2e-selectors] Prefer data-testid, data-view-id, or data-tab-id.')
        process.exit(1)
    }

    process.exit(0)
}

main()
