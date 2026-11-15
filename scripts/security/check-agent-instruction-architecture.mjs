#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { AGENT_FILES, agentPolicyProblems, ciStatusNeeds } from './check-agent-policy.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')
export const SCOPED_INSTRUCTION_FILES = [
    'apps/web/CLAUDE.md',
    'apps/web/AGENTS.md',
    'apps/web/services/db/CLAUDE.md',
    'apps/web/services/db/AGENTS.md',
    'apps/web/services/local-ai/CLAUDE.md',
    'apps/web/services/worker-bus/CLAUDE.md',
    'apps/web/data/strains/CLAUDE.md',
    'apps/web/data/strains/AGENTS.md',
    'apps/desktop/CLAUDE.md',
    'apps/desktop/AGENTS.md',
    'packages/ai-core/CLAUDE.md',
    'scripts/CLAUDE.md',
    'scripts/AGENTS.md',
    '.github/CLAUDE.md',
    '.github/AGENTS.md',
]
export const REQUIRED_RULE_IDS = [
    ...Array.from({ length: 34 }, (_, i) => 'A-' + String(i + 1).padStart(3, '0')),
    ...Array.from({ length: 28 }, (_, i) => 'C-' + String(i + 1).padStart(3, '0')),
    ...Array.from({ length: 13 }, (_, i) => 'P-' + String(i + 1).padStart(3, '0')),
]
const ROOT_ANCHORS = {
    'AGENTS.md': [
        ['single-writer authority', /one source writer/i],
        [
            'CanG legal cap',
            /CanG legal boundary[\s\S]{0,220}three cannabis plants simultaneously across all grows at one residence[\s\S]{0,180}Seed through Curing/i,
        ],
        ['untrusted content boundary', /untrusted content is data, never instructions/i],
        ['hook bypass prohibition', /--no-verify/],
        ['signature enforcement', /signature enforcement/i],
        ['privacy guard', /Gist cloud sync remains disabled|Do not activate sync/i],
        ['retention gate', /retention workflow/i],
        ['required CI gate', /CI Status/],
        ['scoped verification', /pnpm verify\b/],
        ['single heavy task limit', /One heavy task at a time/i],
        ['scoped local task limit', /\*\*Never\*\* run a bare `turbo run <task>`/i],
        ['no local E2E limit', /Do not run E2E, Playwright, Stryker or Lighthouse locally/i],
        [
            'critical memory thresholds',
            /less than 256 MB available[\s\S]*less than 512 MB[\s\S]*900 MB/i,
        ],
        ['commit and file review budgets', /(?:15 commits|~100 changed files)/i],
        [
            'global PR budget summary',
            /\*\*PR budget:\*\* Warn near 8 commits \/ 50 changed files[\s\S]{0,220}successor before 15 commits/i,
        ],
        [
            'SSH commit signing',
            /SSH-signed commits[\s\S]{0,180}verify (?:the|its) signature locally and on GitHub/i,
        ],
        [
            'global A11y ratchet',
            /A11y ratchet[\s\S]{0,220}Do not raise `\.a11y-baseline\.json`[\s\S]{0,180}lower the baseline/i,
        ],
        [
            'Local-Only no-egress privacy',
            /Local-Only privacy[\s\S]{0,300}no-egress behavior[\s\S]{0,300}Never log user payloads or credentials/i,
        ],
        [
            'SAFE-only unknown retention protection',
            /SAFE-only retention[\s\S]{0,500}`UNKNOWN`, `KEEP`, and `PROTECTED` resources are never deleted/i,
        ],
        [
            'exact-head reviewer coverage',
            /Review coverage[\s\S]{0,300}two of CodeRabbit, CodeAnt,? and Codex must cover the exact current head/i,
        ],
    ],
    'CLAUDE.md': [
        ['binding root rules', /The rules below are \*\*binding\*\*/],
        ['CanG legal cap', /three active plants|MAX_PLANTS_CANG/],
        ['hook bypass prohibition', /--no-verify/],
        ['signed-commit gate', /unsigned commit/i],
        ['accessibility ratchet', /\.a11y-baseline\.json/],
        [
            'global A11y ratchet summary',
            /\*\*A11y ratchet:\*\* The `\.a11y-baseline\.json` must never be raised/i,
        ],
        ['scoped verification', /pnpm verify\b/],
        [
            'accessibility ratchet is monotonic',
            /\.a11y-baseline\.json[\s\S]{0,400}(?:never raise|must never be raised)/i,
        ],
        ['signed commit gate', /unsigned commit/i],
        ['single-writer lease', /writer lease/i],
        ['SAFE-only retention gate', /SAFE-only|retention workflow/i],
        [
            'low-memory thresholds',
            /below 256 MB[\s\S]*below 512 MB with exhausted swap[\s\S]*warn below 900 MB/i,
        ],
        [
            'SSH commit signing',
            /SSH-signed commits[\s\S]{0,180}verify (?:the|its) signature locally and on GitHub/i,
        ],
        [
            'Local-Only no-egress privacy',
            /Local-Only privacy[\s\S]{0,300}no-egress behavior[\s\S]{0,300}Never log user payloads or credentials/i,
        ],
        [
            'SAFE-only unknown retention protection',
            /SAFE-only retention[\s\S]{0,500}(?:`UNKNOWN`, `KEEP`, and `PROTECTED` resources are never deleted|KEEP, PROTECTED, and UNKNOWN resources are not deleted)/i,
        ],
        ['commit and file review budgets', /(?:15 commits|about 100 changed files)/i],
        [
            'global PR budget summary',
            /\*\*PR budget:\*\* Warn near 8 commits \/ 50 changed files[\s\S]{0,220}successor before 15 commits/i,
        ],
        [
            'exact-head reviewer coverage',
            /two of CodeRabbit,\s+CodeAnt,?\s+and Codex\s+(?:must cover|have covered)\s+the exact current head/i,
        ],
    ],
}
const REQUIRED_FIELDS = [
    'id',
    'priority',
    'source',
    'source_ref',
    'requirement',
    'scope',
    'target',
    'mechanical_verification',
    'empirical_verification',
    'status',
]
const NORMATIVE_SOURCE_LINE =
    /\b(?:MUST|NEVER|Never|never|Do not|do not|Always|always|Only|only|required|requires|require|banned|prohibited|should not|should|prefer|preferably|binding|BINDING)\b/i
const ACTION_WORDS =
    'One heavy task at a time|Use|Check|Keep|Split|Run|Read|Verify|Install|Ensure|Treat|Work|Open|Fix|Follow|Record|Count|Warn|Stop|Avoid|Prefer|Confirm|Respect|Compare|Execute|Collect|Wait|Address|Rebase|Merge|Include|Format|Add|Create|Update|Choose|Measure|Capture|Inspect|Preserve|Filter|Pin|Set|Consider|Ask|Review|Test|Validate|Probe|Load|Link|Retain|Delete|Remove|Start|Finish|Document|Close|Refuse|Route|Diagnose|Honor|Return|Export|Import|Display|Show|Store|Persist|Dispatch|Cancel|Abort|Dispose|Guard|Serialize|Derive|Fetch|Resolve|Provide|Configure|Allow|Disallow|Block|Ban|Consult|Watch|Omit|Prepare'
