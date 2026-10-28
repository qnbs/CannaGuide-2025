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
        ['HUSKY="0" git commit -m x', /HUSKY=0/],
        ['for b in a b; do git push --force origin $b; done', /force push/],
        ['if true; then git add -A; fi', /git add -A/],
        ['! git push -f', /force push/],
        ['sleep 1 & git push --force', /force push/],
        ['echo a#b; git push --force', /force push/],
        ['[ $# -gt 0 ] && git add -A', /git add -A/],
        [`git commit -m "it's done" && git push --force origin x && echo "don't"`, /force push/],
        ['git -c k=v add -A', /git add -A/],
        ['git commit \\\n  --no-verify -m fix', /--no-verify/],
        ['corepack pnpm install', /frozen-lockfile/],
        ['corepack pnpm test', /unfiltered pnpm suite/],
        ['corepack pnpm@11.19.0 install', /frozen-lockfile/],
        ['echo x | xargs git push -f', /force push/],
        ["eval 'git push --force'", /force push/],
        ['git config core.hooksPath /dev/null', /core\.hooksPath/],
        ['git config --unset core.hooksPath', /core\.hooksPath/],
        ['git -c core.hookspath=/dev/null commit -m x', /core\.hooksPath/],
        ['git push -fu origin feature', /force push/],
        ['pnpm install --frozen-lockfile=false', /frozen-lockfile/],
        ['pnpm install --frozen-lockfile --no-frozen-lockfile', /frozen-lockfile/],
        ['pnpm test -- --filter=!@cannaguide/web', /unfiltered pnpm suite/],
        ['pnpm --filter=@cannaguide/web test:run', /whole-suite test run/],
        ['pnpm -F @cannaguide/web test:run', /whole-suite test run/],
        ['git commit -m "$(printf fix)" --no-verify', /--no-verify/],
        ['git commit -m `printf fix` --no-verify', /--no-verify/],
        ['echo $(echo $(git push --force))', /force push/],
        ['echo "$(git commit -m "fix" --no-verify)"', /--no-verify/],
        ['pnpm --filter @cannaguide/web test:run > /tmp/vitest.log', /whole-suite test run/],
        ['pnpm --filter @cannaguide/web test:run 2>&1 | tee run.log', /whole-suite test run/],
        ['# document <<EOF syntax\ngit commit --no-verify -m fix', /--no-verify/],
        ["echo '<<EOF'\ngit commit --no-verify -m fix", /--no-verify/],
        ['export HUSKY=0', /HUSKY=0/],
        ["bash -s <<'EOF'\ngit push --force\nEOF", /force push/],
        ['diff <(git push --force) x', /force push/],
        ["echo $'a\\'b'; git push -f", /force push/],
        ['env -u FOO git push --force', /force push/],
        ['git add **', /git add -A/],
        ['git add **/*', /git add -A/],
        ['pnpm --dir apps/web install', /frozen-lockfile/],
        ['pnpm -C apps/web install', /frozen-lockfile/],
        ['turbo run test -- --filter=@cannaguide/web', /bare turbo run/],
        ['pnpm --silent test', /unfiltered pnpm suite/],
        ['pnpm --silent --filter @cannaguide/web test:run', /whole-suite test run/],
        ['pnpm exec turbo run typecheck', /bare turbo run/],
        ['echo ${X:-$(git commit --no-verify -m fix)}', /--no-verify/],
        ["bash <<< 'git commit --no-verify -m fix'", /--no-verify/],
        ['if true; then HUSKY=0 git commit -m fix; fi', /HUSKY=0/],
        ['pnpm exec turbo run lint', /bare turbo run/],
        ['sudo -u root git push --force', /force push/],
        ['env -u NODE_OPTIONS HUSKY=0 git commit -m fix', /HUSKY=0/],
        ['pnpm --filter @cannaguide/web test:run --testTimeout 10000', /whole-suite test run/],
        ['pnpm --filter @cannaguide/web test:run --hook-timeout 5000', /whole-suite test run/],
        ['pnpm --filter @cannaguide/web test:run --coverage.reporter text', /whole-suite/],
        ["/bin/bash -lc 'git commit --no-verify -m fix'", /--no-verify/],
        ['/usr/bin/git push --force', /force push/],
        ['/usr/bin/git commit --no-verify -m x', /--no-verify/],
        ["env -S 'git push --force'", /force push/],
        ['env -S"git push --force"', /force push/],
        ['git push --force-with-lease', /without a named branch/],
        ['git push --force-with-lease origin', /without a named branch/],
        ['git commit $(printf -- --no-verify) -m fix', /command substitution/],
        ['git commit -m fix `printf -- -n`', /command substitution/],
        ['pnpm test:run --filter @cannaguide/web', /whole-suite test run/],
        ['pnpm test:run --filter @cannaguide/web Foo', /whole-suite test run/],
        ['pnpm test --filter=@cannaguide/web', /whole-suite test run/],
        ["/usr/bin/env bash <<< 'git push --force'", /force push/],
        ['pnpm --registry https://registry.npmjs.org/ install', /frozen-lockfile/],
        ['pnpm --some-new-option value install', /frozen-lockfile/],
        ['pnpm --some-new-option value test', /unfiltered pnpm suite/],
        ['pnpm --filter @cannaguide/web test:run -t .', /whole-suite test run/],
        ['pnpm --filter @cannaguide/web test:run .', /whole-suite test run/],
        [`echo ${'$('.repeat(10)}true${')'.repeat(10)}`, /nesting deeper than 8/],
        ['X="$(git push --force)"', /force push/],
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
        'git push --force-with-lease origin feature',
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
        'cat <<<"git push --force"',
        `echo "it's fine" && git status`,
        'node a.mjs > out.log 2>&1 && echo done',
        'pnpm install \\\n  --frozen-lockfile',
        'git commit -m "fix eval; git push --force is now blocked"',
        'git commit -m "bash -c handling"',
        'git config --get core.hooksPath',
        'git -C . config --get core.hooksPath',
        'git config get core.hooksPath',
        'corepack enable',
        'corepack pnpm install --frozen-lockfile',
        "node -e 'console.log(`git push --force and --no-verify are denied`)'",
        'pnpm install --no-frozen-lockfile --frozen-lockfile',
        'pnpm install --frozen-lockfile=true',
        'pnpm --filter=@cannaguide/web test:run analyticsService',
        'pnpm --filter @cannaguide/web test:run -t "renders" analyticsService',
        `grep -n "frozen|'pnpm install without" guard.mjs`,
        'git commit -m "$(printf fix)"',
        'git push -u origin feature',
        'git push --follow-tags origin feature',
        "rg -n 'HUSKY=0' .husky",
        'git status # HUSKY=0 must never be used',
        'pnpm --filter @cannaguide/web test:run analyticsService > /tmp/vitest.log 2>&1',
        'cat <<EOF\nplain text naming git push --force\nEOF',
        'git add apps/web/*.ts',
        'pnpm --dir apps/web install --frozen-lockfile',
        'pnpm --silent --filter @cannaguide/web test:run analyticsService',
        'turbo run typecheck --filter=@cannaguide/web -- --noEmit',
        'pnpm exec turbo run typecheck --filter=@cannaguide/web',
        'echo ${HOME:-/tmp}/x',
        'pnpm --filter @cannaguide/web test:run -t renders analyticsService',
        'echo $(echo $(echo ok))',
        'pnpm --registry https://registry.npmjs.org/ install --frozen-lockfile',
        'pnpm --silent --filter @cannaguide/web test:run Foo',
        'pnpm --filter @cannaguide/web test:run --testTimeout 10000 analyticsService',
        'X=/usr/bin/git node ./scripts/x.mjs',
        '/usr/bin/git status',
        'git commit -am "$(printf fix)"',
        'git commit --author "$(git config user.name) <x@y>" -m fix',
        'git push -u origin fix/x',
        "cat <<< 'git commit --no-verify -m fix'",
        'R[t1]="never git push --force or git commit -n"; gh api graphql -f b="${R[t1]}"',
        'BODY=\'explains --no-verify and git add -A\'; echo "$BODY"',
        'gh pr comment 1 --body "the guard denies \\$(git push --force) too"',
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
