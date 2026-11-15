import { destinationPathProblems } from './check-agent-instruction-architecture.mjs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import {
    baselineSourceProblems,
    codexLoaderEvidenceProblems,
    isNormativeSourceLine,
    normativeSourceCoverageProblems,
    pr777EvidenceProblems,
    sourceClaimProblems,
    splitSourceClaims,
} from './check-agent-instruction-architecture.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')

function fixture() {
    const sources = {
        'AGENTS.md': Buffer.from('alpha\nbeta\n'),
        'CLAUDE.md': Buffer.from('gamma\ndelta\n'),
    }
    const root_sources = Object.fromEntries(
        Object.entries(sources).map(([name, bytes]) => [
            name,
            {
                lines: (bytes.toString().match(/\n/g) || []).length,
                bytes: bytes.length,
                sha256: createHash('sha256').update(bytes).digest('hex'),
            },
        ]),
    )
    return {
        sources,
        traceability: {
            baseline_commit: 'a'.repeat(40),
            root_sources,
            rules: [
                { id: 'A-001', source: 'AGENTS.md', source_lines: [1, 1], source_excerpt: 'alpha' },
                { id: 'C-001', source: 'CLAUDE.md', source_lines: [1, 1], source_excerpt: 'gamma' },
            ],
        },
    }
}

test('baseline source evidence accepts exact blobs and excerpts', () => {
    const { sources, traceability } = fixture()
    assert.deepEqual(baselineSourceProblems(traceability, sources), [])
})

test('baseline source evidence rejects altered excerpts, blobs, and missing files', () => {
    const { sources, traceability } = fixture()
    const alteredExcerpt = structuredClone(traceability)
    alteredExcerpt.rules[0].source_excerpt = 'not the source'
    assert.ok(
        baselineSourceProblems(alteredExcerpt, sources).some((problem) =>
            problem.includes('A-001'),
        ),
    )

    const alteredBlob = { ...sources, 'AGENTS.md': Buffer.from('tampered\nbeta\n') }
    assert.ok(
        baselineSourceProblems(traceability, alteredBlob).some((problem) =>
            problem.includes('SHA-256 mismatch'),
        ),
    )
    assert.ok(
        baselineSourceProblems(traceability, { 'AGENTS.md': sources['AGENTS.md'] }).some(
            (problem) => problem.includes('CLAUDE.md'),
        ),
    )
})

test('normative baseline lines need a direct traceability mapping', () => {
    const traceability = {
        rules: [{ id: 'A-001', source: 'AGENTS.md', source_lines: [3, 3] }],
    }
    assert.deepEqual(
        normativeSourceCoverageProblems(traceability, {
            'AGENTS.md': 'Context statement.\nNever bypass the hook.\n',
            'CLAUDE.md': 'The rules below are binding.\n',
        }),
        [
            'AGENTS.md: unmapped normative baseline line 2',
            'CLAUDE.md: unmapped normative baseline line 1',
        ],
    )
    traceability.rules.push({ id: 'C-001', source: 'CLAUDE.md', source_lines: [1, 1] })
    assert.deepEqual(
        normativeSourceCoverageProblems(traceability, {
            'AGENTS.md': 'Context statement.\nNever bypass the hook.\n',
            'CLAUDE.md': 'The rules below are binding.\n',
        }),
        ['AGENTS.md: unmapped normative baseline line 2'],
    )

    const duplicated = {
        rules: [
            { id: 'A-001', source: 'AGENTS.md', source_lines: [1, 1] },
            { id: 'A-002', source: 'AGENTS.md', source_lines: [1, 1] },
        ],
    }
    assert.deepEqual(
        normativeSourceCoverageProblems(duplicated, {
            'AGENTS.md': 'Never bypass hooks.\n',
            'CLAUDE.md': '',
        }),
        ['AGENTS.md: multiply mapped normative baseline line 1 (A-001, A-002)'],
    )
})

