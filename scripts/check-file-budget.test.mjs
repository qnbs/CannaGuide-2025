import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'

import { allTrackedInScanDirs, inScanDirs } from './check-file-budget.mjs'

test('a full scan finds the tracked app source, not zero files', () => {
    const files = allTrackedInScanDirs()
    // The brace pathspec it used before matched nothing; the scope is several hundred files.
    assert.ok(files.length > 500, `only ${files.length} files in scope`)
    for (const covered of [
        'apps/web/services/aiService.ts',
        'apps/web/bootstrap/mountHydratedApp.ts',
        'apps/web/lib/transformersOrtAssets.mjs',
        'apps/web/i18n.ts',
        'apps/web/index.tsx',
    ]) {
        assert.ok(files.includes(covered), covered)
    }
    for (const file of files) {
        assert.match(file, /\.(ts|tsx|mjs)$/, file)
        assert.doesNotMatch(file, /\.(test|spec)\.(ts|tsx|mjs)$/, file)
    }
})

test('the scope covers every tracked app source directory except data and translations', () => {
    const tracked = spawnSync('git', ['ls-files', '-z', '--', 'apps/web'], { encoding: 'utf8' })
        .stdout.split('\0')
        .filter((file) => /\.(ts|tsx|mjs)$/.test(file) && !/\.(test|spec|ct|stories)\./.test(file))
    const outside = tracked.filter(
        (file) =>
            !inScanDirs(file) &&
            !/^apps\/web\/(data|locales|tests|public)\//.test(file) &&
            !file.endsWith('.d.ts'),
    )
    assert.deepEqual(outside, [], 'app source outside the file budget')
})

test('only direct children of apps/web count as its root files', () => {
    assert.equal(inScanDirs('apps/web/i18n.ts'), true)
    assert.equal(inScanDirs('apps/web/data/strains/b.ts'), false)
    assert.equal(inScanDirs('apps/web/locales/en/common.ts'), false)
    assert.equal(inScanDirs('apps/web/bootstrap/render.tsx'), true)
    assert.equal(inScanDirs('packages/ui/src/index.ts'), true)
})
