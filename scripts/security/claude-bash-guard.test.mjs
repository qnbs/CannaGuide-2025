// CG-AUD-20261028-A-S4: the Claude Code PreToolUse Bash guard.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

import { bashViolations } from '../../.claude/hooks/guard-bash.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')
const HOOK = path.join(ROOT, '.claude/hooks/guard-bash.mjs')

test('banned commands are blocked, in any position or wrapper', () => {
    const blocked = [
        ['git commit -m wip --no-verify', /--no-verify/],
        ['git push --no-verify origin feat/x', /--no-verify/],
        ['git commit -n -m "wip"', /git commit -n/],
        ['HUSKY=0 git commit -m wip', /HUSKY=0/],
        ['git -c core.hooksPath=/dev/null commit -m wip', /core\.hooksPath/],
        ['gh pr merge 12 --squash --admin', /admin merge/],
        ['git push --force origin feat/x', /force push/],
        ['git push -f', /force push/],
        ['git push origin +main', /force push/],
        ['git push --force-with-lease origin main', /force push to main/],
        ['git clean -fdx', /git clean -x/],
        ['git clean -f -d -x', /git clean -x/],
        ['git add -A', /git add -A/],
        ['git status && git add .', /git add -A/],
        ['pnpm install', /frozen-lockfile/],
        ['pnpm test', /unfiltered pnpm suite/],
        ['cd apps/web && pnpm run typecheck', /unfiltered pnpm suite/],
        ['turbo run typecheck', /bare turbo run/],
        ['pnpm --filter @cannaguide/web test:run -- Foo', /whole-suite test run/],
        ["bash -c 'git commit --no-verify -m x'", /--no-verify/],
        ['echo "$(git push --force)"', /force push/],
        ['bash <<EOF\ngit push --force\nEOF', /force push/],
        ['(git push --force > push.log 2>&1; echo done)', /force push/],
        ['{ git push -f; }', /force push/],
        ['git commit "--no-verify" -m fix', /--no-verify/],
        ['git -C . commit -n -m fix', /git commit -n/],
        ['git -C . push --force origin feature', /force push/],
        ['git --no-pager -c user.name=x commit --no-verify -m x', /--no-verify/],
        ['cat <<EOF\n$(git push --force)\nEOF', /force push/],
        ['cat <<EOF\n`git push --force`\nEOF', /force push/],
        ['git commit -m "$(git push --force)"', /force push/],
        ["bash -lc 'git push --force'", /force push/],
        ['git -C repo push --force', /force push/],
        [
            'git push --force-with-lease=refs/heads/main origin HEAD:refs/heads/main',
            /force push to main/,
        ],
        ['git push --force-with-lease origin HEAD:refs/heads/main', /force push to main/],
        ['git push --force-with-lease=main:abc123 origin HEAD', /force push to main/],
        ['command git push --force', /force push/],
        ['env pnpm install', /frozen-lockfile/],
        ['env -i PATH=/usr/bin git commit --no-verify -m x', /--no-verify/],
        ['timeout 60 git push -f', /force push/],
        ['nice -n 5 turbo run lint', /bare turbo run/],
        ['git add -- .', /git add -A/],
        ['git add :/', /git add -A/],
        ['git add -A -- apps', /git add -A/],
    ]
    for (const [command, expected] of blocked) {
        const violations = bashViolations(command)
        assert.ok(violations.length > 0, `not blocked: ${command}`)
        assert.match(violations.join('; '), expected, command)
    }
})

