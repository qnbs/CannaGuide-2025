import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { AGENT_FILES, agentPolicyProblems } from './check-agent-policy.mjs'
import {
    REQUIRED_RULE_IDS,
    SCOPED_INSTRUCTION_FILES,
    claudeLoaderEvidenceProblems,
    codexLoaderEvidenceProblems,
    crossAgentInvariantProblems,
    PR777_ADOPTION_REQUIREMENTS,
    pr777AdoptionProblems,
    missingLoadedInstructionProblems,
    missingScopeProblems,
    rootAnchorProblems,
    scopedInstructionConflictProblems,
    sensitivePatternProblems,
    sourceDestinationCoverageProblems,
    traceabilityProblems,
    unregisteredInstructionProblems,
} from './check-agent-instruction-architecture.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')
const read = (file) => readFileSync(path.join(ROOT, file), 'utf8')
const traceability = JSON.parse(read('docs/agent-instructions/traceability.json'))
const matrix = read('docs/agent-instructions/TRACEABILITY.md')
const codexLoaderEvidence = JSON.parse(read('docs/agent-instructions/codex-loader-evidence.json'))
const claudeLoaderEvidence = JSON.parse(read('docs/agent-instructions/claude-loader-evidence.json'))

test('canonical traceability matrix and sidecar IDs match', () => {
    assert.equal(REQUIRED_RULE_IDS.length, 75)
    assert.deepEqual(traceabilityProblems(traceability, matrix), [])
})

test('a missing source rule fails closed', () => {
    const incomplete = {
        ...traceability,
        rules: traceability.rules.filter((rule) => rule.id !== 'C-023'),
    }
    assert.ok(
        traceabilityProblems(incomplete, matrix).some((problem) =>
            problem.includes('missing required traceability rule C-023'),
        ),
    )
})

test('missing root safeguards are reported', () => {
    const problems = rootAnchorProblems({
        'AGENTS.md': 'ordinary instructions',
        'CLAUDE.md': 'ordinary instructions',
    })
    assert.ok(problems.some((problem) => problem.includes('single-writer authority')))
    assert.ok(problems.some((problem) => problem.includes('CanG legal cap')))
    assert.ok(problems.some((problem) => problem.includes('accessibility ratchet')))
})

test('root anchors ignore quoted and fenced mentions', () => {
    const agents = read('AGENTS.md')
    assert.match(agents, /one source writer/i, 'source fixture must contain the writer rule')
    const quotedAgents = agents.replace(/one source writer/gi, '') + '\n> One source writer.'

    const claude = read('CLAUDE.md')
    assert.match(
        claude,
        /The rules below are \*\*binding\*\*/,
        'source fixture must contain the binding root marker',
    )
    const fencedClaude =
        claude.replace(/The rules below are \*\*binding\*\*/gi, '') +
        '\n~~~md\nThe rules below are **binding**\n~~~'
    const problems = rootAnchorProblems({ 'AGENTS.md': quotedAgents, 'CLAUDE.md': fencedClaude })

    assert.ok(problems.includes('AGENTS.md: missing global single-writer authority'))
    assert.ok(problems.includes('CLAUDE.md: missing global binding root rules'))
})