test('imperative list requirements are covered even without modal words', () => {
    const text = '- **Keep every PR under 100 changed files.**\n'
    assert.equal(isNormativeSourceLine(text.trimEnd()), true)
    assert.equal(
        isNormativeSourceLine(
            '- **Live over written.** Read rulesets before asserting current state.',
        ),
        true,
    )
    assert.equal(
        isNormativeSourceLine(
            '- **Authority, not capability:** a release needs an explicit owner decision.',
        ),
        true,
    )
    assert.equal(
        isNormativeSourceLine('1. **Macro** -- read the committed architecture report.'),
        true,
    )
    assert.equal(
        isNormativeSourceLine('3. **Targeted reads** -- then open relevant source files.'),
        true,
    )
    assert.equal(
        isNormativeSourceLine('- **Desktop:** `pnpm run dev:desktop` needs Rust + Tauri v2'),
        true,
    )
    assert.equal(
        isNormativeSourceLine(
            '- **Observed live** (REST read 2026-10-28; re-read before relying on it): signed',
        ),
        true,
    )
    assert.equal(
        isNormativeSourceLine(
            '- **Redux Toolkit** (`stores/store.ts`) owns the 19 persisted domain slices.',
        ),
        true,
    )
    assert.equal(
        isNormativeSourceLine(
            '- **Preview (production build):** `pnpm run build` then `pnpm run preview` -> port 4173',
        ),
        false,
    )
    assert.equal(
        isNormativeSourceLine(
            '1. **`--` before a vitest spec swallows the filter.** `test:run -- Foo` becomes',
        ),
        false,
    )
    assert.equal(
        isNormativeSourceLine(
            '- **Playwright E2E:** `pnpm run build` then `pnpm run test:e2e` (starts preview)',
        ),
        false,
    )
    assert.equal(
        isNormativeSourceLine(
            '- **Zustand** (`stores/use*Store.ts`) owns the 9 transient UI stores.',
        ),
        true,
    )
    const source = { 'AGENTS.md': Buffer.from(text), 'CLAUDE.md': Buffer.from('') }
    const traceability = {
        rules: [
            {
                id: 'A-001',
                source: 'AGENTS.md',
                source_lines: [1, 1],
                priority: 'P1',
                scope: 'Global',
                target: 'KEEP-ROOT',
                empirical_verification: 'loader evidence',
                status: 'SOURCE_CAPTURED / LOADER_MARKERS_VERIFIED / SEMANTIC_PARITY_PENDING',
            },
        ],
        source_claims: [],
    }
    assert.ok(
        sourceClaimProblems(traceability, source).some((problem) =>
            problem.includes('source claims missing'),
        ),
    )
    traceability.source_claims = [
        {
            claim_id: 'A-001-L1-1',
            parent_rule_id: 'A-001',
            source: 'AGENTS.md',
            source_line: 1,
            source_ref: 'AGENTS.md:1',
            source_line_text: text.trimEnd(),
            source_claim: text.trimEnd(),
            priority: 'P1',
            scope: 'Global',
            target: 'KEEP-ROOT',
            mechanical_verification: 'exact source claim test',
            empirical_verification: 'loader evidence',
            status: 'SOURCE_CAPTURED / LOADER_MARKERS_VERIFIED / SEMANTIC_PARITY_PENDING',
        },
    ]
    assert.deepEqual(sourceClaimProblems(traceability, source), [])
})

test('one-heavy-task directive is normative and duplicate source ranges fail closed', () => {
    const line =
        '- **One heavy task at a time.** Check `free -m` first. The hook stops under clearly dangerous'
    assert.equal(isNormativeSourceLine(line), true)
    assert.deepEqual(
        normativeSourceCoverageProblems(
            {
                rules: [
                    { id: 'A-030', source: 'AGENTS.md', source_lines: [1, 4] },
                    { id: 'A-035', source: 'AGENTS.md', source_lines: [1, 1] },
                ],
            },
            { 'AGENTS.md': line + '\n', 'CLAUDE.md': '' },
        ),
        ['AGENTS.md: multiply mapped normative baseline line 1 (A-030, A-035)'],
    )
})