export function isNormativeSourceLine(line) {
    const tick = String.fromCharCode(96)
    const visible = String(line).replace(new RegExp(tick + '[^' + tick + '\\n]*' + tick, 'g'), ' ')
    const listAction = new RegExp('^\\s*(?:[-*+]|\\d+\\.)\\s+(?:' + ACTION_WORDS + ')\\b', 'i')
    if (NORMATIVE_SOURCE_LINE.test(visible) || listAction.test(visible)) return true
    const labeled = /^\s*(?:[-*+]|\d+\.)\s+\*\*([^*]+)\*\*\s*(?::|--|\.{1,3})?\s*(.*)$/.exec(
        visible,
    )
    if (!labeled) return false
    if (new RegExp('^(?:' + ACTION_WORDS + ')\\b', 'i').test(labeled[1].trim())) return true
    const tail = labeled[2]
    if (/\bneeds an explicit owner decision\b/i.test(tail)) return true
    if (/\bneeds Rust\s*\+\s*Tauri v2\b/i.test(tail)) return true
    if (/\bowns (?:the|all) \d+\b/i.test(tail)) return true
    if (/\bre-read before relying on it\b/i.test(tail)) return true
    const direct = new RegExp(
        '^(?:(?:after\\b[^,]{1,160},\\s*)|(?:for\\b[^,]{1,120},\\s*)|(?:then\\s+))*(?:' +
            ACTION_WORDS +
            ')\\b',
        'i',
    )
    const afterClause = new RegExp(
        '(?:[;.!?]\\s+|--\\s+|:\\s+|,\\s+)(?:then\\s+)?(?:' + ACTION_WORDS + ')\\b',
        'i',
    )
    return direct.test(tail.trim()) || afterClause.test(tail)
}
export function traceabilityProblems(traceability, markdownText) {
    const problems = []
    if (!traceability || !Array.isArray(traceability.rules)) {
        return ['traceability JSON has no rules array']
    }
    const rules = traceability.rules
    const ids = rules.map((rule) => rule && rule.id).filter(Boolean)
    const seen = new Set()
    for (const id of ids) {
        if (seen.has(id)) problems.push('duplicate traceability rule ' + id)
        seen.add(id)
    }
    for (const id of REQUIRED_RULE_IDS) {
        if (!seen.has(id)) problems.push('missing required traceability rule ' + id)
    }
    for (const rule of rules) {
        for (const field of REQUIRED_FIELDS) {
            if (!rule || !rule[field]) problems.push((rule?.id || 'unknown') + ': missing ' + field)
        }
        if (rule && (rule.source === 'AGENTS.md' || rule.source === 'CLAUDE.md')) {
            const range = rule.source_lines || []
            const start = range[0]
            const end = range[1]
            if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
                problems.push(rule.id + ': invalid source line range')
            } else if (String(rule.source_excerpt || '').split('\n').length !== end - start + 1) {
                problems.push(rule.id + ': source excerpt does not match its line range')
            }
            const ref = new RegExp(
                '^' + rule.source.replace('.', '\\.') + ':' + start + '(?:-' + end + ')?$',
            )
            if (!ref.test(rule.source_ref || ''))
                problems.push(rule.id + ': source_ref does not match source_lines')
        } else if (rule && rule.source === 'PR #777' && !/:[1-9]\d*/.test(rule.source_ref || '')) {
            problems.push(rule.id + ': missing live PR diff line location')
        }
        if (rule && (typeof rule.requirement !== 'string' || rule.requirement.trim().length < 20)) {
            problems.push(
                (rule.id || 'unknown') + ': requirement is too vague to trace independently',
            )
        }
        if (
            rule &&
            (!/\b(test|check|assert|validate|probe|review|compare|readback|evidence|verify|verification)\b/i.test(
                rule.mechanical_verification || '',
            ) ||
                !/\b(test|check|assert|validate|probe|review|compare|readback|evidence|verify|verification|NOT YET)\b/i.test(
                    rule.empirical_verification || '',
                ))
        ) {
            problems.push(
                (rule.id || 'unknown') + ': verification fields must describe concrete evidence',
            )
        }
    }
    if (markdownText !== undefined) {
        const destinationStart = markdownText.indexOf('## Destination path traceability')
        const canonicalMatrixText =
            destinationStart < 0 ? markdownText : markdownText.slice(0, destinationStart)
        const markdownIds = [...canonicalMatrixText.matchAll(/^\|\s*((?:A|C|P)-\d{3})\s*\|/gm)].map(
            (m) => m[1],
        )
        if (new Set(markdownIds).size !== markdownIds.length)
            problems.push('duplicate IDs in canonical TRACEABILITY.md matrix')
        if (new Set(markdownIds).size !== seen.size || markdownIds.some((id) => !seen.has(id))) {
            problems.push('TRACEABILITY.md and traceability.json IDs differ')
        }
    }
    problems.push(...destinationPathProblems(traceability, markdownText))
    return problems
}

/** Validate source excerpts against immutable files captured from baseline_commit. */
export function destinationPathProblems(traceability, markdownText, root = ROOT) {
    const problems = []
    const entries = [
        ...(traceability?.rules || []),
        ...(traceability?.cross_agent_invariants || []),
    ]
    const markdown = typeof markdownText === 'string' ? markdownText : ''
    const destinationStart = markdown.indexOf('## Destination path traceability')
    const destinationMarkdown = destinationStart < 0 ? '' : markdown.slice(destinationStart)
    if (destinationStart < 0)
        problems.push('TRACEABILITY.md is missing the destination path traceability section')
    const ids = new Set()
    for (const entry of entries) {
        if (!entry?.id || ids.has(entry.id))
            problems.push('destination matrix has a missing or duplicate rule ID')
        ids.add(entry?.id)
        const destinations = entry?.destination_paths
        if (!Array.isArray(destinations) || destinations.length === 0) {
            problems.push(String(entry?.id || 'unknown') + ' has no destination_paths')
            continue
        }
        if (new Set(destinations).size !== destinations.length)
            problems.push(entry.id + ' has duplicate destination paths')
        for (const destination of destinations) {
            if (
                typeof destination !== 'string' ||
                destination.startsWith('/') ||
                destination.includes('\\') ||
                destination.split('/').some((part) => !part || part === '.' || part === '..')
            ) {
                problems.push(entry.id + ' has an unsafe destination path: ' + String(destination))
                continue
            }
            try {
                readFileSync(root + '/' + destination)
            } catch {
                problems.push(entry.id + ' destination does not exist: ' + destination)
            }
        }
        const row = destinationMarkdown.split(/\r?\n/).find((line) => {
            const cells = line.split('|')
            return cells.length >= 3 && cells[1].trim() === entry.id
        })
        if (!row) problems.push(entry.id + ' is missing from the rendered destination matrix')
        else
            for (const destination of destinations)
                if (!row.includes('`' + destination + '`'))
                    problems.push(entry.id + ' rendered row omits ' + destination)
    }
    const parentIds = new Set(
        (traceability?.rules || [])
            .filter(
                (rule) =>
                    Array.isArray(rule.destination_paths) && rule.destination_paths.length > 0,
            )
            .map((rule) => rule.id),
    )
    for (const claim of traceability?.source_claims || [])
        if (!parentIds.has(claim.parent_rule_id))
            problems.push(
                claim.claim_id + ' inherits no mapped destination from ' + claim.parent_rule_id,
            )
    return problems
}

