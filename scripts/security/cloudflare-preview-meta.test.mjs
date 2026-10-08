import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkedPreviewMeta, previewMeta, safeBranch } from '../cloudflare-preview-meta.mjs'

const SHA = 'c9abc374d0a39a69e2a50b674313be6cf33c9370'

test('branch names keep only the wrangler-safe alphabet', () => {
    assert.equal(safeBranch('feature/name', '12'), 'feature-name')
    assert.equal(safeBranch('$(rm -rf /)', '12'), 'rm--rf')
    assert.equal(safeBranch('---', '12'), 'pr-12')
    assert.equal(safeBranch('', '12'), 'pr-12')
})

test('write metadata rejects a short sha and a non-numeric PR', () => {
    assert.equal(previewMeta({ rawBranch: 'feature', sha: 'abc', pr: '4' }), null)
    assert.equal(previewMeta({ rawBranch: 'feature', sha: SHA, pr: '4;touch' }), null)
    assert.deepEqual(previewMeta({ rawBranch: 'cursor/ci', sha: SHA, pr: '4' }), {
        branch: 'cursor-ci',
        sha: SHA,
        pr: '4',
    })
})

test('production branch names are not a deploy target', () => {
    assert.equal(safeBranch('main', '4'), 'pr-4')
    assert.equal(safeBranch('MAIN', '4'), 'pr-4')
    assert.equal(safeBranch('master', '4'), 'pr-4')
    assert.equal(safeBranch('production', '4'), 'pr-4')
    assert.deepEqual(checkedPreviewMeta({ branch: 'main', sha: SHA, pr: '4' }, SHA, '4'), {
        branch: 'pr-4',
        label: 'pr-4',
        sha: SHA,
        pr: '4',
    })
})

test('check metadata requires the triggering run sha and PR', () => {
    const meta = { branch: 'cursor-ci', sha: SHA, pr: '4' }
    assert.deepEqual(checkedPreviewMeta(meta, SHA, '4'), {
        branch: 'pr-4',
        label: 'cursor-ci',
        sha: SHA,
        pr: '4',
    })
    assert.equal(checkedPreviewMeta(meta, SHA, '5'), null)
    assert.equal(checkedPreviewMeta({ ...meta, sha: `${SHA.slice(0, 39)}a` }, SHA, '4'), null)
    assert.deepEqual(checkedPreviewMeta({ branch: 'bad branch', sha: SHA, pr: '4' }, SHA, '4'), {
        branch: 'pr-4',
        label: 'bad-branch',
        sha: SHA,
        pr: '4',
    })
    assert.equal(checkedPreviewMeta({ branch: '@@@', sha: SHA, pr: 'nope' }, SHA, 'nope'), null)
})