test('normative source claims are exact, complete, unique, and scoped to one parent', () => {
    const line = 'Never bypass hooks. Always run the check; record its result.'
    const fragments = splitSourceClaims(line)
    assert.deepEqual(fragments, [
        'Never bypass hooks.',
        'Always run the check',
        'record its result.',
    ])
    const sources = { 'AGENTS.md': Buffer.from(line + '\n'), 'CLAUDE.md': Buffer.from('') }
    const parent = {
        id: 'A-001',
        source: 'AGENTS.md',
        source_lines: [1, 1],
        priority: 'P0',
        scope: 'Global',
        target: 'KEEP-ROOT',
        empirical_verification: 'loader evidence',
        status: 'SOURCE_CAPTURED / LOADER_MARKERS_VERIFIED / SEMANTIC_PARITY_PENDING',
    }
    const traceability = {
        rules: [parent],
        source_claims: fragments.map((fragment, index) => ({
            claim_id: 'A-001-L1-' + (index + 1),
            parent_rule_id: 'A-001',
            source: 'AGENTS.md',
            source_line: 1,
            source_ref: 'AGENTS.md:1',
            source_line_text: line,
            source_claim: fragment,
            priority: parent.priority,
            scope: parent.scope,
            target: parent.target,
            mechanical_verification: 'sourceClaimProblems exact comparison',
            empirical_verification: parent.empirical_verification,
            status: parent.status,
        })),
    }
    assert.deepEqual(sourceClaimProblems(traceability, sources), [])

    const missing = structuredClone(traceability)
    missing.source_claims.pop()
    assert.ok(
        sourceClaimProblems(missing, sources).some((problem) =>
            problem.includes('source claims missing'),
        ),
    )

    const duplicated = structuredClone(traceability)
    duplicated.source_claims.push(duplicated.source_claims[0])
    assert.ok(
        sourceClaimProblems(duplicated, sources).some((problem) =>
            problem.includes('duplicate source claim'),
        ),
    )

    const weakened = structuredClone(traceability)
    weakened.source_claims[0].source_claim = 'Use hooks.'
    assert.ok(
        sourceClaimProblems(weakened, sources).some((problem) =>
            problem.includes('exact source line or claim fragment differs'),
        ),
    )

    const misScoped = structuredClone(traceability)
    misScoped.source_claims[0].scope = 'Web only'
    assert.ok(
        sourceClaimProblems(misScoped, sources).some((problem) =>
            problem.includes('differs from parent rule'),
        ),
    )

    const staleLoaderEvidence = structuredClone(traceability)
    staleLoaderEvidence.source_claims[0].empirical_verification = 'NOT YET VERIFIED'
    assert.ok(
        sourceClaimProblems(staleLoaderEvidence, sources).some((problem) =>
            problem.includes('evidence differs from parent rule'),
        ),
    )

    const staleStatus = structuredClone(traceability)
    staleStatus.source_claims[0].status = 'SOURCE_CAPTURED / EMPIRICAL_PENDING'
    assert.ok(
        sourceClaimProblems(staleStatus, sources).some((problem) =>
            problem.includes('evidence differs from parent rule'),
        ),
    )
})

test('Codex loader evidence fails closed on missing scope, out-of-scope files, and drift', () => {
    const evidence = JSON.parse(
        readFileSync(path.join(ROOT, 'docs/agent-instructions/codex-loader-evidence.json'), 'utf8'),
    )
    const hashes = evidence.instruction_file_sha256
    assert.deepEqual(codexLoaderEvidenceProblems(evidence, hashes), [])

    const missing = structuredClone(evidence)
    missing.contexts = missing.contexts.filter((context) => context.cwd !== 'apps/web')
    assert.ok(
        codexLoaderEvidenceProblems(missing, hashes).some((problem) =>
            problem.includes('context missing: web'),
        ),
    )

    const altered = structuredClone(evidence)
    altered.contexts[1].unexpected_out_of_scope.push('apps/web/services/local-ai/CLAUDE.md')
    altered.instruction_file_sha256['.github/AGENTS.md'] = '0'.repeat(64)
    const problems = codexLoaderEvidenceProblems(altered, hashes)
    assert.ok(problems.some((problem) => problem.includes('out-of-scope')))
    assert.ok(
        problems.some((problem) =>
            problem.includes('hashes differ from the pinned historical snapshot'),
        ),
    )
})