export function baselineSourceProblems(traceability, sourceSnapshots) {
    const problems = []
    const baseline = traceability?.baseline_commit
    if (!/^[a-f0-9]{40}$/.test(baseline || '')) return ['baseline_commit must be a full commit SHA']
    for (const file of ['AGENTS.md', 'CLAUDE.md']) {
        const manifest = traceability?.root_sources?.[file]
        const raw = sourceSnapshots?.[file]
        if (!manifest || raw === undefined) {
            problems.push('baseline source unavailable: ' + file)
            continue
        }
        const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw, 'utf8')
        const text = bytes.toString('utf8')
        const digest = createHash('sha256').update(bytes).digest('hex')
        if (digest !== manifest.sha256) problems.push(file + ': baseline SHA-256 mismatch')
        if (bytes.length !== manifest.bytes) problems.push(file + ': baseline byte count mismatch')
        if ((text.match(/\n/g) || []).length !== manifest.lines)
            problems.push(file + ': baseline newline-terminated line count mismatch')
        const lines = text.split('\n')
        for (const rule of traceability.rules || []) {
            if (rule.source !== file || !Array.isArray(rule.source_lines)) continue
            const [start, end] = rule.source_lines
            const excerpt = lines.slice(start - 1, end).join('\n')
            if (excerpt !== rule.source_excerpt)
                problems.push(
                    rule.id +
                        ': source excerpt differs from baseline blob lines ' +
                        start +
                        '-' +
                        end,
                )
        }
    }
    return problems
}

/** Require every imperative baseline source line to have a direct rule mapping. */
export function normativeSourceCoverageProblems(traceability, sourceSnapshots) {
    const problems = []
    for (const file of ['AGENTS.md', 'CLAUDE.md']) {
        const raw = sourceSnapshots?.[file]
        if (raw === undefined) continue
        const lines = Buffer.from(raw).toString('utf8').split('\n')
        for (let index = 0; index < lines.length; index += 1) {
            if (!isNormativeSourceLine(lines[index])) continue
            const lineNumber = index + 1
            const mapped = (traceability.rules || []).filter(
                (rule) =>
                    rule.source === file &&
                    Array.isArray(rule.source_lines) &&
                    rule.source_lines[0] <= lineNumber &&
                    rule.source_lines[1] >= lineNumber,
            )
            if (mapped.length === 0)
                problems.push(file + ': unmapped normative baseline line ' + lineNumber)
            if (mapped.length > 1)
                problems.push(
                    file +
                        ': multiply mapped normative baseline line ' +
                        lineNumber +
                        ' (' +
                        mapped.map((rule) => rule.id).join(', ') +
                        ')',
                )
        }
    }
    return problems
}

const CODEX_LOADER_CONTEXTS = {
    root: ['AGENTS.md'],
    web: ['AGENTS.md', 'apps/web/AGENTS.md'],
    database: ['AGENTS.md', 'apps/web/AGENTS.md', 'apps/web/services/db/AGENTS.md'],
    local_ai: ['AGENTS.md', 'apps/web/AGENTS.md'],
    worker_bus: ['AGENTS.md', 'apps/web/AGENTS.md'],
    strains: ['AGENTS.md', 'apps/web/AGENTS.md', 'apps/web/data/strains/AGENTS.md'],
    desktop: ['AGENTS.md', 'apps/desktop/AGENTS.md'],
    ai_core: ['AGENTS.md'],
    scripts: ['AGENTS.md', 'scripts/AGENTS.md'],
    github: ['AGENTS.md', '.github/AGENTS.md'],
}
const CODEX_LOADER_CWDS = {
    root: '.',
    web: 'apps/web',
    database: 'apps/web/services/db',
    local_ai: 'apps/web/services/local-ai',
    worker_bus: 'apps/web/services/worker-bus',
    strains: 'apps/web/data/strains',
    desktop: 'apps/desktop',
    ai_core: 'packages/ai-core',
    scripts: 'scripts',
    github: '.github',
}
const CODEX_LOADER_HASH_PATHS = ['AGENTS.md', 'CLAUDE.md', ...SCOPED_INSTRUCTION_FILES]
const CLAUDE_LOADER_HASH_PATHS = CODEX_LOADER_HASH_PATHS
const CLAUDE_LOADER_CONTEXTS = {
    root: { cwd: '.', present: ['root'], order: ['root'] },
    web: { cwd: 'apps/web', present: ['root', 'web'], order: ['root', 'web'] },
    database: {
        cwd: 'apps/web/services/db',
        present: ['root', 'web', 'database'],
        order: ['root', 'web', 'database'],
    },
    local_ai: {
        cwd: 'apps/web/services/local-ai',
        present: ['root', 'web', 'local_ai'],
        order: ['root', 'web', 'local_ai'],
    },
    worker_bus: {
        cwd: 'apps/web/services/worker-bus',
        present: ['root', 'web', 'worker_bus'],
        order: ['root', 'web', 'worker_bus'],
    },
    strains: {
        cwd: 'apps/web/data/strains',
        present: ['root', 'web', 'strains'],
        order: ['root', 'web', 'strains'],
    },
    desktop: { cwd: 'apps/desktop', present: ['root', 'desktop'], order: ['root', 'desktop'] },
    ai_core: { cwd: 'packages/ai-core', present: ['root', 'ai_core'], order: ['root', 'ai_core'] },
    scripts: { cwd: 'scripts', present: ['root', 'scripts'], order: ['root', 'scripts'] },
    github: { cwd: '.github', present: ['root', 'github'], order: ['root', 'github'] },
}

