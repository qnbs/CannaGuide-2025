import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compareRuleset, parseRulesetList } from './check-repository-governance.mjs'

const expected = {
    name: 'Main',
    enforcement: 'active',
    requiredRuleTypes: ['required_signatures', 'pull_request', 'required_status_checks'],
    pullRequest: { allowedMergeMethods: ['squash'] },
    requiredStatusChecks: ['\u2705 CI Status'],
    forbidBypassActors: true,
}

function live(overrides = {}) {
    return {
        name: 'Main',
        enforcement: 'active',
        bypass_actors: [],
        rules: [
            { type: 'required_signatures' },
            { type: 'pull_request', parameters: { allowed_merge_methods: ['squash'] } },
            {
                type: 'required_status_checks',
                parameters: { required_status_checks: [{ context: '\u2705 CI Status' }] },
            },
        ],
        ...overrides,
    }
}

test('baseline ruleset matches', () => {
    assert.deepEqual(compareRuleset(live(), expected), [])
})

test('missing signature rule fails', () => {
    const actual = live()
    actual.rules = actual.rules.filter((rule) => rule.type !== 'required_signatures')
    assert.match(compareRuleset(actual, expected).join('\n'), /required_signatures/)
})

test('bypass actor fails', () => {
    const actual = live({ bypass_actors: [{ actor_type: 'RepositoryRole' }] })
    assert.match(compareRuleset(actual, expected).join('\n'), /bypass/)
})

test('an include of the default branch still fails when main is excluded', () => {
    const actual = live({
        conditions: {
            ref_name: { include: ['~DEFAULT_BRANCH'], exclude: ['refs/heads/main'] },
        },
    })
    const withRefs = { ...expected, refInclude: ['~DEFAULT_BRANCH'] }
    assert.match(compareRuleset(actual, withRefs).join('\n'), /ref exclude removes/)
})

test('paginated ruleset pages flatten into one list', () => {
    const pages = JSON.stringify([[{ id: 1 }], [{ id: 2 }]])
    assert.deepEqual(parseRulesetList(pages), [{ id: 1 }, { id: 2 }])
    assert.deepEqual(parseRulesetList(JSON.stringify([{ id: 3 }])), [{ id: 3 }])
})

test('a branch ruleset that no longer includes the default branch fails', () => {
    const actual = live({
        conditions: { ref_name: { include: ['refs/heads/feature'], exclude: [] } },
    })
    const withRefs = { ...expected, refInclude: ['~DEFAULT_BRANCH'] }
    assert.match(compareRuleset(actual, withRefs).join('\n'), /ref include missing/)
})
