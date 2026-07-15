#!/usr/bin/env node
// ---------------------------------------------------------------------------
// codegraph.mjs -- lightweight, OOM-safe "micro" context layer for apps/web.
//
// Complements the committed Graphify "macro" layer (graphify-out/GRAPH_REPORT.md,
// god nodes + communities). This one is repo-wide, AST-based, and writes a fast
// import graph + module index + redux-slice map into the git-ignored .ai-context/
// directory for a session's targeted reads. It is NOT a CI gate and enforces
// nothing -- it only describes.
//
// OOM-safety: parses each file individually with @typescript-eslint/parser in
// AST-only mode (no `project`, no type-checking), then discards the AST. Same
// posture as scripts/check-a11y-ratchet.mjs, but lighter (import/export specifiers
// only). Safe to run on the dual-core / ~4 GB box; never triggers a tsc/turbo build.
//
// Usage:
//   node scripts/codegraph.mjs           # regenerate .ai-context/codegraph/
//   node scripts/codegraph.mjs --json    # also print a summary to stdout
//   node scripts/codegraph.mjs --check    # regenerate + assert outputs exist (exit 1 on failure)
// ---------------------------------------------------------------------------
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname, relative, sep } from 'node:path'
import { execSync } from 'node:child_process'
import { parse } from '@typescript-eslint/parser'

const ROOT = join(import.meta.dirname, '..')
const WEB_DIR = join(ROOT, 'apps', 'web')
const OUT_DIR = join(ROOT, '.ai-context', 'codegraph')

const SKIP_DIRS = new Set([
    'node_modules',
    'dist',
    'dist-ssr',
    'coverage',
    '.turbo',
    'test-results',
])
const SOURCE_RE = /\.(ts|tsx)$/
const IGNORE_FILE_RE = /\.(test|spec|stories|d)\.(ts|tsx)$/
const RESOLVE_EXT = ['.ts', '.tsx', '/index.ts', '/index.tsx']

const args = new Set(process.argv.slice(2))
const wantJson = args.has('--json')
const wantCheck = args.has('--check')

/** Recursively collect source files under a directory (skipping build/test dirs). */
function collectSources(dir, acc) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue
            collectSources(join(dir, entry.name), acc)
        } else if (SOURCE_RE.test(entry.name) && !IGNORE_FILE_RE.test(entry.name)) {
            acc.push(join(dir, entry.name))
        }
    }
    return acc
}

/** Normalise an absolute path to a WEB_DIR-relative, forward-slash module key. */
function toKey(absPath) {
    return relative(WEB_DIR, absPath).split(sep).join('/')
}

/** Resolve a "./x" / "../x" / "@/x" specifier to an existing WEB_DIR-relative key, or null. */
function resolveSpecifier(spec, fromAbsFile) {
    let baseAbs
    if (spec.startsWith('.')) {
        baseAbs = join(dirname(fromAbsFile), spec)
    } else if (spec.startsWith('@/')) {
        baseAbs = join(WEB_DIR, spec.slice(2))
    } else {
        return null // external package -- not an internal edge
    }
    for (const ext of ['', ...RESOLVE_EXT]) {
        const candidate = baseAbs + ext
        if (existsSync(candidate) && statSync(candidate).isFile()) return toKey(candidate)
    }
    return null
}

/** Walk an ESTree AST collecting import/export-from/dynamic-import string specifiers. */
function collectSpecifiers(ast) {
    const specs = []
    const visit = (node) => {
        if (!node || typeof node !== 'object') return
        const t = node.type
        if (
            t === 'ImportDeclaration' ||
            t === 'ExportAllDeclaration' ||
            t === 'ExportNamedDeclaration'
        ) {
            if (node.source && typeof node.source.value === 'string') specs.push(node.source.value)
        } else if (t === 'ImportExpression') {
            if (
                node.source &&
                node.source.type === 'Literal' &&
                typeof node.source.value === 'string'
            ) {
                specs.push(node.source.value)
            }
        }
        for (const key in node) {
            if (key === 'parent') continue
            const child = node[key]
            if (Array.isArray(child)) {
                for (const c of child) if (c && typeof c.type === 'string') visit(c)
            } else if (child && typeof child.type === 'string') {
                visit(child)
            }
        }
    }
    visit(ast)
    return specs
}