export const PR777_ADOPTION_REQUIREMENTS = [
    {
        id: 'P-001',
        file: 'AGENTS.md',
        label: 'stable-head root-cause batching',
        testRef: 'check-agent-instruction-architecture.test.mjs: P-001 adoption anchor',
        pattern:
            /One stable-head correction[\s\S]{0,700}group them by root cause[\s\S]{0,400}ship one signed corrective commit/,
    },
    {
        id: 'P-002',
        file: 'docs/PR-REVIEW-LOOP.md',
        label: 'no repeat review for no-code refutation',
        testRef: 'check-agent-instruction-architecture.test.mjs: P-002 adoption anchor',
        pattern:
            /false positive refuted with evidence and resolved without a code change[\s\S]{0,180}does not require another fresh review/,
    },
    {
        id: 'P-003',
        file: 'CLAUDE.md',
        label: 'two exact-head reviewers',
        testRef: 'check-agent-instruction-architecture.test.mjs: P-003 adoption anchor',
        pattern: /two of CodeRabbit,\s+CodeAnt,\s+and Codex have covered the exact current head/,
    },
    {
        id: 'P-004',
        file: 'docs/PR-REVIEW-LOOP.md',
        label: 'unavailable review is not a merge block after coverage',
        testRef: 'check-agent-instruction-architecture.test.mjs: P-004 adoption anchor',
        pattern:
            /REVIEW_UNAVAILABLE[\s\S]{0,300}not a green check[\s\S]{0,200}not a merge block once two of those reviewers have covered/,
    },
    {
        id: 'P-005',
        file: 'docs/PR-REVIEW-LOOP.md',
        label: 'single Codex review request per unanswered head',
        testRef: 'check-agent-instruction-architecture.test.mjs: P-005 adoption anchor',
        pattern:
            /chatgpt-codex-connector\[bot\][\s\S]{0,200}has no non-dismissed review on that head[\s\S]{0,100}comment\s+`@codex review` once[\s\S]{0,250}Do not send a second `@codex review`/,
    },
    {
        id: 'P-006',
        file: 'scripts/security/review-coverage.test.mjs',
        label: 'query behavior regression cases',
        testRef: 'review-coverage.test.mjs: exact-head/newest/dismissed-login cases',
        pattern:
            /(?=[\s\S]*the documented query keeps the newest review per bot login on the head)(?=[\s\S]*names without the \[bot\] suffix match nothing)(?=[\s\S]*a dismissed-only login, a silent reviewer, and a trial notice add no row)[\s\S]*/,
    },
    {
        id: 'P-007',
        file: 'docs/PR-REVIEW-LOOP.md',
        label: 'paginated issue-comment findings',
        testRef: 'check-agent-instruction-architecture.test.mjs: P-007 adoption anchor',
        pattern:
            /(?=[\s\S]*gh api --paginate repos\/qnbs\/CannaGuide-2025\/issues\/<N>\/comments)(?=[\s\S]*A finding that lives only in a paginated issue comment counts the same way)[\s\S]*/,
    },
    {
        id: 'P-008',
        file: 'docs/PR-REVIEW-LOOP.md',
        label: 'commit and head citations',
        testRef: 'check-agent-instruction-architecture.test.mjs: P-008 adoption anchor',
        pattern:
            /Cite the resolving commit SHA[\s\S]{0,180}refutation that changes no code cites the current head SHA/,
    },
    {
        id: 'P-009',
        file: 'AGENTS.md',
        label: 'thresholds and preserved PR #757 exception',
        testRef: 'check-agent-instruction-architecture.test.mjs: P-009 adoption anchor',
        pattern:
            /Warn near 8 commits \/ 50 files[\s\S]{0,300}12 \/ 75[\s\S]{0,300}15 commits[\s\S]{0,300}#757[\s\S]{0,100}6b57be331c9841545c5de2a0dfcbfe9d1e77552b/,
    },
    {
        id: 'P-010',
        file: 'docs/PR-REVIEW-LOOP.md',
        label: 'remote-parent and whole-stack counting',
        testRef: 'check-agent-instruction-architecture.test.mjs: P-010 adoption anchor',
        pattern:
            /PARENT_BRANCH=feature\/previous[\s\S]{0,100}PARENT_REF=\"origin\/\$\{PARENT_BRANCH\}\"[\s\S]{0,160}git merge-base \"\$PARENT_REF\" HEAD[\s\S]{0,180}git merge-base origin\/main HEAD/,
    },
    {
        id: 'P-011',
        file: '.github/workflows/ci.yml',
        label: 'review coverage suite routed through CI',
        testRef: 'check-agent-instruction-architecture.test.mjs: P-011 adoption anchor',
        pattern:
            /(?=[\s\S]*review-coverage)(?=[\s\S]*node --test --test-concurrency=1 \.\/scripts\/security\/\*\.test\.mjs)[\s\S]*/,
    },
    {
        id: 'P-012',
        file: 'CHANGELOG.md',
        label: 'retained review-loop changelog entry',
        testRef: 'check-agent-instruction-architecture.test.mjs: P-012 adoption anchor',
        pattern: /\*\*docs\(review\):\*\*[^\n]{0,800}stable pull-request head/i,
    },
    {
        id: 'P-013',
        file: 'docs/PR-REVIEW-LOOP.md',
        label: 'unavailable review is not positive coverage',
        testRef: 'check-agent-instruction-architecture.test.mjs: P-013 adoption anchor',
        pattern:
            /(?=[\s\S]*REVIEW_UNAVAILABLE)(?=[\s\S]*A review counts only when its `commit_id` is the current head)(?=[\s\S]*state is not `DISMISSED`)[\s\S]*/,
    },
]

export function pr777AdoptionProblems(files, traceability) {
    const problems = []
    for (const requirement of PR777_ADOPTION_REQUIREMENTS) {
        const text = files?.[requirement.file]
        if (typeof text !== 'string' || !requirement.pattern.test(text)) {
            problems.push(requirement.id + ': missing adoption evidence for ' + requirement.label)
        }
        const rule = traceability?.rules?.find((item) => item.id === requirement.id)
        if (
            !rule ||
            /Fixture P-\d+ accepts valid current-head evidence[\s\S]*as applicable/i.test(
                rule.mechanical_verification || '',
            )
        ) {
            problems.push(
                requirement.id + ': traceability still has generic mechanical verification',
            )
        } else if (!rule.mechanical_verification.includes(requirement.testRef)) {
            problems.push(
                requirement.id + ': mechanical verification does not name ' + requirement.testRef,
            )
        }
        if (rule) {
            if (!rule.priority || !rule.source_ref || !rule.scope || !rule.target) {
                problems.push(
                    requirement.id +
                        ': traceability is missing priority, source position, scope, or destination',
                )
            }
            if (rule.status === 'INVENTORIED') {
                problems.push(requirement.id + ': adopted PR #777 rule is still only inventoried')
            }
            if (
                /Compare fixture output with live exact-head review\/check census[\s\S]*as positive coverage/i.test(
                    rule.empirical_verification || '',
                ) ||
                !/immutable PR #777 (?:blob|source) evidence/i.test(
                    rule.empirical_verification || '',
                ) ||
                !/local adoption/i.test(rule.empirical_verification || '') ||
                !/reread.*(?:live|current).*PR/i.test(rule.empirical_verification || '')
            ) {
                problems.push(
                    requirement.id +
                        ': empirical verification must distinguish immutable source proof, local adoption, and live PR readback',
                )
            }
        }
    }
    return problems
}

export function codexLoaderEvidenceProblems(evidence, currentHashes) {
    const problems = []
    if (evidence?.tool !== 'Codex CLI' || !/\d+\.\d+\.\d+/.test(evidence?.version || '')) {
        problems.push('Codex loader evidence lacks the tool name or version')
    }
    if (!/^[a-f0-9]{40}$/.test(evidence?.base_commit || ''))
        problems.push('Codex loader evidence lacks a full base SHA')
    if (
        !evidence?.out_of_scope_check ||
        evidence.out_of_scope_check.root_CLAUDE_md_loaded_by_Codex !== false
    ) {
        problems.push('Codex loader evidence does not prove root CLAUDE.md is absent')
    }
    if (evidence?.out_of_scope_check?.nested_CLAUDE_paths_loaded_by_Codex !== false) {
        problems.push('Codex loader evidence does not prove nested CLAUDE.md paths are absent')
    }
    if (evidence?.out_of_scope_check?.apps_web_AGENTS_absent_from_desktop !== true) {
        problems.push(
            'Codex loader evidence does not prove apps/web/AGENTS.md is out of scope for desktop',
        )
    }
    if (evidence?.out_of_scope_check?.marker_unique_across_local_instruction_files !== true) {
        problems.push('Codex loader evidence does not prove its marker is unique')
    }
    const contexts = Array.isArray(evidence?.contexts) ? evidence.contexts : []
    const knownCwds = new Set(Object.values(CODEX_LOADER_CWDS))
    const seenCwds = new Set()
    for (const context of contexts) {
        if (seenCwds.has(context?.cwd))
            problems.push('Codex loader context is duplicated: ' + context?.cwd)
        seenCwds.add(context?.cwd)
        if (!knownCwds.has(context?.cwd))
            problems.push('Codex loader context is unexpected: ' + context?.cwd)
    }
    for (const [name, expected] of Object.entries(CODEX_LOADER_CONTEXTS)) {
        const context = contexts.find((item) => item.cwd === CODEX_LOADER_CWDS[name])
        if (!context) {
            problems.push('Codex loader context missing: ' + name)
            continue
        }
        if (context.exit_code !== 0) problems.push('Codex loader context failed: ' + name)
        if (
            !Array.isArray(context.loaded) ||
            JSON.stringify(context.loaded) !== JSON.stringify(expected)
        ) {
            problems.push('Codex loaded paths differ from expected scope: ' + name)
        }
        if ((context.missing || []).length)
            problems.push('Codex expected files missing from prompt: ' + name)
        if ((context.unexpected_out_of_scope || []).length)
            problems.push('Codex loaded out-of-scope files: ' + name)
    }
    for (const file of CODEX_LOADER_HASH_PATHS) {
        const recorded = evidence?.instruction_file_sha256?.[file]
        if (!recorded || recorded !== currentHashes?.[file])
            problems.push('Codex loader evidence is stale for ' + file)
    }
    return problems
}