test('the commands the working rules prescribe are allowed', () => {
    const allowed = [
        'pnpm verify',
        'pnpm verify:test',
        'pnpm --filter @cannaguide/web test:run analyticsService',
        'pnpm install --frozen-lockfile',
        'turbo run typecheck --filter=@cannaguide/web',
        'git push -u origin fix/x',
        'git push --force-with-lease',
        'git push --force-with-lease origin feat/main-thing',
        'git clean -n',
        'git add apps/web/i18n.ts CHANGELOG.md',
        'gh pr merge 12 --squash --match-head-commit abc123',
        'node --test scripts/security/claude-bash-guard.test.mjs',
        'git log -1 --format="%h %G?" # a comment naming --no-verify',
        'git stash push -q --include-untracked && (git push -u origin fix/x > p.log 2>&1); git stash pop -q',
        'pnpm --filter @cannaguide/web test:run "analyticsService"',
        "pnpm --filter @cannaguide/web test:run 'analyticsService'",
        'git commit -am "explain why --no-verify is banned"',
        'gh pr comment 1 --body "never git push --force; use --force-with-lease"',
        "cat <<'EOF'\n$(git push --force) is literal here\nEOF",
        'git -C apps/web status',
        'git push --force-with-lease origin refs/heads/feat/main-x',
        'git add ./apps/web/i18n.ts',
        'env NODE_OPTIONS=--max-old-space-size=2048 pnpm --filter @cannaguide/web test:run Foo',
        'timeout 300 node ./scripts/graphify-mcp-doctor.mjs',
    ]
    for (const command of allowed) assert.deepEqual(bashViolations(command), [], command)
})

test('wrapper and option parsing stays linear on hostile input (ReDoS)', () => {
    for (const hostile of [
        `nice${' -n5'.repeat(20_000)}!`,
        `timeout${' -k'.repeat(20_000)} x`,
        `git${' -C .'.repeat(20_000)} status`,
    ]) {
        const started = performance.now()
        bashViolations(hostile)
        assert.ok(performance.now() - started < 2_000, `slow on ${hostile.slice(0, 20)}`)
    }
})

test('a commit message that names a banned flag is data, not a command', () => {
    const heredoc = [
        "git commit -q -F - <<'EOF'",
        'docs: explain why --no-verify and git add -A are banned',
        '',
        'HUSKY=0 and gh pr merge --admin are owner actions.',
        'EOF',
    ].join('\n')
    assert.deepEqual(bashViolations(heredoc), [])
    assert.deepEqual(
        bashViolations("git commit -m 'never use --no-verify or git push --force'"),
        [],
    )
})

test('the hook denies through the PreToolUse JSON protocol and stays silent otherwise', () => {
    const run = (input) =>
        spawnSync(process.execPath, [HOOK], { input: JSON.stringify(input), encoding: 'utf8' })
    const denied = run({ tool_name: 'Bash', tool_input: { command: 'git push --no-verify' } })
    assert.equal(denied.status, 0)
    const output = JSON.parse(denied.stdout).hookSpecificOutput
    assert.equal(output.hookEventName, 'PreToolUse')
    assert.equal(output.permissionDecision, 'deny')
    assert.match(output.permissionDecisionReason, /--no-verify/)

    for (const input of [
        { tool_name: 'Bash', tool_input: { command: 'pnpm verify' } },
        { tool_name: 'Read', tool_input: { file_path: 'x' } },
    ]) {
        const result = run(input)
        assert.equal(result.status, 0)
        assert.equal(result.stdout, '')
    }
    const garbage = spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8' })
    assert.equal(garbage.status, 0)
    assert.equal(garbage.stdout, '')
})

test('.claude/settings.json wires the guard to every Bash call', () => {
    const settings = JSON.parse(readFileSync(path.join(ROOT, '.claude/settings.json'), 'utf8'))
    const group = settings.hooks.PreToolUse.find((entry) => entry.matcher === 'Bash')
    assert.ok(group, 'no PreToolUse group for Bash')
    assert.ok(
        group.hooks.some(
            (hook) =>
                hook.type === 'command' && hook.command.includes('.claude/hooks/guard-bash.mjs'),
        ),
        'guard-bash.mjs is not registered',
    )
    assert.ok(settings.permissions.deny.includes('Bash(git commit --no-verify *)'))
})
