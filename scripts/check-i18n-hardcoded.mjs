#!/usr/bin/env node
// ---------------------------------------------------------------------------
// i18n Hardcoded String Checker
// ---------------------------------------------------------------------------
// Scans .tsx component files for likely hardcoded user-facing strings that
// should use t() from react-i18next.
//
// Heuristic (regex-based, no AST):
//   1. JSX text content: >Some English Text< (multi-word, starts with uppercase), and the
//      same text alone on its line after an opening tag or before a closing tag, the way
//      Prettier wraps it
//   2. String props in i18n-sensitive attributes: title="...", label="...",
//      placeholder="...", description="...", aria-label="..."
//
// Ignores:
//   - Strings inside className, key, data-*, testId, id, name, type, role,
//     htmlFor, src, href, rel, target, pattern, encoding props
//   - Single-word strings (likely enum values, CSS classes, identifiers)
//   - Strings that are template literals with expressions {`...${...}...`}
//   - Lines containing i18next, useTranslation, getT( (a `{t(...)}` expression is removed
//     first, so the text next to it is still checked)
//   - Test files (*.test.tsx)
//   - Known technical strings (URLs, hex colors, mime types, file paths)
//   - Console/debug statements
//
// Exit code: 0 on findings unless CHECK_I18N_STRICT=1, which CI sets; then 1.
// ---------------------------------------------------------------------------

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WEB_DIR = resolve(__dirname, '..', 'apps', 'web')
/** Not app UI: build output, tests, translations and static assets. */
const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'coverage', 'tests', 'locales', 'public'])

// Files excluded from scanning (dev-only or decorative/aria-hidden content)
const EXCLUDED_FILES = new Set([
    'DevTelemetryPanel.tsx', // dev-only telemetry panel, technical labels
    'PaymentIcons.tsx', // SVG titles inside aria-hidden="true" elements
    'render.tsx', // bootstrap's start-failure page: shown when the start, i18n included, failed
])

// Props that typically contain user-facing text
const I18N_SENSITIVE_PROPS =
    /\b(?:title|label|placeholder|description|alt|aria-label|aria-description|aria-placeholder|headerText|emptyText|buttonText|tooltip)\s*=\s*["']([^"']{2,})["']/g

// JSX text content: > Some text < (between tags, multi-word, starts uppercase)
// Matches lines like:  <p>Some English Text</p>  or  >Warning: something<
const JSX_TEXT_CONTENT = />\s*([A-Z][a-zA-Z]*(?:\s+[a-zA-Z()/,.:!?-]+){1,})\s*</g

