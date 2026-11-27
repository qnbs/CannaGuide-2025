import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import test from 'node:test'
import {
    buildNativeTscArgs,
    findUnexpectedTypeScriptErrors,
    formatCompilerTermination,
    isWebTypecheck,
    shouldDelegateRootTypecheck,
} from './run-native-tsc.mjs'

test('native TypeScript invocations are single-threaded by default', () => {
    assert.deepEqual(buildNativeTscArgs(), ['--noEmit', '--singleThreaded'])
    assert.deepEqual(buildNativeTscArgs(['--build', '--builders', '1']), [
        '--build',
        '--builders',
        '1',
        '--singleThreaded',
    ])
})

test('the known RTK diagnostic exception is limited to the web typecheck and canonical store', () => {
    const webStoreError =
        'apps/web/stores/store.ts(73,12): error TS2719: known Redux Toolkit incompatibility'
    const uiStoreError =
        'packages/ui/src/store.ts(12,4): error TS2719: unrelated workspace error'
    const otherWebStoreError =
        'apps/web/state/store.ts(4,2): error TS2719: unrelated web error'
    const differentWebError =
        'apps/web/stores/store.ts(8,1): error TS2345: unrelated web error'
    const errors = [webStoreError, uiStoreError, otherWebStoreError, differentWebError]

    assert.deepEqual(findUnexpectedTypeScriptErrors(errors), errors)
    const webCwd = resolve(process.cwd(), 'apps/web')
    const uiCwd = resolve(process.cwd(), 'packages/ui')
    assert.equal(isWebTypecheck(webCwd, ['--noEmit']), true)
    assert.equal(isWebTypecheck(uiCwd, ['--noEmit']), false)
    assert.equal(isWebTypecheck(webCwd, ['--build']), false)
    assert.deepEqual(findUnexpectedTypeScriptErrors(errors), errors)
    assert.deepEqual(
        findUnexpectedTypeScriptErrors(errors, {
            allowKnownRtkError: true,
            cwd: process.cwd(),
        }),
        [uiStoreError, otherWebStoreError, differentWebError],
    )
    assert.deepEqual(findUnexpectedTypeScriptErrors(
        ['stores/store.ts(73,12): error TS2719: known Redux Toolkit incompatibility'],
        {
            allowKnownRtkError: isWebTypecheck(webCwd, ['--noEmit']),
            cwd: webCwd,
        },
    ), [])
    assert.deepEqual(
        findUnexpectedTypeScriptErrors(['stores/store.ts(73,12): error TS2719: known issue'], {
            allowKnownRtkError: isWebTypecheck(uiCwd, ['--noEmit']),
            cwd: uiCwd,
        }),
        ['stores/store.ts(73,12): error TS2719: known issue'],
    )
})

test('a root typecheck delegates to affected workspace selection', () => {
    assert.equal(shouldDelegateRootTypecheck(process.cwd(), ['--noEmit']), true)
    assert.equal(
        shouldDelegateRootTypecheck(resolve(process.cwd(), 'apps/web'), ['--noEmit']),
        false,
    )
    assert.equal(shouldDelegateRootTypecheck(process.cwd(), ['--build']), false)
    assert.equal(shouldDelegateRootTypecheck(process.cwd(), ['--project', 'tsconfig.json']), false)
})

test('native compiler termination preserves captured diagnostics', () => {
    assert.equal(
        formatCompilerTermination({
            status: null,
            signal: 'SIGABRT',
            stdout: '',
            stderr: 'fatal error: out of memory',
        }),
        'fatal error: out of memory\nTypeScript compiler terminated without an exit code (SIGABRT).',
    )
})