/** Validate bounded, no-egress Claude prompt marker probes without retaining prompt content. */
export function claudeLoaderEvidenceProblems(evidence, currentHashes, expectedBaseCommit) {
    const problems = []
    if (evidence?.schema_version !== 1)
        problems.push('Claude loader evidence has an unsupported schema version')
    if (
        evidence?.tool?.name !== 'Claude Code CLI' ||
        !/^\d+\.\d+\.\d+$/.test(evidence?.tool?.version || '')
    ) {
        problems.push('Claude loader evidence lacks the tool name or version')
    }
    if (!/^[a-f0-9]{40}$/.test(evidence?.base_commit || ''))
        problems.push('Claude loader evidence lacks a full base SHA')
    if (expectedBaseCommit && evidence?.base_commit !== expectedBaseCommit)
        problems.push('Claude loader evidence is for a different base commit')
    if (!Number.isFinite(Date.parse(evidence?.observed_at_utc || '')))
        problems.push('Claude loader evidence lacks a valid observation timestamp')
    const isolation = evidence?.isolation || {}
    if (isolation.network_namespace !== 'bubblewrap --unshare-user --unshare-net') {
        problems.push('Claude loader evidence does not prove an unshared network namespace')
    }
    if (isolation.network_route_count !== 0 || isolation.external_probe_result !== 'ENETUNREACH') {
        problems.push(
            'Claude loader evidence does not prove zero routes and blocked external egress',
        )
    }
    if (
        isolation.api_target !== 'in-memory local mock on 127.0.0.1' ||
        isolation.raw_prompt_persisted !== false
    ) {
        problems.push(
            'Claude loader evidence does not prove a local-only mock with no prompt persistence',
        )
    }
    if (evidence?.host_level_instruction_files?.paths_redacted !== true) {
        problems.push('Claude loader evidence must redact host-level instruction paths')
    }
    const contexts = Array.isArray(evidence?.contexts) ? evidence.contexts : []
    const knownCwds = new Set(Object.values(CLAUDE_LOADER_CONTEXTS).map((context) => context.cwd))
    const seenCwds = new Set()
    for (const context of contexts) {
        if (seenCwds.has(context?.cwd))
            problems.push('Claude loader context is duplicated: ' + context?.cwd)
        seenCwds.add(context?.cwd)
        if (!knownCwds.has(context?.cwd))
            problems.push('Claude loader context is unexpected: ' + context?.cwd)
    }
    for (const [name, expected] of Object.entries(CLAUDE_LOADER_CONTEXTS)) {
        const context = contexts.find((item) => item.cwd === expected.cwd)
        if (!context) {
            problems.push('Claude loader context missing: ' + name)
            continue
        }
        if (
            context.cli_exit_code !== 0 ||
            context.request_captured !== true ||
            context.mock_response_received !== true
        ) {
            problems.push('Claude local mock request did not complete: ' + name)
        }
        if (context.raw_prompt_recorded !== false || context.only_in_memory !== true) {
            problems.push('Claude probe must inspect prompt markers in memory only: ' + name)
        }
        const present = expected.present
        for (const marker of Object.keys(CLAUDE_LOADER_CONTEXTS)) {
            const observed = context.marker_results?.[marker]
            const shouldBePresent = present.includes(marker)
            if (observed?.present !== shouldBePresent) {
                problems.push('Claude prompt marker scope differs for ' + name + ': ' + marker)
            } else if (
                shouldBePresent &&
                (!Number.isInteger(observed.position) ||
                    observed.position < 0 ||
                    !/^\$\.messages\[\d+\]\.content\[\d+\]\.text$/.test(
                        observed.payload_path || '',
                    ))
            ) {
                problems.push(
                    'Claude prompt marker lacks payload location evidence for ' +
                        name +
                        ': ' +
                        marker,
                )
            } else if (
                !shouldBePresent &&
                (observed?.position !== -1 || observed?.payload_path !== null)
            ) {
                problems.push(
                    'Claude absent marker has inconsistent evidence for ' + name + ': ' + marker,
                )
            }
        }
        if (JSON.stringify(context.marker_order) !== JSON.stringify(expected.order)) {
            problems.push('Claude prompt precedence order differs for ' + name)
        }
    }
    for (const file of CLAUDE_LOADER_HASH_PATHS) {
        const recorded = evidence?.instruction_file_sha256?.[file]
        if (!recorded || recorded !== currentHashes?.[file])
            problems.push('Claude loader evidence is stale for ' + file)
    }
    return problems
}

export function splitSourceClaims(line) {
    return String(line)
        .split(/;\s+|(?<=[.!?])\s+(?=[A-Z])/)
        .map((fragment) => fragment.trim())
        .filter(Boolean)
}

/** Validate sentence/clause claims against immutable root source lines. */
export function sourceClaimProblems(traceability, sourceSnapshots) {
    const problems = []
    const claims = traceability?.source_claims
    if (!Array.isArray(claims)) return ['traceability JSON has no source_claims array']
    const rules = traceability.rules || []
    const ids = new Set()
    const perLine = new Map()
    for (const claim of claims) {
        if (
            !claim?.claim_id ||
            !claim?.parent_rule_id ||
            !claim?.source ||
            !Number.isInteger(claim?.source_line) ||
            !claim?.source_ref ||
            !claim?.source_line_text ||
            !claim?.source_claim ||
            !claim?.priority ||
            !claim?.scope ||
            !claim?.target ||
            !claim?.mechanical_verification ||
            !claim?.empirical_verification ||
            !claim?.status
        ) {
            problems.push(
                (claim?.claim_id || 'unknown claim') + ': missing required claim evidence',
            )
            continue
        }
        if (ids.has(claim.claim_id)) problems.push('duplicate source claim ' + claim.claim_id)
        ids.add(claim.claim_id)
        const key = claim.source + ':' + claim.source_line
        perLine.set(key, [...(perLine.get(key) || []), claim])
        const parent = rules.find((rule) => rule.id === claim.parent_rule_id)
        if (
            !parent ||
            parent.source !== claim.source ||
            !Array.isArray(parent.source_lines) ||
            claim.source_line < parent.source_lines[0] ||
            claim.source_line > parent.source_lines[1]
        ) {
            problems.push(claim.claim_id + ': invalid parent rule or source scope')
        } else if (
            claim.priority !== parent.priority ||
            claim.scope !== parent.scope ||
            claim.target !== parent.target
        ) {
            problems.push(claim.claim_id + ': priority, scope, or target differs from parent rule')
        } else if (
            claim.empirical_verification !== parent.empirical_verification ||
            claim.status !== parent.status
        ) {
            problems.push(
                claim.claim_id + ': empirical or status evidence differs from parent rule',
            )
        }
        const source = sourceSnapshots?.[claim.source]
        if (source === undefined) {
            problems.push(claim.claim_id + ': baseline source unavailable')
            continue
        }
        const line = Buffer.from(source).toString('utf8').split('\n')[claim.source_line - 1]
        if (line !== claim.source_line_text || !line?.includes(claim.source_claim)) {
            problems.push(
                claim.claim_id + ': exact source line or claim fragment differs from baseline',
            )
        }
        if (claim.source_ref !== claim.source + ':' + claim.source_line) {
            problems.push(claim.claim_id + ': source_ref does not match source position')
        }
    }
    for (const file of ['AGENTS.md', 'CLAUDE.md']) {
        const raw = sourceSnapshots?.[file]
        if (raw === undefined) continue
        const lines = Buffer.from(raw).toString('utf8').split('\n')
        for (let index = 0; index < lines.length; index += 1) {
            if (!isNormativeSourceLine(lines[index])) continue
            const line = index + 1
            const expected = splitSourceClaims(lines[index])
            const actual = perLine.get(file + ':' + line) || []
            if (
                actual.length !== expected.length ||
                expected.some((fragment, part) => actual[part]?.source_claim !== fragment)
            ) {
                problems.push(
                    file +
                        ':' +
                        line +
                        ': source claims missing, duplicated, or not in source order',
                )
            }
        }
    }
    for (const claim of claims) {
        if (
            claim?.source &&
            Number.isInteger(claim.source_line) &&
            !perLine.has(claim.source + ':' + claim.source_line)
        )
            problems.push(claim.claim_id + ': orphan source claim')
    }
    return problems
}

