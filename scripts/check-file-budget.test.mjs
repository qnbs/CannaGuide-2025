import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { allTrackedInScanDirs, inScanDirs, repositoryRoot } from './check-file-budget.mjs'

test('a full scan finds the tracked app source, not zero files', () => {
    const files = allTrackedInScanDirs()
    // The brace pathspec it used before matched nothing. Its answer is compared with an
    // independent listing of the whole tree, so the test names no file and survives a rename.
    const independent = spawnSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
        .stdout.split('\0')
        .filter(
            (file) =>
                /\.(ts|tsx|mjs)$/.test(file) &&
                !/\.(test|spec)\.(ts|tsx|mjs)$/.test(file) &&
                inScanDirs(file),
        )
        .sort()
    assert.ok(independent.length > 0, 'no app source in scope at all')
    assert.deepEqual(files, independent)
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
    // Fails on purpose for a new source directory: add it to SCAN_GLOBS, or exclude it above.
    assert.deepEqual(
        outside,
        [],
        'app source outside the file budget: add its directory to SCAN_GLOBS or exclude it here',
    )
})

test('only direct children of apps/web count as its root files', () => {
    assert.equal(inScanDirs('apps/web/i18n.ts'), true)
    assert.equal(inScanDirs('apps/web/data/strains/b.ts'), false)
    assert.equal(inScanDirs('apps/web/locales/en/common.ts'), false)
    assert.equal(inScanDirs('apps/web/bootstrap/render.tsx'), true)
    assert.equal(inScanDirs('packages/ui/src/index.ts'), true)
})

test('a run from a subdirectory sees the same files as one from the root', () => {
    // Root-relative pathspecs used to match nothing from apps/web, and the CLI's existsSync
    // dropped every root-relative diff path, so both scans passed on zero files.
    const root = repositoryRoot()
    const sub = join(root, 'apps', 'web')
    assert.deepEqual(allTrackedInScanDirs(sub), allTrackedInScanDirs(root))
    assert.equal(repositoryRoot(sub), root)
    const scope = (cwd) =>
        spawnSync(process.execPath, [join(root, 'scripts/check-file-budget.mjs')], {
            cwd,
            encoding: 'utf8',
            env: { ...process.env, FILE_BUDGET_ADVISORY: '1' },
        }).stdout.match(/Scope: (\d+) file\(s\)/)?.[1]
    const fromRoot = scope(root)
    assert.ok(fromRoot !== undefined, 'no scope line')
    assert.equal(scope(sub), fromRoot)
})

test('a failed git enumeration throws instead of scanning nothing', (t) => {
    // The old full scan matched zero files and passed; an empty answer must never pass now.
    const outside = mkdtempSync(join(tmpdir(), 'cg-budget-'))
    t.after(() => rmSync(outside, { recursive: true, force: true }))
    assert.throws(() => allTrackedInScanDirs(outside), /git ls-files failed/)
})
