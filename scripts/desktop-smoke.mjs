#!/usr/bin/env node
/**
 * Desktop runtime smoke test for a packaged CannaGuide build.
 *
 * Launches the real binary (installed .deb, AppImage, NSIS/MSI install, .app) in an
 * isolated profile and proves what a compile, bundle or signature check cannot:
 * that the app starts, the bundled frontend runs and reaches the native side over
 * IPC, a window is painted, the quit handshake flushes and exits cleanly, and a
 * restart finds the saved state again.
 *
 * The app cooperates through apps/desktop/src-tauri/src/startup.rs: with
 * CANNAGUIDE_SMOKE_REPORT set, the frontend's startup report is written to that file;
 * the app then quits through request_quit, or, with CANNAGUIDE_SMOKE_HOLD, once
 * `<report>.quit` exists.
 *
 * Runs:
 *   1. first start, held: report, view, versions, screenshot (Linux), second
 *      instance, then the quit signal -> exit 0 without a flush timeout
 *   2. restart on the same profile: report with a saved snapshot -> exit 0, and the
 *      window-state file written by run 1
 *
 * Isolation: HOME and XDG_* (Linux), HOME and CFFIXED_USER_HOME (macOS) point into
 * the profile directory. Windows resolves app folders through the Known Folder API,
 * which ignores the environment, so on Windows the test refuses to run outside CI
 * (ephemeral runners) unless --allow-real-profile is given.
 *
 * Usage:
 *   node scripts/desktop-smoke.mjs --app <binary> --expect-version <x.y.z>
 *        [--label <name>] [--evidence <dir>] [--appimage] [--report-timeout <s>]
 *        [--allow-real-profile]
 * Exit: 0 all checks passed, 1 a check failed, 2 usage or environment error.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

export const IDENTIFIER = 'com.cannaguide.desktop'
const FLUSH_TIMEOUT_LINE = '[quit] no flush confirmation from the frontend'
const QUIT_TIMEOUT_MS = 30_000
const SECOND_INSTANCE_WAIT_MS = 15_000
/** Below this pixel spread the screenshot is treated as one flat colour: nothing painted. */
export const MIN_PIXEL_SPREAD = 0.02

/** Environment for one isolated profile; the real user folders are never named. */
export function isolatedEnv(platform, profile, base = process.env) {
    const env = { ...base, RUST_BACKTRACE: '1' }
    if (platform === 'linux') {
        Object.assign(env, {
            HOME: join(profile, 'home'),
            XDG_DATA_HOME: join(profile, 'data'),
            XDG_CONFIG_HOME: join(profile, 'config'),
            XDG_CACHE_HOME: join(profile, 'cache'),
            XDG_STATE_HOME: join(profile, 'state'),
        })
    } else if (platform === 'darwin') {
        env.HOME = join(profile, 'home')
        env.CFFIXED_USER_HOME = join(profile, 'home')
    }
    return env
}

/** Where the window-state plugin keeps its file (Tauri app_config_dir). */
export function windowStateFile(platform, profile, env = process.env) {
    if (platform === 'linux') return join(profile, 'config', IDENTIFIER, '.window-state.json')
    if (platform === 'darwin') {
        return join(
            profile,
            'home',
            'Library',
            'Application Support',
            IDENTIFIER,
            '.window-state.json',
        )
    }
    return join(env.APPDATA ?? '', IDENTIFIER, '.window-state.json')
}

const check = (name, ok, detail) => ({ name, status: ok ? 'PASS' : 'FAIL', detail })
const notRun = (name, detail) => ({ name, status: 'NOT_RUN', detail })