export function pr777EvidenceProblems(traceability, evidence) {
    const problems = []
    const pr = traceability?.pr_777
    if (
        !pr ||
        evidence?.pull_request !== 777 ||
        evidence?.state !== 'open' ||
        evidence?.base !== 'main'
    ) {
        problems.push('PR #777 source evidence has unexpected identity or state')
        return problems
    }
    if (evidence.head_sha !== pr.headRefOid)
        problems.push('PR #777 source evidence is for a stale head')
    if (
        !/source blobs, full-file hashes, line counts, cited-line text and line hashes only/i.test(
            evidence.source_evidence_scope || '',
        )
    ) {
        problems.push(
            'PR #777 evidence does not distinguish source verification from adoption verification',
        )
    }
    const expectedIds = (traceability.rules || [])
        .filter((rule) => rule.source === 'PR #777')
        .map((rule) => rule.id)
        .sort()
    const evidencedIds = [...(evidence.source_verified_rule_ids || [])].sort()
    if (JSON.stringify(expectedIds) !== JSON.stringify(evidencedIds))
        problems.push('PR #777 source-verified rule IDs differ from the traceability matrix')
    for (const rule of (traceability.rules || []).filter((item) => item.source === 'PR #777')) {
        for (const ref of (rule.source_ref || '').split('; ')) {
            const match = /^(.+?):([1-9]\d*)(?:-([1-9]\d*))?$/.exec(ref)
            if (!match) {
                problems.push(rule.id + ': malformed PR #777 source reference')
                continue
            }
            const [, file, startText, endText] = match
            const start = Number(startText)
            const end = Number(endText || startText)
            const record = evidence.files?.[file]
            if (
                !record ||
                !/^[a-f0-9]{40}$/.test(record.blob_sha || '') ||
                !/^[a-f0-9]{64}$/.test(record.sha256 || '')
            ) {
                problems.push(rule.id + ': missing immutable PR source blob evidence for ' + file)
                continue
            }
            if (end > record.line_count)
                problems.push(rule.id + ': PR source line exceeds recorded blob length')
            for (let line = start; line <= end; line += 1) {
                const lineKey = String(line)
                const recordedHash = record.line_hashes?.[lineKey]
                const sourceLine = record.line_texts?.[lineKey]
                if (typeof sourceLine !== 'string' || !/^[a-f0-9]{64}$/.test(recordedHash || '')) {
                    problems.push(
                        rule.id + ': missing PR source line evidence for ' + file + ':' + line,
                    )
                    continue
                }
                const computedHash = createHash('sha256').update(sourceLine, 'utf8').digest('hex')
                if (computedHash !== recordedHash) {
                    problems.push(
                        rule.id + ': PR source line hash mismatch for ' + file + ':' + line,
                    )
                }
            }
        }
    }
    return problems
}

export function rootAnchorProblems(rootFiles) {
    const problems = []
    for (const [name, anchors] of Object.entries(ROOT_ANCHORS)) {
        const text = rootFiles[name] || ''
        for (const [label, pattern] of anchors) {
            if (!pattern.test(text)) problems.push(name + ': missing global ' + label)
        }
    }
    return problems
}

const NEGATED_POLICY_LANGUAGE =
    /\b(?:do not|don't|never|must not|cannot|prohibited|forbidden|unsupported|outside the supported)\b/i
const POLICY_ACTION_SOURCE = String.raw`(?:use|install|pin|require|run(?:\s+on)?|raise|increase|expand|grow|enable|activate|turn\s+on|delete|remove|allow|permit|accept|budget|bypass)`
const POLICY_ACTION_LANGUAGE = new RegExp(String.raw`\b${POLICY_ACTION_SOURCE}\b`, 'gi')
const CONFLICT_CLAUSE_BOUNDARY = new RegExp(
    String.raw`[;!?]|\b(?:but|however|instead|then|unless|otherwise|except)\b|(?:,|\b(?:and|or)\b)(?=\s*${POLICY_ACTION_SOURCE}\b)`,
    'gi',
)
const SCOPED_CONFLICTS = [
    [
        'unsupported Node.js major',
        /\b(?:use|install|pin|require|run on)\s+(?:the\s+)?Node(?:\.js)?\s*(?:v|>=|=)?\s*(\d+)(?:\.(\d+))?(?:\.\d+)?\b/i,
        (match) => Number(match[1]) !== 24 || Number(match[2] || 0) < 15,
    ],
    [
        'accessibility baseline growth',
        /\b(?:raise|increase|expand|grow)\b.{0,60}(?:\.a11y-baseline\.json|accessibility baseline|a11y baseline)/i,
    ],
    [
        'privacy integration activation',
        /\b(?:enable|activate|turn on)\b.{0,60}(?:Gist sync|cloud sync|Sentry|Replay)\b/i,
    ],
    [
        'deletion of unproven retention candidates',
        /\b(?:delete|remove)\b.{0,80}\b(?:unknown|unverified|unproven|all old|all preview)\b/i,
    ],
    [
        'multiple concurrent source writers',
        /\ballow\b.{0,40}\b(?:multiple|two|parallel|concurrent)\b.{0,40}\b(?:source writers?|operators?)\b/i,
    ],
    [
        'PR commit budget above 15',
        /\b(?:allow|permit|accept|budget)\b.{0,30}\b(\d+)\s+commits?\b/i,
        (match) => Number(match[1]) > 15,
    ],
]

function conflictMatchIsNegated(clause, index, length) {
    const before = clause.slice(0, index)
    const after = clause.slice(index + length)
    const negations = [...before.matchAll(new RegExp(NEGATED_POLICY_LANGUAGE.source, 'gi'))]
    const actions = [...before.matchAll(POLICY_ACTION_LANGUAGE)]
    const lastNegation = negations.at(-1)
    const lastAction = actions.at(-1)
    const prefixNegatesMatch =
        lastNegation && (!lastAction || lastNegation.index > lastAction.index)
    return (
        prefixNegatesMatch ||
        /\b(?:is|are)\s+(?:not allowed|prohibited|forbidden|unsupported)\b/i.test(after)
    )
}

/** Reject affirmative scoped guidance that contradicts repository-wide safeguards. */
export function scopedInstructionConflictProblems(scopedFiles) {
    const problems = []
    for (const [file, text] of Object.entries(scopedFiles || {})) {
        for (const line of String(text || '').split('\n')) {
            const labels = new Set()
            for (const clause of line.split(CONFLICT_CLAUSE_BOUNDARY)) {
                for (const [label, pattern, applies = () => true] of SCOPED_CONFLICTS) {
                    const matcher = new RegExp(pattern.source, pattern.flags + 'g')
                    let offset = 0
                    while (offset <= clause.length) {
                        matcher.lastIndex = offset
                        const match = matcher.exec(clause)
                        if (!match) break
                        if (
                            applies(match) &&
                            !conflictMatchIsNegated(clause, match.index, match[0].length)
                        ) {
                            labels.add(label)
                        }
                        offset = match.index + 1
                    }
                }
            }
            for (const label of labels)
                problems.push(file + ': contradicts global safeguard: ' + label)
        }
    }
    return problems
}

export function missingScopeProblems(expectedPaths, presentPaths) {
    const present = new Set(presentPaths)
    return expectedPaths
        .filter((file) => !present.has(file))
        .map((file) => 'missing scoped instruction path ' + file)
}

export function missingLoadedInstructionProblems(expectedPaths, loadedPaths) {
    const loaded = new Set(loadedPaths)
    return expectedPaths
        .filter((file) => !loaded.has(file))
        .map((file) => 'instruction was not loaded: ' + file)
}

export function sensitivePatternProblems(files) {
    const problems = []
    const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
    const secret =
        /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,})\b|-----BEGIN [A-Z ]+PRIVATE KEY-----/
    for (const [name, text] of Object.entries(files)) {
        if (email.test(text)) problems.push(name + ': possible personal email pattern')
        if (secret.test(text)) problems.push(name + ': possible credential pattern')
    }
    return problems
}

