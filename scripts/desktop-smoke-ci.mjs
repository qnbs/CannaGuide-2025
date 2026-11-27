#!/usr/bin/env node
/**
 * Runs the desktop runtime smoke (scripts/desktop-smoke.mjs) on a CI runner the way a
 * user installs the app, for one Tauri bundle directory:
 *
 *   Linux   the .deb installed through apt (its Depends resolved like a user's) and the
 *           AppImage extracted (no FUSE on runners), each under Xvfb in its own D-Bus
 *           session, with the painted-window check required
 *   macOS   the .app; for an x86_64 build on an arm64 runner Rosetta 2 is installed if
 *           missing, and without it the run FAILS -- an Intel bundle is never qualified
 *           without a launch
 *   Windows the NSIS installer, then its silent uninstaller, then the MSI installer on the
 *           clean machine; each exit code is checked. The NSIS program is found by name
 *           under the per-user folder; the MSI program is taken from the MSI's own log
 *           (INSTALLDIR), so the test launches what that installer installed -- with an
 *           NSIS install present, the MSI reuses its folder. The app folders are reset
 *           before each install (they cannot be redirected); the uninstall entries and
 *           the MSI log go into the evidence
 *
 * Desktop Build runs this before the bundles are uploaded, so a build that does not
 * start never reaches verify or Release Publish. It replaces a composite action, so
 * the workflow has no workspace-relative `uses:` for it (zizmor self-repository).
 *
 * Usage: node scripts/desktop-smoke-ci.mjs --target <triple> --bundle-dir <dir>
 *        [--evidence <dir>]
 * Exit: 0 every launch passed, 1 a launch or install failed, 2 usage error.
 */