test('SSH signing, A11y, Local-Only privacy, retention, and review coverage stay in both agent roots', () => {
    const roots = { 'AGENTS.md': read('AGENTS.md'), 'CLAUDE.md': read('CLAUDE.md') }
    assert.deepEqual(rootAnchorProblems(roots), [])

    const cases = [
        ['AGENTS.md', '**CanG legal boundary:**', 'CanG legal cap'],
        ['AGENTS.md', '**SSH-signed commits:**', 'SSH commit signing'],
        ['AGENTS.md', '**A11y ratchet:**', 'global A11y ratchet'],
        ['AGENTS.md', '**Local-Only privacy:**', 'Local-Only no-egress privacy'],
        ['AGENTS.md', '**SAFE-only retention:**', 'SAFE-only unknown retention protection'],
        ['AGENTS.md', '**Review coverage:**', 'exact-head reviewer coverage'],
        ['AGENTS.md', '**PR budget:**', 'global PR budget summary'],
        ['CLAUDE.md', '**SSH-signed commits:**', 'SSH commit signing'],
        ['CLAUDE.md', '**A11y ratchet:**', 'global A11y ratchet summary'],
        ['CLAUDE.md', '**Local-Only privacy:**', 'Local-Only no-egress privacy'],
        ['CLAUDE.md', '**SAFE-only retention:**', 'SAFE-only unknown retention protection'],
        ['CLAUDE.md', '**PR budget:**', 'global PR budget summary'],
    ]
    for (const [file, anchor, label] of cases) {
        const weakened = { ...roots, [file]: roots[file].replace(anchor, '') }
        assert.ok(
            rootAnchorProblems(weakened).some(
                (problem) => problem.includes(file) && problem.includes(label),
            ),
            `${file} removal of ${label} was not detected`,
        )
    }
})

test('root architecture anchors reject negated SSH-signing guidance', () => {
    const roots = { 'AGENTS.md': read('AGENTS.md'), 'CLAUDE.md': read('CLAUDE.md') }
    for (const file of Object.keys(roots)) {
        const negated = {
            ...roots,
            [file]: roots[file].replace(
                '**SSH-signed commits:**',
                '**SSH-signed commits are not required:**',
            ),
        }
        assert.ok(
            rootAnchorProblems(negated).some(
                (problem) => problem === `${file}: missing global SSH commit signing`,
            ),
            `${file} must reject an explicit negation while the verification sentence remains`,
        )
    }
})

test('missing and not-loaded nested instructions fail closed', () => {
    assert.ok(missingScopeProblems(SCOPED_INSTRUCTION_FILES, ['apps/web/CLAUDE.md']).length > 0)
    const expected = ['AGENTS.md', 'apps/web/AGENTS.md', 'apps/web/services/db/AGENTS.md']
    const loaded = ['AGENTS.md', 'apps/web/AGENTS.md']
    assert.deepEqual(missingLoadedInstructionProblems(expected, loaded), [
        'instruction was not loaded: apps/web/services/db/AGENTS.md',
    ])
})

test('new nested instruction paths fail until registered for traceability and loader evidence', () => {
    assert.deepEqual(
        unregisteredInstructionProblems([
            'AGENTS.md',
            'CLAUDE.md',
            ...SCOPED_INSTRUCTION_FILES,
            'new-scope/AGENTS.md',
        ]),
        ['unregistered scoped instruction file new-scope/AGENTS.md'],
    )
})

test('the identified web rules remain in their scoped agent instructions', () => {
    const cases = [
        ['A-011', 'apps/web/AGENTS.md', /WEB-CODEX-05: Keep react and react-dom versions aligned/],
        [
            'A-012',
            'apps/web/AGENTS.md',
            /WEB-CODEX-06:[\s\S]*vi\.hoisted\(\)[\s\S]*vi\.resetModules\(\)[\s\S]*dynamic import/,
        ],
        [
            'A-016',
            'apps/web/AGENTS.md',
            /WEB-CODEX-09: Keep new or heavily changed files within 200-700 LOC/,
        ],
        ['C-004', 'apps/web/AGENTS.md', /WEB-CODEX-07:[\s\S]*TS2719[\s\S]*must not be suppressed/],
        ['C-004', 'apps/web/CLAUDE.md', /WEB-09:[\s\S]*TS2719[\s\S]*must not be suppressed/],
        [
            'C-016',
            'apps/web/AGENTS.md',
            /WEB-CODEX-08:[\s\S]*useIotStore[\s\S]*encryptedPassword[\s\S]*IndexedDB/,
        ],
        [
            'C-016',
            'apps/web/CLAUDE.md',
            /WEB-03:[\s\S]*uiStateBridge[\s\S]*localStorage[\s\S]*IoT MQTT config exception/,
        ],
        ['C-018', 'apps/web/CLAUDE.md', /WEB-12: Heavy web work goes through WorkerBus/],
        [
            'C-018',
            'apps/web/services/worker-bus/CLAUDE.md',
            /BUS-06: All heavy web work goes through WorkerBus/,
        ],
    ]
    for (const [id, file, pattern] of cases) {
        const rule = traceability.rules.find((item) => item.id === id)
        assert.ok(rule?.destination_paths.includes(file), `${id} must declare ${file}`)
        assert.match(read(file), pattern, `${id} content must remain in ${file}`)
    }
})

