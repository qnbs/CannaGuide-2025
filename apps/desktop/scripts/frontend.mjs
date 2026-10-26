/** Build the shared web app for Tauri's root URL, then verify embedded entry assets. */
import { readFileSync, realpathSync, statSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { spawnSync } from 'node:child_process'
import console from 'node:console'
import process from 'node:process'
import { fileURLToPath, pathToFileURL, URL } from 'node:url'

const repository = fileURLToPath(new URL('../../../', import.meta.url))
const configPath = resolve(repository, 'apps/desktop/src-tauri/tauri.conf.json')
const webDist = resolve(repository, 'apps/web/dist')

export function resolveFrontendDist(configuration, expectedDist) {
    const config = JSON.parse(readFileSync(configuration, 'utf8'))
    const dist = resolve(dirname(configuration), config.build.frontendDist)
    if (dist !== resolve(expectedDist)) {
        throw new Error(`frontendDist resolves to ${dist}; expected ${resolve(expectedDist)}`)
    }
    return dist
}

function isInside(directory, file) {
    const path = relative(directory, file)
    return path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path)
}

function findTagEnd(html, start) {
    let quote = null
    for (let index = start + 1; index < html.length; index += 1) {
        const character = html[index]
        if (quote) {
            if (character === quote) quote = null
        } else if (character === '"' || character === "'") {
            quote = character
        } else if (character === '>') {
            return index
        }
    }
    return -1
}

/** Yield relevant tags from actual markup; comments are skipped without rewriting HTML. */
function* entryTags(html) {
    let cursor = 0
    while (cursor < html.length) {
        const start = html.indexOf('<', cursor)
        if (start < 0) return
        if (html.startsWith('<!--', start)) {
            const end = html.indexOf('-->', start + 4)
            if (end < 0) throw new Error('Unterminated HTML comment in frontend index')
            cursor = end + 3
            continue
        }

        const end = findTagEnd(html, start)
        if (end < 0) throw new Error('Unterminated HTML tag in frontend index')
        const tag = html.slice(start, end + 1)
        const name = /^<(script|link)\b/i.exec(tag)?.[1]?.toLowerCase()
        cursor = end + 1
        if (!name) continue

        yield { name, tag }
        if (name === 'script') {
            const close = /<\/script\s*>/gi
            close.lastIndex = cursor
            const match = close.exec(html)
            if (!match) throw new Error('Unterminated script element in frontend index')
            cursor = close.lastIndex
        }
    }
}

/** Checks Vite's generated, quoted script/link attributes; never fetches remote content. */
export function verifyFrontendAssets(configuration, expectedDist) {
    const dist = realpathSync(resolveFrontendDist(configuration, expectedDist))
    const index = resolve(dist, 'index.html')
    if (!isInside(dist, realpathSync(index))) throw new Error('index.html escapes frontendDist')
    const html = readFileSync(index, 'utf8')
    const assets = new Set()
    let moduleEntries = 0
    for (const { name, tag } of entryTags(html)) {
        const attributes = new Map(
            Array.from(tag.matchAll(/\b([\w-]+)\s*=\s*(["'])(.*?)\2/g), (attribute) => [
                attribute[1].toLowerCase(),
                attribute[3],
            ]),
        )
        const script = name === 'script'
        const resourceLink = (attributes.get('rel') ?? '')
            .toLowerCase()
            .split(/\s+/)
            .some((rel) =>
                ['stylesheet', 'modulepreload', 'manifest', 'icon', 'apple-touch-icon'].includes(
                    rel,
                ),
            )
        if (!script && !resourceLink) continue
        const source = attributes.get(script ? 'src' : 'href')
        if (!source) {
            if (resourceLink || attributes.has('src')) {
                throw new Error('Embedded entry asset has an empty source')
            }
            continue
        }
        if (script && attributes.get('type') === 'module') moduleEntries += 1
        if (!source.startsWith('/') || source.startsWith('//') || source.includes('\\')) {
            throw new Error(`Embedded entry asset must be local and root-relative: ${source}`)
        }
        const url = new URL(source, 'https://desktop.invalid/')
        if (url.origin !== 'https://desktop.invalid') {
            throw new Error(`Embedded entry asset must be local: ${source}`)
        }
        const pathname = decodeURIComponent(url.pathname)
        if (pathname.includes('\\')) {
            throw new Error(`Embedded entry asset contains a path separator escape: ${source}`)
        }
        const path = resolve(dist, `.${pathname}`)
        if (!isInside(dist, path) || !isInside(dist, realpathSync(path))) {
            throw new Error(`Embedded entry asset escapes frontendDist: ${source}`)
        }
        const file = statSync(path)
        if (!file.isFile() || file.size === 0)
            throw new Error(`Empty/non-file entry asset: ${source}`)
        assets.add(path)
    }
    if (moduleEntries === 0) throw new Error('Frontend index.html has no external module entry')
    return { dist, assets: assets.size }
}

function main() {
    const mode = process.argv[2]
    if (!['build', 'dev', 'check'].includes(mode)) {
        throw new Error('Usage: node scripts/frontend.mjs build|dev|check')
    }
    resolveFrontendDist(configPath, webDist)
    if (mode !== 'check') {
        // Fixed arguments only. Windows needs its Corepack .cmd shim via the command shell.
        const result = spawnSync('corepack', ['pnpm', '--filter', '@cannaguide/web', mode], {
            cwd: repository,
            env: { ...process.env, BUILD_BASE_PATH: '/' },
            stdio: 'inherit',
            shell: process.platform === 'win32',
        })
        if (result.error) throw result.error
        if (result.signal || result.status !== 0) {
            process.exitCode = result.status ?? 1
            return
        }
        if (mode === 'build') {
            const prune = spawnSync(
                process.execPath,
                [resolve(repository, 'scripts/prune-bundled-ort-wasm.mjs')],
                { cwd: repository, stdio: 'inherit' },
            )
            if (prune.error) throw prune.error
            if (prune.signal || prune.status !== 0) {
                process.exitCode = prune.status ?? 1
                return
            }
        }
    }
    if (mode !== 'dev') {
        const result = verifyFrontendAssets(configPath, webDist)
        console.log(
            `Desktop frontend verified: ${result.assets} local entry assets in ${result.dist}`,
        )
    }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    try {
        main()
    } catch (error) {
        console.error(`[desktop frontend] ${error.message}`)
        process.exitCode = 1
    }
}
