#!/usr/bin/env node
/**
 * Read-only ruleset drift check.
 *
 * Default mode validates the committed expected policy files.
 * `--live` also reads the repository rulesets with `gh` and fails when the
 * live rules regress below that baseline (missing signature rule, extra
 * bypass actor, merge method other than squash, missing CI Status).
 *
 * Known gaps in the expected file are printed as warnings. They do not fail
 * this process. `--strict` fails on those gaps too. This script never edits
 * GitHub settings.
 *
 * Run: node scripts/check-repository-governance.mjs [--live] [--strict]
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const repo = process.env.GITHUB_REPOSITORY || 'qnbs/CannaGuide-2025'

export function compareRuleset(actual, expected) {
    const failures = []
    if (!actual || actual.enforcement !== expected.enforcement) {
        failures.push(
            `${expected.name}: enforcement is ${actual?.enforcement ?? 'missing'}, expected ${expected.enforcement}`,
        )
    }
    const types = new Set((actual?.rules ?? []).map((rule) => rule.type))
    for (const type of expected.requiredRuleTypes ?? []) {
        if (!types.has(type)) failures.push(`${expected.name}: missing rule ${type}`)
    }
    if (expected.pullRequest) {
        const pull = (actual?.rules ?? []).find((rule) => rule.type === 'pull_request')
        const methods = pull?.parameters?.allowed_merge_methods ?? []
        const wanted = expected.pullRequest.allowedMergeMethods
        if (wanted && JSON.stringify(methods) !== JSON.stringify(wanted)) {
            failures.push(
                `${expected.name}: merge methods ${JSON.stringify(methods)}, expected ${JSON.stringify(wanted)}`,
            )
        }
    }
    if (expected.requiredStatusChecks) {
        const status = (actual?.rules ?? []).find((rule) => rule.type === 'required_status_checks')
        const contexts = (status?.parameters?.required_status_checks ?? []).map(
            (check) => check.context,
        )
        for (const context of expected.requiredStatusChecks) {
            if (!contexts.includes(context)) {
                failures.push(`${expected.name}: required check missing: ${context}`)
            }
        }
    }
    if (expected.forbidBypassActors) {
        const actors = actual?.bypass_actors ?? []
        if (actors.length > 0) {
            failures.push(`${expected.name}: unexpected bypass actors: ${JSON.stringify(actors)}`)
        }
    }
    return failures
}

function load(path) {
    return JSON.parse(readFileSync(resolve(path), 'utf8'))
}

function fetchRulesets() {
    const raw = execFileSync('gh', ['api', `repos/${repo}/rulesets`, '--paginate'], {
        encoding: 'utf8',
    })
    const listed = JSON.parse(raw)
    return listed.map((entry) =>
        JSON.parse(
            execFileSync('gh', ['api', `repos/${repo}/rulesets/${entry.id}`], { encoding: 'utf8' }),
        ),
    )
}

function main() {
    const live = process.argv.includes('--live')
    const strict = process.argv.includes('--strict')
    const mainExpected = load('.github/governance/expected-main-ruleset.json')
    const tagExpected = load('.github/governance/expected-tag-ruleset.json')

    if (
        !Array.isArray(mainExpected.requiredRuleTypes) ||
        mainExpected.requiredRuleTypes.length === 0
    ) {
        console.error('[FAIL] expected main ruleset has no required rules')
        process.exit(1)
    }

    const gaps = mainExpected.gaps ?? []
    if (gaps.length > 0) {
        console.log(`[WARN] ${gaps.length} known governance gap(s):`)
        for (const gap of gaps) console.log(`       - ${gap}`)
    }
    if (strict && gaps.length > 0) {
        console.error('[FAIL] --strict treats known gaps as failures')
        process.exit(1)
    }

    if (!live) {
        console.log('[OK] Expected ruleset files parse. Pass --live to compare GitHub.')
        process.exit(0)
    }

    let rulesets
    try {
        rulesets = fetchRulesets()
    } catch (error) {
        console.error(`[FAIL] Could not read rulesets: ${error.message}`)
        process.exit(1)
    }

    const failures = []
    const mainLive = rulesets.find(
        (ruleset) => ruleset.name === mainExpected.name && ruleset.target === 'branch',
    )
    const tagLive = rulesets.find(
        (ruleset) => ruleset.name === tagExpected.name && ruleset.target === 'tag',
    )
    failures.push(...compareRuleset(mainLive, mainExpected))
    failures.push(...compareRuleset(tagLive, tagExpected))

    if (failures.length > 0) {
        console.error(`[FAIL] ${failures.length} ruleset regression(s):`)
        for (const failure of failures) console.error(`       - ${failure}`)
        process.exit(1)
    }

    console.log('[OK] Live rulesets match the committed baseline.')
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectRun) main()