test('all strain integrity rules are identical in Claude and Codex scoped instructions', () => {
    const expectedIds = ['STRAIN-01', 'STRAIN-02', 'STRAIN-03', 'STRAIN-04']
    const parityRules = traceability.scoped_rule_parity.filter((item) =>
        expectedIds.includes(item.id),
    )
    assert.deepEqual(
        parityRules.map((item) => item.id).sort(),
        expectedIds,
        'traceability must list every cross-agent strain rule',
    )
    for (const parity of parityRules) {
        assert.equal(parity.source_path, 'apps/web/data/strains/CLAUDE.md')
        assert.equal(parity.codex_path, 'apps/web/data/strains/AGENTS.md')
        const rule = new RegExp(`^- ${parity.id}: ([^\\n]+)$`, 'm')
        const sourceMatch = read(parity.source_path).match(rule)
        const codexMatch = read(parity.codex_path).match(rule)
        assert.ok(sourceMatch, `${parity.id} must exist in the Claude instruction`)
        assert.ok(codexMatch, `${parity.id} must exist in the Codex instruction`)
        assert.equal(sourceMatch[1], parity.source_text)
        assert.equal(codexMatch[1], parity.source_text)
    }
    assert.ok(
        codexLoaderEvidence.contexts
            .find((item) => item.task_kind === 'strains')
            ?.loaded.includes('apps/web/data/strains/AGENTS.md'),
    )
})

test('all #777 P-rules have concrete adoption anchors and reject removal', () => {
    const files = {
        'AGENTS.md': read('AGENTS.md'),
        'CLAUDE.md': read('CLAUDE.md'),
        'docs/PR-REVIEW-LOOP.md': read('docs/PR-REVIEW-LOOP.md'),
        'scripts/security/review-coverage.test.mjs': read(
            'scripts/security/review-coverage.test.mjs',
        ),
        '.github/workflows/ci.yml': read('.github/workflows/ci.yml'),
        'CHANGELOG.md': read('CHANGELOG.md'),
    }
    assert.deepEqual(pr777AdoptionProblems(files, traceability), [])
    for (const requirement of PR777_ADOPTION_REQUIREMENTS) {
        const weakened = { ...files }
        const text = weakened[requirement.file]
        assert.match(
            text,
            requirement.pattern,
            requirement.id + ' fixture must match before mutation',
        )
        weakened[requirement.file] = text.replace(requirement.pattern, '')
        assert.ok(
            pr777AdoptionProblems(weakened, traceability).some((problem) =>
                problem.startsWith(requirement.id + ': missing adoption evidence'),
            ),
            requirement.id + ' removal was not detected',
        )
    }
})

test('P-012 changelog evidence survives long Unreleased notes and a dated release', () => {
    const files = {
        'AGENTS.md': read('AGENTS.md'),
        'CLAUDE.md': read('CLAUDE.md'),
        'docs/PR-REVIEW-LOOP.md': read('docs/PR-REVIEW-LOOP.md'),
        'scripts/security/review-coverage.test.mjs': read(
            'scripts/security/review-coverage.test.mjs',
        ),
        '.github/workflows/ci.yml': read('.github/workflows/ci.yml'),
        'CHANGELOG.md': read('CHANGELOG.md'),
    }
    const padded = files['CHANGELOG.md'].replace(
        '### Changed\n\n',
        `### Changed\n\n${'x'.repeat(2600)}\n\n`,
    )
    assert.deepEqual(pr777AdoptionProblems({ ...files, 'CHANGELOG.md': padded }, traceability), [])
    const dated = padded.replace('## [Unreleased]', '## [1.0.0] - 2026-11-15')
    assert.deepEqual(pr777AdoptionProblems({ ...files, 'CHANGELOG.md': dated }, traceability), [])
})