/** Checks one smoke record against what this build must show. */
export function evaluateRecord(record, { version, run }) {
    if (!record)
        return [check(`${run}: startup report written`, false, 'no report before the timeout')]
    const frontend = record.frontend ?? {}
    const checks = [
        check(`${run}: report schema`, record.schema === 1, `schema ${record.schema}`),
        check(`${run}: native version`, record.nativeVersion === version, record.nativeVersion),
        check(
            `${run}: bundled frontend version`,
            frontend.frontendVersion === version,
            frontend.frontendVersion,
        ),
        check(
            `${run}: frontend start outcome`,
            frontend.outcome === 'started',
            frontend.detail ? `${frontend.outcome}: ${frontend.detail}` : frontend.outcome,
        ),
        check(
            `${run}: rendered view`,
            frontend.view === 'app' || frontend.view === 'dialog',
            frontend.view,
        ),
        check(
            `${run}: Local-Only default off`,
            frontend.localOnly === false,
            String(frontend.localOnly),
        ),
    ]
    if (run === 'restart') {
        checks.push(
            check(
                'restart: saved snapshot from the first run found',
                frontend.savedSnapshotPresent === true,
                String(frontend.savedSnapshotPresent),
            ),
        )
    }
    return checks
}

/** Checks how a run ended: exit code and the quit handshake. */
export function evaluateExit({ run, exit, stderr }) {
    return [
        check(
            `${run}: quit exits with code 0`,
            exit.code === 0,
            exit.timedOut
                ? 'did not exit before the timeout'
                : `code ${exit.code} signal ${exit.signal}`,
        ),
        check(
            `${run}: quit waited for the frontend flush`,
            !stderr.includes(FLUSH_TIMEOUT_LINE),
            stderr.includes(FLUSH_TIMEOUT_LINE)
                ? 'quit ended by the flush timeout, not by confirm_quit'
                : 'confirm_quit received',
        ),
        check(`${run}: no panic`, !/panicked at/.test(stderr), 'stderr has no Rust panic'),
    ]
}

/** Parses `convert ... -format "%[fx:standard_deviation]" info:` output. */
export function pixelSpread(output) {
    const value = Number.parseFloat(String(output).trim())
    return Number.isFinite(value) ? value : undefined
}

const readJson = (path) => {
    try {
        return JSON.parse(readFileSync(path, 'utf8'))
    } catch {
        return undefined
    }
}

async function waitFor(predicate, timeoutMs, intervalMs = 250) {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
        if (predicate()) return true
        await delay(intervalMs)
    }
    return predicate()
}

/** Starts the app in its own process group, so the whole tree can be stopped. */
function launch(app, env, logPrefix) {
    const child = spawn(app.command, app.args, {
        env,
        detached: process.platform !== 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
        stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
        stderr += chunk
    })
    const exited = new Promise((done) => {
        child.on('exit', (code, signal) => done({ code, signal }))
        child.on('error', (error) => done({ code: null, signal: null, error: error.message }))
    })
    return {
        child,
        exited,
        logs: () => ({ stdout, stderr }),
        save: (dir) => {
            writeFileSync(join(dir, `${logPrefix}.stdout.log`), stdout)
            writeFileSync(join(dir, `${logPrefix}.stderr.log`), stderr)
        },
    }
}

function stopTree(child) {
    if (child.exitCode !== null || child.signalCode !== null) return
    if (process.platform === 'win32') {
        spawnSync('taskkill', ['/T', '/F', '/PID', String(child.pid)], { stdio: 'ignore' })
        return
    }
    try {
        process.kill(-child.pid, 'SIGKILL')
    } catch {
        child.kill('SIGKILL')
    }
}

async function waitForExit(run, timeoutMs) {
    const result = await Promise.race([
        run.exited,
        delay(timeoutMs).then(() => ({ timedOut: true })),
    ])
    if (result.timedOut) {
        stopTree(run.child)
        await run.exited
        return { code: null, signal: null, timedOut: true }
    }
    return result
}

/** The app window's X id, found by its title; undefined when it is not mapped. */
export function appWindowId(xwininfoTree, title = 'CannaGuide 2025') {
    const line = String(xwininfoTree)
        .split('\n')
        .find((entry) => entry.includes(`"${title}":`))
    const id = line?.trim().split(/\s+/)[0]
    return id && /^0x[0-9a-f]+$/i.test(id) ? id : undefined
}

