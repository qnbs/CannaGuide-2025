/**
 * Strict-lint the burndown scopes.
 *
 * Two modes:
 *
 *   node scripts/lint-scopes.mjs             full scopes -- what CI runs
 *   node scripts/lint-scopes.mjs --changed   only files this branch touched
 *
 * The full run lints every file under `strictScopes` (hooks, components/common, services,
 * stores). That is thousands of files and takes minutes -- fine in CI, far too slow for a
 * git hook. A pre-push gate that costs 7 minutes is a gate people bypass with --no-verify,
 * and then nothing is checked at all. `--changed` intersects the scopes with the branch
 * diff, so the hook lints what you actually wrote and skips entirely when you touched
 * nothing in a strict scope.
 *
 * CI keeps the full run, so coverage is not lost.
 */
import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const CONFIG_PATH = new URL('./lint-burndown.config.json', import.meta.url)
const TAG = '[lint:scopes]'

function loadConfig() {
    const raw = readFileSync(CONFIG_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    if (!parsed.strictScopes || !Array.isArray(parsed.strictScopes)) {
        throw new Error('Invalid lint-burndown config: strictScopes must be an array.')
    }
    return parsed
}

/**
 * Match a path against a scope glob of the shape `dir/**\/*.ext`.
 * Deliberately tiny: the config only ever uses that one shape, and pulling in a glob
 * library for it would be the heavier option.
 */
function matchesScope(file, scope) {
    const marker = '**/'
    const index = scope.indexOf(marker)
    if (index === -1) return file === scope

    const prefix = scope.slice(0, index)
    const suffix = scope.slice(index + marker.length).replace('*', '')
    return file.startsWith(prefix) && file.endsWith(suffix)
}

function changedFiles() {
    // Merge-base, not origin/main's tip: otherwise commits landing on main while the branch
    // is open would widen this branch's scope for no reason.
    const base = spawnSync('git', ['merge-base', 'origin/main', 'HEAD'], { encoding: 'utf8' })
    if (base.status !== 0) {
        console.log(`${TAG} no merge-base with origin/main -- falling back to the full run.`)
        return null
    }

    const diff = spawnSync('git', ['diff', '--name-only', `${base.stdout.trim()}...HEAD`], {
        encoding: 'utf8',
    })
    if (diff.status !== 0) return null

    return (diff.stdout ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((file) => existsSync(file)) // a deleted file cannot be linted
}

function main() {
    const onlyChanged = process.argv.includes('--changed')
    const { strictScopes } = loadConfig()

    if (strictScopes.length === 0) {
        console.log(`${TAG} No strict scopes configured. Skipping.`)
        process.exit(0)
    }

    let targets = strictScopes

    if (onlyChanged) {
        const changed = changedFiles()
        if (changed !== null) {
            targets = changed.filter((file) =>
                strictScopes.some((scope) => matchesScope(file, scope)),
            )

            if (targets.length === 0) {
                console.log(`${TAG} No changed file falls in a strict scope. Skipping.`)
                process.exit(0)
            }

            console.log(`${TAG} Strict lint for ${targets.length} changed file(s).`)
        }
    }

    if (targets === strictScopes) {
        console.log(`${TAG} Running strict lint for ${strictScopes.length} scope(s).`)
    }

    const result = spawnSync(
        'pnpm',
        ['exec', 'eslint', '--report-unused-disable-directives', '--max-warnings', '0', ...targets],
        {
            stdio: 'inherit',
            shell: process.platform === 'win32',
        },
    )

    process.exit(result.status ?? 1)
}

main()
