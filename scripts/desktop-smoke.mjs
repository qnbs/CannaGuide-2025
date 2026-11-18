#!/usr/bin/env node
/**
 * Desktop runtime smoke test for a packaged CannaGuide build.
 *
 * Launches the real binary (installed .deb, AppImage, NSIS/MSI install, .app) in an
 * isolated profile and proves what a compile, bundle or signature check cannot: that
 * the app starts, the bundled frontend runs and reaches the native side over IPC, a
 * window is painted, a second launch hands over to the running app, the quit goes
 * through a successful save, and a restart loads the saved state.
 *
 * The app cooperates through apps/desktop/src-tauri/src/startup.rs. With
 * CANNAGUIDE_SMOKE_REPORT set, the frontend's startup report is written to that file
 * and the quit acknowledgement next to it (`.quit-ack`, with whether the save
 * succeeded). With CANNAGUIDE_SMOKE_HOLD the app also hides its window on `.hide`
 * (`.hidden`), records the second launch's restore (`.restored`) and quits on `.quit`.
 *
 * Runs (each profile is temporary and removed afterwards; evidence is kept):
 *   1. first start, held: report, versions, outcome, view, visibility, a painted
 *      window (Linux screenshot of the app window only), then hide -> second launch
 *      -> the window is shown again and the second process exits 0, then the quit
 *      -> exit 0 with an acknowledged, successful save
 *   2. restart on the same profile: the state is loaded from the saved snapshot
 *      (hydration "snapshot"); the window-state file is checked before it starts
 *   3. concurrent cold launches, in repeated rounds on fresh profiles: exactly one
 *      instance starts, both exit 0, and the running one shows its window for the other
 *
 * Isolation: HOME and XDG_* (Linux), HOME and CFFIXED_USER_HOME (macOS) point into
 * the profile. Windows resolves app folders through the Known Folder API, which
 * ignores the environment, so on Windows the test refuses to run outside CI (ephemeral
 * runners) unless --allow-real-profile is given.
 *
 * Usage:
 *   node scripts/desktop-smoke.mjs --app <binary> --expect-version <x.y.z>
 *        [--label <name>] [--evidence <dir>] [--appimage] [--report-timeout <s>]
 *        [--require-screenshot] [--concurrent-rounds <n>] [--allow-real-profile]
 * Exit: 0 all checks passed, 1 a check failed, 2 usage or environment error.
 * NOT_RUN never fails a run by itself, except the screenshot under --require-screenshot.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import { isDisposableRunner, removeAppFolder } from './desktop-smoke-profile.mjs'

export const IDENTIFIER = 'com.cannaguide.desktop'
export const REPORT_SCHEMA = 2
const FLUSH_TIMEOUT_LINE = '[quit] no flush confirmation from the frontend'
const QUIT_TIMEOUT_MS = 30_000
const SECOND_INSTANCE_WAIT_MS = 15_000
const SIGNAL_WAIT_MS = 10_000
const LOG_DRAIN_MS = 5_000
const KILL_WAIT_MS = 10_000
/** Below this pixel spread the screenshot is treated as one flat colour: nothing painted. */
export const MIN_PIXEL_SPREAD = 0.02
/** How long a cold first start may take to paint after its report (CI: fonts, shaders). */
export const PAINT_TIMEOUT_MS = 15_000

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
/** Diagnostic detail; never decides the result. */
const info = (name, detail) => ({ name, status: 'INFO', detail })

/** `x86_64-pc-windows-msvc` -> { os: 'windows', arch: 'x86_64' }, as Rust reports them. */
export function targetPlatform(triple) {
    if (!triple) return undefined
    const arch = triple.split('-')[0]
    let os
    if (triple.includes('windows')) os = 'windows'
    else if (triple.includes('apple-darwin')) os = 'macos'
    else if (triple.includes('linux')) os = 'linux'
    return os ? { os, arch } : undefined
}