/**
 * Linux only: a screenshot of the app window (never the whole screen, so a run on a
 * real desktop captures nothing else) and its pixel spread.
 */
function screenshot(evidence, name) {
    const display = process.env.DISPLAY
    if (process.platform !== 'linux' || !display) {
        return notRun('first-start: window painted', 'no X display to capture')
    }
    const tree = spawnSync('xwininfo', ['-display', display, '-root', '-tree'], {
        encoding: 'utf8',
    })
    const windowId = tree.status === 0 ? appWindowId(tree.stdout) : undefined
    if (!windowId) return notRun('first-start: window painted', 'app window not found (xwininfo)')
    const file = join(evidence, `${name}.png`)
    const grab = spawnSync('import', ['-display', display, '-window', windowId, file], {
        encoding: 'utf8',
    })
    if (grab.error || grab.status !== 0) {
        return notRun('first-start: window painted', 'ImageMagick import is not available')
    }
    const stats = spawnSync('convert', [file, '-format', '%[fx:standard_deviation]', 'info:'], {
        encoding: 'utf8',
    })
    const spread = pixelSpread(stats.stdout)
    if (spread === undefined)
        return notRun('first-start: window painted', 'pixel statistics unavailable')
    return check(
        'first-start: window painted',
        spread >= MIN_PIXEL_SPREAD,
        `pixel spread ${spread.toFixed(4)} (${file})`,
    )
}

export async function runSmoke(options) {
    const evidence = resolve(
        options.evidence ?? mkdtempSync(join(tmpdir(), 'cannaguide-smoke-evidence-')),
    )
    mkdirSync(evidence, { recursive: true })
    const profile = mkdtempSync(join(tmpdir(), 'cannaguide-smoke-profile-'))
    const env = isolatedEnv(process.platform, profile)
    for (const key of [
        'HOME',
        'XDG_DATA_HOME',
        'XDG_CONFIG_HOME',
        'XDG_CACHE_HOME',
        'XDG_STATE_HOME',
    ]) {
        if (env[key] && env[key] !== process.env[key]) mkdirSync(env[key], { recursive: true })
    }
    if (options.appimage) env.APPIMAGE_EXTRACT_AND_RUN = '1'
    const app = { command: resolve(options.app), args: [] }
    const timeoutMs = options.reportTimeoutSeconds * 1000
    const results = []

    // Run 1: first start, held open for the screenshot and the second instance.
    const firstReport = join(profile, 'first-start.json')
    const first = launch(
        app,
        { ...env, CANNAGUIDE_SMOKE_REPORT: firstReport, CANNAGUIDE_SMOKE_HOLD: '1' },
        'first-start',
    )
    const reported = await waitFor(
        () => existsSync(firstReport) || first.child.exitCode !== null,
        timeoutMs,
    )
    const firstRecord = reported ? readJson(firstReport) : undefined
    results.push(
        ...evaluateRecord(firstRecord, { version: options.expectVersion, run: 'first-start' }),
    )

    if (firstRecord) {
        await delay(1500)
        results.push(screenshot(evidence, `${options.label}-first-start`))

        const secondReport = join(profile, 'second-instance.json')
        const second = launch(
            app,
            { ...env, CANNAGUIDE_SMOKE_REPORT: secondReport },
            'second-instance',
        )
        const secondExit = await waitForExit(second, SECOND_INSTANCE_WAIT_MS)
        second.save(evidence)
        results.push(
            check(
                'second instance: hands over and exits',
                !secondExit.timedOut && secondExit.code === 0 && !existsSync(secondReport),
                secondExit.timedOut
                    ? 'second instance kept running'
                    : `code ${secondExit.code}, own frontend started: ${existsSync(secondReport)}`,
            ),
            check(
                'second instance: first instance still running',
                first.child.exitCode === null,
                'first instance alive',
            ),
        )
        writeFileSync(`${firstReport}.quit`, '')
    }
    const firstExit = await waitForExit(first, firstRecord ? QUIT_TIMEOUT_MS : 1000)
    first.save(evidence)
    results.push(
        ...evaluateExit({ run: 'first-start', exit: firstExit, stderr: first.logs().stderr }),
    )

    // Run 2: restart on the same profile; quits by itself after its report.
    if (firstRecord && firstExit.code === 0) {
        const restartReport = join(profile, 'restart.json')
        const restart = launch(app, { ...env, CANNAGUIDE_SMOKE_REPORT: restartReport }, 'restart')
        const restartExit = await waitForExit(restart, timeoutMs + QUIT_TIMEOUT_MS)
        restart.save(evidence)
        results.push(
            ...evaluateRecord(readJson(restartReport), {
                version: options.expectVersion,
                run: 'restart',
            }),
        )
        results.push(
            ...evaluateExit({ run: 'restart', exit: restartExit, stderr: restart.logs().stderr }),
        )
        results.push(
            check(
                'restart: window state saved by the first run',
                existsSync(windowStateFile(process.platform, profile, env)),
                windowStateFile(process.platform, profile, env),
            ),
        )
    } else {
        results.push(notRun('restart', 'the first start did not end cleanly'))
    }

    const summary = {
        label: options.label,
        platform: `${process.platform}-${process.arch}`,
        app: app.command,
        expectVersion: options.expectVersion,
        firstRecord,
        results,
    }
    writeFileSync(
        join(evidence, `${options.label}-smoke.json`),
        `${JSON.stringify(summary, null, 2)}\n`,
    )
    return { summary, evidence, passed: results.every((result) => result.status !== 'FAIL') }
}