// A line that starts a block or JSX comment: `/*`, `/**` or `{/*`
const BLOCK_COMMENT_OPENER = /^\s*\{?\/\*/

// The same text alone on its line, for text that Prettier moved off the tag's line
const OWN_LINE_TEXT = /^\s*([A-Z][a-zA-Z]*(?:\s+[a-zA-Z()/,.:!?'-]+){1,})\s*$/

// Lines to skip entirely
const SKIP_LINE_PATTERNS = [
    /useTranslation/, // i18n import
    /getT\s*\(/, // service-side i18n
    /i18next/i, // i18n reference
    /console\./, // debug/logging
    /^\s*\/\//, // line comments (a URL's // elsewhere on a line is not one)
    /^\s*\*/, // block comment lines
    /^\s*\/\*/, // block comment start
    /^\s*import\b/, // import statements
    /^\s*const\b.*=\s*['"]/, // const assignments (identifiers, not UI)
    /data-testid/, // test IDs
    /data-state/, // state attributes
    /\.captureException/, // Sentry calls
    /\.captureMessage/, // Sentry calls
]

// String content to ignore (technical, not user-facing)
const IGNORE_CONTENT_PATTERNS = [
    /^https?:\/\//, // URLs
    /^#[0-9a-fA-F]{3,8}$/, // hex colors
    /^[a-z]+-[a-z]+$/, // kebab-case identifiers
    /^(?:div|span|p|h[1-6]|button|input|form|img|svg|path|circle|rect|text|label)$/i,
    /^(?:text|email|password|number|tel|url|search|hidden|submit|button|checkbox|radio|file|range|date|time|color)$/i,
    /^\d/, // starts with digit
    /^[A-Z_]+$/, // CONSTANT_CASE
    /^[a-z]+$/, // single lowercase word
    /^\//, // file paths
    /^(?:GET|POST|PUT|DELETE|PATCH)$/,
    /^(?:application|image|text|audio|video)\//, // MIME types
    /(?:\.(?:ts|tsx|js|jsx|css|json|md|svg|png|jpg|webp|woff2?|ttf|ico))$/i,
    /^data:/, // data URIs
    /^\{/, // expression (JSX interpolation)
    /^[a-z]+\.[a-z]/, // object.property patterns (likely code)
    /^(?:true|false|null|undefined)$/,
    /^(?:none|auto|inherit|initial|unset|normal|bold|italic)$/i, // CSS values
    /^[\d.]+(?:px|rem|em|%|vh|vw|ms|s|deg|fr)?$/, // CSS units
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shouldSkipLine(line) {
    return SKIP_LINE_PATTERNS.some((p) => p.test(line))
}

function isIgnoredContent(str) {
    const trimmed = str.trim()
    if (trimmed.length < 3) return true
    if (trimmed.split(/\s+/).length < 2) return true // single word
    return IGNORE_CONTENT_PATTERNS.some((p) => p.test(trimmed))
}

function collectTsxFiles(dir) {
    const results = []
    for (const entry of readdirSync(dir)) {
        const full = resolve(dir, entry)
        const stat = statSync(full)
        if (stat.isDirectory()) {
            if (!SKIPPED_DIRS.has(entry)) results.push(...collectTsxFiles(full))
        } else if (
            entry.endsWith('.tsx') &&
            !entry.endsWith('.test.tsx') &&
            !entry.endsWith('.ct.tsx') &&
            !EXCLUDED_FILES.has(entry)
        ) {
            results.push(full)
        }
    }
    return results
}

// ---------------------------------------------------------------------------
// Main scan
// ---------------------------------------------------------------------------

/** Whether a line sits between JSX tags: after an opening tag or before a closing one. */
function isBetweenTags(lines, index) {
    const previous = (lines.slice(0, index).findLast((entry) => entry.trim()) ?? '').trimEnd()
    const next = lines.slice(index + 1).find((entry) => entry.trim()) ?? ''
    const following = next.trimStart()
    // `=>` and `->` end a line of code or prose, not an opening tag.
    const afterTag = previous.endsWith('>') && !/[=-]>$/.test(previous)
    return afterTag || following.startsWith('</') || following.startsWith('{')
}

/** A translated `{t('...')}` expression, which says nothing about the text beside it. */
const TRANSLATED_EXPRESSION = /\{\s*t\s*\([^{}]*\)\s*\}/g

const shortened = (value) => (value.length > 60 ? value.slice(0, 57) + '...' : value)

/** The likely hardcoded strings in one .tsx source. */
export function scanSource(content) {
    const lines = content.split('\n')
    const findings = []
    let inBlockComment = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        // A block or JSX comment that opens a line and stays open hides the lines up to `*/`.
        if (inBlockComment) {
            inBlockComment = !line.includes('*/')
            continue
        }
        const opener = BLOCK_COMMENT_OPENER.exec(line)
        if (opener && !line.slice(opener[0].length).includes('*/')) {
            inBlockComment = true
            continue
        }
        if (shouldSkipLine(line)) continue
        // `<p>{t('a')} Some Words</p>` still has hardcoded text once the translation is gone.
        const checked = line.replace(TRANSLATED_EXPRESSION, '')
        if (/\bt\s*\(/.test(checked)) continue

        // Check i18n-sensitive props with hardcoded string values
        let propMatch
        I18N_SENSITIVE_PROPS.lastIndex = 0
        while ((propMatch = I18N_SENSITIVE_PROPS.exec(checked)) !== null) {
            const value = propMatch[1]
            if (!isIgnoredContent(value)) {
                findings.push({ line: i + 1, type: 'prop', text: shortened(value) })
            }
        }

        // Check JSX text content
        let textMatch
        JSX_TEXT_CONTENT.lastIndex = 0
        while ((textMatch = JSX_TEXT_CONTENT.exec(checked)) !== null) {
            const value = textMatch[1]
            if (!isIgnoredContent(value)) {
                findings.push({ line: i + 1, type: 'text', text: shortened(value) })
            }
        }

        // The cleaned line, so `{t('a')} Some Words` on its own line is checked like `Some Words`.
        const ownLine = OWN_LINE_TEXT.exec(checked)
        if (ownLine && !isIgnoredContent(ownLine[1]) && isBetweenTags(lines, i)) {
            findings.push({ line: i + 1, type: 'text', text: shortened(ownLine[1]) })
        }
    }

    return findings
}

function scanFile(filePath) {
    return scanSource(readFileSync(filePath, 'utf-8'))
}

function main() {
    const files = collectTsxFiles(WEB_DIR)
    let totalFindings = 0
    const fileResults = []

    for (const file of files) {
        const findings = scanFile(file)
        if (findings.length > 0) {
            totalFindings += findings.length
            fileResults.push({ file, findings })
        }
    }

    if (totalFindings === 0) {
        console.log("[PASS] No hardcoded i18n strings detected in the web app's .tsx files.")
        process.exit(0)
    }

    console.log(
        `\n[WARN] Found ${totalFindings} potential hardcoded string(s) in ${fileResults.length} file(s):\n`,
    )

    for (const { file, findings } of fileResults) {
        const rel = relative(WEB_DIR, file)
        for (const f of findings) {
            console.log(`  ${rel}:${f.line}  [${f.type}]  "${f.text}"`)
        }
    }

    console.log(`\n  Total: ${totalFindings} finding(s). Wrap user-facing strings with t().`)
    console.log('  False positives? Add to SKIP_LINE_PATTERNS or IGNORE_CONTENT_PATTERNS.\n')

    if (process.env.CHECK_I18N_STRICT === '1') {
        process.exit(1)
    }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
