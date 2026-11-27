import assert from 'node:assert/strict'
import test from 'node:test'
import { buildNativeTscArgs, formatCompilerTermination } from './run-native-tsc.mjs'

test('native TypeScript invocations are single-threaded by default', () => {
    assert.deepEqual(buildNativeTscArgs(), ['--noEmit', '--singleThreaded'])
    assert.deepEqual(buildNativeTscArgs(['--build', '--builders', '1']), [
        '--build',
        '--builders',
        '1',
        '--singleThreaded',
    ])
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
