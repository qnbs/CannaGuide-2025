import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (file) => readFileSync(new URL('../../' + file, import.meta.url), 'utf8')
const matrix = JSON.parse(read('docs/agent-instructions/traceability.json'))
const webPaths = ['apps/web/AGENTS.md', 'apps/web/CLAUDE.md']
const requirements = {
    'A-011': [/react and react-dom versions aligned/i, /package.json and pnpm-lock.yaml/],
    'A-012': [
        /vi.hoisted\(\)/,
        /vi.resetModules\(\)/,
        /dynamic import/,
        /beforeEach/,
        /in isolation/,
    ],
    'A-016': [/200-700 LOC/, /check:file-budget/, /split oversized/i],
    'C-004': [
        /only known filtered TS2719 is at stores\/store.ts/i,
        /elsewhere is a real type error and must not be suppressed/,
    ],
    'C-016': [
        /Redux Toolkit/,
        /useIotStore/,
        /encryptedPassword/,
        /uiStateBridge.ts/,
        /IndexedDB/,
        /localStorage/,
    ],
}

for (const [id, patterns] of Object.entries(requirements)) {
    test(id + ' preserves its contract for both web agents', () => {
        for (const file of webPaths) {
            for (const pattern of patterns) assert.match(read(file), pattern, file + ': ' + pattern)
        }
        const row = matrix.rules.find((rule) => rule.id === id)
        assert.equal(
            row.status,
            'SOURCE_CAPTURED / HISTORICAL_LOADER_MARKERS_VERIFIED / SEMANTIC_PARITY_REVIEWED',
        )
        assert.ok(row.semantic_verification)
    })
}

test('C-016 excludes runtime plaintext credentials in each agent rule', () => {
    for (const [file, marker] of [
        ['apps/web/AGENTS.md', 'WEB-CODEX-08:'],
        ['apps/web/CLAUDE.md', 'WEB-03:'],
    ]) {
        const rule = read(file)
            .split('\n')
            .find((line) => line.includes(marker))
        assert.ok(rule, marker)
        assert.match(rule, /encryptedPassword/)
        assert.match(rule, /never the runtime plaintext `password`/)
    }
})

test('C-018 retains scheduling, cancellation and transfer contracts for both agents', () => {
    const patterns = [
        /promise-based dispatcher/,
        /priority/,
        /retry/,
        /AbortController|abort/,
        /backpressure/,
        /transferable zero-copy/,
    ]
    for (const file of ['apps/web/AGENTS.md', 'apps/web/services/worker-bus/CLAUDE.md']) {
        const text = read(file)
        const rule = text.split('\n').find((line) => /WEB-CODEX-10:|BUS-06:/.test(line))
        for (const pattern of patterns) assert.match(rule, pattern, file + ': ' + pattern)
        assert.match(rule, /not invoke worker implementations directly|not invoked directly/)
    }
    const row = matrix.rules.find((rule) => rule.id === 'C-018')
    assert.ok(row.destination_paths.includes('apps/web/AGENTS.md'))
    assert.match(
        row.semantic_verification,
        /WEB-CODEX-10 and BUS-06 preserve the promise dispatcher, priority, retry, AbortController\/abort, backpressure and transferable zero-copy contracts/,
    )
    assert.match(row.semantic_verification, /WEB-12 retains no direct worker invocation/)
    assert.equal(
        row.status,
        'SOURCE_CAPTURED / HISTORICAL_LOADER_MARKERS_VERIFIED / SEMANTIC_PARITY_REVIEWED',
    )
})
