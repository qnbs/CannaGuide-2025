#!/usr/bin/env node
/**
 * Builds and checks the desktop part of a release before anything is published.
 *
 * Input: the downloaded `desktop-<target>` build artifacts. Output, into --out:
 *   - every installer and updater bundle under a normalized name (no spaces; the
 *     macOS app bundles also get the version and architecture, which Tauri leaves out),
 *   - the matching `.sig` files,
 *   - `latest.json` for tauri-plugin-updater (URLs on the release download path),
 *   - `SHA256SUMS` over all of the above.
 *
 * It fails closed (exit 1, nothing usable written) when a target is missing, a required
 * installer or updater bundle is missing, an updater signature is missing or does not
 * verify against the tauri.conf.json pubkey, an installer carries another version than
 * the release, or two assets would get the same name. Exit 2 is a usage error.
 * A prerelease version passes with a warning: the updater never offers it (see
 * prereleaseNotice and docs/release-process.md).
 *
 * Usage: node scripts/release/desktop-release-manifest.mjs --artifacts <dir> --out <dir>
 *          --version 1.12.0 --tag v1.12.0 [--repo owner/name]
 *          [--tauri-config apps/desktop/src-tauri/tauri.conf.json] [--notes <text>]
 */
import { createHash } from 'node:crypto'
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    statSync,
    writeFileSync,
} from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import { verifyMinisign } from './minisign.mjs'

/** The four supported targets: required installers and the bundle the updater installs. */
export const DESKTOP_TARGETS = {
    'x86_64-pc-windows-msvc': {
        platform: 'windows-x86_64',
        arch: 'x64',
        installers: [/\.msi$/, /-setup\.exe$/],
        updater: /-setup\.exe$/,
    },
    'x86_64-unknown-linux-gnu': {
        platform: 'linux-x86_64',
        arch: 'amd64',
        installers: [/\.AppImage$/, /\.deb$/],
        updater: /\.AppImage$/,
    },
    'aarch64-apple-darwin': {
        platform: 'darwin-aarch64',
        arch: 'aarch64',
        installers: [/\.dmg$/],
        updater: /\.app\.tar\.gz$/,
    },
    'x86_64-apple-darwin': {
        platform: 'darwin-x86_64',
        arch: 'x64',
        installers: [/\.dmg$/],
        updater: /\.app\.tar\.gz$/,
    },
}

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

/** A version with a semver pre-release part (1.12.0-rc.1, 1.12.0-1, ...). */
export const isPrerelease = (version) => SEMVER.test(version) && version.includes('-')

/**
 * Prereleases are GitHub prereleases, and the updater endpoint
 * (releases/latest/download/latest.json) never resolves to one. So no installed app is
 * offered a prerelease, and a prerelease install moves to the next stable release once
 * that is strictly newer (the plugin's default comparator; 1.12.0 > 1.12.0-rc.1).
 */
export const prereleaseNotice = (version) =>
    isPrerelease(version)
        ? `${version} is a prerelease: its latest.json is attached to a GitHub prerelease, which releases/latest never serves, so no installed app is offered this build. Testers install it by hand.`
        : undefined
const SHIPPED = [/\.msi$/, /\.exe$/, /\.AppImage$/, /\.deb$/, /\.rpm$/, /\.dmg$/, /\.app\.tar\.gz$/]

const filesUnder = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name)
        return entry.isDirectory() ? filesUnder(full) : [full]
    })

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')

/** The asset name a file is published under. */
export const assetName = (file, version, arch) => {
    const base = path.basename(file)
    if (base.endsWith('.app.tar.gz')) {
        const stem = base.slice(0, -'.app.tar.gz'.length)
        return `${stem.replaceAll(' ', '-')}_${version}_${arch}.app.tar.gz`
    }
    return base.replaceAll(' ', '-')
}

/**
 * Checks the artifacts and returns { problems, assets, latest }. `assets` lists
 * { source, name } pairs (signatures included); nothing is written here.
 */