/** Checks one startup report against what this build must show. */
export function evaluateRecord(record, { version, run, target }) {
    if (!record) {
        return [check(`${run}: startup report written`, false, 'no report before the timeout')]
    }
    const frontend = record.frontend ?? {}
    const outcome = frontend.errorCode
        ? `${frontend.outcome} (${frontend.errorCode})`
        : frontend.outcome
    const checks = [
        check(`${run}: report schema`, record.schema === REPORT_SCHEMA, `schema ${record.schema}`),
        check(`${run}: native version`, record.nativeVersion === version, record.nativeVersion),
        ...(target
            ? [
                  check(
                      `${run}: built for the expected target`,
                      record.os === target.os && record.arch === target.arch,
                      `${record.os}/${record.arch}, expected ${target.os}/${target.arch}`,
                  ),
              ]
            : []),
        check(
            `${run}: bundled frontend version`,
            frontend.frontendVersion === version,
            frontend.frontendVersion,
        ),
        check(`${run}: frontend start outcome`, frontend.outcome === 'started', outcome),
        check(
            `${run}: rendered view`,
            frontend.view === 'app' || frontend.view === 'dialog',
            frontend.view,
        ),
        check(`${run}: window visible`, frontend.visible === true, String(frontend.visible)),
        check(
            `${run}: Local-Only default off`,
            frontend.localOnly === false,
            String(frontend.localOnly),
        ),
    ]
    if (run.startsWith('restart')) {
        checks.push(
            check(
                `${run}: state loaded from the saved snapshot`,
                frontend.hydration === 'snapshot',
                `hydration ${frontend.hydration}`,
            ),
            info(`${run}: saved snapshot on disk`, String(frontend.savedSnapshotPresent)),
        )
    }
    return checks
}

/** The quit acknowledgement: written only by confirm_quit, with the save's result. */
export function evaluateQuitAck(ack, run) {
    if (!ack) {
        return check(
            `${run}: quit acknowledged after a successful save`,
            false,
            'no acknowledgement: the quit did not go through confirm_quit',
        )
    }
    return check(
        `${run}: quit acknowledged after a successful save`,
        ack.saved === true,
        `saved ${ack.saved}`,
    )
}

