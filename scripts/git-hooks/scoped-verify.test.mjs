import assert from 'node:assert/strict'
import test from 'node:test'

import { affectedWorkspaces, changedFiles } from '../scoped-verify.mjs'

test('change discovery combines branch, index, worktree and untracked paths', () => {
    const responses = new Map([
        ['merge-base origin/main HEAD', 'base-sha'],
        ['diff --name-only base-sha...HEAD --', 'apps/web/committed.ts'],
        ['diff --name-only --cached --', 'packages/ui/staged.ts'],
        ['diff --name-only --', 'apps/web/working.ts'],
        ['ls-files --others --exclude-standard --', 'packages/ai-core/untracked.ts'],
    ])

    assert.deepEqual(changedFiles({ git: (args) => responses.get(args.join(' ')) ?? null }), [
        'apps/web/committed.ts',
        'packages/ui/staged.ts',
        'apps/web/working.ts',
        'packages/ai-core/untracked.ts',
    ])
})

test('shared and unrecognized inputs fail safe while documentation stays scoped out', () => {
    assert.deepEqual([...affectedWorkspaces(['apps/web/view.tsx'])], ['@cannaguide/web'])
    assert.equal(affectedWorkspaces(['docs/guide.md', 'README.md']).size, 0)
    assert.equal(affectedWorkspaces(['eslint.config.js']).size, 4)
    assert.equal(affectedWorkspaces(['packages/new-workspace/index.ts']).size, 4)
})