/** Group a module key into a display area (2-level for components/ and services/). */
function areaOf(key) {
    const parts = key.split('/')
    if (parts.length === 1) return '(root)'
    const top = parts[0]
    if ((top === 'components' || top === 'services') && parts.length > 2)
        return `${top}/${parts[1]}`
    return top
}

// ---------------------------------------------------------------------------
// Build the graph
// ---------------------------------------------------------------------------

const files = collectSources(WEB_DIR, []).sort()
/** key -> { imports:Set, importedBy:Set } */
const nodes = new Map()
const ensure = (k) => {
    if (!nodes.has(k)) nodes.set(k, { imports: new Set(), importedBy: new Set() })
    return nodes.get(k)
}

let parseErrors = 0
for (const abs of files) {
    const key = toKey(abs)
    ensure(key)
    let ast
    try {
        // JSX only for .tsx -- forcing it on .ts misreads TS generics (`<T>`) as JSX.
        ast = parse(readFileSync(abs, 'utf8'), {
            sourceType: 'module',
            ecmaVersion: 'latest',
            ecmaFeatures: { jsx: abs.endsWith('.tsx') },
            loc: false,
            range: false,
            comment: false,
            tokens: false,
        })
    } catch (err) {
        parseErrors++
        if (args.has('--debug'))
            console.error(`[parse-error] ${key}: ${err?.message?.split('\n')[0]}`)
        continue
    }
    for (const spec of collectSpecifiers(ast)) {
        const target = resolveSpecifier(spec, abs)
        if (!target || target === key) continue
        ensure(target)
        nodes.get(key).imports.add(target)
        nodes.get(target).importedBy.add(key)
    }
}

// ---------------------------------------------------------------------------
// Serialise outputs
// ---------------------------------------------------------------------------

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

const sortedKeys = [...nodes.keys()].sort()
let edgeCount = 0

// 1) import-graph.json
const graph = {}
for (const key of sortedKeys) {
    const n = nodes.get(key)
    edgeCount += n.imports.size
    graph[key] = {
        area: areaOf(key),
        imports: [...n.imports].sort(),
        importedBy: [...n.importedBy].sort(),
        fanIn: n.importedBy.size,
        fanOut: n.imports.size,
    }
}
writeFileSync(join(OUT_DIR, 'import-graph.json'), JSON.stringify(graph, null, 2) + '\n', 'utf8')

// 2) module-index.md -- grouped by area, hottest (highest fan-in) first
const byArea = new Map()
for (const key of sortedKeys) {
    const a = areaOf(key)
    if (!byArea.has(a)) byArea.set(a, [])
    byArea.get(a).push(key)
}
const idxLines = [
    '# Module index (codegraph micro layer)',
    '',
    '> Auto-generated by `scripts/codegraph.mjs` into git-ignored `.ai-context/`. Do not edit.',
    '> For god nodes / communities (the macro view), read `graphify-out/GRAPH_REPORT.md`.',
    '',
    `Modules: **${sortedKeys.length}** · internal edges: **${edgeCount}** · areas: **${byArea.size}**`,
    '',
    'Within each area, modules are sorted by fan-in (how many modules import them) — the',
    'high-fan-in ones are the load-bearing files to read first.',
    '',
]
for (const area of [...byArea.keys()].sort()) {
    const members = byArea
        .get(area)
        .slice()
        .sort(
            (a, b) =>
                nodes.get(b).importedBy.size - nodes.get(a).importedBy.size || a.localeCompare(b),
        )
    idxLines.push(`## ${area} (${members.length})`, '')
    for (const key of members) {
        const n = nodes.get(key)
        idxLines.push(`- \`${key}\` — fan-in ${n.importedBy.size}, fan-out ${n.imports.size}`)
    }
    idxLines.push('')
}
writeFileSync(join(OUT_DIR, 'module-index.md'), idxLines.join('\n'), 'utf8')