export const planDesktopRelease = ({ artifactsDir, version, tag, repo, pubkey, notes, now }) => {
    const problems = []
    const assets = []
    const platforms = {}
    const baseUrl = `https://github.com/${repo}/releases/download/${tag}`

    for (const [target, spec] of Object.entries(DESKTOP_TARGETS)) {
        const dir = path.join(artifactsDir, `desktop-${target}`)
        if (!existsSync(dir) || !statSync(dir).isDirectory()) {
            problems.push(`${target}: no build artifact (desktop-${target})`)
            continue
        }
        const files = filesUnder(dir)
        const shipped = files.filter((file) => SHIPPED.some((pattern) => pattern.test(file)))
        for (const pattern of spec.installers) {
            if (!shipped.some((file) => pattern.test(file))) {
                problems.push(`${target}: missing installer matching ${pattern}`)
            }
        }
        for (const file of shipped) {
            const name = assetName(file, version, spec.arch)
            if (!name.includes(`_${version}_`)) {
                problems.push(`${target}: ${path.basename(file)} does not carry version ${version}`)
            }
            assets.push({ source: file, name })
            if (existsSync(`${file}.sig`))
                assets.push({ source: `${file}.sig`, name: `${name}.sig` })
        }
        const updater = shipped.filter((file) => spec.updater.test(file))
        if (updater.length !== 1) {
            problems.push(
                `${target}: expected one updater bundle matching ${spec.updater}, found ${updater.length}`,
            )
            continue
        }
        const [bundle] = updater
        if (!existsSync(`${bundle}.sig`)) {
            problems.push(`${target}: updater bundle ${path.basename(bundle)} has no signature`)
            continue
        }
        const signature = readFileSync(`${bundle}.sig`, 'utf8').trim()
        const verified = verifyMinisign(readFileSync(bundle), signature, pubkey)
        if (!verified.ok) {
            problems.push(
                `${target}: updater signature of ${path.basename(bundle)} ${verified.reason}`,
            )
            continue
        }
        platforms[spec.platform] = {
            signature,
            url: `${baseUrl}/${encodeURIComponent(assetName(bundle, version, spec.arch))}`,
        }
    }

    const seen = new Set()
    for (const { name } of assets) {
        if (seen.has(name)) problems.push(`two assets would both be named ${name}`)
        seen.add(name)
    }
    const latest = { version, notes, pub_date: now, platforms }
    return { problems, assets, latest }
}

const parseArgs = (argv) => {
    const options = {
        repo: 'qnbs/CannaGuide-2025',
        tauriConfig: 'apps/desktop/src-tauri/tauri.conf.json',
    }
    const keys = {
        '--artifacts': 'artifacts',
        '--out': 'out',
        '--version': 'version',
        '--tag': 'tag',
        '--repo': 'repo',
        '--tauri-config': 'tauriConfig',
        '--notes': 'notes',
    }
    for (let index = 0; index < argv.length; index += 2) {
        const key = keys[argv[index]]
        if (!key || argv[index + 1] === undefined)
            throw new Error(`unexpected argument: ${argv[index]}`)
        options[key] = argv[index + 1]
    }
    for (const required of ['artifacts', 'out', 'version', 'tag']) {
        if (!options[required]) throw new Error(`--${required} is required`)
    }
    if (!SEMVER.test(options.version))
        throw new Error(`--version is not semver: ${options.version}`)
    if (options.tag !== `v${options.version}`) throw new Error(`--tag must be v${options.version}`)
    return options
}

export function main(argv = process.argv.slice(2)) {
    let options
    try {
        options = parseArgs(argv)
    } catch (error) {
        console.error(`[desktop-release-manifest] ${error.message}`)
        return 2
    }
    const pubkey = JSON.parse(readFileSync(options.tauriConfig, 'utf8'))?.plugins?.updater?.pubkey
    if (typeof pubkey !== 'string' || pubkey === '') {
        console.error('[desktop-release-manifest] no updater pubkey in the Tauri config')
        return 1
    }
    const plan = planDesktopRelease({
        artifactsDir: options.artifacts,
        version: options.version,
        tag: options.tag,
        repo: options.repo,
        pubkey,
        notes: options.notes ?? `CannaGuide ${options.tag}`,
        now: new Date().toISOString(),
    })
    if (plan.problems.length > 0) {
        for (const problem of plan.problems) console.error(`[FAIL] ${problem}`)
        return 1
    }
    mkdirSync(options.out, { recursive: true })
    for (const { source, name } of plan.assets) copyFileSync(source, path.join(options.out, name))
    writeFileSync(
        path.join(options.out, 'latest.json'),
        `${JSON.stringify(plan.latest, null, 2)}\n`,
    )
    const names = [...plan.assets.map(({ name }) => name), 'latest.json'].sort()
    const sums = names.map((name) => `${sha256(path.join(options.out, name))}  ${name}`)
    writeFileSync(path.join(options.out, 'SHA256SUMS'), `${sums.join('\n')}\n`)
    const notice = prereleaseNotice(options.version)
    if (notice) console.warn(`[WARN] ${notice}`)
    console.log(
        `[OK] ${plan.assets.length} desktop assets, ${Object.keys(plan.latest.platforms).length} updater platforms, latest.json and SHA256SUMS in ${options.out}`,
    )
    return 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    process.exitCode = main()
}
