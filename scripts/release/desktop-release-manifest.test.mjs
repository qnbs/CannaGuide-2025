import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import {
    assetName,
    DESKTOP_TARGETS,
    isPrerelease,
    main,
    planDesktopRelease,
    prereleaseNotice,
} from './desktop-release-manifest.mjs'
import { makeSigner } from './test-signer.mjs'

const VERSION = '1.12.0'
const TAG = 'v1.12.0'

/** Bundle files as tauri-action leaves them (real names, spaces included). */
const LAYOUT = {
    'x86_64-pc-windows-msvc': {
        'msi/CannaGuide 2025_VER_x64_en-US.msi': true,
        'nsis/CannaGuide 2025_VER_x64-setup.exe': true,
    },
    'x86_64-unknown-linux-gnu': {
        'appimage/CannaGuide 2025_VER_amd64.AppImage': true,
        'deb/CannaGuide 2025_VER_amd64.deb': false,
    },
    'aarch64-apple-darwin': {
        'dmg/CannaGuide 2025_VER_aarch64.dmg': false,
        'macos/CannaGuide 2025.app.tar.gz': true,
    },
    'x86_64-apple-darwin': {
        'dmg/CannaGuide 2025_VER_x64.dmg': false,
        'macos/CannaGuide 2025.app.tar.gz': true,
    },
}