test('PR #777 evidence recomputes cited line hashes and rejects stale or missing evidence', () => {
    const traceability = {
        pr_777: { headRefOid: 'a'.repeat(40) },
        rules: [{ id: 'P-001', source: 'PR #777', source_ref: 'AGENTS.md:175; CLAUDE.md:180' }],
    }
    const agentsLineText = 'captured source line from AGENTS.md'
    const claudeLineText = 'captured source line from CLAUDE.md'
    const evidence = {
        pull_request: 777,
        state: 'open',
        base: 'main',
        head_sha: 'a'.repeat(40),
        source_evidence_scope:
            'Exact source blobs, full-file hashes, line counts, cited-line text and line hashes only; cited-line hashes are recomputed from captured text. This does not assert that the transferred policy has been implemented or verified.',
        source_verified_rule_ids: ['P-001'],
        files: {
            'AGENTS.md': {
                blob_sha: '1'.repeat(40),
                sha256: '2'.repeat(64),
                line_count: 200,
                line_hashes: {
                    175: createHash('sha256').update(agentsLineText, 'utf8').digest('hex'),
                },
                line_texts: { 175: agentsLineText },
            },
            'CLAUDE.md': {
                blob_sha: '4'.repeat(40),
                sha256: '5'.repeat(64),
                line_count: 200,
                line_hashes: {
                    180: createHash('sha256').update(claudeLineText, 'utf8').digest('hex'),
                },
                line_texts: { 180: claudeLineText },
            },
        },
    }
    assert.deepEqual(pr777EvidenceProblems(traceability, evidence), [])

    const stale = structuredClone(evidence)
    stale.head_sha = 'b'.repeat(40)
    stale.files['CLAUDE.md'].line_hashes = {}
    const problems = pr777EvidenceProblems(traceability, stale)
    assert.ok(problems.some((problem) => problem.includes('stale head')))
    assert.ok(problems.some((problem) => problem.includes('missing PR source line evidence')))

    const forgedHash = structuredClone(evidence)
    forgedHash.files['AGENTS.md'].line_hashes['175'] = '0'.repeat(64)
    assert.ok(
        pr777EvidenceProblems(traceability, forgedHash).some((problem) =>
            problem.includes('PR source line hash mismatch for AGENTS.md:175'),
        ),
    )

    const missingText = structuredClone(evidence)
    delete missingText.files['AGENTS.md'].line_texts['175']
    assert.ok(
        pr777EvidenceProblems(traceability, missingText).some((problem) =>
            problem.includes('missing PR source line evidence for AGENTS.md:175'),
        ),
    )

    const descendingRange = structuredClone(traceability)
    descendingRange.rules[0].source_ref = 'AGENTS.md:176-175; CLAUDE.md:180'
    assert.ok(
        pr777EvidenceProblems(descendingRange, evidence).some((problem) =>
            problem.includes('invalid PR #777 source line range'),
        ),
    )

    const unsafeIntegerRange = structuredClone(traceability)
    unsafeIntegerRange.rules[0].source_ref = 'AGENTS.md:9007199254740992; CLAUDE.md:180'
    assert.ok(
        pr777EvidenceProblems(unsafeIntegerRange, evidence).some((problem) =>
            problem.includes('invalid PR #777 source line range'),
        ),
    )

    const outOfBlobRange = structuredClone(traceability)
    outOfBlobRange.rules[0].source_ref = 'AGENTS.md:199-201; CLAUDE.md:180'
    assert.ok(
        pr777EvidenceProblems(outOfBlobRange, evidence).some((problem) =>
            problem.includes('PR source line exceeds recorded blob length'),
        ),
    )
})

test('destination paths fail closed for missing, unsafe, nonexistent and unrendered entries', async () => {
    const { readFileSync } = await import('node:fs')
    const traceability = JSON.parse(
        readFileSync(
            new URL('../../docs/agent-instructions/traceability.json', import.meta.url),
            'utf8',
        ),
    )
    const markdown = readFileSync(
        new URL('../../docs/agent-instructions/TRACEABILITY.md', import.meta.url),
        'utf8',
    )
    assert.deepEqual(destinationPathProblems(traceability, markdown), [])
    const missing = JSON.parse(JSON.stringify(traceability))
    delete missing.rules[0].destination_paths
    assert.ok(
        destinationPathProblems(missing, markdown).some((problem) =>
            problem.includes('A-001 has no destination_paths'),
        ),
    )
    const unsafe = JSON.parse(JSON.stringify(traceability))
    unsafe.rules[0].destination_paths = ['../AGENTS.md']
    assert.ok(
        destinationPathProblems(unsafe, markdown).some((problem) =>
            problem.includes('unsafe destination path'),
        ),
    )
    const nonexistent = JSON.parse(JSON.stringify(traceability))
    nonexistent.rules[0].destination_paths = ['docs/not-a-real-instruction.md']
    assert.ok(
        destinationPathProblems(nonexistent, markdown).some((problem) =>
            problem.includes('destination does not exist'),
        ),
    )
    const destinationSection = markdown.indexOf('## Destination path traceability')
    const withoutDestinationA001 =
        markdown.slice(0, destinationSection) +
        markdown.slice(destinationSection).replace(/^\|\s*A-001\s*\|.*$/m, '')
    assert.ok(
        destinationPathProblems(traceability, withoutDestinationA001).some((problem) =>
            problem.includes('A-001 is missing from the rendered destination matrix'),
        ),
    )
})