test('#777 traceability separates immutable source evidence, local adoption, and live PR state', () => {
    for (const requirement of PR777_ADOPTION_REQUIREMENTS) {
        const rule = traceability.rules.find((item) => item.id === requirement.id)
        assert.ok(rule?.priority, requirement.id + ' needs a priority')
        assert.ok(rule?.source_ref, requirement.id + ' needs source positions')
        assert.ok(rule?.scope, requirement.id + ' needs a scope decision')
        assert.ok(rule?.target, requirement.id + ' needs a destination')
        assert.equal(
            rule.status,
            'FIXED_ON_BRANCH',
            requirement.id + ' must reflect the implemented branch state',
        )
        assert.ok(
            rule.mechanical_verification.includes(requirement.testRef),
            requirement.id + ' must identify its concrete test',
        )
        assert.match(rule.empirical_verification, /immutable PR #777 (?:blob|source) evidence/i)
        assert.match(rule.empirical_verification, /local adoption/i)
        assert.match(rule.empirical_verification, /reread.*(?:live|current).*PR/i)
    }

    const stale = structuredClone(traceability)
    const changed = stale.rules.find((item) => item.id === 'P-001')
    changed.empirical_verification =
        'Compare fixture output with live exact-head review/check census; skipped or unavailable reviewers never count as positive coverage.'
    assert.ok(
        pr777AdoptionProblems(
            {
                'AGENTS.md': read('AGENTS.md'),
                'CLAUDE.md': read('CLAUDE.md'),
                'docs/PR-REVIEW-LOOP.md': read('docs/PR-REVIEW-LOOP.md'),
                'scripts/security/review-coverage.test.mjs': read(
                    'scripts/security/review-coverage.test.mjs',
                ),
                '.github/workflows/ci.yml': read('.github/workflows/ci.yml'),
                'CHANGELOG.md': read('CHANGELOG.md'),
            },
            stale,
        ).some((problem) => problem.startsWith('P-001: empirical verification')),
    )
})

test('Codex loader evidence covers every probed scope and the Claude out-of-scope boundary', () => {
    assert.deepEqual(
        codexLoaderEvidenceProblems(
            codexLoaderEvidence,
            codexLoaderEvidence.instruction_file_sha256,
        ),
        [],
    )
})

test('Codex loader evidence rejects marker-only prompt matches', () => {
    const partialFile = structuredClone(codexLoaderEvidence)
    partialFile.contexts[0].full_file_match_only = false
    assert.ok(
        codexLoaderEvidenceProblems(partialFile, partialFile.instruction_file_sha256).some(
            (problem) => problem.includes('complete instruction files: root'),
        ),
    )
})

test('Codex loader evidence rejects missing, duplicate, unexpected, or incorrectly loaded contexts', () => {
    const missing = { ...codexLoaderEvidence, contexts: codexLoaderEvidence.contexts.slice(1) }
    assert.ok(
        codexLoaderEvidenceProblems(missing, missing.instruction_file_sha256).some((problem) =>
            problem.includes('context missing: root'),
        ),
    )

    const duplicate = {
        ...codexLoaderEvidence,
        contexts: [...codexLoaderEvidence.contexts, codexLoaderEvidence.contexts[0]],
    }
    assert.ok(
        codexLoaderEvidenceProblems(duplicate, duplicate.instruction_file_sha256).some((problem) =>
            problem.includes('context is duplicated'),
        ),
    )

    const unexpected = {
        ...codexLoaderEvidence,
        contexts: [...codexLoaderEvidence.contexts, { cwd: 'packages', loaded: [], exit_code: 0 }],
    }
    assert.ok(
        codexLoaderEvidenceProblems(unexpected, unexpected.instruction_file_sha256).some(
            (problem) => problem.includes('context is unexpected'),
        ),
    )

    const wrongScope = structuredClone(codexLoaderEvidence)
    wrongScope.contexts.find((context) => context.cwd === 'apps/web/services/db').loaded = [
        'AGENTS.md',
        'apps/web/AGENTS.md',
    ]
    assert.ok(
        codexLoaderEvidenceProblems(wrongScope, wrongScope.instruction_file_sha256).some(
            (problem) => problem.includes('loaded paths differ from expected scope: database'),
        ),
    )
})

test('Codex loader evidence preserves ancestor-before-descendant prompt order', () => {
    const leafFirst = structuredClone(codexLoaderEvidence)
    leafFirst.contexts.find((context) => context.cwd === 'apps/web/services/db').loaded.reverse()
    assert.ok(
        codexLoaderEvidenceProblems(leafFirst, leafFirst.instruction_file_sha256).some((problem) =>
            problem.includes('loaded paths differ from expected scope: database'),
        ),
    )
})

test('Codex loader evidence rejects any claim that nested Claude rules are loaded by Codex', () => {
    const contradicted = structuredClone(codexLoaderEvidence)
    contradicted.out_of_scope_check.nested_CLAUDE_paths_loaded_by_Codex = true
    assert.ok(
        codexLoaderEvidenceProblems(contradicted, contradicted.instruction_file_sha256).some(
            (problem) => problem.includes('nested CLAUDE.md paths are absent'),
        ),
    )
})

test('cross-agent invariants distinguish root marker inclusion from semantic and operational proof', () => {
    const traceability = JSON.parse(read('docs/agent-instructions/traceability.json'))
    const claude = JSON.parse(read('docs/agent-instructions/claude-loader-evidence.json'))
    const codex = JSON.parse(read('docs/agent-instructions/codex-loader-evidence.json'))
    assert.deepEqual(crossAgentInvariantProblems(traceability, claude, codex), [])

    const missingRow = structuredClone(traceability)
    missingRow.cross_agent_invariants.pop()
    assert.ok(
        crossAgentInvariantProblems(missingRow, claude, codex).some((problem) =>
            problem.includes('expected exactly one'),
        ),
    )

    const missingEvidence = structuredClone(traceability)
    delete missingEvidence.cross_agent_invariants[0].loader_evidence
    assert.ok(
        crossAgentInvariantProblems(missingEvidence, claude, codex).some((problem) =>
            problem.includes('loader evidence is missing'),
        ),
    )

    const staleManifest = structuredClone(traceability)
    staleManifest.cross_agent_invariants[0].loader_evidence.claude_manifest = 'missing.json'
    assert.ok(
        crossAgentInvariantProblems(staleManifest, claude, codex).some((problem) =>
            problem.includes('loader evidence is missing'),
        ),
    )

    const semanticOverclaim = structuredClone(traceability)
    semanticOverclaim.cross_agent_invariants[0].loader_evidence.semantic_execution_verified = true
    assert.ok(
        crossAgentInvariantProblems(semanticOverclaim, claude, codex).some((problem) =>
            problem.includes('cannot claim semantic execution'),
        ),
    )

    const pendingStatus = structuredClone(traceability)
    pendingStatus.cross_agent_invariants[0].status = 'STATIC_ANCHOR_ADDED / LOADER_EVIDENCE_PENDING'
    assert.ok(
        crossAgentInvariantProblems(pendingStatus, claude, codex).some((problem) =>
            problem.includes('status still says loader evidence is pending'),
        ),
    )
})

test('Claude loader evidence proves root and scoped markers are injected in ancestor-first order', () => {
    assert.deepEqual(
        claudeLoaderEvidenceProblems(
            claudeLoaderEvidence,
            claudeLoaderEvidence.instruction_file_sha256,
            traceability.baseline_commit,
        ),
        [],
    )
})

test('Claude loader evidence rejects marker-only prompt matches', () => {
    const partialFile = structuredClone(claudeLoaderEvidence)
    partialFile.contexts.find(
        (context) => context.cwd === '.',
    ).marker_results.root.full_file_match = false
    assert.ok(
        claudeLoaderEvidenceProblems(
            partialFile,
            partialFile.instruction_file_sha256,
            traceability.baseline_commit,
        ).some((problem) => problem.includes('complete instruction file for root: root')),
    )
})

test('Claude loader evidence rejects missing, duplicate, unexpected, mis-scoped, reordered, unsafe, and stale probe claims', () => {
    assert.ok(claudeLoaderEvidenceProblems(null, {}, traceability.baseline_commit).length > 0)

    const missing = structuredClone(claudeLoaderEvidence)
    missing.contexts = missing.contexts.filter((context) => context.cwd !== 'apps/web/services/db')
    assert.ok(
        claudeLoaderEvidenceProblems(
            missing,
            missing.instruction_file_sha256,
            traceability.baseline_commit,
        ).some((problem) => problem.includes('context missing: database')),
    )

    const duplicate = structuredClone(claudeLoaderEvidence)
    duplicate.contexts.push(duplicate.contexts[0])
    assert.ok(
        claudeLoaderEvidenceProblems(
            duplicate,
            duplicate.instruction_file_sha256,
            traceability.baseline_commit,
        ).some((problem) => problem.includes('context is duplicated')),
    )

    const unexpected = structuredClone(claudeLoaderEvidence)
    unexpected.contexts.push({ ...unexpected.contexts[0], cwd: 'apps/web/components' })
    assert.ok(
        claudeLoaderEvidenceProblems(
            unexpected,
            unexpected.instruction_file_sha256,
            traceability.baseline_commit,
        ).some((problem) => problem.includes('context is unexpected')),
    )

    const wrongScope = structuredClone(claudeLoaderEvidence)
    wrongScope.contexts.find((context) => context.cwd === 'apps/web').marker_results.database = {
        present: true,
        payload_path: '$.messages[0].content[3].text',
        position: 32000,
    }
    assert.ok(
        claudeLoaderEvidenceProblems(
            wrongScope,
            wrongScope.instruction_file_sha256,
            traceability.baseline_commit,
        ).some((problem) => problem.includes('marker scope differs for web: database')),
    )

    const wrongOrder = structuredClone(claudeLoaderEvidence)
    wrongOrder.contexts.find((context) => context.cwd === 'apps/web/services/db').marker_order = [
        'database',
        'web',
        'root',
    ]
    assert.ok(
        claudeLoaderEvidenceProblems(
            wrongOrder,
            wrongOrder.instruction_file_sha256,
            traceability.baseline_commit,
        ).some((problem) => problem.includes('precedence order differs for database')),
    )

    const wrongBase = structuredClone(claudeLoaderEvidence)
    wrongBase.base_commit = '0'.repeat(40)
    assert.ok(
        claudeLoaderEvidenceProblems(
            wrongBase,
            wrongBase.instruction_file_sha256,
            traceability.baseline_commit,
        ).some((problem) => problem.includes('different base commit')),
    )

    const unsafe = structuredClone(claudeLoaderEvidence)
    unsafe.isolation.network_route_count = 1
    unsafe.isolation.raw_prompt_persisted = true
    assert.ok(
        claudeLoaderEvidenceProblems(
            unsafe,
            unsafe.instruction_file_sha256,
            traceability.baseline_commit,
        ).some((problem) => problem.includes('zero routes')),
    )
    assert.ok(
        claudeLoaderEvidenceProblems(
            unsafe,
            unsafe.instruction_file_sha256,
            traceability.baseline_commit,
        ).some((problem) => problem.includes('no prompt persistence')),
    )

    const staleHashes = {
        ...claudeLoaderEvidence.instruction_file_sha256,
        'apps/web/CLAUDE.md': '0'.repeat(64),
    }
    assert.ok(
        claudeLoaderEvidenceProblems(
            claudeLoaderEvidence,
            staleHashes,
            traceability.baseline_commit,
        ).some((problem) => problem.includes('stale for apps/web/CLAUDE.md')),
    )
})

test('contradictory nested bypass text is rejected by the real policy parser', () => {
    const problems = agentPolicyProblems({
        'apps/web/AGENTS.md': 'Use git commit --no-verify when hooks are slow.',
    })
    assert.equal(problems.length, 1)
    assert.match(problems[0], /instructs --no-verify/)
})

test('affirmative scoped instructions cannot weaken global toolchain, accessibility, privacy, retention, writer, or PR-budget rules', () => {
    const problems = scopedInstructionConflictProblems({
        'apps/web/CLAUDE.md':
            'Use Node.js 22 for all workspace commands.\nRaise .a11y-baseline.json when the scan is noisy.',
        'scripts/AGENTS.md':
            'Enable Gist sync to test exports.\nDelete unknown previews after 30 days.',
        '.github/CLAUDE.md':
            'Allow two concurrent source writers.\nPermit 18 commits in a pull request.',
    })
    assert.equal(problems.length, 6)
    assert.ok(problems.some((problem) => problem.includes('unsupported Node.js major')))
    assert.ok(problems.some((problem) => problem.includes('accessibility baseline growth')))
    assert.ok(problems.some((problem) => problem.includes('privacy integration activation')))
    assert.ok(problems.some((problem) => problem.includes('unproven retention')))
    assert.ok(problems.some((problem) => problem.includes('multiple concurrent source writers')))
    assert.ok(problems.some((problem) => problem.includes('commit budget above 15')))
})

test('Node runtime and PR commit limits cover the forbidden range without matching counts', () => {
    const invalid = scopedInstructionConflictProblems({
        'apps/web/CLAUDE.md':
            'Use Node.js 23 for builds.\nPin Node 27+ for scripts.\nRequire Node.js 24.14.0.\nAllow 100 commits in a PR.',
    })
    assert.equal(invalid.length, 4)
    assert.equal(
        invalid.filter((problem) => problem.includes('unsupported Node.js major')).length,
        3,
    )
    assert.ok(invalid.some((problem) => problem.includes('commit budget above 15')))

    assert.deepEqual(
        scopedInstructionConflictProblems({
            'apps/web/CLAUDE.md':
                'Use Node.js 24.15.0 for commands.\nUse 25 fixtures for race tests.\nUse 22 regression cases for fallback tests.\nPermit 15 commits in a PR.',
        }),
        [],
    )
})

test('negative policy language does not hide a later affirmative clause', () => {
    assert.deepEqual(
        scopedInstructionConflictProblems({
            'apps/web/AGENTS.md':
                'Do not use Node.js 22; it is outside the supported range.\nNever raise .a11y-baseline.json to silence findings.\nDo not enable Gist sync.',
        }),
        [],
    )
    for (const line of [
        'Never bypass hooks; enable Gist sync to test exports.',
        'Do not enable Gist sync; enable Sentry for debugging.',
        'Never bypass hooks. Enable Gist sync to test exports.',
        'Do not bypass hooks. Review logs and enable Gist sync to test exports.',
        'Do not wait. Enable Gist sync to test exports.',
        'Do not use Node.js 22. Review logs and enable Gist sync to test exports.',
    ]) {
        assert.ok(
            scopedInstructionConflictProblems({ 'apps/web/AGENTS.md': line }).some((problem) =>
                problem.includes('privacy integration activation'),
            ),
            `${line} must retain its affirmative conflict`,
        )
    }
})

test('shared negation applies to coordinated actions but not to a contrast', () => {
    assert.deepEqual(
        scopedInstructionConflictProblems({
            'apps/web/AGENTS.md': 'Do not enable Gist sync or activate Sentry.',
        }),
        [],
    )
    assert.ok(
        scopedInstructionConflictProblems({
            'apps/web/AGENTS.md': 'Do not enable Gist sync, but activate Sentry.',
        }).some((problem) => problem.includes('privacy integration activation')),
    )
})

test('sensitive identity and credential patterns are rejected', () => {
    const problems = sensitivePatternProblems({
        'AGENTS.md': 'Contact maintainer@example.invalid for access.',
        'CLAUDE.md': 'token ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    })
    assert.equal(problems.length, 2)
})

test('all scoped instruction and traceability paths route through CI policy', () => {
    const policyPaths = /POLICY_PATHS='([^']+)'/.exec(read('.github/workflows/ci.yml'))?.[1]
    assert.ok(policyPaths && new RegExp(policyPaths).test('CHANGELOG.md'))
    const ci = read('.github/workflows/ci.yml')
    const pattern = /POLICY_PATHS='([^']+)'/.exec(ci)?.[1]
    assert.ok(pattern)
    const policy = new RegExp(pattern)
    const candidates = [
        ...AGENT_FILES,
        ...SCOPED_INSTRUCTION_FILES,
        'docs/agent-instructions/TRACEABILITY.md',
        'docs/agent-instructions/traceability.json',
        'scripts/security/check-agent-instruction-architecture.mjs',
        'scripts/security/check-agent-instruction-architecture.test.mjs',
    ]
    for (const file of candidates)
        assert.ok(policy.test(file), file + ' does not trigger policy CI')
    assert.equal(policy.test('README.md'), false)
})