const CROSS_AGENT_INVARIANT_IDS = Array.from(
    { length: 8 },
    (_, index) => 'X-' + String(index + 1).padStart(3, '0'),
)
const LOADER_MARKER_STATUS = 'ROOT_FILE_MARKERS_VERIFIED / RULE_SEMANTICS_UNPROVEN'

/** Keep instruction inclusion evidence separate from semantic and operational proof. */
export function crossAgentInvariantProblems(traceability, claudeEvidence, codexEvidence) {
    const problems = []
    const invariants = traceability?.cross_agent_invariants
    if (!Array.isArray(invariants)) return ['traceability JSON has no cross_agent_invariants array']
    const byId = new Map()
    for (const invariant of invariants) {
        if (!invariant?.id) continue
        byId.set(invariant.id, [...(byId.get(invariant.id) || []), invariant])
    }
    for (const id of CROSS_AGENT_INVARIANT_IDS) {
        const rows = byId.get(id) || []
        if (rows.length !== 1) {
            problems.push(id + ': expected exactly one cross-agent invariant row')
            continue
        }
        const invariant = rows[0]
        const evidence = invariant.loader_evidence
        if (
            !Array.isArray(invariant.targets) ||
            !invariant.targets.includes('AGENTS.md') ||
            !invariant.targets.includes('CLAUDE.md')
        ) {
            problems.push(id + ': global invariant must target both agent roots')
        }
        if (
            !evidence ||
            evidence.status !== LOADER_MARKER_STATUS ||
            evidence.claude_manifest !== 'claude-loader-evidence.json' ||
            evidence.codex_manifest !== 'codex-loader-evidence.json' ||
            evidence.claude_root_file !== 'CLAUDE.md' ||
            evidence.codex_root_file !== 'AGENTS.md' ||
            evidence.claude_contexts !== 10 ||
            evidence.codex_contexts !== 10 ||
            evidence.evidence_scope !== 'marker inclusion/order and current file hashes only'
        ) {
            problems.push(id + ': loader evidence is missing, stale, or overclaims semantic proof')
            continue
        }
        if (evidence.semantic_execution_verified !== false)
            problems.push(id + ': marker probes cannot claim semantic execution')
        if (
            !/^[a-f0-9]{64}$/.test(claudeEvidence?.instruction_file_sha256?.['CLAUDE.md'] || '') ||
            !/^[a-f0-9]{64}$/.test(codexEvidence?.instruction_file_sha256?.['AGENTS.md'] || '')
        )
            problems.push(id + ': root loader manifests lack file hashes')
        const claudeContexts = claudeEvidence?.contexts
        const codexContexts = codexEvidence?.contexts
        if (
            !Array.isArray(claudeContexts) ||
            claudeContexts.length !== 10 ||
            claudeContexts.some((context) => context.marker_results?.root?.present !== true)
        ) {
            problems.push(id + ': Claude root marker is not proven in all ten recorded contexts')
        }
        if (
            !Array.isArray(codexContexts) ||
            codexContexts.length !== 10 ||
            codexContexts.some((context) => !context.loaded?.includes('AGENTS.md'))
        ) {
            problems.push(id + ': Codex root AGENTS.md is not proven in all ten recorded contexts')
        }
        if (/LOADER_EVIDENCE_PENDING/i.test(invariant.status || ''))
            problems.push(id + ': status still says loader evidence is pending')
    }
    for (const id of byId.keys())
        if (!CROSS_AGENT_INVARIANT_IDS.includes(id))
            problems.push(id + ': unexpected cross-agent invariant ID')
    return problems
}

const TRACEABILITY_STOP_WORDS = new Set([
    'about',
    'above',
    'after',
    'again',
    'against',
    'also',
    'among',
    'and',
    'any',
    'are',
    'because',
    'been',
    'being',
    'below',
    'between',
    'both',
    'but',
    'can',
    'could',
    'did',
    'does',
    'doing',
    'down',
    'each',
    'else',
    'for',
    'from',
    'further',
    'had',
    'has',
    'have',
    'here',
    'into',
    'its',
    'just',
    'more',
    'most',
    'much',
    'must',
    'only',
    'other',
    'over',
    'same',
    'some',
    'such',
    'than',
    'that',
    'the',
    'their',
    'them',
    'then',
    'there',
    'these',
    'they',
    'this',
    'those',
    'through',
    'under',
    'until',
    'upon',
    'very',
    'was',
    'were',
    'what',
    'when',
    'where',
    'which',
    'while',
    'who',
    'with',
    'would',
])
const meaningfulTokens = (text) =>
    new Set(
        (
            String(text)
                .toLowerCase()
                .match(/[a-z0-9]+/g) || []
        ).filter((token) => token.length >= 4 && !TRACEABILITY_STOP_WORDS.has(token)),
    )
const NON_NORMATIVE_LABELS = {
    'C-022-L296-2': {
        source_claim: 'The rest:',
        reason: 'The phrase \u201cThe rest:\u201d is a structural transition label and does not impose behavior or policy.',
    },
}