import { spawnSync } from 'node:child_process'
import {
    chmodSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import { isDisposableRunner, removeAppFolder } from './desktop-smoke-profile.mjs'

const PROGRAM = 'cannaguide-desktop.exe'
const HARNESS = 'scripts/desktop-smoke.mjs'

/** The first entry of `dir` whose name matches `pattern`, as a full path. */
export function findIn(dir, pattern) {
    if (!existsSync(dir)) return undefined
    const name = readdirSync(dir).find((entry) => pattern.test(entry))
    return name ? join(dir, name) : undefined
}

/** A file called `name` below one of `roots`, at most `depth` folders down. */
export function findInstalled(roots, name, depth = 3) {
    const walk = (dir, left) => {
        let entries
        try {
            entries = readdirSync(dir, { withFileTypes: true })
        } catch {
            return undefined
        }
        const hit = entries.find(
            (entry) => entry.isFile() && entry.name.toLowerCase() === name.toLowerCase(),
        )
        if (hit) return join(dir, hit.name)
        if (left === 0) return undefined
        for (const entry of entries) {
            if (!entry.isDirectory()) continue
            const found = walk(join(dir, entry.name), left - 1)
            if (found) return found
        }
        return undefined
    }
    for (const root of roots.filter(Boolean)) {
        const found = walk(root, depth)
        if (found) return found
    }
    return undefined
}

/** INSTALLDIR as the MSI's verbose log records it; undefined when it is not there. */
export function msiInstallDir(logText) {
    const match = /Property\(S\): INSTALLDIR = (.+?)\s*$/m.exec(String(logText))
    return match ? match[1] : undefined
}

/** An MSI verbose log is UTF-16 with a byte order mark; read it either way. */
export function readMsiLog(file) {
    if (!existsSync(file)) return ''
    const raw = readFileSync(file)
    const utf16 = raw.length >= 2 && raw[0] === 0xff && raw[1] === 0xfe
    return utf16 ? raw.toString('utf16le') : raw.toString('utf8')
}

/** What an x86_64 macOS bundle needs before it can be launched on this runner. */
export function rosettaPlan({ target, machine, rosettaWorks }) {
    if (target !== 'x86_64-apple-darwin' || machine !== 'arm64') return 'launch'
    return rosettaWorks ? 'launch' : 'install-rosetta'
}

/** The executable inside a macOS .app bundle. */
export function appBinary(app) {
    const dir = join(app, 'Contents', 'MacOS')
    if (!existsSync(dir)) return undefined
    const name = readdirSync(dir).find((entry) => {
        const stat = statSync(join(dir, entry))
        return stat.isFile() && stat.mode & 0o111
    })
    return name ? join(dir, name) : undefined
}

const pause = new Int32Array(new SharedArrayBuffer(4))
const sleepSync = (ms) => Atomics.wait(pause, 0, 0, ms)

/**
 * Polls `predicate` without leaving the synchronous flow. True only when it holds at a
 * check made by the deadline: no sleep runs past it, and a state first seen after it
 * does not count.
 */
export function waitUntil(predicate, ms, stepMs = 500, { now = Date.now, sleep = sleepSync } = {}) {
    const deadline = now() + ms
    for (;;) {
        if (predicate()) return true
        const remaining = deadline - now()
        if (remaining <= 0) return false
        sleep(Math.min(stepMs, remaining))
        if (now() > deadline) return false
    }
}

const run = (command, args, options = {}) =>
    spawnSync(command, args, { stdio: 'inherit', encoding: 'utf8', ...options })

const ok = (result) => !result.error && result.status === 0

/** An uninstaller that is not done after this is stuck: it is killed and the step fails. */
const UNINSTALL_TIMEOUT_MS = 5 * 60_000

/**
 * Runs the NSIS uninstaller of `nsisApp` in place and waits until the program is gone.
 * NSIS reads `_?=` only as the last argument and unquoted, even with spaces in the
 * path; Node would quote "CannaGuide 2025", the flag would be ignored, and the
 * uninstaller would copy itself away and return 0 at once (Windows run on 152d3e43).
 * So the line goes through cmd.exe as written -- the program path quoted, `_?=` bare
 * and last; both paths come from this run's own install.
 */
export function uninstallNsis(
    nsisApp,
    { spawn = spawnSync, exists = existsSync, wait = waitUntil, removalMs = 60_000 } = {},
) {
    const nsisDir = dirname(nsisApp)
    // `_?=` has to stay unquoted, so the folder must be one cmd.exe passes on as it is:
    // only letters, digits, `_`, space, `.`, `:`, `-` and path separators -- an allow
    // list, so `&`, parentheses, `%` and anything else cmd.exe might read are refused
    // (Sourcery on #884). The runner's install folder is such a plain path.
    if (!/^[\w .:\\/-]+$/.test(nsisDir)) {
        return {
            removed: false,
            detail: `install folder ${nsisDir} has characters cmd.exe would interpret`,
        }
    }
    const result = spawn(`"${join(nsisDir, 'uninstall.exe')}" /S _?=${nsisDir}`, {
        shell: true,
        stdio: 'inherit',
        timeout: UNINSTALL_TIMEOUT_MS,
        killSignal: 'SIGKILL',
    })
    if (!ok(result)) {
        const how = result.error
            ? result.error.message
            : result.signal
              ? `killed by ${result.signal}`
              : `exited ${result.status}`
        return { removed: false, detail: `uninstaller ${how}` }
    }
    if (!wait(() => !exists(nsisApp), removalMs)) {
        return { removed: false, detail: `exited 0, but ${nsisApp} is still there` }
    }
    return { removed: true, detail: 'removed' }
}

function smoke(args, wrap = []) {
    const [command, ...prefix] = wrap.length > 0 ? wrap : [process.execPath]
    const harness = wrap.length > 0 ? [...prefix, process.execPath, HARNESS] : [HARNESS]
    return ok(run(command, [...harness, ...args]))
}

function linux({ bundle, target, version, evidence }) {
    if (
        !ok(
            run('sudo', [
                'apt-get',
                'install',
                '-y',
                '--no-install-recommends',
                'xvfb',
                'xauth',
                'x11-utils',
                'imagemagick',
                'dbus',
                'dbus-x11',
                'squashfs-tools',
            ]),
        )
    ) {
        console.log('[FAIL] could not install the smoke tools')
        return false
    }
    const deb = findIn(join(bundle, 'deb'), /\.deb$/)
    const appimage = findIn(join(bundle, 'appimage'), /\.AppImage$/)
    if (!deb || !appimage) {
        console.log(`[FAIL] .deb or AppImage missing in ${bundle}`)
        return false
    }
    chmodSync(appimage, 0o755)
    const imagePath = resolve(appimage)
    const offset = run(imagePath, ['--appimage-offset'], {
        stdio: ['ignore', 'pipe', 'inherit'],
        timeout: 10_000,
    })
    if (
        !ok(offset) ||
        !ok(run('bash', ['scripts/check-appimage-permissions.sh', imagePath, offset.stdout.trim()]))
    ) {
        console.log('[FAIL] could not verify the packaged AppImage permissions')
        return false
    }
    // A virtual display and its own session bus per run; the window check must pass.
    const wrap = ['dbus-run-session', '--', 'xvfb-run', '-a', '-s', '-screen 0 1280x800x24']
    const common = [
        '--expect-version',
        version,
        '--expect-target',
        target,
        '--evidence',
        evidence,
        '--require-screenshot',
    ]
    let passed = true
    if (!ok(run('sudo', ['apt-get', 'install', '-y', resolve(deb)]))) {
        console.log('[FAIL] the .deb did not install through apt')
        passed = false
    } else if (
        !smoke(
            ['--app', '/usr/bin/cannaguide-desktop', '--label', `${target}-deb`, ...common],
            wrap,
        )
    ) {
        passed = false
    }
    const appimageMode = existsSync('/dev/fuse') ? [] : ['--appimage']
    if (appimageMode.length) {
        console.log('[WARN] /dev/fuse unavailable; AppImage smoke uses extraction')
    }
    if (
        !smoke(
            ['--app', imagePath, ...appimageMode, '--label', `${target}-appimage`, ...common],
            wrap,
        )
    ) {
        passed = false
    }
    return passed
}

function macos({ bundle, target, version, evidence }) {
    const app = findIn(join(bundle, 'macos'), /\.app$/)
    const binary = app && appBinary(app)
    if (!binary) {
        console.log(`[FAIL] no .app with an executable in ${join(bundle, 'macos')}`)
        return false
    }
    const machine = spawnSync('uname', ['-m'], { encoding: 'utf8' }).stdout.trim()
    const rosettaWorks = () => ok(spawnSync('arch', ['-x86_64', '/usr/bin/true']))
    if (rosettaPlan({ target, machine, rosettaWorks: rosettaWorks() }) === 'install-rosetta') {
        console.log(`[INFO] Rosetta 2 missing; installing it to launch the ${target} build`)
        run('sudo', ['softwareupdate', '--install-rosetta', '--agree-to-license'])
        if (!rosettaWorks()) {
            console.log(
                `[FAIL] Rosetta 2 unavailable: the ${target} build cannot be launched, so it is not qualified`,
            )
            return false
        }
    }
    return smoke([
        '--app',
        binary,
        '--expect-version',
        version,
        '--expect-target',
        target,
        '--evidence',
        evidence,
        '--label',
        `${target}-app`,
    ])
}

/** Empties the app folders through the guard; false (with the reason) if any check fails. */
function resetWindowsProfile() {
    for (const base of [process.env.APPDATA, process.env.LOCALAPPDATA]) {
        const result = removeAppFolder(base)
        if (!result.removed) {
            console.log(`[FAIL] app folder under ${base} not reset: ${result.reason}`)
            return false
        }
    }
    return true
}

function writeUninstallEntries(file) {
    const keys = [
        'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
        'HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    ]
    const text = keys
        .map((key) => {
            const query = spawnSync('reg', ['query', key, '/s', '/f', 'CannaGuide'], {
                encoding: 'utf8',
            })
            return `== ${key}\n${query.stdout ?? ''}`
        })
        .join('\n')
    writeFileSync(file, text)
}

function windows({ bundle, target, version, evidence }) {
    const nsis = findIn(join(bundle, 'nsis'), /-setup\.exe$/)
    const msi = findIn(join(bundle, 'msi'), /\.msi$/)
    if (!nsis || !msi) {
        console.log(`[FAIL] NSIS or MSI installer missing in ${bundle}`)
        return false
    }
    const local = process.env.LOCALAPPDATA
    const common = ['--expect-version', version, '--expect-target', target, '--evidence', evidence]
    let passed = true

    // Each step needs the one before it: a failed install, uninstall or reset stops the
    // sequence, so nothing that this run did not install is launched or removed.
    if (!resetWindowsProfile()) return false
    const nsisRun = run(resolve(nsis), ['/S'])
    writeUninstallEntries(join(evidence, 'uninstall-after-nsis.txt'))
    if (!ok(nsisRun)) {
        console.log(`[FAIL] NSIS install exited ${nsisRun.status ?? nsisRun.error?.message}`)
        return false
    }
    const nsisApp = findInstalled([local, local && join(local, 'Programs')], PROGRAM)
    if (!nsisApp) {
        console.log(`[FAIL] NSIS install: ${PROGRAM} not found (see uninstall-after-nsis.txt)`)
        return false
    }
    if (!smoke(['--app', nsisApp, '--label', `${target}-nsis`, ...common])) passed = false

    // The MSI is tested on a clean machine: with an NSIS install present it reuses that
    // folder (Tauri's MSI looks the previous install location up), and the NSIS
    // uninstaller is qualified on the way. `_?=` makes it run in place and wait.
    const uninstall = uninstallNsis(nsisApp)
    if (!uninstall.removed) {
        console.log(`[FAIL] NSIS uninstall: ${uninstall.detail}`)
        return false
    }

    if (!resetWindowsProfile()) return false
    const msiLog = join(resolve(evidence), 'msi-install.log')
    // Only this run's log may name the install folder.
    rmSync(msiLog, { force: true })
    const msiRun = run('msiexec.exe', ['/i', resolve(msi), '/qn', '/norestart', '/l*v', msiLog])
    writeUninstallEntries(join(evidence, 'uninstall-after-msi.txt'))
    if (!ok(msiRun)) {
        console.log(`[FAIL] MSI install exited ${msiRun.status ?? msiRun.error?.message}`)
        return false
    }
    const installDir = msiInstallDir(readMsiLog(msiLog))
    const msiApp = installDir && join(installDir, PROGRAM)
    console.log(`[INFO] MSI INSTALLDIR: ${installDir ?? 'not in the log'}`)
    if (!msiApp || !existsSync(msiApp)) {
        console.log(
            `[FAIL] MSI install: ${PROGRAM} not at INSTALLDIR ${installDir} (see msi-install.log)`,
        )
        return false
    }
    if (!smoke(['--app', msiApp, '--label', `${target}-msi`, ...common])) passed = false
    return passed
}

export function main(argv = process.argv.slice(2)) {
    let values
    try {
        ;({ values } = parseArgs({
            args: argv,
            options: {
                target: { type: 'string' },
                'bundle-dir': { type: 'string' },
                evidence: { type: 'string', default: 'desktop-smoke' },
            },
            strict: true,
            allowPositionals: false,
        }))
        if (!values.target || !values['bundle-dir'])
            throw new Error('--target and --bundle-dir are required')
    } catch (error) {
        console.error(`[desktop-smoke-ci] ${error.message}`)
        return 2
    }
    // It installs system-wide and resets app folders: only on a fresh GitHub-hosted
    // machine. Locally, run scripts/desktop-smoke.mjs against an installed app.
    if (!isDisposableRunner()) {
        console.error(
            '[desktop-smoke-ci] refusing: this runs only on a GitHub-hosted runner (GITHUB_ACTIONS=true, RUNNER_ENVIRONMENT=github-hosted)',
        )
        return 2
    }
    const version = JSON.parse(
        readFileSync('apps/desktop/src-tauri/tauri.conf.json', 'utf8'),
    ).version
    mkdirSync(values.evidence, { recursive: true })
    const context = {
        bundle: values['bundle-dir'],
        target: values.target,
        version,
        evidence: values.evidence,
    }
    const byPlatform = { linux, darwin: macos, win32: windows }
    const platformRun = byPlatform[process.platform]
    if (!platformRun) {
        console.error(`[desktop-smoke-ci] no runtime smoke for ${process.platform}`)
        return 1
    }
    const passed = platformRun(context)
    console.log(`[desktop-smoke-ci] ${passed ? 'PASSED' : 'FAILED'} (${values.target}, ${version})`)
    return passed ? 0 : 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    process.exitCode = main()
}