function parseOptions(argv) {
    const { values } = parseArgs({
        args: argv,
        options: {
            app: { type: 'string' },
            'expect-version': { type: 'string' },
            label: { type: 'string', default: `${process.platform}-${process.arch}` },
            evidence: { type: 'string' },
            appimage: { type: 'boolean', default: false },
            'report-timeout': { type: 'string', default: '120' },
            'allow-real-profile': { type: 'boolean', default: false },
        },
        strict: true,
        allowPositionals: false,
    })
    if (!values.app || !values['expect-version'])
        throw new Error('--app and --expect-version are required')
    const reportTimeoutSeconds = Number(values['report-timeout'])
    if (!Number.isFinite(reportTimeoutSeconds) || reportTimeoutSeconds <= 0) {
        throw new Error('--report-timeout must be a positive number of seconds')
    }
    return {
        app: values.app,
        expectVersion: values['expect-version'],
        label: values.label,
        evidence: values.evidence,
        appimage: values.appimage,
        reportTimeoutSeconds,
        allowRealProfile: values['allow-real-profile'],
    }
}

export async function main(argv = process.argv.slice(2)) {
    let options
    try {
        options = parseOptions(argv)
    } catch (error) {
        console.error(`[desktop-smoke] ${error.message}`)
        return 2
    }
    if (process.platform === 'win32' && !process.env.CI && !options.allowRealProfile) {
        console.error(
            '[desktop-smoke] Windows app folders cannot be isolated; run this on a CI runner',
        )
        return 2
    }
    if (!existsSync(options.app)) {
        console.error(`[desktop-smoke] app not found: ${options.app}`)
        return 2
    }
    const { summary, evidence, passed } = await runSmoke(options)
    for (const result of summary.results) {
        console.log(
            `[${result.status}] ${result.name}${result.detail ? ` -- ${result.detail}` : ''}`,
        )
    }
    console.log(
        `[desktop-smoke] ${passed ? 'PASSED' : 'FAILED'} (${summary.label}); evidence in ${evidence}`,
    )
    return passed ? 0 : 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    process.exitCode = await main()
}