/** Prove every captured source claim survives at a declared destination. */
export function sourceDestinationCoverageProblems(traceability, root = ROOT) {
    const problems = []
    const rules = new Map((traceability?.rules || []).map((rule) => [rule.id, rule]))
    const fileCache = new Map()
    const read = (relativePath) => {
        if (!fileCache.has(relativePath)) {
            try {
                fileCache.set(relativePath, readFileSync(path.join(root, relativePath), 'utf8'))
            } catch {
                fileCache.set(relativePath, null)
            }
        }
        return fileCache.get(relativePath)
    }
    for (const claim of traceability?.source_claims || []) {
        const parent = rules.get(claim.parent_rule_id)
        if (!parent) continue
        const destinations = Array.isArray(parent.destination_paths) ? parent.destination_paths : []
        const exact = destinations.some((destination) =>
            read(destination)?.includes(claim.source_claim),
        )
        const evidence = Array.isArray(claim.destination_evidence) ? claim.destination_evidence : []
        let validAnchors = evidence.length > 0
        for (const item of evidence) {
            if (!destinations.includes(item?.path)) {
                problems.push(
                    claim.claim_id +
                        ': destination evidence path is not declared by its parent rule',
                )
                validAnchors = false
                continue
            }
            if (
                typeof item?.anchor !== 'string' ||
                item.anchor.trim().length < 16 ||
                !read(item.path)?.includes(item.anchor)
            ) {
                problems.push(
                    claim.claim_id + ': destination evidence anchor is missing from ' + item?.path,
                )
                validAnchors = false
            } else {
                const sourceTokens = meaningfulTokens(claim.source_claim)
                const anchorTokens = meaningfulTokens(item.anchor)
                if (![...sourceTokens].some((token) => anchorTokens.has(token))) {
                    problems.push(
                        claim.claim_id +
                            ': destination evidence anchor is unrelated to its source claim',
                    )
                    validAnchors = false
                }
            }
        }
        const disposition = claim.destination_disposition
        const allowedLabel = NON_NORMATIVE_LABELS[claim.claim_id]
        const explicitNonNormative =
            Boolean(allowedLabel) &&
            disposition?.kind === 'NON_NORMATIVE_LABEL' &&
            claim.source_claim === allowedLabel.source_claim &&
            disposition.reason === allowedLabel.reason
        if (!exact && !validAnchors && !explicitNonNormative) {
            problems.push(
                claim.claim_id +
                    ': source claim has no exact or anchored evidence in its declared destinations',
            )
        }
        if (exact && disposition)
            problems.push(
                claim.claim_id + ': exact destination evidence must not be marked non-normative',
            )
        if (disposition && !explicitNonNormative)
            problems.push(claim.claim_id + ': invalid non-normative disposition')
    }
    return problems
}

function main() {
    const tracePath = path.join(ROOT, 'docs/agent-instructions/traceability.json')
    const markdownPath = path.join(ROOT, 'docs/agent-instructions/TRACEABILITY.md')
    const loaderEvidencePath = path.join(ROOT, 'docs/agent-instructions/codex-loader-evidence.json')
    const claudeLoaderEvidencePath = path.join(
        ROOT,
        'docs/agent-instructions/claude-loader-evidence.json',
    )
    const pr777EvidencePath = path.join(ROOT, 'docs/agent-instructions/pr-777-source-evidence.json')
    const traceability = JSON.parse(readFileSync(tracePath, 'utf8'))
    const markdown = readFileSync(markdownPath, 'utf8')
    const loaderEvidence = JSON.parse(readFileSync(loaderEvidencePath, 'utf8'))
    const claudeLoaderEvidence = JSON.parse(readFileSync(claudeLoaderEvidencePath, 'utf8'))
    const pr777Evidence = JSON.parse(readFileSync(pr777EvidencePath, 'utf8'))
    const policyFiles = Object.fromEntries(
        AGENT_FILES.map((file) => [file, readFileSync(path.join(ROOT, file), 'utf8')]),
    )
    const pr777Files = {
        ...policyFiles,
        'CHANGELOG.md': readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8'),
        'scripts/security/review-coverage.test.mjs': readFileSync(
            path.join(ROOT, 'scripts/security/review-coverage.test.mjs'),
            'utf8',
        ),
        'scripts/security/check-agent-instruction-architecture.test.mjs': readFileSync(
            path.join(ROOT, 'scripts/security/check-agent-instruction-architecture.test.mjs'),
            'utf8',
        ),
        '.github/workflows/ci.yml': readFileSync(
            path.join(ROOT, '.github/workflows/ci.yml'),
            'utf8',
        ),
    }
    const rootFiles = Object.fromEntries(
        ['AGENTS.md', 'CLAUDE.md'].map((file) => [
            file,
            readFileSync(path.join(ROOT, file), 'utf8'),
        ]),
    )
    const present = SCOPED_INSTRUCTION_FILES.filter((file) => existsSync(path.join(ROOT, file)))
    const needs = ciStatusNeeds(readFileSync(path.join(ROOT, '.github/workflows/ci.yml'), 'utf8'))
    const scopeText = Object.fromEntries(
        SCOPED_INSTRUCTION_FILES.map((file) => [file, policyFiles[file]]),
    )
    const baselineSources = Object.fromEntries(
        ['AGENTS.md', 'CLAUDE.md'].map((file) => [
            file,
            execFileSync('git', ['show', traceability.baseline_commit + ':' + file], { cwd: ROOT }),
        ]),
    )
    const loaderHashes = Object.fromEntries(
        CODEX_LOADER_HASH_PATHS.map((file) => [
            file,
            createHash('sha256')
                .update(readFileSync(path.join(ROOT, file)))
                .digest('hex'),
        ]),
    )
    const claudeLoaderHashes = Object.fromEntries(
        CLAUDE_LOADER_HASH_PATHS.map((file) => [
            file,
            createHash('sha256')
                .update(readFileSync(path.join(ROOT, file)))
                .digest('hex'),
        ]),
    )
    const problems = [
        ...traceabilityProblems(traceability, markdown),
        ...baselineSourceProblems(traceability, baselineSources),
        ...normativeSourceCoverageProblems(traceability, baselineSources),
        ...sourceClaimProblems(traceability, baselineSources),
        ...sourceDestinationCoverageProblems(traceability),
        ...codexLoaderEvidenceProblems(loaderEvidence, loaderHashes),
        ...claudeLoaderEvidenceProblems(
            claudeLoaderEvidence,
            claudeLoaderHashes,
            traceability.baseline_commit,
        ),
        ...crossAgentInvariantProblems(traceability, claudeLoaderEvidence, loaderEvidence),
        ...pr777EvidenceProblems(traceability, pr777Evidence),
        ...pr777AdoptionProblems(pr777Files, traceability),
        ...rootAnchorProblems(rootFiles),
        ...scopedInstructionConflictProblems(scopeText),
        ...missingScopeProblems(SCOPED_INSTRUCTION_FILES, present),
        ...sensitivePatternProblems({
            'docs/agent-instructions/claude-loader-evidence.json': readFileSync(
                claudeLoaderEvidencePath,
                'utf8',
            ),
        }),
        ...sensitivePatternProblems({
            ...scopeText,
            'docs/agent-instructions/TRACEABILITY.md': markdown,
            'docs/agent-instructions/traceability.json': readFileSync(tracePath, 'utf8'),
            'docs/agent-instructions/claude-loader-evidence.json': readFileSync(
                claudeLoaderEvidencePath,
                'utf8',
            ),
        }),
        ...agentPolicyProblems(policyFiles, { needs }),
    ]
    if (problems.length) {
        console.error('[FAIL] Instruction architecture: ' + problems.length + ' problem(s)')
        for (const problem of problems) console.error('  - ' + problem)
        process.exit(1)
    }
    console.log(
        '[OK] Instruction architecture: ' +
            traceability.rules.length +
            ' traceability rules; ' +
            present.length +
            ' scoped files; global anchors intact.',
    )
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main()