/** Checks how a run ended: exit code, the quit handshake, no panic. */
export function evaluateExit({ run, exit, stderr }) {
    const timedOutByFlush = stderr.includes(FLUSH_TIMEOUT_LINE)
    let ended = `code ${exit.code} signal ${exit.signal}`
    if (exit.timedOut)
        ended = exit.killFailed ? 'still running after a kill' : 'did not exit before the timeout'
    return [
        check(`${run}: quit exits with code 0`, exit.code === 0, ended),
        check(
            `${run}: output closed after the exit`,
            !exit.drainTimedOut,
            exit.drainTimedOut ? 'a process kept the output open; the group was killed' : 'closed',
        ),
        check(
            `${run}: quit not ended by the flush timeout`,
            !timedOutByFlush,
            timedOutByFlush ? 'the native 10 s flush timeout ended the quit' : 'no flush timeout',
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

/** A delay that can be cancelled, so a settled race leaves no timer behind. */
function timeout(ms) {
    let timer
    const promise = new Promise((done) => {
        timer = setTimeout(() => done({ timedOut: true }), ms)
    })
    return { promise, cancel: () => clearTimeout(timer) }
}

async function within(promise, ms) {
    const limit = timeout(ms)
    try {
        return await Promise.race([promise, limit.promise])
    } finally {
        limit.cancel()
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

const isRunning = (child) => child.exitCode === null && child.signalCode === null

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
    // 'exit' can come before the last output; 'close' comes once stdio has ended.
    const closed = new Promise((done) => {
        child.on('close', () => done({ closed: true }))
        child.on('error', () => done({ closed: true }))
    })
    return {
        child,
        exited,
        closed,
        logs: () => ({ stdout, stderr }),
        save: (dir) => {
            writeFileSync(join(dir, `${logPrefix}.stdout.log`), stdout)
            writeFileSync(join(dir, `${logPrefix}.stderr.log`), stderr)
        },
    }
}

/** Kills whatever is left of the launched process group, even after its leader exited. */
function killGroup(run) {
    if (process.platform === 'win32') {
        spawnSync('taskkill', ['/T', '/F', '/PID', String(run.child.pid)], { stdio: 'ignore' })
        return
    }
    try {
        process.kill(-run.child.pid, 'SIGKILL')
    } catch {
        // No process of the group is left.
    }
}

/** Stops the process tree; returns whether the process is gone afterwards. */
async function stopTree(run) {
    if (!isRunning(run.child)) return true
    killGroup(run)
    if (process.platform !== 'win32' && isRunning(run.child)) {
        try {
            run.child.kill('SIGKILL')
        } catch {
            // Already gone, or not ours to kill; the wait below decides.
        }
    }
    const result = await within(run.exited, KILL_WAIT_MS)
    return !result.timedOut
}

/**
 * Waits for the exit (killing the tree on timeout), then for the end of its output. A
 * helper that keeps the output open past LOG_DRAIN_MS is killed with the group, the
 * streams are closed, and the run records it as a failure.
 */
async function waitForExit(run, timeoutMs, onTimeout) {
    let result = await within(run.exited, timeoutMs)
    if (result.timedOut) {
        // While the stuck process still exists: what it and its webview were doing.
        onTimeout?.()
        const stopped = await stopTree(run)
        result = { code: null, signal: null, timedOut: true, killFailed: !stopped }
    }
    const drained = await within(run.closed, LOG_DRAIN_MS)
    if (drained.timedOut) {
        killGroup(run)
        run.child.stdout?.destroy()
        run.child.stderr?.destroy()
        result = { ...result, drainTimedOut: true }
    }
    return result
}

/** Every window with this title in an `xwininfo -root -tree` listing, with its area. */
export function appWindows(xwininfoTree, title = 'CannaGuide 2025') {
    const windows = []
    for (const entry of String(xwininfoTree).split('\n')) {
        if (!entry.includes(`"${title}":`)) continue
        const id = entry.trim().split(/\s+/)[0]
        if (!/^0x[0-9a-f]+$/i.test(id)) continue
        const size = /\s(\d+)x(\d+)[+-]/.exec(entry)
        windows.push({ id, area: size ? Number(size[1]) * Number(size[2]) : 0, line: entry.trim() })
    }
    return windows.sort((left, right) => right.area - left.area)
}

/** The largest window with this title (GTK can also map small helper windows). */
export function appWindowId(xwininfoTree, title = 'CannaGuide 2025') {
    return appWindows(xwininfoTree, title)[0]?.id
}

/** Parses `xprop -id <id> _NET_WM_PID` output. */
export function windowPid(xpropOutput) {
    const match = /_NET_WM_PID\(CARDINAL\) = (\d+)/.exec(String(xpropOutput))
    return match ? Number(match[1]) : undefined
}

/** Linux: the process group of `pid` (/proc/<pid>/stat, field 5). */
function processGroup(pid) {
    try {
        const stat = readFileSync(`/proc/${pid}/stat`, 'utf8')
        return Number(stat.slice(stat.lastIndexOf(')') + 2).split(' ')[2])
    } catch {
        return undefined
    }
}

/** A child process bounded by what is left of `deadline` (at most 5 s, at least 1 s). */
function bounded(command, args, deadline) {
    const timeout = Math.max(1000, Math.min(5000, deadline - Date.now()))
    return spawnSync(command, args, { encoding: 'utf8', timeout, killSignal: 'SIGKILL' })
}

const toolMissing = (result) => result.error?.code === 'ENOENT'

/** The launched instance's window: the largest one whose process is in its group. */
function instanceWindow(display, tree, group, deadline) {
    for (const candidate of appWindows(tree)) {
        const prop = bounded(
            'xprop',
            ['-display', display, '-id', candidate.id, '_NET_WM_PID'],
            deadline,
        )
        if (toolMissing(prop)) return { error: 'xprop is not installed' }
        const pid = windowPid(prop.stdout)
        if (pid !== undefined && processGroup(pid) === group) return { candidate }
    }
    return { error: 'no window of the launched instance found (xwininfo, xprop)' }
}

function captureSpread(display, windowId, file, deadline) {
    const grab = bounded('import', ['-display', display, '-window', windowId, file], deadline)
    if (toolMissing(grab)) return { error: 'ImageMagick import is not installed' }
    if (grab.error || grab.status !== 0) {
        return {
            error: `capture failed (${grab.error?.code ?? `exit ${grab.status}`})`,
            retry: true,
        }
    }
    const stats = bounded(
        'convert',
        [file, '-format', '%[fx:standard_deviation]', 'info:'],
        deadline,
    )
    if (toolMissing(stats)) return { error: 'ImageMagick convert is not installed' }
    if (stats.error || stats.status !== 0) {
        const reason = stats.error?.code ?? `exit ${stats.status}`
        return { error: `pixel statistics failed (${reason})`, retry: true }
    }
    const spread = pixelSpread(stats.stdout)
    return spread === undefined
        ? { error: 'pixel statistics unavailable', retry: true }
        : { spread }
}

/**
 * Linux only: screenshots of the launched instance's window -- never the whole screen,
 * never another CannaGuide window on the same display -- until it is painted or
 * PAINT_TIMEOUT_MS passes. Every probe is bounded by that deadline. Under
 * --require-screenshot a check that cannot run fails. On failure the evidence keeps
 * only the lines of windows with the app's title, not the rest of the display.
 */
async function screenshot(evidence, name, required, group) {
    const label = 'first-start: window painted'
    const cannotRun = (detail) =>
        required ? check(label, false, `required but not run: ${detail}`) : notRun(label, detail)
    const display = process.env.DISPLAY
    if (process.platform !== 'linux' || !display) return cannotRun('no X display to capture')
    const file = join(evidence, `${name}.png`)
    const deadline = Date.now() + PAINT_TIMEOUT_MS
    let last = {}
    let tree = ''
    for (let attempt = 1; ; attempt += 1) {
        const listing = bounded('xwininfo', ['-display', display, '-root', '-tree'], deadline)
        if (toolMissing(listing)) return cannotRun('xwininfo is not installed')
        tree = listing.status === 0 ? listing.stdout : ''
        const found = instanceWindow(display, tree, group, deadline)
        last = found.candidate
            ? captureSpread(display, found.candidate.id, file, deadline)
            : { ...found, retry: found.error.startsWith('no window') }
        if (last.spread !== undefined && last.spread >= MIN_PIXEL_SPREAD) {
            return check(
                label,
                true,
                `pixel spread ${last.spread.toFixed(4)} after ${attempt} capture(s) (${file})`,
            )
        }
        if (last.error && !last.retry) return cannotRun(last.error)
        if (Date.now() >= deadline) break
        await delay(1000)
    }
    const titled = appWindows(tree).map((window) => window.line)
    writeFileSync(join(evidence, `${name}.windows.txt`), `${titled.join('\n')}\n`)
    if (last.spread === undefined) return cannotRun(last.error)
    return check(
        label,
        false,
        `pixel spread ${last.spread.toFixed(4)} after ${PAINT_TIMEOUT_MS} ms (${file})`,
    )
}

/** WebView2 writes chrome_debug.log into its user data folder with this (smoke only). */
const WEBVIEW2_LOGGING = '--enable-logging --v=1'

/**
 * Windows, before a stuck run is killed: the process list with window titles and
 * states, and the WebView2 log of the app's user data folder.
 */
function windowsHangSnapshot(evidence, name) {
    if (process.platform !== 'win32') return
    const tasks = spawnSync('tasklist', ['/v', '/fo', 'csv'], { encoding: 'utf8', timeout: 15_000 })
    const relevant = String(tasks.stdout ?? '')
        .split('\n')
        .filter((line, index) => index === 0 || /cannaguide|msedgewebview2/i.test(line))
    writeFileSync(join(evidence, `${name}.hang-tasklist.csv`), `${relevant.join('\n')}\n`)
    const log = join(process.env.LOCALAPPDATA ?? '', IDENTIFIER, 'EBWebView', 'chrome_debug.log')
    if (existsSync(log))
        writeFileSync(join(evidence, `${name}.chrome_debug.log`), readFileSync(log))
}

/** Windows: WebView2 processes still running, for the restart diagnosis. */
function webviewProcesses() {
    if (process.platform !== 'win32') return []
    const list = spawnSync(
        'tasklist',
        ['/fo', 'csv', '/nh', '/fi', 'IMAGENAME eq msedgewebview2.exe'],
        { encoding: 'utf8' },
    )
    return String(list.stdout ?? '')
        .split('\n')
        .filter((line) => line.toLowerCase().includes('msedgewebview2.exe'))
}

/** Second launch while the first is held and hidden: it must hand over and exit. */
async function secondInstance(ctx, firstReport) {
    const { app, env, evidence, options, profile, track } = ctx
    const results = []
    writeFileSync(`${firstReport}.hide`, '')
    const hidden = await waitFor(() => existsSync(`${firstReport}.hidden`), SIGNAL_WAIT_MS)
    results.push(
        check(
            'second instance: first window hidden before the second launch',
            hidden && readJson(`${firstReport}.hidden`)?.visible === false,
            hidden ? `visible ${readJson(`${firstReport}.hidden`)?.visible}` : 'no .hidden record',
        ),
    )
    const secondReport = join(profile, 'second-instance.json')
    const second = track(
        launch(
            app,
            { ...env, CANNAGUIDE_SMOKE_REPORT: secondReport },
            `${options.label}-second-instance`,
        ),
    )
    const secondExit = await waitForExit(second, SECOND_INSTANCE_WAIT_MS)
    second.save(evidence)
    const restored = await waitFor(() => existsSync(`${firstReport}.restored`), SIGNAL_WAIT_MS)
    results.push(
        check(
            'second instance: hands over and exits 0',
            !secondExit.timedOut && secondExit.code === 0 && !existsSync(secondReport),
            secondExit.timedOut
                ? 'second instance kept running'
                : `code ${secondExit.code}, own frontend started: ${existsSync(secondReport)}`,
        ),
        check(
            'second instance: first window shown again',
            restored && readJson(`${firstReport}.restored`)?.visible === true,
            restored
                ? `visible ${readJson(`${firstReport}.restored`)?.visible}`
                : 'no .restored record',
        ),
        // Focus is up to the window manager; the gate claims only that the window shows.
        info(
            'second instance: first window focused',
            String(readJson(`${firstReport}.restored`)?.focused),
        ),
    )
    return results
}

/** One start on `profile` that quits by itself after its report. */
async function restartRun(ctx, run) {
    const { app, env, evidence, options, profile, track } = ctx
    const report = join(profile, `${run}.json`)
    const restart = track(
        launch(app, { ...env, CANNAGUIDE_SMOKE_REPORT: report }, `${options.label}-${run}`),
    )
    const exit = await waitForExit(
        restart,
        options.reportTimeoutSeconds * 1000 + QUIT_TIMEOUT_MS,
        () => windowsHangSnapshot(evidence, `${options.label}-${run}`),
    )
    restart.save(evidence)
    return {
        exit,
        results: [
            ...evaluateRecord(readJson(report), {
                version: options.expectVersion,
                run,
                target: targetPlatform(options.expectTarget),
            }),
            evaluateQuitAck(readJson(`${report}.quit-ack`), run),
            ...evaluateExit({ run, exit, stderr: restart.logs().stderr }),
        ],
    }
}

/**
 * One round of two cold launches at the same moment (both before either is ready) on a
 * fresh profile: exactly one may start, both must exit 0, and the one that runs must
 * show its window for the other (the focus handover).
 */
async function concurrentRound(ctx, round) {
    const { app, options, evidence, track, newProfile } = ctx
    const profile = newProfile()
    const env = profileEnv(profile, options)
    // Windows app folders cannot be redirected: each round starts them fresh instead,
    // and only on a verified disposable runner, never on a person's profile.
    const fresh = process.platform === 'win32' ? await resetWindowsAppFolders() : { state: 'fresh' }
    const reports = ['a', 'b'].map((name) => join(profile, `concurrent-${name}.json`))
    const runs = reports.map((report, index) =>
        track(
            launch(
                app,
                { ...env, CANNAGUIDE_SMOKE_REPORT: report, CANNAGUIDE_SMOKE_HOLD: '1' },
                `${options.label}-concurrent-${round}-${index ? 'b' : 'a'}`,
            ),
        ),
    )
    await waitFor(
        () => reports.some((report) => existsSync(report)),
        options.reportTimeoutSeconds * 1000,
    )
    // Give the slower one time to start a frontend too, if it was going to.
    await waitFor(
        () => reports.every((report) => existsSync(report)),
        options.settleMs ?? SECOND_INSTANCE_WAIT_MS,
    )
    const winners = reports.filter((report) => existsSync(report))
    const winner = winners.length === 1 ? winners[0] : undefined
    // The other one must be gone while the winner is still held, without a report.
    const loserRuns = runs.filter((_run, index) => reports[index] !== winner)
    const loserExits = await Promise.all(
        loserRuns.map((run, index) =>
            waitForExit(run, SECOND_INSTANCE_WAIT_MS, () =>
                windowsHangSnapshot(
                    evidence,
                    `${options.label}-concurrent-${round}-loser-${index}`,
                ),
            ),
        ),
    )
    const shown =
        winner !== undefined &&
        (await waitFor(() => readJson(`${winner}.restored`)?.visible === true, SIGNAL_WAIT_MS))
    const record = winner && readJson(winner)
    for (const report of winners) writeFileSync(`${report}.quit`, '')
    const exits = await Promise.all(
        runs.map((run, index) =>
            waitForExit(run, QUIT_TIMEOUT_MS, () =>
                windowsHangSnapshot(
                    evidence,
                    `${options.label}-concurrent-${round}-${index ? 'b' : 'a'}`,
                ),
            ),
        ),
    )
    runs.forEach((run) => run.save(evidence))
    // Counted again after every exit: a second frontend that started late still counts.
    const startedAfter = reports.filter((report) => existsSync(report)).length
    const recordChecks = record
        ? evaluateRecord(record, {
              version: options.expectVersion,
              run: `concurrent ${round}`,
              target: targetPlatform(options.expectTarget),
          })
        : []
    const ack = winner
        ? evaluateQuitAck(readJson(`${winner}.quit-ack`), `concurrent ${round}`)
        : undefined
    return {
        fresh,
        started: startedAfter,
        loserGone: loserExits.every((exit) => exit.code === 0 && !exit.timedOut),
        shown,
        winnerOk:
            recordChecks.length > 0 && recordChecks.every((result) => result.status !== 'FAIL'),
        saved: ack?.status === 'PASS',
        exits,
    }
}

/**
 * Windows: empties the app folders before a concurrent round -- only on a verified
 * disposable runner, through the guard in desktop-smoke-profile.mjs, and once the last
 * round's WebView2 processes have let go of them. A reset that fails there is a
 * failure: the round would otherwise run on state an earlier round left.
 */
async function resetWindowsAppFolders() {
    if (!isDisposableRunner()) return { state: 'unavailable' }
    await waitFor(() => webviewProcesses().length === 0, 30_000, 500)
    for (const base of [process.env.APPDATA, process.env.LOCALAPPDATA]) {
        const result = removeAppFolder(base)
        if (!result.removed) return { state: 'failed', detail: `${base}: ${result.reason}` }
    }
    return { state: 'fresh' }
}

/** Fresh app folders: required where they can be reset, NOT_RUN only where they cannot. */
function freshCheck(states) {
    const label = 'concurrent launch: fresh app folders each round'
    const failedReset = states.find((fresh) => fresh.state === 'failed')
    if (failedReset) return check(label, false, `reset failed: ${failedReset.detail}`)
    if (states.some((fresh) => fresh.state === 'unavailable')) {
        return notRun(label, 'Windows app folders are reset only on a GitHub-hosted runner')
    }
    return check(label, true, 'fresh')
}

/** Repeated rounds, so a race that only sometimes loses is still caught. */
async function concurrentLaunch(ctx) {
    const rounds = ctx.options.concurrentRounds ?? 3
    const outcomes = []
    for (let round = 1; round <= rounds; round += 1)
        outcomes.push(await concurrentRound(ctx, round))
    const describe = (pick) =>
        outcomes.map((outcome, index) => `round ${index + 1}: ${pick(outcome)}`).join('; ')
    return [
        check(
            'concurrent launch: exactly one instance started',
            outcomes.every((outcome) => outcome.started === 1),
            describe((outcome) => `${outcome.started} of 2`),
        ),
        check(
            'concurrent launch: both processes exit 0',
            outcomes.every((outcome) => outcome.exits.every((exit) => exit.code === 0)),
            describe((outcome) =>
                outcome.exits
                    .map((exit) => (exit.timedOut ? 'timeout' : `code ${exit.code}`))
                    .join('/'),
            ),
        ),
        check(
            'concurrent launch: the other process exits 0 while the first is still running',
            outcomes.every((outcome) => outcome.loserGone),
            describe((outcome) => (outcome.loserGone ? 'exited' : 'did not exit')),
        ),
        check(
            'concurrent launch: the running instance showed its window for the other',
            outcomes.every((outcome) => outcome.shown),
            describe((outcome) => (outcome.shown ? 'shown' : 'not shown')),
        ),
        check(
            'concurrent launch: the started instance passed its report checks',
            outcomes.every((outcome) => outcome.winnerOk),
            describe((outcome) => (outcome.winnerOk ? 'passed' : 'failed')),
        ),
        check(
            'concurrent launch: its quit acknowledged a successful save',
            outcomes.every((outcome) => outcome.saved),
            describe((outcome) => (outcome.saved ? 'saved' : 'not acknowledged')),
        ),
        freshCheck(outcomes.map((outcome) => outcome.fresh)),
    ]
}

function profileEnv(profile, options) {
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
    if (process.platform === 'win32') env.WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = WEBVIEW2_LOGGING
    return env
}

async function firstStart(ctx, results) {
    const { app, env, evidence, options, profile, track } = ctx
    const firstReport = join(profile, 'first-start.json')
    // A window-state file that is there before the first start (a Windows profile that
    // cannot be isolated) proves nothing about this run.
    ctx.stateBefore = existsSync(windowStateFile(process.platform, profile, env))
    const first = track(
        launch(
            app,
            { ...env, CANNAGUIDE_SMOKE_REPORT: firstReport, CANNAGUIDE_SMOKE_HOLD: '1' },
            `${options.label}-first-start`,
        ),
    )
    const reported = await waitFor(
        () => existsSync(firstReport) || !isRunning(first.child),
        options.reportTimeoutSeconds * 1000,
    )
    const firstRecord = reported ? readJson(firstReport) : undefined
    results.push(
        ...evaluateRecord(firstRecord, {
            version: options.expectVersion,
            run: 'first-start',
            target: targetPlatform(options.expectTarget),
        }),
    )
    if (firstRecord) {
        results.push(
            await screenshot(
                evidence,
                `${options.label}-first-start`,
                options.requireScreenshot,
                first.child.pid,
            ),
        )
        results.push(...(await secondInstance(ctx, firstReport)))
        results.push(
            check(
                'second instance: first instance still running',
                isRunning(first.child),
                'first instance alive',
            ),
        )
        writeFileSync(`${firstReport}.quit`, '')
    }
    const firstExit = await waitForExit(first, firstRecord ? QUIT_TIMEOUT_MS : 1000, () =>
        windowsHangSnapshot(evidence, `${options.label}-first-start`),
    )
    first.save(evidence)
    if (firstRecord)
        results.push(evaluateQuitAck(readJson(`${firstReport}.quit-ack`), 'first-start'))
    results.push(
        ...evaluateExit({ run: 'first-start', exit: firstExit, stderr: first.logs().stderr }),
    )
    return { firstRecord, firstExit }
}

async function restartAfterFirst(ctx, results) {
    const { env, evidence, options, profile } = ctx
    // Checked before run 2 starts, so a file only run 2 writes cannot pass it.
    const stateFile = windowStateFile(process.platform, profile, env)
    const savedState = existsSync(stateFile)
    results.push(
        ctx.stateBefore
            ? info(
                  'first-start: window state saved by the first run',
                  'not attributable: the file existed before',
              )
            : check('first-start: window state saved by the first run', savedState, stateFile),
    )
    if (savedState) {
        writeFileSync(join(evidence, `${options.label}-window-state.json`), readFileSync(stateFile))
    }
    if (process.platform === 'win32') {
        results.push(
            info(
                'restart: WebView2 processes still running at relaunch',
                String(webviewProcesses().length),
            ),
        )
    }
    const restart = await restartRun(ctx, 'restart')
    results.push(...restart.results)

    // Diagnosis only: a restart that never reported is retried once after every
    // WebView2 process has gone, which tells a slow profile handover from an app
    // that cannot start a second time. The first attempt keeps its FAIL.
    if (restart.exit.timedOut && process.platform === 'win32') {
        const cleared = await waitFor(() => webviewProcesses().length === 0, 30_000, 500)
        results.push(
            info('restart-retry: WebView2 processes gone before the retry', String(cleared)),
        )
        const retry = await restartRun(ctx, 'restart-retry')
        results.push(
            ...retry.results.map((result) => ({
                ...result,
                status: result.status === 'FAIL' ? 'FAIL' : 'INFO',
            })),
        )
    }
}

export async function runSmoke(options) {
    const evidence = resolve(
        options.evidence ?? mkdtempSync(join(tmpdir(), 'cannaguide-smoke-evidence-')),
    )
    mkdirSync(evidence, { recursive: true })
    const profiles = []
    const launched = []
    // Ctrl+C or a CI cancel must not leave a held app or a profile behind; the exit
    // status keeps the signal (130 / 143).
    const onSignal = (signal) => {
        for (const run of launched) if (isRunning(run.child)) killGroup(run)
        for (const dir of profiles) rmSync(dir, { recursive: true, force: true })
        process.exit(signal === 'SIGINT' ? 130 : 143)
    }
    process.once('SIGINT', onSignal)
    process.once('SIGTERM', onSignal)
    const results = []
    let firstRecord
    let command
    try {
        const newProfile = () => {
            const profile = mkdtempSync(join(tmpdir(), 'cannaguide-smoke-profile-'))
            profiles.push(profile)
            return profile
        }
        const profile = newProfile()
        const ctx = {
            app: { command: resolve(options.app), args: [] },
            env: profileEnv(profile, options),
            evidence,
            options,
            profile,
            newProfile,
            track: (run) => {
                launched.push(run)
                return run
            },
        }
        command = ctx.app.command
        const first = await firstStart(ctx, results)
        firstRecord = first.firstRecord
        if (first.firstRecord && first.firstExit.code === 0) {
            await restartAfterFirst(ctx, results)
        } else {
            results.push(notRun('restart', 'the first start did not end cleanly'))
        }
        results.push(...(await concurrentLaunch(ctx)))
    } finally {
        process.off('SIGINT', onSignal)
        process.off('SIGTERM', onSignal)
        // Whatever failed above: no process outlives the run, no profile stays behind.
        for (const run of launched) {
            if (isRunning(run.child) && !(await stopTree(run))) {
                results.push(
                    check('cleanup: every launched process stopped', false, `pid ${run.child.pid}`),
                )
            }
        }
        for (const dir of profiles) rmSync(dir, { recursive: true, force: true })
    }

    const summary = {
        label: options.label,
        platform: `${process.platform}-${process.arch}`,
        app: command,
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
            'require-screenshot': { type: 'boolean', default: false },
            'concurrent-rounds': { type: 'string', default: '3' },
            'expect-target': { type: 'string' },
            'allow-real-profile': { type: 'boolean', default: false },
        },
        strict: true,
        allowPositionals: false,
    })
    if (!values.app || !values['expect-version']) {
        throw new Error('--app and --expect-version are required')
    }
    const reportTimeoutSeconds = Number(values['report-timeout'])
    if (!Number.isFinite(reportTimeoutSeconds) || reportTimeoutSeconds <= 0) {
        throw new Error('--report-timeout must be a positive number of seconds')
    }
    const concurrentRounds = Number(values['concurrent-rounds'])
    if (!Number.isInteger(concurrentRounds) || concurrentRounds < 1) {
        throw new Error('--concurrent-rounds must be a whole number of at least 1')
    }
    if (values['expect-target'] && !targetPlatform(values['expect-target'])) {
        throw new Error(`--expect-target ${values['expect-target']} is not a known target triple`)
    }
    return {
        expectTarget: values['expect-target'],
        concurrentRounds,
        app: values.app,
        expectVersion: values['expect-version'],
        label: values.label,
        evidence: values.evidence,
        appimage: values.appimage,
        reportTimeoutSeconds,
        requireScreenshot: values['require-screenshot'],
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