// 3) redux-slice-map.md -- the persisted domain slices and their fan-in
const slicesDir = join(WEB_DIR, 'stores', 'slices')
const sliceLines = [
    '# Redux slice map (codegraph micro layer)',
    '',
    '> Auto-generated by `scripts/codegraph.mjs`. The persisted domain slices under',
    '> `apps/web/stores/slices/` (Redux Toolkit, saved to IndexedDB). Transient UI state lives',
    '> in the Zustand `stores/use*Store.ts` files; cross the two systems only through the',
    '> sanctioned seam `services/uiStateBridge.ts` — never directly.',
    '',
    '| Slice | Fan-in (importers) |',
    '| ----- | ------------------ |',
]
if (existsSync(slicesDir)) {
    const sliceFiles = readdirSync(slicesDir)
        .filter((f) => f.endsWith('.ts') && !IGNORE_FILE_RE.test(f))
        .sort()
    for (const f of sliceFiles) {
        const key = `stores/slices/${f}`
        const fanIn = nodes.get(key)?.importedBy.size ?? 0
        sliceLines.push(`| \`${f}\` | ${fanIn} |`)
    }
}
sliceLines.push('')
writeFileSync(join(OUT_DIR, 'redux-slice-map.md'), sliceLines.join('\n'), 'utf8')

// 4) README.md -- self-describing (regenerated each run)
const readme = [
    '# .ai-context/codegraph',
    '',
    '**Git-ignored, regenerated locally.** This is the *micro* half of the two-layer context engine',
    '(see `docs/context-engine.md`). It is a fast, repo-wide, AST-derived view of `apps/web` for',
    'targeted reads during a session. It is **not** committed and **not** a CI gate.',
    '',
    '## Files',
    '',
    '- `import-graph.json` — every module → `{ area, imports, importedBy, fanIn, fanOut }`.',
    '- `module-index.md` — modules grouped by area, high-fan-in first (where to start reading).',
    '- `redux-slice-map.md` — the persisted Redux slices and their fan-in.',
    '- `stats.json` — counts + the git HEAD this was generated from.',
    '',
    '## Refresh',
    '',
    '```bash',
    'node ./scripts/codegraph.mjs                       # this micro layer only (fast, local)',
    'graphify update . && node ./scripts/codegraph.mjs  # macro (graphify) + this micro layer',
    '```',
    '',
    '## Macro layer',
    '',
    'For god nodes, communities, and cross-module structure, read `graphify-out/GRAPH_REPORT.md`',
    '(committed, refreshed with `graphify update .`).',
    '',
]
writeFileSync(join(OUT_DIR, 'README.md'), readme.join('\n'), 'utf8')

// 5) stats.json
let head = 'unknown'
try {
    head = execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim()
} catch {
    /* not a git checkout -- leave 'unknown' */
}
writeFileSync(
    join(OUT_DIR, 'stats.json'),
    JSON.stringify(
        {
            modules: sortedKeys.length,
            edges: edgeCount,
            areas: byArea.size,
            parseErrors,
            generatedFrom: head,
        },
        null,
        2,
    ) + '\n',
    'utf8',
)

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const summary = { modules: sortedKeys.length, edges: edgeCount, areas: byArea.size, parseErrors }
if (wantJson) {
    console.log(JSON.stringify(summary, null, 2))
} else {
    console.debug(
        `[OK] codegraph: ${summary.modules} modules, ${summary.edges} edges, ${summary.areas} areas` +
            (parseErrors ? ` (${parseErrors} parse error(s) skipped)` : '') +
            ` -> ${relative(ROOT, OUT_DIR)}`,
    )
}

if (wantCheck) {
    const expected = [
        'import-graph.json',
        'module-index.md',
        'redux-slice-map.md',
        'README.md',
        'stats.json',
    ]
    const missing = expected.filter((f) => !existsSync(join(OUT_DIR, f)))
    if (missing.length > 0 || sortedKeys.length === 0) {
        console.error(
            `[FAIL] codegraph --check: missing ${missing.join(', ') || '(no modules found)'}`,
        )
        process.exit(1)
    }
    console.debug('[OK] codegraph --check: all outputs present.')
}