test('every normative source claim has exact or anchored evidence at a declared destination', () => {
    assert.deepEqual(sourceDestinationCoverageProblems(traceability), [])

    const missing = structuredClone(traceability)
    delete missing.source_claims.find((claim) => claim.claim_id === 'A-015-L141-1')
        .destination_evidence
    assert.ok(
        sourceDestinationCoverageProblems(missing).some((problem) =>
            problem.includes('A-015-L141-1: source claim has no exact or anchored evidence'),
        ),
    )

    const invalidPath = structuredClone(traceability)
    invalidPath.source_claims.find(
        (claim) => claim.claim_id === 'A-016-L142-1',
    ).destination_evidence[0].path = 'docs/not-a-declared-destination.md'
    assert.ok(
        sourceDestinationCoverageProblems(invalidPath).some((problem) =>
            problem.includes('destination evidence path is not declared'),
        ),
    )

    const missingAnchor = structuredClone(traceability)
    missingAnchor.source_claims.find(
        (claim) => claim.claim_id === 'C-016-L233-1',
    ).destination_evidence[0].anchor = 'a removed rule that cannot match'
    assert.ok(
        sourceDestinationCoverageProblems(missingAnchor).some((problem) =>
            problem.includes('destination evidence anchor is missing'),
        ),
    )
    const unrelatedAnchor = structuredClone(traceability)
    unrelatedAnchor.source_claims.find(
        (claim) => claim.claim_id === 'A-016-L142-1',
    ).destination_evidence[0].anchor = 'For web-only development, run'
    assert.ok(
        sourceDestinationCoverageProblems(unrelatedAnchor).some((problem) =>
            problem.includes('A-016-L142-1: destination evidence anchor is unrelated'),
        ),
    )

    const forgedExemption = structuredClone(traceability)
    const normative = forgedExemption.source_claims.find(
        (claim) => claim.claim_id === 'A-016-L142-1',
    )
    delete normative.destination_evidence
    normative.destination_disposition = {
        kind: 'NON_NORMATIVE_LABEL',
        reason: 'A plausible but fabricated structural reason.',
    }
    assert.ok(
        sourceDestinationCoverageProblems(forgedExemption).some((problem) =>
            problem.includes('A-016-L142-1: invalid non-normative disposition'),
        ),
    )
})
