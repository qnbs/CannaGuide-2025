import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compareRuleset } from './check-repository-governance.mjs'

const expected = {
    name: 'Main',
    enforcement: 'active',
    requiredRuleTypes: ['required_signatures', 'pull_request', 'required_status_checks'],
    pullRequest: { allowedMergeMethods: ['squash'] },
    requiredStatusChecks: ['✅ CI Status'],
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
                parameters: { required_status_checks: [{ context: '✅ CI Status' }] },
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