/** Writes the four build artifacts; files marked true get a `.sig` next to them. */
function makeArtifacts(t, { version = VERSION, signer = makeSigner(), mutate } = {}) {
    const root = mkdtempSync(path.join(tmpdir(), 'cannaguide-desktop-release-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    for (const [target, files] of Object.entries(LAYOUT)) {
        for (const [relative, signed] of Object.entries(files)) {
            const file = path.join(
                root,
                'artifacts',
                `desktop-${target}`,
                relative.replace('VER', version),
            )
            mkdirSync(path.dirname(file), { recursive: true })
            const bytes = Buffer.from(`${target}:${relative}`)
            writeFileSync(file, bytes)
            if (signed) writeFileSync(`${file}.sig`, signer.signFile(bytes))
        }
    }
    mutate?.(path.join(root, 'artifacts'))
    return { root, artifactsDir: path.join(root, 'artifacts'), pubkey: signer.pubkey }
}

const plan = (artifactsDir, pubkey, version = VERSION) =>
    planDesktopRelease({
        artifactsDir,
        version,
        tag: `v${version}`,
        repo: 'qnbs/CannaGuide-2025',
        pubkey,
        notes: 'n',
        now: 'T',
    })

test('a complete, signed build produces normalized assets and latest.json for all four platforms', (t) => {
    const { artifactsDir, pubkey } = makeArtifacts(t)
    const result = plan(artifactsDir, pubkey)

    assert.deepEqual(result.problems, [])
    assert.deepEqual(Object.keys(result.latest.platforms).sort(), [
        'darwin-aarch64',
        'darwin-x86_64',
        'linux-x86_64',
        'windows-x86_64',
    ])
    assert.equal(result.latest.version, VERSION)
    assert.equal(
        result.latest.platforms['windows-x86_64'].url,
        `https://github.com/qnbs/CannaGuide-2025/releases/download/${TAG}/CannaGuide-2025_${VERSION}_x64-setup.exe`,
    )
    assert.equal(
        result.latest.platforms['darwin-aarch64'].url,
        `https://github.com/qnbs/CannaGuide-2025/releases/download/${TAG}/CannaGuide-2025_${VERSION}_aarch64.app.tar.gz`,
    )
    const names = result.assets.map(({ name }) => name)
    assert.ok(names.every((name) => !name.includes(' ')))
    assert.ok(names.includes(`CannaGuide-2025_${VERSION}_x64.app.tar.gz.sig`))
    assert.equal(new Set(names).size, names.length)
})

test('the CLI writes the assets, latest.json and SHA256SUMS', (t) => {
    const { root, artifactsDir, pubkey } = makeArtifacts(t)
    const config = path.join(root, 'tauri.conf.json')
    writeFileSync(config, JSON.stringify({ plugins: { updater: { pubkey } } }))
    const out = path.join(root, 'out')

    assert.equal(
        main([
            '--artifacts',
            artifactsDir,
            '--out',
            out,
            '--version',
            VERSION,
            '--tag',
            TAG,
            '--tauri-config',
            config,
        ]),
        0,
    )

    const latest = JSON.parse(readFileSync(path.join(out, 'latest.json'), 'utf8'))
    assert.equal(Object.keys(latest.platforms).length, 4)
    const sums = readFileSync(path.join(out, 'SHA256SUMS'), 'utf8').trim().split('\n')
    assert.ok(sums.some((line) => line.endsWith('  latest.json')))
    assert.ok(sums.every((line) => /^[0-9a-f]{64} {2}\S+$/.test(line)))
})

test('a missing target, installer or updater signature fails the release', (t) => {
    const cases = [
        [
            'no macOS arm64 build',
            (dir) => rmSync(path.join(dir, 'desktop-aarch64-apple-darwin'), { recursive: true }),
            /aarch64-apple-darwin: no build artifact/,
        ],
        [
            'no deb',
            (dir) =>
                rmSync(path.join(dir, 'desktop-x86_64-unknown-linux-gnu', 'deb'), {
                    recursive: true,
                }),
            /missing installer matching/,
        ],
        [
            'unsigned NSIS',
            (dir) =>
                rmSync(
                    path.join(
                        dir,
                        'desktop-x86_64-pc-windows-msvc',
                        'nsis',
                        `CannaGuide 2025_${VERSION}_x64-setup.exe.sig`,
                    ),
                ),
            /has no signature/,
        ],
    ]
    for (const [label, mutate, expected] of cases) {
        const { artifactsDir, pubkey } = makeArtifacts(t, { mutate })
        const { problems } = plan(artifactsDir, pubkey)
        assert.ok(
            problems.some((problem) => expected.test(problem)),
            `${label}: ${problems.join('; ')}`,
        )
    }
})

test('a tampered bundle or a signature by another key fails the release', (t) => {
    const tampered = makeArtifacts(t, {
        mutate: (dir) =>
            writeFileSync(
                path.join(
                    dir,
                    'desktop-x86_64-unknown-linux-gnu',
                    'appimage',
                    `CannaGuide 2025_${VERSION}_amd64.AppImage`,
                ),
                'changed',
            ),
    })
    assert.ok(
        plan(tampered.artifactsDir, tampered.pubkey).problems.some((p) =>
            /does not match the file/.test(p),
        ),
    )

    const foreign = makeArtifacts(t)
    assert.ok(
        plan(foreign.artifactsDir, makeSigner().pubkey).problems.some((p) =>
            /different key id/.test(p),
        ),
    )
})

test('installers built with another version than the release fail it (the 0.1.0 drift)', (t) => {
    const { artifactsDir, pubkey } = makeArtifacts(t, { version: '0.1.0' })
    const { problems } = plan(artifactsDir, pubkey, VERSION)
    assert.ok(problems.some((problem) => /does not carry version 1\.12\.0/.test(problem)))
})

test('asset names are normalized and the macOS bundles become unique per architecture', () => {
    assert.equal(
        assetName('/x/msi/CannaGuide 2025_1.12.0_x64_en-US.msi', '1.12.0', 'x64'),
        'CannaGuide-2025_1.12.0_x64_en-US.msi',
    )
    const arm = assetName(
        '/x/macos/CannaGuide 2025.app.tar.gz',
        '1.12.0',
        DESKTOP_TARGETS['aarch64-apple-darwin'].arch,
    )
    const intel = assetName(
        '/x/macos/CannaGuide 2025.app.tar.gz',
        '1.12.0',
        DESKTOP_TARGETS['x86_64-apple-darwin'].arch,
    )
    assert.notEqual(arm, intel)
})

test('usage errors exit 2', () => {
    const quiet = console.error
    console.error = () => undefined
    try {
        assert.equal(main(['--artifacts', 'a']), 2)
        assert.equal(
            main(['--artifacts', 'a', '--out', 'b', '--version', '1.12', '--tag', 'v1.12']),
            2,
        )
        assert.equal(
            main(['--artifacts', 'a', '--out', 'b', '--version', VERSION, '--tag', 'v9.9.9']),
            2,
        )
    } finally {
        console.error = quiet
    }
})

test('every semver pre-release is a prerelease, stable versions are not', () => {
    for (const version of [
        '1.12.0-rc.1',
        '1.12.0-beta',
        '1.12.0-alpha.2',
        '1.12.0-1',
        '1.12.0-preview.3',
    ]) {
        assert.equal(isPrerelease(version), true, version)
        assert.match(prereleaseNotice(version), /releases\/latest never serves/, version)
    }
    for (const version of ['1.12.0', '2.0.0', 'v1.12.0-rc.1', '1.12']) {
        assert.equal(isPrerelease(version), false, version)
        assert.equal(prereleaseNotice(version), undefined, version)
    }
})

test('the CLI warns for a prerelease and stays quiet for a stable release', (t) => {
    for (const [version, warns] of [
        ['1.12.0-rc.1', true],
        ['1.12.0', false],
    ]) {
        const { root, artifactsDir, pubkey } = makeArtifacts(t, { version })
        const config = path.join(root, 'tauri.conf.json')
        writeFileSync(config, JSON.stringify({ plugins: { updater: { pubkey } } }))
        const warnings = []
        const saved = [console.warn, console.log]
        console.warn = (line) => warnings.push(line)
        console.log = () => undefined
        try {
            const args = ['--artifacts', artifactsDir, '--out', path.join(root, 'out')]
            args.push('--version', version, '--tag', `v${version}`, '--tauri-config', config)
            assert.equal(main(args), 0, version)
        } finally {
            ;[console.warn, console.log] = saved
        }
        assert.equal(warnings.length, warns ? 1 : 0, version)
        if (warns) assert.match(warnings[0], /^\[WARN\] 1\.12\.0-rc\.1 is a prerelease/)
    }
})

test('Release Publish marks every pre-release tag as a GitHub prerelease', () => {
    // Runs the workflow's own shell snippet: a tag that became the stable release would
    // be what releases/latest -- the updater endpoint -- serves to every installed app.
    const workflow = readFileSync(
        path.join(import.meta.dirname, '../../.github/workflows/release-publish.yml'),
        'utf8',
    )
    const start = workflow.indexOf('PRE_FLAG=""')
    const end = workflow.indexOf('esac', start)
    assert.ok(start !== -1 && end !== -1, 'prerelease flag block not found')
    const snippet = `${workflow.slice(start, end + 'esac'.length)}\nprintf %s "$PRE_FLAG"`
    const flag = (tag) =>
        execFileSync('bash', ['-c', snippet], { env: { TAG: tag }, encoding: 'utf8' })
    for (const tag of ['v1.12.0-rc.1', 'v1.12.0-beta', 'v1.12.0-1', 'v1.12.0-preview.3']) {
        assert.equal(flag(tag), '--prerelease', tag)
    }
    for (const tag of ['v1.12.0', 'v2.0.0']) assert.equal(flag(tag), '', tag)
})
